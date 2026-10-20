import Paginacion from '../components/Paginacion.jsx'
import { SeccionDeTarjetas } from '../components/Seccion.jsx'
import { CONTENEDOR, TITULO_PAGINA } from '../components/estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// /novedades (E4.4, plan 6.1): en la primera página, las próximas actividades (las publicadas que no terminaron, por
// fecha, con cuándo son); después las noticias publicadas, de la más nueva a la más vieja, de a 12 por página
// (?pagina=). Las actividades realizadas no se listan (su página sigue). Cada sección, solo si tiene algo. Las
// tarjetas llegan hechas de server/paginas.js.
const t = paginas.novedades

/** @param {{ estado: { datos: { pagina?: number, paginas?: number, proximas?: object[], noticias?: object[] } } }} props */
export default function Novedades({ estado }) {
  const { pagina = 1, paginas: total = 1, proximas = [], noticias = [] } = estado.datos ?? {}
  return (
    <div className={CONTENEDOR}>
      <h1 className={TITULO_PAGINA}>{t.titulo}</h1>
      {proximas.length > 0 ? <SeccionDeTarjetas id="proximas" titulo={t.proximas} tarjetas={proximas} primera /> : null}
      {noticias.length > 0 ? (
        <SeccionDeTarjetas id="noticias" titulo={t.noticias} tarjetas={noticias} primera={proximas.length === 0} />
      ) : null}
      {total > 1 ? <Paginacion base="/novedades" pagina={pagina} paginas={total} /> : null}
    </div>
  )
}
