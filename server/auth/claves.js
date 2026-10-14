// Contraseñas del panel (plan 4.4): argon2id con los parámetros de OWASP y contraseñas temporales.
// - Toda contraseña se normaliza a NFKC antes de calcular o verificar el hash (NIST SP 800-63B-4): la misma frase
//   escrita con una tilde compuesta o precompuesta es la misma contraseña. Las reglas de largo y contenido están en
//   compartido/esquemas/cuenta.js (las usa también el panel).
// - Temporal: 16 caracteres al azar de un alfabeto de 32 sin los que se confunden (ni 0/o ni 1/l, y todo en
//   minúsculas, así tampoco I), en grupos de 4: 80 bits. Se guarda solo su hash, como cualquier contraseña; vence a
//   las 72 h y obliga a cambiarla en el primer ingreso. Nunca va a un log. Como se dicta "en persona o por teléfono",
//   mientras la cuenta la tenga pendiente se acepta escrita en mayúsculas (el autocapitalizado del celular), sin los
//   guiones o con espacios (formaDeTemporal): no cambia los 80 bits, solo cómo se tipea.
// - Hash de relleno: si el correo no existe (o la cuenta está inactiva) se verifica igual contra este hash, así el
//   tiempo de la respuesta no dice si la cuenta existe.
// - argon2 es un módulo nativo y se carga en el primer uso, no al importar este archivo: servidor.js -> app.js ->
//   panel.js -> api/ llega hasta acá, y si el binario no cargara (p. ej. en Render) se caería también la Home. Sin
//   argon2, el sitio público y las rutas del panel que no tocan contraseñas siguen; las que sí (entrar, cambiar la
//   contraseña, dar temporales) responden 503 en JSON y el log dice una vez "argon2_no_disponible" con el motivo.
import { randomBytes } from 'node:crypto'
import { httpError } from '../errores.js'
import { log } from '../log.js'

const PARAMETROS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 }

export const HORAS_TEMPORAL = 72

/** El 401 de una temporal vencida: al entrar (server/api/sesion.js) y con una sesión abierta con ella (middleware). */
export const TEMPORAL_VENCIDA = 'La contraseña temporal venció. Pedile otra a un administrador.'

let argon2Cargado = null
/**
 * El módulo argon2, importado una sola vez. Si no carga, la promesa queda rechazada (reintentar no sirve: el import
 * fallido queda así en el proceso) con un httpError 503, y el motivo va al log una sola vez.
 * @returns {Promise<typeof import('argon2')>}
 */
function cargarArgon2() {
  argon2Cargado ??= import('argon2').then(
    // El export por defecto es el objeto del módulo CommonJS: las pruebas lo espían (mock.method) y se ve acá.
    (modulo) => modulo.default,
    (err) => {
      log('error', 'argon2_no_disponible', err)
      throw httpError(503, 'El panel no está disponible en este momento. Probá más tarde o avisale a quien mantiene el sitio.')
    },
  )
  return argon2Cargado
}

/** @param {string} clave */
export async function hashClave(clave) {
  const argon2 = await cargarArgon2()
  return argon2.hash(clave.normalize('NFKC'), { ...PARAMETROS, type: argon2.argon2id })
}

/**
 * true si la contraseña corresponde al hash. Un hash roto o de otro formato cuenta como incorrecto (con un aviso
 * "hash_invalido" en el log, con el id de la cuenta si se pasa), nunca como un 500 que distinga esa cuenta de las
 * demás.
 * @param {string} hash
 * @param {string} clave
 * @param {{ usuarioId?: number }} [contexto]
 */
export async function verificarClave(hash, clave, { usuarioId } = {}) {
  // Fuera del try: sin argon2 es un 503, no una contraseña incorrecta.
  const argon2 = await cargarArgon2()
  try {
    return await argon2.verify(hash, clave.normalize('NFKC'))
  } catch {
    log('aviso', 'hash_invalido', usuarioId ? { usuario_id: usuarioId } : undefined)
    return false
  }
}

let relleno = null
/**
 * El hash de una contraseña al azar que nadie conoce, calculado una vez por proceso. Si el cálculo falla (p. ej.
 * sin memoria al arrancar), el próximo pedido lo vuelve a intentar: una promesa rechazada guardada para siempre haría
 * que todo correo inexistente diera 500 y uno existente 401, o sea, que se pudiera averiguar qué cuentas existen.
 */
export function hashDeRelleno() {
  relleno ??= hashClave(randomBytes(32).toString('base64url')).catch((err) => {
    relleno = null
    throw err
  })
  return relleno
}

// 24 letras (sin l ni o) + 8 dígitos (sin 0 ni 1) = 32 símbolos: cada byte al azar & 31 elige uno, sin sesgo.
const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'
const DIECISEIS_DEL_ALFABETO = new RegExp(`^[${ALFABETO}]{16}$`)

/** Una contraseña temporal nueva, p. ej. "k7mq-x3tf-9wrd-hp2c". */
export function generarTemporal() {
  const bytes = randomBytes(16)
  let texto = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) texto += '-'
    texto += ALFABETO[bytes[i] & 31]
  }
  return texto
}

/**
 * Lo que alguien escribió como temporal, llevado a la forma en que se generó ("k7mq-x3tf-9wrd-hp2c"): en minúsculas,
 * sin espacios ni guiones (cualquier raya, \p{Pd}: el teclado del celular cambia "-" por "–") de más o de menos. null
 * si no tiene forma de temporal (16 símbolos del alfabeto): entonces se verifica tal cual llegó. Solo se usa con
 * cuentas que tienen una temporal pendiente (debe_cambiar_clave).
 * @param {string} texto
 */
export function formaDeTemporal(texto) {
  const limpio = texto.normalize('NFKC').toLowerCase().replace(/[\s\p{Pd}]/gu, '')
  return DIECISEIS_DEL_ALFABETO.test(limpio) ? limpio.match(/.{4}/g).join('-') : null
}

/** Cuándo vence una temporal dada ahora. */
export const vencimientoTemporal = (ahora = Date.now()) => new Date(ahora + HORAS_TEMPORAL * 3_600_000)
