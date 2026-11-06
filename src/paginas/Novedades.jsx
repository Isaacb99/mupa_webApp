import HeroPagina from '../components/HeroPagina.jsx'
import Paginacion from '../components/Paginacion.jsx'
import { SeccionDeTarjetas } from '../components/Seccion.jsx'
import { CONTENEDOR_TABLERO } from '../components/tablero.js'
import { paginas } from '../content.js'

// /novedades (E4.4, plan 6.1): en la primera página, las próximas actividades (las publicadas que no terminaron, por
// fecha, con cuándo son); después las noticias publicadas, de la más nueva a la más vieja, de a 12 por página
// (?pagina=). Las actividades realizadas no se listan (su página sigue). Cada sección, solo si tiene algo. Las
// tarjetas llegan hechas de server/paginas.js.
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R1 a R7 del desarrollador, 04/11/2026; el tablero no
// dibuja esta página), como Visitas: el hero de las páginas internas (HeroPagina.jsx) con su foto
// (paginas.novedades.imagen de content.js) y el h1, en todas las páginas del listado (la página se declara sobreFoto);
// cada sección con el rótulo (el título de la página) y el h2, y la grilla de tarjetas (Seccion.jsx y Tarjeta.jsx); y
// la paginación (Paginacion.jsx), 64 debajo de las noticias. La paginación sale siempre que haya más de una página, como
// antes: si alguna vez no hubiera noticias en la página, va sola, en el ancho del contenido.
const t = paginas.novedades

/** @param {{ estado: { datos: { pagina?: number, paginas?: number, proximas?: object[], noticias?: object[] } } }} props */
export default function Novedades({ estado }) {
  const { pagina = 1, paginas: total = 1, proximas = [], noticias = [] } = estado.datos ?? {}
  const paginacion = total > 1 ? <Paginacion base="/novedades" pagina={pagina} paginas={total} /> : null
  return (
    <>
      <HeroPagina id="novedades-titulo" titulo={t.titulo} imagen={t.imagen} />
      {proximas.length > 0 ? <SeccionDeTarjetas id="proximas" rotulo={t.titulo} titulo={t.proximas} tarjetas={proximas} /> : null}
      {noticias.length > 0 ? (
        <SeccionDeTarjetas id="noticias" rotulo={t.titulo} titulo={t.noticias} tarjetas={noticias}>
          {paginacion}
        </SeccionDeTarjetas>
      ) : null}
      {noticias.length === 0 && paginacion ? <div className={`${CONTENEDOR_TABLERO} pb-20`}>{paginacion}</div> : null}
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Novedades.sobreFoto = true
