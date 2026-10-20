import { navegacion, noEncontrada } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden.
//
// Página 404 (estado 404 real: la arma server/ssr.js para toda ruta que no está en la tabla, y para un contenido que no
// existe o es un borrador). Va dentro de Layout (header en el flujo, menú y pie) y lleva al inicio y a las secciones del
// menú (plan 6.5). Sin efectos.
// Enlaces de 44 px de alto, el mínimo para el dedo (A11Y-01 de la verificación de E4).
const ENLACE =
  'inline-flex min-h-11 items-center rounded-sm underline decoration-paper/40 underline-offset-4 transition-colors ' +
  'hover:decoration-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper'

export default function NoEncontrada() {
  return (
    <div className="mx-auto w-full max-w-sitio px-6 pt-10 pb-24 md:px-10 md:pt-16 md:pb-32 lg:pt-24">
      <h1 className="font-display text-[length:clamp(2rem,5vw,4rem)] leading-tight font-thin hyphens-auto wrap-anywhere">{noEncontrada.titulo}</h1>
      <p className="mt-6 text-lg font-light text-muted">{noEncontrada.texto}</p>
      <p className="mt-8">
        <a href="/" className={`text-lg ${ENLACE}`}>
          {noEncontrada.volver}
        </a>
      </p>
      <nav aria-labelledby="secciones-404" className="mt-12">
        <h2 id="secciones-404" className="font-mono text-xs font-medium tracking-[0.14em] text-muted uppercase">
          {noEncontrada.secciones}
        </h2>
        <ul className="mt-2 flex flex-col text-lg font-light sm:flex-row sm:flex-wrap sm:gap-x-8">
          {navegacion.secciones.map((s) => (
            <li key={s.ruta}>
              <a href={s.ruta} className={ENLACE}>
                {s.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
