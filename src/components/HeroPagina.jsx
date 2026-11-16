import { BAJADA_HERO_PAGINA, BAJADA_HERO_PAGINA_JUSTA, TITULO_HERO_PAGINA } from './tablero.js'

// El hero de las páginas internas del tablero "Web" de la diseñadora (Figma: el de Visitas, nodo 2846:998, 03/11/2026;
// decisión V7 del desarrollador). Lo usan Visitas y, desde el 06/11/2026, Divulgación (con bajada), Educación (sin
// bajada), Circuitos (con la bajada en dos renglones) y El Museo (sin bajada), que en el tablero tienen el mismo (cada
// una con su foto y su título), y, desde el 04/11/2026 (decisión R1), Exposiciones, Novedades y Contacto, que el
// tablero no dibuja, con fotos nuestras de la selección (content.js, fotoDeHero; las fichas y la 404 van sin hero:
// tablero.js, TITULO_SIN_FOTO). Medidas a 1440:
// - 480 de alto, sin esquinas redondeadas, con la foto a sangre: cubre el hero (object-cover; cada página da su foto ya
//   recortada con el encuadre del tablero, en src/content.js, y su punto de interés, imagen.posicion: ver más abajo,
//   "más allá de 1440"). Encima, el degradé del tablero: #0e100d al 75 % arriba que llega a 0 a los 527,5 px, el
//   109,9 % del alto (el mismo que el de la Home, HeroHome.jsx, que también llega a 0 en el 109,92 % de su alto;
//   debajo de lg va el del cuadro de celular: más abajo). El header va encima, absolute (Header.jsx: la página
//   declara sobreFoto).
// - El h1 (el único de la página) centrado en una caja de 840 (x 300) que arranca a 208 px, 80 por debajo del header:
//   TITULO_HERO_PAGINA de tablero.js (Google Sans Flex 755 con el ancho en 130 %, como lo dice el tablero: wght 755 y
//   wdth 130 leídos con use_figma; 64/72, crema, la sombra de 16 px al 25 % y un halo corto pegado a las letras). Es el
//   de la Home con un paso intermedio entre 32rem y md (48 px) y guiones: con 64 desde 32rem, entre 512 y ~600 px (el
//   zoom de un escritorio) «Exposiciones» se partía por la mitad (A11Y-01 de la verificación del rediseño de las
//   internas, 05/11/2026). El corte de un título largo va en el texto ("\n": whitespace-pre-line), como en la Home.
// - El hero mide 480 COMO MÍNIMO: con el espaciado de texto de WCAG 1.4.12 o la letra agrandada, el título crece y el
//   hero con él (nada queda tapado ni cortado). Entre lg y 1440 mide lo mismo (los tamaños del tablero, como la Home) y
//   más allá de 1440 sigue a sangre con 480 de alto.
// - Más allá de 1440 la foto (3:1) es más alta que el hero y se recorta arriba y abajo. Centrada, el motivo se iba
//   para abajo con el ancho (en Visitas, la punta del pincel sobre el fósil: a 1920 quedaba contra el borde y a 2560,
//   afuera; FID-01 de la verificación, 03/11/2026). Por eso cada foto lleva su punto de interés (imagen.posicion, el
//   object-position: "50% 80%" si el motivo está al 80 % del alto): con la misma fracción en las dos coordenadas, ese
//   punto queda a la misma altura del hero en cualquier ancho (a 1440, donde la foto entra justa, no cambia nada).
//   Hasta 1440 y con el hero más alto que la foto (la letra agrandada) no hay recorte vertical: solo cuenta la x.
//   Sin posicion, centrada. Va en style (la CSP pública deja estilos en línea, como Foto.jsx).
// - Debajo de lg, el hero del cuadro de celular (el de El Museo, Figma "Web Mobile" 3123:19643, 10/11/2026; lo reciben
//   las ocho páginas, también las que todavía no tienen su versión de celular):
//   - 350 de alto como mínimo, contando la barra de hoy y el header (que van encima, absolute). La caja es una columna
//     flex y desde lg vuelve a ser un bloque. Debajo de 32rem (512 px: los teléfonos, donde el h1 mide 28/32) el texto
//     va apoyado ABAJO, a 64 del borde, como en el cuadro; desde 32rem va ARRIBA, donde estaba antes del celular: de
//     512 a 1023 (tablets, que no tienen cuadro) el título abajo, ya de 48 o 64 px, quedaba en Contacto encima de las
//     letras del cartel de la foto y en Educación contra la cara.
//     Arriba, la reserva del marco de celular (Header.jsx: 10,0625rem, los 113 del marco más 48 de aire): con el texto
//     abajo, si ocupa más (dos o tres renglones, la bajada, la letra agrandada) crece hacia arriba hasta ahí y después
//     crece el hero. El bloque del texto lleva el ancho entero escrito: en una columna flex, centrado con márgenes
//     automáticos, se encogería al ancho del texto.
//   - A los costados, 24 (el cuadro tiene 32: con el texto centrado se ve igual y los títulos cortan mejor).
//   - El h1, 28/32 debajo de 32rem, y la bajada, 16/24 (la de la Home de celular: el cuadro de El Museo no tiene; la de
//     Divulgación, además, en una columna de 320, como la de la Home, así va siempre en dos renglones: VREN-01). Debajo
//     de lg, el h1 con los respaldos de la fuente medidos para los títulos de estas páginas (tablero.js).
//   - El degradé llega a 0 a los 500 px (el 142,86 % de los 350), como en el cuadro; desde lg, el de escritorio.
//   - La foto es la misma (3:1; a 402 se ve su 38 % central), pero con el título abajo cambia qué parte queda detrás
//     del texto: la que lo necesita trae su posición de celular (imagen.posicionMovil), que va como una variable en
//     el style y una clase la usa debajo de 32rem, donde el título va abajo (con !important: le tiene que ganar al
//     object-position en línea); desde 32rem vale el punto de interés de siempre. Sin ella, el <img> es el de siempre.
// - La foto es el LCP: sin lazy y con prioridad alta (React la precarga: <link rel="preload"> al principio del HTML).
// - Colores forzados: el navegador saca los degradés (background-image) y la foto quedaría clara detrás del logo y los
//   isotipos blancos del header (que sobre una foto no se invierten: Logo.jsx); la capa del degradé lleva
//   forced-color-adjust: none, como en la Home (A11Y-05).
// - La bajada (opcional, prop bajada; desde Divulgación, 06/11/2026, DV4: Figma 2857:5440): en el tablero la llevan
//   Divulgación y Circuitos. Con bajada, a 1440, el texto arranca a 168 en vez de 208 (lg:pt-[10.5rem]), la caja del h1
//   mide 932 (58,25rem, x 254) en vez de 840 («divulgación científica» mide 870,7 px a 64 con nuestra fuente: en 840 iba
//   en tres renglones) y la bajada va 16 debajo del h1, en su caja de 840 (BAJADA_HERO_PAGINA de tablero.js: la de la
//   Home, con su halo). 168 + 144 + 16 + 56 + 64 (pb-16) = 448, dentro de los 480. Entre 1024 y 1030 px el contenido
//   mide 864 y el h1 va en tres renglones de palabras enteras («Investigación y / divulgación / científica»): se acepta
//   (DV4) y el hero crece (mide 480 como mínimo). El degradé es el común (el tablero de Divulgación lo lleva a 0 a los
//   344 px: desvío a confirmar con la diseñadora). Circuitos (Figma 2860:5939) lleva la bajada en dos renglones de
//   32/40 (prop bajadaJusta: BAJADA_HERO_PAGINA_JUSTA, la misma a todo el ancho también debajo de 32rem y con 1,25 de
//   interlineado desde lg): 168 + 144 + 16 + 80 + 64 = 472,
//   dentro de los 480; su h1 («Circuitos / paleontológicos») va en dos renglones de 1024 a 1440. Sin bajadaJusta, el
//   HTML de Divulgación es el mismo de antes.
//   Las clases van en constantes estáticas (nada pegado a una interpolación).

/**
 * La caja: debajo de lg, 350 como mínimo, con el texto abajo debajo de 32rem (el cuadro de celular) y arriba desde
 * ahí; desde lg, la de siempre (480).
 */
const HERO = 'relative flex min-h-[21.875rem] flex-col justify-end overflow-hidden min-[32rem]:justify-start lg:block lg:min-h-[30rem]'
/** La foto; con su posición de celular, la variable del style manda debajo de 32rem (con el título abajo). */
const FOTO = 'absolute inset-0 size-full object-cover'
const FOTO_CON_POSICION_MOVIL = 'absolute inset-0 size-full object-cover max-[32rem]:object-(--posicion-movil)!'
/** El degradé: el del cuadro de celular (llega a 0 en el 142,86 % del alto) y, desde lg, el de escritorio (109,92 %). */
const DEGRADE =
  'absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_142.86%)] ' +
  'lg:bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_109.92%)] forced-color-adjust-none'
/**
 * El bloque del texto: arriba, el lugar del header (debajo de lg, la reserva del marco de celular; desde lg, el h1 a
 * 208 sin bajada o a 168 con bajada); abajo, 64.
 */
const TEXTO = 'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-16 md:px-10 lg:px-20 lg:pt-52'
const TEXTO_CON_BAJADA =
  'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-16 md:px-10 lg:px-20 lg:pt-[10.5rem]'
/** La caja del h1: 840 (sin bajada) o 932 (con bajada). */
const CAJA = 'mx-auto lg:max-w-[52.5rem]'
const CAJA_CON_BAJADA = 'mx-auto lg:max-w-[58.25rem]'

/**
 * La posición de la foto: su punto de interés (object-position) y, si la trae, la de celular en una variable.
 * Sin posicionMovil, el style es el de siempre (solo object-position).
 */
function estiloDeLaFoto({ posicion, posicionMovil }) {
  if (posicionMovil) return { objectPosition: posicion, '--posicion-movil': posicionMovil }
  return posicion ? { objectPosition: posicion } : undefined
}

/**
 * @param {{ id: string, titulo: string, bajada?: string | null, bajadaJusta?: boolean, imagen: { src: string, srcSet: string,
 *   sizes: string, ancho: number, alto: number, alt: string, posicion?: string, posicionMovil?: string } }} props
 *   id: el del h1 (lo nombra la sección con aria-labelledby); bajada: el texto debajo del h1 (opcional); bajadaJusta: la
 *   bajada con el interlineado de 1,25 desde lg (Circuitos, dos renglones; sin ella, 1,75: Divulgación);
 *   imagen.posicion: el punto de interés de la foto como object-position ("50% 80%"; sin él, centrada);
 *   imagen.posicionMovil: el object-position debajo de 32rem, donde el título va abajo (sin él, el mismo)
 */
export default function HeroPagina({ id, titulo, bajada = null, bajadaJusta = false, imagen }) {
  return (
    <section aria-labelledby={id} className="relative">
      <div className={HERO}>
        <img
          src={imagen.src}
          srcSet={imagen.srcSet}
          sizes={imagen.sizes}
          width={imagen.ancho}
          height={imagen.alto}
          alt={imagen.alt}
          fetchPriority="high"
          className={imagen.posicionMovil ? FOTO_CON_POSICION_MOVIL : FOTO}
          style={estiloDeLaFoto(imagen)}
        />
        <div aria-hidden="true" className={DEGRADE} />
        <div className={bajada ? TEXTO_CON_BAJADA : TEXTO}>
          <div className={bajada ? CAJA_CON_BAJADA : CAJA}>
            <h1 id={id} className={`${TITULO_HERO_PAGINA} whitespace-pre-line`}>
              {titulo}
            </h1>
            {bajada ? <p className={bajadaJusta ? BAJADA_HERO_PAGINA_JUSTA : BAJADA_HERO_PAGINA}>{bajada}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
