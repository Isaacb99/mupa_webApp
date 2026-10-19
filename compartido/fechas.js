// Fechas del sitio (plan 6.2). Código puro: sin APIs de Node ni del DOM.
// "Hoy" se calcula SOLO en el servidor y viaja en el estado de la página: si el navegador lo calculara al renderizar,
// cerca de la medianoche (o con otra zona horaria) dibujaría otra cosa que el HTML del servidor y la hidratación
// fallaría. Los formatos para mostrar (meses y días propios, sin toLocaleDateString) se suman con las páginas de E4.
// Desde E3.3, la hora de las actividades: el panel la carga con un <input type="datetime-local"> ("AAAA-MM-DDTHH:MM",
// sin zona) y se lee SIEMPRE como hora de San Juan (-03:00), en una sola función (instanteDeLocal); la vuelta, con
// localDeInstante. San Juan no tiene horario de verano desde 2009: si lo volviera a tener, se cambia acá.

const ZONA = 'America/Argentina/San_Juan'
const DESFASE = '-03:00'
// en-CA da AAAA-MM-DD, el formato de las columnas DATEONLY.
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })
// Las partes de un instante en San Juan (hora de 00 a 23).
const formatoPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Día de hoy en San Juan como "AAAA-MM-DD". */
export function hoyEnSanJuan(fecha = new Date()) {
  return formatoDia.format(fecha)
}

/** ¿"AAAA-MM-DD" es una fecha que existe (entre 2000 y 2099)? */
export function esFechaValida(texto) {
  const m = /^(20\d\d)-(\d\d)-(\d\d)$/.exec(String(texto))
  if (!m) return false
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

const LOCAL = /^(20\d\d-\d\d-\d\d)T([01]\d|2[0-3]):([0-5]\d)$/

/** ¿"AAAA-MM-DDTHH:MM" (lo que da un <input type="datetime-local">) es un día y una hora que existen? */
export const esFechaHoraValida = (texto) => {
  const m = LOCAL.exec(String(texto))
  return Boolean(m) && esFechaValida(m[1])
}

/**
 * "AAAA-MM-DDTHH:MM" leído como hora de San Juan, como instante (Date); null si no es una fecha y hora válida.
 * @param {string} texto
 */
export function instanteDeLocal(texto) {
  if (!esFechaHoraValida(texto)) return null
  return new Date(`${texto}:00${DESFASE}`)
}

/**
 * Un instante (Date o texto ISO) como "AAAA-MM-DDTHH:MM" con la hora de San Juan (lo que muestra un
 * <input type="datetime-local">); null si no hay.
 * @param {Date | string | null | undefined} instante
 */
export function localDeInstante(instante) {
  if (instante == null) return null
  const fecha = instante instanceof Date ? instante : new Date(instante)
  if (Number.isNaN(fecha.getTime())) return null
  const p = Object.fromEntries(formatoPartes.formatToParts(fecha).map(({ type, value }) => [type, value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
