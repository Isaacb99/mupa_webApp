import { useMemo, useRef } from 'react'
import { intro, ui } from '../content.js'
import useParallaxPalabra from '../hooks/useParallaxPalabra.js'

// Titular con una palabra móvil que baja de fila en fila con el scroll:
// "un museo de sanjuaninos" -> "hecho por sanjuaninos" -> "y para sanjuaninos".
// Como en el Figma, las líneas fijas van alineadas a la derecha en la primera columna y la palabra arranca en la
// segunda, 0,375 em después (24 px a 64). En lg el titular usa las columnas del bloque de Intro (subgrid): así el
// párrafo de abajo arranca donde arranca la palabra.
// Con prefers-reduced-motion la palabra no se mueve y aparecen copias fijas en las otras filas, para que las
// tres frases se lean completas igual.

const FILA = ['row-start-1', 'row-start-2', 'row-start-3', 'row-start-4']

export default function TituloParallax({ id, className = '' }) {
  const { fijas = [], movil = '', lectura = '' } = intro.titular ?? {}
  const bloque = useRef(null)
  const palabra = useRef(null)
  const primera = useRef(null)
  const ultima = useRef(null)
  const refs = useMemo(() => ({ bloque, palabra, primera, ultima }), [])
  const activo = fijas.length > 1 && Boolean(movil)

  useParallaxPalabra(refs, { paradas: fijas.length, activo })

  if (!activo) {
    return (
      <h1 id={id} className={`${className} ${intro.titulo ? '' : 'text-muted'}`}>
        {intro.titulo || ui.pendiente}
      </h1>
    )
  }

  return (
    <h1 id={id} className={`${className} lg:grid lg:grid-cols-subgrid`}>
      {/* Lo que leen los lectores de pantalla: la frase completa, una sola vez. */}
      <span className="sr-only">{lectura || intro.titulo}</span>

      {/* En lg, subgrid: columnas y gap del bloque de Intro (gap-x normal = el del padre). */}
      <span
        ref={bloque}
        aria-hidden="true"
        className="grid grid-cols-[auto_1fr] gap-x-[0.375em] lg:col-span-2 lg:grid-cols-subgrid lg:gap-x-[normal]"
      >
        {fijas.map((linea, i) => (
          <span
            key={linea}
            ref={i === 0 ? primera : i === fijas.length - 1 ? ultima : undefined}
            className="col-start-1 text-right whitespace-nowrap"
          >
            {linea}
          </span>
        ))}
        {/* wrap-anywhere: solo si el usuario fuerza espaciado de texto (WCAG 1.4.12) y la palabra no entra, se parte en vez de desbordar. */}
        <span ref={palabra} className="col-start-2 row-start-1 wrap-anywhere">
          {movil}
        </span>
        {fijas.slice(1).map((linea, i) => (
          <span key={`copia-${linea}`} className={`hidden col-start-2 wrap-anywhere motion-reduce:block ${FILA[i + 1] ?? ''}`}>
            {movil}
          </span>
        ))}
      </span>
    </h1>
  )
}
