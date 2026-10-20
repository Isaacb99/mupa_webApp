import { BOTON } from './estilos.js'
import { textoCompra } from './Menu.jsx'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// "Comprar entradas" en Visitas: la compra externa, si está activa (estado.museo.compra), con el texto que cargó el
// museo o el de content.js (como en el menú). data-entradas: el clic lo mide la analítica (clic_entradas, plan 6.6).

/** @param {{ compra: { url: string, texto: string | null } }} props */
export default function BotonCompra({ compra }) {
  return (
    <a href={compra.url} data-entradas="" className={BOTON}>
      {textoCompra(compra)}
    </a>
  )
}
