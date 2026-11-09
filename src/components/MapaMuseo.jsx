import { home } from '../content.js'
import { SALAS_DEL_PLANO } from './mapaSalas.js'
import { CONTENEDOR_TABLERO, TITULO_SECCION } from './tablero.js'

// "Mapa del Museo" de la Home (tablero "Web" de la diseñadora, Figma 2629:3654, 02/11/2026): el título centrado
// (Thin 64) y, 40 más abajo, el plano de 882x811 centrado; 64 arriba y 64 abajo.
// - Decisión D15 del desarrollador (09/11/2026, reemplaza el "sin interacción" de D10): en reposo, la versión naranja
//   del tablero ("Group 3", 2996:5992) con los nombres siempre visibles en #010101 (src/assets/mapa-museo.svg); con el
//   mouse sobre una sala, esa sala como la versión bordó ("Group 4", 2999:6555: relleno #8A1812 y nombre blanco,
//   mapa-museo-hover.svg). El plano interactivo cruzado con las salas del panel sigue siendo el módulo opcional.
// - Cómo: encima del plano van 14 copias de la versión bordó, cada una recortada a su sala con un clipPath en
//   objectBoundingBox (los trazados de mapaSalas.js, en la escala de su viewBox) y transparente hasta el hover (solo
//   con puntero que hace hover: la variante hover: de Tailwind ya va en @media (hover: hover)), con un fundido de
//   200 ms que reduced-motion saca. El recorte limita también el área del puntero: fuera de la sala, la capa no lo
//   recibe. Solo CSS, sin JavaScript propio, y las 15 imágenes lazy (el SVG entero en JSX pasaba el tope de 342 kB;
//   un <use> a un sprite no es lazy sin JavaScript; un <iframe> se come la rueda y la CSP no deja un <object>).
// - Es solo visual: sin cursor de mano, sin clic, sin foco y sin rol de control. Las capas son decorativas (alt
//   vacío) y draggable en false; al imprimir no salen.
// - Los nombres del dibujo son trazados: para el lector de pantalla van además como texto, en una lista (oculta a la
//   vista) después del plano, que tiene su alt.
// - Entre lg y 1440, y debajo, el plano se achica con el ancho (nunca más ancho que el contenido); el recorte, en
//   objectBoundingBox, se achica con él.

export default function MapaMuseo() {
  const { titulo, imagen, etiqueta, espacios } = home.mapa
  return (
    <section aria-labelledby="mapa-titulo" className="py-16">
      <div className={CONTENEDOR_TABLERO}>
        <h2 id="mapa-titulo" className={`${TITULO_SECCION} text-center`}>
          {titulo}
        </h2>
        <div className="relative mx-auto mt-10 w-[min(100%,55.1728rem)]">
          <img
            src={imagen.src}
            alt={imagen.alt}
            width={imagen.ancho}
            height={imagen.alto}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="block h-auto w-full"
          />
          <svg aria-hidden="true" focusable="false" className="absolute size-0">
            <defs>
              {SALAS_DEL_PLANO.map(({ id, d }) => (
                <clipPath
                  key={id}
                  id={`mapa-${id}`}
                  clipPathUnits="objectBoundingBox"
                  transform="scale(.0011328 .0012318)"
                >
                  <path d={d} />
                </clipPath>
              ))}
            </defs>
          </svg>
          {SALAS_DEL_PLANO.map(({ id }) => (
            <img
              key={id}
              src={imagen.hover}
              alt=""
              width={imagen.ancho}
              height={imagen.alto}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              draggable={false}
              data-sala={id}
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-200 hover:opacity-100 motion-reduce:transition-none print:hidden"
              style={{ clipPath: `url(#mapa-${id})` }}
            />
          ))}
        </div>
        <ul aria-label={etiqueta} className="sr-only">
          {espacios.map((espacio) => (
            <li key={espacio}>{espacio}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
