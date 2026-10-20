import { paginas } from '../content.js'
import { ENLACE_SUELTO } from './estilos.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// Las páginas de un listado (Novedades: ?pagina=, plan 6.1): "Anterior", "Página 2 de 5" y "Siguiente". La primera
// página es la dirección sin ?pagina= (con ?pagina=1 el servidor manda ahí con un 301). Enlaces comunes: andan sin
// JavaScript.
const t = paginas.novedades

/** @param {{ base: string, pagina: number, paginas: number }} props  base: la dirección del listado ("/novedades") */
export default function Paginacion({ base, pagina, paginas: total }) {
  const enlace = (n) => (n === 1 ? base : `${base}?pagina=${n}`)
  return (
    <nav aria-label={t.paginas} className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-1 text-lg font-light">
      {pagina > 1 ? (
        <a href={enlace(pagina - 1)} rel="prev" className={ENLACE_SUELTO}>
          {t.anterior}
        </a>
      ) : null}
      <p className="text-muted">{t.pagina(pagina, total)}</p>
      {pagina < total ? (
        <a href={enlace(pagina + 1)} rel="next" className={ENLACE_SUELTO}>
          {t.siguiente}
        </a>
      ) : null}
    </nav>
  )
}
