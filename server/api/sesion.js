// /administracion/api/sesion (plan 4.2 y 4.4): entrar, ver la sesión y salir.
//
// POST: zod (el correo a minúsculas) -> usuario ACTIVO por correo -> argon2.verify contra su hash o, si no existe,
// contra el hash de relleno (el tiempo no dice si la cuenta existe; con una temporal pendiente, la clave escrita en
// mayúsculas o sin guiones se lleva a su forma, server/auth/claves.js) -> con la clave correcta pero una temporal
// vencida, 401 con su propio mensaje (solo después de verificarla) -> en una transacción: la fila del usuario
// bloqueada y comprobado que su hash sigue siendo el que se verificó y que sigue activa (si el titular cambió la
// contraseña justo en ese momento para echar a alguien, la vieja ya no entra), sesión nueva (token nuevo; la que
// traía este navegador, si traía, se borra) y ultimo_acceso -> Set-Cookie, los fallidos de ese correo + IP en cero y
// la línea de log "ingreso" con el id. Si falla, 401 "Correo o contraseña incorrectos" y "ingreso_fallido", sin el
// correo ni la IP. Antes, los dos límites de 4.7 (server/limites.js).
// GET: la sesión vigente (también con la temporal sin cambiar) o 401.
// DELETE: borra la sesión de la cookie, si hay, y la cookie. No pide sesión: salir siempre funciona.
import { esquemaIngreso } from '../../compartido/esquemas/sesion.js'
import { formaDeTemporal, hashDeRelleno, TEMPORAL_VENCIDA, verificarClave } from '../auth/claves.js'
import { borrarCookie, borrarSesion, crearSesion, hashDeToken, leerToken, ponerCookie } from '../auth/sesiones.js'
import { httpError } from '../errores.js'
import { claveDeIngreso } from '../limites.js'
import { log } from '../log.js'
import { usuarioDeSesion } from './usuarios.js'

const INCORRECTOS = 'Correo o contraseña incorrectos.'

async function ingresar(req, res, { config, sequelize, limites }) {
  const { Sesion, Usuario } = sequelize.models
  const { email, clave } = req.datos
  const usuario = await Usuario.findOne({ where: { email, activo: true } })
  const candidata = usuario?.debeCambiarClave ? (formaDeTemporal(clave) ?? clave) : clave
  const correcta = await verificarClave(usuario?.passwordHash ?? (await hashDeRelleno()), candidata, {
    usuarioId: usuario?.id,
  })
  if (!usuario || !correcta) {
    log('info', 'ingreso_fallido')
    throw httpError(401, INCORRECTOS)
  }
  if (usuario.debeCambiarClave && !(usuario.claveTemporalVence > new Date())) {
    log('info', 'ingreso_fallido', { motivo: 'temporal_vencida' })
    throw httpError(401, TEMPORAL_VENCIDA)
  }
  const anterior = leerToken(req, config)
  const { token, vigente } = await sequelize.transaction(async (transaction) => {
    // Primero la fila del usuario y después las sesiones: el mismo orden que darTemporal, modificar y cambiarClave
    // (al revés podían trabarse entre sí, un 40P01).
    const vigente = await Usuario.findByPk(usuario.id, { lock: transaction.LOCK.UPDATE, transaction })
    if (!vigente?.activo || vigente.passwordHash !== usuario.passwordHash) {
      log('info', 'ingreso_fallido', { motivo: 'cambio_simultaneo' })
      throw httpError(401, INCORRECTOS)
    }
    // silent: entrar no es editar la cuenta (updated_at queda como estaba).
    await Usuario.update({ ultimoAcceso: new Date() }, { where: { id: usuario.id }, silent: true, transaction })
    if (anterior) await Sesion.destroy({ where: { tokenHash: hashDeToken(anterior) }, transaction })
    const token = await crearSesion(sequelize, { usuarioId: usuario.id, userAgent: req.get('user-agent'), transaction })
    return { token, vigente }
  })
  ponerCookie(res, config, token)
  // Entró el titular: los fallidos de este correo desde esta IP vuelven a cero.
  await limites.ingresoFallidoPorCorreo.resetKey(claveDeIngreso(req))
  log('info', 'ingreso', { usuario_id: usuario.id })
  res.json({ data: { usuario: usuarioDeSesion(vigente), debeCambiarClave: vigente.debeCambiarClave } })
}

function verSesion(req, res) {
  res.json({ data: { usuario: usuarioDeSesion(req.usuario), debeCambiarClave: req.usuario.debeCambiarClave } })
}

async function salir(req, res, { config, sequelize }) {
  await borrarSesion(sequelize, leerToken(req, config))
  borrarCookie(res, config)
  res.json({ data: null })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeSesion = [
  {
    metodo: 'POST',
    ruta: '/sesion',
    rol: null,
    antes: (limites) => [limites.ingresoPorIp, limites.ingresoFallidoPorCorreo],
    cuerpo: esquemaIngreso,
    manejador: ingresar,
  },
  { metodo: 'GET', ruta: '/sesion', rol: 'editor', conClaveTemporal: true, manejador: verSesion },
  { metodo: 'DELETE', ruta: '/sesion', rol: null, manejador: salir },
]
