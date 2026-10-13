// Hosts aceptados y redirección canónica (plan 2.4, punto 3). El panel no se reparte por host sino por ruta
// (/administracion, en app.js), así que esto vale igual para el sitio y para el panel.
//
// Siempre se mira el Host crudo del pedido (req.get('host')), nunca req.hostname: con trust proxy, req.hostname
// acepta X-Forwarded-Host, que cualquiera puede mandar.
//
// - El host de URL_PUBLICA sigue siempre.
// - Un Host mal formado (o ninguno): 400, también con CANONICO=1.
// - Con CANONICO=0 (hasta el corte de DNS) siguen también el de RENDER_EXTERNAL_URL (mupa-web.onrender.com) y los
//   locales (localhost, 127.0.0.1, [::1], con cualquier puerto). Cualquier otro: 400.
// - Con CANONICO=1 (desde el corte), cualquier otro host bien formado: 301 a URL_PUBLICA con la ruta ya normalizada
//   como lo harían las redirecciones públicas o las del panel (server/normalizar.js), así llega en un solo salto:
//   www.mupa.ar/preview/x va directo a https://mupa.ar/ y www.mupa.ar/a//b/ a https://mupa.ar/a/b.
import { consultaDe, destinoNormalizado } from './normalizar.js'

const NOMBRES_LOCALES = new Set(['localhost', '127.0.0.1', '[::1]'])
// Un Host bien formado: nombre (con el punto final que admite el DNS: "mupa.ar.") o [IPv6] y, opcionalmente,
// :puerto numérico. Lo demás ("127.0.0.1:80@evil.com", "localhost:80/x", vacío) es 400: nunca cuenta como local
// aunque termine pareciéndose, ni recibe el 301 canónico.
const HOST_VALIDO = /^(?:[a-z0-9-]+(?:\.[a-z0-9-]+)*\.?|\[[0-9a-f:.]+\])(?::\d{1,5})?$/

const hostNoAceptado = (res) => res.status(400).set('Cache-Control', 'no-store').type('text').send('Host no aceptado.')

/** El host del pedido, en minúsculas, tal como llegó (con el puerto si lo trae). */
export const hostDelPedido = (req) => (req.get('host') ?? '').toLowerCase()

/** "127.0.0.1:5173" -> "127.0.0.1"; "[::1]:5173" -> "[::1]". Un host mal formado -> null. */
export function sinPuerto(host) {
  if (!HOST_VALIDO.test(host)) return null
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1)
  const i = host.lastIndexOf(':')
  return i < 0 ? host : host.slice(0, i)
}

/**
 * ¿Se indexa y se mide este pedido? Solo en producción y con el host de URL_PUBLICA (mupa.ar): en
 * mupa-web.onrender.com, antes del corte, el sitio sale con noindex y sin GA4 (plan 1, "Indexación y medición").
 */
export function esHostPublico(config, req) {
  return config.produccion && hostDelPedido(req) === config.hostPublico
}

export function crearControlDeHost(config) {
  return function controlDeHost(req, res, next) {
    const host = hostDelPedido(req)
    if (host === config.hostPublico) return next()
    if (!HOST_VALIDO.test(host)) return hostNoAceptado(res)
    if (!config.CANONICO && (host === config.hostRender || NOMBRES_LOCALES.has(sinPuerto(host)))) return next()
    if (config.CANONICO) {
      return res.redirect(301, config.origenPublico + destinoNormalizado(req.path, consultaDe(req.originalUrl)))
    }
    hostNoAceptado(res)
  }
}
