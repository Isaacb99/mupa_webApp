// La cola de las subidas de fotos (plan 7): el procesado, de a una y con 60 s de tope por foto, y cuántas subidas
// puede haber en curso a la vez.
// - reservar(): un lugar para una subida, desde que se empieza a recibir el archivo hasta que se responde (lo toma
//   server/api/fotos.js ANTES de multer y lo suelta cuando la respuesta termina o se corta la conexión). Como mucho
//   enCursoMax (3) a la vez, entre todas las personas: con más, 503 en el momento y sin leer el archivo. Así lo que
//   ocupa la memoria es, como mucho, tres archivos de hasta 20 MB más el procesado de uno (corrección de E3,
//   16/10/2026: antes multer leía el archivo entero antes de que la cola decidiera, y 20 subidas de 18 MB a la vez
//   llevaban el proceso a 579 MB, más que los 512 MB de Render).
// - encolar(tarea): el procesado, de a una. Con sharp.concurrency(1) y una sola foto a la vez, el pico de memoria es
//   el de una foto (medido el 15/10/2026: ~60 MB con una de 2400 px), aunque suban varias personas juntas. Cada foto
//   arranca cuando termina la anterior (aunque haya fallado) y recibe su tope (hasta = Date.now() + topeMs, al
//   empezar): server/fotos/procesar.js se lo pasa a sharp, que corta el trabajo si se pasa (así la foto siguiente nunca
//   corre a la par de una vencida). Con más de maxEsperando encoladas, 503 (no pasa si cada una reservó su lugar: queda
//   como resguardo).
// Una por app (server/api/indice.js), así cada prueba arranca vacía.
import { httpError } from '../errores.js'

export const MENSAJE_COLA_LLENA = 'Hay muchas fotos subiéndose en este momento. Probá de nuevo en un minuto.'

/**
 * @param {{ topeMs?: number, enCursoMax?: number, maxEsperando?: number }} [opciones]
 */
export function crearCola({ topeMs = 60_000, enCursoMax = 3, maxEsperando = enCursoMax } = {}) {
  let ultima = Promise.resolve()
  let pendientes = 0
  let reservadas = 0
  return {
    /**
     * Un lugar para una subida: la función para soltarlo (se puede llamar más de una vez), o null si no hay.
     * @returns {(() => void) | null}
     */
    reservar() {
      if (reservadas >= enCursoMax) return null
      reservadas += 1
      let suelto = false
      return () => {
        if (suelto) return
        suelto = true
        reservadas -= 1
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
