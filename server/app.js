// Arma la app de Express (plan 2.4: qué responde el servicio, en orden). No escucha ni conecta: eso lo hacen
// server/servidor.js (producción), server/dev.js (desarrollo, con Vite) y las pruebas (server/pruebas/).
//
//  1. sin X-Powered-By; trust proxy como NÚMERO de saltos (TRUST_PROXY), nunca true (plan 10.1); helmet común
//     (HSTS, nosniff, Referrer-Policy…) en todas las respuestas, también /salud
//  2. cualquier host: /salud (sin base: el health check de Render), /salud/base, /salud/ip (solo con DEPURAR_IP=1)
//     y, desde E3.1, GET y HEAD /fotos/:clave/:archivo (server/fotos/servir.js)
//  3. host aceptado o redirección canónica (server/hosts.js)
//  4. X-Robots-Tag: noindex fuera del host público de producción
//  5. el panel en /administracion (dist/panel y su API), con su CSP (server/panel.js), antes de las redirecciones públicas
//  6. redirecciones públicas: /index.html, /preview, barras (server/seguridad.js); con la audioguía prendida, antes, las
//     formas raras de sus rutas con un secreto (antesDeLasRedirecciones de server/audioguia/rutas.js)
//  7. estáticos públicos con la CSP pública: /assets un año e immutable; la raíz de dist/client (favicon, og.jpg,
//     el .html de Search Console) un día, por nombre exacto: ni la plantilla del SSR ni los dotfiles (los .htaccess
//     de public/ nunca salen)
//  8. /robots.txt, /sitemap.xml (con lo publicado, desde E4.6), POST /contacto (el formulario, desde E4.5:
//     server/contacto.js) y las páginas (SSR) o la 404; no hay API fuera de /administracion/api. Antes de las páginas,
//     la audioguía (server/audioguia/rutas.js), solo si está prendida: AUDIOGUIA_CLAVE y una carpeta (DIR_AUDIOGUIAS)
//     con un pistas.json que deja alguna estación válida. Las pistas se leen una vez, al armar la app (cargarPistas,
//     sincrónica); apagada, nada cambia: ni rutas, ni cabeceras, ni cookies (especificación de las audioguías, 2.2)
//  9. errores (server/errores.js)
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import express from 'express'
import { RUTA_PANEL } from '../compartido/panel.js'
import { cargarPistas, hayGrabaciones } from './audioguia/pistas.js'
import { crearRutasDeAudioguia } from './audioguia/rutas.js'
import { esBaseNoDisponible } from './contenido-publico.js'
import { probarBase } from './db/conexion.js'
import { manejadorDeErrores } from './errores.js'
import { crearAlmacen } from './fotos/almacen.js'
import { crearRutaDeFotos } from './fotos/servir.js'
import { crearControlDeHost } from './hosts.js'
import { codigoDeError, log } from './log.js'
import { crearRecepcion } from './contacto.js'
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
 * La audioguía de esta app (especificación de las audioguías, 1.4 y 2.2): sin AUDIOGUIA_CLAVE, null (y, en producción,
 * un aviso si hay algún MP3 en la carpeta: quedaron sin clave); con ella, lo que leyó cargarPistas, que loguea por su
 * cuenta lo que se salteó (audioguia_pista_invalida, audioguia_sin_pistas). Prendida (con alguna estación), una línea
 * con cuántas quedaron y, en Render con TRUST_PROXY=0, un error (audioguia_limite_global). El sitio nunca deja de
 * arrancar por la audioguía.
 * @param {ReturnType<import('./config.js').leerConfig>} config
 */
export function audioguiaDeLaApp(config) {
  // Una clave mal pegada (con espacios en el medio, corta, con otros caracteres) no frena el sitio (1.4): el módulo
  // queda apagado y lo dice el log, nunca con el valor (AG-SEG-05 y AG-COD-08; server/config.js).
  if (config.audioguiaClaveInvalida) {
    log('error', 'audioguia_clave_invalida', { detalle: 'AUDIOGUIA_CLAVE mal formada: la audioguía queda apagada' })
    return null
  }
  if (!config.AUDIOGUIA_CLAVE) {
    // Con algún MP3 en la carpeta: el manifiesto solo no es una audioguía sin clave (el real está desde antes de las
    // grabaciones, 24/11/2026).
    if (config.produccion && hayGrabaciones(config.dirAudioguias)) {
      log('aviso', 'audioguia_apagada', { detalle: 'hay pistas y falta AUDIOGUIA_CLAVE' })
    }
    return null
  }
  const audioguia = cargarPistas(config.dirAudioguias)
  if (audioguia.estaciones.size) {
    log('info', 'audioguia_prendida', {
      version: audioguia.version,
      espacios: audioguia.espacios.size,
      estaciones: audioguia.estaciones.size / 2,
      salteadas: audioguia.problemas.length,
    })
    // Detrás del proxy de Render con TRUST_PROXY=0, req.ip es la del proxy para todos: el límite del audio (3.000 cada
    // 15 minutos) sería uno solo para todo el museo, y un grupo escolar lo gasta (AG-SEG-01). Más fuerte que el
    // trust_proxy_cero de avisosDeConfig: acá se queda sin audio todo el mundo. Se comprueba con DEPURAR_IP (E5.1).
    if (config.produccion && (config.RENDER || config.RENDER_EXTERNAL_URL) && config.TRUST_PROXY === 0) {
      log('error', 'audioguia_limite_global', {
        detalle: 'TRUST_PROXY=0 detrás del proxy de Render: el límite del audio sería uno solo para todos los visitantes',
      })
    }
  }
  return audioguia
}

/**
 * @param {object} opciones
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {ReturnType<import('./ssr.js').crearSsr>} opciones.ssr
 * @param {import('sequelize').Sequelize | null} [opciones.sequelize]  null: sin base
 * @param {(app: import('express').Express) => void} opciones.estaticos  estaticosDelBuild() o los middlewares de Vite
 * @param {Date} [opciones.fechaHome]  la fecha del build, para el lastmod de la Home en el sitemap (si la última
 *   novedad publicada es más nueva, va la de ella: entradasDelSitemap, server/seo.js)
 * @param {boolean} [opciones.desarrollo]  CSP con lo que necesita Vite en desarrollo
 * @param {ReturnType<import('./tareas.js').crearRegistroDeTareas> | null} [opciones.registroTareas]  cómo salieron
 *   las tareas diarias, para el Inicio del panel (null: ninguna falló)
 * @param {import('vite').ViteDevServer | null} [opciones.vitePanel]  el Vite del panel (solo server/dev.js); sin él,
 *   el panel sale de dist/panel
 * @param {ReturnType<typeof crearAlmacen> | null} [opciones.almacen]  las fotos en la base, con su caché: el mismo
 *   para /fotos, la API y las tareas diarias (servidor.js y dev.js lo crean y lo pasan); sin él, uno propio
 * El formulario de contacto (E4.5) es el de ssr.contacto (server/contacto.js), con su correo: el mismo para la página,
 * POST /contacto y el panel (el aviso del Inicio y Mensajes).
 */
export function crearApp({
  config,
  ssr,
  sequelize = null,
  estaticos,
  fechaHome = new Date(),
  desarrollo = false,
  registroTareas = null,
  vitePanel = null,
  almacen = null,
}) {
  const fotos = almacen ?? (sequelize ? crearAlmacen(sequelize) : null)
  const { contacto } = ssr
  const audioguia = audioguiaDeLaApp(config)
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
  // Las fotos (GET y HEAD): sin base, 404.
  app.get('/fotos/:clave/:archivo', crearRutaDeFotos({ almacen: fotos, config }))

  // 3 y 4.
  app.use(crearControlDeHost(config))
  app.use(noIndexarFueraDelHostPublico(config))

  // 5. Panel.
  app.use(
    RUTA_PANEL,
    crearPanel({
      dirBuild: config.DIR_BUILD,
      config,
      sequelize,
      registroTareas,
      almacen: fotos,
      vite: vitePanel,
      correo: contacto?.correo ?? null,
    }),
  )

  // 6 a 8. Sitio público. La audioguía prendida (server/audioguia/rutas.js) mira antes de las redirecciones las rutas
  // con un secreto (el código del QR, el ?t= del audio): en una forma rara no llegan al 301 de las barras ni a la 404
  // del sitio (AG-SEG-02, AG-SEG-03 y AG-COD-03 de la verificación del servidor).
  const rutasDeAudioguia = audioguia?.estaciones.size ? crearRutasDeAudioguia({ config, ssr, audioguia }) : null
  app.use(cspPublica(config, { desarrollo }))
  if (rutasDeAudioguia) app.use(rutasDeAudioguia.antesDeLasRedirecciones)
  app.use(redireccionesPublicas)
  estaticos(app)
  app.get('/robots.txt', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600').type('text').send(robotsTxt(config.urlPublica))
  })
  // La clave de IndexNow (server/indexnow.js), solo si está configurada: con ella IndexNow comprueba los avisos.
  if (config.INDEXNOW_CLAVE) {
    app.get(`/${config.INDEXNOW_CLAVE}.txt`, (req, res) => {
      res.set('Cache-Control', 'public, max-age=3600').type('text').send(config.INDEXNOW_CLAVE)
    })
  }
  // El sitemap (plan 6.5): las páginas fijas y lo publicado, leído en cada pedido (no-cache, como el HTML: lo que se
  // publica entra en el pedido siguiente). Si la base falla, 503: uno sin los contenidos le diría al buscador que
  // ya no están.
  app.get('/sitemap.xml', async (req, res) => {
    let entradas
    try {
      entradas = await ssr.sitemap(fechaHome)
    } catch (err) {
      if (!esBaseNoDisponible(err)) throw err
      log('aviso', 'sitemap_sin_base', { mensaje: err.mensajeCausa, codigo: err.causa ?? codigoDeError(err) })
      return res.status(503).set({ 'Cache-Control': 'no-store', 'Retry-After': '60' }).type('text').send('No disponible.')
    }
    res.set('Cache-Control', 'no-cache').type('application/xml').send(sitemapXml(entradas))
  })
  // El formulario de contacto (plan 8): sin JavaScript, CSRF por origen, límites y la página otra vez con lo escrito.
  if (contacto) app.post('/contacto', ...crearRecepcion({ config, contacto, ssr }))
  // La audioguía (server/audioguia/rutas.js), solo prendida: apagada, /audioguia/… da la 404 del sitio.
  if (rutasDeAudioguia) app.use(rutasDeAudioguia)
  app.use(crearRutasPublicas({ ssr }))

  // 9.
  app.use(manejadorDeErrores())
  return app
}
