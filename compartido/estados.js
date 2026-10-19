// Los estados de los contenidos (plan 3.2, "Qué se calcula y no se guarda", y 5.4). Código puro, sin zod: lo usan el
// panel (listados y fichas) y, desde E4, el sitio y su servidor.
// - Guardado: Borrador o Publicada (la columna estado). Público = publicado.
// - Calculado, nunca guardado (cambia solo con el paso del tiempo):
//   · una muestra, con el "hoy" de San Juan: Permanente, o si es temporal, Próxima (empieza después de hoy), Actual
//     (empezó y no terminó: fecha_inicio <= hoy y sin fin o fin >= hoy) o Finalizada (terminó antes de hoy). Una
//     temporal sin fecha de inicio (solo puede ser un borrador) no tiene situación todavía, salvo que ya haya
//     terminado;
//   · una actividad: "Realizada" si ya terminó (el fin, o el inicio si no tiene fin, antes de ahora).
// "Hoy" y "ahora" se reciben: en el sitio salen del estado de la página (los calcula el servidor, plan 6.2).
import { hoyEnSanJuan, instanteDeLocal } from './fechas.js'

/** Cómo se nombra cada estado guardado (todos los contenidos son femeninos: novedad, muestra, sala). */
export const ESTADOS = Object.freeze({ borrador: 'Borrador', publicado: 'Publicada' })

/** Cómo se nombra la situación de una muestra. */
export const SITUACIONES_MUESTRA = Object.freeze({
  permanente: 'Permanente',
  proxima: 'Próxima',
  actual: 'Actual',
  finalizada: 'Finalizada',
})

/**
 * La situación de una muestra: 'permanente', 'proxima', 'actual', 'finalizada' o null (temporal sin fecha de inicio).
 * @param {{ tipo: 'permanente' | 'temporal', fechaInicio?: string | null, fechaFin?: string | null }} muestra
 *   fechas "AAAA-MM-DD"
 * @param {string} [hoy]  "AAAA-MM-DD" en San Juan
 */
export function situacionDeMuestra({ tipo, fechaInicio, fechaFin }, hoy = hoyEnSanJuan()) {
  if (tipo === 'permanente') return 'permanente'
  if (fechaFin && fechaFin < hoy) return 'finalizada'
  if (!fechaInicio) return null
  return fechaInicio > hoy ? 'proxima' : 'actual'
}

/** Un instante a partir de un Date, un texto ISO con zona o uno de un datetime-local (hora de San Juan). */
function aInstante(valor) {
  if (valor == null || valor === '') return null
  if (valor instanceof Date) return valor
  const local = instanteDeLocal(valor)
  if (local) return local
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/**
 * ¿La actividad ya se realizó? (coalesce(evento_fin, evento_inicio) < ahora). Sin fechas, no.
 * @param {{ eventoInicio?: Date | string | null, eventoFin?: Date | string | null }} actividad
 * @param {Date} [ahora]
 */
export function actividadRealizada({ eventoInicio, eventoFin }, ahora = new Date()) {
  const fin = aInstante(eventoFin) ?? aInstante(eventoInicio)
  return fin != null && fin.getTime() < ahora.getTime()
}
