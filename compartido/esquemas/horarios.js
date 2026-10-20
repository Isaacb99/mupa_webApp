// Horario semanal (plan 3.2, 4.3 y 5.3): PUT /administracion/api/horarios con los 7 días juntos. Solo servidor y
// panel.
// - Cada día (ISO: 1 = lunes) está abierto o cerrado. Abierto: 1 o 2 franjas "HH:MM" (lo que da un
//   <input type="time">), cada una con abre < cierra y sin superponerse (una puede terminar justo cuando empieza la
//   otra). Cerrado: sin franjas (las que lleguen se descartan sin validarlas).
// - Las franjas se guardan ordenadas por la hora de apertura.
// - nota: hasta 120 caracteres en una línea ("Visitas guiadas a las 11").
// Los errores van al campo exacto (dias.1.franjas.0.cierra) para que el panel los ponga junto a su control. Una hora
// vacía dice cuál falta ("Completá la hora de cierre."); una mal escrita, cómo se escribe.
import { opcional, siNo, textoLinea } from './campos.js'
import { z } from './zod.js'

// Los nombres de los días están en compartido/horarios.js (sin zod: también los usa el sitio, E4.1).
export { DIAS } from '../horarios.js'
export const FRANJAS_MAX = 2

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const MENSAJE_HORA = 'Escribí la hora como 09:30.'

/**
 * Una hora "HH:MM". Vacía dice cuál falta (el control de hora del panel no deja escribir otro formato). Los dos
 * errores cortan ahí: una hora mal escrita no se compara con la otra.
 */
const hora = (falta) =>
  z
    .string({ error: MENSAJE_HORA })
    .trim()
    .min(1, { error: falta, abort: true })
    .regex(HORA, { error: MENSAJE_HORA, abort: true })

const franja = z
  .object({ abre: hora('Completá la hora de apertura.'), cierra: hora('Completá la hora de cierre.') })
  .superRefine((f, ctx) => {
    if (f.abre >= f.cierra) {
      ctx.addIssue({ code: 'custom', path: ['cierra'], message: 'Tiene que ser más tarde que la apertura.' })
    }
  })

// Un día cerrado no lleva franjas: las que lleguen (lo que quedó escrito en el panel) se descartan sin validarlas.
const sinFranjasSiCierra = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && v.abierto === false ? { ...v, franjas: [] } : v

const dia = z.preprocess(
  sinFranjasSiCierra,
  z
    .object({
      dia: z.number({ error: 'El día tiene que ser un número del 1 al 7.' }).int().min(1).max(7),
      abierto: siNo('Abierto'),
      franjas: z
        .array(franja, { error: 'Las franjas tienen que ser una lista.' })
        .max(FRANJAS_MAX, { error: `Pueden ser hasta ${FRANJAS_MAX} franjas por día.` }),
      nota: opcional(textoLinea(120)),
    })
    .superRefine((d, ctx) => {
      if (d.abierto && d.franjas.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['franjas'],
          message: 'Cargá al menos una franja horaria, o marcá el día como cerrado.',
        })
      }
      if (d.abierto && d.franjas.length === 2) {
        const [a, b] = d.franjas
        // Se superponen si cada una empieza antes de que termine la otra.
        if (a.abre < b.cierra && b.abre < a.cierra) {
          ctx.addIssue({ code: 'custom', path: ['franjas', 1, 'abre'], message: 'Las dos franjas se superponen.' })
        }
      }
    })
    .transform((d) => ({ ...d, franjas: [...d.franjas].sort((a, b) => (a.abre < b.abre ? -1 : 1)) })),
)

/** PUT /horarios: { dias: [7 días, del 1 al 7, cada uno una vez] }. Devuelve los días ordenados (1 a 7). */
export const esquemaHorarios = z.object({
  dias: z
    .array(dia, { error: 'Faltan los días.' })
    .length(7, { error: 'Tienen que ser los 7 días de la semana.' })
    .superRefine((dias, ctx) => {
      const vistos = new Set(dias.map((d) => d.dia))
      if (vistos.size !== 7) ctx.addIssue({ code: 'custom', message: 'Tiene que estar cada día de la semana una vez.' })
    })
    .transform((dias) => [...dias].sort((a, b) => a.dia - b.dia)),
})
