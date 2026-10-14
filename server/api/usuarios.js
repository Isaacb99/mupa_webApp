// /administracion/api/usuarios (plan 4.3 y 4.4): solo admins. No hay autoregistro ni mails: el admin da de alta a
// cada persona y el servidor genera una contraseña temporal que se devuelve UNA sola vez (ni un GET ni un log la
// vuelven a mostrar; en la base, solo su hash).
// - GET /usuarios: la lista, sin hashes.
// - POST /usuarios { nombre, email, rol }: crea la cuenta con la temporal (72 h, debe_cambiar_clave). 409 si el
//   correo ya existe (lo traduce server/errores.js).
// - PATCH /usuarios/:id { nombre?, rol?, activo? }: nunca deja el panel sin un admin activo: los admins activos se
//   bloquean (FOR UPDATE, en orden de id, así dos cambios a la vez esperan en vez de cruzarse) y si el cambio dejaría
//   cero, 409. Desactivar o bajar de admin a editor borra las sesiones de esa persona (el rol igual se lee de la base
//   en cada pedido; así el panel vuelve a entrar con lo que le corresponde).
// - POST /usuarios/:id/clave-temporal: temporal nueva (72 h), debe_cambiar_clave y sin sesiones. No sobre la propia
//   cuenta (para eso está Mi cuenta).
// - DELETE /usuarios/:id/sesiones: cierra todas sus sesiones.
// Lo que llega a Sequelize es solo lo que devolvió el esquema (req.datos), con la lista de campos explícita.
// Lo que da acceso (alta, cambios y temporales) vuelve a comprobar DENTRO de su transacción que quien lo pide sigue
// siendo admin activo (bloquearAdmins): requiereSesion lo leyó antes, y si justo en ese momento otro admin lo bajó de
// rol o lo desactivó, el pedido en curso no termina (403). Orden de los bloqueos, en todo el panel: los admins
// activos (por id), después la fila a cambiar y al final sus sesiones.
import { esquemaAltaUsuario, esquemaCambioUsuario } from '../../compartido/esquemas/usuarios.js'
import { generarTemporal, hashClave, vencimientoTemporal } from '../auth/claves.js'
import { borrarCookie, borrarSesionesDe } from '../auth/sesiones.js'
import { httpError } from '../errores.js'
import { log } from '../log.js'

/** Lo que el panel sabe de quien tiene la sesión. */
export const usuarioDeSesion = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol })

/** Una fila de la lista de Usuarios (nunca el hash). */
export const usuarioDeLista = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  activo: u.activo,
  debeCambiarClave: u.debeCambiarClave,
  claveTemporalVence: u.claveTemporalVence,
  ultimoAcceso: u.ultimoAcceso,
  creadoEn: u.createdAt,
})

const NO_EXISTE = 'No existe ese usuario.'

async function listar(req, res, { sequelize }) {
  const usuarios = await sequelize.models.Usuario.findAll({ order: [['nombre', 'ASC'], ['id', 'ASC']] })
  res.json({ data: usuarios.map(usuarioDeLista) })
}

/**
 * Bloquea las filas de los admins activos (FOR UPDATE, en orden de id, así dos cambios a la vez esperan en vez de
 * cruzarse) y comprueba que quien hace el pedido siga entre ellos; si no, 403. Devuelve sus ids.
 * @param {import('sequelize').ModelStatic<any>} Usuario
 */
async function bloquearAdmins(Usuario, req, transaction) {
  const admins = await Usuario.findAll({
    attributes: ['id'],
    where: { rol: 'admin', activo: true },
    order: [['id', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction,
  })
  if (!admins.some((a) => a.id === req.usuario.id)) throw httpError(403, 'No tenés permiso para esto.')
  return admins
}

async function crear(req, res, { sequelize }) {
  const { Usuario } = sequelize.models
  const { nombre, email, rol } = req.datos
  const claveTemporal = generarTemporal()
  // El hash, antes de abrir la transacción: no tiene sentido tener filas bloqueadas mientras argon2 trabaja.
  const passwordHash = await hashClave(claveTemporal)
  const usuario = await sequelize.transaction(async (transaction) => {
    await bloquearAdmins(Usuario, req, transaction)
    return Usuario.create(
      { nombre, email, rol, passwordHash, debeCambiarClave: true, claveTemporalVence: vencimientoTemporal() },
      { fields: ['nombre', 'email', 'rol', 'passwordHash', 'debeCambiarClave', 'claveTemporalVence'], transaction },
    )
  })
  log('info', 'usuario_creado', { usuario_id: usuario.id, rol, por: req.usuario.id })
  res.status(201).json({ data: { usuario: usuarioDeLista(usuario), claveTemporal } })
}

async function modificar(req, res, { config, sequelize }) {
  const { Usuario } = sequelize.models
  const id = req.idRuta
  const cambios = req.datos
  const resultado = await sequelize.transaction(async (transaction) => {
    // Primero los admins activos, siempre en el mismo orden (y quien pide, entre ellos); después la fila a cambiar.
    const admins = await bloquearAdmins(Usuario, req, transaction)
    const usuario = await Usuario.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction })
    if (!usuario) throw httpError(404, NO_EXISTE)
    const eraAdminActivo = usuario.rol === 'admin' && usuario.activo
    const quedaAdminActivo = (cambios.rol ?? usuario.rol) === 'admin' && (cambios.activo ?? usuario.activo)
    if (eraAdminActivo && !quedaAdminActivo && admins.length <= 1) {
      throw httpError(409, 'No se puede: es el único administrador activo. Primero hacé administrador a otra persona.')
    }
    const pierdeAcceso = (usuario.activo && cambios.activo === false) || (usuario.rol === 'admin' && cambios.rol === 'editor')
    // returning: la instancia (y la respuesta) quedan con lo que guardó la base.
    await usuario.update(cambios, { fields: ['nombre', 'rol', 'activo'], returning: true, transaction })
    const cerradas = pierdeAcceso ? await borrarSesionesDe(sequelize, id, { transaction }) : 0
    return { usuario, cerradas }
  })
  if (resultado.cerradas && id === req.usuario.id) borrarCookie(res, config)
  log('info', 'usuario_modificado', {
    usuario_id: id,
    campos: Object.keys(cambios),
    sesiones_cerradas: resultado.cerradas,
    por: req.usuario.id,
  })
  res.json({ data: { usuario: usuarioDeLista(resultado.usuario) } })
}

async function darTemporal(req, res, { sequelize }) {
  const { Usuario } = sequelize.models
  const id = req.idRuta
  if (id === req.usuario.id) {
    throw httpError(400, 'No podés darte una contraseña temporal a vos: cambiá la tuya en Mi cuenta.')
  }
  const claveTemporal = generarTemporal()
  const passwordHash = await hashClave(claveTemporal)
  await sequelize.transaction(async (transaction) => {
    await bloquearAdmins(Usuario, req, transaction)
    const usuario = await Usuario.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction })
    if (!usuario) throw httpError(404, NO_EXISTE)
    await usuario.update(
      { passwordHash, debeCambiarClave: true, claveTemporalVence: vencimientoTemporal() },
      { fields: ['passwordHash', 'debeCambiarClave', 'claveTemporalVence'], transaction },
    )
    await borrarSesionesDe(sequelize, id, { transaction })
  })
  log('info', 'clave_temporal_dada', { usuario_id: id, por: req.usuario.id })
  res.json({ data: { claveTemporal } })
}

async function cerrarSesiones(req, res, { config, sequelize }) {
  const id = req.idRuta
  if (!(await sequelize.models.Usuario.findByPk(id, { attributes: ['id'] }))) throw httpError(404, NO_EXISTE)
  const cerradas = await borrarSesionesDe(sequelize, id)
  if (id === req.usuario.id) borrarCookie(res, config)
  log('info', 'sesiones_cerradas', { usuario_id: id, por: req.usuario.id })
  res.json({ data: { cerradas } })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeUsuarios = [
  { metodo: 'GET', ruta: '/usuarios', rol: 'admin', manejador: listar },
  { metodo: 'POST', ruta: '/usuarios', rol: 'admin', cuerpo: esquemaAltaUsuario, manejador: crear },
  { metodo: 'PATCH', ruta: '/usuarios/:id', rol: 'admin', cuerpo: esquemaCambioUsuario, manejador: modificar },
  { metodo: 'POST', ruta: '/usuarios/:id/clave-temporal', rol: 'admin', manejador: darTemporal },
  { metodo: 'DELETE', ruta: '/usuarios/:id/sesiones', rol: 'admin', manejador: cerrarSesiones },
]
