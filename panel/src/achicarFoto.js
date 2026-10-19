// El achique de una foto en el navegador, ANTES de subirla (decisión del desarrollador del 15/10/2026: siempre, no
// opcional). Una foto de cámara (6000x4000, 8 a 18 MB) achicada a 2400 px pesa 0,4 a 1,3 MB: sube en una fracción del
// tiempo, el servidor la procesa en un tercio y su pico de memoria baja a ~60 MB (medido el 15/10/2026 con 17 fotos
// reales). El servidor no confía en esto: mantiene sus límites (20 MB, 50 megapíxeles, el tipo real con sharp).
//
// Reglas (la lógica de decisión es pura y la prueban las pruebas del servidor sin navegador, server/pruebas/fotos.test.js):
// - Se achica si la foto mide más de 2400 px de ancho (ya orientada) o pesa más de ~4 MB (BYTES_SIN_ACHICAR); si no,
//   va el original tal cual (el servidor le saca los metadatos igual).
// - Nunca se agranda: el ancho queda en min(ancho, 2400), con la misma proporción. El área del lienzo no pasa de
//   16 millones de píxeles (el tope de Safari en iPhone: una foto muy alta se achica un poco más).
// - Sale como JPEG calidad 0,92. Una PNG o WebP con transparencia (un logo, un recorte) sale como PNG, para no perderla;
//   si esa PNG pasara los 20 MB, va como JPEG sobre blanco (la transparencia se pierde, pero sube).
// - Si lo achicado pesa más que el original y el original ya entraba (2400 px o menos y hasta 20 MB), va el original.
// - Si el navegador no puede leerla (p. ej. un HEIC fuera de Safari: Safari en iPhone ya convierte el HEIC a JPEG al
//   elegirla), va el original y el servidor responde su error en castellano ("Esta foto está en formato HEIC…").
// La orientación: createImageBitmap con imageOrientation 'from-image' (o un <img> de respaldo, que también la
// respeta) devuelve la foto ya derecha; el JPEG que sale no tiene EXIF, así que no se vuelve a girar.
import { ANCHO_MAESTRA, FOTO_BYTES_MAX } from '../../compartido/fotos.js'

/** Más que esto, se achica aunque mida 2400 px o menos (una PNG pesada, un JPEG con calidad 100). */
export const BYTES_SIN_ACHICAR = 4 * 1024 * 1024
/** El área máxima del lienzo: Safari en iPhone no dibuja lienzos de más de 16.777.216 píxeles. */
export const AREA_MAX_LIENZO = 16_000_000
export const CALIDAD_JPEG = 0.92

/** ¿Hay que achicarla? (ancho ya orientado) */
export const hayQueAchicar = ({ bytes, ancho }) => ancho > ANCHO_MAESTRA || bytes > BYTES_SIN_ACHICAR

/**
 * Las medidas de la foto achicada: ancho de hasta 2400, la misma proporción, nunca más grande que la original y con
 * un área de hasta AREA_MAX_LIENZO.
 * @param {number} ancho
 * @param {number} alto
 */
export function medidasAchicadas(ancho, alto) {
  let escala = Math.min(1, ANCHO_MAESTRA / ancho)
  if (ancho * alto * escala * escala > AREA_MAX_LIENZO) escala = Math.sqrt(AREA_MAX_LIENZO / (ancho * alto))
  return { ancho: Math.max(1, Math.floor(ancho * escala)), alto: Math.max(1, Math.floor(alto * escala)) }
}

/**
 * El formato de salida: PNG si tiene transparencia, si no JPEG 0,92.
 * @param {{ conTransparencia: boolean }} datos
 * @returns {{ tipo: 'image/png' } | { tipo: 'image/jpeg', calidad: number }}
 */
export const formatoDeSalida = ({ conTransparencia }) =>
  conTransparencia ? { tipo: 'image/png' } : { tipo: 'image/jpeg', calidad: CALIDAD_JPEG }

/** ¿Algún píxel no es opaco? (los datos de getImageData: RGBA, de a cuatro) */
export function tieneTransparencia(datos) {
  for (let i = 3; i < datos.length; i += 4) if (datos[i] < 255) return true
  return false
}

/**
 * ¿Qué se manda? 'original' si lo achicado pesa lo mismo o más y el original ya entraba (2400 px o menos y hasta
 * 20 MB); si no, 'achicada'.
 * @param {{ original: { bytes: number, ancho: number }, achicada: { bytes: number } }} datos
 */
export function elegirEnvio({ original, achicada }) {
  const entraba = original.ancho <= ANCHO_MAESTRA && original.bytes <= FOTO_BYTES_MAX
  return entraba && original.bytes <= achicada.bytes ? 'original' : 'achicada'
}

/** El nombre con la extensión del formato nuevo: "IMG_1234.HEIC.png" no; "IMG_1234.jpg" sí. */
export function nombreConExtension(nombre, tipo) {
  const extension = tipo === 'image/png' ? 'png' : 'jpg'
  const base = String(nombre || 'foto').replace(/\.[^./\\]{1,5}$/, '') || 'foto'
  return `${base}.${extension}`
}

// --- Lo que necesita el navegador (no corre en las pruebas) ---

/** La foto decodificada y ya orientada: { fuente, ancho, alto, cerrar }, o null si el navegador no la puede leer. */
async function decodificar(archivo) {
  if (typeof createImageBitmap === 'function') {
    try {
      const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
      return { fuente: mapa, ancho: mapa.width, alto: mapa.height, cerrar: () => mapa.close() }
    } catch {
      // Sigue con el <img>.
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { fuente: img, ancho: img.naturalWidth, alto: img.naturalHeight, cerrar: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }
}

const aBlob = (lienzo, tipo, calidad) => new Promise((listo) => lienzo.toBlob(listo, tipo, calidad))

/**
 * Prepara una foto para subir: la achica si hace falta (reglas de arriba).
 * @param {File} archivo
 * @returns {Promise<{ archivo: File, achicada: boolean, ancho?: number, alto?: number }>}
 *   ancho y alto: los de lo que se manda, si se pudieron leer
 */
export async function prepararFoto(archivo) {
  const imagen = await decodificar(archivo)
  if (!imagen) return { archivo, achicada: false }
  const lienzo = document.createElement('canvas')
  try {
    if (!hayQueAchicar({ bytes: archivo.size, ancho: imagen.ancho })) {
      return { archivo, achicada: false, ancho: imagen.ancho, alto: imagen.alto }
    }
    const destino = medidasAchicadas(imagen.ancho, imagen.alto)
    lienzo.width = destino.ancho
    lienzo.height = destino.alto
    const ctx = lienzo.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    const dibujar = (fondo) => {
      ctx.clearRect(0, 0, destino.ancho, destino.alto)
      if (fondo) {
        ctx.fillStyle = fondo
        ctx.fillRect(0, 0, destino.ancho, destino.alto)
      }
      ctx.drawImage(imagen.fuente, 0, 0, destino.ancho, destino.alto)
    }
    dibujar(null)
    // Solo una PNG o una WebP pueden tener transparencia.
    const puedeTener = archivo.type === 'image/png' || archivo.type === 'image/webp'
    const conTransparencia = puedeTener && tieneTransparencia(ctx.getImageData(0, 0, destino.ancho, destino.alto).data)
    let formato = formatoDeSalida({ conTransparencia })
    if (formato.tipo === 'image/jpeg' && puedeTener) dibujar('#ffffff')
    let blob = await aBlob(lienzo, formato.tipo, formato.calidad)
    if (blob && formato.tipo === 'image/png' && blob.size > FOTO_BYTES_MAX) {
      formato = formatoDeSalida({ conTransparencia: false })
      dibujar('#ffffff')
      blob = await aBlob(lienzo, formato.tipo, formato.calidad)
    }
    if (!blob) return { archivo, achicada: false, ancho: imagen.ancho, alto: imagen.alto }
    if (elegirEnvio({ original: { bytes: archivo.size, ancho: imagen.ancho }, achicada: { bytes: blob.size } }) === 'original') {
      return { archivo, achicada: false, ancho: imagen.ancho, alto: imagen.alto }
    }
    const nuevo = new File([blob], nombreConExtension(archivo.name, formato.tipo), {
      type: formato.tipo,
      lastModified: archivo.lastModified,
    })
    return { archivo: nuevo, achicada: true, ancho: destino.ancho, alto: destino.alto }
  } finally {
    imagen.cerrar()
    // Safari retiene la memoria de un lienzo hasta que se lo achica.
    lienzo.width = 0
    lienzo.height = 0
  }
}
