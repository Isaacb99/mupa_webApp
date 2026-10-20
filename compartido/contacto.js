// El formulario de contacto (E4.5, plan 8): los topes y las reglas que comparten el servidor (el esquema de
// compartido/esquemas/contacto.js y el armado del mail, server/correo.js) y el sitio (los atributos HTML del
// formulario, src/components/FormularioContacto.jsx). Código puro, sin zod: lo puede importar el bundle público (plan
// 6.2: el navegador valida con atributos HTML; la validación de verdad es la del servidor).
//
// Los errores de la validación son CÓDIGOS (ERRORES_DE_CAMPO, ERRORES_GENERALES), no textos: los textos que ve la
// persona están en src/content.js (contacto.formulario), que el servidor no puede importar (trae las imágenes).

/** Los topes de cada campo (los de la tabla mensajes_contacto, migración 06). */
export const CONTACTO = Object.freeze({
  NOMBRE_MAX: 100,
  EMAIL_MAX: 254,
  MENSAJE_MIN: 10,
  MENSAJE_MAX: 5000,
  // Como mucho tres enlaces en el mensaje: lo de más suele ser spam (plan 8).
  ENLACES_MAX: 3,
})

/** Los nombres de los campos del formulario (también los name del HTML). TRAMPA: el campo que solo llenan los robots. */
export const CAMPOS_CONTACTO = Object.freeze(['nombre', 'email', 'mensaje'])
export const TRAMPA = 'sitio_web'

/**
 * Los códigos de error de cada campo (el primero que encuentra el esquema). Los textos: src/content.js.
 * falta: vacío (un nombre sin ninguna letra ni número también); largo: pasa el tope; una_linea: el nombre trae saltos
 * de línea o caracteres de control; ilegible: caracteres que no se pudieron leer (bytes que no eran UTF-8); invalido:
 * no es un correo; corto: el mensaje tiene menos de MENSAJE_MIN caracteres; enlaces: más de ENLACES_MAX. Los
 * caracteres de control del mensaje no son un error: se acomodan (compartido/esquemas/contacto.js, CON-06 de E4).
 */
export const ERRORES_DE_CAMPO = Object.freeze({
  nombre: ['falta', 'largo', 'una_linea', 'ilegible'],
  email: ['falta', 'largo', 'invalido'],
  mensaje: ['falta', 'corto', 'largo', 'enlaces', 'ilegible'],
})

/**
 * Los errores de todo el formulario (estado.datos.error de /contacto): limite_ip (5 por hora desde la misma
 * dirección), limite_dia (50 por día entre todos), no_enviado (no se pudo guardar ni mandar: 503), no_disponible (el
 * formulario está apagado: sin casilla de envío o sin correo de destino).
 */
export const ERRORES_GENERALES = Object.freeze(['limite_ip', 'limite_dia', 'no_enviado', 'no_disponible'])

// Un enlace es lo que empieza con http://, https:// o www. (los dominios sueltos, "museo.com", no cuentan).
const ENLACE = /(?:\bhttps?:\/\/|\bwww\.)/gi

/** Cuántos enlaces tiene un texto. */
export const contarEnlaces = (texto) => (typeof texto === 'string' ? (texto.match(ENLACE) ?? []).length : 0)

// Lo que no puede quedar en una cabecera del mail: saltos de línea, caracteres de control y los separadores Unicode.
const NO_VAN_EN_UNA_LINEA = /[\p{Cc}\p{Zl}\p{Zp}]+/gu
// Los invisibles: los de formato de Unicode (\p{Cf}: el espacio de ancho cero, los que cambian la dirección del texto,
// el guion opcional…) salvo los que unen o separan letras y emojis (U+200C y U+200D), y los rellenos del hangul, que
// Unicode cuenta como letras pero se ven como un espacio.
const INVISIBLES = /(?![\u200C\u200D])\p{Cf}|[\u115F\u1160\u3164\uFFA0]/gu

/**
 * Un texto sin los caracteres invisibles: el nombre del formulario (el esquema los saca antes de validar, CON-05 de la
 * verificación de E4: uno de dirección daba vuelta lo que se ve en el asunto y en Mensajes).
 * @param {unknown} texto
 */
export const sinInvisibles = (texto) => String(texto ?? '').replace(INVISIBLES, '')

/**
 * Un texto en una sola línea, sin caracteres de control ni invisibles (el nombre en el asunto del mail): los saltos de
 * línea y los caracteres de control pasan a un espacio y los invisibles se sacan. El esquema ya rechaza o limpia un
 * nombre así; esto es la segunda red, para que nada que llegue al asunto pueda abrir otra cabecera ni darlo vuelta.
 * @param {unknown} texto
 */
export function unaLinea(texto) {
  return sinInvisibles(texto)
    .replace(NO_VAN_EN_UNA_LINEA, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
