// Los enlaces de los textos con formato (plan 5.4): qué dirección puede llevar un enlace y cómo completar la que se
// escribe o se pega a medias. Lo usan el esquema de los textos (compartido/esquemas/textoRico.js), el editor del panel
// (para decidir qué enlaces acepta al escribir o pegar) y el sitio (src/components/TextoRico.jsx, que lo vuelve a
// mirar antes de dibujar cada enlace).
// SIN zod: el sitio público lo importa y zod no entra en su bundle (plan 6.2). Código puro, sin APIs de Node ni del
// DOM (URL es un estándar de los dos).
//
// Un enlace puede ser una página (https:// o http://), un correo (mailto:) o un teléfono (tel:), de hasta
// ENLACE_MAX caracteres. Nunca javascript:, data:, file:, una dirección relativa ni un ancla ("#…"): no se sabe a
// dónde llevarían en el sitio.

/** El largo máximo de la dirección de un enlace. */
export const ENLACE_MAX = 500

/** Lo que se le dice a la persona cuando un enlace no sirve. */
export const MENSAJE_ENLACE =
  'Un enlace tiene que llevar a una página (https://…), a un correo (nombre@dominio.com) o a un teléfono (tel:…), ' +
  `con hasta ${ENLACE_MAX} caracteres.`

// Lo que no puede ir en una dirección aunque no se vea (como en compartido/esquemas/campos.js): de control, de formato
// (el espacio de ancho cero), surrogates sueltos, separadores de línea y U+FFFD. Y lo que rompería el atributo href:
// espacios, comillas, < > \ y `.
const NO_VAN = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}\p{Zs}\uFFFD"'<>\\`]/u
const PAGINA = /^https?:\/\//i
const CORREO = /^mailto:[^@]+@[^@.]+(\.[^@.]+)+$/i
const TELEFONO = /^tel:\+?\d[\d\-.()]{2,30}$/i

/**
 * ¿Puede ir esta dirección en un enlace? (https:, http:, mailto: o tel:, hasta ENLACE_MAX caracteres, sin caracteres
 * invisibles ni espacios). Una página necesita un dominio con punto y no puede llevar usuario ni contraseña.
 * @param {unknown} href
 */
export function esEnlacePermitido(href) {
  if (typeof href !== 'string' || href.length === 0 || href.length > ENLACE_MAX) return false
  if (NO_VAN.test(href)) return false
  if (PAGINA.test(href)) {
    let url
    try {
      url = new URL(href)
    } catch {
      return false
    }
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname.includes('.') &&
      !url.username &&
      !url.password
    )
  }
  return CORREO.test(href) || TELEFONO.test(href)
}

// Un dominio con al menos un punto y una terminación de letras, con puerto, ruta, consulta o ancla opcionales (como
// completarHttps de campos.js).
const PARECE_DOMINIO = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}(?::\d{1,5})?(?:[/?#]\S*)?$/u
const PARECE_CORREO = /^[^\s@:/]+@[^\s@:/]+\.[^\s@:/]+$/
const PARECE_TELEFONO = /^\+?[\d\s\-.()]{6,30}$/

/**
 * Lo que la gente escribe o pega sin el esquema, completo: "www.museo.gob.ar/visitas" -> https://…,
 * "museo@example.com" -> mailto:…, "+54 264 000-0000" -> tel:+542640000000 (sin espacios ni separadores). El esquema
 * en minúsculas ("HTTPS://" -> "https://"). Lo demás, recortado y tal cual (después se valida con esEnlacePermitido).
 * Lo usan el panel (el diálogo del enlace, lo que se pega) y el editor; el servidor no completa nada.
 * @param {unknown} texto
 */
export function completarEnlace(texto) {
  if (typeof texto !== 'string') return texto
  const limpio = texto.trim()
  const esquema = /^(https?:\/\/|mailto:|tel:)/i.exec(limpio)
  if (esquema) {
    const resto = limpio.slice(esquema[1].length)
    const minusculas = esquema[1].toLowerCase()
    // "tel:+54 (264) 000-0000": el número, sin los espacios ni los separadores.
    return minusculas === 'tel:' && PARECE_TELEFONO.test(resto) ? telefono(resto) : minusculas + resto
  }
  if (PARECE_CORREO.test(limpio)) return `mailto:${limpio}`
  if (PARECE_TELEFONO.test(limpio) && limpio.replace(/\D/g, '').length >= 6) return telefono(limpio)
  if (PARECE_DOMINIO.test(limpio)) return `https://${limpio}`
  return limpio
}

const telefono = (numero) => `tel:${numero.trim().startsWith('+') ? '+' : ''}${numero.replace(/\D/g, '')}`
