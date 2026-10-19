// Fechas y validación local del panel. Código sin React ni DOM.
// - Las fechas se muestran con la hora de San Juan, sin importar la zona de la computadora.
// - validarCon(esquema, datos): el mismo esquema zod que usa el servidor (compartido/esquemas/), para mostrar los
//   errores sin esperar al servidor. El servidor los vuelve a validar igual.
const ZONA = 'America/Argentina/San_Juan'

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

const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: ZONA,
})
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })

/** "14 de octubre de 2026, 10:32" (un instante: ISO o Date), con la hora de 0 a 23 (sin "a. m.", que choca con un punto final). */
export const fechaHora = (instante) => formatoFechaHora.format(new Date(instante))

/** "20 de octubre de 2026" (una fecha de calendario "AAAA-MM-DD"). */
export function fechaLarga(dia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dia))
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : String(dia)
}

/**
 * "20 de octubre de 2026, 18:30": un día y una hora de San Juan como los da la API ("AAAA-MM-DDTHH:MM", el valor de un
 * <input type="datetime-local">; E3.3).
 */
export function fechaHoraLocal(local) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(String(local))
  return m ? `${fechaLarga(m[1])}, ${m[2]}:${m[3]}` : String(local)
}

/** Hoy en San Juan, "AAAA-MM-DD". */
export const hoyEnSanJuan = () => formatoDia.format(new Date())

/**
 * Valida con un esquema de compartido/esquemas/: { ok: true, datos } o { ok: false, errores, general }, con un
 * mensaje por campo (el primero; la ruta con puntos, como la API: "dias.1.franjas.0.cierra") y los del objeto entero
 * en general.
 * @param {import('zod').ZodType} esquema
 * @param {unknown} datos
 */
export function validarCon(esquema, datos) {
  const r = esquema.safeParse(datos)
  if (r.success) return { ok: true, datos: r.data }
  const errores = {}
  let general = null
  for (const problema of r.error.issues) {
    const campo = problema.path.join('.')
    if (campo) errores[campo] ??= problema.message
    else general ??= problema.message
  }
  return { ok: false, errores, general }
}

/** Para un <input>: null pasa a "". */
export const aTexto = (v) => (v == null ? '' : String(v))

/** ¿Son iguales dos valores planos (lo que se compara para saber si hay cambios sin guardar)? */
export const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b)
