import { TITULO_HERO } from './tablero.js'

// El hero de las páginas internas del tablero "Web" de la diseñadora (Figma: el de Visitas, nodo 2846:998, 03/11/2026;
// decisión V7 del desarrollador). Lo usa Visitas y lo van a usar El Museo, Educación, Divulgación y Circuitos, que en el
// tablero tienen el mismo (cada una con su foto y su título). Medidas a 1440:
// - 480 de alto, sin esquinas redondeadas, con la foto a sangre: cubre el hero (object-cover; cada página da su foto ya
//   recortada con el encuadre del tablero, en src/content.js, y su punto de interés, imagen.posicion: ver más abajo,
//   "más allá de 1440"). Encima, el degradé del tablero: #0e100d al 75 % arriba que llega a 0 a los 527,5 px, el
//   109,9 % del alto (la misma clase que el de la Home, HeroHome.jsx, que también llega a 0 en el 109,92 % de su
//   alto). El header va encima, absolute (Header.jsx: la página declara sobreFoto).
// - El h1 (el único de la página) centrado en una caja de 840 (x 300) que arranca a 208 px, 80 por debajo del header:
//   TITULO_HERO de tablero.js (Google Sans Flex 755 con el ancho en 130 %, como lo dice el tablero: wght 755 y wdth 130
//   leídos con use_figma; 64/72, crema, la sombra de 16 px al 25 % y un halo corto pegado a las letras). El corte de
//   un título largo va en el texto ("\n": whitespace-pre-line), como en la Home.
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
// - Debajo de lg no hay diseño (D2): el hero deja arriba el lugar del header (92 px en el celular, 108 desde md) y mide
//   20rem como mínimo (el título, de 32 px debajo de 32rem, en el medio).
// - La foto es el LCP: sin lazy y con prioridad alta (React la precarga: <link rel="preload"> al principio del HTML).
// - Colores forzados: el navegador saca los degradés (background-image) y la foto quedaría clara detrás del logo y los
//   isotipos blancos del header (que sobre una foto no se invierten: Logo.jsx); la capa del degradé lleva
//   forced-color-adjust: none, como en la Home (A11Y-05).
// - Sin bajada: en el tablero la llevan Divulgación y Circuitos (Regular 32/56, con el título a 168 en vez de 208); se
//   suma con esas páginas.

/**
 * @param {{ id: string, titulo: string, imagen: { src: string, srcSet: string, sizes: string, ancho: number,
 *   alto: number, alt: string, posicion?: string } }} props  id: el del h1 (lo nombra la sección con
 *   aria-labelledby); imagen.posicion: el punto de interés de la foto como object-position ("50% 80%"; sin él, centrada)
 */
export default function HeroPagina({ id, titulo, imagen }) {
  return (
    <section aria-labelledby={id} className="relative">
      <div className="relative min-h-[20rem] overflow-hidden lg:min-h-[30rem]">
        <img
          src={imagen.src}
          srcSet={imagen.srcSet}
          sizes={imagen.sizes}
          width={imagen.ancho}
          height={imagen.alto}
          alt={imagen.alt}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
          style={imagen.posicion ? { objectPosition: imagen.posicion } : undefined}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_109.92%)] forced-color-adjust-none"
        />
        <div className="relative mx-auto max-w-tablero px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-20 lg:pt-52">
          <div className="mx-auto lg:max-w-[52.5rem]">
            <h1 id={id} className={`${TITULO_HERO} whitespace-pre-line`}>
              {titulo}
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}
