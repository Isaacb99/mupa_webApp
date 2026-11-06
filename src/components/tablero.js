// Las clases del sistema visual del tablero "Web" de la diseñadora (Figma RTR7HNiAkskn8YrPd8mDf7, 02/11/2026; solo
// escritorio, a 1440): las comparten el header, el pie, la Home nueva y las páginas que vayan tomando el diseño (desde
// el 03/11/2026, Visitas; desde el 04/11/2026, Exposiciones, Novedades y las fichas de una muestra y de una novedad, y
// desde el 05/11/2026 Contacto y la 404, que el tablero no dibuja y toman su lenguaje: decisiones R1 a R7 del
// desarrollador, más abajo; desde el 06/11/2026, Divulgación: DV1 a DV10). Desde entonces ninguna página usa las de
// estilos.js (las usan solo componentes que quedaron sin uso: se decide al cierre, D1).
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
 * El h1 de las páginas internas tiene un paso más, entre 32rem y md (TITULO_HERO_PAGINA y TITULO_SIN_FOTO, más abajo).
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
 * ("Paleontológicos", 10,3 em: 657 px a 64) no entra entre 32rem y ~705 px y se parte (wrap-break-word): el hero que la
 * tenga tiene que achicar el h1 en ese tramo, como el de las páginas internas (TITULO_HERO_PAGINA, que "Exposiciones"
 * necesita); este, sin el paso intermedio, es el de la Home. La familia es font-hero: Google Sans Flex con respaldos
 * del mismo ancho (src/index.css), así los renglones centrados no se corren cuando llega la fuente (COD-02).
 * text-wrap: wrap (y no el balance que index.css les pone a los títulos): los renglones se cortan como en el tablero
 * ("Un viaje a nuestros / orígenes"); balanceado quedaba "Un viaje a / nuestros orígenes" (medido en la Home, 02/11/2026).
 */
export const TITULO_HERO =
  'font-hero text-[2rem] leading-[1.125] font-[weight:755] [font-stretch:130%] min-[32rem]:text-[4rem] ' +
  'text-center text-paper text-wrap wrap-break-word ' +
  '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.0625em_rgb(1_1_1/0.9),0_0_0.125em_rgb(1_1_1/0.7)]'

/*
 * Los tamaños del h1 de las páginas internas (el de su hero, TITULO_HERO_PAGINA, y el de una página sin hero,
 * TITULO_SIN_FOTO): 64/72 desde md (48rem, 768 px), como el tablero; 48 entre 32rem y md; 30 debajo de 32rem. En rem
 * y sin vw (A11Y-04 de la verificación de la Home): crecen con el zoom y con la letra del navegador. Hasta la
 * corrección del rediseño de las internas (A11Y-01 de su verificación, 05/11/2026) pasaban de 32 a 64 en 32rem, como
 * el de la Home, y entre 512 y ~770 px (el zoom del 150 al 250 % en un escritorio) una palabra larga no entraba en el
 * renglón y se partía por la mitad: «Exposicione / s» y «encontram / os» (la 404) entre 512 y ~600 px,
 * «paleontológicos» hasta 767, y a 320 px, con 32, «encontramo / s». Medido en esta letra (755 con el ancho en 130 %):
 * «Exposiciones» mide 8,32 em, «encontramos» 8,54, «paleontológicos» 10,27 e «ischigualastensis» 10,92. Con estos
 * tamaños, las de los títulos fijos (los de los hero y el de la 404) entran desde 304 px, y «paleontológicos» desde 541
 * (a 48) y desde 768 (a 64). Lo que no entra igual (un nombre científico largo en el título de una ficha) se parte con
 * guion donde el navegador sabe partir en castellano (hyphens-auto). A cambio, con el zoom al 200 % un escritorio de
 * 1024 a 1535 px ve el h1 a 1,5 veces (48 en vez de 64; desde 1536, al doble). El de la Home (TITULO_HERO) no cambió:
 * sus palabras («nuestros», «orígenes»: 5,7 em) entran desde 32rem.
 */

/**
 * El h1 del hero de una página interna (HeroPagina.jsx: Visitas, Divulgación, Exposiciones, Novedades y Contacto; las
 * que vengan, del tablero): TITULO_HERO con los tamaños de las internas (ver arriba) y con guiones donde el navegador
 * sabe partir.
 * Los guiones, con al menos 5 letras a cada lado ([hyphenate-limit-chars:auto_5_5], desde Divulgación, 06/11/2026,
 * DV4): un navegador con el diccionario de castellano (Firefox y Safari lo traen; Chrome lo baja aparte) parte con guion
 * la palabra que no entra en el renglón aunque entre entera en el siguiente, y en los anchos donde «Investigación y
 * divulgación científica» va en tres renglones (de 1024 a 1030 px, y debajo de lg) salía «divulgación cien- / tífica».
 * Con 5 y 5, «científica» no tiene dónde partirse y «divulgación» (que siempre empieza renglón y entra entera desde
 * ~270 px) tampoco se parte; las palabras que de verdad no entran se siguen partiendo («Exposi-ciones»,
 * «Paleon-tológicos»: A11Y-01 del rediseño). Lo soportan Chrome desde la 109 y Firefox desde la 137; Safari no (corta
 * con sus reglas). TITULO_SIN_FOTO (el título de una ficha, que carga el museo) no lo lleva.
 */
export const TITULO_HERO_PAGINA =
  'font-hero text-[1.875rem] leading-[1.125] font-[weight:755] [font-stretch:130%] min-[32rem]:text-[3rem] ' +
  'md:text-[4rem] text-center text-paper text-wrap hyphens-auto [hyphenate-limit-chars:auto_5_5] wrap-break-word ' +
  '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.0625em_rgb(1_1_1/0.9),0_0_0.125em_rgb(1_1_1/0.7)]'

/**
 * La bajada debajo del h1 del hero de una página interna (HeroPagina.jsx, prop bajada: Divulgación, y después
 * Circuitos; Figma 2857:5749, 06/11/2026): la de la Home (HeroHome.jsx, que la tiene escrita ahí y no cambia), Regular
 * 32/56 crema y centrada desde lg (32/48 entre 32rem y lg, 20/30 debajo), con la sombra del tablero y el halo oscuro
 * pegado a las letras de la Home (A11Y-01: tres sombras de 0,125, 0,25 y 0,5 em; el tablero tiene solo la de 16 px). A
 * 16 del h1 (en la Home, a 32) y en una caja de 840 (la del h1, con bajada, mide 932). Circuitos la tiene en 32/40
 * (Figma 2860:5939, dos renglones): BAJADA_HERO_PAGINA_JUSTA, la misma con el interlineado de 1,25 desde lg (HeroPagina,
 * prop bajadaJusta). Debajo de lg las dos van en leading-normal (sin diseño, D2). La base va aparte para no repetir la
 * cadena: BAJADA_HERO_PAGINA es, carácter por carácter, la de antes de Circuitos.
 */
const BAJADA_HERO_BASE =
  'mx-auto mt-4 max-w-none text-center text-[1.25rem] leading-normal font-normal text-paper ' +
  '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1/0.9),0_0_0.25em_rgb(1_1_1/0.8),0_0_0.5em_rgb(1_1_1/0.5)] ' +
  'min-[32rem]:text-[2rem] lg:max-w-[52.5rem]'
/** Divulgación: 32/56 desde lg, en un renglón. */
export const BAJADA_HERO_PAGINA = BAJADA_HERO_BASE + ' lg:leading-[1.75]'
/** Circuitos: 32/40 desde lg, en dos renglones. */
export const BAJADA_HERO_PAGINA_JUSTA = BAJADA_HERO_BASE + ' lg:leading-[1.25]'

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
 * Lleva un borde transparente de 1 px (descontado del padding: 19 y 7, así mide lo mismo y se ve igual, con el naranja
 * debajo del borde): con colores forzados el navegador cambia el fondo naranja por el de la página y pinta los bordes
 * con el color del sistema, así que sin borde "Enviar", "Inscribirse" y "Tickets" quedaban como texto suelto
 * (A11Y-02 de la verificación del rediseño de las internas, 05/11/2026).
 */
export const BOTON_NARANJA =
  'inline-flex min-h-11 items-center justify-center rounded-[0.25rem] border border-transparent bg-naranja ' +
  'px-[1.1875rem] py-[0.4375rem] text-center font-mono text-sm leading-7 font-normal text-ink decoration-1 ' +
  'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-blanco'

/*
 * Las tarjetas con ícono (Visitas: Dirección, Horarios y Contacto, y los cuatro recursos de "Museo accesible"; desde el
 * 06/11/2026 las tres de "NEWSLETTER" de Divulgación, con el ícono en naranja; en el tablero también los recursos de
 * Educación). El tablero les pone el fondo de la página (#010101): no se
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
 * bloques, como los párrafos del tablero; CLASES_TEXTO_TABLERO, lo de cada elemento. El tablero dibuja una columna de
 * texto así en Circuitos (Figma 2860:5987, leído el 05/11/2026): un párrafo, 24 abajo una lista y, entre párrafos, el
 * subtítulo «Conexión MuPa», con 24 arriba y abajo. De ahí:
 * - el subtítulo: Google Sans Flex Thin 40/52 (el h3 del tablero dentro de una sección, como TITULO_SUBSECCION; 28/36
 *   debajo de 32rem). En las salas de Exposiciones, cuyo nombre ya va así, los subtítulos de la descripción van un
 *   nivel más chicos (Exposiciones.jsx);
 * - la lista con viñetas: cada ítem Regular 16/24, la viñeta un círculo crema de 6 px (radio 3) centrado en el renglón
 *   y 12 antes del texto, y 12 entre ítems. La numerada (el tablero no tiene) va con el mismo texto, su número y la
 *   sangría de siempre;
 * - los enlaces no están en el tablero: subrayados, como los demás enlaces dentro de un texto del sitio (desvío a
 *   confirmar con la diseñadora).
 * Hasta la corrección del rediseño de las internas (EST-05 de su verificación, 05/11/2026) los subtítulos iban en
 * Medium 20/28 y los ítems en 18/30 con la viñeta del navegador.
 */
export const TEXTO_TABLERO = 'text-lg leading-[1.875rem] font-normal text-paper wrap-break-word text-pretty [&>*+*]:mt-6'
export const CLASES_TEXTO_TABLERO = {
  h:
    'font-titulo text-[1.75rem] leading-9 font-thin min-[32rem]:text-[2.5rem] min-[32rem]:leading-[3.25rem]',
  ul:
    '[&>li]:relative [&>li]:pl-[1.125rem] [&>li]:before:absolute [&>li]:before:top-[0.5625rem] [&>li]:before:left-0 ' +
    '[&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-paper',
  ol: 'list-decimal pl-[1.25em] [&>li]:pl-[0.25em]',
  li: 'mt-3 text-base leading-6',
  a:
    'rounded-sm underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper ' +
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper wrap-anywhere',
}

/*
 * Las páginas que el tablero no dibuja (Exposiciones, una muestra, Novedades, una novedad, Contacto y la 404) toman su
 * lenguaje tal como está hecho en la Home y en Visitas (decisiones R1 a R7 del desarrollador, 04/11/2026). Lo que el
 * tablero no define va con lo mínimo de su lenguaje y está anotado como desvío a confirmar con la diseñadora.
 */

/**
 * El contenedor de una página sin hero (las fichas de una muestra y de una novedad, y la 404; R2): el de las secciones
 * (CONTENEDOR_TABLERO) con el lugar del header arriba (Header.jsx: 92 px en el celular, 108 desde md y 128 desde lg)
 * más el aire que el tablero deja entre el header y el título de sus hero (36, 52 y 80: lo primero queda a 208 de
 * arriba a 1440, como el h1 de HeroPagina.jsx), y abajo el aire de una sección (SECCION_TABLERO).
 */
export const CONTENEDOR_SIN_FOTO = `${CONTENEDOR_TABLERO} pt-32 pb-16 md:pt-40 lg:pt-52 lg:pb-20`

/**
 * El h1 de una página sin hero (R2): el de los hero de las internas (TITULO_HERO_PAGINA: Google Sans Flex 755 con el
 * ancho en 130 %, 64/72 desde md, 48 desde 32rem y 30 debajo, crema, con sus respaldos del mismo ancho), alineado a la
 * izquierda y sin la sombra ni el halo (no hay foto detrás). Lo carga el museo (el título de una muestra o de una
 * novedad): una palabra que no entra se parte, con guion si el navegador sabe partir en castellano. El tablero no tiene
 * páginas sin hero: desvío a confirmar.
 */
export const TITULO_SIN_FOTO =
  'font-hero text-[1.875rem] leading-[1.125] font-[weight:755] [font-stretch:130%] text-paper hyphens-auto wrap-anywhere ' +
  'min-[32rem]:text-[3rem] md:text-[4rem]'

/**
 * El h3 dentro de una sección ("Valores" y "Conexión MuPa" en el tablero; acá, el nombre de cada sala de Exposiciones):
 * Google Sans Flex Thin 40/52 desde 32rem; debajo, 28/36. Lo carga el museo: se parte si una palabra no entra.
 */
export const TITULO_SUBSECCION =
  'font-titulo text-[1.75rem] leading-9 font-thin text-paper wrap-anywhere min-[32rem]:text-[2.5rem] ' +
  'min-[32rem]:leading-[3.25rem]'

/**
 * Un párrafo destacado (el resumen de una muestra o de una novedad en su página): Regular 20/32 en crema, el tamaño de
 * los textos de Misión y Visión del tablero.
 */
export const PARRAFO_GRANDE = 'text-xl leading-8 font-normal text-paper wrap-anywhere text-pretty'

/*
 * Las tarjetas de una muestra o de una novedad en una grilla (Tarjeta.jsx: Exposiciones y Novedades), con el lenguaje de
 * la del carrusel de Novedades de la Home (CarruselNovedades.jsx, que tiene las mismas clases escritas ahí): la portada
 * con esquinas de 12 en la proporción del tablero (485x355), el título en Roboto Mono Medium 24/32 en mayúsculas (20/28
 * debajo de 32rem) y el resumen en 16,5/27, en crema y en una columna del 86,4 % de la tarjeta. Además llevan lo que
 * mostraban antes (R4): la etiqueta (la situación de una muestra) como el rótulo de una tarjeta (ROTULO_TARJETA) y la
 * fecha o el período en gris, Regular 16/26 (el tablero no muestra la fecha ni el tipo: desvío a confirmar). Sin "leer
 * más": lo único nuevo que se dibuja en estas páginas son las fotos de los hero (R3). Lo que carga el museo se parte.
 */
export const TITULO_TARJETA =
  'max-w-[86.4%] font-mono text-xl leading-7 font-medium text-paper uppercase wrap-anywhere ' +
  'min-[32rem]:text-2xl min-[32rem]:leading-8'
/** El enlace del título, estirado sobre toda la tarjeta (after:absolute); foco: el contorno blanco, como el carrusel. */
export const ENLACE_TARJETA =
  'rounded-sm decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco'
export const DETALLE_TARJETA = 'text-base leading-[1.625rem] font-normal text-muted'
export const RESUMEN_TARJETA =
  'max-w-[86.4%] text-[1.03125rem] leading-[1.6875rem] font-normal text-paper wrap-anywhere'
export const FOTO_TARJETA = 'aspect-[485/355] w-full rounded-xl object-cover'

/**
 * La grilla de tarjetas: 48 debajo del encabezado de la sección ("del encabezado al contenido: 48"), tres columnas de
 * 400 con 40 entre sí a 1440 (como las tarjetas de información de Visitas) y 64 entre filas; entre lg y xl (1024 a 1279)
 * y desde md, dos; en el celular, una.
 */
export const LISTA_TARJETAS_TABLERO = 'mt-12 grid gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3'

/** El tamaño de la portada en esa grilla, para el srcset de Foto.jsx: el ancho de la columna en cada tramo. */
export const TAMANO_TARJETA_TABLERO =
  '(min-width: 90rem) 400px, (min-width: 80rem) calc((100vw - 15rem) / 3), (min-width: 64rem) calc((100vw - 12.5rem) / 2), ' +
  '(min-width: 48rem) calc((100vw - 7.5rem) / 2), calc(100vw - 3rem)'
