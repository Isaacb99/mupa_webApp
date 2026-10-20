import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// El horario de la semana en Visitas: un renglón por día (de lunes a domingo), con el de hoy marcado ("Hoy (jueves)",
// aria-current="date") y "Cerrado" en los días que no abre. Los textos llegan hechos del servidor (server/paginas.js,
// horarioDeLaSemana): "hoy" lo decide el servidor con la hora de San Juan, nunca el navegador.
//
// Cómo se parte (A11Y-06 y PAG-06 de la verificación de E4):
// - Solo la celda de las horas parte una palabra que no entra (una dirección web en la nota). Puesto en toda la tabla,
//   el ancho mínimo de la columna de los días bajaba a una letra y, con un día con una nota larga, las horas se
//   quedaban con todo y los días salían partidos ("Miérc" / "oles"). Así esa columna mide al menos su palabra más
//   larga.
// - Si la tabla tiene menos de 14 em de ancho (con la letra del navegador al 150 o al 200 %, o con el zoom de la
//   página, en un celular), las dos columnas no entran: "(miércoles)", el aire y "9:00 a 13:00" miden unos 14 em. Ahí
//   cada día va arriba y sus horas debajo, a todo el ancho (una consulta de contenedor: mira el ancho de la sección, no
//   el de la pantalla, y se mide en em, así sigue a la letra). Con la letra al 200 % en 375 px la tabla desbordaba 10 px y
//   en 320 px, con dos columnas, las horas quedaban de una letra por renglón.
// - Los role explícitos (table, rowgroup, row, columnheader, rowheader, cell) son los mismos que da el HTML: están
//   porque, con los renglones apilados (display block), Safari puede dejar de anunciar la tabla como tabla sin ellos.
const t = paginas.visitas
const APILADA = '@max-[14em]:block'

/** @param {{ dias: { dia: string, hoy: boolean, horas: string | null, nota: string | null }[], etiqueta: string }} props
 *   etiqueta: el id del título de la sección (el nombre de la tabla) */
export default function TablaHorarios({ dias, etiqueta }) {
  return (
    <div className="@container mt-6">
      <table role="table" aria-labelledby={etiqueta} className={`w-full max-w-xl text-left text-lg ${APILADA}`}>
        <thead role="rowgroup" className="sr-only">
          <tr role="row">
            <th role="columnheader" scope="col">
              {t.dia}
            </th>
            <th role="columnheader" scope="col">
              {t.horas}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={APILADA}>
          {dias.map((d) => {
            // El de hoy, en el verde claro del hito activo de la Home y un poco más pesado.
            const celda = `py-3 align-top ${d.hoy ? 'font-normal' : 'font-light'} ${APILADA}`
            return (
              <tr
                key={d.dia}
                role="row"
                aria-current={d.hoy ? 'date' : undefined}
                className={`border-b border-line ${d.hoy ? 'text-verde-claro' : ''} ${APILADA}`}
              >
                <th role="rowheader" scope="row" className={`${celda} pr-6 @max-[14em]:pr-0 @max-[14em]:pb-0 @max-[14em]:wrap-break-word`}>
                  {d.dia}
                </th>
                <td role="cell" className={`${celda} wrap-anywhere @max-[14em]:pt-1`}>
                  {d.horas ?? t.cerrado}
                  {d.nota ? <span className="mt-1 block text-[0.9375rem] text-muted">{d.nota}</span> : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
