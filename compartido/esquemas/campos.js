// Campos que se repiten en los esquemas del museo, el horario y las tarifas (plan 3.2, 4.1 y 5.3). Solo servidor y
// panel: nunca en el bundle público (zod no entra ahí, plan 6.2).
// - Un texto opcional vacío (o con solo espacios) se guarda como null: el sitio no dibuja lo que está en null y el
//   Inicio del panel lo cuenta como "para completar".
// - Los textos de una línea no aceptan saltos de línea ni caracteres de control; los de varias líneas (las notas) sí
//   aceptan saltos de línea (\r\n y \r pasan a \n). Ninguno acepta surrogates sueltos ni U+FFFD (lo que dejan los
//   bytes que no eran UTF-8): Postgres no guardaría lo que llegó.
// - Los largos (.max) los cuenta zod en caracteres (code points: un emoji cuenta 1), igual que el varchar de Postgres:
//   lo que pasa acá entra en la tabla. El panel cuenta en unidades UTF-16 (maxLength y .length: un emoji cuenta 2), que
//   es más estricto, así que el servidor nunca rechaza por largo lo que el panel dejó pasar.
// - Las direcciones (URL) se guardan con el esquema en minúsculas ("HTTPS://" pasa a "https://": los CHECK de la tabla
//   comparan con 'https://%', que distingue mayúsculas) y sin caracteres invisibles ni de control.
// Código puro: sin APIs de Node ni del DOM (URL es un estándar de los dos).
import { esFechaHoraValida, esFechaValida } from '../fechas.js'
import { z } from './zod.js'

const ILEGIBLES = /[\p{Cs}�]/u
const CONTROL_LINEA = /[\p{Cc}\p{Zl}\p{Zp}]/u
// En los de varias líneas, el salto de línea sí.
const CONTROL_VARIAS = /[\p{Zl}\p{Zp}\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u

const vacioANull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v)

/** Un esquema que acepta null y "" (que pasa a null). */
export const opcional = (esquema) => z.preprocess(vacioANull, esquema.nullable())

/**
 * Texto de una línea, hasta max (obligatorio: al menos un carácter que no sea espacio).
 * @param {number} max
 * @param {{ falta?: string, largo?: string }} [mensajes]
 */
export function textoLinea(
  max,
  { falta = 'Completá este dato.', largo = `Puede tener hasta ${max} caracteres.` } = {},
) {
  return z
    .string({ error: falta })
    .trim()
    .min(1, { error: falta })
    .max(max, { error: largo })
    .refine((v) => !ILEGIBLES.test(v), { error: 'Tiene caracteres que no se pudieron leer. Escribilo de nuevo.' })
    .refine((v) => !CONTROL_LINEA.test(v), { error: 'Tiene que ir en una sola línea, sin caracteres especiales.' })
}

/**
 * Texto de varias líneas (una nota), hasta max después de unificar los saltos de línea.
 * @param {number} max
 */
export function textoVariasLineas(max, { largo = `Puede tener hasta ${max} caracteres.` } = {}) {
  return z
    .string({ error: 'Tiene que ser un texto.' })
    .transform((v) => v.replace(/\r\n?/g, '\n').trim())
    .pipe(
      z
        .string()
        .max(max, { error: largo })
        .refine((v) => !ILEGIBLES.test(v), { error: 'Tiene caracteres que no se pudieron leer. Escribilo de nuevo.' })
        .refine((v) => !CONTROL_VARIAS.test(v), { error: 'Tiene caracteres especiales que no se pueden guardar.' }),
    )
}

export const URL_MAX = 2000
export const MENSAJE_HTTPS =
  'Tiene que ser una dirección completa, que empiece con https://, por ejemplo https://www.instagram.com/museo. ' +
  'Lo más seguro es copiarla de la barra de direcciones del navegador.'
export const MENSAJE_INVISIBLES =
  'Tiene un carácter invisible que no puede ir en una dirección (a veces se cuela al copiar de un documento o de un ' +
  'mensaje). Copiala directamente de la barra de direcciones del navegador.'

// Lo que no puede ir en una dirección aunque no se vea: de control (NUL, tabulador…), de formato (el espacio de ancho
// cero, las marcas de dirección del texto), surrogates sueltos, separadores de línea y U+FFFD. Postgres no guarda
// algunos (el jsonb de las redes rechaza el NUL: era un 500) y los demás cambiarían la dirección sin que se vea.
const NO_VAN_EN_URL = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}�]/u
export const tieneInvisibles = (texto) => NO_VAN_EN_URL.test(texto)

// Un dominio con al menos un punto y una terminación de letras (instagram.com, www.museo.gob.ar, maps.app.goo.gl),
// con puerto opcional y, después, una ruta, una consulta o un ancla sin espacios (la ruta puede tener @:
// tiktok.com/@museo). Sin esquema y sin espacios: "museo", "nombre@dominio.com" o "http://…" no lo son.
const PARECE_DOMINIO = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}(?::\d{1,5})?(?:[/?#]\S*)?$/u

/**
 * Lo que la gente pega sin el esquema ("www.instagram.com/museo", "instagram.com/museo"), con https:// adelante; lo
 * demás, tal cual (el esquema lo valida después). Lo usa el panel al salir de un campo de dirección y antes de
 * guardar; la API no lo hace (exige la dirección completa).
 * @param {string} texto
 */
export function completarHttps(texto) {
  if (typeof texto !== 'string') return texto
  const limpio = texto.trim()
  return PARECE_DOMINIO.test(limpio) ? `https://${limpio}` : texto
}

/** "HTTPS://…" o "Https://…" (así queda al pegar de un documento que puso la mayúscula), con el esquema en minúsculas. */
export const esquemaEnMinusculas = (texto) => texto.replace(/^https:\/\//i, 'https://')

/**
 * ¿Es una dirección https:// que se puede poner tal cual en un href o un src? Con un host con punto (no
 * "https://museo"), sin usuario ni contraseña, sin espacios ni comillas ni < > \ `, y sin caracteres invisibles ni de
 * control. La usan también el museo público (server/museo.js: lo que se publica) y el panel (los enlaces para probar).
 * @param {unknown} texto
 */
export function esUrlHttps(texto) {
  if (typeof texto !== 'string' || texto.length > URL_MAX) return false
  if (tieneInvisibles(texto)) return false
  if (!/^https:\/\/[^\s"'<>\\`]+$/i.test(texto)) return false
  let url
  try {
    url = new URL(texto)
  } catch {
    return false
  }
  return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password
}

/**
 * Dirección https:// (obligatoria; para una opcional, opcional(urlHttps())), con el esquema en minúsculas. Un carácter
 * invisible tiene su propio mensaje (va primero: el de https:// confundiría, porque la dirección se ve bien).
 */
export function urlHttps({ mensaje = MENSAJE_HTTPS } = {}) {
  return z
    .string({ error: mensaje })
    .trim()
    .overwrite(esquemaEnMinusculas)
    .max(URL_MAX, { error: `La dirección es demasiado larga (hasta ${URL_MAX} caracteres).` })
    .refine((v) => !tieneInvisibles(v), { error: MENSAJE_INVISIBLES })
    .refine(esUrlHttps, { error: mensaje })
}

/** Un correo que se muestra o al que se escribe (no el usuario del panel): en minúsculas, como lo guarda la tabla. */
export const correoOpcional = opcional(
  z
    .string({ error: 'Escribí un correo válido, por ejemplo nombre@dominio.com.' })
    .trim()
    .toLowerCase()
    .max(254, { error: 'El correo es demasiado largo.' })
    .email({ error: 'Escribí un correo válido, por ejemplo nombre@dominio.com.' }),
)

// esFechaValida está en compartido/fechas.js (sin zod: la usan también las fechas y horas de las actividades, E3.3).
export { esFechaValida }

/** Una fecha de calendario "AAAA-MM-DD" (lo que da un <input type="date">), opcional. */
export const fechaOpcional = opcional(
  z.string({ error: 'Elegí una fecha válida.' }).trim().refine(esFechaValida, { error: 'Elegí una fecha válida.' }),
)

/**
 * Un día y una hora de San Juan, "AAAA-MM-DDTHH:MM" (lo que da un <input type="datetime-local">), opcional. Sigue como
 * texto: el servidor lo pasa a un instante con instanteDeLocal (compartido/fechas.js) al guardarlo.
 */
export const fechaHoraOpcional = opcional(
  z
    .string({ error: 'Elegí el día y la hora.' })
    .trim()
    .refine(esFechaHoraValida, { error: 'Elegí el día y la hora (por ejemplo, 20/10/2026 18:30).' }),
)

/** Sí o no. */
export const siNo = (campo) => z.boolean({ error: `${campo} tiene que ser sí o no.` })
