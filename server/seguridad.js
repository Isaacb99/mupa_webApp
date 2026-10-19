// Cabeceras de seguridad y redirecciones normalizadas (plan 2.4 y 9).
// - cabecerasComunes: helmet en todas las respuestas, sin CSP (cada parte pone la suya).
// - cspPublica / cspPanel: una para las páginas públicas (todo lo que no es /administracion) y otra estricta, sin
//   terceros, para el panel. Fijas y obligatorias, sin report-only (plan 1, "CSP").
// - noIndexarFueraDelHostPublico: X-Robots-Tag en todo host que no sea el público de producción.
// - redireccionesPublicas: /index.html, /preview y las barras, sin dejar salir nunca un Location que empiece con //.
// - crearControlDeOrigen / exigirJson: la CSRF de la API del panel (por Sec-Fetch-Site y Origin, plan 4.6) y el
//   Content-Type de las rutas JSON (multipart en POST /fotos, MULTIPART); los monta server/api/indice.js. Desde E4.5
//   la CSRF vale también para POST /contacto.
import helmet from 'helmet'
import { esHostPublico } from './hosts.js'
import { consultaDe, destinoPublico } from './normalizar.js'

/** Arma el texto de una CSP a partir de { directiva: [fuentes] }. */
function politica(directivas) {
  return Object.entries(directivas)
    .map(([nombre, fuentes]) => [nombre, ...fuentes].join(' '))
    .join('; ')
}

// Google Analytics 4: los comodines de la guía de CSP de Google (plan 9). www.google.com porque gtag manda cada
// evento también a www.google.com/g/collect (CLAUDE.md, 01/10/2026).
const GA4 = {
  script: ['https://*.googletagmanager.com'],
  connect: [
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://www.google.com',
  ],
  img: ['https://*.google-analytics.com', 'https://*.googletagmanager.com'],
}
// UserWay (E4.7): todavía no se carga. Sus dominios entran a la CSP solo si hay USERWAY_ID, y se confirman al
// integrarlo mirando la consola (plan 6.6 y 9).
const USERWAY = ['https://*.userway.org']

/**
 * CSP de las páginas públicas. Lo que necesita hoy la Home: lo propio, las imágenes inline (data:, Vite incrusta los
 * SVG chicos) y GA4. 'unsafe-inline' en estilos por los style= que dibuja el SSR; no hay scripts inline (el estado y
 * el JSON-LD son JSON, no se ejecutan). frame-src (el mapa de Contacto, www.google.com) se suma con E4.5.
 * En desarrollo (server/dev.js) se agregan el script inline del preámbulo de React Refresh y el websocket de Vite.
 */
export function textoCspPublica({ userway = false, desarrollo = false } = {}) {
  const uw = userway ? USERWAY : []
  return politica({
    'default-src': ["'self'"],
    'script-src': ["'self'", ...(desarrollo ? ["'unsafe-inline'"] : []), ...GA4.script, ...uw],
    'connect-src': ["'self'", ...(desarrollo ? ['ws:'] : []), ...GA4.connect, ...uw],
    'img-src': ["'self'", 'data:', ...GA4.img, ...uw],
    'style-src': ["'self'", "'unsafe-inline'", ...uw],
    'font-src': ["'self'", ...uw],
    ...(userway ? { 'frame-src': uw } : {}),
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  })
}

/**
 * CSP del panel, en toda respuesta de /administracion y /administracion/…: ningún dominio de terceros (plan 9).
 * En desarrollo (npm run dev, con el Vite del panel adentro) suma, como la pública, el script inline del preámbulo de
 * React Refresh y el websocket de Vite.
 */
export function textoCspPanel({ desarrollo = false } = {}) {
  return politica({
    'default-src': ["'self'"],
    'script-src': ["'self'", ...(desarrollo ? ["'unsafe-inline'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'blob:', 'data:'],
    'connect-src': ["'self'", ...(desarrollo ? ['ws:'] : [])],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  })
}

/** La CSP del panel en producción (y en las pruebas). */
export const CSP_PANEL = textoCspPanel()

/** helmet común (plan 2.4, punto 4). */
export function cabecerasComunes() {
  return helmet({
    contentSecurityPolicy: false,
    // HSTS sin includeSubDomains (el correo y otros subdominios siguen en Hostinger): 1 día durante la transición y
    // 180 días a las 2 semanas de estable, con un commit (plan 9 y 11.3). Los navegadores lo ignoran sobre http.
    strictTransportSecurity: { maxAge: 86_400, includeSubDomains: false },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Cada parte pone la suya: el sitio deja usar sus imágenes desde otros orígenes (como hoy en Hostinger), el
    // panel no.
    crossOriginResourcePolicy: false,
  })
}

export function cspPublica(config, { desarrollo = false } = {}) {
  const texto = textoCspPublica({ userway: Boolean(config.USERWAY_ID), desarrollo })
  return function cabecerasPublicas(req, res, next) {
    res.set('Content-Security-Policy', texto)
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    next()
  }
}

export function cspPanel({ desarrollo = false } = {}) {
  const texto = desarrollo ? textoCspPanel({ desarrollo }) : CSP_PANEL
  return function cabecerasDelPanel(req, res, next) {
    res.set('Content-Security-Policy', texto)
    res.set('Cross-Origin-Resource-Policy', 'same-origin')
    res.set('X-Frame-Options', 'DENY')
    res.set('X-Robots-Tag', 'noindex, nofollow')
    next()
  }
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])
// Rutas de /administracion/api exceptuadas del control de origen (plan 4.6): ninguna. El webhook de Mercado Pago, que
// va fuera de /administracion, se suma con el módulo 5 (plan 3.6).
export const EXCEPTUADAS = []

const NOMBRES_LOCALES = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Los orígenes del sitio: el de URL_PUBLICA y, antes del corte, el de Render (mupa-web.onrender.com). */
export function origenesPermitidos(config) {
  const lista = new Set([new URL(config.urlPublica).origin])
  if (config.RENDER_EXTERNAL_URL) lista.add(new URL(config.RENDER_EXTERNAL_URL).origin)
  return lista
}

/** http(s)://localhost, 127.0.0.1 o [::1] con cualquier puerto, escrito como lo escribe el navegador. */
function esOrigenLocal(origen) {
  if (!URL.canParse(origen)) return false
  const u = new URL(origen)
  return /^https?:$/.test(u.protocol) && NOMBRES_LOCALES.has(u.hostname) && u.origin === origen
}

/**
 * CSRF por origen (plan 4.6, OWASP), en todo pedido que no sea GET, HEAD ni OPTIONS:
 * - con Sec-Fetch-Site (todos los navegadores actuales), solo same-origin. same-site se rechaza: incluiría cualquier
 *   otro subdominio de mupa.ar;
 * - sin Sec-Fetch-Site, el Origin tiene que ser uno de los del sitio (fuera de producción, también uno local:
 *   un Vite suelto en otro puerto, la prueba en 127.0.0.1). Sin ninguna de las dos cabeceras, se rechaza.
 * Lo que no cubre: un script que corre en una página pública del mismo origen llega como same-origin (el riesgo
 * aceptado de plan 9). Sin el paquete cors: no hay pedidos de otros orígenes que atender.
 */
export function crearControlDeOrigen(config) {
  const permitidos = origenesPermitidos(config)
  const localesTambien = !config.produccion
  return function controlDeOrigen(req, res, next) {
    if (METODOS_SEGUROS.has(req.method) || EXCEPTUADAS.includes(req.path)) return next()
    const sitio = req.get('sec-fetch-site')
    const origen = req.get('origin')
    const ok = sitio
      ? sitio === 'same-origin'
      : origen != null && (permitidos.has(origen) || (localesTambien && esOrigenLocal(origen)))
    if (!ok) return res.status(403).json({ error: 'Origen no permitido.' })
    next()
  }
}

const ES_JSON = /^application\/json\s*(;|$)/i
const ES_MULTIPART = /^multipart\/form-data\s*;/i

/**
 * Las rutas de /administracion/api que reciben un archivo (multipart/form-data) en vez de JSON: solo POST /fotos
 * (E3.1). Con la barra final o en mayúsculas también, como las rutea Express. Las demás siguen exigiendo JSON.
 */
export const MULTIPART = Object.freeze([{ metodo: 'POST', ruta: /^\/fotos\/?$/i }])
const esMultipart = (req) => MULTIPART.some((m) => m.metodo === req.method && m.ruta.test(req.path))

/**
 * Las rutas JSON de la API exigen Content-Type: application/json (plan 4.6): POST, PUT y PATCH siempre, y un DELETE
 * si trae cuerpo. Un formulario de otro sitio no puede mandar ese tipo sin una consulta previa (preflight), que nadie
 * atiende. 415 si no. Las de MULTIPART (POST /fotos) exigen, en cambio, multipart/form-data con su boundary: un
 * formulario de otro sitio sí podría mandarlo, pero el control de origen (crearControlDeOrigen) va antes.
 */
export function exigirJson(req, res, next) {
  if (esMultipart(req)) {
    if (ES_MULTIPART.test(req.get('content-type') ?? '')) return next()
    return res.status(415).json({ error: 'La foto tiene que ir en un formulario multipart/form-data.' })
  }
  const conCuerpo =
    req.method === 'POST' ||
    req.method === 'PUT' ||
    req.method === 'PATCH' ||
    (req.method === 'DELETE' && (req.get('transfer-encoding') != null || Number(req.get('content-length')) > 0))
  if (!conCuerpo || ES_JSON.test(req.get('content-type') ?? '')) return next()
  res.status(415).json({ error: 'El pedido tiene que ser JSON (Content-Type: application/json).' })
}

/** noindex (cabecera) en todo host que no sea el público de producción; el <meta> lo pone seo.js. */
export function noIndexarFueraDelHostPublico(config) {
  return function noIndexar(req, res, next) {
    if (!esHostPublico(config, req)) res.set('X-Robots-Tag', 'noindex, nofollow')
    next()
  }
}

/**
 * Redirecciones públicas (plan 2.4, punto 6; las reglas, en server/normalizar.js). La plantilla del SSR
 * (dist/client/index.html) nunca se sirve cruda: /index.html va a / (también /INDEX.HTML o /%69ndex.html) y, por las
 * rutas que no pasan por acá (/./index.html, /x/../index.html…), la cuida la lista de archivos de estaticosDelBuild
 * (server/app.js).
 */
export function redireccionesPublicas(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  const consulta = consultaDe(req.originalUrl)
  const destino = destinoPublico(req.path, consulta)
  if (destino !== req.path + consulta) return res.redirect(301, destino)
  next()
}
