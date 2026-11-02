// Pedidos a la API del panel (/administracion/api, plan 4 y 5.1). Código sin React ni DOM: lo prueban las pruebas del
// servidor con node:test (server/pruebas/panel-api.test.js) pasándole un fetch falso.
//
// api.get / post / put / patch / delete (ruta, cuerpo?, opciones?) con la ruta relativa a /administracion/api
// ('/estado', '/usuarios/3'). Devuelve el "data" de la respuesta o tira un ErrorApi. Reglas (plan 5.1):
// - credentials 'same-origin' (la cookie de sesión) y Accept JSON;
// - en todo POST, PUT y PATCH: Content-Type JSON y un cuerpo, '{}' si la ruta no lleva datos (la API responde 415 sin
//   ese Content-Type aunque no haya cuerpo); un DELETE solo lo manda si se le pasa un cuerpo;
// - 401: llama a reingresar(error), que abre el diálogo de ingreso (componentes/ReingresoDialogo.jsx); si la persona
//   vuelve a entrar, repite el pedido (el formulario sigue como estaba). Si no (cerró el diálogo), tira el 401: en un
//   pedido que guarda (no GET), con SESION_TERMINADA, que dice qué pasó y qué hacer ("Tenés que iniciar sesión." solo,
//   junto a un formulario, no lo decía); el de la temporal vencida sale tal cual. Con { sinReingreso: true } no se abre
//   (el inicio de sesión, la carga de la sesión al arrancar, salir);
// - 403 con debeCambiarClave: llama a alDebeCambiarClave() (lleva a /cambiar-clave) y tira el error;
// - 400 y 409: ErrorApi con los campos de la respuesta (repartirError los reparte en el formulario);
// - sin conexión (fetch falla: sin red, un deploy en curso): ErrorApi con status 0 y "Sin conexión, reintentá.";
// - una respuesta que no es JSON (p. ej. un 502 del proxy de Render): ErrorApi con un texto según el código.
// Con { signal } (el de un loader) el pedido se cancela si la navegación cambia; un AbortError sale tal cual.
//
// api.subir(ruta, formulario, { alProgreso, alProcesar, signal }) (E3.1): un FormData (POST /fotos) con
// XMLHttpRequest, que es lo que da el progreso de la subida (plan 5.1 y 5.5): alProgreso(fraccion) mientras sube y
// alProcesar() cuando terminó de subir y el servidor la está procesando. Mismas reglas que pedir(): same-origin (la
// cookie va sola: es el mismo origen), Accept JSON, 401 -> reingreso y la subida se repite desde el principio, 403 con
// debeCambiarClave, sin red "Sin conexión, reintentá.". El Content-Type lo pone el navegador (multipart con su
// boundary). Un 503 con Retry-After (la cola de subidas llena, o la misma cuenta subiendo en otra pestaña: el servidor
// no leyó el archivo) se reintenta UNA vez, después de esperar lo que dice (hasta ESPERA_MAX_S), y avisa la espera con
// alEsperar(segundos) (API-07 de la verificación de E3). Las subidas de una misma página van de a una (LIM-02 de la
// verificación de la limpieza, 27/10/2026): el servidor admite una sola subida en curso por cuenta, así que la portada
// y una foto de la galería subidas a la vez chocaban (la segunda recibía el 503 "Ya hay una foto tuya subiéndose…", en
// otra pestaña, después de mandar el archivo entero). La que llega con otra en curso espera su turno acá, sin mandar
// nada, y lo avisa con alEnEspera(); cuando le toca, alProgreso(0). Si el archivo tarda más de TOPE_SUBIDA_PANEL_MS en
// terminar de subir (una conexión muy lenta), el panel corta la subida y da el mismo error que el servidor (400 con
// MENSAJE_SUBIDA_LENTA en la foto), 10 s antes que el tope del servidor (LIM-01 de la verificación de la limpieza): el
// corte del servidor, en HTTP/1.1, le llega a Chrome como una conexión reiniciada, sin la respuesta, y Chrome reenvía
// la subida solo; cortada por el panel, no se reenvía nada y la persona ve el mensaje la primera vez. Para las pruebas,
// crearApi({ xhr, esperar, topeSubidaMs }) recibe una clase falsa, una espera que no espera y un tope corto.
import { MENSAJE_SUBIDA_LENTA, TOPE_RECEPCION_MS } from '../../compartido/fotos.js'
import { RUTA_PANEL } from '../../compartido/panel.js'

export const PREFIJO_API = `${RUTA_PANEL}/api`
export const SIN_CONEXION = 'Sin conexión, reintentá.'
export const SESION_TERMINADA =
  'Tu sesión terminó y el cambio no se hizo. Probá de nuevo: el panel te va a pedir que vuelvas a ingresar (lo que ' +
  'escribiste sigue acá).'

/**
 * ¿Un error después del cual lo que se mandó puede haberse guardado igual? Sin conexión (la respuesta no llegó) o un
 * error del servidor: no se sabe. Las altas (Tarifas, Usuarios) miran la lista antes de darlo por perdido.
 */
export const quizasGuardo = (error) => error?.status === 0 || error?.status >= 500

/** ¿Es el 401 de una contraseña temporal vencida? (el mensaje de server/auth/claves.js, TEMPORAL_VENCIDA) */
export const esTemporalVencida = (err) => err?.status === 401 && /temporal venci/i.test(err?.message ?? '')
const ALGO_SALIO_MAL = 'Algo salió mal. Probá de nuevo en unos minutos.'

/** Lo que se muestra cuando la respuesta no trae su propio mensaje. */
const POR_ESTADO = {
  400: 'Revisá los datos.',
  401: 'Tenés que iniciar sesión.',
  403: 'No tenés permiso para esto.',
  404: 'No existe.',
  409: 'No se pudo guardar: otro cambio se cruzó con este. Probá de nuevo.',
  413: 'Es demasiado grande.',
  429: 'Demasiados intentos. Esperá 15 minutos.',
  502: 'El panel no está disponible en este momento. Probá de nuevo en unos minutos.',
  503: 'El panel no está disponible en este momento. Probá de nuevo en unos minutos.',
  504: 'El panel no está disponible en este momento. Probá de nuevo en unos minutos.',
}
export const mensajePorEstado = (status) => POR_ESTADO[status] ?? ALGO_SALIO_MAL

/** Un error de la API: status (0 = sin conexión), message, campos ({ campo: mensaje } o null) y debeCambiarClave. */
export class ErrorApi extends Error {
  /**
   * @param {number} status
   * @param {string} mensaje
   * @param {{ campos?: Record<string, string> | null, debeCambiarClave?: boolean, faltan?: number[] | null,
   *   reintentarEn?: number | null }} [extra]
   *   faltan: las fotos que ya no están (el 409 de una galería, server/api/contenido.js); reintentarEn: los segundos del
   *   Retry-After de la respuesta (null si no trae)
   */
  constructor(status, mensaje, { campos = null, debeCambiarClave = false, faltan = null, reintentarEn = null } = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.campos = campos
    this.debeCambiarClave = debeCambiarClave
    this.faltan = faltan
    this.reintentarEn = reintentarEn
  }

  get sinConexion() {
    return this.status === 0
  }
}

const CON_CUERPO = new Set(['POST', 'PUT', 'PATCH'])
const esAbort = (err) => err?.name === 'AbortError'
const abortado = () => Object.assign(new Error('Se canceló el pedido.'), { name: 'AbortError' })

/** Los segundos de un Retry-After (solo la forma en segundos, la que manda la API), o null. */
export function segundosDeEspera(cabecera) {
  const texto = String(cabecera ?? '').trim()
  return /^\d{1,6}$/.test(texto) ? Number(texto) : null
}

/** Cuánto espera api.subir, como mucho, para reintentar un 503 con Retry-After (más, no reintenta). */
export const ESPERA_MAX_S = 30

/**
 * Cuánto puede tardar en subir el archivo, desde que se empieza a mandar hasta que termina de llegar (lo que sigue, el
 * procesado, no cuenta): 10 s menos que el tope del servidor (TOPE_RECEPCION_MS, compartido/fotos.js), que empieza a
 * contar después, cuando llega el pedido.
 */
export const TOPE_SUBIDA_PANEL_MS = TOPE_RECEPCION_MS - 10_000
/** El error de una subida que el panel cortó por lenta: el mismo que da el servidor (server/api/fotos.js). */
const subidaLenta = () => new ErrorApi(400, MENSAJE_SUBIDA_LENTA, { campos: { foto: MENSAJE_SUBIDA_LENTA } })

/** El ErrorApi de una respuesta que no es 2xx, con lo que trajo (json puede ser null) y su Retry-After. */
const errorDeRespuesta = (status, json, reintentarEn = null) =>
  new ErrorApi(status, typeof json?.error === 'string' ? json.error : mensajePorEstado(status), {
    campos: json?.campos && typeof json.campos === 'object' ? json.campos : null,
    debeCambiarClave: json?.debeCambiarClave === true,
    faltan: Array.isArray(json?.faltan) ? json.faltan.filter((id) => Number.isInteger(id)) : null,
    reintentarEn,
  })

/** Espera a que termine la promesa (sin importar cómo), o hasta que se cancele la señal (un AbortError). */
function esperarPromesa(promesa, signal) {
  return new Promise((resolver, rechazar) => {
    if (signal?.aborted) return rechazar(abortado())
    function alAbortar() {
      rechazar(abortado())
    }
    signal?.addEventListener('abort', alAbortar, { once: true })
    promesa.then(
      () => {
        signal?.removeEventListener('abort', alAbortar)
        resolver()
      },
      () => {
        signal?.removeEventListener('abort', alAbortar)
        resolver()
      },
    )
  })
}

/** Espera ms, o hasta que se cancele la señal (un AbortError). */
function esperarCancelable(ms, signal) {
  return new Promise((resolver, rechazar) => {
    if (signal?.aborted) return rechazar(abortado())
    const reloj = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar)
      resolver()
    }, ms)
    function alAbortar() {
      clearTimeout(reloj)
      rechazar(abortado())
    }
    signal?.addEventListener('abort', alAbortar, { once: true })
  })
}

/**
 * @param {object} [deps]
 * @param {typeof fetch} [deps.fetch]
 * @param {typeof XMLHttpRequest} [deps.xhr]  la clase de XMLHttpRequest (api.subir); las pruebas pasan una falsa
 * @param {(ms: number, signal?: AbortSignal) => Promise<void>} [deps.esperar]  la espera antes de reintentar una
 *   subida (las pruebas pasan una que no espera)
 * @param {number} [deps.topeSubidaMs]  cuánto puede tardar en subir el archivo (TOPE_SUBIDA_PANEL_MS; las pruebas pasan
 *   uno corto)
 * @param {(error: ErrorApi) => Promise<boolean>} [deps.reingresar]  true si la persona volvió a entrar
 * @param {(error: ErrorApi) => void} [deps.alDebeCambiarClave]
 */
export function crearApi({
  fetch: fetchPropio,
  xhr: XhrPropio,
  esperar = esperarCancelable,
  topeSubidaMs = TOPE_SUBIDA_PANEL_MS,
  reingresar = null,
  alDebeCambiarClave = null,
} = {}) {
  const ganchos = { reingresar, alDebeCambiarClave }
  const traer = fetchPropio ?? ((...args) => globalThis.fetch(...args))
  // Las subidas de esta página, de a una (ver arriba, LIM-02): la última de la fila (se cumple cuando terminó, salga
  // como salga) y cuántas hay entre la que sube y las que esperan.
  let ultimaSubida = Promise.resolve()
  let subidasEnLaFila = 0

  async function unPedido(metodo, ruta, cuerpo, signal) {
    const opciones = { method: metodo, credentials: 'same-origin', headers: { Accept: 'application/json' }, signal }
    if (CON_CUERPO.has(metodo) || cuerpo !== undefined) {
      opciones.headers['Content-Type'] = 'application/json'
      opciones.body = JSON.stringify(cuerpo ?? {})
    }
    let respuesta
    try {
      respuesta = await traer(PREFIJO_API + ruta, opciones)
    } catch (err) {
      if (esAbort(err)) throw err
      throw new ErrorApi(0, SIN_CONEXION)
    }
    let json = null
    if (/^application\/json\b/i.test(respuesta.headers.get('content-type') ?? '')) {
      try {
        json = await respuesta.json()
      } catch (err) {
        if (esAbort(err)) throw err
        // Se cortó a mitad de camino o no es JSON válido: como si no hubiera traído nada.
        if (respuesta.ok) throw new ErrorApi(0, SIN_CONEXION)
      }
    }
    if (respuesta.ok) return json?.data ?? null
    throw errorDeRespuesta(respuesta.status, json, segundosDeEspera(respuesta.headers.get('retry-after')))
  }

  /** Una subida con XMLHttpRequest (ver api.subir). */
  function unaSubida(ruta, formulario, { alProgreso, alProcesar, signal }) {
    const Xhr = XhrPropio ?? globalThis.XMLHttpRequest
    return new Promise((resolver, rechazar) => {
      if (signal?.aborted) return rechazar(abortado())
      const pedido = new Xhr()
      const alAbortar = () => pedido.abort()
      signal?.addEventListener('abort', alAbortar, { once: true })
      // El tope de la subida del archivo (TOPE_SUBIDA_PANEL_MS): corre desde send() hasta que terminó de subir.
      let reloj = null
      let lenta = false
      const terminar = (fn) => (...args) => {
        clearTimeout(reloj)
        signal?.removeEventListener('abort', alAbortar)
        fn(...args)
      }
      pedido.open('POST', PREFIJO_API + ruta)
      pedido.setRequestHeader('Accept', 'application/json')
      pedido.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) alProgreso?.(Math.min(1, e.loaded / e.total))
      }
      // Terminó de subir: ahora el servidor la procesa (el tope de la subida ya no corre).
      pedido.upload.onload = () => {
        clearTimeout(reloj)
        alProgreso?.(1)
        alProcesar?.()
      }
      pedido.onload = terminar(() => {
        let json = null
        if (/^application\/json\b/i.test(pedido.getResponseHeader('content-type') ?? '')) {
          try {
            json = JSON.parse(pedido.responseText)
          } catch {
            // Se cortó a mitad de camino: como si no hubiera traído nada.
            if (pedido.status >= 200 && pedido.status < 300) return rechazar(new ErrorApi(0, SIN_CONEXION))
          }
        }
        if (pedido.status >= 200 && pedido.status < 300) return resolver(json?.data ?? null)
        // status 0 sin error de red: el navegador cortó el pedido (p. ej. un problema de CORS que no debería pasar).
        if (pedido.status === 0) return rechazar(new ErrorApi(0, SIN_CONEXION))
        rechazar(errorDeRespuesta(pedido.status, json, segundosDeEspera(pedido.getResponseHeader('retry-after'))))
      })
      pedido.onerror = terminar(() => rechazar(new ErrorApi(0, SIN_CONEXION)))
      pedido.ontimeout = pedido.onerror
      pedido.onabort = terminar(() => rechazar(lenta ? subidaLenta() : abortado()))
      pedido.send(formulario)
      if (topeSubidaMs > 0) {
        reloj = setTimeout(() => {
          lenta = true
          pedido.abort()
        }, topeSubidaMs)
      }
    })
  }

  /**
   * Las reglas de 401 (reingreso y repetir) y 403 (debeCambiarClave), alrededor de un intento.
   * @param {string} metodo
   * @param {() => Promise<unknown>} intento
   * @param {boolean} sinReingreso
   */
  async function conReglas(metodo, intento, sinReingreso) {
    for (;;) {
      try {
        return await intento()
      } catch (err) {
        if (err instanceof ErrorApi) {
          if (err.status === 401 && !sinReingreso && ganchos.reingresar) {
            if (await ganchos.reingresar(err)) continue
            if (metodo !== 'GET' && !esTemporalVencida(err)) throw new ErrorApi(401, SESION_TERMINADA)
          }
          if (err.status === 403 && err.debeCambiarClave) ganchos.alDebeCambiarClave?.(err)
        }
        throw err
      }
    }
  }

  /**
   * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} metodo
   * @param {string} ruta  relativa a /administracion/api, empieza con /
   * @param {unknown} [cuerpo]
   * @param {{ sinReingreso?: boolean, signal?: AbortSignal }} [opciones]
   */
  function pedir(metodo, ruta, cuerpo, { sinReingreso = false, signal } = {}) {
    return conReglas(metodo, () => unPedido(metodo, ruta, cuerpo, signal), sinReingreso)
  }

  /**
   * POST de un formulario con archivo (FormData), con progreso. De a una por página: con otra subida en curso, espera
   * su turno sin mandar nada (alEnEspera lo avisa; alProgreso(0) cuando le toca); cancelar con la señal mientras espera
   * la saca de la fila. Un 503 con Retry-After de hasta ESPERA_MAX_S se reintenta una vez, después de esa espera
   * (alEsperar la avisa; sigue siendo su turno); la espera se corta con la señal.
   * @param {string} ruta  relativa a /administracion/api ('/fotos')
   * @param {FormData} formulario
   * @param {{ alProgreso?: (fraccion: number) => void, alProcesar?: () => void, alEsperar?: (segundos: number) => void,
   *   alEnEspera?: () => void, signal?: AbortSignal }} [opciones]
   */
  async function subir(ruta, formulario, opciones = {}) {
    const anterior = ultimaSubida
    let soltarTurno
    const turno = new Promise((resolver) => {
      soltarTurno = resolver
    })
    ultimaSubida = anterior.then(() => turno)
    const hayOtra = subidasEnLaFila > 0
    subidasEnLaFila += 1
    try {
      if (hayOtra) opciones.alEnEspera?.()
      await esperarPromesa(anterior, opciones.signal)
      if (hayOtra) opciones.alProgreso?.(0)
      const intento = () => conReglas('POST', () => unaSubida(ruta, formulario, opciones), false)
      try {
        return await intento()
      } catch (err) {
        const espera = err instanceof ErrorApi && err.status === 503 ? err.reintentarEn : null
        if (espera == null || espera > ESPERA_MAX_S) throw err
        opciones.alEsperar?.(espera)
        await esperar(espera * 1000, opciones.signal)
        return intento()
      }
    } finally {
      subidasEnLaFila -= 1
      soltarTurno()
    }
  }

  return {
    pedir,
    subir,
    get: (ruta, opciones) => pedir('GET', ruta, undefined, opciones),
    post: (ruta, cuerpo, opciones) => pedir('POST', ruta, cuerpo, opciones),
    put: (ruta, cuerpo, opciones) => pedir('PUT', ruta, cuerpo, opciones),
    patch: (ruta, cuerpo, opciones) => pedir('PATCH', ruta, cuerpo, opciones),
    delete: (ruta, cuerpo, opciones) => pedir('DELETE', ruta, cuerpo, opciones),
    /** Los ganchos que necesitan el router y el diálogo (los pone main.jsx). */
    configurar(nuevos) {
      Object.assign(ganchos, nuevos)
    },
  }
}

/** La instancia del panel. */
export const api = crearApi()

/**
 * Reparte un error entre los campos de un formulario y un mensaje general (plan 5.1 y 5.6).
 * - Los campos que mandó la API (400 de validación, 409 de un repetido) van a su campo si el formulario lo tiene
 *   (conocidos; sin lista, todos); los que no, al mensaje general.
 * - Sin campos (401, 403, 429, 409 del último admin, sin conexión…): el mensaje de la API, como mensaje general.
 * - Un error que no es de la API (un error de programación): un mensaje genérico.
 * @param {unknown} err
 * @param {string[] | null} [conocidos]
 * @returns {{ errores: Record<string, string>, mensaje: string | null }}
 */
export function repartirError(err, conocidos = null) {
  if (!(err instanceof ErrorApi)) return { errores: {}, mensaje: ALGO_SALIO_MAL }
  const errores = {}
  const sueltos = []
  for (const [campo, texto] of Object.entries(err.campos ?? {})) {
    if (!conocidos || conocidos.includes(campo)) errores[campo] = String(texto)
    else sueltos.push(String(texto))
  }
  const hayCampos = Object.keys(errores).length > 0
  const mensaje = sueltos.length ? sueltos.join(' ') : hayCampos ? null : err.message || ALGO_SALIO_MAL
  return { errores, mensaje }
}
