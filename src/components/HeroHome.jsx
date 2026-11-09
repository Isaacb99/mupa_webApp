import { home, navegacion } from '../content.js'
import { seccionDe } from './navegacion.js'
import { TITULO_HERO } from './tablero.js'

// La portada de la Home (tablero "Web" de la diseñadora, Figma: el hero 2627:1166 y la franja de accesos 2629:2310,
// 02/11/2026; decisiones D1, D2 y D11 del desarrollador). Medidas a 1440:
// - Hero de 655 de alto, sin esquinas redondeadas, con la foto de esqueletos a sangre: en el tablero la foto mide
//   1440x810 y queda corrida 104 px hacia arriba (cubre, con el encuadre en el 67,3 % del alto: object-position), y
//   encima el degradé del tablero (#0e100d al 75 % arriba, que llega a 0 a los 720 px, 109,92 % del alto). El header va
//   encima (absolute, Header.jsx: la página declara Home.sobreFoto).
// - El h1 (el único de la Home) y la bajada, centrados en una caja de 840 (x 300) que arranca a 208 px, 80 debajo del
//   header; 32 entre los dos. El h1 es TITULO_HERO (755 expandido, 64/72, crema, sombra de 16 px y un halo corto); la
//   bajada, Regular 32/56 crema con la misma sombra y un halo oscuro pegado a las letras (A11Y-01, ver más abajo).
// - Tamaños (A11Y-04 de la verificación, 02/11/2026, y su ronda 2): en rem y sin vw, los del tablero desde 32rem (512
//   px) y más chicos solo debajo, como los títulos (tablero.js): crecen con el zoom y con la letra del navegador como
//   el resto del texto, y con el zoom al 200 % se ven al doble desde 1024. La bajada y la franja miden 2rem (32) y nunca
//   menos de 24 desde lg, el texto grande de WCAG (A11Y-08: el blanco sobre el naranja de "Recursos educativos" da
//   3,3:1 y alcanza solo en texto grande). La caja mide 52,5rem (840) y el espacio entre el h1 y la bajada, 1em: entre
//   lg y 1440 todo mide lo que en el tablero, así los renglones de la bajada se cortan como en el tablero en todos los
//   anchos y el h1 entra siempre en la caja (a 1024 la caja ocupa 840 de los 864 del contenido). Con la letra del
//   navegador agrandada todo crece junto (rem) y los cortes no cambian.
// - El hero mide 655 COMO MÍNIMO (A11Y-02): con el espaciado de texto de WCAG 1.4.12 (o la letra agrandada) la bajada
//   ocupa más renglones y el hero crece con ella. La franja no va encima de la foto en absolute: va después, en el
//   flujo, y sube con un margen negativo de su propio alto (2,5 veces su letra: 80 a 1440) sobre el aire que el texto
//   le deja abajo (su alto más 24 px). Si la franja crece (dos renglones), empuja lo que sigue; nunca tapa la bajada.
// - La franja de accesos (D11), de 80 de alto, apoyada en el borde de abajo del hero, en el ancho del contenido (80 a
//   1360): "Planificá tu visita" (celeste) y "Recursos educativos" (naranja) ocupan lo que queda, como en el auto layout
//   del tablero (FILL), y "Tickets" (bordó) mide 200 (FIXED). Texto Regular 32/56 blanco centrado (3:1 o más sobre los
//   tres fondos: texto grande); el verde de "Tienda virtual" no va (fuera del alcance, y 2:1). "Tickets" es la compra
//   externa del panel (sin la compra activa no se dibuja; data-entradas: la mide la analítica con origen "home") y
//   "Recursos educativos" va porque existe la página de Educación (desde el 06/11/2026; si no existiera no iría:
//   navegacion.js). Si no queda ninguna, no hay franja. Foco, paso del puntero: no están en el tablero; contorno blanco por dentro (las cajas van pegadas) y
//   subrayado. El padding va en em de la letra de la franja (1em y 0,375em) y "Tickets" mide 12,5rem (200).
// - La franja nunca mide menos de lo que sube (lg:min-h-20, 5rem): con el espaciado de texto de WCAG 1.4.12
//   (interlineado de 1,5) las cajas medían 72 y quedaban 8 px de foto debajo (A11Y-02 de la verificación de la Home).
// - Con las tres cajas (la compra activa), de 1024 a 1081 px "Recursos educativos" va en dos renglones con Google
//   Sans Flex; el respaldo, más angosto, entraba en uno desde 1062, y en la primera visita la franja crecía 56 px al
//   llegar la fuente (CLS de 0,008 a 0,0095: COD-01 de la verificación de las internas). En ese tramo el corte va en
//   el texto: un salto de línea después de la primera palabra, que respeta solo de lg a 67,625rem (1082 px, donde la
//   fuente pasa a un renglón: CORTE, whitespace-pre-line), así los dos van en dos renglones; fuera de ese tramo el salto
//   es un espacio. Sin un <span> ni un <br>: el enlace es flex, y un elemento adentro sería un ítem aparte (y Chrome
//   contaba como corrimiento el del <span> centrado, de menos de 4 px, cuando llegaba la fuente). Debajo de lg, y con
//   dos cajas, no hace falta: no lo lleva.
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
// - La foto es el LCP: sin lazy y con prioridad alta (React la precarga: <link rel="preload"> al principio del HTML).
// - El corte del h1 va en el texto ("\n", whitespace-pre-line, como los títulos de la landing): con la fuente de
//   respaldo, antes de que cargue Google Sans Flex, el título entraba en un renglón y al cargar la fuente pasaba a dos
//   (la bajada se corría 72 px).
// - Debajo de lg no hay diseño (D2): el hero mide lo que su texto (deja arriba el lugar del header), como mínimo 448 px
//   (así lo que sigue no se corre cuando carga la fuente y el texto ocupa otro alto), y la franja va debajo, en una
//   columna.
// - z-10: las piedritas de "El MuPa en imágenes" (GaleriaHome.jsx) suben 87 px por encima de su sección; sin el carrusel
//   de Novedades en el medio ya no suben (pegadaAlHero, PAN-03), pero si algo de la galería llegara a tocar el hero,
//   queda detrás y no encima de la franja.

// La bajada: 2rem (32) desde 32rem y 1,25rem debajo. La franja: 2rem desde 32rem y 1,5rem (24) debajo; desde lg, 80 de
// alto (2,5 veces su letra: el padding de 0,375em arriba y abajo y el interlineado de 1,75).
const CAJA = 'flex min-w-0 lg:flex-1'
const ACCESO =
  'flex min-h-16 w-full items-center justify-center px-6 py-3 text-center font-display text-2xl leading-normal ' +
  'font-normal text-blanco wrap-break-word decoration-1 underline-offset-[0.2em] hover:underline ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blanco ' +
  'min-[32rem]:text-[2rem] lg:min-h-20 lg:px-[1em] lg:py-[0.375em] lg:leading-[1.75]'
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
    visita ? { clave: 'visita', href: visita.ruta, texto: home.accesos.visita, caja: CAJA, fondo: 'bg-celeste' } : null,
    compra
      ? {
          clave: 'entradas',
          href: compra.url,
          texto: navegacion.entradas,
          caja: 'flex min-w-0 lg:w-[12.5rem] lg:shrink-0',
          fondo: 'bg-bordo',
          // El clic lo mide la analítica (clic_entradas, con origen "home": src/analitica.js).
          extra: { 'data-entradas': '' },
        }
      : null,
    recursos
      ? {
          clave: 'recursos',
          href: recursos.ruta,
          // Con la compra (tres cajas), el salto después de la primera palabra (CORTE).
          texto: compra ? home.accesos.recursos.replace(' ', '\n') : home.accesos.recursos,
          caja: CAJA,
          fondo: 'bg-naranja',
          corte: Boolean(compra),
        }
      : null,
  ].filter(Boolean)
  const conFranja = accesos.length > 0

  return (
    <section aria-labelledby="home-titulo" className="relative z-10">
      <div className="relative min-h-[28rem] overflow-hidden lg:min-h-[40.9375rem]">
        <img
          src={imagen.src}
          srcSet={imagen.srcSet}
          sizes={imagen.sizes}
          width={imagen.ancho}
          height={imagen.alto}
          alt={imagen.alt}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[50%_67.3%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_109.92%)] forced-color-adjust-none"
        />
        <div
          className={`relative mx-auto max-w-tablero px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-20 lg:pt-52 ${
            conFranja ? 'lg:pb-[6.5rem]' : 'lg:pb-16'
          }`}
        >
          <div className="mx-auto lg:max-w-[52.5rem]">
            <h1 id="home-titulo" className={`${TITULO_HERO} whitespace-pre-line`}>
              {titulo}
            </h1>
            <p className="mx-auto mt-6 max-w-none text-center text-[1.25rem] leading-normal font-normal text-paper [text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1/0.9),0_0_0.25em_rgb(1_1_1/0.8),0_0_0.5em_rgb(1_1_1/0.5)] min-[32rem]:text-[2rem] lg:mt-[1em] lg:leading-[1.75]">
              {bajada}
            </p>
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
