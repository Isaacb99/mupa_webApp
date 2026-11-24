import { preload } from 'react-dom'
import { educacion, home, navegacion } from '../content.js'
import { seccionDe } from './navegacion.js'
import { TITULO_HERO } from './tablero.js'

// La portada de la Home (tablero "Web" de la diseñadora, Figma: el hero 2627:1166 y la franja de accesos 2629:2310,
// 02/11/2026; decisiones D1, D2 y D11 del desarrollador; debajo de lg, el cuadro de celular: más abajo). Medidas a 1440:
// - Hero de 655 de alto, sin esquinas redondeadas, con la foto de esqueletos a sangre: en el tablero la foto mide
//   1440x810 y queda corrida 104 px hacia arriba (cubre, con el encuadre en el 67,3 % del alto: object-position), y
//   encima el degradé del tablero (#0e100d al 75 % arriba, que llega a 0 a los 720 px, 109,92 % del alto). El header va
//   encima (absolute, Header.jsx: la página declara Home.sobreFoto).
// - El h1 (el único de la Home) y la bajada, centrados en una caja de 840 (x 300) que arranca a 208 px, 80 debajo del
//   header; 32 entre los dos. El h1 es TITULO_HERO (755 expandido, 64/72, crema, sombra de 16 px y un halo corto); la
//   bajada, Regular 32/56 crema con la misma sombra y un halo oscuro pegado a las letras (A11Y-01, ver más abajo).
// - Tamaños (A11Y-04 de la verificación, 02/11/2026, y su ronda 2): en rem y sin vw, los del tablero desde 32rem (512
//   px), como los títulos (tablero.js): crecen con el zoom y con la letra del navegador como el resto del texto, y con
//   el zoom al 200 % se ven al doble desde 1024. La caja mide 52,5rem (840) y el espacio entre el h1 y la bajada, 1em:
//   entre lg y 1440 todo mide lo que en el tablero, así los renglones de la bajada se cortan como en el tablero en
//   todos los anchos y el h1 entra siempre en la caja (a 1024 la caja ocupa 840 de los 864 del contenido). Con la letra
//   del navegador agrandada todo crece junto (rem) y los cortes no cambian.
// - El hero mide 655 COMO MÍNIMO (A11Y-02): con el espaciado de texto de WCAG 1.4.12 (o la letra agrandada) la bajada
//   ocupa más renglones y el hero crece con ella. La franja no va encima de la foto en absolute: va después, en el
//   flujo, y sube con un margen negativo de su propio alto (2,5 veces su letra: 80 a 1440) sobre el aire que el texto
//   le deja abajo (su alto más 24 px). Si la franja crece (dos renglones), empuja lo que sigue; nunca tapa la bajada.
// - La franja de accesos (D11), de 80 de alto, apoyada en el borde de abajo del hero, en el ancho del contenido (80 a
//   1360): "Planificá tu visita" (celeste) y "Recursos educativos" (naranja) ocupan lo que queda, como en el auto layout
//   del tablero (FILL), y "Tickets" (bordó) mide 200 (FIXED). Texto Regular 32/56 blanco centrado (3:1 o más sobre los
//   tres fondos: texto grande, que nunca baja de 24 px; A11Y-08: sobre el naranja da 3,3:1); el verde de "Tienda
//   virtual" no va (fuera del alcance, y 2:1). "Tickets" es la compra externa del panel (sin la compra activa no se
//   dibuja; data-entradas: la mide la analítica con origen "home") y "Recursos educativos" va porque existe la página de
//   Educación (desde el 06/11/2026; si no existiera no iría: navegacion.js) y lleva a su sección "Recursos educativos"
//   (/educacion#educacion-recursos: la ruta, la del menú, y el ancla, el id de esa sección en content.js; hasta el
//   16/11/2026 llevaba al principio de la página: T6 de la tanda 1). Si no queda ninguna, no hay franja. Foco,
//   paso del puntero: no están en el tablero; contorno blanco por dentro (las cajas van pegadas) y subrayado. Desde lg
//   el padding va en em de la letra de la franja (1em y 0,375em) y "Tickets" mide 12,5rem (200).
// - La franja nunca mide menos de lo que sube (desde lg, 5rem): con el espaciado de texto de WCAG 1.4.12
//   (interlineado de 1,5) las cajas medían 72 y quedaban 8 px de foto debajo (A11Y-02 de la verificación de la Home).
// - Con las tres cajas (la compra activa), de 1024 a 1081 px "Recursos educativos" va en dos renglones con Google
//   Sans Flex; el respaldo, más angosto, entraba en uno desde 1062, y en la primera visita la franja crecía 56 px al
//   llegar la fuente (CLS de 0,008 a 0,0095: COD-01 de la verificación de las internas). En ese tramo el corte va en
//   el texto: un salto de línea después de la primera palabra, que respeta solo de lg a 67,625rem (1082 px, donde la
//   fuente pasa a un renglón: CORTE), así los dos van en dos renglones; fuera de ese tramo el salto es un espacio. Sin
//   un <span> ni un <br>: el enlace es flex, y un elemento adentro sería un ítem aparte (y Chrome contaba como
//   corrimiento el del <span> centrado, de menos de 4 px, cuando llegaba la fuente). Debajo de lg, y con dos cajas, no
//   hace falta: no lo lleva.
// - Contraste de la bajada (A11Y-01): sobre la pared clara de la derecha de la foto, «Argentina» quedaba con un tercio
//   de sus letras por debajo de 3:1. El degradé es el del tablero (D6, no se toca): la bajada lleva, además de la
//   sombra del tablero, un halo oscuro pegado a las letras (tres sombras de 0,125, 0,25 y 0,5em, del 90 al 50 %), que
//   oscurece solo lo que está detrás del texto y sobre lo oscuro no se nota. En la ronda 1 era una sola sombra de
//   0,125em al 70 % y la re-verificación midió el fondo que se ve a 1 o 2 px de los trazos: en «Argentina», del 14 al
//   16 % de esos píxeles quedaba por debajo de 3:1; con el halo, del 0,1 al 1,2 % de 1024 a 1920 (el 10 % peor, en 3,8:1
//   o más). El h1 lleva otro, más corto (TITULO_HERO). Desvío a confirmar con la diseñadora.
// - Colores forzados (A11Y-05): el navegador saca los degradés (background-image) y la foto quedaba clara detrás del
//   logo y los isotipos blancos del header (que sobre la foto no se invierten: Logo.jsx). La capa del degradé lleva
//   forced-color-adjust: none, así sigue oscureciendo arriba.
// - La foto es el LCP: sin lazy y con prioridad alta. Va en un <picture> (debajo de 32rem, la de celular: más abajo)
//   y React no precarga sola una <img> que está dentro de uno: las dos precargas van a mano (preload de react-dom),
//   cada una con el media de su foto, así el navegador baja solo la que va a dibujar. server/ssr.js las lleva al
//   principio del <head>, y al hidratar React las encuentra ahí y no las repite.
// - El corte del h1 va en el texto ("\n"), como los títulos de la landing, y vale desde lg: con la fuente de respaldo,
//   antes de que cargue Google Sans Flex, el título entraba en un renglón y al cargar la fuente pasaba a dos (la bajada
//   se corría 72 px).
// - Debajo de lg, el hero y la franja del cuadro de celular (Figma "Web Mobile", 3106:17308 y 3108:18887, 10/11/2026;
//   decisiones M2 y M4 del desarrollador). Hay un solo HTML: lo de cada ancho lo elige el CSS.
//   - 500 de alto como mínimo, contando la barra de hoy y el header (que van encima, absolute). La caja es una columna
//     flex con el texto apoyado ABAJO, a 48 del borde, y desde lg vuelve a ser un bloque. Arriba, la reserva del marco
//     de celular (Header.jsx: 10,0625rem, los 113 del marco más 48 de aire): si el texto ocupa más (los tamaños de
//     32rem en adelante, la letra agrandada) llega hasta ahí y después crece el hero. El bloque del texto lleva el
//     ancho entero escrito: en una columna flex, centrado con márgenes automáticos, se encogería al ancho del texto.
//   - A los costados, 24 (el cuadro tiene 32: con el texto centrado se ve igual y el título corta mejor).
//   - El h1, 28/32 debajo de 32rem (TITULO_HERO), balanceado y sin el corte fijo: "Un viaje a / nuestros orígenes"
//     desde 371 px de ancho, como el cuadro (debajo, en tres renglones). La bajada, Regular 16/24 a 16 del h1 y en una
//     columna de 320: así corta en los tres renglones del cuadro («…regiones / …importantes de / Argentina») y
//     «Argentina» no llega a la parte clara de la derecha de la foto (con la columna entera iba en dos renglones y del
//     13 al 16 % del borde de sus letras quedaba bajo 4,5:1, que es lo que pide a 16 px). Medido en el relevamiento: 0 %
//     de 320 a 430 px, salvo el 0,15 % a 360 (el final de «importantes»).
//   - La foto, debajo de 32rem (512 px, donde el texto pasa a los tamaños grandes), es el recorte vertical del cuadro
//     (content.js, imagen.movil: el cráneo llenando el hero), apoyada abajo: a 402x500 entra justa, como en el cuadro.
//     Desde 32rem, la apaisada con su encuadre de siempre. Hasta el 11/11/2026 el corte iba en 30rem, y de 480 a 511
//     px la bajada de 16 px quedaba sobre la parte clara de la apaisada (VHOM-01 de la verificación). El <picture> no
//     arma caja (la <img> se acomoda como si no estuviera).
//   - La franja, apilada y de borde a borde, en cajas de 64 (32/56; debajo de 22,5rem, 360 px, la letra baja a 24,
//     porque a 32 «Recursos educativos» no entra en 320), con el orden y los colores del cuadro de celular: "Tickets"
//     en naranja primero, la visita en celeste y "Recursos educativos" en bordó ("Tienda virtual" no va: M2). El
//     orden cambia solo a la vista (en el <li> de "Tickets"): en el HTML, para el foco y para el lector de pantalla
//     sigue siendo el de escritorio. Y de 32rem a lg, lo mismo con el texto de 64 y 32, que pasa la reserva y hace
//     crecer el hero (sin cuadro: las tablets).
// - z-10: las piedritas de "El MuPa en imágenes" (GaleriaHome.jsx) suben 87 px por encima de su sección; sin el carrusel
//   de Novedades en el medio ya no suben (pegadaAlHero, PAN-03), pero si algo de la galería llegara a tocar el hero,
//   queda detrás y no encima de la franja.

// La caja de la foto: debajo de lg, 500 como mínimo y el texto abajo; desde lg, el bloque de 655.
const HERO = 'relative flex min-h-[31.25rem] flex-col justify-end overflow-hidden lg:block lg:min-h-[40.9375rem]'
// El bloque del texto: arriba, el lugar del header (debajo de lg, la reserva del marco de celular); abajo, 48 debajo de
// lg y, desde lg, el aire de la franja (su alto más 24) o 64 sin ella.
const TEXTO = 'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-12 md:px-10 lg:px-20 lg:pt-52 lg:pb-16'
const TEXTO_CON_FRANJA =
  'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-12 md:px-10 lg:px-20 lg:pt-52 lg:pb-[6.5rem]'
// La bajada: 16/24 en una columna de 320 debajo de 32rem; desde 32rem, 2rem (32) a todo el ancho de la caja, con el
// interlineado de 1,75 desde lg. De 32rem a lg (las tablets, sin cuadro) el texto va abajo, sobre la parte de la foto
// que el degradé casi no oscurece, y el halo es más fuerte (cuatro sombras, del 100 al 50 %): con el de siempre, del
// 0,15 al 0,77 % del borde de sus letras quedaba por debajo de 3:1, más que antes del celular, cuando iba arriba (del
// 0,10 al 0,39 %); con este, del 0 al 0,03 % (VHOM-02 de la verificación, 11/11/2026). Desde lg, el de siempre.
const BAJADA =
  'mx-auto mt-4 max-w-[20rem] text-center text-base leading-normal font-normal text-paper ' +
  '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1/0.9),0_0_0.25em_rgb(1_1_1/0.8),0_0_0.5em_rgb(1_1_1/0.5)] ' +
  'min-[32rem]:max-lg:[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1),0_0_0.25em_rgb(1_1_1/0.9),0_0_0.5em_rgb(1_1_1/0.7),0_0_0.75em_rgb(1_1_1/0.5)] ' +
  'min-[32rem]:mt-6 min-[32rem]:max-w-none min-[32rem]:text-[2rem] lg:mt-[1em] lg:leading-[1.75]'
// El h1, de 32rem a lg: por lo mismo, un halo un poco más fuerte que el de TITULO_HERO (a 820 y 900 px, el 0,03 % del
// borde de «orígenes» quedaba bajo 3:1; con este, nada). Debajo de 32rem y desde lg, el de TITULO_HERO.
const HALO_H1_TABLET =
  'min-[32rem]:max-lg:[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.25rem_rgb(1_1_1/0.95),0_0_0.5rem_rgb(1_1_1/0.8),0_0_0.75rem_rgb(1_1_1/0.5)]'
// La franja: 2rem (32) con el interlineado de 1,75 (56) desde 22,5rem y 1,5rem (24) debajo; debajo de lg, cajas de 64
// (el interlineado más 4 de padding arriba y abajo); desde lg, 80 de alto (el padding de 0,375em arriba y abajo).
const CAJA = 'flex min-w-0 lg:flex-1'
// "Tickets": primera a la vista debajo de lg; desde lg, en su lugar, de 200.
const CAJA_ENTRADAS = 'flex min-w-0 max-lg:order-first lg:w-[12.5rem] lg:shrink-0'
const ACCESO =
  'flex min-h-16 w-full items-center justify-center px-6 py-1 text-center font-display text-2xl leading-[1.75] ' +
  'font-normal text-blanco wrap-break-word decoration-1 underline-offset-[0.2em] hover:underline ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blanco ' +
  'min-[22.5rem]:text-[2rem] lg:min-h-20 lg:px-[1em] lg:py-[0.375em]'
// Los fondos: los del cuadro de celular debajo de lg y los del tablero desde lg ("Tickets" y "Recursos educativos" los
// tienen cruzados).
const FONDO_VISITA = 'bg-celeste'
const FONDO_ENTRADAS = 'bg-naranja lg:bg-bordo'
const FONDO_RECURSOS = 'bg-bordo lg:bg-naranja'
// El corte de "Recursos educativos" con las tres cajas (ver arriba): el salto de línea del texto vale solo de lg a
// 1081 px.
const CORTE = 'lg:whitespace-pre-line min-[67.625rem]:whitespace-normal'

/**
 * @param {{ compra: { url: string } | null }} props  compra: estado.museo.compra (solo viene si
 *   está activa)
 */
export default function HeroHome({ compra }) {
  const { titulo, bajada, imagen } = home.hero
  const visita = seccionDe('visitas')
  const recursos = seccionDe('educacion')
  const accesos = [
    visita ? { clave: 'visita', href: visita.ruta, texto: home.accesos.visita, caja: CAJA, fondo: FONDO_VISITA } : null,
    compra
      ? {
          clave: 'entradas',
          href: compra.url,
          texto: navegacion.entradas,
          caja: CAJA_ENTRADAS,
          fondo: FONDO_ENTRADAS,
          // El clic lo mide la analítica (clic_entradas, con origen "home": src/analitica.js).
          extra: { 'data-entradas': '' },
        }
      : null,
    recursos
      ? {
          clave: 'recursos',
          // A la sección "Recursos educativos" de Educación: el ancla es el id de su h2 (SeccionRecursos.jsx).
          href: `${recursos.ruta}#${educacion.recursos.id}`,
          // Con la compra (tres cajas), el salto después de la primera palabra (CORTE).
          texto: compra ? home.accesos.recursos.replace(' ', '\n') : home.accesos.recursos,
          caja: CAJA,
          fondo: FONDO_RECURSOS,
          corte: Boolean(compra),
        }
      : null,
  ].filter(Boolean)
  const conFranja = accesos.length > 0

  // Las dos precargas de la foto (ver arriba): la de celular y la apaisada, cada una con su media.
  const { movil } = imagen
  preload(movil.src, {
    as: 'image',
    imageSrcSet: movil.srcSet,
    imageSizes: movil.sizes,
    fetchPriority: 'high',
    media: movil.media,
  })
  preload(imagen.src, {
    as: 'image',
    imageSrcSet: imagen.srcSet,
    imageSizes: imagen.sizes,
    fetchPriority: 'high',
    media: imagen.mediaResto,
  })

  return (
    <section aria-labelledby="home-titulo" className="relative z-10">
      <div className={HERO}>
        <picture className="contents">
          <source media={movil.media} srcSet={movil.srcSet} sizes={movil.sizes} width={movil.ancho} height={movil.alto} />
          <img
            src={imagen.src}
            srcSet={imagen.srcSet}
            sizes={imagen.sizes}
            width={imagen.ancho}
            height={imagen.alto}
            alt={imagen.alt}
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-[50%_67.3%] max-[32rem]:object-[50%_100%]"
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_109.92%)] forced-color-adjust-none"
        />
        <div className={conFranja ? TEXTO_CON_FRANJA : TEXTO}>
          <div className="mx-auto lg:max-w-[52.5rem]">
            <h1 id="home-titulo" className={`${TITULO_HERO} ${HALO_H1_TABLET} lg:whitespace-pre-line`}>
              {titulo}
            </h1>
            <p className={BAJADA}>{bajada}</p>
          </div>
        </div>
      </div>

      {conFranja ? (
        <nav aria-label={home.accesos.etiqueta} className="relative lg:-mt-[5rem]">
          <ul className="mx-auto flex max-w-tablero flex-col lg:flex-row lg:px-20">
            {accesos.map((a) => (
              <li key={a.clave} className={a.caja}>
                <a href={a.href} {...a.extra} className={[ACCESO, a.fondo, a.corte ? CORTE : ''].filter(Boolean).join(' ')}>
                  {a.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  )
}
