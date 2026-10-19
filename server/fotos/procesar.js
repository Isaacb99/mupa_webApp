// El procesado de una foto subida (plan 7), con sharp. Lo llama server/api/fotos.js adentro de la cola
// (server/fotos/cola.js: de a una, con 60 s de tope).
// 1. El tipo real, por los primeros bytes (la firma) y después por sharp: solo JPEG, PNG o WebP (415 si no). Lo que
//    no tiene la firma de uno de esos tres nunca llega a sharp: ni un SVG (sharp lo dibujaría) ni un HEIC (los binarios
//    de sharp no lo leen, sharp #1105), cada uno con su mensaje.
// 2. Los píxeles, leyendo solo el encabezado: más de 50 megapíxeles (FOTO_PIXELES_MAX) es un 413 sin decodificar nada.
//    sharp los vuelve a limitar al procesar (limitInputPixels). Un JPG progresivo o un PNG entrelazado no se pueden
//    leer de a franjas: libvips los decodifica enteros en memoria. Si eso pasa de MEMORIA_PROGRESIVA_MAX
//    (memoriaAlDecodificar), también 413 sin decodificar (corrección de E3, 16/10/2026: un PNG entrelazado de 16 bits de
//    7000x7000, de 578 kB, llevaba el proceso de 58 a 525 MB, más que lo que tiene Render; uno de 8 bits de ese tamaño
//    o un JPG progresivo 4:2:0 de 50 megapíxeles suben unos 180 MB y pasan).
// 3. Cinco salidas desde la misma entrada, orientada según su EXIF (autoOrient) y sin agrandar (withoutEnlargement):
//    480, 960 y 1600 px de ancho en WebP calidad 78, la maestra de 2400 en WebP calidad 90 y og.jpg de 1200 en JPEG
//    (mozjpeg, calidad 80), sobre blanco si la foto tiene transparencia (el JPEG no la tiene y si no quedaría negro).
//    Ninguna pasa de LADO_MAX de alto (WebP no admite más de 16383 px por lado: una captura larga de teléfono daba
//    "dañada"). sharp no copia los metadatos a la salida salvo que se le pida (keepMetadata): el EXIF, el GPS y el ICC no
//    salen (lo verifica server/pruebas/fotos.test.js). Los colores pasan a sRGB.
// Con sharp.concurrency(1) y sin su caché: una sola foto ocupa la memoria a la vez (Render tiene 512 MB). El navegador
// achica las fotos grandes antes de mandarlas (panel/src/achicarFoto.js), así lo común es una foto de hasta 2400 px.
// Cada salida vuelve a decodificar la entrada (cinco veces; la memoria es la de una sola, porque van de a una): con una
// foto achicada es poco, con una de 49 megapíxeles de 16 bits sin achicar son unos 6 s.
import sharp from 'sharp'
import {
  ANCHO_MAESTRA,
  ANCHOS_FOTO,
  FOTO_PIXELES_MAX,
  MENSAJE_DANADA,
  MENSAJE_HEIC,
  MENSAJE_PROGRESIVA,
  MENSAJE_SVG,
  MENSAJE_TIPO,
  MENSAJE_VACIA,
  mensajePixeles,
} from '../../compartido/fotos.js'
import { httpError } from '../errores.js'

sharp.concurrency(1)
sharp.cache(false)

const CALIDAD = 78
const CALIDAD_MAESTRA = 90
const ANCHO_OG = 1200
const CALIDAD_OG = 80
/** El alto máximo de una salida: el lado más largo que admite WebP. */
export const LADO_MAX = 16_383
/**
 * Lo que puede ocupar en memoria decodificar entera una imagen progresiva (JPG progresivo, PNG entrelazado). Medido el
 * 16/10/2026 (tools/salida/e3-correccion-1/medir-memoria.mjs): el proceso sube 1,1 a 1,4 veces lo que da
 * memoriaAlDecodificar; con 160 MB, como mucho unos 200 MB por encima de lo que ya usa.
 */
export const MEMORIA_PROGRESIVA_MAX = 160 * 1024 * 1024

const BYTES_POR_MUESTRA = { uchar: 1, char: 1, ushort: 2, short: 2, uint: 4, int: 4, float: 4, double: 8 }
// Cuántos planos enteros suman los componentes de un JPG según su submuestreo de color (el de luz entero y los de
// color achicados): 4:2:0 es uno y medio. Sin el dato, se cuenta un plano por canal (el peor caso, 4:4:4).
const PLANOS_JPEG = { '4:4:4': 3, '4:2:2': 2, '4:4:0': 2, '4:2:0': 1.5, '4:1:1': 1.5, '4:4:4:4': 4, '4:2:2:4': 3, '4:2:0:4': 2.5 }

/**
 * Los bytes que hay que tener en memoria para decodificar la imagen (de su metadata): 0 si se lee de a franjas (lo
 * común). Un PNG entrelazado se decodifica entero (ancho × alto × canales × bytes por muestra); un JPG progresivo guarda
 * todos sus coeficientes, de 16 bits, por cada plano de color.
 * @param {import('sharp').Metadata} meta
 */
export function memoriaAlDecodificar(meta) {
  if (!meta?.isProgressive) return 0
  const pixeles = (meta.width ?? 0) * (meta.height ?? 0)
  const canales = meta.channels ?? 4
  if (meta.format === 'jpeg') return pixeles * (PLANOS_JPEG[meta.chromaSubsampling] ?? canales) * 2
  return pixeles * canales * (BYTES_POR_MUESTRA[meta.depth] ?? 1)
}

/** El formato por los primeros bytes: 'jpeg', 'png', 'webp' o null. */
export function formatoPorFirma(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
    return 'webp'
  }
  return null
}

// Las marcas de HEIF/HEIC de la caja ftyp (ISO/IEC 23008-12). mif1 y msf1 son genéricas: también las usa AVIF, así
// que con esas se buscan heic o heix entre las compatibles.
const MARCAS_HEIC = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'])
const MARCAS_GENERICAS = new Set(['mif1', 'msf1', 'mif2'])

/** ¿Es un HEIC (una foto de iPhone sin convertir)? */
export function pareceHeic(buf) {
  if (buf.length < 12 || buf.toString('latin1', 4, 8) !== 'ftyp') return false
  const marca = buf.toString('latin1', 8, 12)
  if (MARCAS_HEIC.has(marca)) return true
  if (!MARCAS_GENERICAS.has(marca)) return false
  const largo = Math.min(buf.readUInt32BE(0), buf.length, 256)
  const compatibles = buf.toString('latin1', 16, largo)
  return /heic|heix/.test(compatibles)
}

/** ¿Empieza como texto o XML (un SVG, un HTML)? Sin contar un BOM ni los espacios del principio. */
export function pareceSvg(buf) {
  const inicio = buf.subarray(0, 512).toString('utf8').replace(/^﻿/, '').trimStart()
  return inicio.startsWith('<') && /<svg[\s>]/i.test(buf.subarray(0, 4096).toString('utf8'))
}

/** El 415 de un archivo que no es JPEG, PNG ni WebP, con el mensaje que corresponde. */
function tipoNoAdmitido(buf) {
  const mensaje = pareceHeic(buf) ? MENSAJE_HEIC : pareceSvg(buf) ? MENSAJE_SVG : MENSAJE_TIPO
  return httpError(415, mensaje, { campos: { foto: mensaje } })
}

const segundosHasta = (hasta) => Math.max(1, Math.ceil((hasta - Date.now()) / 1000))

/** Lo que dice sharp cuando vence su timeout ("timeout: 30% complete"). */
const esTimeout = (err) => /timeout/i.test(err?.message ?? '')

/**
 * @typedef {object} FotoProcesada
 * @property {number} ancho  el de la maestra, ya orientada
 * @property {number} alto
 * @property {number[]} variantes  los anchos guardados (ANCHOS_FOTO)
 * @property {number} bytes  lo que ocupan los cinco archivos
 * @property {{ variante: string, datos: Buffer, ancho: number, alto: number }[]} archivos
 */

/**
 * @param {Buffer} buffer  el archivo tal como llegó
 * @param {{ hasta?: number }} [opciones]  hasta: el tope (Date.now() + 60 s, lo pone la cola)
 * @returns {Promise<FotoProcesada>}
 */
export async function procesarFoto(buffer, { hasta = Date.now() + 60_000 } = {}) {
  if (!buffer?.length) throw httpError(400, MENSAJE_VACIA, { campos: { foto: MENSAJE_VACIA } })
  const formato = formatoPorFirma(buffer)
  if (!formato) throw tipoNoAdmitido(buffer)

  let meta
  try {
    // Solo el encabezado: sin el límite de píxeles, para poder decir cuántos tiene.
    meta = await sharp(buffer, { limitInputPixels: false }).metadata()
  } catch {
    throw httpError(400, MENSAJE_DANADA, { campos: { foto: MENSAJE_DANADA } })
  }
  // La firma dice una cosa y el contenido otra: no se procesa.
  if (meta.format !== formato) throw tipoNoAdmitido(buffer)
  const pixeles = (meta.width ?? 0) * (meta.height ?? 0)
  if (!pixeles) throw httpError(400, MENSAJE_DANADA, { campos: { foto: MENSAJE_DANADA } })
  if (pixeles > FOTO_PIXELES_MAX) {
    const mensaje = mensajePixeles(pixeles)
    throw httpError(413, mensaje, { campos: { foto: mensaje } })
  }
  if (memoriaAlDecodificar(meta) > MEMORIA_PROGRESIVA_MAX) {
    throw httpError(413, MENSAJE_PROGRESIVA, { campos: { foto: MENSAJE_PROGRESIVA } })
  }

  // Hasta el ancho de cada salida y LADO_MAX de alto, con la proporción de la foto y sin agrandar.
  const medida = (ancho) => ({ width: ancho, height: LADO_MAX, fit: 'inside', withoutEnlargement: true })
  const base = sharp(buffer, { limitInputPixels: FOTO_PIXELES_MAX }).autoOrient()
  const salidas = [
    ...ANCHOS_FOTO.map((ancho) => ({
      variante: String(ancho),
      armar: (s) => s.resize(medida(ancho)).webp({ quality: ancho === ANCHO_MAESTRA ? CALIDAD_MAESTRA : CALIDAD }),
    })),
    {
      variante: 'og',
      armar: (s) =>
        s
          .resize(medida(ANCHO_OG))
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: CALIDAD_OG, mozjpeg: true }),
    },
  ]

  const archivos = []
  try {
    for (const { variante, armar } of salidas) {
      const { data, info } = await armar(base.clone())
        .timeout({ seconds: segundosHasta(hasta) })
        .toBuffer({ resolveWithObject: true })
      archivos.push({ variante, datos: data, ancho: info.width, alto: info.height })
      if (Date.now() > hasta) throw new Error('timeout: tope de la cola')
    }
  } catch (err) {
    if (err?.paraLaPersona) throw err
    if (esTimeout(err)) {
      throw httpError(503, 'La foto tardó demasiado en procesarse. Probá de nuevo en un rato.')
    }
    if (/pixel limit/i.test(err?.message ?? '')) {
      const mensaje = mensajePixeles(pixeles)
      throw httpError(413, mensaje, { campos: { foto: mensaje } })
    }
    // Datos dañados o truncados (failOn 'warning', el que sharp recomienda para lo que sube la gente).
    throw httpError(400, MENSAJE_DANADA, { campos: { foto: MENSAJE_DANADA } })
  }

  const maestra = archivos.find((a) => a.variante === String(ANCHO_MAESTRA))
  return {
    ancho: maestra.ancho,
    alto: maestra.alto,
    variantes: [...ANCHOS_FOTO],
    bytes: archivos.reduce((total, a) => total + a.datos.length, 0),
    archivos,
  }
}
