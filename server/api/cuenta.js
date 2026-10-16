// /administracion/api/cuenta (plan 4.3 y 4.4): lo de la propia cuenta, para cualquier rol.
// - PUT /cuenta: { nombre }.
// - PUT /cuenta/clave: { actual, nueva }. También es el cambio obligatorio del primer ingreso (pasa con la temporal sin
//   cambiar; la temporal como "actual" se acepta en mayúsculas o sin los guiones, server/auth/claves.js). Pide la
//   actual: 5 equivocadas cada 15 minutos y 429 (server/limites.js), con "cambio_clave_fallido" en el log. Borra TODAS
//   las sesiones de la persona y crea una nueva en el mismo commit (las demás pestañas y dispositivos tienen que volver
//   a entrar), apaga debe_cambiar_clave y escribe "clave_cambiada" en el log, sin la contraseña. Si mientras argon2
//   trabajaba la contraseña cambió (un admin le dio una temporal, otra pestaña la cambió), 409: no se pisa.
// - DELETE /cuenta/sesiones: cierra la sesión en todos lados, también esta.
import { esquemaCambioClave, esquemaCuenta, problemaDeClave } from '../../compartido/esquemas/cuenta.js'
import { formaDeTemporal, hashClave, verificarClave } from '../auth/claves.js'
import { borrarCookie, borrarSesionesDe, crearSesion, ponerCookie } from '../auth/sesiones.js'
import { httpError } from '../errores.js'
import { ACTUAL_EQUIVOCADA, claveDeCambio } from '../limites.js'
import { log } from '../log.js'
import { usuarioDeSesion } from './usuarios.js'

export const TEMPORAL_EQUIVOCADA = 'La contraseña temporal no es correcta. Revisala con quien te la dio.'

async function cambiarNombre(req, res, { sequelize }) {
  const { Usuario } = sequelize.models
  const { nombre } = req.datos
  // RETURNING: la respuesta lleva lo que quedó en la base, no lo que llegó.
  const [, [guardado]] = await Usuario.update(
    { nombre },
    { where: { id: req.usuario.id }, fields: ['nombre'], returning: true },
  )
  if (!guardado) throw httpError(401, 'Tenés que iniciar sesión.')
  res.json({ data: { usuario: usuarioDeSesion(guardado) } })
}

async function cambiarClave(req, res, { config, sequelize, limites }) {
  const { Usuario } = sequelize.models
  const { actual, nueva } = req.datos
  const id = req.usuario.id
  // La regla del correo necesita saber de quién es la cuenta (las demás ya las aplicó el esquema).
  const problema = problemaDeClave(nueva, { email: req.usuario.email, actual })
  if (problema) throw httpError(400, 'Revisá los datos.', { campos: { nueva: problema } })
  const usuario = await Usuario.findByPk(id, { attributes: ['id', 'passwordHash'] })
  const candidata = req.usuario.debeCambiarClave ? (formaDeTemporal(actual) ?? actual) : actual
  if (!usuario || !(await verificarClave(usuario.passwordHash, candidata, { usuarioId: id }))) {
    // Solo esto cuenta para el límite de la actual equivocada.
    res.locals[ACTUAL_EQUIVOCADA] = true
    log('info', 'cambio_clave_fallido', { usuario_id: id })
    // Con la temporal pendiente, el campo se llama "Contraseña temporal" en el panel: "actual" confundiría.
    const mensaje = req.usuario.debeCambiarClave ? TEMPORAL_EQUIVOCADA : 'La contraseña actual no es correcta.'
    throw httpError(400, 'Revisá los datos.', { campos: { actual: mensaje } })
  }
  // El hash, antes de abrir la transacción: no tiene sentido tener la fila bloqueada mientras argon2 trabaja.
  const passwordHash = await hashClave(nueva)
  const token = await sequelize.transaction(async (transaction) => {
    // Primero la fila del usuario (el orden de siempre: usuario, después sesiones) y que siga con el hash que se
    // verificó: si cambió en el medio, este cambio pisaría una temporal recién dada o el cambio de otra pestaña.
    const vigente = await Usuario.findByPk(id, {
      attributes: ['id', 'passwordHash', 'activo'],
      lock: transaction.LOCK.UPDATE,
      transaction,
    })
    if (!vigente?.activo || vigente.passwordHash !== usuario.passwordHash) {
      log('info', 'cambio_clave_cruzado', { usuario_id: id })
      throw httpError(409, 'La contraseña cambió mientras tanto. Volvé a entrar y probá de nuevo.')
    }
    await Usuario.update(
      { passwordHash, debeCambiarClave: false, claveTemporalVence: null },
      { where: { id }, fields: ['passwordHash', 'debeCambiarClave', 'claveTemporalVence'], transaction },
    )
    await borrarSesionesDe(sequelize, id, { transaction })
    return crearSesion(sequelize, { usuarioId: id, userAgent: req.get('user-agent'), transaction })
  })
  ponerCookie(res, config, token)
  await limites.claveActualPorUsuario.resetKey(claveDeCambio(req))
  log('info', 'clave_cambiada', { usuario_id: id })
  res.json({ data: { usuario: usuarioDeSesion(req.usuario), debeCambiarClave: false } })
}

async function cerrarTodas(req, res, { config, sequelize }) {
  const cerradas = await borrarSesionesDe(sequelize, req.usuario.id)
  borrarCookie(res, config)
  log('info', 'sesiones_cerradas', { usuario_id: req.usuario.id, por: req.usuario.id })
  res.json({ data: { cerradas } })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeCuenta = [
  { metodo: 'PUT', ruta: '/cuenta', rol: 'editor', cuerpo: esquemaCuenta, manejador: cambiarNombre },
  {
    metodo: 'PUT',
    ruta: '/cuenta/clave',
    rol: 'editor',
    conClaveTemporal: true,
    antes: (limites) => [limites.claveActualPorUsuario],
    cuerpo: esquemaCambioClave,
    manejador: cambiarClave,
  },
  { metodo: 'DELETE', ruta: '/cuenta/sesiones', rol: 'editor', manejador: cerrarTodas },
]
