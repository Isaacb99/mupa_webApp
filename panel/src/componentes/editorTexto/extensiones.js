// Las extensiones del editor de texto (plan 5.4), con los nombres de TipTap 3 (verificados contra
// @tiptap/starter-kit 3.32.0, 16/10/2026). En la 3, StarterKit trae también el enlace (Link), el subrayado
// (Underline), las teclas de las listas (ListKeymap), el párrafo final (TrailingNode) y Deshacer (UndoRedo, que en la
// 2 se llamaba History): se configuran ahí, salvo el enlace (ver abajo).
// - Queda: párrafo, un solo nivel de subtítulo (h2), negrita, cursiva, listas con viñetas y numeradas, salto de línea
//   (Mayús + Enter), enlace y deshacer/rehacer. Afuera: código, bloque de código, cita, línea horizontal, tachado y
//   subrayado (lo que el esquema del servidor no admite: compartido/esquemas/textoRico.js).
// - El elemento de lista lleva solo párrafos ('paragraph+'): sin listas adentro de listas (lo que se pega con niveles
//   queda en un nivel). Por eso listItem: false en StarterKit y va el propio, que además deja Tab y Mayús+Tab al
//   navegador: el de TipTap sangraba con Tab (acá no hay a dónde) y con Mayús+Tab sacaba el elemento de la lista en vez
//   de volver a la barra. Lo mismo con las teclas de las listas (ListKeymap: listKeymap: false y va la propia, sin
//   Tab, que al principio de un párrafo después de una lista lo metía en el último elemento). Así Tab y Mayús+Tab
//   siempre entran y salen del editor (WCAG 2.1.1 y 2.1.2). Para salir de una lista, Enter en un elemento vacío o el
//   botón de la lista.
// - Enlaces: no se abren al hacer clic (se está editando), se crean solos al escribir una dirección (autolink) o al
//   pegar una sobre un texto, y sin esquema van con https://. Lo que se escribe después de un enlace queda AFUERA de
//   él (inclusive: false). El Link de TipTap es inclusivo cuando tiene autolink, y el punto o la frase que seguían a un
//   enlace se guardaban adentro (corrección de E3, 16/10/2026): por eso va el propio (link: false en StarterKit y
//   @tiptap/extension-link, la misma versión, con inclusive en false). autolink sigue andando: marca la dirección al
//   escribir el espacio que la termina. isAllowedUri decide qué enlace se acepta al escribir, al
//   pegar HTML y al usar el diálogo: solo https:, http:, mailto: y tel:, hasta 500 caracteres (compartido/enlaces.js).
//   Recibe también lo que escribió la persona sin el esquema ("www.museo.gob.ar", que autolink completa con
//   defaultProtocol): por eso se completa antes de mirar. Lo que el editor pegó sin esquema (<a href="www.…">) lo
//   completa el panel antes de guardar (completarEnlaces).
import { Link } from '@tiptap/extension-link'
import { ListItem, ListKeymap } from '@tiptap/extension-list'
import { StarterKit } from '@tiptap/starter-kit'
import { completarEnlace, esEnlacePermitido } from '../../../../compartido/enlaces.js'

export const enlaceAceptado = (url) => esEnlacePermitido(completarEnlace(url))

export const EXTENSIONES = [
  StarterKit.configure({
    heading: { levels: [2] },
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    listItem: false,
    listKeymap: false,
    link: false,
  }),
  Link.extend({ inclusive: false }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: 'https',
    isAllowedUri: (url) => enlaceAceptado(url),
  }),
  ListItem.extend({
    content: 'paragraph+',
    addKeyboardShortcuts() {
      return { Enter: () => this.editor.commands.splitListItem(this.name) }
    },
  }),
  ListKeymap.extend({
    addKeyboardShortcuts() {
      // eslint-disable-next-line no-unused-vars -- Tab queda afuera a propósito (ver arriba).
      const { Tab, ...resto } = this.parent?.() ?? {}
      return resto
    },
  }),
]

/**
 * Lo que muestra el editor para un documento guardado (Editor.jsx, después de guardar): el documento (vacío: un
 * párrafo) con el párrafo del final que agrega TrailingNode de StarterKit cuando el último bloque no es un párrafo
 * (después de una lista o un subtítulo, para poder seguir escribiendo).
 * @param {object | null} doc  la forma canónica (compartido/esquemas/textoRico.js)
 */
export function comoLoMuestraElEditor(doc) {
  const content = [...(doc?.content ?? [])]
  if (content.at(-1)?.type !== 'paragraph') content.push({ type: 'paragraph' })
  return { type: 'doc', content }
}
