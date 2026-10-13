// Cabeceras de seguridad y redirecciones normalizadas (plan 2.4 y 9).
// - cabecerasComunes: helmet en todas las respuestas, sin CSP (cada parte pone la suya).
// - cspPublica / cspPanel: una para las páginas públicas (todo lo que no es /administracion) y otra estricta, sin
//   terceros, para el panel. Fijas y obligatorias, sin report-only (plan 1, "CSP").
// - noIndexarFueraDelHostPublico: X-Robots-Tag en todo host que no sea el público de producción.
// - redireccionesPublicas: /index.html, /preview y las barras, sin dejar salir nunca un Location que empiece con //.
// La CSRF del panel (por Sec-Fetch-Site y Origin, plan 4.6) se suma acá en E1.2.
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

/** CSP del panel, en toda respuesta de /administracion y /administracion/…: ningún dominio de terceros (plan 9). */
export const CSP_PANEL = politica({
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'blob:', 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
})

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

export function cspPanel(req, res, next) {
  res.set('Content-Security-Policy', CSP_PANEL)
  res.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-Robots-Tag', 'noindex, nofollow')
  next()
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
