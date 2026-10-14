// El panel de administración, montado en /administracion (plan 2.4, punto 5), ANTES de las redirecciones públicas.
// El panel en sí (la SPA con su entrada de Vite, dist/panel) llega con E2.1; hasta entonces responde una página mínima
// "Panel en construcción". Su API (server/api/indice.js) está desde E1. Lo que va a tener siempre:
// - en TODA respuesta: la CSP del panel (sin terceros), X-Robots-Tag: noindex (también con el host mupa.ar) y
//   no-store, salvo en /administracion/assets;
// - barras repetidas o invertidas (/administracion//api/x): 301 a la ruta colapsada en GET y HEAD, 404 en JSON en los
//   demás métodos, así nada esquiva el router de la API (ni su CSRF ni sus límites);
// - /administracion/assets: los archivos con hash de dist/panel/assets, un año e immutable, y 404 si falta. Va ANTES
//   del no-store: send solo pone su Cache-Control si la respuesta todavía no tiene uno;
// - /administracion/api/…: la API, siempre en JSON (CSRF por origen, express.json con tope, límites, sesión, rol y
//   validación; lo que no existe, 404 en JSON; sin base, 503 en JSON);
// - todo otro GET de /administracion o /administracion/…: la página del panel (desde E2.1, dist/panel/index.html).
// Nunca carga analitica.js ni UserWay (plan 9).
import { resolve } from 'node:path'
import express from 'express'
import { crearApi } from './api/indice.js'
import { consultaDe, rutaSinBarrasDobles } from './normalizar.js'
import { cspPanel } from './seguridad.js'

const EN_CONSTRUCCION = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Panel · MuPa</title>
    <style>
      body { margin: 0; min-height: 100svh; display: grid; place-content: center; gap: 0.5rem; padding: 1.5rem;
             background: #0e100d; color: #eae2df; font: 1rem/1.5 system-ui, sans-serif; text-align: center; }
      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
      p { margin: 0; color: #a8a5ad; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <h1>Panel de administración del MuPa</h1>
    <p>En construcción.</p>
    <p><a href="/">Ir al sitio</a></p>
  </body>
</html>
`

/**
 * @param {object} opciones
 * @param {string} opciones.dirBuild
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {import('sequelize').Sequelize | null} [opciones.sequelize]  null: sin base (la API responde 503)
 */
export function crearPanel({ dirBuild, config, sequelize = null }) {
  const panel = express.Router()
  panel.use(cspPanel)
  panel.use(function barrasDelPanel(req, res, next) {
    // req.baseUrl + req.path: solo la ruta, nunca el request-target entero (ver server/normalizar.js).
    const ruta = req.baseUrl + req.path
    const colapsada = rutaSinBarrasDobles(ruta)
    if (colapsada === ruta) return next()
    res.set('Cache-Control', 'no-store')
    if (req.method === 'GET' || req.method === 'HEAD') return res.redirect(301, colapsada + consultaDe(req.originalUrl))
    res.status(404).json({ error: 'No existe esa ruta de la API.' })
  })
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
  panel.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  panel.use('/api', crearApi({ config, sequelize }))
  panel.get('/{*resto}', (req, res) => {
    res.type('html').send(EN_CONSTRUCCION)
  })
  panel.use((req, res) => {
    res.status(404).type('text').send('No encontrado.')
  })
  return panel
}
