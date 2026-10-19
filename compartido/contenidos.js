// Los contenidos que carga el museo desde el panel (plan 3.2, 5.3 y 6.1; E3.3 y E3.4): novedades, muestras y salas.
// Lo que comparten el servidor (server/api/contenido.js), el panel y, desde E4, el sitio. Código puro, sin zod ni APIs
// de Node o del DOM: los esquemas están en compartido/esquemas/contenido.js y los estados calculados en
// compartido/estados.js.
//
// - La dirección web de cada uno (el slug: /novedades/<slug>, /exposiciones/<slug>, /exposiciones#sala-<slug>) sale
//   del título: minúsculas, sin acentos, con guiones (crearSlug). En el alta, si ya está, se le agrega -2, -3…
//   (slugNumerado). Se puede cambiar hasta la primera publicación; después queda fija (los enlaces que ya circulan
//   dejarían de andar).
// - urlPublica(tipo, slug): la página pública de cada uno, relativa al sitio (plan 6.1). Las páginas llegan con E4:
//   hasta entonces PAGINAS_PUBLICAS_DE_CONTENIDO está apagada y el panel no muestra "Ver en el sitio" (E4 la prende).

/** El patrón de una dirección web (también es un CHECK de las tablas): minúsculas, números y guiones sueltos. */
export const PATRON_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** El largo de la dirección web de cada tipo (el varchar de la tabla). */
export const SLUG_MAX = Object.freeze({ novedades: 180, muestras: 180, salas: 140 })

/** Lo que se usa si el título no tiene ni una letra ni un número (solo emojis o signos). */
const SLUG_SI_VACIO = Object.freeze({ novedades: 'novedad', muestras: 'muestra', salas: 'sala' })

/**
 * ¿Ya están las páginas públicas de los contenidos (E4.2 y E4.4)? Mientras no, el panel no ofrece "Ver en el sitio":
 * la dirección daría la 404 del sitio. E4 la pone en true cuando estén las tres (novedades, muestras y salas).
 */
export const PAGINAS_PUBLICAS_DE_CONTENIDO = false

// Las letras que la descomposición de Unicode no separa de su marca (ß, æ, ø…).
const LETRAS = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ł: 'l', ı: 'i' }

/** Lo corta en max, mejor en un guion (si queda más de la mitad), y sin guion al final. */
function recortar(slug, max) {
  if (slug.length <= max) return slug
  const corte = slug.slice(0, max)
  const guion = corte.lastIndexOf('-')
  return (guion > max / 2 ? corte.slice(0, guion) : corte).replace(/-+$/, '')
}

/**
 * La dirección web a partir de un título: "Noche de los Museos 2026" -> "noche-de-los-museos-2026",
 * "Año Ñandú: ¿qué?" -> "ano-nandu-que". Vacía ("") si el título no tiene letras ni números.
 * @param {string} texto
 * @param {number} [max]
 */
export function crearSlug(texto, max = 180) {
  const limpio = String(texto ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[ßæœøđðþłı]/g, (letra) => LETRAS[letra])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return recortar(limpio, max)
}

/** La dirección de un tipo a partir del título, con la de reserva si queda vacía. */
export function slugDeTitulo(tipo, titulo) {
  return crearSlug(titulo, SLUG_MAX[tipo]) || SLUG_SI_VACIO[tipo]
}

/**
 * La base con un número al final ("noche-de-los-museos-2"), cortando la base si hace falta para no pasar de max.
 * @param {string} base
 * @param {number} n  desde 2
 * @param {number} max
 */
export function slugNumerado(base, n, max) {
  const sufijo = `-${n}`
  return `${recortar(base, max - sufijo.length)}${sufijo}`
}

/**
 * La página pública de un contenido, relativa al sitio (plan 6.1).
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {string} slug
 */
export function urlPublica(tipo, slug) {
  switch (tipo) {
    case 'novedades':
      return `/novedades/${slug}`
    case 'muestras':
      return `/exposiciones/${slug}`
    case 'salas':
      return `/exposiciones#sala-${slug}`
    default:
      throw new Error(`Tipo de contenido desconocido: ${tipo}`)
  }
}
