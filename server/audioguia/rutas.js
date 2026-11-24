// Las rutas de la audioguía (especificación de las audioguías, versión 2, secciones 2.2, 3 y 4). Un router propio,
// fuera de la tabla de rutas del sitio (server/rutas-publicas.js: RUTAS_FIJAS mandaría /audioguia al sitemap, y
// rutas-check le exigiría 200 con canonical) y del menú. Lo monta server/app.js solo con el módulo prendido
// (AUDIOGUIA_CLAVE y una carpeta con alguna estación válida), después del control de host, la CSP pública y las
// redirecciones públicas, y antes de las páginas: hereda todo eso.
//
// - express.Router({ caseSensitive: true, strict: true }): /Audioguia o /audioguia/Q/<código> no son de acá (dan la 404
//   del sitio), porque el Path de las cookies distingue mayúsculas.
// - GET /audioguia/q/:codigo (el QR impreso): responde SIEMPRE 303, nunca un 200 ni un 301 (V1: el código permanente
//   no llega a GA4, al historial ni a la página siguiente como referrer). Válido: la cookie de día y el destino de
//   destinoDelQr (la página del espacio, con ?r=1 y, si el QR trae v=ad, &v=ad). Inválido, de otra versión o con un
//   espacio que no está en el recorrido (también un código mal codificado, %zz): a /audioguia?motivo=codigo, sin
//   cookie. El log del inválido, audioguia_codigo_invalido con el motivo, como mucho uno por minuto.
// - GET y HEAD /audioguia/pista/:estacion?t=<token de día> (4.1): primero la estación (^\d{2}(-ad)?$, buscada en el
//   Map de cargarPistas: nunca se arma una ruta con lo que viene del pedido) y el token (solo de ?t=; la cookie no
//   cuenta, A5), y recién después el límite por IP (LIMITE_PISTAS cada 15 minutos), que cuenta solo los pedidos con
//   permiso: un 404 o un 403 no gastan el cupo (AG-SEG-01). Con todo bien, res.sendFile con root: send
//   resuelve audio/mpeg, Range (206), If-Range, 304 y HEAD; el 416 lo responde server/errores.js con el Content-Range
//   que deja send. Cache-Control private, max-age=3600 y Cross-Origin-Resource-Policy same-origin.
// - GET /audioguia y /audioguia/:espacio (la página, 5.1): 403 sin un permiso de día que valga (con el motivo), 200 con
//   él, en la versión que piden v o la cookie de preferencia, y la cookie de preferencia si la consulta trae v. Las dos,
//   private, no-store y Vary: Cookie. Un espacio que no está en el recorrido sigue a la 404 del sitio.
//   MIENTRAS NO EXISTA LA PÁGINA (src/paginas/Audioguia.jsx en PAGINAS de src/tablaDePaginas.js), estas dos rutas NO
//   se montan: /audioguia y /audioguia/<espacio> dan la 404 del sitio, como con el módulo apagado (con el render de
//   verdad, una página que no está en la tabla saldría rota). Se prenden solas el día que la etapa de la página suma
//   'audioguia' a PAGINAS (existePagina, la misma tabla que decide el menú). Las pruebas la prenden con conPagina.
// - En TODAS las respuestas de acá: X-Robots-Tag: noindex, nofollow (también en mupa.ar) y Referrer-Policy: no-referrer
//   (la URL con ?v= no llega como referrer a la página siguiente).
// - Los logs, solo con el motivo y, como mucho, el espacio o la estación: nunca el código, la firma, t, la IP, la URL
//   ni la versión elegida.
import express from 'express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { hoyEnSanJuan } from '../../compartido/fechas.js'
import { existePagina } from '../../src/tablaDePaginas.js'
import { log as logDelServicio } from '../log.js'
import {
  accesoDeLaPagina,
  cookieDeVersion,
  DESTINO_CODIGO_INVALIDO,
  destinoDelQr,
  permisoDeDia,
  RUTA_AUDIOGUIA,
  versionDeLaPagina,
} from './acceso.js'
import { crearClaves, leerCodigoDeQr, leerTokenDeDia, tokenDeDia } from './firma.js'
import { SUFIJOS } from './pistas.js'

/** El nombre de la página en el estado (estado.pagina) y en src/tablaDePaginas.js. */
export const PAGINA_AUDIOGUIA = 'audioguia'
/**
 * Las páginas de src/tablaDePaginas.js que no están en la tabla de rutas del servidor (server/rutas-publicas.js): la
 * audioguía tiene su router. Para la prueba de la tabla de páginas de ssr.test.js (9.3), el día que la página exista.
 */
export const PAGINAS_FUERA_DE_LA_TABLA = Object.freeze([PAGINA_AUDIOGUIA])
/** El límite del audio: 3.000 pedidos cada 15 minutos por IP (4.1; una compañía detrás de un CGNAT sigue lejos). */
export const LIMITE_PISTAS = 3_000
export const VENTANA_PISTAS_MS = 15 * 60_000
/** Cada cuánto, como mucho, se loguea un código inválido (4). */
export const TOPE_LOG_CODIGO_MS = 60_000
/** El 403 del audio sin un token que valga (4.1). */
export const TEXTO_SIN_PERMISO = 'La audioguía se escucha en el museo.'
/** El ancla del bloque de versión (5.3): adonde lleva el enlace a la otra versión. */
export const ANCLA_VERSION = 'audioguia-version'

/** La forma de :estacion: el número en dos cifras y, la de audiodescripción, -ad (A11). */
const FORMA_DE_LA_ESTACION = /^\d{2}(-ad)?$/
/** /audioguia/q/<algo>, sin decodificar (para el 303 de un código mal codificado, que Express no llega a leer). */
const ES_QR = /^\/audioguia\/q\/[^/]+$/

/** Las cabeceras de toda respuesta de la audioguía (4). */
function cabecerasDeAudioguia(res) {
  res.set('X-Robots-Tag', 'noindex, nofollow')
  res.set('Referrer-Policy', 'no-referrer')
}

/** Un texto corto con no-store (los 403, 404 y 429 del audio). */
const texto = (res, status, mensaje) => res.status(status).set('Cache-Control', 'no-store').type('text').send(mensaje)

/**
 * Los datos de la página con acceso (5.1): solo la versión elegida, con el src de cada estación con el token de hoy.
 * @param {{ audioguia: ReturnType<typeof import('./pistas.js').cargarPistas>, version: 'comun' | 'ad',
 *   espacioActual: string | null, token: string }} opciones
 */
export function datosDeLaPagina({ audioguia, version, espacioActual, token }) {
  const otra = version === 'ad' ? 'comun' : 'ad'
  const base = espacioActual ? `${RUTA_AUDIOGUIA}/${espacioActual}` : RUTA_AUDIOGUIA
  const sufijo = SUFIJOS[version]
  let marcado = false
  const grupos = audioguia.grupos.map((grupo) => {
    // Recepción puede ir dos veces: la marca de «estás acá» va solo en la primera (una sola marca, 5.2).
    const actual = !marcado && grupo.espacio === espacioActual
    if (actual) marcado = true
    return {
      espacio: grupo.espacio,
      ancla: grupo.ancla,
      nombreGuion: grupo.nombreGuion,
      titulo: grupo.titulo,
      lema: grupo.lema,
      alFinal: grupo.alFinal,
      actual,
      estaciones: grupo.estaciones.map((estacion) => {
        const pista = audioguia.estaciones.get(`${estacion.id}${sufijo}`)
        return {
          id: estacion.id,
          numero: estacion.numero,
          titulo: estacion.titulo,
          duracion: pista.duracion,
          duracionLarga: pista.duracionLarga,
          src: `${RUTA_AUDIOGUIA}/pista/${estacion.id}${sufijo}?t=${encodeURIComponent(token)}`,
          parrafos: pista.parrafos,
        }
      }),
    }
  })
  return {
    acceso: true,
    version,
    espacioActual,
    enlaceVersion: `${base}?v=${otra}#${ANCLA_VERSION}`,
    grupos,
  }
}

/**
 * El router de la audioguía.
 * @param {object} opciones
 * @param {ReturnType<import('../config.js').leerConfig>} opciones.config  AUDIOGUIA_CLAVE y urlPublica
 * @param {ReturnType<import('../ssr.js').crearSsr>} opciones.ssr  dibujarPagina y reloj
 * @param {ReturnType<typeof import('./pistas.js').cargarPistas>} opciones.audioguia  lo que leyó cargarPistas, con
 *   alguna estación
 * @param {boolean} [opciones.conPagina]  montar la página; por defecto, si src/tablaDePaginas.js ya la tiene
 * @param {number} [opciones.limitePistas]  otro tope del audio (las pruebas, para no hacer 3.000 pedidos)
 * @param {typeof logDelServicio} [opciones.log]
 */
export function crearRutasDeAudioguia({
  config,
  ssr,
  audioguia,
  conPagina = existePagina(PAGINA_AUDIOGUIA),
  limitePistas = LIMITE_PISTAS,
  log = logDelServicio,
}) {
  const claves = crearClaves(config.AUDIOGUIA_CLAVE)
  const { version, espacios, estaciones } = audioguia
  const reloj = ssr.reloj ?? (() => new Date())
  const urlPublica = config.urlPublica
  const router = express.Router({ caseSensitive: true, strict: true })

  // El log del código inválido, con tope: quien prueba códigos a mano no llena el log.
  let ultimoLog = -Infinity
  function codigoInvalido(req, res, motivo) {
    const ahora = reloj().getTime()
    if (ahora - ultimoLog >= TOPE_LOG_CODIGO_MS) {
      ultimoLog = ahora
      log('aviso', 'audioguia_codigo_invalido', { motivo })
    }
    res.set('Cache-Control', 'no-store').redirect(303, DESTINO_CODIGO_INVALIDO)
  }

  router.get('/audioguia/q/:codigo', (req, res) => {
    cabecerasDeAudioguia(res)
    const leido = leerCodigoDeQr(claves, req.params.codigo, { version, espacios })
    if (!leido.ok) return codigoInvalido(req, res, leido.motivo)
    const { cookie } = permisoDeDia({ urlPublica, claves, version, reloj })
    res.append('Set-Cookie', cookie)
    res.set('Cache-Control', 'no-store').redirect(303, destinoDelQr(leido.espacio, req.query))
  })

  const limite = rateLimit({
    windowMs: VENTANA_PISTAS_MS,
    limit: limitePistas,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    handler: (req, res, next, opciones) => {
      // Una sola línea por ventana y clave: el primer pedido que se pasa (como server/limites.js).
      if (req.rateLimit?.used === req.rateLimit?.limit + 1) log('aviso', 'audioguia_limite')
      cabecerasDeAudioguia(res)
      texto(res, opciones.statusCode, 'Demasiados pedidos. Probá de nuevo en unos minutos.')
    },
  })

  // Primero la estación y el token, DESPUÉS el límite: un pedido rechazado (404 o 403) no gasta el cupo de la IP. Si
  // contaran, cualquiera sin QR (3.001 HEAD sin t, unos segundos) dejaba con 429 a esa IP, y detrás de un proxy mal
  // contado (TRUST_PROXY) a todo el museo (AG-SEG-01 de la verificación del servidor). Probar tokens no preocupa: la
  // firma tiene 132 bits y cada HMAC cuesta microsegundos.
  function validarPista(req, res, next) {
    cabecerasDeAudioguia(res)
    const id = req.params.estacion
    const pista = FORMA_DE_LA_ESTACION.test(id) ? estaciones.get(id) : undefined
    if (!pista) return texto(res, 404, 'No encontrado.')
    if (!leerTokenDeDia(claves, req.query.t, { version, hoy: hoyEnSanJuan(reloj()) }).ok) {
      return texto(res, 403, TEXTO_SIN_PERMISO)
    }
    res.locals.pista = pista
    next()
  }

  router.get('/audioguia/pista/:estacion', validarPista, limite, (req, res, next) => {
    const id = req.params.estacion
    const { pista } = res.locals
    res.set('Cache-Control', 'private, max-age=3600')
    res.set('Cross-Origin-Resource-Policy', 'same-origin')
    res.sendFile(
      pista.nombreArchivo,
      { root: audioguia.dir, acceptRanges: true, cacheControl: false, lastModified: true, dotfiles: 'deny' },
      (err) => {
        if (!err) return
        // El teléfono corta seguido los pedidos con Range (adelantar, pausar): no es un error del servicio.
        if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || res.headersSent) return
        if (err.code === 'ENOENT' || err.status === 404) {
          log('error', 'audioguia_pista_sin_archivo', { estacion: id })
          return texto(res, 404, 'No encontrado.')
        }
        // El 416 (y cualquier otro de send) va al manejador de errores, que deja el Content-Range de send.
        next(err)
      },
    )
  })

  if (conPagina) {
    async function pagina(req, res, next) {
      const espacioActual = req.params.espacio ?? null
      if (espacioActual !== null && !espacios.has(espacioActual)) return next()
      cabecerasDeAudioguia(res)
      res.append('Vary', 'Cookie')
      const ahora = reloj()
      const enEsteInstante = () => ahora
      const cabeceraCookie = req.get('cookie')
      const acceso = accesoDeLaPagina({ cabeceraCookie, consulta: req.query, urlPublica, claves, version, reloj: enEsteInstante })
      if (!acceso.acceso) {
        return ssr.dibujarPagina(req, res, {
          status: 403,
          pagina: PAGINA_AUDIOGUIA,
          datos: { acceso: false, motivo: acceso.motivo },
          cache: 'private, no-store',
        })
      }
      const elegida = versionDeLaPagina({ consulta: req.query, cabeceraCookie })
      if (elegida.guardar) res.append('Set-Cookie', cookieDeVersion({ urlPublica, version: elegida.guardar }))
      const token = tokenDeDia(claves, version, hoyEnSanJuan(ahora))
      return ssr.dibujarPagina(req, res, {
        status: 200,
        pagina: PAGINA_AUDIOGUIA,
        datos: datosDeLaPagina({ audioguia, version: elegida.version, espacioActual, token }),
        cache: 'private, no-store',
      })
    }
    router.get(RUTA_AUDIOGUIA, pagina)
    router.get(`${RUTA_AUDIOGUIA}/:espacio`, pagina)
  }

  // Un código mal codificado (/audioguia/q/%zz): Express no lo puede decodificar y manda un 400 antes del handler. El
  // QR responde siempre 303, así que va como un código que no vale. Lo demás sigue al manejador de errores.
  router.use((err, req, res, next) => {
    if (err?.status === 400 && (req.method === 'GET' || req.method === 'HEAD') && ES_QR.test(req.path)) {
      cabecerasDeAudioguia(res)
      return codigoInvalido(req, res, 'forma')
    }
    next(err)
  })

  return router
}
