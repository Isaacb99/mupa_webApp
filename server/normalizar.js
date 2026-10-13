// Normalización de rutas para las redirecciones (plan 2.4, puntos 3, 5 y 6). Una sola fuente para las tres que
// redirigen: las públicas (server/seguridad.js), la canónica por host (server/hosts.js) y las barras del panel
// (server/panel.js). Así un pedido a otro host llega a su destino final en un solo salto.
//
// Siempre se trabaja sobre la ruta del pedido ya separada de la consulta (req.path, o req.baseUrl + req.path dentro
// de un router), nunca sobre req.originalUrl entero: con un request-target absoluto ("GET http://evil.com//x"),
// originalUrl trae el esquema y el host, y colapsar sus barras daría "http:/evil.com", que el navegador lee como
// otro sitio.
import { RUTA_PANEL } from '../compartido/panel.js'

/**
 * Ruta sin barras repetidas, finales ni invertidas: siempre una sola barra al principio, así un Location nunca
 * empieza con // (que el navegador tomaría como otro sitio). La barra invertida cuenta como barra porque los
 * navegadores la leen así: "/\evil.com" sería "//evil.com".
 */
export const rutaNormalizada = (ruta) => '/' + ruta.split(/[\\/]+/).filter(Boolean).join('/')

/** Ruta con las barras repetidas o invertidas colapsadas, pero con la barra final si la tenía (el panel). */
export const rutaSinBarrasDobles = (ruta) => ('/' + ruta).replace(/[\\/]+/g, '/')

/** La consulta ("?a=1", o "") de una URL de pedido. */
export function consultaDe(urlPedido) {
  const i = urlPedido.indexOf('?')
  return i < 0 ? '' : urlPedido.slice(i)
}

function decodificada(ruta) {
  try {
    return decodeURIComponent(ruta)
  } catch {
    // Una ruta mal codificada sigue tal cual y termina en 404.
    return ruta
  }
}

const ES_PANEL = new RegExp(`^${RUTA_PANEL}(/|$)`, 'i')

/**
 * Adónde va una ruta pública (plan 2.4, punto 6), con la consulta. Si no hay que redirigir, devuelve ruta + consulta.
 * - /index.html (también /INDEX.HTML o /%69ndex.html) -> / con la consulta;
 * - /preview y /preview/… (la vista previa de Hostinger, que deja de existir con el corte) -> /, sin la consulta;
 * - el resto, sin barras repetidas, finales ni invertidas.
 * No se redirigen los *.html: el de Search Console tiene que dar 200.
 */
export function destinoPublico(ruta, consulta = '') {
  const texto = decodificada(ruta)
  if (/^\/index\.html$/i.test(texto)) return '/' + consulta
  if (/^\/preview(\/|$)/i.test(texto)) return '/'
  return rutaNormalizada(ruta) + consulta
}

/**
 * Adónde va cualquier ruta del servicio: la del panel, solo con las barras colapsadas (la barra final se respeta:
 * /administracion/ es la entrada del panel); la pública, con destinoPublico().
 */
export function destinoNormalizado(ruta, consulta = '') {
  const panel = rutaSinBarrasDobles(ruta)
  if (ES_PANEL.test(panel)) return panel + consulta
  return destinoPublico(ruta, consulta)
}
