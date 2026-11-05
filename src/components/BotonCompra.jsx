import { BOTON } from './estilos.js'
import { textoCompra } from './navegacion.js'

// Sin uso desde la Visitas del tablero "Web" de la diseñadora (03/11/2026, decisiones V1 y V9: la compra queda en
// "Tickets" del header y de la franja de la Home): queda hasta que se decida al cierre (D1).
//
// "Comprar entradas" en Visitas: la compra externa, si está activa (estado.museo.compra), con el texto que cargó el
// museo o el de content.js (el menú y la franja de la Home dicen siempre "Tickets": navegacion.entradas, D4).
// data-entradas: el clic lo mide la analítica (clic_entradas, plan 6.6).

/** @param {{ compra: { url: string, texto: string | null } }} props */
export default function BotonCompra({ compra }) {
  return (
    <a href={compra.url} data-entradas="" className={BOTON}>
      {textoCompra(compra)}
    </a>
  )
}
