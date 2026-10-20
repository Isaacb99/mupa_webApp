// Esperas con tope de tiempo: una base colgada (o un servidor de correo lento) no puede dejar a una página ni al
// formulario de contacto sin respuesta. Lo usan probarBase (server/db/conexion.js), el museo de cada página
// (server/museo.js), las páginas internas (server/contenido-publico.js) y el formulario de contacto (server/contacto.js).
// Un solo lugar para el patrón (COD-04 de la verificación de E4): antes había cuatro copias de la misma carrera.
import { codigoDeError } from './log.js'

/** El código del error de un tope vencido. */
export const TOPE = 'TOPE'

/**
 * Lo que da la promesa, o un error con code 'TOPE' si no termina en `ms`. Si gana el tope, la promesa sigue y termina
 * (o falla) sola: su rechazo queda atendido, así no aparece un "unhandled rejection" más tarde. Quien necesite saber
 * cómo terminó (el formulario de contacto: si el mensaje se guardó igual) la sigue mirando por su cuenta.
 * @template T
 * @param {Promise<T>} promesa
 * @param {number} ms
 * @param {string} [mensaje]  el del error del tope (va al log de quien lo atrapa)
 * @returns {Promise<T>}
 */
export async function conTope(promesa, ms, mensaje = 'No terminó a tiempo') {
  let reloj
  promesa.catch(() => {})
  const vencida = new Promise((_, rechazar) => {
    reloj = setTimeout(() => rechazar(Object.assign(new Error(mensaje), { code: TOPE })), ms)
  })
  try {
    return await Promise.race([promesa, vencida])
  } finally {
    clearTimeout(reloj)
  }
}

/** ¿Es el error de una consulta que no se pudo hacer (la base caída, colgada o sin migrar)? */
export const esBaseNoDisponible = (err) => err?.code === 'BASE_NO_DISPONIBLE'

/**
 * El error con que una lectura dice que la base no respondió (la página sale con la 503 simple, server/ssr.js), con el
 * código de la causa (TOPE, ECONNREFUSED, 42P01…) para el log.
 * @param {unknown} causa
 */
export function baseNoDisponible(causa) {
  return Object.assign(new Error('La base no respondió'), { code: 'BASE_NO_DISPONIBLE', causa: codigoDeError(causa) })
}
