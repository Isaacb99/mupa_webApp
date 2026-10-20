// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases; los datos y la lógica no cambian.
//
// Las clases que comparten las páginas internas (Exposiciones, una muestra, Visitas, Novedades y una novedad) y sus
// componentes, con el lenguaje de la Home (src/index.css y las Decisiones de CLAUDE.md): el ancho del contenido
// (max-w-sitio), los títulos finos de Google Sans Flex (el h1 al tamaño del título de Obra: 61,5 px a 1440, 4,27vw),
// los párrafos en 300 a 22,5/36 (1,5625vw), las etiquetas en Roboto Mono y la paleta. Sin efectos de scroll ni
// animaciones: a lo sumo transiciones de color al pasar el puntero (con reduced-motion las apaga index.css).
// Tailwind escanea src/ entero: cada clase escrita acá (también en un comentario) entra en el CSS del sitio.
// Todo texto que carga el museo se parte si una palabra no entra (una dirección web, un correo): si no, ensanchaba la
// página en el celular (PAG-01 de la verificación de E4). Y los enlaces sueltos (los que no van dentro de un párrafo)
// miden 44 px de alto, el mínimo para el dedo (A11Y-01, la regla del panel): ENLACE_SUELTO.

/** El contenedor de cada página (como la 404). */
export const CONTENEDOR = 'mx-auto w-full max-w-sitio px-6 pt-10 pb-24 md:px-10 md:pt-16 md:pb-32 lg:pt-24'

/** El h1 de cada página. Una palabra larga se parte en vez de desbordar. */
export const TITULO_PAGINA = 'font-display text-[length:clamp(2.5rem,4.27vw,3.84375rem)] leading-[1.16] font-thin wrap-anywhere'

/** El h2 de cada sección de una página. Con la letra del navegador al 200 % en el celular, una palabra larga
 * ("Accesibilidad") no entraba: se parte, con guion si el navegador sabe (A11Y-06 de la verificación de E4). */
export const SUBTITULO =
  'font-display text-[length:clamp(1.75rem,2.6vw,2.375rem)] leading-tight font-light hyphens-auto wrap-anywhere'

/** Las etiquetas en mayúsculas (como las del pie y la 404): la situación de una muestra, "Realizada", los rótulos. */
export const ROTULO = 'font-mono text-xs font-medium tracking-[0.14em] text-muted uppercase'

/** El párrafo grande (el resumen, los textos del museo): el de la Home, 22,5/36 a 1440 en Light. */
export const PARRAFO = 'text-[length:clamp(1.125rem,1.5625vw,1.40625rem)] leading-[1.6] font-light wrap-anywhere'

/** Un enlace dentro del texto. */
export const ENLACE =
  'rounded-sm underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper'

/** Un enlace suelto (en su propio renglón o en una lista): el de ENLACE, de 44 px de alto. */
export const ENLACE_SUELTO = `${ENLACE} inline-flex min-h-11 max-w-full items-center`

/** Un enlace con forma de botón (comprar entradas, inscribirse): el recuadro naranja del menú. */
export const BOTON =
  'inline-block max-w-full rounded-md border-[1.5px] border-naranja px-5 py-3 text-[1.0625rem] leading-6 text-paper ' +
  'wrap-anywhere transition-colors hover:bg-naranja hover:text-ink focus-visible:outline-2 ' +
  'focus-visible:outline-offset-4 focus-visible:outline-paper'

/** Las listas de tarjetas (muestras, novedades): una columna en el celular, dos en tablet y tres desde lg. */
export const LISTA_TARJETAS = 'mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3'

/** El envoltorio de un texto con formato (TextoRico.jsx no trae estilos): el párrafo de la Home y aire entre bloques. */
export const TEXTO = `${PARRAFO} [&>*+*]:mt-[1em]`

/**
 * Las clases de cada elemento de un texto con formato (TextoRico.jsx): los subtítulos con aire arriba, las listas con
 * su viñeta o su número y sangría (el preflight de Tailwind se las saca) y los enlaces que se parten si son largos.
 */
export const CLASES_TEXTO = {
  h: 'pt-[0.75em] font-display text-[1.15em] leading-snug font-normal',
  ul: 'list-disc pl-[1.25em]',
  ol: 'list-decimal pl-[1.25em]',
  li: 'mt-[0.4em] pl-[0.25em]',
  a: `${ENLACE} wrap-anywhere`,
}

/** El tamaño de las fotos de las tarjetas en la grilla (LISTA_TARJETAS), para el srcset. */
export const TAMANO_TARJETA = '(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw'
