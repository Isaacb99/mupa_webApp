import Foto from './Foto.jsx'

// La galería de una muestra o de una novedad (Ficha.jsx), con el lenguaje del tablero "Web" de la diseñadora (decisión
// R4 del desarrollador, 04/11/2026; el tablero no tiene galerías): las fotos en su orden, en columnas (una en el
// celular, dos desde sm y tres desde lg, con 40 entre sí, como las tarjetas de 400 de Visitas), cada una con su
// proporción (sin recortar), las esquinas de 16 de las fotos del tablero y su epígrafe y su crédito (Foto.jsx). 48
// debajo del h2 de su sección. Todas lazy (Foto.jsx): están debajo del texto, nunca en el primer pantallazo. Sin visor
// ni efectos.

/** El tamaño de cada foto, para el srcset: el ancho de su columna en cada tramo (400 a 1440 y más). */
const TAMANO =
  '(min-width: 90rem) 400px, (min-width: 64rem) calc((100vw - 15rem) / 3), (min-width: 40rem) calc((100vw - 5.5rem) / 2), ' +
  'calc(100vw - 3rem)'

/** @param {{ fotos: object[] }} props  las fotos con sus campos públicos (Foto.jsx) */
export default function GaleriaFotos({ fotos }) {
  return (
    <ul className="mt-12 columns-1 gap-10 sm:columns-2 lg:columns-3">
      {fotos.map((foto) => (
        <li key={foto.clave} className="mb-10 break-inside-avoid">
          <Foto foto={foto} conPie sizes={TAMANO} className="h-auto w-full rounded-2xl" />
        </li>
      ))}
    </ul>
  )
}
