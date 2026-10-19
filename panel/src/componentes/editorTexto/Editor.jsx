// El editor de texto con formato (plan 5.4), con TipTap 3. Se carga aparte (React.lazy, EditorTexto.jsx): TipTap y
// ProseMirror no entran en el bundle principal del panel, solo en las pantallas que tienen un editor.
//
// - Barra (role="toolbar", una sola parada de Tab; las flechas, Inicio y Fin se mueven adentro, como pide el patrón
//   de ARIA): Negrita, Cursiva, Subtítulo, Lista, Lista numerada (con aria-pressed), Enlace (abre un <dialog>) y
//   Deshacer. Las teclas de siempre también andan (Ctrl+B, Ctrl+I, Ctrl+Z, Mayús+Enter para un salto de línea; las
//   de cada botón van en su title y en aria-keyshortcuts). Apretar un botón no le saca el foco al texto
//   (mousedown sin acción por defecto) y, con el teclado, lo devuelve al texto.
// - El área editable es un role="textbox" multilínea con el id del campo (ResumenErrores lleva ahí), nombrado por la
//   etiqueta (aria-labelledby; un clic en la etiqueta pone el foco en el texto) y descripto por el error y la ayuda
//   (aria-describedby, aria-invalid), como Campo. Tab y Mayús+Tab siempre salen del editor (no hay listas
//   adentro de listas: no sangran; extensiones.js).
// - Lo que se pega pasa por pegar.js (Word, títulos, tablas) y después por el esquema del editor.
// - Una palabra o una dirección larga corta donde haga falta (wrap-anywhere, min-w-0): si no, ensanchaba la grilla y
//   toda la pantalla quedaba con scroll horizontal.
// - Sin estilos inyectados (injectCSS: false): TipTap pondría un <style> en la página; los suyos y los del contenido
//   están en panel.css (.ProseMirror y .editor-texto).
// - Controlado solo a medias: valor es el contenido INICIAL (se lee al montar) y alCambiar(json) avisa cada cambio
//   con editor.getJSON(). Quien lo usa compara la forma canónica (compartido/esquemas/textoRico.js) para saber si hay
//   cambios sin guardar; para volver a otro contenido, se lo vuelve a montar con otra key.
// - reemplazo ({ doc, si }, un objeto nuevo cada vez): después de guardar, quien lo usa pasa lo guardado (doc, la
//   forma canónica) y lo que mandó (si, el JSON del editor en ese momento). Si el editor sigue teniendo exactamente eso
//   (no se escribió nada mientras se guardaba) y se ve distinto de lo guardado (las líneas en blanco, que la forma
//   canónica saca), pasa a mostrar lo guardado, sin avisar el cambio y sin sumarlo a Deshacer (corrección de E3,
//   16/10/2026: hasta recargar se veían líneas en blanco que ya no estaban guardadas). Si se escribió algo, no toca nada.
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { DialogoEnlace } from './DialogoEnlace.jsx'
import { hayEnlace } from './enlace.js'
import { comoLoMuestraElEditor, EXTENSIONES } from './extensiones.js'
import { limpiarHtmlPegado } from './pegar.js'

const ES_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')
const MOD = ES_MAC ? 'Cmd' : 'Ctrl'
const MOD_ARIA = ES_MAC ? 'Meta' : 'Control'

/** Los botones de la barra, en orden. activo: la clave del estado que dice si está apretado (los de formato). */
const BOTONES = [
  {
    clave: 'negrita',
    texto: 'Negrita',
    clase: 'font-bold',
    teclas: [`${MOD}+B`, `${MOD_ARIA}+B`],
    activo: 'negrita',
    hacer: (c) => c.toggleBold(),
  },
  {
    clave: 'cursiva',
    texto: 'Cursiva',
    clase: 'italic',
    teclas: [`${MOD}+I`, `${MOD_ARIA}+I`],
    activo: 'cursiva',
    hacer: (c) => c.toggleItalic(),
  },
  {
    clave: 'subtitulo',
    texto: 'Subtítulo',
    teclas: [`${MOD}+Alt+2`, `${MOD_ARIA}+Alt+2`],
    activo: 'subtitulo',
    hacer: (c) => c.toggleHeading({ level: 2 }),
  },
  {
    clave: 'lista',
    texto: 'Lista',
    teclas: [`${MOD}+Mayús+8`, `${MOD_ARIA}+Shift+8`],
    activo: 'lista',
    hacer: (c) => c.toggleBulletList(),
  },
  {
    clave: 'numerada',
    texto: 'Lista numerada',
    teclas: [`${MOD}+Mayús+7`, `${MOD_ARIA}+Shift+7`],
    activo: 'numerada',
    hacer: (c) => c.toggleOrderedList(),
  },
  { clave: 'enlace', texto: 'Enlace', dialogo: true },
  {
    clave: 'deshacer',
    texto: 'Deshacer',
    teclas: [`${MOD}+Z`, `${MOD_ARIA}+Z`],
    habilitado: 'deshacer',
    hacer: (c) => c.undo(),
  },
]

const estadoDe = ({ editor }) =>
  editor
    ? {
        negrita: editor.isActive('bold'),
        cursiva: editor.isActive('italic'),
        subtitulo: editor.isActive('heading', { level: 2 }),
        lista: editor.isActive('bulletList'),
        numerada: editor.isActive('orderedList'),
        // También con el cursor justo después o justo antes de un enlace, donde isActive no lo ve (enlace.js).
        enlace: hayEnlace(editor),
        deshacer: editor.can().undo(),
      }
    : null

/**
 * @param {{ id: string, etiqueta: string, ayuda?: import('react').ReactNode, error?: string | null,
 *   valor: object | null, alCambiar: (json: object) => void, reemplazo?: { doc: object | null, si: unknown } | null }} props
 */
function Editor({ id, etiqueta, ayuda, error, valor, alCambiar, reemplazo = null }) {
  const idEtiqueta = `${id}-etiqueta`
  const idAyuda = ayuda ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  const alCambiarRef = useRef(alCambiar)
  alCambiarRef.current = alCambiar
  const [inicial] = useState(() => valor ?? '')

  const editorProps = useMemo(
    () => ({
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': idEtiqueta,
        ...(idError || idAyuda ? { 'aria-describedby': [idError, idAyuda].filter(Boolean).join(' ') } : {}),
        ...(idError ? { 'aria-invalid': 'true' } : {}),
        spellcheck: 'true',
        class:
          'editor-texto block min-h-40 w-full rounded-b-md border-2 border-t-0 border-linea bg-blanco px-3 py-2 ' +
          'text-base text-tinta wrap-anywhere aria-invalid:border-error',
      },
      transformPastedHTML: limpiarHtmlPegado,
    }),
    [id, idEtiqueta, idAyuda, idError],
  )

  const editor = useEditor({
    extensions: EXTENSIONES,
    content: inicial,
    injectCSS: false,
    editorProps,
    onUpdate: ({ editor: e }) => alCambiarRef.current(e.getJSON()),
  })
  const estado = useEditorState({ editor, selector: estadoDe })

  useEffect(() => {
    if (!editor || !reemplazo) return
    // Se escribió algo después de mandar: queda lo escrito (sigue como cambio sin guardar).
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(reemplazo.si)) return
    const objetivo = comoLoMuestraElEditor(reemplazo.doc)
    if (editor.schema.nodeFromJSON(objetivo).eq(editor.state.doc)) return
    editor
      .chain()
      .command(({ tr }) => {
        tr.setMeta('addToHistory', false)
        return true
      })
      .setContent(objetivo, { emitUpdate: false })
      .run()
  }, [editor, reemplazo])

  // La barra: una sola parada de Tab (la del último botón que tuvo el foco).
  const [enFoco, setEnFoco] = useState(0)
  const botones = useRef([])
  function moverEnLaBarra(e) {
    const ultimo = BOTONES.length - 1
    const destino = { ArrowRight: enFoco + 1, ArrowLeft: enFoco - 1, Home: 0, End: ultimo }[e.key]
    if (destino === undefined) return
    e.preventDefault()
    const i = destino < 0 ? ultimo : destino > ultimo ? 0 : destino
    setEnFoco(i)
    botones.current[i]?.focus()
  }

  const [dialogo, setDialogo] = useState(false)
  const habiaDialogo = useRef(false)
  useEffect(() => {
    // Al cerrarse el diálogo del enlace (después de que el <dialog> devuelva el foco), el foco vuelve al texto.
    if (!dialogo && habiaDialogo.current) editor?.commands.focus()
    habiaDialogo.current = dialogo
  }, [dialogo, editor])

  function apretar(boton) {
    if (!editor) return
    if (boton.dialogo) {
      setDialogo(true)
      return
    }
    if (boton.habilitado && !estado?.[boton.habilitado]) return
    boton.hacer(editor.chain().focus()).run()
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      {/* No es un <label>: el área editable no es un control que se pueda etiquetar con for. */}
      <p id={idEtiqueta} className="font-semibold" onClick={() => editor?.commands.focus()}>
        {etiqueta}
      </p>
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tenue wrap-anywhere">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-sm font-semibold text-error wrap-anywhere">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
      <div className="min-w-0">
        <div
          role="toolbar"
          aria-label={`Formato de «${etiqueta}»`}
          aria-controls={id}
          onKeyDown={moverEnLaBarra}
          className={`flex flex-wrap gap-1 rounded-t-md border-2 bg-fondo-2 p-1 ${error ? 'border-error' : 'border-linea'}`}
        >
          {BOTONES.map((boton, i) => {
            const apretado = boton.activo ? Boolean(estado?.[boton.activo]) : undefined
            const deshabilitado = boton.habilitado ? !estado?.[boton.habilitado] : false
            return (
              <button
                key={boton.clave}
                ref={(nodo) => {
                  botones.current[i] = nodo
                }}
                type="button"
                tabIndex={i === enFoco ? 0 : -1}
                aria-pressed={apretado}
                aria-disabled={deshabilitado || undefined}
                aria-haspopup={boton.dialogo ? 'dialog' : undefined}
                aria-keyshortcuts={boton.teclas?.[1]}
                title={boton.teclas ? `${boton.texto} (${boton.teclas[0]})` : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onFocus={() => setEnFoco(i)}
                onClick={() => apretar(boton)}
                className={
                  'inline-flex min-h-11 min-w-11 items-center justify-center rounded border-2 px-3 text-base ' +
                  'aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ' +
                  (apretado
                    ? 'border-accion bg-accion text-blanco hover:bg-accion-fuerte'
                    : 'border-transparent bg-transparent text-tinta hover:border-linea hover:bg-blanco') +
                  (boton.clase ? ` ${boton.clase}` : '') +
                  (boton.dialogo && estado?.enlace ? ' underline' : '')
                }
              >
                {boton.texto}
              </button>
            )
          })}
        </div>
        <EditorContent editor={editor} />
      </div>
      <DialogoEnlace abierto={dialogo} editor={editor} idCampo={id} alCerrar={() => setDialogo(false)} />
    </div>
  )
}

export default memo(Editor)
