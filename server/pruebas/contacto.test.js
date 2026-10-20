// El formulario de contacto y sus mensajes (E4.5 y E4.9; plan 8, 4.6, 4.7 y 13.1, contacto.test.js).
// - Sin base: el esquema (códigos por campo, enlaces, saltos de línea, caracteres ilegibles), armarCorreo (From la
//   casilla, Reply-To el visitante, asunto en una línea aunque el nombre traiga CRLF, texto plano), la configuración
//   (SMTP_*), el correo en memoria y contra un SMTP falso local (server/pruebas/smtpFalso.js: acepta, rechaza con 535 o
//   corta la conexión; nunca un mail de verdad), estadoDelCorreo y la página con la base caída (GET 503, POST 503 con
//   lo escrito).
// - Con base (la página con el render de verdad, como ssr.test.js): el formulario solo con casilla y destino; un envío
//   correcto (303, fila "enviado", el mail en memoria); un transporte que falla (fila "fallido" con el código, 303
//   igual y el aviso del Inicio para los dos roles); guardado y envío que fallan los dos (503 con lo escrito y el
//   correo público); la trampa (303 sin guardar ni mandar); CSRF; Content-Type; validación (400 no-store con lo escrito
//   y los errores; un CRLF en el nombre no llega al asunto); límites (5 por hora por IP, 50 por día entre todos; un
//   error de validación no gasta intentos); no-store y sin cookies; los mensajes de más de 180 días y la casilla en la
//   tarea diaria; GET /mensajes solo admin, del más nuevo al más viejo, de a 50; y el log sin direcciones, nombres ni
//   el texto de los mensajes. De punta a punta, también contra el SMTP falso.
// - Desde la corrección de E4 (ronda 1): la marca firmada de ?enviado= (CON-04/COD-02); el nombre sin invisibles y el
//   mensaje pegado acomodado (CON-05/06); SMTP_PUERTO y TLS (COD-05); conTope (COD-04); y con base, los límites que
//   cuentan aunque se corte la conexión (COD-01), sin cabeceras RateLimit (CON-03), el mensaje repetido (CON-02), los
//   topes de la base y del envío (CON-01) y lo escrito a la vista en el 503 no_disponible (CON-07). Cada envío que
//   tiene que guardarse lleva un texto distinto (unico()): uno igual a otro reciente es el mismo mandado dos veces.
import assert from 'node:assert/strict'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, beforeEach, describe, test } from 'node:test'
import { CONTACTO, contarEnlaces, sinInvisibles, unaLinea } from '../../compartido/contacto.js'
import { acomodarMensaje, erroresDeContacto, esquemaContacto } from '../../compartido/esquemas/contacto.js'
import { estadoDelCorreo } from '../api/estado.js'
import { crearApp } from '../app.js'
import { leerConfig } from '../config.js'
import { crearContacto, esMarcaDeEnviado, huellaDeMensaje, marcaDeEnviado, VIGENCIA_AVISO_MS } from '../contacto.js'
import { armarCorreo, codigoDeCorreo, crearCorreo, NOMBRE_REMITENTE, opcionesSmtp } from '../correo.js'
import { crearConexion } from '../db/conexion.js'
import { crearMuseoPublico } from '../museo.js'
import { crearSsr, partir } from '../ssr.js'
import { crearRegistroDeTareas, programarTareas } from '../tareas.js'
import { conTope } from '../tope.js'
import { cerrarBase, escucharLogs, levantar, pedir, prepararBase, salteoVisible, sql } from './ayudas.js'
import { smtpFalso } from './smtpFalso.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const PLANTILLA =
  '<!doctype html><html lang="es"><head><meta charset="UTF-8" /><!--head--></head>' +
  '<body><div id="root"><!--app--></div><!--estado--></body></html>\n'

// El render de verdad, con el Vite del proyecto (su propia caché, en el temporal del sistema).
let vite
let entrada
before(async () => {
  const { createServer } = await import('vite')
  vite = await createServer({
    root: RAIZ,
    configFile: false,
    cacheDir: join(tmpdir(), 'mupa-vite-pruebas-contacto'),
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  entrada = await vite.ssrLoadModule('/src/entry-server.jsx')
})
after(() => vite?.close())
const obtener = async () => ({ partes: partir(PLANTILLA), render: entrada.render })

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

/** El estado de la página (el JSON de <script id="estado">). */
const estadoDe = (html) => JSON.parse(/<script id="estado" type="application\/json">(.*?)<\/script>/s.exec(html)[1])
/** Un cuerpo de formulario (application/x-www-form-urlencoded). */
const formulario = (campos) => new URLSearchParams(campos).toString()
const BIEN = { nombre: 'Ana Pérez', email: 'ana.perez@example.com', mensaje: 'Hola, quería saber si abren el feriado.', sitio_web: '' }
// La casilla de prueba: sin SMTP_USUARIO no hay formulario. Host y clave de mentira (el correo de estas pruebas va en
// memoria o al SMTP falso).
const CASILLA = { SMTP_USUARIO: 'web@example.com', SMTP_HOST: 'smtp.invalid', SMTP_CLAVE: 'clave-de-prueba' }
const enMemoria = (config) => crearCorreo(config, { modo: 'memoria' })
const configProduccion = (env = {}) =>
  leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://x:y@127.0.0.1:1/z', ...env })
/** Un mensaje que no es igual a ninguno anterior (uno igual a otro reciente se toma como repetido: CON-02). */
let numero = 0
const unico = (cambios = {}) => ({ ...BIEN, mensaje: `${BIEN.mensaje} Consulta número ${(numero += 1)}.`, ...cambios })
/** La dirección del 303 de un mensaje recibido: /contacto?enviado=<marca>#formulario. */
const RECIBIDO = /^\/contacto\?enviado=[0-9a-z]+\.[\w-]{22}#formulario$/
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
/** Un correo en memoria que tarda ms en cada envío (el de un SMTP de verdad tarda): para cortar antes la conexión. */
const lento = (ms) => (config) => {
  const correo = enMemoria(config)
  const enviar = correo.enviarContacto
  correo.enviarContacto = async (...args) => {
    await espera(ms)
    return enviar(...args)
  }
  return correo
}
/**
 * Un POST /contacto que corta la conexión a los ms, antes de la respuesta (como un robot que no espera, COD-01).
 * Resuelve al cortar.
 */
function postCortado(puerto, campos, ip, ms = 60) {
  const cuerpo = formulario(campos)
  return new Promise((resolver) => {
    const socket = connect(puerto, '127.0.0.1', () => {
      socket.write(
        'POST /contacto HTTP/1.1\r\nHost: mupa.ar\r\n' +
          `X-Forwarded-For: ${ip}\r\nSec-Fetch-Site: same-origin\r\n` +
          `Content-Type: application/x-www-form-urlencoded\r\nContent-Length: ${Buffer.byteLength(cuerpo)}\r\n\r\n${cuerpo}`,
      )
      setTimeout(() => {
        socket.destroy()
        resolver()
      }, ms)
    })
    socket.on('error', () => {})
  })
}

describe('sin base: el esquema, el mail y el correo', () => {
  test('el esquema: el primer código de cada campo; lo de más (la trampa) se descarta', () => {
    const errores = (datos) => {
      const r = esquemaContacto.safeParse(datos)
      return r.success ? null : erroresDeContacto(r.error)
    }
    assert.deepEqual(esquemaContacto.parse(BIEN), { nombre: 'Ana Pérez', email: 'ana.perez@example.com', mensaje: BIEN.mensaje })
    assert.deepEqual(errores({}), { nombre: 'falta', email: 'falta', mensaje: 'falta' })
    assert.deepEqual(errores({ nombre: '  ', email: ' ', mensaje: '   ' }), { nombre: 'falta', email: 'falta', mensaje: 'falta' })
    assert.deepEqual(errores({ ...BIEN, nombre: 'x'.repeat(101) }), { nombre: 'largo' })
    assert.equal(errores({ ...BIEN, nombre: 'x'.repeat(100) }), null)
    for (const nombre of ['Ana\r\nBcc: x@example.com', 'Ana\nPérez', 'Ana\rPérez', 'Ana\u0000', 'Ana\u2028Pérez', 'Ana\tPérez']) {
      assert.deepEqual(errores({ ...BIEN, nombre }), { nombre: 'una_linea' }, JSON.stringify(nombre))
    }
    assert.deepEqual(errores({ ...BIEN, nombre: 'Ana \uFFFD' }), { nombre: 'ilegible' })
    for (const email of ['ana', 'ana@', 'ana@example', 'a b@example.com', '<ana@example.com>', 'ana@example.com\r\nBcc: x@y.z']) {
      assert.deepEqual(errores({ ...BIEN, email }), { email: 'invalido' }, email)
    }
    assert.deepEqual(errores({ ...BIEN, email: `${'a'.repeat(250)}@example.com` }), { email: 'largo' })
    assert.deepEqual(errores({ ...BIEN, mensaje: 'Hola' }), { mensaje: 'corto' })
    assert.deepEqual(errores({ ...BIEN, mensaje: 'x'.repeat(5001) }), { mensaje: 'largo' })
    assert.equal(errores({ ...BIEN, mensaje: 'x'.repeat(5000) }), null)
    // Los saltos de línea de Windows cuentan como uno: 4999 letras y un \r\n entran.
    assert.equal(esquemaContacto.parse({ ...BIEN, mensaje: `${'x'.repeat(2500)}\r\n${'y'.repeat(2499)}` }).mensaje.length, 5000)
    const enlaces = (n) => Array.from({ length: n }, (_, i) => `https://example.com/${i}`).join(' y ')
    assert.equal(errores({ ...BIEN, mensaje: `Miren: ${enlaces(3)}` }), null)
    assert.deepEqual(errores({ ...BIEN, mensaje: `Miren: ${enlaces(4)}` }), { mensaje: 'enlaces' })
    assert.deepEqual(errores({ ...BIEN, mensaje: 'Miren www.a.com, http://b.com, https://c.com y WWW.D.COM' }), { mensaje: 'enlaces' })
    // Los caracteres de control no son un error: se sacan (CON-06; ver la prueba siguiente).
    assert.equal(errores({ ...BIEN, mensaje: 'Un mensaje con un \u0000 adentro' }), null)
    assert.deepEqual(errores({ ...BIEN, mensaje: 'Un mensaje con \uFFFD adentro' }), { mensaje: 'ilegible' })
    // Tabuladores y saltos de línea, sí.
    assert.equal(errores({ ...BIEN, mensaje: 'Primera línea\n\tSegunda con sangría' }), null)
    // Un campo que llegó dos veces (una lista) cuenta como que falta.
    assert.deepEqual(errores({ ...BIEN, nombre: ['Ana', 'Otra'] }), { nombre: 'falta' })
    assert.equal(contarEnlaces('sin enlaces: museo.com'), 0)
    assert.equal(CONTACTO.MENSAJE_MAX, 5000)
  })

  test('el nombre sin invisibles (CON-05) y el mensaje pegado acomodado (CON-06)', () => {
    const datos = (cambios) => esquemaContacto.parse({ ...BIEN, ...cambios })
    const errores = (cambios) => {
      const r = esquemaContacto.safeParse({ ...BIEN, ...cambios })
      return r.success ? null : erroresDeContacto(r.error)
    }
    // Solo invisibles (ancho cero, dirección, rellenos del hangul) o sin ninguna letra ni número: como si faltara.
    for (const nombre of ['\u200B\u200B', '\u3164', '\u115F\u1160', '\uFFA0 ', '\u202E', '\u2066\u2069', '!!!', '🦖']) {
      assert.deepEqual(errores({ nombre }), { nombre: 'falta' }, JSON.stringify(nombre))
    }
    // Los invisibles se sacan (el de dirección daba vuelta "Ana txt.exe" en el asunto); los que unen emojis quedan.
    assert.equal(datos({ nombre: 'Ana \u202Etxt.exe' }).nombre, 'Ana txt.exe')
    assert.equal(datos({ nombre: '\u200BAna\u200B Pérez\u2066' }).nombre, 'Ana Pérez')
    assert.equal(datos({ nombre: 'Ana 👩\u200D🔬' }).nombre, 'Ana 👩\u200D🔬')
    assert.equal(datos({ nombre: 'Ana 3' }).nombre, 'Ana 3')
    // El mensaje pegado de otro lado: los saltos de línea de todos lados pasan a \n, lo demás de control se saca.
    assert.equal(datos({ mensaje: 'Hola,\u2028quería consultar\u2029por las visitas.' }).mensaje, 'Hola,\nquería consultar\npor las visitas.')
    assert.equal(datos({ mensaje: 'Primera\u000BSegunda\u000CTercera\u0085Cuarta' }).mensaje, 'Primera\nSegunda\nTercera\nCuarta')
    assert.equal(datos({ mensaje: 'Un mensaje con un \u0000 adentro' }).mensaje, 'Un mensaje con un  adentro')
    assert.equal(
      datos({ mensaje: '\u0093Hola\u0094 \u0096 dijo \u0091ella\u0092 \u0097 fin' }).mensaje,
      '“Hola” – dijo ‘ella’ — fin',
    )
    assert.equal(acomodarMensaje('\u0001\u0007 hola \t\n'), 'hola')
    assert.equal(acomodarMensaje('a\r\nb\rc\n\td'), 'a\nb\nc\n\td')
    // Lo que queda corto después de acomodar, corto; solo controles, vacío.
    assert.deepEqual(errores({ mensaje: `${'\u0000'.repeat(20)}Hola` }), { mensaje: 'corto' })
    assert.deepEqual(errores({ mensaje: '\u0000\u0001\u0002' }), { mensaje: 'falta' })
    // La segunda red, en el asunto del mail.
    assert.equal(unaLinea('Ana \u202Etxt.exe\u200B'), 'Ana txt.exe')
    assert.equal(unaLinea('\u200B\u200B'), '')
    assert.equal(sinInvisibles('a\u200Bb\u3164c\u00ADd'), 'abcd')
    assert.equal(sinInvisibles('👩\u200D🔬 y \u200C'), '👩\u200D🔬 y \u200C')
    // La huella del repetido: el correo sin mayúsculas y el texto.
    assert.equal(huellaDeMensaje({ email: 'Ana@Example.com', mensaje: 'Hola.' }), huellaDeMensaje({ email: 'ana@example.com', mensaje: 'Hola.' }))
    assert.notEqual(huellaDeMensaje({ email: 'ana@example.com', mensaje: 'Hola.' }), huellaDeMensaje({ email: 'ana@example.com', mensaje: 'Hola!' }))
  })

  test('la marca de ?enviado=: la firma el servidor y vale 10 minutos; 1 u otra cosa no (CON-04 y COD-02)', () => {
    const ahora = Date.UTC(2026, 9, 20, 15, 0)
    const marca = marcaDeEnviado(ahora)
    assert.match(marca, /^[0-9a-z]+\.[\w-]{22}$/)
    assert.equal(esMarcaDeEnviado(marca, ahora), true)
    assert.equal(esMarcaDeEnviado(marca, ahora + VIGENCIA_AVISO_MS - 1), true)
    assert.equal(esMarcaDeEnviado(marca, ahora + VIGENCIA_AVISO_MS), false)
    // Una de mucho más adelante (un reloj raro) tampoco.
    assert.equal(esMarcaDeEnviado(marca, ahora - 5 * 60_000), false)
    const [hora, firma] = marca.split('.')
    const otraHora = (Number.parseInt(hora, 36) + 1000).toString(36)
    const otraFirma = `${firma.slice(0, -1)}${firma.endsWith('A') ? 'B' : 'A'}`
    for (const mala of ['1', '', 'abc', `${otraHora}.${firma}`, `${hora}.${otraFirma}`, `${hora}.${firma}.x`, hora, `${hora.toUpperCase()}.${firma}`, null, undefined, ['1']]) {
      assert.equal(esMarcaDeEnviado(mala, ahora), false, String(mala))
    }
  })

  test('conTope (server/tope.js): lo de la promesa, o TOPE si no termina a tiempo, sin rechazos sin atender', async () => {
    assert.equal(await conTope(Promise.resolve(3), 50), 3)
    await assert.rejects(conTope(new Promise(() => {}), 20, 'tarde'), { code: 'TOPE', message: 'tarde' })
    await assert.rejects(conTope(Promise.reject(Object.assign(new Error('x'), { code: 'E1' })), 50), { code: 'E1' })
    let sinAtender = 0
    const contar = () => (sinAtender += 1)
    process.on('unhandledRejection', contar)
    try {
      const despues = new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('después')), 30))
      await assert.rejects(conTope(despues, 5), { code: 'TOPE' })
      await espera(60)
      assert.equal(sinAtender, 0)
    } finally {
      process.off('unhandledRejection', contar)
    }
  })

  test('armarCorreo: From la casilla, Reply-To el visitante, asunto en una línea y texto plano', () => {
    const ahora = new Date('2026-10-19T18:30:00Z')
    const mail = armarCorreo(
      { nombre: 'Ana\r\nBcc: alguien@example.com', email: 'ana@example.com', mensaje: 'Hola.\nChau.' },
      'destino@example.com',
      { casilla: 'web@example.com', ahora },
    )
    assert.deepEqual(mail.from, { name: NOMBRE_REMITENTE, address: 'web@example.com' })
    assert.equal(mail.to, 'destino@example.com')
    assert.deepEqual(mail.replyTo, { name: 'Ana Bcc: alguien@example.com', address: 'ana@example.com' })
    assert.equal(mail.subject, 'Consulta desde mupa.ar: Ana Bcc: alguien@example.com')
    assert.doesNotMatch(mail.subject, /[\r\n]/)
    assert.equal(mail.text, 'Hola.\nChau.\n\nAna Bcc: alguien@example.com <ana@example.com>\nLunes 19 de octubre de 2026, 15:30 (hora de San Juan)\n')
    assert.equal(mail.html, undefined)
    assert.equal(unaLinea(' a\u2028b\u0007c\t d  '), 'a b c d')
    assert.equal(codigoDeCorreo({ code: 'EAUTH' }), 'EAUTH')
    assert.equal(codigoDeCorreo({ code: 'algo raro con espacios' }), 'EDESCONOCIDO')
    assert.equal(codigoDeCorreo(new Error('sin código')), 'EDESCONOCIDO')
  })

  test('la configuración: sin SMTP_USUARIO no hay casilla; con ella, en smtp, SMTP_HOST y SMTP_CLAVE; sin mostrar valores', () => {
    assert.equal(crearCorreo(configProduccion()).configurado, false)
    assert.throws(() => configProduccion({ SMTP_USUARIO: 'web@example.com' }), (err) => {
      assert.match(err.message, /SMTP_HOST/)
      assert.match(err.message, /SMTP_CLAVE/)
      assert.doesNotMatch(err.message, /web@example\.com/)
      return true
    })
    assert.throws(() => configProduccion({ ...CASILLA, SMTP_USUARIO: 'no es un correo' }), /SMTP_USUARIO/)
    assert.throws(() => configProduccion({ ...CASILLA, SMTP_HOST: 'smtp hostinger' }), /SMTP_HOST/)
    const config = configProduccion(CASILLA)
    assert.equal(config.SMTP_PUERTO, 465)
    assert.equal(crearCorreo(config).configurado, true)
    // En consola o memoria alcanza con la casilla (no se conecta a nada).
    const local = leerConfig({ SMTP_USUARIO: 'web@example.com' })
    assert.equal(local.correoModo, 'consola')
    assert.equal(crearCorreo(local).configurado, true)
    assert.equal(crearCorreo(leerConfig({})).configurado, false)
    // En producción, solo smtp.
    assert.throws(() => configProduccion({ CORREO_MODO: 'memoria' }), /CORREO_MODO/)
  })

  test('SMTP_PUERTO: en producción, 465 o 587 (salvo contra esta máquina); fuera de 465, STARTTLS obligatorio (COD-05)', () => {
    for (const puerto of ['465', '587']) assert.equal(configProduccion({ ...CASILLA, SMTP_PUERTO: puerto }).SMTP_PUERTO, Number(puerto))
    for (const puerto of ['25', '2525', '1025']) {
      assert.throws(() => configProduccion({ ...CASILLA, SMTP_PUERTO: puerto }), /SMTP_PUERTO: en producción, 465 \(SSL\) o 587/, puerto)
    }
    // Contra esta misma máquina (el SMTP falso de las pruebas), cualquiera: la contraseña no sale a la red.
    assert.equal(configProduccion({ ...CASILLA, SMTP_HOST: '127.0.0.1', SMTP_PUERTO: '40123' }).SMTP_PUERTO, 40123)
    const tls = (env) => {
      const o = opcionesSmtp(leerConfig({ ...CASILLA, CORREO_MODO: 'smtp', ...env }))
      return [o.secure, o.requireTLS]
    }
    assert.deepEqual(tls({ SMTP_PUERTO: '465' }), [true, false])
    assert.deepEqual(tls({ SMTP_PUERTO: '587' }), [false, true])
    // Fuera de producción también: sin STARTTLS, nodemailer no se autentica (nunca la contraseña sin cifrar).
    assert.deepEqual(tls({ SMTP_PUERTO: '2525' }), [false, true])
    assert.deepEqual(tls({ SMTP_HOST: '127.0.0.1', SMTP_PUERTO: '2525' }), [false, false])
    assert.deepEqual(tls({ SMTP_HOST: 'localhost', SMTP_PUERTO: '25' }), [false, false])
    assert.deepEqual(tls({ SMTP_HOST: '127.evil.example', SMTP_PUERTO: '25' }), [false, true])
  })

  test('en memoria: los mails quedan en enviados; simularFalla hace fallar envíos y verificaciones; el estado', async () => {
    const logs = escucharLogs()
    try {
      const correo = enMemoria(configProduccion(CASILLA))
      assert.deepEqual(correo.estado(), { ok: null, codigo: null, en: null, desde: null })
      assert.deepEqual(await correo.verificar(), { ok: true, codigo: null })
      await correo.enviarContacto({ nombre: 'Ana', email: 'ana@example.com', mensaje: 'Hola, buenas tardes.' }, 'destino@example.com')
      assert.equal(correo.enviados.length, 1)
      assert.match(correo.enviados[0].crudo, /^Content-Type: text\/plain; charset=utf-8$/m)
      correo.simularFalla('EAUTH')
      await assert.rejects(correo.enviarContacto({ nombre: 'Ana', email: 'ana@example.com', mensaje: 'Hola, otra vez.' }, 'x@example.com'), { code: 'EAUTH' })
      const primero = correo.estado()
      assert.equal(primero.ok, false)
      assert.equal(primero.codigo, 'EAUTH')
      assert.deepEqual(await correo.verificar(), { ok: false, codigo: 'EAUTH' })
      // La racha conserva desde cuándo.
      assert.equal(correo.estado().desde.getTime(), primero.desde.getTime())
      correo.simularFalla(null)
      assert.deepEqual(await correo.verificar(), { ok: true, codigo: null })
      assert.equal(correo.estado().desde, null)
      // Sin casilla: verificar no hace nada y enviar tira.
      const sinCasilla = enMemoria(configProduccion())
      assert.deepEqual(await sinCasilla.verificar(), { ok: null, codigo: null })
      await assert.rejects(sinCasilla.enviarContacto({ nombre: 'A', email: 'a@example.com', mensaje: 'x'.repeat(20) }, 'd@example.com'))
    } finally {
      logs.detener()
    }
    // El log: solo el código.
    const fallidos = logs.eventos().filter((e) => e.evento === 'correo_fallido')
    assert.deepEqual(fallidos.map((e) => [e.codigo, e.momento]), [['EAUTH', 'envio'], ['EAUTH', 'verificacion']])
    assert.doesNotMatch(logs.lineas.join('\n'), /@|Hola/)
  })

  test('contra un SMTP falso: el mail que llega (cabeceras y texto); 535 da EAUTH; una conexión cortada, ECONNECTION', async () => {
    const smtp = await smtpFalso()
    const logs = escucharLogs()
    try {
      const correo = crearCorreo(configProduccion({ ...CASILLA, SMTP_HOST: '127.0.0.1', SMTP_PUERTO: String(smtp.puerto) }))
      assert.equal(correo.modo, 'smtp')
      assert.deepEqual(await correo.verificar(), { ok: true, codigo: null })
      await correo.enviarContacto(
        { nombre: 'Ana Pérez\r\nBcc: intruso@example.com', email: 'ana@example.com', mensaje: 'Hola, ¿abren el feriado?\nGracias.' },
        'destino@example.com',
      )
      assert.equal(smtp.mensajes.length, 1)
      const { de, para, datos } = smtp.mensajes[0]
      // El sobre: de la casilla al destino, nada más (ni el visitante ni un Bcc metido en el nombre).
      assert.equal(de, 'web@example.com')
      assert.deepEqual(para, ['destino@example.com'])
      // Las cabeceras, con las líneas dobladas (las que siguen con un espacio adelante) vueltas a juntar.
      const cabeceras = datos.split('\r\n\r\n')[0].replace(/\r\n[ \t]+/g, ' ')
      const lineas = cabeceras.split('\r\n')
      assert.ok(lineas.includes('From: "Formulario de mupa.ar" <web@example.com>'), cabeceras)
      assert.ok(lineas.includes('To: destino@example.com'), cabeceras)
      assert.ok(lineas.some((l) => /^Reply-To: .*<ana@example\.com>$/.test(l)), cabeceras)
      assert.ok(lineas.includes('Content-Type: text/plain; charset=utf-8'), cabeceras)
      // Ni Bcc ni Cc ni otra cabecera metida en el nombre: una sola línea de asunto, codificada.
      assert.ok(!lineas.some((l) => /^(Bcc|Cc):/i.test(l)), cabeceras)
      assert.equal(lineas.filter((l) => l.startsWith('Subject: ')).length, 1)
      assert.ok(!lineas.some((l) => /^From:.*ana@example\.com/.test(l)))

      smtp.modo = 'rechaza'
      assert.deepEqual(await correo.verificar(), { ok: false, codigo: 'EAUTH' })
      await assert.rejects(correo.enviarContacto({ nombre: 'A', email: 'a@example.com', mensaje: 'Un mensaje.' }, 'd@example.com'), { code: 'EAUTH' })
      smtp.modo = 'corta'
      const cortada = await correo.verificar()
      assert.equal(cortada.ok, false)
      assert.ok(['ECONNECTION', 'ESOCKET'].includes(cortada.codigo), cortada.codigo)
      assert.equal(smtp.mensajes.length, 1)
    } finally {
      logs.detener()
      await smtp.cerrar()
    }
    assert.doesNotMatch(logs.lineas.join('\n'), /@|Hola|Pérez/)
  })

  test('estadoDelCorreo: sin casilla, ok, falla por la casilla o por mensajes sin enviar (desde el primero)', () => {
    const fila = (cambios = {}) => ({ email_destino_contacto: 'd@example.com', sin_enviar: 0, sin_enviar_desde: null, sin_enviar_codigo: null, ...cambios })
    assert.deepEqual(estadoDelCorreo(null, fila()), { estado: 'sin_configurar', formulario: false, desde: null, codigo: null, sinEnviar: 0 })
    const correo = enMemoria(configProduccion(CASILLA))
    assert.deepEqual(estadoDelCorreo(correo, fila()), { estado: 'ok', formulario: true, desde: null, codigo: null, sinEnviar: 0 })
    assert.equal(estadoDelCorreo(correo, fila({ email_destino_contacto: '  ' })).formulario, false)
    const desde = new Date('2026-10-18T12:00:00Z')
    assert.deepEqual(estadoDelCorreo(correo, fila({ sin_enviar: 2, sin_enviar_desde: desde, sin_enviar_codigo: 'ETIMEDOUT' })), {
      estado: 'falla',
      formulario: true,
      desde: desde.toISOString(),
      codigo: 'ETIMEDOUT',
      sinEnviar: 2,
    })
  })

  test('con la base caída: GET /contacto, la 503 simple; POST /contacto, la página otra vez con lo escrito (503)', async () => {
    const config = configProduccion(CASILLA)
    const caida = crearConexion(config)
    const correo = enMemoria(config)
    const ssr = crearSsr({
      config,
      obtener,
      museoPublico: crearMuseoPublico(config, { sequelize: caida }),
      sequelize: caida,
      contacto: crearContacto({ config, sequelize: caida, correo }),
    })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const logs = escucharLogs()
    try {
      const pagina = await pedir(puerto, 'GET', '/contacto')
      assert.equal(pagina.status, 503)
      assert.equal(pagina.h['cache-control'], 'no-store')
      const r = await pedir(puerto, 'POST', '/contacto', { cuerpo: formulario(BIEN), tipo: 'application/x-www-form-urlencoded' })
      assert.equal(r.status, 503, r.texto)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.equal(r.h['set-cookie'], undefined)
      const estado = estadoDe(r.texto)
      assert.equal(estado.pagina, 'contacto')
      assert.equal(estado.datos.error, 'no_enviado')
      assert.deepEqual(estado.datos.valores, { nombre: BIEN.nombre, email: BIEN.email, mensaje: BIEN.mensaje })
      assert.equal(correo.enviados.length, 0)
      assert.match(r.texto, /No pudimos enviar tu mensaje/)
    } finally {
      logs.detener()
      await new Promise((r) => servidor.close(r))
      await caida.close()
    }
    assert.ok(logs.eventos().some((e) => e.evento === 'contacto_no_guardado'))
    assert.doesNotMatch(logs.lineas.join('\n'), /ana\.perez|Ana Pérez|feriado/)
  })
})

describe('el formulario de contacto con base', { skip: base.motivo ?? false }, () => {
  let s
  let admin
  let editor
  let logs
  const enviar = (campos, o = {}) =>
    s.pedir('POST', '/contacto', { cuerpo: formulario(campos), tipo: 'application/x-www-form-urlencoded', ...o })
  const filas = () => sql('SELECT id, nombre, email, mensaje, envio, error FROM mensajes_contacto ORDER BY id')
  const estado = async (quien) => {
    const r = await s.pedir('GET', 'api:/estado', { cookie: quien.cookie })
    assert.equal(r.status, 200, r.texto)
    return r.json.data.correo
  }
  /** Una IP distinta por prueba, así los límites de una no tocan a otra. */
  let ultimaIp = 10
  const otraIp = () => `198.51.100.${(ultimaIp += 1)}`

  before(async () => {
    s = await levantar(CASILLA, { obtener, correo: enMemoria })
    admin = await s.cookiePara('admin')
    editor = await s.cookiePara('editor')
    await sql(
      `UPDATE museo SET email_destino_contacto = 'destino.secreto@example.com', email_publico = 'museo@example.com',
         telefono = '+54 264 000-0000', mapa_embed_url = 'https://www.google.com/maps/embed?pb=prueba', updated_at = now()
       WHERE id = 1`,
    )
    logs = escucharLogs()
  })
  after(async () => {
    logs?.detener()
    await s?.cerrar()
  })
  // Cada prueba arranca sin mensajes y con el correo andando (los límites siguen: cada una usa sus IP).
  beforeEach(async () => {
    await sql('DELETE FROM mensajes_contacto')
    s.correo.enviados.length = 0
    s.correo.simularFalla(null)
  })

  test('GET /contacto: el formulario (con la trampa oculta), el mapa y los datos; sin el correo de destino en ningún lado', async () => {
    const r = await s.pedir('GET', '/contacto')
    assert.equal(r.status, 200)
    assert.equal(r.h['cache-control'], 'no-cache')
    assert.equal(r.h['set-cookie'], undefined)
    const e = estadoDe(r.texto)
    assert.equal(e.pagina, 'contacto')
    assert.deepEqual(e.datos, { formulario: true, enviado: false, valores: null, errores: null, error: null })
    assert.doesNotMatch(r.texto, /destino\.secreto/)
    assert.match(r.texto, /<form [^>]*action="\/contacto#formulario" method="post">/)
    const etiqueta = (nombre) => new RegExp(`<(?:input|textarea)[^>]*name="${nombre}"[^>]*>`).exec(r.texto)?.[0] ?? ''
    for (const campo of ['nombre', 'email', 'mensaje']) assert.match(etiqueta(campo), /required=""/, campo)
    assert.match(etiqueta('email'), /type="email"/)
    assert.match(etiqueta('nombre'), /maxLength="100"/)
    assert.match(etiqueta('mensaje'), /minLength="10"/)
    assert.match(etiqueta('mensaje'), /maxLength="5000"/)
    // La trampa: oculta, fuera del Tab y del lector de pantalla, sin autocompletar y vacía.
    const trampa = etiqueta('sitio_web')
    for (const atributo of ['tabindex="-1"', 'autoComplete="off"', 'value=""']) assert.ok(trampa.includes(atributo), atributo)
    assert.match(r.texto, /<div aria-hidden="true" class="sr-only"><label for="contacto-sitio-web">/)
    assert.match(r.texto, /<iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=prueba" title="Mapa con la ubicación del museo" loading="lazy"/)
    assert.match(r.texto, /href="mailto:museo@example\.com"/)
    assert.match(r.texto, /href="tel:\+542640000000"/)
    // La CSP pública deja el mapa (www.google.com en frame-src) y nada más: además, lo propio ('self', lo que valía
    // antes por default-src; sin él un marco del sitio quedaba bloqueado).
    assert.match(r.h['content-security-policy'], /; frame-src 'self' https:\/\/www\.google\.com;/)
    // ?enviado=<marca> (la del 303 de un envío): el aviso.
    const enviado = await s.pedir('GET', `/contacto?enviado=${marcaDeEnviado()}`)
    assert.equal(estadoDe(enviado.texto).datos.enviado, true)
    assert.match(enviado.texto, /Recibimos tu mensaje/)
    // El canonical, sin la consulta.
    assert.match(enviado.texto, /<link rel="canonical" href="https:\/\/mupa\.ar\/contacto" \/>/)
    // ?enviado=1 (una dirección vieja o armada a mano), una marca vencida o una inventada: la página de siempre, sin
    // "Recibimos tu mensaje" (CON-04 y COD-02: tampoco la cuenta la analítica).
    const vieja = marcaDeEnviado(Date.now() - VIGENCIA_AVISO_MS - 1000)
    for (const consulta of ['enviado=1', `enviado=${vieja}`, 'enviado=mvgt7xc0.AAAAAAAAAAAAAAAAAAAAAA']) {
      const otra = await s.pedir('GET', `/contacto?${consulta}`)
      assert.equal(otra.status, 200, consulta)
      assert.equal(estadoDe(otra.texto).datos.enviado, false, consulta)
      assert.doesNotMatch(otra.texto, /Recibimos tu mensaje/, consulta)
    }
  })

  test('sin dirección de destino o sin casilla, no hay formulario (quedan el correo público y el teléfono)', async () => {
    await sql(`UPDATE museo SET email_destino_contacto = NULL WHERE id = 1`)
    try {
      const r = await s.pedir('GET', '/contacto')
      assert.equal(estadoDe(r.texto).datos.formulario, false)
      assert.doesNotMatch(r.texto, /<form/)
      assert.match(r.texto, /href="mailto:museo@example\.com"/)
      const post = await enviar(unico(), { ip: otraIp() })
      assert.equal(post.status, 503)
      assert.equal(estadoDe(post.texto).datos.error, 'no_disponible')
      assert.equal((await filas()).length, 0)
      // Lo escrito queda a la vista, para copiarlo y mandarlo al correo público (CON-07).
      assert.match(post.texto, /<textarea id="contacto-escrito" readOnly="" rows="8"[^>]*>Hola, quería saber si abren el feriado\. Consulta número \d+\.<\/textarea>/)
      assert.match(post.texto, /href="mailto:museo@example\.com"/)
    } finally {
      await sql(`UPDATE museo SET email_destino_contacto = 'destino.secreto@example.com' WHERE id = 1`)
    }
    const sinCasilla = await levantar({}, { obtener })
    try {
      const r = await sinCasilla.pedir('GET', '/contacto')
      assert.equal(estadoDe(r.texto).datos.formulario, false)
      const post = await sinCasilla.pedir('POST', '/contacto', { cuerpo: formulario(BIEN), tipo: 'application/x-www-form-urlencoded' })
      assert.equal(post.status, 503)
      assert.equal(estadoDe(post.texto).datos.error, 'no_disponible')
      assert.equal((await filas()).length, 0)
    } finally {
      await sinCasilla.cerrar()
    }
  })

  test('un envío correcto: 303 a /contacto?enviado=<marca>#formulario, no-store, sin cookies; la fila "enviado" y el mail', async () => {
    const datos = unico()
    const r = await enviar(datos, { ip: otraIp(), cookie: `${s.nombreCookie}=${'a'.repeat(43)}` })
    assert.equal(r.status, 303, r.texto)
    assert.match(r.h.location, RECIBIDO)
    assert.equal(r.h['cache-control'], 'no-store')
    assert.equal(r.h['set-cookie'], undefined)
    // Sin las cabeceras RateLimit: la del límite de todos contaba en público los mensajes del día (CON-03).
    assert.equal(r.h.ratelimit, undefined)
    assert.equal(r.h['ratelimit-policy'], undefined)
    // La página a la que lleva dice "Recibimos tu mensaje".
    const despues = await s.pedir('GET', r.h.location.replace('#formulario', ''))
    assert.equal(estadoDe(despues.texto).datos.enviado, true)
    const [fila] = await filas()
    assert.deepEqual(fila, { id: fila.id, nombre: datos.nombre, email: datos.email, mensaje: datos.mensaje, envio: 'enviado', error: null })
    const [mail] = s.correo.enviados
    assert.equal(mail.to, 'destino.secreto@example.com')
    assert.deepEqual(mail.from, { name: NOMBRE_REMITENTE, address: 'web@example.com' })
    assert.deepEqual(mail.replyTo, { name: datos.nombre, address: datos.email })
    assert.equal(mail.subject, `Consulta desde mupa.ar: ${datos.nombre}`)
    assert.ok(mail.text.startsWith(`${datos.mensaje}\n\n${datos.nombre} <${datos.email}>\n`))
    assert.match(mail.crudo, /^Content-Type: text\/plain; charset=utf-8$/m)
    // Sin Sec-Fetch-Site, con el Origin del sitio (o el de Render) también.
    for (const origen of ['https://mupa.ar', 'https://mupa-web.onrender.com']) {
      const otro = await enviar(unico(), { ip: otraIp(), sitio: null, origen })
      assert.equal(otro.status, 303, origen)
    }
    assert.equal((await filas()).length, 3)
    await sql('DELETE FROM mensajes_contacto')
    s.correo.enviados.length = 0
  })

  test('la trampa con algo: 303 como si hubiera salido, sin guardar ni mandar nada', async () => {
    for (const trampa of ['https://spam.example.com', ' x ']) {
      const r = await enviar(unico({ sitio_web: trampa }), { ip: otraIp() })
      assert.equal(r.status, 303)
      assert.match(r.h.location, RECIBIDO)
    }
    // Repetido (una lista) también cuenta como lleno.
    const doble = await s.pedir('POST', '/contacto', {
      cuerpo: `${formulario(BIEN)}&sitio_web=`,
      tipo: 'application/x-www-form-urlencoded',
      ip: otraIp(),
    })
    assert.equal(doble.status, 303)
    assert.equal((await filas()).length, 0)
    assert.equal(s.correo.enviados.length, 0)
  })

  test('CSRF: Sec-Fetch-Site cross-site, same-site o none, Origin ajeno o ninguno: 403 sin guardar nada', async () => {
    for (const { sitio, origen } of [
      { sitio: 'cross-site' },
      { sitio: 'same-site' },
      { sitio: 'none' },
      { sitio: 'cross-site', origen: 'https://mupa.ar' },
      { sitio: null, origen: 'https://evil.example' },
      { sitio: null, origen: 'null' },
      { sitio: null, origen: null },
    ]) {
      const r = await enviar(BIEN, { ip: otraIp(), sitio, origen })
      assert.equal(r.status, 403, `${sitio} / ${origen}`)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.doesNotMatch(r.texto, /<script/)
    }
    assert.equal((await filas()).length, 0)
    assert.equal(s.correo.enviados.length, 0)
  })

  test('Content-Type que no es un formulario: 415; un cuerpo enorme: 413; nada guardado', async () => {
    for (const tipo of ['application/json', 'text/plain', 'multipart/form-data; boundary=x', null]) {
      const r = await s.pedir('POST', '/contacto', { cuerpo: tipo === 'application/json' ? JSON.stringify(BIEN) : formulario(BIEN), tipo, ip: otraIp() })
      assert.equal(r.status, 415, String(tipo))
      assert.equal(r.h['cache-control'], 'no-store')
    }
    const grande = await enviar({ ...BIEN, mensaje: 'x'.repeat(70_000) }, { ip: otraIp() })
    assert.equal(grande.status, 413)
    assert.equal((await filas()).length, 0)
  })

  test('validación: 400 no-store con lo escrito y un código por campo; un CRLF en el nombre no llega a ningún lado', async () => {
    const casos = [
      [{ ...BIEN, nombre: '' }, { nombre: 'falta' }],
      [{ ...BIEN, nombre: 'Ana\r\nBcc: intruso@example.com' }, { nombre: 'una_linea' }],
      [{ ...BIEN, nombre: 'x'.repeat(101) }, { nombre: 'largo' }],
      [{ ...BIEN, email: 'no-es-un-correo' }, { email: 'invalido' }],
      [{ ...BIEN, mensaje: 'Hola' }, { mensaje: 'corto' }],
      [{ ...BIEN, mensaje: 'https://a.com https://b.com https://c.com https://d.com' }, { mensaje: 'enlaces' }],
      [{ sitio_web: '' }, { nombre: 'falta', email: 'falta', mensaje: 'falta' }],
    ]
    const ip = otraIp()
    for (const [campos, errores] of casos) {
      const r = await enviar(campos, { ip })
      assert.equal(r.status, 400, JSON.stringify(campos))
      assert.equal(r.h['cache-control'], 'no-store')
      assert.equal(r.h['set-cookie'], undefined)
      const e = estadoDe(r.texto)
      assert.deepEqual(e.datos.errores, errores)
      assert.equal(e.datos.formulario, true)
      assert.deepEqual(e.datos.valores, { nombre: campos.nombre ?? '', email: campos.email ?? '', mensaje: campos.mensaje ?? '' })
      // Lo que dibuja la página: el resumen y cada campo con su error.
      assert.match(r.texto, /Revisá estos datos/)
      for (const campo of Object.keys(errores)) {
        assert.match(r.texto, new RegExp(`aria-invalid="true" aria-describedby="contacto-${campo}-error"`), campo)
      }
    }
    // Lo escrito vuelve escapado (también en el estado).
    const escrito = await enviar({ ...BIEN, nombre: '</script><script>alert(1)</script>', mensaje: 'corto' }, { ip })
    assert.equal(escrito.status, 400)
    assert.doesNotMatch(escrito.texto, /<script>alert/)
    assert.equal(estadoDe(escrito.texto).datos.valores.nombre, '</script><script>alert(1)</script>')
    assert.equal((await filas()).length, 0)
    assert.equal(s.correo.enviados.length, 0)
    // Los errores no gastaron intentos: esa IP todavía manda sus 5.
    for (let i = 0; i < 5; i++) assert.equal((await enviar(unico(), { ip })).status, 303, `envío ${i + 1}`)
    assert.equal((await filas()).length, 5)
    await sql('DELETE FROM mensajes_contacto')
    s.correo.enviados.length = 0
  })

  test('un transporte que falla: 303 igual, la fila "fallido" con el código y el aviso del Inicio para los dos roles', async () => {
    assert.equal((await estado(editor)).estado, 'ok')
    s.correo.simularFalla('EAUTH')
    try {
      const ip = otraIp()
      for (let i = 0; i < 2; i++) assert.equal((await enviar(unico(), { ip })).status, 303)
    } finally {
      s.correo.simularFalla(null)
    }
    const guardados = await filas()
    assert.deepEqual(guardados.map((f) => [f.envio, f.error]), [['fallido', 'EAUTH'], ['fallido', 'EAUTH']])
    for (const quien of [editor, admin]) {
      const correo = await estado(quien)
      assert.equal(correo.estado, 'falla')
      assert.equal(correo.formulario, true)
      assert.equal(correo.codigo, 'EAUTH')
      assert.equal(correo.sinEnviar, 2)
      assert.ok(Date.parse(correo.desde) > Date.now() - 60_000)
      assert.doesNotMatch(JSON.stringify(correo), /@/)
    }
    // Uno que sale después: el aviso se va (los fallidos de antes del último enviado no cuentan).
    assert.equal((await enviar(unico(), { ip: otraIp() })).status, 303)
    assert.deepEqual(await estado(editor), { estado: 'ok', formulario: true, desde: null, codigo: null, sinEnviar: 0 })
    await sql('DELETE FROM mensajes_contacto')
    s.correo.enviados.length = 0
  })

  test('si no se puede guardar pero sale por correo: 303; si fallan los dos: 503 con lo escrito y el correo público', async () => {
    await sql('ALTER TABLE mensajes_contacto RENAME TO mensajes_contacto_aparte')
    try {
      const ip = otraIp()
      const salio = await enviar(unico(), { ip })
      assert.equal(salio.status, 303)
      assert.equal(s.correo.enviados.length, 1)
      s.correo.simularFalla('ETIMEDOUT')
      const datos = unico()
      const r = await enviar(datos, { ip })
      assert.equal(r.status, 503, r.texto)
      assert.equal(r.h['cache-control'], 'no-store')
      const e = estadoDe(r.texto)
      assert.equal(e.datos.error, 'no_enviado')
      assert.deepEqual(e.datos.valores, { nombre: datos.nombre, email: datos.email, mensaje: datos.mensaje })
      assert.match(r.texto, /No pudimos enviar tu mensaje\. Probá más tarde o escribinos a <a href="mailto:museo@example\.com"/)
      // Lo escrito vuelve al formulario.
      assert.match(r.texto, /<textarea[^>]*>Hola, quería saber si abren el feriado\. Consulta número \d+\.<\/textarea>/)
      // Y el mismo mensaje otra vez (no se recibió: no es un repetido) vuelve a intentarlo.
      s.correo.simularFalla(null)
      assert.equal((await enviar(datos, { ip })).status, 303)
      assert.equal(s.correo.enviados.length, 2)
    } finally {
      s.correo.simularFalla(null)
      await sql('ALTER TABLE mensajes_contacto_aparte RENAME TO mensajes_contacto')
    }
    s.correo.enviados.length = 0
  })

  test('límites: 5 por hora desde una IP (el 6.º, 429 con lo escrito); otra IP sigue; 50 por día entre todos', async () => {
    const ip = otraIp()
    for (let i = 0; i < 5; i++) assert.equal((await enviar(unico(), { ip })).status, 303, `envío ${i + 1}`)
    const datos = unico()
    const sexto = await enviar(datos, { ip })
    assert.equal(sexto.status, 429)
    assert.equal(sexto.h['cache-control'], 'no-store')
    assert.ok(Number(sexto.h['retry-after']) > 0 && Number(sexto.h['retry-after']) <= 3600, sexto.h['retry-after'])
    assert.equal(sexto.h.ratelimit, undefined)
    assert.equal(sexto.h['ratelimit-policy'], undefined)
    const e = estadoDe(sexto.texto)
    assert.equal(e.datos.error, 'limite_ip')
    assert.equal(e.datos.valores.mensaje, datos.mensaje)
    assert.match(sexto.texto, /Mandaste varios mensajes en la última hora\. Probá más tarde o escribinos a/)
    assert.equal((await enviar(unico(), { ip: otraIp() })).status, 303)
    assert.equal((await filas()).length, 6)

    // El tope de todos, en una app nueva (los contadores van con la app): 50 entre 11 IPs y el 51, 429.
    const otra = await levantar(CASILLA, { obtener, correo: enMemoria })
    try {
      let n = 0
      for (let i = 0; n < 50; i++) {
        for (let j = 0; j < 5 && n < 50; j++, n++) {
          const r = await otra.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: `203.0.113.${i + 1}` })
          assert.equal(r.status, 303, `envío ${n + 1}`)
        }
      }
      const r = await otra.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: '203.0.113.200' })
      assert.equal(r.status, 429)
      assert.equal(estadoDe(r.texto).datos.error, 'limite_dia')
      assert.equal(r.h.ratelimit, undefined)
      assert.ok(Number(r.h['retry-after']) > 0)
      assert.match(r.texto, /Probá mañana o escribinos a/)
      assert.equal(otra.correo.enviados.length, 50)
    } finally {
      await otra.cerrar()
    }
    const lineas = logs.eventos().map((e) => e.evento)
    assert.equal(lineas.filter((e) => e === 'limite_contacto_ip').length, 1)
    assert.equal(lineas.filter((e) => e === 'limite_contacto_dia').length, 1)
    await sql('DELETE FROM mensajes_contacto')
    s.correo.enviados.length = 0
  })

  test('de punta a punta contra el SMTP falso: sale; con 535, "fallido" con EAUTH; caído, "fallido" igual', async () => {
    const smtp = await smtpFalso()
    const real = await levantar({ ...CASILLA, SMTP_HOST: '127.0.0.1', SMTP_PUERTO: String(smtp.puerto) }, { obtener })
    try {
      const mandar = (ip) => real.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip })
      assert.equal((await mandar('192.0.2.1')).status, 303)
      assert.equal(smtp.mensajes.length, 1)
      assert.deepEqual(smtp.mensajes[0].para, ['destino.secreto@example.com'])
      smtp.modo = 'rechaza'
      assert.equal((await mandar('192.0.2.2')).status, 303)
      smtp.modo = 'corta'
      assert.equal((await mandar('192.0.2.3')).status, 303)
      const guardados = await filas()
      assert.deepEqual(guardados.map((f) => f.envio), ['enviado', 'fallido', 'fallido'])
      assert.equal(guardados[1].error, 'EAUTH')
      assert.ok(['ECONNECTION', 'ESOCKET'].includes(guardados[2].error), guardados[2].error)
    } finally {
      await real.cerrar()
      await smtp.cerrar()
    }
    await sql('DELETE FROM mensajes_contacto')
  })

  test('los límites cuentan aunque se corte la conexión antes de la respuesta (COD-01): por IP y entre todos', async () => {
    // Una app nueva (contadores en cero) con un correo que tarda 300 ms: el robot corta a los 60 ms, mientras sale.
    const otra = await levantar(CASILLA, { obtener, correo: lento(300) })
    try {
      // 5 cortados desde una IP: el siguiente normal de esa IP, 429.
      for (let i = 0; i < 5; i++) await postCortado(otra.puerto, unico(), '192.0.2.50')
      const r = await otra.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: '192.0.2.50' })
      assert.equal(r.status, 429)
      assert.equal(estadoDe(r.texto).datos.error, 'limite_ip')
      // Hasta 50 entre todos (10 IP más de a 5, cortados): el siguiente de otra IP, 429 por el día.
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 5; j++) await postCortado(otra.puerto, unico(), `192.0.2.${60 + i}`)
      }
      const dia = await otra.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: '192.0.2.99' })
      assert.equal(dia.status, 429)
      assert.equal(estadoDe(dia.texto).datos.error, 'limite_dia')
      // Los cortados se guardaron y salieron igual (el servidor los termina): 50, no más.
      for (let i = 0; i < 40 && (await filas()).length < 50; i++) await espera(100)
      await espera(400)
      assert.equal((await filas()).length, 50)
      assert.equal(otra.correo.enviados.length, 50)
    } finally {
      await otra.cerrar()
    }
    await sql('DELETE FROM mensajes_contacto')
  })

  test('el mismo mensaje dos veces (el doble clic, CON-02): uno solo guardado y un solo mail; no gasta otro intento', async () => {
    const otra = await levantar(CASILLA, { obtener, correo: lento(250) })
    try {
      const ip = '192.0.2.120'
      const post = (datos) => otra.pedir('POST', '/contacto', { cuerpo: formulario(datos), tipo: 'application/x-www-form-urlencoded', ip })
      const datos = unico()
      // El segundo llega mientras el primero todavía está saliendo: espera cómo termina y responde lo mismo.
      const primero = post(datos)
      await espera(60)
      const segundo = post({ ...datos, email: datos.email.toUpperCase() })
      const [a, b] = await Promise.all([primero, segundo])
      assert.deepEqual([a.status, b.status], [303, 303])
      assert.match(b.h.location, RECIBIDO)
      assert.equal((await filas()).length, 1)
      assert.equal(otra.correo.enviados.length, 1)
      // Más tarde (dentro de los 2 minutos), lo mismo: 303 sin guardar ni mandar.
      assert.equal((await post(datos)).status, 303)
      assert.equal((await filas()).length, 1)
      // Los repetidos no gastaron intentos: quedan 4 de esa IP.
      for (let i = 0; i < 4; i++) assert.equal((await post(unico())).status, 303, `envío ${i + 1}`)
      assert.equal((await post(unico())).status, 429)
      assert.equal((await filas()).length, 5)
      assert.ok(logs.eventos().some((e) => e.evento === 'contacto_repetido'))
    } finally {
      await otra.cerrar()
    }
    await sql('DELETE FROM mensajes_contacto')
  })

  test('topes (CON-01): con la tabla bloqueada se responde igual (303 si salió el mail); el envío lento no frena la respuesta', async () => {
    // Con la tabla bloqueada (una migración), el INSERT corta por statement_timeout y el mensaje sale por correo.
    const otra = await levantar(CASILLA, { obtener, correo: enMemoria, topesContacto: { base: 600, envio: 300 } })
    const t = await base.sequelize.transaction()
    try {
      await base.sequelize.query('LOCK TABLE mensajes_contacto IN ACCESS EXCLUSIVE MODE', { transaction: t })
      const inicio = Date.now()
      const r = await otra.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: '192.0.2.130' })
      const tardo = Date.now() - inicio
      assert.equal(r.status, 303, r.texto)
      assert.ok(tardo < 3_000, `tardó ${tardo} ms`)
      assert.equal(otra.correo.enviados.length, 1)
    } finally {
      await t.rollback()
      await otra.cerrar()
    }
    // El INSERT se canceló (no quedó una fila suelta después).
    assert.equal((await filas()).length, 0)
    const contacto = logs.eventos().filter((e) => e.evento === 'contacto').at(-1)
    assert.deepEqual([contacto.guardado, contacto.envio], [false, 'enviado'])

    // Un correo que tarda más que el tope del envío: 303 con la fila "pendiente", que pasa a "enviado" cuando sale.
    const lentaApp = await levantar(CASILLA, { obtener, correo: lento(900), topesContacto: { envio: 200 } })
    try {
      const inicio = Date.now()
      const r = await lentaApp.pedir('POST', '/contacto', { cuerpo: formulario(unico()), tipo: 'application/x-www-form-urlencoded', ip: '192.0.2.131' })
      assert.equal(r.status, 303)
      assert.ok(Date.now() - inicio < 800, 'no esperó al correo')
      assert.deepEqual((await filas()).map((f) => f.envio), ['pendiente'])
      for (let i = 0; i < 30 && (await filas())[0].envio === 'pendiente'; i++) await espera(100)
      assert.deepEqual((await filas()).map((f) => [f.envio, f.error]), [['enviado', null]])
      assert.equal(lentaApp.correo.enviados.length, 1)
    } finally {
      await lentaApp.cerrar()
    }
    await sql('DELETE FROM mensajes_contacto')
  })

  test('la tarea diaria: borra los mensajes de más de 180 días y prueba la casilla (una que falla no es una tarea fallida)', async () => {
    await sql(
      `INSERT INTO mensajes_contacto (nombre, email, mensaje, envio, created_at) VALUES
         ('Viejo', 'viejo@example.com', 'Un mensaje viejo.', 'enviado', now() - interval '181 days'),
         ('Casi', 'casi@example.com', 'Un mensaje de hace 179 días.', 'enviado', now() - interval '179 days'),
         ('Nuevo', 'nuevo@example.com', 'Un mensaje de hoy.', 'fallido', now())`,
    )
    const registro = crearRegistroDeTareas()
    const correo = enMemoria(configProduccion(CASILLA))
    correo.simularFalla('ETIMEDOUT')
    const desde = logs.lineas.length
    const tareas = programarTareas({ sequelize: base.sequelize, registro, correo })
    await tareas.listas
    tareas.detener()
    assert.deepEqual((await filas()).map((f) => f.nombre), ['Casi', 'Nuevo'])
    assert.deepEqual(registro.fallidas(), [])
    assert.equal(correo.estado().ok, false)
    const nuevos = logs.lineas.slice(desde).flatMap((l) => (l.startsWith('{') ? [JSON.parse(l)] : []))
    assert.equal(nuevos.find((e) => e.evento === 'mensajes_viejos').borrados, 1)
    const casilla = nuevos.find((e) => e.evento === 'casilla_correo')
    assert.deepEqual([casilla.estado, casilla.codigo], ['falla', 'ETIMEDOUT'])
    // Sin correo (o sin casilla), la tarea no prueba nada y sale bien.
    const sinCorreo = programarTareas({ sequelize: base.sequelize, registro })
    await sinCorreo.listas
    sinCorreo.detener()
    assert.deepEqual(registro.fallidas(), [])
    await sql('DELETE FROM mensajes_contacto')
  })

  test('GET /mensajes: solo admin; del más nuevo al más viejo, de a 50; ?pagina= validada', async () => {
    await sql(
      `INSERT INTO mensajes_contacto (nombre, email, mensaje, envio, error, created_at)
       SELECT 'Persona ' || n, 'persona' || n || '@example.com', 'Mensaje número ' || n || '.',
              CASE WHEN n % 10 = 0 THEN 'fallido' ELSE 'enviado' END, CASE WHEN n % 10 = 0 THEN 'EAUTH' END,
              now() - make_interval(mins => 100 - n)
       FROM generate_series(1, 55) AS n`,
    )
    const deEditor = await s.pedir('GET', 'api:/mensajes', { cookie: editor.cookie })
    assert.equal(deEditor.status, 403)
    const sinSesion = await s.pedir('GET', 'api:/mensajes')
    assert.equal(sinSesion.status, 401)
    const primera = await s.pedir('GET', 'api:/mensajes', { cookie: admin.cookie })
    assert.equal(primera.status, 200)
    assert.equal(primera.h['cache-control'], 'no-store')
    const { items, total, pagina, por, paginas } = primera.json.data
    assert.deepEqual([total, pagina, por, paginas, items.length], [55, 1, 50, 2, 50])
    assert.equal(items[0].nombre, 'Persona 55')
    assert.deepEqual(Object.keys(items[0]).sort(), ['email', 'envio', 'error', 'fecha', 'id', 'mensaje', 'nombre'])
    assert.ok(items.every((m, i) => i === 0 || m.fecha <= items[i - 1].fecha))
    const cincuenta = items.find((m) => m.nombre === 'Persona 50')
    assert.deepEqual([cincuenta.envio, cincuenta.error, cincuenta.email], ['fallido', 'EAUTH', 'persona50@example.com'])
    assert.equal(items.find((m) => m.nombre === 'Persona 49').error, null)
    const segunda = await s.pedir('GET', 'api:/mensajes?pagina=2', { cookie: admin.cookie })
    assert.deepEqual(segunda.json.data.items.map((m) => m.nombre), ['Persona 5', 'Persona 4', 'Persona 3', 'Persona 2', 'Persona 1'])
    assert.equal((await s.pedir('GET', 'api:/mensajes?pagina=9', { cookie: admin.cookie })).json.data.items.length, 0)
    for (const malo of ['0', '-1', 'abc', '1.5', '100001']) {
      const r = await s.pedir('GET', `api:/mensajes?pagina=${malo}`, { cookie: admin.cookie })
      assert.equal(r.status, 400, malo)
      assert.ok(r.json.campos.pagina, malo)
    }
    await sql('DELETE FROM mensajes_contacto')
  })

  test('el log: solo códigos (sin direcciones, nombres ni el texto de los mensajes)', () => {
    const todo = logs.lineas.join('\n')
    assert.doesNotMatch(todo, /@/)
    assert.doesNotMatch(todo, /Ana Pérez|feriado|intruso|destino\.secreto/)
    const eventos = logs.eventos().map((e) => e.evento)
    for (const evento of ['contacto', 'contacto_trampa', 'correo_fallido', 'contacto_no_guardado']) {
      assert.ok(eventos.includes(evento), evento)
    }
  })
})
