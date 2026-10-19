// Tareas diarias del servicio (plan 2.3, "Arranque", paso 5, y 7): corren al arrancar (así el registro que lee el Inicio
// se llena después de cada deploy) y todos los días a las 04:00 de San Juan (HORA_TAREAS; plan 7: fuera de las horas
// de uso, sin competir con el sitio por las 5 conexiones), en el mismo proceso (hay una sola instancia). Cada vuelta
// programa la siguiente con setTimeout, contando hasta las próximas 04:00: un reinicio no corre el horario. Un fallo
// se avisa en el log y no tumba el servicio; la próxima vuelta reintenta. Cada una en su propio try/catch: si una
// falla, las demás corren igual.
// Hoy: borrar las sesiones vencidas (12 h de máximo o 2 h sin uso) y, desde E3.1, las fotos huérfanas (subidas hace
// más de 24 h y que no usa nadie: server/fotos/usos.js). Desde E4.9, borrar los mensajes del formulario de más de 180
// días; desde E4.5, verificar la casilla de envío.
//
// Cómo salió la última vuelta de cada tarea queda en un registro en memoria (crearRegistroDeTareas), que lee el
// Inicio del panel (GET /administracion/api/estado, server/api/estado.js) para avisar de las que vienen fallando. Lo
// crean servidor.js y dev.js y se lo pasan a esta función y a la app; un reinicio lo vacía (la vuelta del arranque lo
// vuelve a llenar). Una tarea nueva: su nombre en NOMBRES (el texto lo pone el panel, panel/src/pantallas/Inicio.jsx)
// y su función en TAREAS, dentro de programarTareas (devuelve lo que va al log, sin datos de nadie: { borradas }).
import { hoyEnSanJuan, instanteDeLocal } from '../compartido/fechas.js'
import { borrarSesionesVencidas } from './auth/sesiones.js'
import { crearAlmacen } from './fotos/almacen.js'
import { codigoDeError, log } from './log.js'

const UN_DIA = 24 * 3_600_000
/** La hora de San Juan a la que corren las tareas, todos los días ("HH:MM"). */
export const HORA_TAREAS = '04:00'

/**
 * Los ms que faltan para la próxima HORA_TAREAS de San Juan (la de hoy si todavía no pasó; si no, la de mañana).
 * @param {Date} [ahora]
 */
export function msHastaLaProximaVuelta(ahora = new Date()) {
  const hoy = instanteDeLocal(`${hoyEnSanJuan(ahora)}T${HORA_TAREAS}`)
  const proxima = hoy > ahora ? hoy : new Date(hoy.getTime() + UN_DIA)
  return proxima.getTime() - ahora.getTime()
}

/** Las tareas que existen, en el orden en que corren (y en que el Inicio las lista). */
export const NOMBRES = Object.freeze(['sesiones_vencidas', 'fotos_huerfanas'])

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
 * @param {{ sequelize: import('sequelize').Sequelize | null, registro?: ReturnType<typeof crearRegistroDeTareas>,
 *   almacen?: ReturnType<typeof crearAlmacen> | null }} deps
 *   almacen: el de las fotos de la app (así lo que se borra sale también de la caché de /fotos); sin él, uno propio
 * @returns {{ listas: Promise<void>, detener: () => void }}  listas: la primera vuelta terminada (las pruebas)
 */
export function programarTareas({ sequelize, registro = crearRegistroDeTareas(), almacen = null }) {
  if (!sequelize) return { listas: Promise.resolve(), detener: () => {} }
  const fotos = almacen ?? crearAlmacen(sequelize)
  const TAREAS = {
    sesiones_vencidas: async () => ({ borradas: await borrarSesionesVencidas(sequelize) }),
    fotos_huerfanas: async () => ({ borradas: await fotos.borrarHuerfanas() }),
  }
  async function vuelta() {
    for (const tarea of NOMBRES) {
      try {
        log('info', tarea, await TAREAS[tarea]())
        registro.anotar(tarea)
      } catch (err) {
        log('aviso', 'tarea_fallida', { tarea, mensaje: err.message, codigo: codigoDeError(err) })
        registro.anotar(tarea, err)
      }
    }
  }
  const listas = vuelta()
  let reloj = null
  const programar = () => {
    reloj = setTimeout(() => {
      vuelta()
      programar()
    }, msHastaLaProximaVuelta())
    // Que el reloj no mantenga vivo el proceso: el apagado ordenado sale igual.
    reloj.unref()
  }
  programar()
  return { listas, detener: () => clearTimeout(reloj) }
}
