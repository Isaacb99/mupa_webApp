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
//   (\r\n, \r), los separadores de línea y de párrafo de Unicode (U+2028, U+2029), el tabulador vertical (Mayús+Enter
//   de PowerPoint) y el salto de página (el de un PDF) pasan a \n; los caracteres de C1 (U+0080 a U+009F) se leen como
//   lo que son en Windows-1252, que es de donde vienen cuando se pegan (CON-09 de la verificación de E4: el €, la
//   viñeta, ™, las comillas y las rayas, y U+0085, que son los puntos suspensivos y no un salto de línea), y los cinco
//   que Windows-1252 no define se sacan; los demás caracteres de control (también el NUL, que Postgres no guarda) se
//   sacan. Quedan el salto de línea y el tabulador. Al nombre se le aplica lo mismo de Windows-1252 (con la comilla de
//   Windows, "O’Brien" es eso y no un error de "una sola línea").
// Los errores son CÓDIGOS (compartido/contacto.js, ERRORES_DE_CAMPO), no textos: los textos los pone la página con
// src/content.js. erroresDeContacto() da el primero de cada campo.
import { CONTACTO, contarEnlaces, sinInvisibles } from '../contacto.js'
import { z } from './zod.js'

const ILEGIBLES = /[\p{Cs}\uFFFD]/u
const CONTROL_LINEA = /[\p{Cc}\p{Zl}\p{Zp}]/u
// Una letra o un número (lo que queda de un nombre sin sus invisibles).
const LETRA = /[\p{L}\p{N}]/u

// El mensaje pegado: los saltos de línea de todos lados pasan a \n y los demás controles se sacan.
const SALTOS = /\r\n?|[\u2028\u2029\u000B\u000C]/g
// Los caracteres de 0x80 a 0x9F de Windows-1252 (un texto en Windows-1252 leído como Latin-1 los deja en U+0080 a
// U+009F). Los cinco que Windows-1252 no define (0x81, 0x8D, 0x8F, 0x90 y 0x9D) no están: los sacan los controles.
const WINDOWS_1252 = {
  '\u0080': '€',
  '\u0082': '‚',
  '\u0083': 'ƒ',
  '\u0084': '„',
  '\u0085': '…',
  '\u0086': '†',
  '\u0087': '‡',
  '\u0088': 'ˆ',
  '\u0089': '‰',
  '\u008A': 'Š',
  '\u008B': '‹',
  '\u008C': 'Œ',
  '\u008E': 'Ž',
  '\u0091': '‘',
  '\u0092': '’',
  '\u0093': '“',
  '\u0094': '”',
  '\u0095': '•',
  '\u0096': '–',
  '\u0097': '—',
  '\u0098': '˜',
  '\u0099': '™',
  '\u009A': 'š',
  '\u009B': '›',
  '\u009C': 'œ',
  '\u009E': 'ž',
  '\u009F': 'Ÿ',
}
const C1 = /[\u0080-\u009F]/g
const CONTROLES = /[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g

/** Los caracteres de C1 como lo que son en Windows-1252 (los cinco que no son nada quedan: los saca quien sigue). */
export const deWindows1252 = (texto) => texto.replace(C1, (c) => WINDOWS_1252[c] ?? c)

/** El mensaje como se guarda: los saltos de línea como \n, sin caracteres de control (salvo \n y \t) y sin espacios a los costados. */
export function acomodarMensaje(texto) {
  return deWindows1252(texto.replace(SALTOS, '\n'))
    .replace(CONTROLES, '')
    .trim()
}

const nombre = z
  .string({ error: 'falta' })
  .transform((v) => sinInvisibles(deWindows1252(v)).trim())
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
