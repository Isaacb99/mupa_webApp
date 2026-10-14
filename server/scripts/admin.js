// Llave de emergencia (plan 3.4 y 4.4): el primer admin, o entrar cuando nadie puede. Se corre desde el Shell de
// Render (hace falta la cuenta de Render del museo: es la última llave, no un atajo) o, en local, contra mupa_dev.
//
//   npm run crear-admin -- --email <correo> --nombre "<nombre>"
//       cuenta nueva, admin, con una contraseña temporal (72 h) que hay que cambiar en el primer ingreso
//   npm run restablecer-admin -- --email <correo>
//       cuenta existente: la deja activa, admin, con una temporal nueva y sin sesiones
//
// La temporal se imprime UNA sola vez, en esta terminal: no va al log del servicio, ni a variables, ni a archivos.
// Las pruebas usan crearAdmin() y restablecerAdmin() directamente (server/pruebas/auth.test.js).
import { correo, nombrePersona } from '../../compartido/esquemas/usuarios.js'
import { generarTemporal, hashClave, HORAS_TEMPORAL, vencimientoTemporal } from '../auth/claves.js'
import { borrarSesionesDe } from '../auth/sesiones.js'
import { esPrincipal } from '../principal.js'

/**
 * Crea una cuenta de admin con una temporal. Tira si el correo ya existe (para eso está restablecerAdmin).
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ email: string, nombre: string }} datos  sin validar: se validan acá
 * @returns {Promise<{ usuario: object, claveTemporal: string }>}
 */
export async function crearAdmin(sequelize, datos) {
  const email = correo.parse(datos.email)
  const nombre = nombrePersona.parse(datos.nombre)
  const { Usuario } = sequelize.models
  if (await Usuario.findOne({ where: { email }, attributes: ['id'] })) {
    throw new Error('Ya hay una cuenta con ese correo: usá npm run restablecer-admin -- --email <correo>')
  }
  const claveTemporal = generarTemporal()
  const usuario = await Usuario.create(
    {
      email,
      nombre,
      rol: 'admin',
      passwordHash: await hashClave(claveTemporal),
      debeCambiarClave: true,
      claveTemporalVence: vencimientoTemporal(),
    },
    { fields: ['email', 'nombre', 'rol', 'passwordHash', 'debeCambiarClave', 'claveTemporalVence'] },
  )
  return { usuario, claveTemporal }
}

/**
 * Deja una cuenta existente activa, admin, con una temporal nueva y sin sesiones.
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ email: string }} datos
 */
export async function restablecerAdmin(sequelize, datos) {
  const email = correo.parse(datos.email)
  const claveTemporal = generarTemporal()
  const passwordHash = await hashClave(claveTemporal)
  const usuario = await sequelize.transaction(async (transaction) => {
    const usuario = await sequelize.models.Usuario.findOne({ where: { email }, lock: transaction.LOCK.UPDATE, transaction })
    if (!usuario) throw new Error('No hay ninguna cuenta con ese correo: usá npm run crear-admin -- --email <correo> --nombre "<nombre>"')
    await usuario.update(
      { activo: true, rol: 'admin', passwordHash, debeCambiarClave: true, claveTemporalVence: vencimientoTemporal() },
      { fields: ['activo', 'rol', 'passwordHash', 'debeCambiarClave', 'claveTemporalVence'], transaction },
    )
    await borrarSesionesDe(sequelize, usuario.id, { transaction })
    return usuario
  })
  return { usuario, claveTemporal }
}

/** --email x --nombre "y" -> { email: 'x', nombre: 'y' } */
function opciones(argv) {
  const salida = {}
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(email|nombre)(?:=(.*))?$/.exec(argv[i])
    if (m) salida[m[1]] = m[2] ?? argv[++i]
  }
  return salida
}

if (esPrincipal(import.meta)) {
  const [accion, ...resto] = process.argv.slice(2)
  const { email, nombre } = opciones(resto)
  const uso =
    'Uso:\n  npm run crear-admin -- --email <correo> --nombre "<nombre>"\n  npm run restablecer-admin -- --email <correo>'
  if (!['crear', 'restablecer'].includes(accion) || !email || (accion === 'crear' && !nombre)) {
    console.error(uso)
    process.exit(1)
  }
  const { configDelProceso } = await import('../config.js')
  const { crearConexion } = await import('../db/conexion.js')
  const config = configDelProceso()
  const sequelize = crearConexion(config)
  if (!sequelize) {
    console.error('Falta DATABASE_URL (o está SIN_BASE): no hay base donde crear la cuenta.')
    process.exit(1)
  }
  let codigo = 0
  try {
    const { usuario, claveTemporal } =
      accion === 'crear' ? await crearAdmin(sequelize, { email, nombre }) : await restablecerAdmin(sequelize, { email })
    console.log(
      `${accion === 'crear' ? 'Cuenta creada' : 'Cuenta restablecida'}: ${usuario.nombre} <${usuario.email}>, administrador.\n` +
        `Contraseña temporal (no se vuelve a mostrar; vence en ${HORAS_TEMPORAL} h y se cambia en el primer ingreso):\n\n` +
        `    ${claveTemporal}\n\n` +
        'Dásela a la persona en persona o por teléfono.',
    )
  } catch (err) {
    // Un ZodError (correo o nombre inválidos) trae los problemas en issues.
    const problemas = err?.issues?.map((i) => i.message).join(' ') ?? err.message
    console.error(`No se pudo: ${problemas}`)
    codigo = 1
  } finally {
    await sequelize.close()
  }
  process.exit(codigo)
}
