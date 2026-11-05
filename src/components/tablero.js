// Las clases del sistema visual del tablero "Web" de la diseñadora (Figma RTR7HNiAkskn8YrPd8mDf7, 02/11/2026; solo
// escritorio, a 1440): las comparten el header, el pie, la Home nueva y las páginas que vayan tomando el diseño (desde
// el 03/11/2026, Visitas). Las de estilos.js siguen siendo las de las páginas que todavía no lo tienen (Exposiciones,
// Novedades, Contacto, las fichas y la 404), hasta su etapa.
// Medidas del tablero a 1440, con los tokens de src/index.css (max-w-tablero, ink #010101, paper #eae2df, blanco, muted
// #88858e, naranja #eb622d): contenido de 1280 con 80 de margen, 80 de aire arriba y abajo de cada sección, títulos
// Google Sans Flex Thin 64/79,5, párrafos Regular 18/30 (no hay Light 300 ni espaciado entre letras en el tablero),
// rótulos y enlaces en Roboto Mono. Debajo de lg no hay diseño (decisión D2): se achica lo justo para que nada desborde.
// Tailwind escanea src/ entero: cada clase escrita acá (también en un comentario) entra en el CSS del sitio.

/** El contenedor de una sección: 1280 de contenido a 1440 (80 de margen) y centrado más allá; debajo de lg, 24 o 40. */
export const CONTENEDOR_TABLERO = 'mx-auto w-full max-w-tablero px-6 md:px-10 lg:px-20'

/** El aire de una sección: 80 arriba y abajo a 1440, así quedan 160 entre una y otra. */
export const SECCION_TABLERO = 'py-16 lg:py-20'

/**
 * El rótulo de una sección, arriba del h2 (Roboto Mono Medium 14/20, mayúsculas, crema, sin espaciado entre letras).
 * Va en un <p>: no es un encabezado.
 */
export const ROTULO_SECCION = 'font-mono text-sm leading-5 font-medium text-paper uppercase'

/** El rótulo de una tarjeta ("Dirección", "Director"): Roboto Mono Medium 12/16, mayúsculas, crema. */
export const ROTULO_TARJETA = 'font-mono text-xs leading-4 font-medium text-paper uppercase'

/*
 * Los tamaños de los títulos y de los textos grandes del tablero (TITULO_SECCION, TITULO_HERO, la bajada y la franja del
 * hero de la Home, el título de las tarjetas de Novedades) van en rem y sin vw: los del tablero desde 32rem (512 px) y
 * más chicos solo debajo (el celular, sin diseño: D2). Así crecen con el zoom y con la letra del navegador como el
 * resto del texto, y con el zoom al 200 % se ven al doble en cualquier escritorio desde 1024 (con 200 % una ventana de
 * 1024 a 1440 mide de 512 a 720 px CSS: ya es el diseño de debajo de lg, que desde 512 tiene los tamaños del tablero).
 * Hasta la ronda 2 de la corrección (A11Y-04 de la verificación, 02/11/2026) se achicaban con el ancho entre lg y 1440
 * (1rem + 3,33vw: el h1 en 50 a 1024) y con el zoom al 200 % el h1 crecía ×1,25. Con los tamaños fijos, entre lg y 1440
 * todo mide lo que en el tablero y los renglones se cortan igual (la caja del hero también es fija: HeroHome.jsx).
 */

/**
 * El h2 de una sección: Google Sans Flex Thin 64 con interlineado 79,5 (1,24), en crema, desde 32rem; debajo, 36 px.
 * Una palabra que no entra se parte (con guion si el navegador sabe partir en castellano). La familia es font-titulo:
 * Google Sans Flex con respaldos del mismo ancho en Thin (src/index.css), así un título centrado no se corre cuando
 * llega la fuente (COD-02).
 */
export const TITULO_SECCION =
  'font-titulo text-[2.25rem] leading-[1.24] font-thin text-paper hyphens-auto wrap-break-word min-[32rem]:text-[4rem]'

/**
 * El h1 sobre la foto de un hero ("Un viaje a nuestros orígenes", "Acerca del MuPa"): Google Sans Flex 755 a 64/72,
 * crema, centrado, con la sombra de 16 px al 25 % del tablero y, pegado a las letras, un halo oscuro corto (0,0625 y
 * 0,125em, al 90 y al 70 %: sobre lo oscuro no se nota), desde 32rem; debajo, 32 px. El halo no está en el tablero
 * (desvío a confirmar con la diseñadora, como el de la bajada de la Home: A11Y-01): sobre la parte clara de la foto
 * de la Home, del 2 al 7 % del fondo que se ve a 1 o 2 px de los trazos de «orígenes» quedaba por debajo de 3:1, y con
 * él, nada; los hero de las otras páginas del tablero tienen fotos más claras detrás del título. Se ve expandido como
 * "sanjuaninos" de la landing (el eje de ancho en 130 %: get_design_context de Figma informa 100, y el valor real se
 * lee con use_figma, como en HeroPagina.jsx; medir los cortes de línea contra el tablero al usarlo). Una palabra larga
 * ("Paleontológicos", ~11 em: 704 px a 64) no entra entre 32rem y ~780 px y se parte (wrap-break-word): el hero que la
 * tenga tiene que achicar el h1 en ese tramo. La familia es font-hero: Google Sans Flex con respaldos del mismo ancho
 * (src/index.css), así los renglones centrados no se corren cuando llega la fuente (COD-02).
 * text-wrap: wrap (y no el balance que index.css les pone a los títulos): los renglones se cortan como en el tablero
 * ("Un viaje a nuestros / orígenes"); balanceado quedaba "Un viaje a / nuestros orígenes" (medido en la Home, 02/11/2026).
 */
export const TITULO_HERO =
  'font-hero text-[2rem] leading-[1.125] font-[weight:755] [font-stretch:130%] min-[32rem]:text-[4rem] ' +
  'text-center text-paper text-wrap wrap-break-word ' +
  '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.0625em_rgb(1_1_1/0.9),0_0_0.125em_rgb(1_1_1/0.7)]'

/*
 * Los párrafos llevan text-wrap: pretty (text-pretty): el navegador evita que el último renglón quede con una sola
 * palabra. Con los anchos del tablero los cortes son los mismos que en Figma (a 1440 y a 1280 coinciden renglón por
 * renglón); entre lg y 1440 la columna se angosta y, sin él, a 1366 y a 1024 los párrafos de "Museo accesible"
 * terminaban con «(LSA).» o «discapacidad.» solas (FID-02 de la verificación de Visitas, 03/11/2026). Donde el
 * navegador no lo conoce, corta como siempre.
 */

/** El párrafo: Google Sans Flex Regular 18/30, en crema. Lo que carga el museo se parte si una palabra no entra. */
export const PARRAFO_TABLERO = 'text-lg leading-[1.875rem] font-normal text-paper wrap-break-word text-pretty'

/** El párrafo secundario: el mismo, en gris. */
export const PARRAFO_SECUNDARIO = 'text-lg leading-[1.875rem] font-normal text-muted wrap-break-word text-pretty'

/** La bajada de una sección, debajo del h2: Regular 18/28 en gris. */
export const BAJADA = 'text-lg leading-7 font-normal text-muted'

/**
 * El enlace con flecha ("Ver todas las novedades" con la flecha en diagonal, Iconos.jsx): Roboto Mono Regular
 * 16/28,8 en blanco, el ícono de 20 a 8 px del texto. El tablero lo dibuja de 29 px de alto: el área llega a 44 (el
 * mínimo para el dedo) sin mover el texto. Foco y paso del puntero no están diseñados: contorno blanco y subrayado.
 */
export const ENLACE_FLECHA =
  'inline-flex min-h-11 items-center gap-2 rounded-sm font-mono text-base leading-[1.8] text-blanco ' +
  'decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-blanco'

/**
 * El botón naranja (el de entradas del header): Roboto Mono Regular 14/28 sobre #eb622d, radio 4, 20 de padding a los
 * costados, 44 de alto. El texto va en #010101 y no en blanco como en el tablero: blanco a 14 px da 3,3:1 (no llega a
 * AA) y negro, 6,3:1 (decisión D4, a confirmar con la diseñadora).
 */
export const BOTON_NARANJA =
  'inline-flex min-h-11 items-center justify-center rounded-[0.25rem] bg-naranja px-5 py-2 text-center font-mono ' +
  'text-sm leading-7 font-normal text-ink decoration-1 underline-offset-4 hover:underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco'

/*
 * Las tarjetas con ícono (Visitas: Dirección, Horarios y Contacto, y los cuatro recursos de "Museo accesible"; en el
 * tablero también los recursos de Educación y Divulgación). El tablero les pone el fondo de la página (#010101): no se
 * ven como caja, solo queda su padding (40, y 32 en las de accesibilidad), que corre el texto respecto del título. Lo
 * de adentro: el ícono en su cuadrado, el rótulo (ROTULO_TARJETA) y el texto en gris.
 */

/**
 * El cuadrado del ícono: 48x48 en #1a1a1a (bg-caja, src/index.css) con esquinas de 12 y el ícono de 24 en crema,
 * centrado (IconosTarjetas.jsx, con aria-hidden).
 */
export const ICONO_TARJETA = 'flex size-12 shrink-0 items-center justify-center rounded-xl bg-caja text-paper'

/**
 * El texto de una tarjeta de información (Dirección, Horarios, Contacto): Regular 18/28 en gris. Es lo que carga el
 * museo: se parte si una palabra no entra (una dirección, un correo).
 */
export const DATO_TARJETA = 'text-lg leading-7 font-normal text-muted wrap-anywhere'

/** El texto de una tarjeta de recursos (los de "Museo accesible"): Regular 16/26 en gris. */
export const TEXTO_TARJETA = 'text-base leading-[1.625rem] font-normal text-muted wrap-break-word'

/**
 * Un dato que es un enlace (el teléfono con tel:, el correo con mailto:) en el texto de una tarjeta: el mismo texto,
 * subrayado, de 44 px de alto (el mínimo para el dedo). El paso del puntero y el foco no están en el tablero: crema y
 * el contorno, como los demás enlaces del sitio.
 */
export const ENLACE_DATO =
  'inline-flex min-h-11 max-w-full items-center rounded-sm underline decoration-paper/40 underline-offset-4 ' +
  'transition-colors hover:text-paper hover:decoration-paper focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-paper'

/**
 * Un texto con formato del panel (TextoRico.jsx, que no trae estilos) con el lenguaje del tablero: el envoltorio lleva
 * el párrafo (Regular 18/30 en crema, con text-pretty como los párrafos de arriba: text-wrap se hereda) y 24 entre
 * bloques, como los párrafos del tablero; CLASES_TEXTO_TABLERO, lo de cada elemento. El tablero no dibuja subtítulos,
 * listas ni enlaces dentro de un texto: los subtítulos van como el título de una tarjeta del tablero (Medium 20/28), las
 * listas con su viñeta o su número y 12 entre ítems, y los enlaces subrayados (desvío a confirmar con la diseñadora).
 */
export const TEXTO_TABLERO = 'text-lg leading-[1.875rem] font-normal text-paper wrap-break-word text-pretty [&>*+*]:mt-6'
export const CLASES_TEXTO_TABLERO = {
  h: 'pt-2 text-xl leading-7 font-medium',
  ul: 'list-disc pl-[1.25em]',
  ol: 'list-decimal pl-[1.25em]',
  li: 'mt-3 pl-[0.25em]',
  a:
    'rounded-sm underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper ' +
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper wrap-anywhere',
}
