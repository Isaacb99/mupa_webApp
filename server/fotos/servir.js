// GET y HEAD /fotos/:clave/:archivo (plan 2.4, punto 2, y 7): las fotos, con cualquier host (antes del control de
// host: las mismas URL sirven antes y después del corte del dominio), para el sitio y para el panel.
// - Solo 480.webp, 960.webp, 1600.webp y og.jpg (ARCHIVOS_PUBLICOS). La maestra (2400.webp) se guarda pero no se
//   publica: 404, igual que cualquier otro nombre.
// - La clave se valida con su patrón (16 caracteres hexadecimales) antes de tocar la base: lo que no lo cumple es un
//   404 sin consultar nada.
// - 200 con Cache-Control "public, max-age=31536000, immutable" (la clave es nueva en cada subida: una URL nunca
//   cambia de contenido), ETag por clave y variante (If-None-Match -> 304), Content-Type y Content-Length,
//   X-Content-Type-Options: nosniff y Cross-Origin-Resource-Policy: cross-origin (como el resto del sitio: og.jpg la
//   leen las redes). Nunca Set-Cookie.
// - 404 (o 503 si la base no responde o hay demasiadas lecturas esperando) con no-store: que nadie guarde un "no
//   existe" de una foto que puede existir un momento después.
// - Fuera del host público de producción (mupa-web.onrender.com antes del corte, una prueba local), X-Robots-Tag:
//   noindex, como el resto del sitio (plan 2.4, punto 4: esta ruta va antes de ese middleware).
// Los bytes salen de server/fotos/almacen.js (caché en memoria y, si no, la base con como mucho 2 lecturas a la vez).
import { ARCHIVOS_PUBLICOS, CLAVE_FOTO } from '../../compartido/fotos.js'
import { esHostPublico } from '../hosts.js'
import { codigoDeError, log } from '../log.js'

export const CACHE_FOTO = 'public, max-age=31536000, immutable'

/** El ETag de un archivo: la clave y la variante, entre comillas (fuerte: el contenido no cambia nunca). */
export const etagDe = (clave, variante) => `"${clave}-${variante}"`

/** ¿El If-None-Match del pedido incluye este ETag? (lista separada por comas, con W/ o sin, o *) */
export function coincideEtag(cabecera, etag) {
  if (!cabecera) return false
  return cabecera.split(',').some((parte) => {
    const valor = parte.trim()
    return valor === '*' || valor.replace(/^W\//, '') === etag
  })
}

function sinFoto(res, status = 404) {
  res.status(status).set('Cache-Control', 'no-store')
  if (status === 503) res.set('Retry-After', '5')
  res.type('text').send(status === 404 ? 'No encontrado.' : 'La foto no está disponible en este momento.')
}

/**
 * @param {{ almacen: ReturnType<typeof import('./almacen.js').crearAlmacen> | null, config?: object }} deps
 *   almacen null: sin base (404); config: para el noindex fuera del host público (sin ella, no se pone)
 */
export function crearRutaDeFotos({ almacen, config = null }) {
  return async function servirFoto(req, res) {
    if (config && !esHostPublico(config, req)) res.set('X-Robots-Tag', 'noindex, nofollow')
    const { clave, archivo } = req.params
    const publico = Object.hasOwn(ARCHIVOS_PUBLICOS, archivo) ? ARCHIVOS_PUBLICOS[archivo] : null
    if (!almacen || !publico || !CLAVE_FOTO.test(clave)) return sinFoto(res)
    let datos
    try {
      datos = await almacen.abrir(clave, publico.variante)
    } catch (err) {
      if (err?.code !== 'FOTOS_OCUPADO') log('aviso', 'foto_sin_base', { mensaje: err.message, codigo: codigoDeError(err) })
      return sinFoto(res, 503)
    }
    if (!datos) return sinFoto(res)
    const etag = etagDe(clave, publico.variante)
    res.set({
      'Cache-Control': CACHE_FOTO,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    })
    if (coincideEtag(req.get('if-none-match'), etag)) return res.status(304).end()
    res.status(200).set({ 'Content-Type': publico.tipo, 'Content-Length': String(datos.length) })
    if (req.method === 'HEAD') return res.end()
    res.end(datos)
  }
}
