import { FlechaDerecha, FlechaIzquierda } from '../components/Iconos.jsx'
import { seccionesDelSitio } from '../components/navegacion.js'
import { BAJADA, CONTENEDOR_SIN_FOTO, ENLACE_FLECHA, ROTULO_SECCION, TITULO_SIN_FOTO } from '../components/tablero.js'
import { noEncontrada } from '../content.js'

// Página 404 (estado 404 real: la arma server/ssr.js para toda ruta que no está en la tabla, y para un contenido que no
// existe o es un borrador). Va dentro de Layout (header absolute arriba, menú y pie) y lleva al inicio y a las secciones
// del sitio que existen (navegacion.js; plan 6.5). Sin efectos.
// Con el lenguaje del tablero "Web" de la diseñadora (decisión R2 del desarrollador: como las fichas de una muestra y de
// una novedad, el título sin foto; el tablero no dibuja esta página), en el bundle principal (tablero.js e Iconos.jsx
// van ahí: los usan el menú, el pie y las páginas):
// - CONTENEDOR_SIN_FOTO: el ancho del contenido del tablero (1280 a 1440) con el lugar del header arriba (el h1 queda a
//   208 de arriba a 1440, como el de los hero) y abajo el aire de una sección; la página no se declara sobreFoto.
// - El h1 de las fichas (TITULO_SIN_FOTO: el de los hero, alineado a la izquierda y sin sombra) y, 24 abajo, el texto
//   como la bajada de una sección (Regular 18/28 en gris).
// - 40 abajo, "Volver al inicio" como enlace con flecha hacia atrás (ENLACE_FLECHA y la flecha a la izquierda, como
//   "← Exposiciones" de las fichas) y, 64 abajo, la navegación "Secciones del sitio": su h2 como el rótulo de una
//   sección (Roboto Mono 14 en crema) y, 16 abajo, las secciones como enlaces con flecha, una al lado de la otra
//   desde sm (40 entre sí) y una debajo de la otra en el celular.
// Los enlaces miden 44 px de alto, el mínimo para el dedo (A11Y-01 de la verificación de E4: ENLACE_FLECHA).

export default function NoEncontrada() {
  return (
    <div className={CONTENEDOR_SIN_FOTO}>
      <h1 className={TITULO_SIN_FOTO}>{noEncontrada.titulo}</h1>
      <p className={`${BAJADA} mt-6`}>{noEncontrada.texto}</p>
      <p className="mt-10">
        <a href="/" className={ENLACE_FLECHA}>
          <FlechaIzquierda />
          {noEncontrada.volver}
        </a>
      </p>
      <nav aria-labelledby="secciones-404" className="mt-16">
        <h2 id="secciones-404" className={ROTULO_SECCION}>
          {noEncontrada.secciones}
        </h2>
        <ul className="mt-4 flex flex-col items-start sm:flex-row sm:flex-wrap sm:gap-x-10">
          {seccionesDelSitio().map((s) => (
            <li key={s.ruta}>
              <a href={s.ruta} className={ENLACE_FLECHA}>
                {s.texto}
                <FlechaDerecha />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
