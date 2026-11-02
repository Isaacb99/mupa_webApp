// La cola de las subidas de fotos (plan 7): el procesado, de a una y con 60 s de tope por foto, y cuántas subidas
// puede haber en curso a la vez.
// - reservar(cuenta): un lugar para una subida, desde que se empieza a recibir el archivo hasta que se responde (lo
//   toma server/api/fotos.js ANTES de multer y lo suelta cuando la respuesta termina o se corta la conexión). Como
//   mucho enCursoMax (3) a la vez, entre todas las personas: con más, 503 en el momento y sin leer el archivo. Así lo
//   que ocupa la memoria es, como mucho, tres archivos de hasta 20 MB más el procesado de uno (corrección de E3,
//   16/10/2026: antes multer leía el archivo entero antes de que la cola decidiera, y 20 subidas de 18 MB a la vez
//   llevaban el proceso a 579 MB, más que los 512 MB de Render). Y uno solo por cuenta (API-07 de la verificación de
//   E3: el panel sube de a una; una cuenta con tres subidas lentas dejaba a las demás sin lugar): ocupadaPor(cuenta)
//   dice si esa cuenta ya tiene uno.
// - topeRecepcionMs: cuánto puede tardar en llegar el archivo (2 minutos, TOPE_RECEPCION_MS de compartido/fotos.js;
//   lo aplica server/api/fotos.js; el panel corta 10 s antes, LIM-01). Una transferencia lenta ocupaba su lugar hasta
//   el requestTimeout de Node (5 minutos); pasado el tope se responde 400 (no 408: STATUS_SUBIDA_LENTA de
//   server/api/fotos.js) y el lugar se suelta. El procesado tiene su propio tope (topeMs).
// - encolar(tarea): el procesado, de a una. Con sharp.concurrency(1) y una sola foto a la vez, el pico de memoria es
//   el de una foto (medido el 15/10/2026: ~60 MB con una de 2400 px), aunque suban varias personas juntas. Cada foto
//   arranca cuando termina la anterior (aunque haya fallado) y recibe su tope (hasta = Date.now() + topeMs, al
//   empezar): server/fotos/procesar.js se lo pasa a sharp, que corta el trabajo si se pasa (así la foto siguiente nunca
//   corre a la par de una vencida). Con más de maxEsperando encoladas, 503 (no pasa si cada una reservó su lugar: queda
//   como resguardo).
// Una por app (server/api/indice.js), así cada prueba arranca vacía.
import { MENSAJE_SUBIDA_LENTA, TOPE_RECEPCION_MS } from '../../compartido/fotos.js'
import { httpError } from '../errores.js'

export const MENSAJE_COLA_LLENA = 'Hay muchas fotos subiéndose en este momento. Probá de nuevo en un minuto.'
export const MENSAJE_YA_SUBIENDO =
  'Ya hay una foto tuya subiéndose (en otra pestaña o en otro equipo). Esperá a que termine y probá de nuevo.'
// El del tope de recepción lo comparte el panel, que corta antes (compartido/fotos.js).
export { MENSAJE_SUBIDA_LENTA }

/**
 * @param {{ topeMs?: number, enCursoMax?: number, maxEsperando?: number, topeRecepcionMs?: number }} [opciones]
 */
export function crearCola({ topeMs = 60_000, enCursoMax = 3, maxEsperando = enCursoMax, topeRecepcionMs = TOPE_RECEPCION_MS } = {}) {
  let ultima = Promise.resolve()
  let pendientes = 0
  let reservadas = 0
  /** Las cuentas con una subida en curso. */
  const cuentas = new Set()
  const ocupadaPor = (cuenta) => cuenta != null && cuentas.has(cuenta)
  return {
    topeRecepcionMs,
    /** ¿Esa cuenta ya tiene una subida en curso? */
    ocupadaPor,
    /**
     * Un lugar para una subida: la función para soltarlo (se puede llamar más de una vez), o null si no hay (ya hay
     * enCursoMax, o esa cuenta ya tiene una). Sin cuenta (las pruebas de la cola), solo cuenta el total.
     * @param {number} [cuenta]  el id de quien sube
     * @returns {(() => void) | null}
     */
    reservar(cuenta) {
      if (reservadas >= enCursoMax || ocupadaPor(cuenta)) return null
      reservadas += 1
      if (cuenta != null) cuentas.add(cuenta)
      let suelto = false
      return () => {
        if (suelto) return
        suelto = true
        reservadas -= 1
        if (cuenta != null) cuentas.delete(cuenta)
      }
    },
    /**
     * @template T
     * @param {(opciones: { hasta: number }) => Promise<T>} tarea
     * @returns {Promise<T>}
     */
    encolar(tarea) {
      if (pendientes >= maxEsperando) return Promise.reject(httpError(503, MENSAJE_COLA_LLENA))
      pendientes += 1
      // El descuento va antes de entregar el resultado: quien espera ya ve la cola sin esta foto.
      const resultado = ultima
        .then(() => tarea({ hasta: Date.now() + topeMs }))
        .finally(() => {
          pendientes -= 1
        })
      ultima = resultado.catch(() => {})
      return resultado
    },
    /** Las que están esperando o procesándose (las pruebas). */
    get pendientes() {
      return pendientes
    },
    /** Las subidas en curso, con su lugar reservado (las pruebas). */
    get reservadas() {
      return reservadas
    },
  }
}
