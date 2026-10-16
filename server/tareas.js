// Tareas diarias del servicio (plan 2.3, "Arranque", paso 5): corren al arrancar y una vez por día, en el mismo
// proceso (hay una sola instancia). Un fallo se avisa en el log y no tumba el servicio; la próxima vuelta reintenta.
// Hoy: borrar las sesiones vencidas (12 h de máximo o 2 h sin uso). Desde E4.9, borrar los mensajes del formulario de
// más de 180 días; desde E4.5, verificar la casilla de envío.
//
// Cómo salió la última vuelta de cada tarea queda en un registro en memoria (crearRegistroDeTareas), que lee el
// Inicio del panel (GET /administracion/api/estado, server/api/estado.js) para avisar de las que vienen fallando. Lo
// crean servidor.js y dev.js y se lo pasan a esta función y a la app; un reinicio lo vacía (la vuelta del arranque lo
// vuelve a llenar). Una tarea nueva: su nombre en NOMBRES (el texto lo pone el panel, panel/src/pantallas/Inicio.jsx)
// y su llamada dentro de vuelta(), con registro.anotar.
import { borrarSesionesVencidas } from './auth/sesiones.js'
import { codigoDeError, log } from './log.js'

const UN_DIA = 24 * 3_600_000

/** Las tareas que existen, en el orden en que corren (y en que el Inicio las lista). */
export const NOMBRES = Object.freeze(['sesiones_vencidas'])

/**
 * Registro de la última vuelta de cada tarea.
 * - anotar(tarea, err): err null si salió bien. Una falla seguida de otra conserva "desde" (la primera de la racha).
 * - fallidas(): las tareas cuya última vuelta falló, como [{ tarea, desde, ultima, codigo }] (fechas ISO, codigo o
 *   null), en el orden de NOMBRES. Nunca el mensaje del error: puede traer datos (va al log, no al panel).
 */
export function crearRegistroDeTareas() {
  /** @type {Map<string, { ok: boolean, en: Date, desde?: Date, codigo?: string | null }>} */
  const ultimas = new Map()
  return {
    anotar(tarea, err = null, ahora = new Date()) {
      if (!err) {
        ultimas.set(tarea, { ok: true, en: ahora })
        return
      }
      const anterior = ultimas.get(tarea)
      const desde = anterior && !anterior.ok ? anterior.desde : ahora
      ultimas.set(tarea, { ok: false, en: ahora, desde, codigo: codigoDeError(err) ?? null })
    },
    fallidas() {
      const orden = (t) => (NOMBRES.includes(t) ? NOMBRES.indexOf(t) : NOMBRES.length)
      return [...ultimas]
        .filter(([, r]) => !r.ok)
        .sort(([a], [b]) => orden(a) - orden(b) || a.localeCompare(b))
        .map(([tarea, r]) => ({ tarea, desde: r.desde.toISOString(), ultima: r.en.toISOString(), codigo: r.codigo }))
    },
  }
}

/**
 * @param {{ sequelize: import('sequelize').Sequelize | null, registro?: ReturnType<typeof crearRegistroDeTareas> }} deps
 * @returns {{ listas: Promise<void>, detener: () => void }}  listas: la primera vuelta terminada (las pruebas)
 */
export function programarTareas({ sequelize, registro = crearRegistroDeTareas() }) {
  if (!sequelize) return { listas: Promise.resolve(), detener: () => {} }
  async function vuelta() {
    try {
      const borradas = await borrarSesionesVencidas(sequelize)
      log('info', 'sesiones_vencidas', { borradas })
      registro.anotar('sesiones_vencidas')
    } catch (err) {
      log('aviso', 'tarea_fallida', { tarea: 'sesiones_vencidas', mensaje: err.message, codigo: codigoDeError(err) })
      registro.anotar('sesiones_vencidas', err)
    }
  }
  const listas = vuelta()
  const reloj = setInterval(vuelta, UN_DIA)
  // Que el reloj no mantenga vivo el proceso: el apagado ordenado sale igual.
  reloj.unref()
  return { listas, detener: () => clearInterval(reloj) }
}
