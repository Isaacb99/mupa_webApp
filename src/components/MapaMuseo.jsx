import { home } from '../content.js'
import { CONTENEDOR_TABLERO, TITULO_SECCION } from './tablero.js'

// "Mapa del Museo" de la Home (tablero "Web" de la diseñadora, Figma 2629:3654, 02/11/2026; decisión D10 del
// desarrollador): el título centrado (Thin 64) y, 40 más abajo, el plano de 882x811 centrado; 64 arriba y 64 abajo.
// - El tablero trae el mismo plano dos veces (naranja sin nombres y bordó con nombres): va solo el bordó con los nombres
//   ("Group 4", exportado en SVG del Figma: src/assets/mapa-museo.svg). Imagen fija, sin interacción (el plano
//   interactivo, cruzado con las salas del panel, es el módulo opcional del plano).
// - Los nombres del dibujo son trazados: para el lector de pantalla van además como texto, en una lista (oculta a la
//   vista) después de la imagen, que tiene su alt.
// - lazy: está lejos del primer pantallazo. Entre lg y 1440, y debajo, se achica con el ancho (nunca más ancho que el
//   contenido).

export default function MapaMuseo() {
  const { titulo, imagen, etiqueta, espacios } = home.mapa
  return (
    <section aria-labelledby="mapa-titulo" className="py-16">
      <div className={CONTENEDOR_TABLERO}>
        <h2 id="mapa-titulo" className={`${TITULO_SECCION} text-center`}>
          {titulo}
        </h2>
        <img
          src={imagen.src}
          alt={imagen.alt}
          width={imagen.ancho}
          height={imagen.alto}
          loading="lazy"
          decoding="async"
          className="mx-auto mt-10 block h-auto w-[min(100%,55.1728rem)]"
        />
        <ul aria-label={etiqueta} className="sr-only">
          {espacios.map((espacio) => (
            <li key={espacio}>{espacio}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
