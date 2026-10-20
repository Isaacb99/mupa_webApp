import Aviso from '../components/Aviso.jsx'
import BotonCompra from '../components/BotonCompra.jsx'
import ListaTarifas from '../components/ListaTarifas.jsx'
import Seccion from '../components/Seccion.jsx'
import TablaHorarios from '../components/TablaHorarios.jsx'
import TextoRico from '../components/TextoRico.jsx'
import { CLASES_TEXTO, CONTENEDOR, TEXTO, TITULO_PAGINA } from '../components/estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// /visitas (E4.3, plan 6.1): el aviso general (si está vigente), "Comprar entradas" (si la compra externa está activa),
// el horario de la semana con el día de hoy, las tarifas visibles y sus notas, y los tres textos del museo (Cómo llegar,
// Normas del museo, Accesibilidad), que van solo en los datos de esta página (COD-04 de E3). Cada sección, solo si
// tiene algo; los subtítulos de los textos van en h3, debajo del h2 de su sección. Los datos, de server/paginas.js.
const t = paginas.visitas
const TEXTOS = [
  ['comoLlegar', t.comoLlegar],
  ['normas', t.normas],
  ['accesibilidad', t.accesibilidad],
]
// Las notas de horario y de tarifas: el museo las escribe en varios renglones (un cuadro de tres en el panel) y así
// se ven (PAG-04 de la verificación de E4); una palabra que no entra se parte (PAG-01).
const NOTA = 'mt-6 text-lg font-light whitespace-pre-line wrap-anywhere'

/** @param {{ estado: { datos: object } }} props */
export default function Visitas({ estado }) {
  const d = estado.datos ?? {}
  const horario = d.horario ?? []
  const tarifas = d.tarifas ?? []
  const conHorario = horario.length > 0 || Boolean(d.notaHorarios)
  const conTarifas = tarifas.length > 0 || Boolean(d.notaTarifas)
  return (
    <div className={CONTENEDOR}>
      <h1 className={TITULO_PAGINA}>{t.titulo}</h1>
      {d.aviso ? <Aviso texto={d.aviso} className="mt-10" /> : null}
      {d.compra ? (
        <p className="mt-10">
          <BotonCompra compra={d.compra} />
        </p>
      ) : null}

      {conHorario || conTarifas ? (
        <div className="mt-14 grid gap-16 md:mt-20 lg:grid-cols-2">
          {conHorario ? (
            <Seccion id="horario" titulo={t.horario} className="min-w-0">
              {horario.length > 0 ? <TablaHorarios dias={horario} etiqueta="horario" /> : null}
              {d.notaHorarios ? <p className={NOTA}>{d.notaHorarios}</p> : null}
            </Seccion>
          ) : null}
          {conTarifas ? (
            <Seccion id="tarifas" titulo={t.tarifas} className="min-w-0">
              {tarifas.length > 0 ? <ListaTarifas tarifas={tarifas} /> : null}
              {d.notaTarifas ? <p className={NOTA}>{d.notaTarifas}</p> : null}
            </Seccion>
          ) : null}
        </div>
      ) : null}

      {TEXTOS.filter(([campo]) => d[campo]).map(([campo, titulo]) => (
        <Seccion key={campo} id={campo} titulo={titulo} className="mt-16 md:mt-20">
          <div className={`${TEXTO} mt-6`}>
            <TextoRico texto={d[campo]} nivelSubtitulo={3} clases={CLASES_TEXTO} />
          </div>
        </Seccion>
      ))}
    </div>
  )
}
