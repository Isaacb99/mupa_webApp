// Sesiones del panel (plan 4.4): en la tabla sesiones, con una cookie que solo viaja a /administracion.
//
// - Token: 32 bytes al azar en base64url (43 caracteres). En la base va su SHA-256 en hex, nunca el valor: con una
//   copia de la base no se puede entrar. Un token nuevo en cada inicio de sesión y en cada cambio de contraseña.
// - Vida: 12 h como máximo (expira_en) y 2 h sin uso (ultimo_uso, que se renueva como mucho cada 5 minutos para no
//   escribir en cada pedido). Todo se mide con el reloj de la base (now()), así no importa la hora de la máquina.
// - Cookie: __Secure-mupa_sesion; Path=/administracion; HttpOnly; Secure; SameSite=Strict; Max-Age=43200, sin
//   Domain (queda atada al host). Con URL_PUBLICA en http (esta PC), mupa_sesion y sin Secure: el navegador no
//   guardaría una cookie Secure ni una __Secure- que llega por http. No lleva __Host-, que exige Path=/ (viajaría a
//   todo el sitio). Ninguna respuesta pública la pone ni la lee: solo el router de /administracion/api.
// - Se revoca al salir, al cambiar la contraseña, al recibir una temporal y al desactivar o bajar de rol a alguien
//   (server/api/), y en el primer pedido después de que venza la temporal con la que se abrió (server/auth/
//   middleware.js). Las vencidas las borra la tarea diaria (server/tareas.js).
import { createHash, randomBytes } from 'node:crypto'
import { Op, QueryTypes, fn, literal } from 'sequelize'
import { RUTA_PANEL } from '../../compartido/panel.js'

export const DURACION_MAXIMA_S = 12 * 3600
const VIDA = "interval '12 hours'"
const INACTIVIDAD = "interval '2 hours'"
const RENOVACION = "interval '5 minutes'"
// Lo que generamos: 43 caracteres de base64url. Cualquier otra cosa no es una sesión (ni se calcula su hash).
const FORMA_DEL_TOKEN = /^[A-Za-z0-9_-]{43}$/

export const hashDeToken = (token) => createHash('sha256').update(token).digest('hex')

/** Nombre de la cookie según el esquema de URL_PUBLICA. */
export const nombreCookie = (config) => (config.urlPublica.startsWith('https:') ? '__Secure-mupa_sesion' : 'mupa_sesion')

const opcionesCookie = (config) => ({
  path: RUTA_PANEL,
  httpOnly: true,
  secure: config.urlPublica.startsWith('https:'),
  sameSite: 'strict',
})

/** Set-Cookie con el token nuevo: Max-Age de 12 h (Express agrega también Expires). */
export function ponerCookie(res, config, token) {
  res.cookie(nombreCookie(config), token, { ...opcionesCookie(config), maxAge: DURACION_MAXIMA_S * 1000 })
}

/** Set-Cookie que la borra (mismo nombre, Path y flags; Expires en el pasado). */
export function borrarCookie(res, config) {
  res.clearCookie(nombreCookie(config), opcionesCookie(config))
}

/**
 * El token de la cookie de sesión del pedido, o null. Se lee a mano (una sola cookie, sin decodificar: el token es
 * base64url) en vez de sumar cookie-parser.
 */
export function leerToken(req, config) {
  const cabecera = req.get('cookie')
  if (!cabecera) return null
  const nombre = nombreCookie(config)
  for (const parte of cabecera.split(';')) {
    const i = parte.indexOf('=')
    if (i < 0 || parte.slice(0, i).trim() !== nombre) continue
    const valor = parte.slice(i + 1).trim()
    return FORMA_DEL_TOKEN.test(valor) ? valor : null
  }
  return null
}

/**
 * Crea una sesión y devuelve el token (el valor de la cookie). Va dentro de la transacción del que llama cuando la
 * hay (cambio de contraseña: se borran todas y se crea esta en el mismo commit).
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ usuarioId: number, userAgent?: string, transaction?: import('sequelize').Transaction }} datos
 */
export async function crearSesion(sequelize, { usuarioId, userAgent, transaction }) {
  const token = randomBytes(32).toString('base64url')
  await sequelize.query(
    `INSERT INTO sesiones (usuario_id, token_hash, expira_en, user_agent) VALUES (:usuarioId, :hash, now() + ${VIDA}, :ua)`,
    {
      replacements: { usuarioId, hash: hashDeToken(token), ua: userAgent ? userAgent.slice(0, 300) : null },
      transaction,
    },
  )
  return token
}

/**
 * La sesión vigente de un token, con su usuario leído de la base en este mismo pedido (el rol y si está activo
 * valen desde el pedido siguiente a cualquier cambio), o null. Renueva ultimo_uso si pasaron más de 5 minutos.
 * temporalVencida: la cuenta tiene una contraseña temporal sin cambiar y ya venció (la sesión se abrió con ella
 * antes de las 72 h); requiereSesion la corta.
 * @returns {Promise<null | { sesionId: string, temporalVencida: boolean, usuario: { id: number, nombre: string, email: string, rol: string, debeCambiarClave: boolean } }>}
 */
export async function buscarSesion(sequelize, token) {
  if (!token) return null
  const [fila] = await sequelize.query(
    `SELECT s.id AS "sesionId", (s.ultimo_uso < now() - ${RENOVACION}) AS renovar,
            (u.debe_cambiar_clave AND u.clave_temporal_vence <= now()) AS "temporalVencida",
            u.id, u.nombre, u.email, u.rol, u.debe_cambiar_clave AS "debeCambiarClave"
       FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = :hash AND s.expira_en > now() AND s.ultimo_uso > now() - ${INACTIVIDAD} AND u.activo`,
    { replacements: { hash: hashDeToken(token) }, type: QueryTypes.SELECT },
  )
  if (!fila) return null
  const { sesionId, renovar, temporalVencida, ...usuario } = fila
  if (temporalVencida) return { sesionId, temporalVencida: true, usuario }
  if (renovar) {
    await sequelize.query('UPDATE sesiones SET ultimo_uso = now() WHERE id = :id', { replacements: { id: sesionId } })
  }
  return { sesionId, temporalVencida: false, usuario }
}

/** Borra la sesión de un token (salir). */
export async function borrarSesion(sequelize, token) {
  if (!token) return 0
  return sequelize.models.Sesion.destroy({ where: { tokenHash: hashDeToken(token) } })
}

/**
 * Borra todas las sesiones de una persona y devuelve cuántas eran.
 * @param {{ transaction?: import('sequelize').Transaction }} [opciones]
 */
export function borrarSesionesDe(sequelize, usuarioId, { transaction } = {}) {
  return sequelize.models.Sesion.destroy({ where: { usuarioId }, transaction })
}

/** Borra las vencidas por máximo o por inactividad (tarea diaria). Devuelve cuántas. */
export function borrarSesionesVencidas(sequelize) {
  return sequelize.models.Sesion.destroy({
    where: {
      [Op.or]: [{ expiraEn: { [Op.lte]: fn('now') } }, { ultimoUso: { [Op.lte]: literal(`now() - ${INACTIVIDAD}`) } }],
    },
  })
}
