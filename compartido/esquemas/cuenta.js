// Mi cuenta (plan 4.3 y 4.4): el nombre propio y el cambio de contraseña, que también es el cambio obligatorio del
// primer ingreso con la temporal. Solo servidor y panel.
//
// Reglas de las contraseñas (NIST SP 800-63B-4, plan 4.4): de 15 a 128 caracteres, sin reglas de composición. Se
// rechazan las que contienen "mupa", "museo" o "paleontologico" (sin importar mayúsculas ni tildes), las de un solo
// carácter repetido, la misma que la actual (incluida la temporal, también escrita en mayúsculas o sin los guiones) y
// las que contienen la parte local del correo (si tiene 4 caracteres o más: con una más corta, "ana@…", se
// rechazarían frases comunes). Los caracteres se cuentan después de normalizar a NFKC, que es lo que se guarda
// (server/auth/claves.js): una letra con tilde cuenta una vez.
// Además, tal como llega (antes de normalizar), no puede pasar de CLAVE_MAX_CRUDA unidades: es el tope del inicio de
// sesión (compartido/esquemas/sesion.js) y del campo "actual". Si no, una frase escrita con las tildes separadas
// (NFD: 100 letras con dos tildes son 300 unidades y 100 caracteres) se aceptaría acá y después no dejaría entrar.
import { nombrePersona } from './usuarios.js'
import { z } from './zod.js'

export const CLAVE_MIN = 15
export const CLAVE_MAX = 128
/** Tope de la contraseña tal como llega (unidades UTF-16, sin normalizar): ingreso, actual y nueva. */
export const CLAVE_MAX_CRUDA = 256

const PROHIBIDAS = [
  ['mupa', 'mupa'],
  ['museo', 'museo'],
  ['paleontologico', 'paleontológico'],
]

/** Minúsculas y sin tildes, para comparar. */
const plegar = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
/** Además, solo letras y números: "K7MQ X3TF…" y "k7mq-x3tf-…" son la misma. */
const esqueleto = (texto) => plegar(texto.normalize('NFKC')).replace(/[^\p{L}\p{N}]/gu, '')

/**
 * El primer problema de una contraseña nueva, o null si sirve.
 * @param {string} clave
 * @param {{ email?: string, actual?: string }} [contexto]
 */
export function problemaDeClave(clave, { email, actual } = {}) {
  const normalizada = clave.normalize('NFKC')
  const largo = [...normalizada].length
  if (largo < CLAVE_MIN) return `Tiene que tener al menos ${CLAVE_MIN} caracteres. Probá con una frase de tres o cuatro palabras.`
  if (largo > CLAVE_MAX || clave.length > CLAVE_MAX_CRUDA) return `Puede tener hasta ${CLAVE_MAX} caracteres.`
  if (/^(.)\1*$/su.test(normalizada)) return 'No puede ser un mismo carácter repetido.'
  const plegada = plegar(normalizada)
  for (const [prohibida, mostrar] of PROHIBIDAS) {
    if (plegada.includes(prohibida)) return `No puede contener "${mostrar}".`
  }
  const local = email ? plegar(email.split('@')[0]) : ''
  if (local.length >= 4 && plegada.includes(local)) return 'No puede contener tu correo.'
  if (actual !== undefined) {
    const deLaActual = esqueleto(actual)
    if (normalizada === actual.normalize('NFKC') || (deLaActual && deLaActual === esqueleto(normalizada))) {
      return 'Tiene que ser distinta de la actual.'
    }
  }
  return null
}

/** PUT /cuenta: { nombre }. */
export const esquemaCuenta = z.object({ nombre: nombrePersona })

/** PUT /cuenta/clave: { actual, nueva }. La regla del correo la agrega el servidor, que sabe de quién es la cuenta. */
export const esquemaCambioClave = z
  .object({
    actual: z
      .string({ error: 'Escribí tu contraseña actual.' })
      .min(1, { error: 'Escribí tu contraseña actual.' })
      .max(CLAVE_MAX_CRUDA, { error: 'La contraseña actual no es correcta.' }),
    nueva: z
      .string({ error: 'Escribí la contraseña nueva.' })
      .max(CLAVE_MAX_CRUDA, { error: `Puede tener hasta ${CLAVE_MAX} caracteres.` }),
  })
  .superRefine((v, ctx) => {
    const problema = problemaDeClave(v.nueva, { actual: v.actual })
    if (problema) ctx.addIssue({ code: 'custom', path: ['nueva'], message: problema })
  })
