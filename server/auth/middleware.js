// Middlewares de autenticación y autorización del panel (plan 4.4 y 4.5). Los monta, ruta por ruta y en este orden,
// server/api/indice.js: requiereSesion -> exigirClaveCambiada (salvo las rutas que la permiten) -> límite por
// usuario -> requiereRol -> validación del cuerpo -> la ruta.
import { httpError } from '../errores.js'
import { log } from '../log.js'
import { TEMPORAL_VENCIDA } from './claves.js'
import { borrarCookie, borrarSesion, buscarSesion, leerToken } from './sesiones.js'

/** Roles de menor a mayor: "editor" en la tabla de rutas quiere decir "cualquier cuenta"; "admin", solo admins. */
const NIVEL = { editor: 1, admin: 2 }

/**
 * Busca la sesión de la cookie, con el usuario leído de la base en este pedido (activo y con su rol de ahora), y la
 * deja en req.usuario ({ id, nombre, email, rol, debeCambiarClave }), req.sesionId y req.token. Sin sesión vigente:
 * 401, y si vino una cookie, la borra. Una sesión abierta con una temporal que ya venció (dura 12 h; la temporal,
 * 72 desde que se dio) se borra y da 401 con el mismo mensaje que el inicio de sesión.
 * @param {{ config: object, sequelize: import('sequelize').Sequelize }} deps
 */
export function crearRequiereSesion({ config, sequelize }) {
  return async function requiereSesion(req, res, next) {
    const token = leerToken(req, config)
    const sesion = await buscarSesion(sequelize, token)
    if (!sesion) {
      if (token) borrarCookie(res, config)
      throw httpError(401, 'Tenés que iniciar sesión.')
    }
    if (sesion.temporalVencida) {
      await borrarSesion(sequelize, token)
      borrarCookie(res, config)
      log('info', 'sesion_temporal_vencida', { usuario_id: sesion.usuario.id })
      throw httpError(401, TEMPORAL_VENCIDA)
    }
    req.usuario = sesion.usuario
    req.sesionId = sesion.sesionId
    req.token = token
    next()
  }
}

/**
 * Con una contraseña temporal sin cambiar (debe_cambiar_clave), solo pasan GET y DELETE /sesion y PUT /cuenta/clave:
 * esas rutas no llevan este middleware. El resto: 403 con debeCambiarClave, para que el panel lleve a cambiarla.
 */
export function exigirClaveCambiada(req, res, next) {
  if (req.usuario.debeCambiarClave) {
    throw httpError(403, 'Tenés que cambiar la contraseña temporal antes de seguir.', { debeCambiarClave: true })
  }
  next()
}

/** @param {'editor' | 'admin'} rol  el mínimo */
export function requiereRol(rol) {
  if (!NIVEL[rol]) throw new Error(`Rol desconocido en la tabla de rutas: ${rol}`)
  return function rolSuficiente(req, res, next) {
    // Sin req.usuario, requiereRol se usó sin requiereSesion: falla cerrado.
    if (!req.usuario) throw httpError(401, 'Tenés que iniciar sesión.')
    if ((NIVEL[req.usuario.rol] ?? 0) < NIVEL[rol]) throw httpError(403, 'No tenés permiso para esto.')
    next()
  }
}
