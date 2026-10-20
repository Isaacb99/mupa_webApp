// El único correo del sitio: el formulario de contacto (E4.5, plan 8). En un solo sentido: el visitante escribe y el
// mensaje llega a la dirección de destino que el admin carga en Datos del museo. Sin respuesta automática, sin mails
// del panel y sin servicio de correo transaccional: SMTP con nodemailer desde una casilla de Hostinger del sitio
// (SMTP_USUARIO, p. ej. web@mupa.ar), que es también el From.
//
// - Modos (CORREO_MODO, server/config.js): smtp (Render: smtp.hostinger.com, 465 con SSL o 587 con STARTTLS), consola
//   (local: el mail armado se escribe en la terminal; nunca en producción, porque escribiría los mensajes del público
//   en los logs) y memoria (las pruebas: los mails quedan en `enviados`, y `simularFalla(codigo)` hace fallar los
//   siguientes envíos y verificaciones). En consola y memoria nodemailer arma el mail igual (streamTransport), así lo
//   que se ve es lo que saldría.
// - Sin SMTP_USUARIO (la casilla) no hay formulario: `configurado` es false, el sitio no lo dibuja y el Inicio del panel
//   lo dice. En smtp, config.js exige además SMTP_HOST y SMTP_CLAVE.
// - armarCorreo(): From la casilla ("Formulario de mupa.ar", nunca el visitante: fallaría SPF y DMARC), To el destino
//   (leído en el momento, nunca guardado acá), Reply-To el visitante (lo arma nodemailer, con el nombre codificado),
//   asunto en una línea (unaLinea: ni el nombre puede abrir otra cabecera) y texto plano.
// - El estado del correo, en memoria: { ok, codigo, en, desde } del último intento (ok null: todavía no se probó; desde:
//   el primer fallo de la racha). Lo cambian la verificación (transporte.verify(): al arrancar y en la tarea diaria,
//   server/tareas.js) y cada envío. Lo lee GET /administracion/api/estado (el aviso del Inicio, plan 8.4).
// - Un fallo va al log como correo_fallido con el código de nodemailer (EAUTH, ETIMEDOUT, ECONNECTION…) y nada más: el
//   mensaje de un error SMTP puede traer las direcciones ("550 <alguien@…> rechazado"), que nunca van al log (plan 9).
// - probarCorreo(): el mail de prueba de npm run probar-correo (server/scripts/probar-correo.js).
import nodemailer from 'nodemailer'
import { unaLinea } from '../compartido/contacto.js'
import { cuandoEs } from '../compartido/fechas.js'
import { esServidorLocal } from './config.js'
import { log } from './log.js'

/** El nombre que va en el From (la dirección es siempre la casilla). */
export const NOMBRE_REMITENTE = 'Formulario de mupa.ar'
/** Topes de tiempo del SMTP (plan 8): conectar, el saludo del servidor y cada lectura o escritura. */
export const TOPES_SMTP = Object.freeze({ connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 })
/** Cuánto espera la verificación de la casilla en total (además de los topes de nodemailer). */
const TOPE_VERIFICACION_MS = 30_000

// Un código que se puede guardar y mostrar (mensajes_contacto.error es varchar(40)): letras, números y _.
const CODIGO = /^[A-Za-z0-9_]{1,40}$/

/**
 * El código de un error de nodemailer (EAUTH, ECONNECTION…) o de la red (ECONNREFUSED), o EDESCONOCIDO. Nunca el texto.
 * @param {any} err
 */
export function codigoDeCorreo(err) {
  const codigo = err?.code
  return typeof codigo === 'string' && CODIGO.test(codigo) ? codigo.toUpperCase() : 'EDESCONOCIDO'
}

/**
 * El mail de un mensaje del formulario, como lo recibe nodemailer.sendMail().
 * @param {{ nombre: string, email: string, mensaje: string }} datos  ya validados (compartido/esquemas/contacto.js)
 * @param {string} destino  la dirección de destino del museo
 * @param {{ casilla: string, ahora?: Date }} opciones  casilla: SMTP_USUARIO (el From)
 */
export function armarCorreo({ nombre, email, mensaje }, destino, { casilla, ahora = new Date() }) {
  const quien = unaLinea(nombre)
  return {
    from: { name: NOMBRE_REMITENTE, address: casilla },
    to: destino,
    replyTo: { name: quien, address: email },
    subject: `Consulta desde mupa.ar: ${quien}`,
    text: `${mensaje}\n\n${quien} <${email}>\n${cuandoEs(ahora)} (hora de San Juan)\n`,
  }
}

const SIN_ACCESOS = Object.freeze({ disableFileAccess: true, disableUrlAccess: true })

/**
 * Las opciones del transporte SMTP de nodemailer (exportadas para las pruebas: ahí se ve cuándo exige TLS).
 * @param {ReturnType<import('./config.js').leerConfig>} config
 */
export function opcionesSmtp(config) {
  const puerto = config.SMTP_PUERTO
  return {
    host: config.SMTP_HOST,
    port: puerto,
    // 465: SSL desde el principio; en cualquier otro puerto, STARTTLS obligatorio (plan 8; en producción config.js
    // solo deja 465 o 587): sin TLS, nodemailer no manda la contraseña (COD-05 de la verificación de E4). Sin TLS solo
    // contra esta misma máquina (el SMTP falso de las pruebas: la contraseña no sale a la red).
    secure: puerto === 465,
    requireTLS: puerto !== 465 && !esServidorLocal(config.SMTP_HOST),
    auth: { user: config.SMTP_USUARIO, pass: config.SMTP_CLAVE },
    ...TOPES_SMTP,
    ...SIN_ACCESOS,
  }
}

/**
 * El transporte de nodemailer de cada modo. Sin acceso a archivos ni a URL desde el mail (no hay adjuntos).
 * @param {'smtp' | 'consola' | 'memoria'} modo
 */
function crearTransporte(config, modo) {
  if (modo !== 'smtp') return nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix', ...SIN_ACCESOS })
  return nodemailer.createTransport(opcionesSmtp(config))
}

/**
 * @param {ReturnType<import('./config.js').leerConfig>} config
 * @param {{ modo?: 'smtp' | 'consola' | 'memoria' }} [opciones]  modo: otro que el de la configuración (las pruebas
 *   levantan la app de producción con el correo en memoria)
 */
export function crearCorreo(config, { modo = config.correoModo } = {}) {
  const casilla = config.SMTP_USUARIO ?? null
  const configurado = Boolean(casilla) && (modo !== 'smtp' || Boolean(config.SMTP_HOST && config.SMTP_CLAVE))
  const transporte = configurado ? crearTransporte(config, modo) : null
  /** Los mails que salieron en modo memoria (las pruebas). */
  const enviados = []
  let falla = null
  let estado = { ok: null, codigo: null, en: null, desde: null }

  function anotar(ok, codigo = null) {
    const en = new Date()
    estado = ok
      ? { ok: true, codigo: null, en, desde: null }
      : { ok: false, codigo, en, desde: estado.ok === false ? estado.desde : en }
  }

  function fallo(err, momento) {
    const codigo = codigoDeCorreo(err)
    anotar(false, codigo)
    log('aviso', 'correo_fallido', { codigo, momento })
    return codigo
  }

  /** Manda un mail (ya armado) por el transporte del modo. Tira con el código si falla. */
  async function mandar(mail, momento) {
    if (!transporte) throw Object.assign(new Error('No hay casilla de envío configurada'), { code: 'ESINCASILLA' })
    try {
      if (falla) throw Object.assign(new Error('Falla simulada'), { code: falla })
      const info = await transporte.sendMail(mail)
      if (modo === 'memoria') enviados.push({ ...mail, crudo: info.message.toString('utf8') })
      // Solo en local (config.js no deja usar consola en producción): el mail tal como saldría.
      if (modo === 'consola') console.log(`--- Correo (CORREO_MODO=consola: no se mandó) ---\n${info.message.toString('utf8')}\n---`)
      anotar(true)
    } catch (err) {
      const codigo = fallo(err, momento)
      throw Object.assign(new Error(`No se pudo mandar el correo (${codigo})`), { code: codigo })
    }
  }

  return {
    modo,
    /** Hay casilla de envío: sin ella el formulario no se dibuja (falta además el destino, server/contacto.js). */
    configurado,
    /** El estado del correo (una copia). */
    estado: () => ({ ...estado }),
    enviados,
    /** Modo memoria (las pruebas): los envíos y las verificaciones siguientes fallan con ese código (null: dejan de fallar). */
    simularFalla(codigo) {
      falla = codigo
    },
    /**
     * Prueba la casilla (smtp: transporte.verify(), que conecta, saluda y se autentica, sin mandar nada). Nunca tira:
     * devuelve { ok, codigo } (ok null: sin casilla configurada) y deja el resultado en el estado.
     */
    async verificar() {
      if (!configurado) return { ok: null, codigo: null }
      let reloj
      try {
        if (falla) throw Object.assign(new Error('Falla simulada'), { code: falla })
        if (modo === 'smtp') {
          const tope = new Promise((_, rechazar) => {
            reloj = setTimeout(() => rechazar(Object.assign(new Error('tope'), { code: 'ETIMEDOUT' })), TOPE_VERIFICACION_MS)
          })
          await Promise.race([transporte.verify(), tope])
        }
        anotar(true)
        return { ok: true, codigo: null }
      } catch (err) {
        return { ok: false, codigo: fallo(err, 'verificacion') }
      } finally {
        clearTimeout(reloj)
      }
    },
    /**
     * Manda un mensaje del formulario al destino. Tira (con el código en err.code) si no sale.
     * @param {{ nombre: string, email: string, mensaje: string }} datos
     * @param {string} destino
     */
    async enviarContacto(datos, destino, { ahora = new Date() } = {}) {
      await mandar(armarCorreo(datos, destino, { casilla, ahora }), 'envio')
    },
    /** El mail de prueba de npm run probar-correo, a una dirección cualquiera. */
    async probarCorreo(para, { ahora = new Date() } = {}) {
      await mandar(
        {
          from: { name: NOMBRE_REMITENTE, address: casilla },
          to: para,
          subject: 'Prueba de la casilla de envío de mupa.ar',
          text:
            'Este es un correo de prueba de la casilla de envío del formulario de contacto de mupa.ar.\n' +
            'Si llegó, la configuración funciona: no hay que responderlo.\n\n' +
            `${cuandoEs(ahora)} (hora de San Juan)\n`,
        },
        'prueba',
      )
    },
  }
}
