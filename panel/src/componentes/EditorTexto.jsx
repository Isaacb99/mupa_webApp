// Un campo de texto con formato (plan 5.1 y 5.4): el editor de TipTap (editorTexto/Editor.jsx) cargado aparte, con
// React.lazy. TipTap y ProseMirror son más de la mitad de lo que pesaría el panel y solo hacen falta donde hay un
// editor (Visitas; desde E3.3 y E3.4, las fichas): así no entran en el bundle principal. Mientras llega, se ve la
// etiqueta y un cuadro "Cargando el editor…" del mismo alto (la pantalla no salta). Si no llega (sin conexión, o un
// deploy borró el archivo: vite:preloadError ya muestra "Hay una versión nueva del panel"), lo dice en el lugar del
// campo y lo demás de la pantalla sigue andando.
// precargarEditor(): para que el loader de la pantalla lo pida junto con sus datos (es el mismo import, el navegador
// lo baja una sola vez).
//
// Props (las del editor, ver Editor.jsx): id (el del área editable: el de ResumenErrores), etiqueta, ayuda, error,
// valor (el contenido inicial: el JSON del editor o null; se lee al montar), alCambiar(json) y reemplazo (lo guardado,
// para que se vea así después de guardar).
import { Component, lazy, Suspense } from 'react'

let pedido = null
/** Pide el código del editor (una sola vez). */
export function precargarEditor() {
  pedido ??= import('./editorTexto/Editor.jsx').catch((err) => {
    pedido = null
    throw err
  })
  return pedido
}

const Editor = lazy(precargarEditor)

/** Lo que se ve mientras llega el editor, o si no llega. */
function Lugar({ id, etiqueta, ayuda, children }) {
  return (
    <div className="grid gap-1.5">
      <p id={`${id}-etiqueta`} className="font-semibold">
        {etiqueta}
      </p>
      {ayuda ? <p className="text-sm text-tenue wrap-anywhere">{ayuda}</p> : null}
      {/* El alto de la barra (44 px + bordes) más el del área editable. */}
      <div className="grid min-h-55 place-items-center rounded-md border-2 border-suave bg-fondo-2 p-4 text-tenue">
        {children}
      </div>
    </div>
  )
}

class SiNoCarga extends Component {
  state = { fallo: false }
  static getDerivedStateFromError() {
    return { fallo: true }
  }
  render() {
    if (!this.state.fallo) return this.props.children
    const { id, etiqueta, ayuda } = this.props
    return (
      <Lugar id={id} etiqueta={etiqueta} ayuda={ayuda}>
        <p role="alert" className="text-center font-semibold text-error">
          No se pudo cargar el editor de texto. Revisá la conexión y recargá la página.
        </p>
      </Lugar>
    )
  }
}

/**
 * @param {{ id: string, etiqueta: string, ayuda?: import('react').ReactNode, error?: string | null,
 *   valor: object | null, alCambiar: (json: object) => void, reemplazo?: { doc: object | null, si: unknown } | null }} props
 */
export function EditorTexto(props) {
  return (
    <SiNoCarga id={props.id} etiqueta={props.etiqueta} ayuda={props.ayuda}>
      <Suspense
        fallback={
          <Lugar id={props.id} etiqueta={props.etiqueta} ayuda={props.ayuda}>
            <p>Cargando el editor…</p>
          </Lugar>
        }
      >
        <Editor {...props} />
      </Suspense>
    </SiNoCarga>
  )
}
