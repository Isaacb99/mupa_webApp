import { useMemo, useRef } from 'react'
import { intro, ui } from '../content.js'
import useParallaxPalabra from '../hooks/useParallaxPalabra.js'

// Titular con una palabra móvil que baja de fila en fila con el scroll:
// "un museo de sanjuaninos" -> "hecho por sanjuaninos" -> "y para sanjuaninos".
// Como en el mockup, las líneas fijas van alineadas a la derecha en la primera columna
// y la palabra arranca en la segunda, un espacio después. En lg las columnas parten al centro.

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
    <h1 id={id} className={className}>
      {/* Lo que leen los lectores de pantalla: la frase completa, una sola vez. */}
      <span className="sr-only">{lectura || intro.titulo}</span>

      <span
        ref={bloque}
        aria-hidden="true"
        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-3"
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
        <span ref={palabra} className="col-start-2 row-start-1 whitespace-nowrap will-change-transform">
          {movil}
        </span>
      </span>
    </h1>
  )
}
