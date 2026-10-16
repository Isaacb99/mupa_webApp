// Tarifas (plan 3.2, 4.3 y 5.3): POST /administracion/api/tarifas, PUT /tarifas/:id y PUT /tarifas/orden. Solo
// servidor y panel.
// - nombre (obligatorio, hasta 80), gratuita, precio en pesos SIN centavos (entero; obligatorio si no es gratuita, y
//   una gratuita se guarda sin precio), condición (hasta 160: "Con credencial") y visible (en el sitio).
// - El orden no va acá: una tarifa nueva va al final y se reordena con PUT /tarifas/orden { ids }, con todas las
//   tarifas en el orden nuevo (los botones Subir y Bajar del panel).
import { opcional, siNo, textoLinea } from './campos.js'
import { z } from './zod.js'

/** Hasta cuántas tarifas: alcanza de sobra y la pantalla sigue siendo manejable. */
export const TARIFAS_MAX = 50
export const PRECIO_MAX = 99_999_999

const MENSAJE_PRECIO = 'Escribí el precio en pesos, sin centavos (por ejemplo 3000).'

const precio = z
  .number({ error: MENSAJE_PRECIO })
  .int({ error: MENSAJE_PRECIO })
  .min(0, { error: 'El precio no puede ser negativo.' })
  .max(PRECIO_MAX, { error: 'El precio es demasiado alto.' })
  .nullable()

/** Las reglas que miran más de un campo, iguales para el alta y el cambio. */
const conReglas = (objeto) =>
  objeto
    .superRefine((t, ctx) => {
      if (!t.gratuita && t.precio == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['precio'],
          message: 'Escribí el precio, o marcá la tarifa como gratuita.',
        })
      }
    })
    // Una gratuita no tiene precio.
    .transform((t) => (t.gratuita ? { ...t, precio: null } : t))

/** POST /tarifas: lo que no viene toma su valor por defecto (no gratuita, sin condición, visible). */
export const esquemaTarifa = conReglas(
  z.object({
    nombre: textoLinea(80, { falta: 'Escribí el nombre de la tarifa.' }),
    gratuita: siNo('Gratuita').default(false),
    precio: precio.default(null),
    condicion: opcional(textoLinea(160)).default(null),
    visible: siNo('Visible').default(true),
  }),
)

/**
 * PUT /tarifas/:id: el esquema COMPLETO, sin valores por defecto (plan 4.3: el PUT recibe el esquema completo). Un
 * campo que falta da 400: si no, un PUT sin "visible" volvería a publicar una tarifa oculta, y uno sin "condicion" la
 * borraría. precio y condicion van siempre, en null si no tienen.
 */
export const esquemaTarifaCompleta = conReglas(
  z.object({
    nombre: textoLinea(80, { falta: 'Escribí el nombre de la tarifa.' }),
    gratuita: siNo('Gratuita'),
    precio,
    condicion: opcional(textoLinea(160)),
    visible: siNo('Visible'),
  }),
)

/** PUT /tarifas/orden: { ids }, todas las tarifas en el orden nuevo, cada una una vez. */
export const esquemaOrdenTarifas = z.object({
  ids: z
    .array(z.number({ error: 'Los ids tienen que ser números.' }).int().min(1).max(2_147_483_647), {
      error: 'Faltan las tarifas en el orden nuevo.',
    })
    .min(1, { error: 'Faltan las tarifas en el orden nuevo.' })
    .max(TARIFAS_MAX, { error: 'Son demasiadas tarifas.' })
    .refine((ids) => new Set(ids).size === ids.length, { error: 'Una tarifa aparece dos veces.' }),
})
