// Las firmas de la audioguía (especificación de las audioguías, versión 2, secciones 3.1 a 3.3): el código impreso en
// cada QR y el token de día, que viaja en la cookie de la página y en el ?t= del audio. Código puro, sin Express: recibe
// la clave (AUDIOGUIA_CLAVE), la versión de los códigos (la de audioguias/pistas.json) y el día de San Juan como
// argumentos; la conexión con server/config.js y con las rutas es de la etapa siguiente.
//
// - Dos claves derivadas, una por uso (3.1): kQR = HMAC-SHA256(clave, 'mupa-audioguia-qr') firma los códigos de los QR y
//   kDia = HMAC-SHA256(clave, 'mupa-audioguia-dia') los tokens de día. Así un token de día nunca pasa por un código de
//   QR ni al revés, aunque alguien arme el texto a mano.
// - Cada firma son los primeros 22 caracteres del HMAC en base64url (132 bits).
// - El código del QR (permanente, impreso): <espacio>.<version>.<firma(kQR, 'qr|' + version + '|' + espacio)>. El
//   espacio va firmado solo para ubicar el reproductor: cualquier QR válido habilita todo. ?v=ad no va en la firma: es
//   presentación (A10), y lo lee server/audioguia/acceso.js.
// - El token de día: <version>.<AAAA-MM-DD>.<firma(kDia, 'dia|' + version + '|' + dia)>. Vale con la versión del
//   manifiesto y el día de hoy en San Juan (lo calcula quien llama con el reloj del servidor).
// - Se compara como esMarcaDeEnviado (server/contacto.js): primero que sea un string con la forma (un ?t=a&t=b llega
//   como un arreglo y no vale), después la firma con timingSafeEqual sobre dos buffers del mismo largo. Nunca se
//   compara un texto armado con lo que llega sin haber mirado antes la forma, y lo que no tiene la forma no se firma.
// - Lo que devuelven las comprobaciones es un motivo corto (forma, firma, version, espacio, dia) para el log: nunca el
//   código, la firma ni el token (sección 4).
import { createHmac, timingSafeEqual } from 'node:crypto'

/** La forma de AUDIOGUIA_CLAVE (la misma regla que va a validar server/config.js, 2.1). */
export const FORMA_DE_LA_CLAVE = /^[A-Za-z0-9_-]{32,128}$/
/** Cuántos caracteres de base64url lleva cada firma (132 bits). */
export const LARGO_FIRMA = 22
/** La versión de los códigos: un entero de 1 a 999 (A9: la de audioguias/pistas.json, que nunca baja). */
export const VERSION_MIN = 1
export const VERSION_MAX = 999

/** El código de un QR: el id del espacio, la versión y la firma (3.2). La usa también tools/audioguia-qr.mjs. */
export const FORMA_DEL_CODIGO = /^([a-z0-9-]{1,40})\.([1-9][0-9]{0,2})\.([A-Za-z0-9_-]{22})$/
/** El token de día: la versión, el día de San Juan y la firma (3.3). */
const FORMA_DEL_TOKEN = /^([1-9][0-9]{0,2})\.(\d{4}-\d{2}-\d{2})\.([A-Za-z0-9_-]{22})$/
const FORMA_DEL_DIA = /^\d{4}-\d{2}-\d{2}$/

const hmac = (clave, texto) => createHmac('sha256', clave).update(texto).digest()

/**
 * Las dos claves derivadas de AUDIOGUIA_CLAVE. Tira si la clave no tiene la forma: sin clave, el módulo queda apagado
 * antes de llegar acá (2.2), así que una clave mala es un error de configuración, no del pedido.
 * @param {string} clave  AUDIOGUIA_CLAVE
 * @returns {{ kQR: Buffer, kDia: Buffer }}
 */
export function crearClaves(clave) {
  if (typeof clave !== 'string' || !FORMA_DE_LA_CLAVE.test(clave)) {
    throw new Error('AUDIOGUIA_CLAVE tiene que tener de 32 a 128 caracteres de base64url')
  }
  return Object.freeze({ kQR: hmac(clave, 'mupa-audioguia-qr'), kDia: hmac(clave, 'mupa-audioguia-dia') })
}

/** La firma de un texto con una de las claves derivadas: 22 caracteres de base64url. */
export const firmar = (k, texto) => hmac(k, texto).toString('base64url').slice(0, LARGO_FIRMA)

/** ¿La firma que llegó es la esperada? (Las dos tienen el largo de la forma, que ya se comprobó.) */
function mismaFirma(esperada, recibida) {
  const a = Buffer.from(esperada)
  const b = Buffer.from(recibida)
  return a.length === b.length && timingSafeEqual(a, b)
}

function exigirVersion(version) {
  if (!Number.isInteger(version) || version < VERSION_MIN || version > VERSION_MAX) {
    throw new Error(`la versión de los códigos tiene que ser un entero de ${VERSION_MIN} a ${VERSION_MAX}`)
  }
}

/**
 * El código del QR de un espacio (lo que va después de /audioguia/q/). Lo usan el script de las URL, en el Shell de
 * Render, y las pruebas (8.1).
 * @param {{ kQR: Buffer }} claves  las de crearClaves
 * @param {string} espacio  el id del espacio (sala-2, recepcion…)
 * @param {number} version  la de audioguias/pistas.json
 */
export function codigoDeQr(claves, espacio, version) {
  exigirVersion(version)
  if (typeof espacio !== 'string' || !/^[a-z0-9-]{1,40}$/.test(espacio)) throw new Error('el id del espacio no tiene la forma')
  return `${espacio}.${version}.${firmar(claves.kQR, `qr|${version}|${espacio}`)}`
}

/**
 * ¿El código de un QR vale? En este orden: la forma, la firma (con la versión que trae el código), la versión de hoy y
 * que el espacio esté en el recorrido. Un código de otra versión bien firmado da 'version' (un QR viejo); uno con la
 * firma mala, 'firma', aunque además sea de otra versión.
 * @param {{ kQR: Buffer }} claves
 * @param {unknown} codigo  lo que llegó en la ruta
 * @param {{ version: number, espacios: Set<string> | string[] }} esperado  la versión del manifiesto y los espacios
 *   del recorrido (los que tienen alguna estación válida)
 * @returns {{ ok: true, espacio: string } | { ok: false, motivo: 'forma' | 'firma' | 'version' | 'espacio' }}
 */
export function leerCodigoDeQr(claves, codigo, { version, espacios }) {
  if (typeof codigo !== 'string' || codigo.length > 80) return { ok: false, motivo: 'forma' }
  const m = FORMA_DEL_CODIGO.exec(codigo)
  if (!m) return { ok: false, motivo: 'forma' }
  const [, espacio, textoVersion, firma] = m
  if (!mismaFirma(firmar(claves.kQR, `qr|${textoVersion}|${espacio}`), firma)) return { ok: false, motivo: 'firma' }
  if (Number(textoVersion) !== version) return { ok: false, motivo: 'version' }
  const enElRecorrido = espacios instanceof Set ? espacios.has(espacio) : espacios.includes(espacio)
  if (!enElRecorrido) return { ok: false, motivo: 'espacio' }
  return { ok: true, espacio }
}

/**
 * El token de día de hoy (la cookie de la página y el ?t= del audio, 3.3).
 * @param {{ kDia: Buffer }} claves
 * @param {number} version  la de audioguias/pistas.json
 * @param {string} dia  hoy en San Juan, "AAAA-MM-DD" (hoyEnSanJuan(reloj()) de compartido/fechas.js)
 */
export function tokenDeDia(claves, version, dia) {
  exigirVersion(version)
  if (typeof dia !== 'string' || !FORMA_DEL_DIA.test(dia)) throw new Error('el día tiene que ser AAAA-MM-DD')
  return `${version}.${dia}.${firmar(claves.kDia, `dia|${version}|${dia}`)}`
}

/**
 * ¿El token de día vale hoy? La forma, la firma, la versión y el día, en ese orden. Un token de ayer (o de otra
 * versión) bien firmado es un permiso vencido: la página dice 'vencido' y el audio da 403.
 * @param {{ kDia: Buffer }} claves
 * @param {unknown} valor  la cookie o el ?t= (que llega como arreglo si viene dos veces: no vale)
 * @param {{ version: number, hoy: string }} esperado  la versión del manifiesto y hoy en San Juan
 * @returns {{ ok: true } | { ok: false, motivo: 'forma' | 'firma' | 'version' | 'dia' }}
 */
export function leerTokenDeDia(claves, valor, { version, hoy }) {
  if (typeof valor !== 'string' || valor.length > 40) return { ok: false, motivo: 'forma' }
  const m = FORMA_DEL_TOKEN.exec(valor)
  if (!m) return { ok: false, motivo: 'forma' }
  const [, textoVersion, dia, firma] = m
  if (!mismaFirma(firmar(claves.kDia, `dia|${textoVersion}|${dia}`), firma)) return { ok: false, motivo: 'firma' }
  if (Number(textoVersion) !== version) return { ok: false, motivo: 'version' }
  if (dia !== hoy) return { ok: false, motivo: 'dia' }
  return { ok: true }
}

/** Atajo: ¿el token de día vale hoy? */
export const esTokenDeDia = (claves, valor, esperado) => leerTokenDeDia(claves, valor, esperado).ok
