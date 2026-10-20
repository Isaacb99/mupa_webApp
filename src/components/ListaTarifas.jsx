import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// Las tarifas visibles de Visitas, en el orden del panel: el nombre y la condición a la izquierda, el precio a la
// derecha ("$ 3.000", ya como texto del servidor; null es una tarifa gratuita: "Gratis").

/** @param {{ tarifas: { nombre: string, precio: string | null, condicion: string | null }[] }} props */
export default function ListaTarifas({ tarifas }) {
  return (
    <ul className="mt-6 max-w-xl text-lg font-light">
      {tarifas.map((tarifa, i) => (
        <li key={i} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
          <span className="min-w-0 wrap-anywhere">
            <span className="block">{tarifa.nombre}</span>
            {tarifa.condicion ? <span className="mt-1 block text-[0.9375rem] text-muted">{tarifa.condicion}</span> : null}
          </span>
          <span className="shrink-0 font-mono text-base">{tarifa.precio ?? paginas.visitas.gratis}</span>
        </li>
      ))}
    </ul>
  )
}
