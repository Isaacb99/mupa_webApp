// Arma la app de Express (plan 2.4: qué responde el servicio, en orden). No escucha ni conecta: eso lo hacen
// server/servidor.js (producción), server/dev.js (desarrollo, con Vite) y las pruebas (server/pruebas/).
//
//  1. sin X-Powered-By; trust proxy como NÚMERO de saltos (TRUST_PROXY), nunca true (plan 10.1); helmet común
//     (HSTS, nosniff, Referrer-Policy…) en todas las respuestas, también /salud
//  2. cualquier host: /salud (sin base: el health check de Render), /salud/base, /salud/ip (solo con DEPURAR_IP=1)
//     y, desde E3.1, /fotos/*
//  3. host aceptado o redirección canónica (server/hosts.js)
//  4. X-Robots-Tag: noindex fuera del host público de producción
//  5. el panel en /administracion, con su CSP (server/panel.js), antes de las redirecciones públicas
//  6. redirecciones públicas: /index.html, /preview, barras (server/seguridad.js)
//  7. estáticos públicos con la CSP pública: /assets un año e immutable; la raíz de dist/client (favicon, og.jpg,
//     el .html de Search Console) un día, por nombre exacto: ni la plantilla del SSR ni los dotfiles (los .htaccess
//     de public/ nunca salen)
//  8. /robots.txt, /sitemap.xml y las páginas (SSR) o la 404; no hay API fuera de /administracion/api
//  9. errores (server/errores.js)
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import express from 'express'
import { hoyEnSanJuan } from '../compartido/fechas.js'
import { RUTA_PANEL } from '../compartido/panel.js'
import { probarBase } from './db/conexion.js'
import { manejadorDeErrores } from './errores.js'
import { crearControlDeHost } from './hosts.js'
import { codigoDeError, log } from './log.js'
import { crearPanel } from './panel.js'
import { crearRutasPublicas } from './rutas-publicas.js'
import { cabecerasComunes, cspPublica, noIndexarFueraDelHostPublico, redireccionesPublicas } from './seguridad.js'
import { robotsTxt, sitemapXml } from './seo.js'

/**
 * Estáticos públicos de un build (producción y prueba local de producción).
 * - /assets: los archivos con hash, un año e immutable; 404 en texto si falta.
 * - La raíz de dist/client: SOLO los archivos que hay ahí al arrancar (lo de public/: favicon.*, og.jpg, el .html de
 *   Search Console…), pedidos por su nombre exacto. Ni la plantilla del SSR (index.html, con las marcas sin llenar)
 *   ni los dotfiles (.htaccess). Con una lista y no con express.static suelto, porque serve-static resuelve "/./",
 *   "%2e", "/x/../" y, en Windows, "index.html::$DATA" o el nombre corto "INDEX~1.HTM", y la plantilla salía cruda
 *   por esas rutas. Los nombres de public/ son ASCII sin espacios: req.path (sin decodificar) los nombra tal cual.
 *   Solo los archivos sueltos de la raíz: una carpeta nueva en public/ (aparte de assets/) necesita su propio app.use.
 * redirect: false en los dos: si no, serve-static mandaría /assets a /assets/ y las redirecciones de barras lo
 * devolverían a /assets, en un bucle.
 */
export function estaticosDelBuild(dirBuild) {
  const cliente = resolve(dirBuild, 'client')
  return (app) => {
    app.use(
      '/assets',
      express.static(resolve(cliente, 'assets'), {
        immutable: true,
        maxAge: '1y',
        fallthrough: false,
        index: false,
        redirect: false,
      }),
    )
    const archivos = new Set(
      readdirSync(cliente, { withFileTypes: true })
        .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.toLowerCase() !== 'index.html')
        .map((e) => '/' + e.name),
    )
    const raiz = express.static(cliente, {
      index: false,
      redirect: false,
      maxAge: '1d',
      setHeaders: (res, archivo) => {
        if (archivo.endsWith('.html')) res.set('Cache-Control', 'no-cache')
      },
    })
    app.use((req, res, next) => (archivos.has(req.path) ? raiz(req, res, next) : next()))
  }
}

/**
 * @param {object} opciones
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {ReturnType<import('./ssr.js').crearSsr>} opciones.ssr
 * @param {import('sequelize').Sequelize | null} [opciones.sequelize]  null: sin base
 * @param {(app: import('express').Express) => void} opciones.estaticos  estaticosDelBuild() o los middlewares de Vite
 * @param {Date} [opciones.fechaHome]  última modificación de la Home para el sitemap (la fecha del build)
 * @param {boolean} [opciones.desarrollo]  CSP con lo que necesita Vite en desarrollo
 */
export function crearApp({ config, ssr, sequelize = null, estaticos, fechaHome = new Date(), desarrollo = false }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.TRUST_PROXY)

  app.use(cabecerasComunes())

  // 2. Cualquier host.
  app.get('/salud', (req, res) => {
    res.set('Cache-Control', 'no-store').type('text').send('ok')
  })
  app.get('/salud/base', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (!sequelize) return res.status(503).json({ base: config.sinBase ? 'sin base (SIN_BASE)' : 'sin configurar' })
    try {
      res.json({ base: 'ok', ms: await probarBase(sequelize, 2_000) })
    } catch (err) {
      log('aviso', 'salud_base', { mensaje: err.message, codigo: codigoDeError(err) })
      res.status(503).json({ base: 'no responde' })
    }
  })
  // Para ajustar TRUST_PROXY en el primer deploy (plan 10.1, paso 4): después se apaga.
  if (config.DEPURAR_IP) {
    app.get('/salud/ip', (req, res) => {
      res.set('Cache-Control', 'no-store').json({
        ip: req.ip,
        xForwardedFor: req.get('x-forwarded-for') ?? null,
        host: req.get('host') ?? null,
      })
    })
  }

  // 3 y 4.
  app.use(crearControlDeHost(config))
  app.use(noIndexarFueraDelHostPublico(config))

  // 5. Panel.
  app.use(RUTA_PANEL, crearPanel({ dirBuild: config.DIR_BUILD }))

  // 6 a 8. Sitio público.
  app.use(cspPublica(config, { desarrollo }))
  app.use(redireccionesPublicas)
  estaticos(app)
  app.get('/robots.txt', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600').type('text').send(robotsTxt(config.urlPublica))
  })
  app.get('/sitemap.xml', (req, res) => {
    const xml = sitemapXml([{ loc: config.urlPublica, lastmod: hoyEnSanJuan(fechaHome) }])
    res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(xml)
  })
  app.use(crearRutasPublicas({ ssr }))

  // 9.
  app.use(manejadorDeErrores())
  return app
}
