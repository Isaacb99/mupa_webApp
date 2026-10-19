// Manejo de errores (plan 2.4, punto 9, y 4.1). Express 5 manda acá también los rechazos de los handlers async.
// - Se respeta err.status (o err.statusCode): 404 de un estático que falta, 400 de una URL mal codificada o de un
//   JSON roto, 413…
// - Los errores se traducen SOLO acá (plan 4.1): ZodError -> 400 con los campos; unique de Sequelize -> 409;
//   40P01 (deadlock de Postgres) y 23503 (una clave foránea: algo que se borró o se empezó a usar en el medio; desde
//   E3, una red: los pedidos de las fotos ya se bloquean para que no pase) -> 409 "reintentá"; un httpError() -> su
//   status y su mensaje; el resto -> 500 genérico. Las tres primeras, SOLO en /administracion/api (desde E4.5, también en POST /contacto): ahí son la
//   entrada del pedido. En una página pública, un ZodError viene de validar datos del servidor (la base, en
//   leerMuseo o en las páginas de E4) y es un 500 con su línea en el log, no un 400 del visitante.
// - En /administracion/api/…: { error, campos? } en JSON, en castellano.
// - Un 4xx en el resto (p. ej. un estático que falta): texto corto, nunca 500.
// - Un 5xx: una página simple, sin el bundle del sitio, con no-store. En el log, con el stack; un 5xx que es un
//   httpError() (ya hay 3 fotos subiéndose, sin argon2) es esperable: una línea de aviso, sin el stack.
// - Nunca el stack ni el mensaje de un error interno en la respuesta: van al log (server/log.js). Tampoco los
//   valores que vienen en el error (el correo repetido de un unique): ni a la respuesta ni al log.
import { ZodError } from 'zod'
import { RUTA_PANEL } from '../compartido/panel.js'
import { codigoDeError, log } from './log.js'

const TEXTOS = {
  400: 'El pedido no es válido.',
  403: 'No se puede acceder a esto.',
  404: 'No encontrado.',
  405: 'Método no permitido.',
  409: 'No se pudo guardar: choca con otro dato.',
  413: 'El pedido es demasiado grande.',
  415: 'El pedido tiene que ser JSON (Content-Type: application/json).',
  429: 'Demasiados pedidos. Probá de nuevo en unos minutos.',
  500: 'Algo salió mal. Probá de nuevo en unos minutos.',
  503: 'El sitio no está disponible en este momento. Probá de nuevo en unos minutos.',
}
const texto = (status) => TEXTOS[status] ?? (status >= 500 ? TEXTOS[500] : TEXTOS[400])

// Qué decir de un unique repetido, por columna (los valores nunca se repiten en la respuesta).
const REPETIDOS = {
  email: 'Ya hay una cuenta con ese correo.',
  slug: 'Ya hay otro con esa dirección.',
}

const API_PANEL = new RegExp(`^${RUTA_PANEL}/api(/|\\?|$)`, 'i')

/**
 * Un error con un mensaje para la persona (en castellano), que la API devuelve tal cual: { error: mensaje, ...extra }.
 * @param {number} status
 * @param {string} mensaje
 * @param {object} [extra]  p. ej. { campos: { actual: '…' } } o { debeCambiarClave: true }
 */
export function httpError(status, mensaje, extra) {
  return Object.assign(new Error(mensaje), { status, paraLaPersona: true, extra })
}

const esZod = (err) => err instanceof ZodError || err?.name === 'ZodError'

/**
 * Las columnas de un unique repetido. Sequelize las saca del detalle del error de Postgres ("Key (email)=(…)"), que
 * solo está en inglés: con el servidor en castellano (lc_messages de esta PC: "La llave (email)…") no las encuentra.
 * Entonces se toman del nombre de la restricción: <tabla>_<columna>_unico (las de las migraciones) o
 * <tabla>_<columna>_key (el nombre que pone Postgres).
 */
function camposRepetidos(err) {
  const deSequelize = (err.errors ?? []).map((e) => e.path).filter(Boolean)
  if (deSequelize.length) return deSequelize
  const restriccion = err.parent?.constraint ?? err.original?.constraint ?? ''
  const m = /^[a-z0-9]+_([a-z0-9_]+?)_(?:unico|key)$/.exec(restriccion)
  return m ? [m[1]] : []
}

/**
 * { status, cuerpo } de un error, o null si no es de los que se traducen.
 * @param {boolean} deEntrada  la ruta valida lo que manda la persona (la API del panel)
 */
function traducir(err, deEntrada) {
  if (err?.paraLaPersona) return { status: err.status, cuerpo: { error: err.message, ...err.extra } }
  if (!deEntrada) return null
  if (esZod(err)) {
    const campos = {}
    for (const problema of err.issues) {
      const campo = problema.path.join('.') || '_'
      campos[campo] ??= problema.message
    }
    return { status: 400, cuerpo: { error: 'Revisá los datos.', campos } }
  }
  if (err?.name === 'SequelizeUniqueConstraintError') {
    const campos = {}
    for (const campo of camposRepetidos(err)) campos[campo] = REPETIDOS[campo] ?? 'Ya está en uso.'
    const primero = Object.values(campos)[0]
    return { status: 409, cuerpo: { error: primero ?? TEXTOS[409], campos } }
  }
  if (codigoDeError(err) === '40P01') {
    return { status: 409, cuerpo: { error: 'Otro cambio se cruzó con este. Probá de nuevo.' } }
  }
  if (codigoDeError(err) === '23503') {
    return { status: 409, cuerpo: { error: 'Otro cambio se cruzó con este. Recargá la pantalla y probá de nuevo.' } }
  }
  return null
}

/** Página simple para los 5xx (y las 503 de las páginas internas cuando la base falle, E4): sin JS ni CSS externo. */
export function paginaDeError(status) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>MuPa - Museo Paleontológico de San Juan</title>
    <style>
      body { margin: 0; min-height: 100svh; display: grid; place-content: center; gap: 0.75rem; padding: 1.5rem;
             background: #0e100d; color: #eae2df; font: 1rem/1.5 system-ui, sans-serif; text-align: center; }
      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <h1>Museo Paleontológico de San Juan</h1>
    <p>${texto(status)}</p>
    <p><a href="/">Volver al inicio</a></p>
  </body>
</html>
`
}

export function manejadorDeErrores() {
  // eslint-disable-next-line no-unused-vars -- Express reconoce el manejador de errores por sus cuatro parámetros.
  return function errores(err, req, res, next) {
    const enApi = API_PANEL.test(req.originalUrl)
    const traducido = traducir(err, enApi)
    let status = traducido?.status ?? Number(err?.status ?? err?.statusCode)
    if (!(status >= 400 && status < 600)) status = 500
    const codigo = codigoDeError(err)
    if (status >= 500 && err?.paraLaPersona) log('aviso', `respuesta_${status}`, { mensaje: err.message })
    else if (status >= 500) log('error', `error_${status}`, err instanceof Error ? err : new Error(String(err)))
    else if (enApi && (codigo === '40P01' || codigo === '23503')) log('aviso', 'conflicto_reintentar', { codigo })
    // Con la respuesta a medio mandar no hay nada que hacer: Express corta la conexión.
    if (res.headersSent) return next(err)
    res.status(status).set('Cache-Control', 'no-store')
    if (enApi) {
      return res.json(traducido ? traducido.cuerpo : { error: texto(status) })
    }
    if (status < 500) return res.type('text').send(texto(status))
    res.type('html').send(paginaDeError(status))
  }
}
