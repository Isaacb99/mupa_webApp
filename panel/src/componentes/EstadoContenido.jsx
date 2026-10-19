// El estado de un contenido en palabras (plan 5.4; E3.3 y E3.4), para los listados y las fichas: Borrador o Publicada
// y, además, en una muestra su situación (Actual, Próxima, Finalizada o Permanente, con el "hoy" de San Juan) y en una
// actividad "Realizada" si ya terminó. Se calculan con compartido/estados.js (lo mismo que va a usar el sitio).
// Son etiquetas de texto con un borde y un fondo suave: el color acompaña, la palabra es lo que dice el estado.
import { actividadRealizada, ESTADOS, SITUACIONES_MUESTRA, situacionDeMuestra } from '../../../compartido/estados.js'
import { hoyEnSanJuan } from '../formato.js'

const ESTILOS = {
  borrador: 'border-atencion bg-atencion-fondo text-atencion',
  publicado: 'border-ok bg-ok-fondo text-ok',
  vigente: 'border-accion bg-accion-fondo text-accion',
  pasado: 'border-linea bg-fondo-2 text-tenue',
}

/** Una etiqueta. */
export function Etiqueta({ estilo = 'pasado', children }) {
  return (
    <span className={`inline-block rounded-sm border px-1.5 text-sm leading-6 font-semibold ${ESTILOS[estilo]}`}>
      {children}
    </span>
  )
}

/**
 * Las etiquetas de un contenido: [{ estilo, texto }].
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {{ estado: string, tipo?: string, fechaInicio?: string | null, fechaFin?: string | null,
 *   eventoInicio?: string | null, eventoFin?: string | null }} item
 * @param {{ hoy?: string, ahora?: Date }} [cuando]
 */
export function etiquetasDe(tipo, item, { hoy = hoyEnSanJuan(), ahora = new Date() } = {}) {
  const lista = [{ estilo: item.estado === 'publicado' ? 'publicado' : 'borrador', texto: ESTADOS[item.estado] }]
  if (tipo === 'muestras') {
    const situacion = situacionDeMuestra(item, hoy)
    if (situacion) {
      lista.push({ estilo: situacion === 'finalizada' ? 'pasado' : 'vigente', texto: SITUACIONES_MUESTRA[situacion] })
    }
  }
  if (tipo === 'novedades' && item.tipo === 'actividad' && actividadRealizada(item, ahora)) {
    lista.push({ estilo: 'pasado', texto: 'Realizada' })
  }
  return lista
}

/** @param {{ tipo: 'novedades' | 'muestras' | 'salas', item: object }} props */
export function EstadoContenido({ tipo, item }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {etiquetasDe(tipo, item).map(({ estilo, texto }) => (
        <Etiqueta key={texto} estilo={estilo}>
          {texto}
        </Etiqueta>
      ))}
    </span>
  )
}
