// Fotos (plan 5.5 y 7): lo que comparten el servidor (server/fotos/, server/api/fotos.js), el panel (SubirFoto,
// Portada, Galeria y el achique de panel/src/achicarFoto.js) y, desde E4, el sitio (Foto.jsx). Código puro, sin zod ni
// APIs de Node o del DOM: los esquemas están en compartido/esquemas/fotos.js.
//
// Cada foto se guarda en Postgres (decisión del desarrollador del 15/10/2026, plan 16.1) con cinco archivos: 480, 960
// y 1600 px de ancho en WebP, la maestra de 2400 en WebP y og.jpg (1200 px, para compartir en redes). Ninguno se
// agranda: si la foto mide 800 px, el de 960 (y los demás) mide 800. Se publican en /fotos/<clave>/<archivo> todos
// menos la maestra, que se guarda para poder regenerar tamaños y no sale nunca (404).

/** El peso máximo de lo que se sube (multer en el servidor y el panel antes de mandar): 20 MB. */
export const FOTO_BYTES_MAX = 20 * 1024 * 1024
/** Los píxeles máximos de una foto (ancho × alto): 50 megapíxeles. Más, y el servidor la rechaza sin procesarla. */
export const FOTO_PIXELES_MAX = 50_000_000
/** Lo que se acepta: JPG, PNG y WebP (nunca SVG ni HEIC, plan 7). Es también el accept del <input type="file">. */
export const TIPOS_FOTO = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
/** Los anchos que se guardan (sin agrandar): el ancho real de cada uno es min(ancho, ancho de la maestra). */
export const ANCHOS_FOTO = Object.freeze([480, 960, 1600, 2400])
/** El ancho de la maestra: lo que se guarda pero no se publica. */
export const ANCHO_MAESTRA = 2400
/** Las variantes que hay en la base (fotos_archivos.variante). */
export const VARIANTES_FOTO = Object.freeze(['480', '960', '1600', '2400', 'og'])

/** Lo que se publica en /fotos/<clave>/<archivo>: el archivo, su variante y su tipo. La maestra (2400) no está. */
export const ARCHIVOS_PUBLICOS = Object.freeze({
  '480.webp': Object.freeze({ variante: '480', tipo: 'image/webp' }),
  '960.webp': Object.freeze({ variante: '960', tipo: 'image/webp' }),
  '1600.webp': Object.freeze({ variante: '1600', tipo: 'image/webp' }),
  'og.jpg': Object.freeze({ variante: 'og', tipo: 'image/jpeg' }),
})

/** La clave de una foto: 64 bits al azar en hexadecimal (16 caracteres, en minúsculas). */
export const CLAVE_FOTO = /^[0-9a-f]{16}$/

/**
 * La dirección pública de un archivo de una foto, relativa al sitio: /fotos/<clave>/960.webp.
 * @param {string} clave
 * @param {'480.webp' | '960.webp' | '1600.webp' | 'og.jpg'} [archivo]
 */
export const urlFoto = (clave, archivo = '960.webp') => `/fotos/${clave}/${archivo}`

/**
 * Megabytes para una persona, con una decimal y redondeado para arriba (así 20,01 MB no se lee "20 MB" junto a "el
 * máximo es 20 MB"): 25 MB, 20,1 MB, 0,5 MB. Un MB = 1024 × 1024 bytes, como el límite.
 * @param {number} bytes
 */
export function megas(bytes) {
  const mb = Math.ceil((bytes / (1024 * 1024)) * 10) / 10
  return Number.isInteger(mb) ? String(mb) : mb.toFixed(1).replace('.', ',')
}

/** "La foto pesa 25 MB; el máximo es 20 MB." (plan 5.5). Sin el peso (no se sabe): "La foto pesa más de 20 MB…". */
export function mensajePeso(bytes) {
  const maximo = megas(FOTO_BYTES_MAX)
  if (!(bytes > FOTO_BYTES_MAX)) return `La foto pesa más de ${maximo} MB, que es el máximo.`
  return `La foto pesa ${megas(bytes)} MB; el máximo es ${maximo} MB.`
}

/** "La foto tiene 60 megapíxeles; el máximo es 50." */
export function mensajePixeles(pixeles) {
  const mp = Math.ceil(pixeles / 1_000_000)
  return (
    `La foto es demasiado grande: tiene ${mp} megapíxeles y el máximo es ${FOTO_PIXELES_MAX / 1_000_000}. ` +
    'Achicala antes de subirla (por ejemplo, exportala a 4000 píxeles de ancho).'
  )
}

export const MENSAJE_HEIC =
  'Esta foto está en formato HEIC. Exportala como JPG o elegí «Más compatible» en el iPhone ' +
  '(Configuración > Cámara > Formatos).'
export const MENSAJE_SVG = 'Las imágenes SVG no se pueden subir. Exportala como PNG o JPG.'
export const MENSAJE_TIPO = 'Este archivo no es una foto que se pueda subir: tiene que ser JPG, PNG o WebP.'
export const MENSAJE_DANADA =
  'No se pudo leer la foto: puede estar dañada o incompleta. Abrila en tu computadora y exportala de nuevo como JPG.'
/** Un JPG progresivo o un PNG entrelazado muy grande: para abrirlo hay que tenerlo entero en memoria (procesar.js). */
export const MENSAJE_PROGRESIVA =
  'Esta foto está guardada como JPG progresivo o PNG entrelazado y es demasiado grande para abrirla. Achicala antes ' +
  'de subirla (por ejemplo, exportala a 4000 píxeles de ancho) o guardala como JPG común.'
export const MENSAJE_VACIA = 'El archivo está vacío. Elegí la foto de nuevo.'
export const MENSAJE_SIN_FOTO = 'Elegí una foto para subir.'

/** La ayuda del texto alternativo (plan 5.5). */
export const AYUDA_ALT =
  'Describí lo que se ve, para quien no puede verla: «Cráneo de Herrerasaurus en la vitrina de la sala 2».'
export const AYUDA_DECORATIVA =
  'Solo si la foto adorna y no aporta nada (una textura, un fondo): el lector de pantalla la saltea y no hace falta ' +
  'describirla.'
