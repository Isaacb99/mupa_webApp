// Después de guardar, el editor pasa a mostrar lo guardado (reemplazo de Editor.jsx: la forma canónica, sin las líneas
// en blanco que no se guardan). Código sin React ni DOM: lo prueba server/pruebas/textoRico.test.js con un editor de
// TipTap sin montar.
// - Una sola transacción, que no avisa el cambio (no es un cambio de la persona) y que además deja Deshacer vacío
//   (FLU-07 de la verificación de E3): antes el documento se reemplazaba fuera de la historia y prosemirror-history,
//   al pasar sus pasos por un reemplazo del documento entero, se quedaba con pasos que ya no tocaban nada: Deshacer
//   quedaba habilitado y no hacía nada hasta vaciarse. Lo guardado es el punto de partida: lo de antes de guardar ya
//   no se puede deshacer (como al abrir la pantalla).
// - La historia se vacía con el estado inicial del propio plugin, que viaja en la transacción con la meta del plugin
//   (la misma vía que usan Deshacer y Rehacer para dejar su historia nueva).
// - Sin autolink (LIM-05 de la verificación de la limpieza, 27/10/2026): al reemplazar el documento entero, el autolink
//   de TipTap (extensiones.js, Link) volvía a enlazar una dirección escrita como texto al final de un párrafo, en una
//   transacción anexa: el editor mostraba un enlace que no estaba guardado (por ejemplo, uno que la persona había
//   quitado a propósito) y lo publicaba con el guardado siguiente. La meta preventAutolink, que lee el plugin del
//   autolink, lo deja afuera de esta transacción; lo que la persona escribe después sigue enlazándose como siempre.
import { comoLoMuestraElEditor } from './extensiones.js'

// El plugin de la historia de prosemirror-history (UndoRedo de StarterKit): su clave es "history$" (con un número si
// hubiera dos).
const HISTORIA = /^history\$\d*$/

/**
 * Muestra lo guardado si el editor se ve distinto; devuelve si cambió algo.
 * @param {import('@tiptap/core').Editor} editor
 * @param {object | null} doc  lo guardado, en la forma canónica (compartido/esquemas/textoRico.js)
 */
export function mostrarGuardado(editor, doc) {
  const objetivo = comoLoMuestraElEditor(doc)
  if (editor.schema.nodeFromJSON(objetivo).eq(editor.state.doc)) return false
  const historia = editor.state.plugins.find((p) => HISTORIA.test(p.key))
  editor
    .chain()
    .command(({ tr, state }) => {
      tr.setMeta('addToHistory', false)
      tr.setMeta('preventAutolink', true)
      if (historia) tr.setMeta(historia, { redo: false, historyState: historia.spec.state.init({}, state) })
      return true
    })
    .setContent(objetivo, { emitUpdate: false })
    .run()
  return true
}
