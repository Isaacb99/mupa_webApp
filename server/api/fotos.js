// /administracion/api/fotos (plan 4.3, 5.5 y 7): subir una foto y cambiar sus datos, para cualquier rol.
// - POST /fotos: multipart/form-data con el archivo en "foto" y los campos alt, decorativa ("true"/"false"),
//   epigrafe y credito (compartido/esquemas/fotos.js). En este orden (plan 7): sesión -> rol -> límite (60 por hora por
//   usuario) -> un lugar entre las subidas en curso (como mucho 3 a la vez y una por cuenta, server/fotos/cola.js: si no
//   hay, 503 sin leer el archivo, con Retry-After; el archivo tiene 2 minutos para llegar: si no, 400) -> multer (en
//   memoria: 20 MB, un archivo, 10 campos, 12 partes) -> los campos con zod -> el tipo real y el procesado
//   (server/fotos/procesar.js, en la cola: de a una) -> la foto y sus cinco archivos en UNA transacción
//   (server/fotos/almacen.js). 201 con la foto. Errores: 413 (más de 20 MB, de 50 megapíxeles o un JPG
//   progresivo o PNG entrelazado demasiado grande), 415 (no es JPG, PNG ni WebP; SVG y HEIC con su mensaje), 400 (sin
//   foto, campos, foto dañada, o el archivo tardó más de 2 minutos en llegar: no es 408, ver STATUS_SUBIDA_LENTA), 503
//   (ya hay 3 subidas en curso, o una de esa cuenta), con los mensajes de plan 5.5.
// - PATCH /fotos/:id { alt?, decorativa?, epigrafe?, credito? }: solo lo que cambia. La regla de la descripción
//   (obligatoria salvo en una decorativa) se revisa sobre la foto como quedaría, con la fila bloqueada. Desde E3.3 y
//   E3.4, la portada de una sala, una muestra o una novedad no puede pasar a decorativa (400 en "decorativa"): la
//   portada siempre lleva descripción (plan 5.3; el panel no lo ofrece, la API tampoco lo deja).
// Una foto recién subida no la usa nadie: si la ficha no se guarda, la borra la tarea diaria a las 24 h. Quitarla de
// una ficha o eliminar la ficha la borra en el momento (liberarFotos, E3.3 y E3.4).
// Nunca los bytes en el log ni el nombre del archivo (puede tener datos de alguien): el id, el peso y cuánto tardó.
import multer from 'multer'
import { QueryTypes } from 'sequelize'
import { FOTO_BYTES_MAX, MENSAJE_SIN_FOTO, mensajePeso } from '../../compartido/fotos.js'
import { esquemaCambioFoto, esquemaDatosFoto, esquemaSubidaFoto } from '../../compartido/esquemas/fotos.js'
import { httpError } from '../errores.js'
import { log } from '../log.js'
import { MENSAJE_COLA_LLENA, MENSAJE_SUBIDA_LENTA, MENSAJE_YA_SUBIENDO } from '../fotos/cola.js'
import { procesarFoto } from '../fotos/procesar.js'
import { condicionEnUso, USOS_DE_FOTOS } from '../fotos/usos.js'

const NO_EXISTE = 'No existe esa foto.'
export const PORTADA_NO_DECORATIVA =
  'Es la portada de una ficha: la portada siempre lleva descripción y no puede ser decorativa.'
// "La foto f es la portada de algo" (las columnas portada_id de server/fotos/usos.js).
const ES_PORTADA = condicionEnUso('f', USOS_DE_FOTOS.filter((u) => u.columna === 'portada_id'))
const CAMPOS = ['alt', 'decorativa', 'epigrafe', 'credito']

/** La foto para el panel (sin los archivos: sus direcciones salen de la clave, urlFoto de compartido/fotos.js). */
export const fotoDelPanel = (f) => ({
  id: f.id,
  clave: f.clave,
  ancho: f.ancho,
  alto: f.alto,
  variantes: f.variantes,
  bytes: f.bytes,
  alt: f.alt,
  decorativa: f.decorativa,
  epigrafe: f.epigrafe,
  credito: f.credito,
})

const LIMITES_MULTER = {
  fileSize: FOTO_BYTES_MAX,
  files: 1,
  fields: 10,
  parts: 12,
  // Además de los del plan: ningún campo de texto pasa de 16 kB (el más largo, el epígrafe, son 300 caracteres) y
  // sin corchetes en los nombres (multer armaría objetos y listas con "alt[0]").
  fieldSize: 16 * 1024,
  fieldNestingDepth: 0,
}
const recibir = multer({ storage: multer.memoryStorage(), limits: LIMITES_MULTER }).single('foto')

/** Lo que dice multer, en castellano (los códigos de MulterError; lo demás es un multipart roto). */
function errorDeMulter(err, req) {
  const malo = (mensaje) => httpError(400, mensaje)
  switch (err?.code) {
    case 'LIMIT_FILE_SIZE': {
      // El peso del pedido entero es una buena medida del archivo (los campos son unos pocos bytes).
      const mensaje = mensajePeso(Number(req.get('content-length')) || 0)
      return httpError(413, mensaje, { campos: { foto: mensaje } })
    }
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return malo('Mandá una sola foto por vez, en el campo «foto».')
    case 'LIMIT_PART_COUNT':
    case 'LIMIT_FIELD_COUNT':
    case 'LIMIT_FIELD_KEY':
    case 'LIMIT_FIELD_VALUE':
    case 'LIMIT_FIELD_NESTING':
    case 'LIMIT_FIELD_ARRAY_INDEX':
    case 'INVALID_FIELD_NAME':
    case 'MISSING_FIELD_NAME':
      return malo('El formulario de la foto trae campos de más o demasiado largos.')
    default:
      return malo('El pedido no es válido.')
  }
}

/** Los segundos del Retry-After de un 503 de la cola: lo que tarda en liberarse un lugar (SubirFoto reintenta una vez). */
export const ESPERA_COLA_S = 10

/**
 * El código de la respuesta cuando el archivo no terminó de llegar a tiempo. NO es 408 (LIM-01 de la verificación de la
 * limpieza, 27/10/2026): Chromium reenvía solo, sin avisarle a la página, todo pedido que recibe un 408 en una conexión
 * keep-alive reusada (lo toma como el aviso de un servidor que cerró una conexión ociosa). Con 408, la subida lenta se
 * mandaba entera otra vez: la persona veía "Procesando foto…" el doble de tiempo, la foto subía dos veces y el lugar
 * quedaba ocupado otros 2 minutos. Un 400, cuando la respuesta llega (detrás de un proxy que la entrega, como en esa
 * verificación), llega a la página la primera vez (api.subir no reintenta un 400). El panel igual corta antes por su
 * cuenta (TOPE_SUBIDA_PANEL_MS de panel/src/api.js; ver lugarEnLaCola).
 */
export const STATUS_SUBIDA_LENTA = 400

/**
 * Un lugar entre las subidas en curso (server/fotos/cola.js), antes de multer: si no hay (ya hay 3, o esa cuenta ya
 * tiene una: API-07 de la verificación de E3), 503 sin leer el archivo (Node descarta lo que falta del cuerpo sin
 * guardarlo), con Retry-After. El lugar se suelta cuando termina la respuesta o se corta la conexión ("close" llega en
 * los dos casos). Mientras el archivo llega, un tope propio (cola.topeRecepcionMs): pasado, STATUS_SUBIDA_LENTA con su
 * mensaje y la conexión se corta (una transferencia lenta ocupaba el lugar hasta el requestTimeout de Node, 5 minutos).
 * Cuando el archivo terminó de llegar ("end"), el tope se apaga: el procesado tiene el suyo (la cola).
 * @param {ReturnType<typeof import('../fotos/cola.js').crearCola>} cola
 */
export function lugarEnLaCola(cola) {
  return function reservarLugar(req, res, next) {
    const cuenta = req.usuario.id
    const yaSubiendo = cola.ocupadaPor(cuenta)
    const soltar = yaSubiendo ? null : cola.reservar(cuenta)
    if (!soltar) {
      const mensaje = yaSubiendo ? MENSAJE_YA_SUBIENDO : MENSAJE_COLA_LLENA
      res.set('Retry-After', String(ESPERA_COLA_S))
      throw httpError(503, mensaje, { campos: { foto: mensaje } })
    }
    const inicio = performance.now()
    const tope = setTimeout(() => {
      if (req.complete || res.headersSent) return
      log('aviso', 'foto_subida_lenta', { por: cuenta, ms: Math.round(performance.now() - inicio) })
      // Connection: close: Node cierra la conexión en cuanto termina de mandar la respuesta (no espera al resto del
      // archivo). Con HTTP/1.1, Chrome lee una respuesta que llega antes de terminar de mandar el cuerpo recién cuando
      // el envío falla, y un cierre con datos sin leer le llega como una conexión reiniciada: pierde la respuesta y
      // reintenta solo (medido el 27/10/2026). Por eso el panel corta antes (TOPE_SUBIDA_PANEL_MS de panel/src/api.js,
      // con el mismo mensaje) y este tope es el resguardo del servidor: libera el lugar aunque el cliente no corte.
      res.set({ Connection: 'close', 'Cache-Control': 'no-store' })
      res.status(STATUS_SUBIDA_LENTA).json({ error: MENSAJE_SUBIDA_LENTA, campos: { foto: MENSAJE_SUBIDA_LENTA } })
      // Resguardo, por si la conexión siguiera abierta (multer deja de importar: su error ya no responde nada).
      res.once('finish', () => setTimeout(() => req.destroy(), 1_000).unref())
    }, cola.topeRecepcionMs)
    req.once('end', () => clearTimeout(tope))
    res.once('close', () => {
      clearTimeout(tope)
      soltar()
    })
    next()
  }
}

/**
 * multer, con sus errores traducidos. Después de la sesión, el rol, el límite y el lugar: sin eso, nunca lee el archivo.
 * Si ya se respondió (el tope de recepción), lo que diga multer del corte no va a ningún lado.
 */
export function recibirFoto(req, res, next) {
  recibir(req, res, (err) => {
    if (res.headersSent) return
    next(err ? errorDeMulter(err, req) : undefined)
  })
}

/** Sin archivo (o vacío): 400 antes de validar los campos y de tocar nada. */
function exigirArchivo(req, res, next) {
  if (!req.file) throw httpError(400, MENSAJE_SIN_FOTO, { campos: { foto: MENSAJE_SIN_FOTO } })
  next()
}

async function subir(req, res, { almacen, colaDeFotos }) {
  const inicio = performance.now()
  const archivo = req.file
  const procesada = await colaDeFotos.encolar(({ hasta }) => procesarFoto(archivo.buffer, { hasta }))
  const recibidos = archivo.size
  // Lo que llegó ya no hace falta: que la memoria se pueda liberar mientras se guarda.
  archivo.buffer = null
  const foto = await almacen.guardar({ ...req.datos, subidaPor: req.usuario.id }, procesada)
  log('info', 'foto_subida', {
    foto_id: foto.id,
    por: req.usuario.id,
    recibidos,
    guardados: procesada.bytes,
    ms: Math.round(performance.now() - inicio),
  })
  res.status(201).json({ data: fotoDelPanel(foto) })
}

async function cambiar(req, res, { sequelize }) {
  const { Foto } = sequelize.models
  const cambios = req.datos
  const foto = await sequelize.transaction(async (transaction) => {
    const fila = await Foto.findByPk(req.idRuta, { lock: transaction.LOCK.UPDATE, transaction })
    if (!fila) throw httpError(404, NO_EXISTE)
    const actual = Object.fromEntries(CAMPOS.map((c) => [c, fila[c]]))
    const quedaria = { ...actual }
    for (const [campo, valor] of Object.entries(cambios)) if (valor !== undefined) quedaria[campo] = valor
    // La regla de dos campos, con el mismo esquema que el alta (un ZodError da 400 con los campos).
    const datos = esquemaDatosFoto.parse(quedaria)
    if (datos.decorativa && !actual.decorativa) {
      const [{ portada }] = await sequelize.query(`SELECT (${ES_PORTADA}) AS portada FROM fotos f WHERE f.id = :id`, {
        replacements: { id: fila.id },
        type: QueryTypes.SELECT,
        transaction,
      })
      if (portada) throw httpError(400, PORTADA_NO_DECORATIVA, { campos: { decorativa: PORTADA_NO_DECORATIVA } })
    }
    return fila.update(datos, { fields: CAMPOS, transaction })
  })
  log('info', 'foto_modificada', { foto_id: foto.id, campos: Object.keys(cambios), por: req.usuario.id })
  res.json({ data: fotoDelPanel(foto) })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeFotos = [
  {
    metodo: 'POST',
    ruta: '/fotos',
    rol: 'editor',
    multipart: true,
    antes: (limites, { colaDeFotos }) => [limites.fotosPorUsuario, lugarEnLaCola(colaDeFotos), recibirFoto, exigirArchivo],
    cuerpo: esquemaSubidaFoto,
    manejador: subir,
  },
  { metodo: 'PATCH', ruta: '/fotos/:id', rol: 'editor', cuerpo: esquemaCambioFoto, manejador: cambiar },
]
