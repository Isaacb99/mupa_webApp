// Prueba la casilla de envío del formulario de contacto (plan 8 y 10.6): verifica la conexión y la contraseña
// (transporte.verify(), que no manda nada) y después manda UN mail de prueba con la configuración real (SMTP_HOST,
// SMTP_PUERTO, SMTP_USUARIO y SMTP_CLAVE), desde la casilla a la dirección que se le pasa.
//
//   npm run probar-correo -- --para <dirección>
//
// Se usa en el primer deploy (desde el Shell de Render) y cada vez que cambie la contraseña de la casilla
// (docs/operacion.md). Con CORREO_MODO=consola (local) el mail se escribe en la terminal y no sale. Si falla, dice el
// código de nodemailer (EAUTH: la contraseña; ECONNECTION, ETIMEDOUT o ESOCKET: el puerto o la red; EDNS: el
// servidor) y termina con código 1. No usa la base.
import { CONTACTO } from '../../compartido/contacto.js'
import { esPrincipal } from '../principal.js'

const AYUDA = {
  EAUTH: 'la casilla rechazó el usuario o la contraseña (SMTP_USUARIO y SMTP_CLAVE)',
  ECONNECTION: 'el servidor cortó la conexión: probá el otro puerto (465 o 587, SMTP_PUERTO)',
  ETIMEDOUT: 'el servidor no contestó a tiempo: probá el otro puerto (465 o 587, SMTP_PUERTO)',
  ESOCKET: 'falló la conexión: revisá SMTP_HOST y SMTP_PUERTO (465 o 587)',
  EDNS: 'no se encontró el servidor: revisá SMTP_HOST (smtp.hostinger.com)',
  ETLS: 'falló el cifrado: con 465 va SSL y con 587, STARTTLS',
}

/** La dirección de --para (o null). */
function destinoDe(argv) {
  const i = argv.indexOf('--para')
  const para = i >= 0 ? argv[i + 1] : null
  return typeof para === 'string' && para.length <= CONTACTO.EMAIL_MAX && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(para)
    ? para
    : null
}

if (esPrincipal(import.meta)) {
  const para = destinoDe(process.argv.slice(2))
  if (!para) {
    console.error('Uso: npm run probar-correo -- --para <dirección>')
    process.exit(1)
  }
  const { configDelProceso } = await import('../config.js')
  const { crearCorreo } = await import('../correo.js')
  const config = configDelProceso()
  const correo = crearCorreo(config)
  if (!correo.configurado) {
    console.error('No hay casilla de envío: faltan SMTP_USUARIO (y, en modo smtp, SMTP_HOST y SMTP_CLAVE).')
    process.exit(1)
  }
  if (correo.modo !== 'smtp') console.log(`CORREO_MODO=${correo.modo}: el mail no sale, se escribe acá.`)
  const prueba = await correo.verificar()
  if (prueba.ok === false) {
    console.error(`La casilla no responde (${prueba.codigo}): ${AYUDA[prueba.codigo] ?? 'mirá el código en la documentación de nodemailer'}.`)
    process.exit(1)
  }
  try {
    await correo.probarCorreo(para)
    console.log(
      correo.modo === 'smtp'
        ? 'Listo: el mail de prueba salió. Revisá la bandeja de entrada (y la de spam) de esa dirección.'
        : `Listo: el mail de prueba quedó armado (arriba). Con CORREO_MODO=${correo.modo} no sale.`,
    )
    process.exit(0)
  } catch (err) {
    console.error(`No salió el mail de prueba (${err.code}): ${AYUDA[err.code] ?? 'mirá el código en la documentación de nodemailer'}.`)
    process.exit(1)
  }
}
