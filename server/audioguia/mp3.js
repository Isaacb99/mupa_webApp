// El validador de los MP3 de la audioguía (especificación de las audioguías, versión 2, sección 1.3), sin dependencias.
// Lo único que pone archivos en audioguias/ somos nosotros, con tools/audioguia-mp3.mjs: esto ataja un error nuestro (un
// WAV olvidado, un VBR, un estéreo, un archivo cortado) antes del deploy, no a un tercero. Los mensajes son técnicos y
// cortos, para nosotros (van al log y a la salida de npm test).
//
// leerMp3({ leer(posicion, largo) → Buffer, bytes }) lee por posiciones: al arrancar se leen unos pocos kB por pista,
// nunca los 70 archivos enteros (Render tiene 512 MB). Hace esto:
// 1. Saltea la etiqueta ID3v2 si está (el tamaño, en los bytes 6 a 9 en syncsafe, más los 10 del encabezado y 10 más si
//    trae pie, el flag 0x10 del byte 5) y descuenta un TAG (ID3v1) de 128 bytes al final.
// 2. Busca la primera sincronía en los primeros 4 kB después del ID3.
// 3. Exige un cuadro MPEG-1 Layer III (el índice de bitrate distinto de 0000 y 1111, la frecuencia no reservada) y otro
//    con la misma cabecera (salvo el relleno y el bit privado, que cambian de un cuadro a otro en un CBR) justo donde
//    termina el primero: floor(144 × bitrate / frecuencia) + relleno. Un FF FB suelto en la etiqueta o en el audio no
//    alcanza (H4 de la verificación de la versión 1): si el segundo no está, se sigue buscando.
// 4. CBR obligatorio: un encabezado Xing o VBRI en el primer cuadro es un VBR y se rechaza; Info (LAME lo escribe
//    también en CBR) se acepta, y ese cuadro no cuenta como audio.
// 5. 44.100 Hz y mono obligatorios. El bitrate se devuelve: la comparación con el que declara el manifiesto (64, u 80
//    con kbps o kbpsAd) la hace cargarPistas (server/audioguia/pistas.js).
// 6. El final (revisión adversarial del 20/11/2026: sin esto pasaban un archivo cortado a la mitad de un cuadro, uno con
//    algo pegado atrás y un VBR sin encabezado Xing, con la duración mal): desde alguno de los últimos cuadros, la
//    cadena de cuadros con la misma cabecera que el primero termina justo donde termina el audio (antes del TAG). Se
//    leen los últimos tres cuadros, unos 630 bytes a 64 kbps.
// 7. La duración, (bytes de audio × 8) / bitrate, redondeada al segundo. Topes: 3 MB por archivo (unos 6 minutos a 64
//    kbps) y de 20 s a 5 min.
// Antes del tope de 3 MB se mira si es un WAV, un FLAC o un M4A: un máster WAV de una estación pesa unos 6 MB, y «pesa
// más de 3 MB» no decía qué estaba mal.
import { closeSync, fstatSync, openSync, readSync } from 'node:fs'

/** El tamaño máximo de un MP3 publicado. */
export const BYTES_MAX = 3 * 1024 * 1024
/** La duración mínima y máxima, en segundos (las estaciones duran de 60 a 90 s; con la audiodescripción, algo más). */
export const DURACION_MIN_S = 20
export const DURACION_MAX_S = 5 * 60
/** La única frecuencia que se acepta. */
export const FRECUENCIA = 44_100
/** Dónde se busca la primera sincronía, después del ID3. */
const BUSQUEDA = 4 * 1024
/** El cuadro más largo de MPEG-1 Layer III (320 kbps a 32 kHz con relleno): para leer de una vez el segundo. */
const CUADRO_MAX = 1441

// MPEG-1 Layer III: los bitrates por índice (en kbps; 0 y 15 no valen) y las frecuencias por índice (3, reservada).
const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
const FRECUENCIAS = [44_100, 48_000, 32_000]
// Lo que tiene que ser igual en dos cuadros de un CBR: todo el byte 1 (versión, capa, CRC), del byte 2 el bitrate y la
// frecuencia (no el relleno ni el bit privado) y del byte 3 el modo de canales.
const MASCARA = [0xff, 0xff, 0xfc, 0xc0]

/** Lo que dice el error de un archivo que no es un MP3, por lo que tiene al principio. */
function queEs(inicio) {
  const texto = inicio.subarray(0, 4).toString('latin1')
  if (texto === 'RIFF') return 'no es MP3 (empieza con RIFF: es un WAV)'
  if (texto === 'fLaC') return 'no es MP3 (es un FLAC)'
  if (texto === 'OggS') return 'no es MP3 (es un Ogg)'
  if (inicio.subarray(4, 8).toString('latin1') === 'ftyp') return 'no es MP3 (es un M4A o un MP4)'
  return null
}

/** La cabecera de un cuadro MPEG-1 Layer III en esa posición del buffer, o null si no lo es. */
function cabecera(buf, i) {
  if (i + 4 > buf.length) return null
  const [b0, b1, b2, b3] = [buf[i], buf[i + 1], buf[i + 2], buf[i + 3]]
  // 11 bits de sincronía, MPEG-1 (11) y Layer III (01): 0xFA o 0xFB, según traiga CRC o no.
  if (b0 !== 0xff || (b1 & 0xfe) !== 0xfa) return null
  const kbps = BITRATES[b2 >> 4]
  const hz = FRECUENCIAS[(b2 >> 2) & 0x03]
  if (!kbps || !hz) return null
  const relleno = (b2 >> 1) & 0x01
  return {
    kbps,
    hz,
    mono: b3 >> 6 === 3,
    crc: (b1 & 0x01) === 0,
    largo: Math.floor((144 * kbps * 1000) / hz) + relleno,
  }
}

const mismaCabecera = (buf, a, b) => MASCARA.every((m, k) => (buf[a + k] & m) === (buf[b + k] & m))
/** ¿En esa posición de buf hay una cabecera igual (con la máscara) a la de referencia? */
const igualA = (buf, i, ref) => i + 4 <= buf.length && MASCARA.every((m, k) => (buf[i + k] & m) === (ref[k] & m))

/**
 * ¿Los últimos bytes del audio terminan en un cuadro entero? Desde alguna posición del principio de la cola (los
 * cuadros miden largo o largo + 1 con el relleno, así que en los primeros largo + 1 bytes empieza uno), la cadena de
 * cuadros con la cabecera de referencia tiene que llegar justo al final.
 */
function terminaEntero(cola, ref, largo) {
  for (let i = 0; i <= Math.min(largo, cola.length - 4); i++) {
    let pos = i
    while (igualA(cola, pos, ref)) {
      pos += cabecera(cola, pos).largo
      if (pos === cola.length) return true
    }
  }
  return false
}

/**
 * Valida un MP3 y da su duración.
 * @param {{ leer: (posicion: number, largo: number) => Buffer, bytes: number }} archivo  un lector por posiciones
 *   (leerMp3DeArchivo o lectorDeBuffer) y el tamaño del archivo
 * @returns {{ duracionS: number, kbps: number, hz: number, canales: 1 }}
 * @throws {Error} con un mensaje corto que dice qué está mal
 */
export function leerMp3({ leer, bytes }) {
  if (!Number.isInteger(bytes) || bytes <= 0) throw new Error('está vacío')
  const principio = leer(0, 10)
  const otro = queEs(principio)
  if (otro) throw new Error(otro)
  if (bytes > BYTES_MAX) throw new Error('pesa más de 3 MB')

  // 1. El ID3v2 de adelante y el TAG de atrás.
  let inicio = 0
  if (principio.length >= 10 && principio.subarray(0, 3).toString('latin1') === 'ID3') {
    const tamano = ((principio[6] & 0x7f) << 21) | ((principio[7] & 0x7f) << 14) | ((principio[8] & 0x7f) << 7) | (principio[9] & 0x7f)
    inicio = 10 + tamano + (principio[5] & 0x10 ? 10 : 0)
    if (inicio >= bytes) throw new Error('está cortado: termina adentro de la etiqueta ID3')
  }
  let fin = bytes
  if (bytes - inicio >= 128 && leer(bytes - 128, 3).toString('latin1') === 'TAG') fin = bytes - 128

  // 2 y 3. La primera sincronía de un cuadro MPEG-1 Layer III seguido de otro con la misma cabecera.
  const buf = leer(inicio, Math.min(fin - inicio, BUSQUEDA + CUADRO_MAX + 4))
  let primero = -1
  let datos = null
  for (let i = 0; i < Math.min(buf.length, BUSQUEDA); i++) {
    const c = cabecera(buf, i)
    if (!c) continue
    const siguiente = i + c.largo
    if (inicio + siguiente + 4 > fin) throw new Error('está cortado: termina antes del segundo cuadro')
    if (cabecera(buf, siguiente) && mismaCabecera(buf, i, siguiente)) {
      primero = i
      datos = c
      break
    }
  }
  if (!datos) throw new Error('no se encontraron dos cuadros MPEG-1 Layer III seguidos en los primeros 4 kB')

  // 4. CBR: el encabezado de LAME va después de la información lateral (17 bytes en mono, 32 en estéreo, más el CRC).
  const lateral = primero + 4 + (datos.crc ? 2 : 0) + (datos.mono ? 17 : 32)
  const xing = buf.subarray(lateral, lateral + 4).toString('latin1')
  if (xing === 'Xing' || buf.subarray(primero + 36, primero + 40).toString('latin1') === 'VBRI') {
    throw new Error('bitrate variable: exportá en CBR')
  }

  // 5. La frecuencia y los canales.
  if (datos.hz !== FRECUENCIA) throw new Error(`${datos.hz / 1000} kHz: exportá a 44,1 kHz`)
  if (!datos.mono) throw new Error('estéreo: exportá en mono')

  // 6. El final: el último cuadro termina donde termina el audio.
  const ref = Buffer.from(buf.subarray(primero, primero + 4))
  const desde = Math.max(inicio + primero, fin - 3 * (datos.largo + 1))
  if (!terminaEntero(leer(desde, fin - desde), ref, datos.largo)) {
    throw new Error('está cortado o no es CBR: el último cuadro no termina donde termina el archivo')
  }

  // 7. La duración, sin el cuadro Info (no es audio).
  const audio = fin - inicio - primero - (xing === 'Info' ? datos.largo : 0)
  const duracionS = Math.round((audio * 8) / (datos.kbps * 1000))
  if (duracionS < DURACION_MIN_S) throw new Error(`dura ${duracionS} s: menos de ${DURACION_MIN_S} s`)
  if (duracionS > DURACION_MAX_S) throw new Error(`dura ${duracionS} s: más de 5 minutos`)
  return { duracionS, kbps: datos.kbps, hz: datos.hz, canales: 1 }
}

/** Un lector por posiciones sobre un buffer en memoria (las pruebas). */
export function lectorDeBuffer(buffer) {
  return {
    bytes: buffer.length,
    leer: (posicion, largo) => buffer.subarray(posicion, Math.min(buffer.length, posicion + largo)),
  }
}

/**
 * Valida un MP3 del disco leyendo solo lo que hace falta (fs.openSync y fs.readSync, de a unos pocos kB).
 * @param {string} ruta
 * @returns {{ duracionS: number, kbps: number, hz: number, canales: 1, bytes: number }}
 */
export function leerMp3DeArchivo(ruta) {
  const fd = openSync(ruta, 'r')
  try {
    const bytes = fstatSync(fd).size
    const leer = (posicion, largo) => {
      const buf = Buffer.alloc(Math.max(0, Math.min(largo, bytes - posicion)))
      const leidos = buf.length ? readSync(fd, buf, 0, buf.length, posicion) : 0
      return buf.subarray(0, leidos)
    }
    return { ...leerMp3({ leer, bytes }), bytes }
  } finally {
    closeSync(fd)
  }
}
