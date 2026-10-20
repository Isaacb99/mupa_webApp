// El formulario de contacto del sitio (E4.5, plan 8): lo que valida el servidor en POST /contacto (server/contacto.js).
// Solo servidor: nunca en el bundle público (plan 6.2); el navegador valida con los atributos HTML del formulario, con
// los mismos topes (compartido/contacto.js).
// - nombre: hasta 100 caracteres, en una sola línea (sin saltos de línea ni caracteres de control: el nombre va al
//   asunto del mail, plan 9 "Entrada"). Los caracteres invisibles (de ancho cero, los que invierten la dirección del
//   texto, los rellenos del hangul) se sacan: no se ven, y uno de dirección mostraba "Ana \u202Etxt.exe" como
//   "Ana exe.txt" en el asunto y en Mensajes (CON-05 de la verificación de E4). Tiene que quedar al menos una letra o
//   un número: si no, es como si estuviera vacío;
// - email: un correo válido, hasta 254;
// - mensaje: de 10 a 5.000 caracteres, con 3 enlaces como máximo. Lo que se pega de otro lado se acomoda en vez de
//   rechazarse (CON-06: un error que no dice qué carácter es no se puede corregir): los saltos de línea de Windows
//   (\r\n, \r), los separadores de línea y de párrafo de Unicode (U+2028, U+2029), el salto de línea de C1 (U+0085), el
//   tabulador vertical (Mayús+Enter de PowerPoint) y el salto de página (el de un PDF) pasan a \n; las comillas y rayas
//   de Windows leídas como C1 (U+0091 a U+0097) pasan a las tipográficas; los demás caracteres de control (también el
//   NUL, que Postgres no guarda) se sacan. Quedan el salto de línea y el tabulador.
// Los errores son CÓDIGOS (compartido/contacto.js, ERRORES_DE_CAMPO), no textos: los textos los pone la página con
// src/content.js. erroresDeContacto() da el primero de cada campo.
import { CONTACTO, contarEnlaces, sinInvisibles } from '../contacto.js'
import { z } from './zod.js'

const ILEGIBLES = /[\p{Cs}\uFFFD]/u
const CONTROL_LINEA = /[\p{Cc}\p{Zl}\p{Zp}]/u
// Una letra o un número (lo que queda de un nombre sin sus invisibles).
const LETRA = /[\p{L}\p{N}]/u

// El mensaje pegado: los saltos de línea de todos lados pasan a \n y los demás controles se sacan.
const SALTOS = /\r\n?|[\u2028\u2029\u0085\u000B\u000C]/g
const C1_DE_WINDOWS = { '\u0091': '‘', '\u0092': '’', '\u0093': '“', '\u0094': '”', '\u0096': '–', '\u0097': '—' }
const CONTROLES = /[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g

/** El mensaje como se guarda: los saltos de línea como \n, sin caracteres de control (salvo \n y \t) y sin espacios a los costados. */
export function acomodarMensaje(texto) {
  return texto
    .replace(SALTOS, '\n')
    .replace(/[\u0091-\u0094\u0096\u0097]/g, (c) => C1_DE_WINDOWS[c])
    .replace(CONTROLES, '')
    .trim()
}

const nombre = z
  .string({ error: 'falta' })
  .transform((v) => sinInvisibles(v).trim())
  .pipe(
    z
      .string()
      .min(1, { error: 'falta' })
      .max(CONTACTO.NOMBRE_MAX, { error: 'largo' })
      .refine((v) => !ILEGIBLES.test(v), { error: 'ilegible' })
      .refine((v) => !CONTROL_LINEA.test(v), { error: 'una_linea' })
      // Solo signos o emojis: como si faltara.
      .refine((v) => LETRA.test(v), { error: 'falta' }),
  )

const email = z
  .string({ error: 'falta' })
  .trim()
  .min(1, { error: 'falta' })
  .max(CONTACTO.EMAIL_MAX, { error: 'largo' })
  .email({ error: 'invalido' })

const mensaje = z
  .string({ error: 'falta' })
  .transform(acomodarMensaje)
  .pipe(
    z
      .string()
      .min(1, { error: 'falta' })
      .min(CONTACTO.MENSAJE_MIN, { error: 'corto' })
      .max(CONTACTO.MENSAJE_MAX, { error: 'largo' })
      .refine((v) => !ILEGIBLES.test(v), { error: 'ilegible' })
      .refine((v) => contarEnlaces(v) <= CONTACTO.ENLACES_MAX, { error: 'enlaces' }),
  )

/** Lo que manda el formulario (las claves de más, como el campo trampa, se descartan). */
export const esquemaContacto = z.object({ nombre, email, mensaje })

/**
 * El primer código de error de cada campo de un ZodError del esquema: { nombre: 'falta', mensaje: 'enlaces' }.
 * @param {import('zod').ZodError} error
 */
export function erroresDeContacto(error) {
  const errores = {}
  for (const problema of error.issues) {
    const campo = String(problema.path[0] ?? '')
    if (!['nombre', 'email', 'mensaje'].includes(campo) || errores[campo]) continue
    // Un tipo equivocado (un campo que vino dos veces llega como lista) cuenta como "falta".
    errores[campo] = problema.code === 'invalid_type' ? 'falta' : problema.message
  }
  return errores
}
