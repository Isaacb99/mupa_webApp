// El formulario de contacto del sitio (E4.5 y E4.9; plan 8, 4.6 y 4.7). Sin JavaScript: un <form method="post"> que
// manda application/x-www-form-urlencoded a POST /contacto, y la respuesta es una página entera (o un 303).
//
// crearContacto(): el servicio, que comparten la página (GET /contacto: ¿se dibuja el formulario?), POST /contacto, el
// panel (/estado y /mensajes, con el correo) y las tareas diarias (el correo).
// - El formulario se dibuja si hay casilla de envío (SMTP_USUARIO, server/correo.js) y dirección de destino (la carga un
//   admin en Datos del museo: museo.email_destino_contacto). Si no, la página muestra el correo público y el teléfono.
// - La dirección de destino se lee de la base en cada pedido y NUNCA sale del servidor (ni al estado de la página ni al
//   log): la página solo sabe si hay formulario. Con SIN_BASE (solo local), la del museo de ejemplo (maximo) o ninguna.
// - Nada espera a la base sin tope (CON-01 de la verificación de E4): leer el destino, guardar el mensaje y anotar
//   cómo salió tienen TOPE_BASE_MS cada uno (server/tope.js), y el INSERT y el UPDATE van en una transacción corta con
//   statement_timeout, así una tabla bloqueada (una migración) no retiene una conexión del pool: Postgres corta la
//   sentencia. Solo en estas consultas: un statement_timeout para toda la conexión cortaría también las migraciones y
//   las fotos grandes.
//
// crearRecepcion(): POST /contacto, en este orden (plan 8):
//   1. CSRF por origen (la misma regla que la API del panel, crearVerificadorDeOrigen): 403 simple;
//   2. application/x-www-form-urlencoded (si no, 415 simple) y el cuerpo, hasta 64 kB (413);
//   3. el campo trampa (sitio_web, oculto: solo lo llenan los robots): si trae algo, 303 como si hubiera salido, sin
//      guardar ni mandar nada;
//   4. sin formulario (sin casilla), la página con el aviso y lo escrito (503);
//   5. el esquema (compartido/esquemas/contacto.js): la página con los errores y lo escrito (400). Va ANTES de los
//      límites: un error no gasta intentos;
//   6. un mensaje repetido (el mismo correo y el mismo texto que otro de hace menos de REPETIDO_MS: el doble clic en
//      Enviar, con o sin JavaScript, CON-02): si el anterior se recibió, 303 sin guardar ni mandar otra vez; si todavía
//      está en curso, espera cómo termina. Tampoco gasta intentos;
//   7. los límites (5 por hora por IP y 50 por día entre todos, server/limites.js): la página con el aviso y lo
//      escrito (429). Cuentan todo pedido válido que llega acá, también si la persona (o un robot) corta la conexión
//      antes de la respuesta (COD-01): nunca se descuenta;
//   8. el destino (sin destino: la página con el aviso y lo escrito, 503) y se GUARDA el mensaje (envio = 'pendiente');
//   9. se MANDA por correo y la fila pasa a 'enviado' o a 'fallido' con el código. Con el mensaje guardado, el envío
//      tiene además un tope total (TOPE_ENVIO_MS: nodemailer solo tiene topes por fase y un servidor lento podía
//      demorar la respuesta 20 s o más): si se pasa, se responde igual y la fila se anota cuando termine;
//  10. si quedó guardado o salió por correo: 303 a /contacto?enviado=<marca>#formulario (el museo lo ve en Mensajes y
//      el Inicio avisa si no salió). Si no se pudo ni guardar ni mandar: la página con lo escrito y "No pudimos enviar
//      tu mensaje…" (503).
// La marca de ?enviado= (marcaDeEnviado) es la hora del envío firmada por el servidor y vale VIGENCIA_AVISO_MS: la
// página dice "Recibimos tu mensaje" (y la analítica cuenta enviar_contacto) solo si llegó con el 303 de un envío, no
// con una dirección compartida o guardada (CON-04 y COD-02 de la verificación de E4; antes era ?enviado=1).
// Toda respuesta de POST /contacto va con no-store y sin cookies. La página se dibuja con el render de siempre
// (ssr.dibujarPagina, la página 'contacto' de src/paginas/Contacto.jsx) y los errores como códigos (los textos, en
// src/content.js). En el log, solo códigos: nunca el nombre, el correo ni el mensaje (plan 9).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import express from 'express'
import { QueryTypes } from 'sequelize'
import { CAMPOS_CONTACTO, TRAMPA } from '../compartido/contacto.js'
import { erroresDeContacto, esquemaContacto } from '../compartido/esquemas/contacto.js'
import { crearCorreo } from './correo.js'
import { paginaDeError } from './errores.js'
import { crearLimitesDeContacto } from './limites.js'
import { codigoDeError, log } from './log.js'
import { crearVerificadorDeOrigen } from './seguridad.js'
import { baseNoDisponible, conTope, TOPE } from './tope.js'

/** La dirección de destino del museo de ejemplo de SIN_BASE=maximo (example.com: reservado para ejemplos). */
export const DESTINO_DE_EJEMPLO = 'destino@example.com'
/**
 * Los topes de tiempo del formulario. base: cada consulta (leer el destino, guardar, anotar cómo salió); envio: el
 * envío por correo entero, cuando el mensaje ya quedó guardado (sin guardar, se esperan los topes de nodemailer: el
 * correo es lo único que queda).
 */
export const TOPES_CONTACTO = Object.freeze({ base: 4_000, envio: 15_000 })
/** Cuánto vale la marca de ?enviado= ("Recibimos tu mensaje" al recargar la página o volver a ella). */
export const VIGENCIA_AVISO_MS = 10 * 60_000
/** Un mensaje igual a otro (mismo correo y mismo texto) de hace menos que esto es el mismo, mandado dos veces. */
export const REPETIDO_MS = 2 * 60_000
/** Cuántos mensajes recientes se recuerdan para eso (los más viejos salen primero). */
const REPETIDOS_MAX = 500
/** Cuánto espera un repetido a que termine el primero (después sigue como uno nuevo). */
const ESPERA_REPETIDO_MS = 60_000
/** Hasta cuánto de lo escrito se devuelve en la página cuando hay que corregir algo (lo demás se descarta). */
const LARGO_DEVUELTO = 10_000

// La clave de las marcas de ?enviado=: una por proceso. Un reinicio solo hace que una marca anterior deje de decir
// "Recibimos tu mensaje" (el mensaje ya se recibió).
const CLAVE_MARCA = randomBytes(32)
const firmar = (texto) => createHmac('sha256', CLAVE_MARCA).update(texto).digest('base64url').slice(0, 22)

/** La marca de ?enviado= de un mensaje recibido ahora: la hora (en base 36) y su firma. */
export function marcaDeEnviado(ahora = Date.now()) {
  const hora = Math.floor(ahora).toString(36)
  return `${hora}.${firmar(hora)}`
}

/**
 * ¿Es una marca de ?enviado= hecha por este servidor hace menos de VIGENCIA_AVISO_MS? (1, una vieja o cualquier otra
 * cosa: no; la página es la de siempre).
 * @param {unknown} valor
 */
export function esMarcaDeEnviado(valor, ahora = Date.now()) {
  if (typeof valor !== 'string' || valor.length > 40) return false
  const [hora, firma, ...resto] = valor.split('.')
  if (resto.length || !hora || !firma || !/^[0-9a-z]{1,12}$/.test(hora)) return false
  const esperada = Buffer.from(firmar(hora))
  const recibida = Buffer.from(firma)
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return false
  const edad = ahora - Number.parseInt(hora, 36)
  return edad >= -60_000 && edad < VIGENCIA_AVISO_MS
}

/** La huella de un mensaje para reconocer el repetido: el correo (sin mayúsculas) y el texto, ya validados. */
export const huellaDeMensaje = ({ email, mensaje }) =>
  createHash('sha256').update(`${String(email).toLowerCase()}\n${mensaje}`).digest('base64url')

/**
 * @param {{ config: ReturnType<import('./config.js').leerConfig>, sequelize?: import('sequelize').Sequelize | null,
 *   correo?: ReturnType<typeof crearCorreo>, topes?: Partial<typeof TOPES_CONTACTO> }} deps
 *   correo: el de la app (sin él, uno con la configuración); topes: otros topes (las pruebas, para no esperar 4 s)
 */
export function crearContacto({ config, sequelize = null, correo = crearCorreo(config), topes = {} }) {
  const t = { ...TOPES_CONTACTO, ...topes }
  // El statement_timeout del INSERT y el UPDATE: un poco menos que el tope, así con una tabla bloqueada corta Postgres
  // (y suelta la conexión) antes de que se responda.
  const topeSentencia = Math.max(100, Math.round(t.base * 0.75))

  /**
   * La dirección de destino, o null si no hay. Tira BASE_NO_DISPONIBLE si la base falla o no contesta a tiempo.
   * @returns {Promise<string | null>}
   */
  async function destino() {
    if (config.sinBase) return config.sinBase === 'maximo' ? DESTINO_DE_EJEMPLO : null
    if (!sequelize) return null
    try {
      const consulta = sequelize.query('SELECT email_destino_contacto AS destino FROM museo WHERE id = 1', {
        type: QueryTypes.SELECT,
      })
      const [fila] = await conTope(consulta, t.base)
      const valor = fila?.destino
      return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
    } catch (err) {
      throw baseNoDisponible(err)
    }
  }

  /** ¿Se dibuja el formulario? (casilla y destino). Tira BASE_NO_DISPONIBLE si la base falla. */
  async function formularioActivo() {
    if (!correo.configurado) return false
    return (await destino()) !== null
  }

  /** Una escritura en una transacción con statement_timeout (solo para ella: SET LOCAL). */
  function escribir(hacer) {
    return sequelize.transaction(async (transaction) => {
      await sequelize.query(`SET LOCAL statement_timeout = ${topeSentencia}`, { transaction })
      return hacer(transaction)
    })
  }

  /**
   * Guarda un mensaje (pendiente de envío) y devuelve la promesa de su id, SIN tope: quien la usa le pone el suyo y,
   * si se pasa, la sigue mirando (la fila puede guardarse igual un poco después).
   */
  function guardar({ nombre, email, mensaje }) {
    if (!sequelize) return Promise.reject(Object.assign(new Error('Sin base'), { code: 'SIN_BASE' }))
    return escribir(async (transaction) => {
      const fila = await sequelize.models.MensajeContacto.create(
        { nombre, email, mensaje, envio: 'pendiente' },
        { transaction },
      )
      return fila.id
    })
  }

  /** Anota cómo salió el envío de un mensaje guardado (con tope). */
  async function marcar(id, envio, error = null) {
    await conTope(
      escribir((transaction) => sequelize.models.MensajeContacto.update({ envio, error }, { where: { id }, transaction })),
      t.base,
    )
  }

  return { correo, destino, formularioActivo, guardar, marcar, topes: t }
}

/** Lo que escribió la persona, para volver a dibujarlo (solo textos, y con un tope). */
function valoresDe(cuerpo) {
  const valores = {}
  for (const campo of CAMPOS_CONTACTO) {
    const v = cuerpo?.[campo]
    valores[campo] = typeof v === 'string' ? v.slice(0, LARGO_DEVUELTO) : ''
  }
  return valores
}

/**
 * Una respuesta simple (sin el bundle), con no-store: el origen ajeno (403) y el tipo equivocado (415, con el texto
 * del 400: el de 415 habla del JSON de la API).
 */
function simple(res, status) {
  res
    .status(status)
    .set('Cache-Control', 'no-store')
    .type('html')
    .send(paginaDeError(status === 415 ? 400 : status))
}

/**
 * Los mensajes recientes, para reconocer el repetido (paso 6): huella -> { momento, recibido } (recibido: la promesa
 * de cómo terminó: true si se recibió). En memoria, como los límites: hay una sola instancia y un reinicio solo lo
 * vacía. Como mucho REPETIDOS_MAX, los más viejos salen primero.
 */
function crearRepetidos() {
  const recientes = new Map()
  function limpiar(ahora) {
    for (const [huella, e] of recientes) {
      if (ahora - e.momento < REPETIDO_MS && recientes.size <= REPETIDOS_MAX) break
      recientes.delete(huella)
    }
  }
  return {
    /** La promesa de cómo terminó uno igual reciente, o null. */
    buscar(huella) {
      limpiar(Date.now())
      return recientes.get(huella)?.recibido ?? null
    },
    /** Anota uno que empieza; devuelve la función que dice cómo terminó (true: se recibió). */
    anotar(huella) {
      let terminar
      const recibido = new Promise((resolver) => {
        terminar = resolver
      })
      recientes.delete(huella)
      recientes.set(huella, { momento: Date.now(), recibido })
      limpiar(Date.now())
      return (ok) => {
        terminar(Boolean(ok))
        // Uno que no se recibió no frena al siguiente igual (la persona lo vuelve a intentar).
        if (!ok && recientes.get(huella)?.recibido === recibido) recientes.delete(huella)
      }
    },
  }
}

/**
 * POST /contacto: los middlewares, en orden, para app.post('/contacto', …).
 * @param {{ config: object, contacto: ReturnType<typeof crearContacto>,
 *   ssr: { dibujarPagina: (req, res, opciones: { status: number, pagina: string, datos: object, cache?: string }) => Promise<void> } }} deps
 */
export function crearRecepcion({ config, contacto, ssr }) {
  const esDelSitio = crearVerificadorDeOrigen(config)
  const leerFormulario = express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 20 })
  const { correo } = contacto
  const topes = contacto.topes ?? TOPES_CONTACTO
  const repetidos = crearRepetidos()

  /** La página de Contacto otra vez, con lo escrito y los errores (no-store). */
  const dibujar = (req, res, status, datos) =>
    ssr.dibujarPagina(req, res, {
      status,
      pagina: 'contacto',
      cache: 'no-store',
      datos: { formulario: true, enviado: false, valores: null, errores: null, error: null, ...datos },
    })

  const recibido = (res) =>
    res.set('Cache-Control', 'no-store').redirect(303, `/contacto?enviado=${marcaDeEnviado()}#formulario`)

  // Sin línea en el log (como la CSRF de la API): quien insiste desde otro sitio no lo llena.
  function origen(req, res, next) {
    if (!esDelSitio(req)) return simple(res, 403)
    next()
  }

  function tipo(req, res, next) {
    if (!req.is('application/x-www-form-urlencoded')) return simple(res, 415)
    next()
  }

  function trampa(req, res, next) {
    const valor = req.body?.[TRAMPA]
    // Un robot que llena todo: parece que salió, pero no se guarda ni se manda nada.
    if (valor !== undefined && (typeof valor !== 'string' || valor.trim() !== '')) {
      log('info', 'contacto_trampa')
      return recibido(res)
    }
    next()
  }

  // Sin casilla no hay formulario; con ella, el esquema. Ninguno de los dos gasta intentos.
  function validar(req, res, next) {
    const valores = valoresDe(req.body)
    if (!correo.configurado) return dibujar(req, res, 503, { formulario: false, valores, error: 'no_disponible' })
    const r = esquemaContacto.safeParse(req.body ?? {})
    if (!r.success) return dibujar(req, res, 400, { valores, errores: erroresDeContacto(r.error) })
    req.contacto = { valores, datos: r.data, terminar: null }
    next()
  }

  // Express 5 lleva al manejador de errores lo que tire una función async (acá y en recibir).
  async function repetido(req, res, next) {
    const huella = huellaDeMensaje(req.contacto.datos)
    const anterior = repetidos.buscar(huella)
    if (anterior && (await conTope(anterior, ESPERA_REPETIDO_MS).catch(() => false))) {
      log('info', 'contacto_repetido')
      return recibido(res)
    }
    req.contacto.terminar = repetidos.anotar(huella)
    next()
  }

  /** Anota cómo salió el envío de una fila guardada; nunca tira (si no puede, lo dice el log). */
  async function anotar(id, envio, codigo) {
    try {
      await contacto.marcar(id, envio, envio === 'enviado' ? null : codigo)
    } catch (err) {
      log('aviso', 'contacto_no_marcado', { codigo: codigoDeError(err) ?? null })
    }
  }

  /**
   * Manda el mensaje. Devuelve { envio, codigo, final }: envio 'enviado', 'fallido' o, si se pasó el tope con el
   * mensaje guardado, 'pendiente' (sigue saliendo); final: la promesa de cómo terminó ({ envio, codigo }), que nunca
   * se rechaza.
   */
  async function enviar(datos, destino, guardado) {
    if (!destino) {
      const r = { envio: 'fallido', codigo: 'SIN_DESTINO' }
      return { ...r, final: Promise.resolve(r) }
    }
    const salida = correo.enviarContacto(datos, destino)
    const final = salida.then(
      () => ({ envio: 'enviado', codigo: null }),
      (err) => ({ envio: 'fallido', codigo: err.code ?? 'EDESCONOCIDO' }),
    )
    try {
      await (guardado ? conTope(salida, topes.envio) : salida)
      return { envio: 'enviado', codigo: null, final }
    } catch (err) {
      if (err.code === TOPE) return { envio: 'pendiente', codigo: TOPE, final }
      return { envio: 'fallido', codigo: err.code ?? 'EDESCONOCIDO', final }
    }
  }

  /** Lo que sigue a los límites. Devuelve true si el mensaje se recibió (el 303). */
  async function procesar(req, res) {
    const { valores, datos } = req.contacto
    if (req.limiteContacto) {
      await dibujar(req, res, 429, { valores, error: req.limiteContacto })
      return false
    }

    // El destino: sin él (lo borraron mientras la persona escribía) no hay formulario. Si la base no responde, se
    // intenta guardar igual (y sin destino no se puede mandar).
    let destino
    try {
      destino = await contacto.destino()
    } catch (err) {
      log('aviso', 'contacto_sin_base', { codigo: err.causa ?? codigoDeError(err) })
      destino = undefined
    }
    if (destino === null) {
      await dibujar(req, res, 503, { formulario: false, valores, error: 'no_disponible' })
      return false
    }

    // Guardar, con tope. Si la base no contesta a tiempo se sigue como "no guardado"; si la fila se guarda igual un
    // poco después, se le anota cómo salió el envío.
    const guardando = contacto.guardar(datos)
    let id = null
    try {
      id = await conTope(guardando, topes.base)
    } catch (err) {
      log('aviso', 'contacto_no_guardado', { codigo: codigoDeError(err) ?? null })
    }
    const envio = await enviar(datos, destino, id !== null)
    if (id !== null) {
      if (envio.envio === 'pendiente') envio.final.then((r) => anotar(id, r.envio, r.codigo))
      else await anotar(id, envio.envio, envio.codigo)
    } else {
      guardando.then(
        (tarde) => envio.final.then((r) => anotar(tarde, r.envio, r.codigo)),
        () => {},
      )
    }
    log('info', 'contacto', {
      guardado: id !== null,
      envio: envio.envio,
      ...(envio.envio === 'enviado' ? {} : { codigo: envio.codigo }),
    })
    if (id !== null || envio.envio === 'enviado') {
      recibido(res)
      return true
    }
    await dibujar(req, res, 503, { valores, error: 'no_enviado' })
    return false
  }

  async function recibir(req, res) {
    let ok = false
    try {
      ok = await procesar(req, res)
    } finally {
      // Siempre: un repetido que espera a éste sigue (y uno que no se recibió no frena al próximo intento).
      req.contacto?.terminar?.(ok)
    }
  }

  return [origen, tipo, leerFormulario, trampa, validar, repetido, ...crearLimitesDeContacto(), recibir]
}
