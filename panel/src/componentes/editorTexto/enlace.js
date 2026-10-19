// El enlace que toca el cursor y lo que hacen con él el botón "Enlace" de la barra (Editor.jsx: si se marca) y su
// diálogo (DialogoEnlace.jsx: con qué arranca, ponerlo, cambiarlo o quitarlo). Sin React ni DOM: se prueba con un
// editor de TipTap sin montar (server/pruebas/textoRico.test.js).
// - El enlace no es inclusivo (extensiones.js: lo que se escribe después de él queda afuera), así que ProseMirror no lo
//   cuenta en la posición justo después de su última letra ni justo antes de la primera: ahí isActive('link') y
//   getAttributes('link') no lo ven. Pero es donde queda el cursor con Fin, con Inicio o con un clic a la derecha de un
//   enlace que termina el renglón, y el diálogo abría vacío, con "Texto", y agregaba un segundo enlace pegado al primero
//   en vez de cambiarlo (corrección de E3, ronda 2, 16/10/2026). Por eso, con la selección vacía, el enlace es el del
//   texto que está justo antes del cursor o, si ese no tiene, el del que está justo después: el cursor que toca un
//   enlace lo cambia o lo quita entero, y nunca se pone un enlace nuevo pegado a otro.
// - El enlace abarca los textos seguidos con el mismo enlace (la misma dirección: "el sitio" con una parte en negrita
//   es uno solo, como en el sitio, TextoRico.jsx); dos enlaces distintos pegados son dos.
// - Al cambiarlo o quitarlo desde el cursor, el cursor queda donde estaba: con el enlace entero elegido, lo que se
//   escribiera después lo reemplazaría.

/**
 * El enlace que toca el cursor, con la selección vacía (con texto elegido: null, y manda lo elegido).
 * @param {import('@tiptap/pm/state').EditorState} estado
 * @returns {{ href: string, desde: number, hasta: number } | null}
 */
export function enlaceJuntoAlCursor(estado) {
  const { selection } = estado
  const tipo = estado.schema.marks.link
  if (!tipo || !selection.empty) return null
  const $pos = selection.$from
  const padre = $pos.parent
  if (!padre.inlineContent) return null
  const inicio = $pos.start()
  // Adentro de un texto, los dos lados son ese mismo texto.
  for (const lado of [padre.childBefore($pos.parentOffset), padre.childAfter($pos.parentOffset)]) {
    const marca = lado.node ? tipo.isInSet(lado.node.marks) : undefined
    if (!marca) continue
    let antes = lado.index
    let despues = lado.index + 1
    let desde = inicio + lado.offset
    let hasta = desde + lado.node.nodeSize
    while (antes > 0 && marca.isInSet(padre.child(antes - 1).marks)) {
      antes -= 1
      desde -= padre.child(antes).nodeSize
    }
    while (despues < padre.childCount && marca.isInSet(padre.child(despues).marks)) {
      hasta += padre.child(despues).nodeSize
      despues += 1
    }
    return { href: marca.attrs.href ?? '', desde, hasta }
  }
  return null
}

/**
 * ¿El botón "Enlace" se marca? Cuando lo elegido tiene un enlace o el cursor toca uno.
 * @param {import('@tiptap/core').Editor} editor
 */
export function hayEnlace(editor) {
  return editor.isActive('link') || enlaceJuntoAlCursor(editor.state) !== null
}

/**
 * Con qué arranca el diálogo: la dirección del enlace (vacía si no hay) y si pide el texto que se va a ver (sin texto
 * elegido y sin un enlace en el cursor: el enlace se escribe nuevo).
 * @param {import('@tiptap/core').Editor} editor
 * @returns {{ href: string, conTexto: boolean }}
 */
export function enlaceParaElDialogo(editor) {
  if (editor.state.selection.empty) {
    const junto = enlaceJuntoAlCursor(editor.state)
    return { href: junto?.href ?? '', conTexto: !junto }
  }
  return { href: editor.getAttributes('link').href ?? '', conTexto: false }
}

/**
 * Pone el enlace (el diálogo, con la dirección ya completa y aceptada): cambia el que toca el cursor; sin enlace ni
 * texto elegido, escribe el texto (o la dirección, si se dejó vacío) con el enlace puesto; con texto elegido, se lo pone
 * a lo elegido (si está adentro de un enlace, a ese enlace entero).
 * @param {import('@tiptap/core').Editor} editor
 * @param {string} href
 * @param {string} [texto]
 */
export function ponerEnlace(editor, href, texto = '') {
  const { empty, from } = editor.state.selection
  const junto = empty ? enlaceJuntoAlCursor(editor.state) : null
  if (junto) {
    editor.chain().setTextSelection({ from: junto.desde, to: junto.hasta }).setLink({ href }).setTextSelection(from).run()
  } else if (empty) {
    const visible = texto.trim() || href.replace(/^(https?:\/\/|mailto:|tel:)/, '')
    editor
      .chain()
      .insertContent({ type: 'text', text: visible, marks: [{ type: 'link', attrs: { href } }] })
      .run()
  } else {
    editor.chain().extendMarkRange('link').setLink({ href }).run()
  }
}

/**
 * Quita el enlace (el texto queda): el que toca el cursor o el de lo elegido.
 * @param {import('@tiptap/core').Editor} editor
 */
export function quitarEnlace(editor) {
  const { empty, from } = editor.state.selection
  const junto = empty ? enlaceJuntoAlCursor(editor.state) : null
  if (junto) {
    editor.chain().setTextSelection({ from: junto.desde, to: junto.hasta }).unsetLink().setTextSelection(from).run()
  } else {
    editor.chain().extendMarkRange('link').unsetLink().run()
  }
}
