import { home, identidad } from '../content.js'
import Collage from './Collage.jsx'
import { CONTENEDOR_TABLERO, TITULO_SECCION } from './tablero.js'

// "El MuPa en imágenes" de la Home (tablero "Web" de la diseñadora, Figma 2628:2197, 02/11/2026; decisión D9 del
// desarrollador): el título centrado (Thin 64) y, 80 más abajo, el carrusel de fotos de la landing (Collage.jsx, con su
// efecto de scroll: el tablero es estático y lo dibuja quieto, como queda con reduced-motion), en la caja de 1006x628
// del tablero. Sección con 64 arriba y 64 abajo.
// Las piedritas del tablero: el mismo trazado (406x460, contorno crema #EBE3DE de 2 px, sin desvanecer), uno arriba a la
// izquierda (de x −226 a 180 y de 86 px por encima de la sección a 374 por debajo de su borde) y otro girado 180° abajo
// a la derecha (de x 1277 a 1683 y de 686 a 1146), los dos saliendo por los bordes del cuadro de 1440. Van con la
// sección, no con la caja enganchada: se ven con el título y la caja recién llegada, como en el tablero, y se van con el
// scroll mientras salen las fotos. El SVG es el del Figma (src/assets/patron-galeria.svg: el patron-a.svg de la landing
// es el mismo dibujo, pero a otra escala y con otro grosor de trazo). Medidas desde los bordes de la página, no desde el
// cuadro de 1440: así salen por los bordes igual en cualquier ancho, también más allá de 1440 (FID-03 de la
// verificación, 02/11/2026: ancladas al cuadro de 1440, a 1920 la izquierda quedaba entera y la derecha cortada 3 px).
// Decorativas (alt vacío y aria-hidden), sin puntero, solo desde lg (debajo no hay diseño: D2); overflow-x-clip en la
// sección para que no haya scroll horizontal (clip, no hidden: el bloque enganchado sigue andando).
// pegadaAlHero (PAN-03): sin el carrusel de Novedades (ninguna publicada, o la base no respondió) la galería va justo
// debajo del hero, y la piedrita de arriba, que sube 87 px por encima de la sección, quedaba cortada en seco por el
// borde del hero (que va encima, z-10). En ese caso arranca en el borde de arriba de la sección. El tablero no dibuja
// ese caso: desvío a confirmar con la diseñadora.

/** @param {{ pegadaAlHero?: boolean }} props  pegadaAlHero: va justo después del hero (sin Novedades en el medio) */
export default function GaleriaHome({ pegadaAlHero = false }) {
  const { titulo, patron } = home.galeria
  return (
    <section aria-labelledby="galeria-titulo" className="relative overflow-x-clip py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-0 lg:block">
        {/* El SVG mide 408x462 (el trazado de 406x460 más el medio trazo de cada lado): por eso 1 px antes. */}
        <img
          src={patron}
          alt=""
          width={408}
          height={462}
          loading="lazy"
          className={`absolute ${pegadaAlHero ? 'top-0' : 'top-[-5.4375rem]'} left-[-14.1875rem] w-[25.5rem] max-w-none`}
        />
        <img
          src={patron}
          alt=""
          width={408}
          height={462}
          loading="lazy"
          className="absolute top-[42.8125rem] right-[-15.25rem] w-[25.5rem] max-w-none rotate-180"
        />
      </div>
      <div className={CONTENEDOR_TABLERO}>
        <h2 id="galeria-titulo" className={`${TITULO_SECCION} text-center`}>
          {titulo}
        </h2>
      </div>
      <Collage fotos={identidad.collage} />
    </section>
  )
}
