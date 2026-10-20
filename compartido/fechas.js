// Fechas del sitio (plan 6.2). Código puro: sin APIs de Node ni del DOM.
// "Hoy" se calcula SOLO en el servidor y viaja en el estado de la página: si el navegador lo calculara al renderizar,
// cerca de la medianoche (o con otra zona horaria) dibujaría otra cosa que el HTML del servidor y la hidratación
// fallaría. Los formatos para mostrar (E4: "30 de noviembre de 2026", "Del 1 de octubre al 30 de noviembre de 2026",
// "Sábado 24 de octubre de 2026, de 18:00 a 20:00") van con meses y días propios, nunca con toLocaleDateString (que
// cambia entre Node y cada navegador), y los usa el servidor al armar los datos de cada página (server/paginas.js): el
// navegador recibe el texto hecho.
// Desde E3.3, la hora de las actividades: el panel la carga con un <input type="datetime-local"> ("AAAA-MM-DDTHH:MM",
// sin zona) y se lee SIEMPRE como hora de San Juan (-03:00), en una sola función (instanteDeLocal); la vuelta, con
// localDeInstante. San Juan no tiene horario de verano desde 2009: si lo volviera a tener, se cambia acá.
import { textoHora } from './horarios.js'

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

// --- Para mostrar (E4) ---

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
// ISO: el 1 es el lunes (como el horario semanal).
const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** Las partes de "AAAA-MM-DD" (null si no es una fecha que existe). */
function partesDeDia(dia) {
  if (!esFechaValida(dia)) return null
  const [anio, mes, d] = dia.split('-').map(Number)
  return { anio, mes, dia: d }
}

/**
 * El día de la semana de "AAAA-MM-DD", ISO (1 = lunes … 7 = domingo); null si no es una fecha.
 * @param {string} dia
 */
export function diaDeLaSemana(dia) {
  const p = partesDeDia(dia)
  if (!p) return null
  return ((new Date(Date.UTC(p.anio, p.mes - 1, p.dia)).getUTCDay() + 6) % 7) + 1
}

/** El nombre del día de la semana ISO (1 = lunes), en minúsculas: "jueves". */
export const nombreDelDia = (diaIso) => DIAS_SEMANA[diaIso - 1] ?? ''

/**
 * "30 de noviembre de 2026" (o "30 de noviembre" sin el año). "" si no es una fecha.
 * @param {string} dia  "AAAA-MM-DD"
 * @param {{ conAnio?: boolean, conDia?: boolean }} [opciones]  conDia: "lunes 30 de noviembre de 2026"
 */
export function fechaLarga(dia, { conAnio = true, conDia = false } = {}) {
  const p = partesDeDia(dia)
  if (!p) return ''
  const texto = `${p.dia} de ${MESES[p.mes - 1]}${conAnio ? ` de ${p.anio}` : ''}`
  return conDia ? `${nombreDelDia(diaDeLaSemana(dia))} ${texto}` : texto
}

/**
 * Un período de días: "Del 1 de octubre al 30 de noviembre de 2026" (el año una vez si es el mismo), "Del 15 de
 * diciembre de 2026 al 15 de febrero de 2027", "El 3 de octubre de 2026" (un solo día) o "Desde el 1 de octubre de
 * 2026" (sin fin). "" sin inicio.
 * @param {string | null} inicio  "AAAA-MM-DD"
 * @param {string | null} [fin]
 */
export function periodo(inicio, fin = null) {
  if (!esFechaValida(inicio)) return ''
  if (!esFechaValida(fin)) return `Desde el ${fechaLarga(inicio)}`
  if (fin === inicio) return `El ${fechaLarga(inicio)}`
  const mismoAnio = inicio.slice(0, 4) === fin.slice(0, 4)
  return `Del ${fechaLarga(inicio, { conAnio: !mismoAnio })} al ${fechaLarga(fin)}`
}

/**
 * Cuándo es una actividad, con la hora de San Juan: "Sábado 24 de octubre de 2026, de 18:00 a 20:00", "Sábado 24 de
 * octubre de 2026, 18:00" (sin fin) o "Del sábado 24 de octubre de 2026, 18:00, al domingo 25 de octubre de 2026,
 * 13:00" (en días distintos). "" sin inicio.
 * @param {Date | string | null} inicio  un instante
 * @param {Date | string | null} [fin]
 */
export function cuandoEs(inicio, fin = null) {
  const desde = localDeInstante(inicio)
  if (!desde) return ''
  const hasta = localDeInstante(fin)
  const [diaDesde, horaDesde] = desde.split('T')
  const textoDesde = `${fechaLarga(diaDesde, { conDia: true })}, ${textoHora(horaDesde)}`
  if (!hasta || hasta === desde) return mayuscula(textoDesde)
  const [diaHasta, horaHasta] = hasta.split('T')
  if (diaHasta === diaDesde) {
    return mayuscula(`${fechaLarga(diaDesde, { conDia: true })}, de ${textoHora(horaDesde)} a ${textoHora(horaHasta)}`)
  }
  return `Del ${textoDesde}, al ${fechaLarga(diaHasta, { conDia: true })}, ${textoHora(horaHasta)}`
}
