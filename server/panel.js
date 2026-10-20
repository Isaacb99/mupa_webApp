// El panel de administración, montado en /administracion (plan 2.4, punto 5), ANTES de las redirecciones públicas.
// Es una SPA aparte (panel/, con su Vite: vite.panel.config.js) que el build deja en dist/panel. En orden:
// - en TODA respuesta: la CSP del panel (sin terceros), X-Robots-Tag: noindex (también con el host mupa.ar) y
//   no-store, salvo en /administracion/assets;
// - barras repetidas o invertidas (/administracion//api/x): 301 a la ruta colapsada en GET y HEAD, 404 en JSON en los
//   demás métodos, así nada esquiva el router de la API (ni su CSRF ni sus límites);
// - /administracion/assets: los archivos con hash de dist/panel/assets, un año e immutable, y 404 si falta. Va ANTES
//   del no-store: send solo pone su Cache-Control si la respuesta todavía no tiene uno;
// - /administracion/api/…: la API, siempre en JSON (CSRF por origen, express.json con tope, límites, sesión, rol y
//   validación; lo que no existe, 404 en JSON; sin base, 503 en JSON);
// - todo otro GET (y HEAD) de /administracion o /administracion/…: dist/panel/index.html con no-store; las rutas del
//   panel (/administracion/usuarios, /administracion/ingresar…) las resuelve el router del navegador
//   (panel/src/rutas.jsx). El index.html se lee una vez, al armar la app; si no está (un build sin el panel), esas
//   rutas dan 503 con una página simple y el log lo dice al arrancar ("panel_sin_build").
// En desarrollo (npm run dev, server/dev.js) el Vite del panel va adentro, en middlewareMode: sus módulos
// (/administracion/src/…, /administracion/@vite/client…) después de la API, el index.html pasado por Vite en cada
// pedido (recarga en caliente) y la CSP con lo que necesita Vite. Su websocket de HMR escucha en /administracion/, en
// el mismo puerto: no choca con el del sitio, que escucha en /.
// Nunca carga analitica.js ni UserWay (plan 9).
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import express from 'express'
import { crearApi } from './api/indice.js'
import { paginaDeError } from './errores.js'
import { log } from './log.js'
import { consultaDe, rutaSinBarrasDobles } from './normalizar.js'
import { cspPanel } from './seguridad.js'

/** La página del panel desde el build: dist/panel/index.html, leído una sola vez. */
function paginaDelBuild(dirBuild) {
  const archivo = resolve(dirBuild, 'panel', 'index.html')
  let html = null
  try {
    html = readFileSync(archivo, 'utf8')
  } catch (err) {
    log('aviso', 'panel_sin_build', { mensaje: `no está ${archivo}: npm run build arma el panel`, codigo: err.code })
  }
  return async () => html
}

/**
 * El Vite del panel adentro del router (solo desarrollo). Express le saca /administracion a req.url al entrar al
 * router; Vite lo espera entero (su base es /administracion/), así que se le da la URL original y se restaura si Vite
 * no atiende el pedido (si no, el router de Express sumaría el prefijo dos veces).
 * @param {import('vite').ViteDevServer} vite
 */
function middlewaresDeVite(vite) {
  return function moduloDelPanel(req, res, next) {
    const url = req.url
    req.url = req.originalUrl
    vite.middlewares(req, res, (err) => {
      req.url = url
      next(err)
    })
  }
}

/** @param {import('vite').ViteDevServer} vite */
function paginaDeVite(vite, raiz) {
  return async (req) => vite.transformIndexHtml(req.originalUrl, await readFile(resolve(raiz, 'index.html'), 'utf8'))
}

/**
 * @param {object} opciones
 * @param {string} opciones.dirBuild
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {import('sequelize').Sequelize | null} [opciones.sequelize]  null: sin base (la API responde 503)
 * @param {ReturnType<import('./tareas.js').crearRegistroDeTareas> | null} [opciones.registroTareas]
 * @param {ReturnType<import('./fotos/almacen.js').crearAlmacen> | null} [opciones.almacen]  el de las fotos (el
 *   mismo que sirve /fotos, server/app.js)
 * @param {import('vite').ViteDevServer | null} [opciones.vite]  el Vite del panel (solo server/dev.js)
 * @param {ReturnType<import('./correo.js').crearCorreo> | null} [opciones.correo]  el correo del formulario de contacto
 *   (el aviso del Inicio, E4.9)
 */
export function crearPanel({
  dirBuild,
  config,
  sequelize = null,
  registroTareas = null,
  almacen = null,
  vite = null,
  correo = null,
}) {
  const panel = express.Router()
  panel.use(cspPanel({ desarrollo: Boolean(vite) }))
  panel.use(function barrasDelPanel(req, res, next) {
    // req.baseUrl + req.path: solo la ruta, nunca el request-target entero (ver server/normalizar.js).
    const ruta = req.baseUrl + req.path
    const colapsada = rutaSinBarrasDobles(ruta)
    if (colapsada === ruta) return next()
    res.set('Cache-Control', 'no-store')
    if (req.method === 'GET' || req.method === 'HEAD') return res.redirect(301, colapsada + consultaDe(req.originalUrl))
    res.status(404).json({ error: 'No existe esa ruta de la API.' })
  })
  if (!vite) {
    panel.use(
      '/assets',
      express.static(resolve(dirBuild, 'panel', 'assets'), {
        immutable: true,
        maxAge: '1y',
        fallthrough: false,
        index: false,
        redirect: false,
      }),
    )
  }
  panel.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  panel.use('/api', crearApi({ config, sequelize, registroTareas, almacen, correo }))
  if (vite) panel.use(middlewaresDeVite(vite))
  const pagina = vite ? paginaDeVite(vite, vite.config.root) : paginaDelBuild(dirBuild)
  panel.get('/{*resto}', async (req, res) => {
    const html = await pagina(req)
    if (html == null) return res.status(503).type('html').send(paginaDeError(503))
    res.type('html').send(html)
  })
  panel.use((req, res) => {
    res.status(404).type('text').send('No encontrado.')
  })
  return panel
}
