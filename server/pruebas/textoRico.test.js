// Los textos con formato (E3.2; plan 3.1, 5.4 y 9): el esquema que valida lo que guarda el editor
// (compartido/esquemas/textoRico.js), los enlaces (compartido/enlaces.js) y cómo los dibuja el sitio
// (src/components/TextoRico.jsx, con renderToString: sin HTML crudo y sin enlaces javascript:). Sin base. La API (PUT y
// GET /museo con los textos de Visitas) y la Home con los textos cargados están en museo.test.js.
// TextoRico.jsx es JSX: se carga con el Vite del proyecto (ssrLoadModule, como npm run dev), sin build.
// Desde la corrección de E3 (16/10/2026): el tope de bytes de la forma canónica (BYTES_MAX) y, con el esquema de
// ProseMirror que arman las extensiones del editor (sin DOM), que lo escrito después de un enlace no queda adentro y
// cómo se ve después de guardar (comoLoMuestraElEditor). Desde la ronda 2 (16/10/2026), con un editor de TipTap sin
// montar (tampoco necesita DOM): el diálogo del enlace con el cursor justo antes o justo después de un enlace
// (editorTexto/enlace.js).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, test } from 'node:test'
import { Editor, getSchema } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { completarEnlace, ENLACE_MAX, esEnlacePermitido, MENSAJE_ENLACE } from '../../compartido/enlaces.js'
import { esquemaCambioMuseo } from '../../compartido/esquemas/museo.js'
import {
  enlaceJuntoAlCursor,
  enlaceParaElDialogo,
  hayEnlace,
  ponerEnlace,
  quitarEnlace,
} from '../../panel/src/componentes/editorTexto/enlace.js'
import { comoLoMuestraElEditor, EXTENSIONES } from '../../panel/src/componentes/editorTexto/extensiones.js'
import {
  BLOQUES_MAX,
  BYTES_MAX,
  bytesDe,
  CARACTERES_MAX,
  completarEnlaces,
  medirDocumento,
  MENSAJE_FORMATO,
  textoRico,
  textoRicoPublicable,
} from '../../compartido/esquemas/textoRico.js'
import { MUSEO_MAXIMO } from '../museo.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

/** El resultado del esquema: { datos } o { error } (el mensaje). */
function validar(valor) {
  const r = textoRico.safeParse(valor)
  return r.success ? { datos: r.data } : { error: r.error.issues.map((i) => i.message).join(' | ') }
}

const t = (text, ...marks) => (marks.length ? { type: 'text', text, marks } : { type: 'text', text })
const p = (...content) => ({ type: 'paragraph', content })
const doc = (...content) => ({ type: 'doc', content })
const enlace = (href, extra = {}) => ({ type: 'link', attrs: { href, ...extra } })
const lista = (tipo, ...parrafos) => ({ type: tipo, content: parrafos.map((x) => ({ type: 'listItem', content: [x] })) })
const NEGRITA = { type: 'bold' }
const CURSIVA = { type: 'italic' }

describe('el esquema de los textos con formato (sin base)', () => {
  test('un documento válido sale en su forma canónica', () => {
    const entrada = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [t('Cómo llegar')] },
        p(
          t('Hola ', CURSIVA, NEGRITA),
          t('mundo', NEGRITA, CURSIVA),
          { type: 'hardBreak', marks: [NEGRITA] },
          t('ver ', enlace('HTTPS://example.com/a', { target: '_blank', rel: 'noopener noreferrer nofollow' })),
          t('aquí', NEGRITA, enlace('https://example.com/a')),
        ),
        { type: 'orderedList', attrs: { start: 1, type: null }, content: [{ type: 'listItem', content: [p(t('uno'))] }] },
        { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [p(t('tres'))] }] },
        lista('bulletList', p(t('a')), p(t('b'))),
        // El párrafo vacío del final que pone el editor (TrailingNode).
        { type: 'paragraph' },
      ],
    }
    assert.deepEqual(validar(entrada).datos, {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [t('Cómo llegar')] },
        p(
          t('Hola mundo', NEGRITA, CURSIVA),
          { type: 'hardBreak' },
          t('ver ', enlace('https://example.com/a')),
          t('aquí', enlace('https://example.com/a'), NEGRITA),
        ),
        { type: 'orderedList', content: [{ type: 'listItem', content: [p(t('uno'))] }] },
        { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [p(t('tres'))] }] },
        lista('bulletList', p(t('a')), p(t('b'))),
      ],
    })
  })

  test('vacío pasa a null: null, un documento sin contenido o con párrafos, listas y subtítulos vacíos', () => {
    for (const vacio of [
      null,
      undefined,
      { type: 'doc' },
      doc(),
      doc({ type: 'paragraph' }),
      doc(p(t('   ')), p(t(' ')), p({ type: 'hardBreak' }), { type: 'heading', attrs: { level: 2 } }),
      doc(lista('bulletList', { type: 'paragraph' }), lista('orderedList', p(t('\t')))),
    ]) {
      assert.equal(validar(vacio).datos, null, JSON.stringify(vacio))
    }
  })

  test('sin párrafos, elementos ni listas vacíos, y sin saltos de línea en las puntas de un párrafo', () => {
    assert.deepEqual(
      validar(
        doc(
          p(t(' ')),
          p({ type: 'hardBreak' }, t('Uno'), { type: 'hardBreak' }, { type: 'hardBreak' }),
          { type: 'bulletList', content: [{ type: 'listItem', content: [p(), p(t('x'))] }, { type: 'listItem', content: [p()] }] },
        ),
      ).datos,
      doc(p(t('Uno')), lista('bulletList', p(t('x')))),
    )
  })

  test('nodo o marca que el editor no tiene: 400 con el mensaje del formato', () => {
    for (const malo of [
      doc({ type: 'image', attrs: { src: 'https://example.com/x.png' } }),
      doc({ type: 'blockquote', content: [p(t('x'))] }),
      doc({ type: 'codeBlock', content: [t('x')] }),
      doc({ type: 'horizontalRule' }),
      doc({ type: 'table', content: [] }),
      doc(t('texto suelto')),
      doc(p(p(t('x')))),
      doc(p(t('x', { type: 'underline' }))),
      doc(p(t('x', { type: 'strike' }))),
      doc(p(t('x', { type: 'code' }))),
      doc(p(t('x', { type: 'textStyle', attrs: { color: 'red' } }))),
      // Listas adentro de listas (el elemento lleva solo párrafos).
      doc({ type: 'bulletList', content: [{ type: 'listItem', content: [p(t('a')), lista('bulletList', p(t('b')))] }] }),
      doc({ type: 'bulletList', content: [] }),
      doc({ type: 'bulletList', content: [p(t('x'))] }),
      { type: 'paragraph', content: [t('x')] },
      'texto',
      ['doc'],
      42,
    ]) {
      assert.equal(validar(malo).error, MENSAJE_FORMATO, JSON.stringify(malo))
    }
    assert.match(validar(doc({ type: 'heading', attrs: { level: 1 }, content: [t('x')] })).error, /solo nivel de subtítulo/)
    assert.match(validar(doc({ type: 'heading', content: [t('x')] })).error, /formato/)
  })

  test('enlaces: solo https:, http:, mailto: y tel:, completos y de hasta 500 caracteres; javascript: da 400', () => {
    for (const malo of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///C:/Users/museo/doc.docx',
      '#_Toc123',
      '/visitas',
      '//evil.example.com/',
      'www.example.com',
      'https://museo',
      'https://user:clave@example.com/',
      'https://example.com/a b',
      'https://example.com/"x',
      'https://exa\u200Bmple.com/',
      'mailto:sin-arroba',
      'tel:letras',
      `https://example.com/${'x'.repeat(ENLACE_MAX)}`,
      '',
    ]) {
      assert.equal(validar(doc(p(t('x', enlace(malo))))).error, MENSAJE_ENLACE, malo)
      assert.equal(esEnlacePermitido(malo), false, malo)
    }
    for (const bueno of [
      'https://example.com/',
      'http://example.com/a?b=1#c',
      'mailto:museo@example.com',
      'mailto:museo@example.com?subject=Visita',
      'tel:+542640000000',
      'tel:264-000-0000',
      `https://example.com/${'x'.repeat(ENLACE_MAX - 'https://example.com/'.length)}`,
    ]) {
      assert.equal(validar(doc(p(t('x', enlace(bueno))))).datos.content[0].content[0].marks[0].attrs.href, bueno)
    }
    assert.equal(validar(doc(p(t('x', { type: 'link' })))).error, MENSAJE_ENLACE)
    assert.equal(validar(doc(p(t('x', { type: 'link', attrs: { href: 3 } })))).error, MENSAJE_ENLACE)
  })

  test(`hasta ${BLOQUES_MAX} párrafos, subtítulos o elementos de lista; uno más da 400`, () => {
    const parrafos = (n) => Array.from({ length: n }, (_, i) => p(t(`p${i}`)))
    assert.ok(validar(doc(...parrafos(BLOQUES_MAX))).datos)
    assert.match(validar(doc(...parrafos(BLOQUES_MAX + 1))).error, /hasta 300 párrafos/)
    // Los elementos de una lista también cuentan (de a uno por párrafo).
    assert.match(
      validar(doc(...parrafos(200), lista('bulletList', ...parrafos(101)))).error,
      /hasta 300 párrafos, subtítulos o elementos de lista\. Tiene 301\./,
    )
    // Los vacíos no cuentan (se van antes de contar).
    assert.ok(validar(doc(...parrafos(BLOQUES_MAX), ...Array(50).fill({ type: 'paragraph' }))).datos)
  })

  test(`hasta ${CARACTERES_MAX.toLocaleString('es-AR')} caracteres en todo el documento (en code points)`, () => {
    const mitad = 'a'.repeat(CARACTERES_MAX / 2)
    assert.ok(validar(doc(p(t(mitad)), p(t(mitad)))).datos)
    assert.match(validar(doc(p(t(mitad)), p(t(`${mitad}b`)))).error, /hasta 20\.000 caracteres: tiene 20\.001/)
    // Un emoji cuenta 1 (como el varchar de Postgres y el resto de los campos).
    assert.ok(validar(doc(p(t('😀'.repeat(CARACTERES_MAX))))).datos)
    assert.equal(medirDocumento(validar(doc(p(t('😀😀')), p(t('ab')))).datos).caracteres, 4)
  })

  test(`hasta ${BYTES_MAX.toLocaleString('es-AR')} bytes de JSON: mucho formato en pocos caracteres da 400 en el campo`, () => {
    // 19.500 caracteres, con negrita una palabra sí y otra no: ~115 kB (antes, el 413 genérico del pedido).
    const palabras = Array.from({ length: 3250 }, (_, i) => (i % 2 ? t('fósil ', NEGRITA) : t('fósil ')))
    const pesado = doc(p(...palabras))
    assert.ok(medirDocumento(pesado).caracteres <= CARACTERES_MAX)
    assert.match(validar(pesado).error, /^Tiene demasiado formato para guardarse .*ocupa 1\d\d kB y el máximo es 90 kB/)
    // El mismo texto sin formato entra, y sus bytes son los del JSON en UTF-8.
    const liviano = validar(doc(p(t('fósil '.repeat(3250)))))
    assert.ok(liviano.datos)
    assert.equal(bytesDe(liviano.datos), Buffer.byteLength(JSON.stringify(liviano.datos)))
    // Tres textos en su tope entran en un pedido de 300 kB (PUT /museo, limiteJson de server/api/museo.js).
    assert.ok(3 * BYTES_MAX + 200 < 300 * 1024)
  })

  test('las claves de más se descartan (también las del enlace y las de la lista numerada)', () => {
    const r = validar({
      type: 'doc',
      version: 9,
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'center', id: 'x' },
          style: 'color:red',
          content: [{ type: 'text', text: 'x', extra: 1, marks: [enlace('https://example.com', { class: 'a', title: 't' })] }],
        },
        { type: 'orderedList', attrs: { start: 2, type: 'a' }, extra: true, content: [{ type: 'listItem', attrs: { x: 1 }, content: [p(t('y'))] }] },
      ],
    })
    assert.deepEqual(r.datos, doc(p(t('x', enlace('https://example.com'))), {
      type: 'orderedList',
      attrs: { start: 2 },
      content: [{ type: 'listItem', content: [p(t('y'))] }],
    }))
  })

  test('caracteres de control: el tabulador y los saltos de línea pasan a espacio, los demás se van; surrogate suelto, 400', () => {
    assert.deepEqual(validar(doc(p(t('a\u0000b\tc\nd\u0007e')))).datos, doc(p(t('ab c de'))))
    assert.match(validar(doc(p(t('a\uD800b')))).error, /no se pudieron leer/)
  })

  test('la forma canónica no depende del orden de las claves y no cambia si se vuelve a pasar', () => {
    const a = validar(MUSEO_MAXIMO.comoLlegar).datos
    // Como lo devuelve un jsonb: las claves en otro orden.
    const desordenar = (v) =>
      Array.isArray(v)
        ? v.map(desordenar)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, desordenar(v[k])]))
          : v
    const b = validar(desordenar(MUSEO_MAXIMO.comoLlegar)).datos
    assert.equal(JSON.stringify(a), JSON.stringify(b))
    assert.equal(JSON.stringify(validar(a).datos), JSON.stringify(a))
  })

  test('los textos del museo de ejemplo (SIN_BASE=maximo) ya están en la forma canónica', () => {
    for (const campo of ['comoLlegar', 'normas', 'accesibilidad']) {
      assert.ok(MUSEO_MAXIMO[campo], campo)
      assert.deepEqual(textoRicoPublicable(MUSEO_MAXIMO[campo]), MUSEO_MAXIMO[campo], campo)
    }
  })

  test('textoRicoPublicable: lo que no pasa el esquema no se publica (null)', () => {
    assert.equal(textoRicoPublicable(doc(p(t('x', enlace('javascript:alert(1)'))))), null)
    assert.equal(textoRicoPublicable({ type: 'doc', content: [{ type: 'image' }] }), null)
    assert.equal(textoRicoPublicable('<p>hola</p>'), null)
    assert.equal(textoRicoPublicable(null), null)
  })

  test('en PUT /museo: un error por texto, en su campo (no en la ruta del nodo)', () => {
    const r = esquemaCambioMuseo.safeParse({
      comoLlegar: doc(p(t('x', enlace('javascript:alert(1)')))),
      normas: doc({ type: 'image' }),
      accesibilidad: doc(p(t('Rampa en la entrada.'))),
    })
    assert.equal(r.success, false)
    assert.deepEqual(
      r.error.issues.map((i) => [i.path.join('.'), i.message]),
      [
        ['comoLlegar', MENSAJE_ENLACE],
        ['normas', MENSAJE_FORMATO],
      ],
    )
    const bien = esquemaCambioMuseo.parse({ comoLlegar: doc({ type: 'paragraph' }), normas: null, accesibilidad: doc(p(t('Sí'))) })
    assert.deepEqual(bien, { comoLlegar: null, normas: null, accesibilidad: doc(p(t('Sí'))) })
  })
})

describe('el editor, con su esquema de ProseMirror (sin base ni DOM)', () => {
  const esquema = getSchema(EXTENSIONES)

  test('lo que se escribe después de un enlace queda afuera de él (el enlace no es inclusivo)', () => {
    assert.equal(esquema.marks.link.spec.inclusive, false)
    const inicial = esquema.nodeFromJSON(doc(p(t('Más datos en '), t('el sitio', enlace('https://www.mupa.ar')))))
    let estado = EditorState.create({ schema: esquema, doc: inicial })
    const fin = inicial.content.size - 1
    estado = estado.apply(estado.tr.setSelection(TextSelection.create(estado.doc, fin)))
    // Como lo hace el editor al tipear: el texto entra en la posición del cursor con las marcas de ahí.
    estado = estado.apply(estado.tr.insertText('. Y en la boletería', fin))
    const textos = estado.doc.toJSON().content[0].content
    assert.deepEqual(
      textos.map((n) => [n.text, (n.marks ?? []).map((m) => m.type)]),
      [
        ['Más datos en ', []],
        ['el sitio', ['link']],
        ['. Y en la boletería', []],
      ],
    )
  })

  test('después de guardar: se reemplaza solo si lo guardado se ve distinto (las líneas en blanco)', () => {
    const conBlancos = doc(p(t('Uno')), { type: 'paragraph' }, p(t('   ')), p(t('Dos')), lista('bulletList', p(t('a'))), { type: 'paragraph' })
    const guardado = validar(conBlancos).datos
    assert.deepEqual(guardado, doc(p(t('Uno')), p(t('Dos')), lista('bulletList', p(t('a')))))
    // El editor lo muestra con el párrafo del final (TrailingNode), después de la lista.
    const muestra = comoLoMuestraElEditor(guardado)
    assert.deepEqual(muestra.content.at(-1), { type: 'paragraph' })
    assert.equal(esquema.nodeFromJSON(muestra).eq(esquema.nodeFromJSON(conBlancos)), false, 'con líneas en blanco: se reemplaza')
    // Lo que ya se ve como lo guardado (con las claves del editor: target, rel…) no se reemplaza.
    const comoElEditor = esquema.nodeFromJSON(doc(p(t('Uno')), p(t('Dos')), lista('bulletList', p(t('a'))), { type: 'paragraph' }))
    assert.equal(esquema.nodeFromJSON(muestra).eq(comoElEditor), true)
    // Vacío: un párrafo.
    assert.deepEqual(comoLoMuestraElEditor(null), { type: 'doc', content: [{ type: 'paragraph' }] })
    assert.deepEqual(comoLoMuestraElEditor(doc(p(t('x')))).content.length, 1)
  })
})

describe('el diálogo del enlace con el cursor junto a uno (sin base ni DOM: un editor sin montar)', () => {
  const A = 'https://www.mupa.ar'
  const B = 'https://www.mupa.gob.ar'
  const C = 'mailto:museo@example.com'
  /** Un editor con el contenido y la selección (desde, hasta: posiciones de ProseMirror); fn(editor). */
  function conEditor(contenido, desde, hasta, fn) {
    const editor = new Editor({ element: null, extensions: EXTENSIONES, content: contenido })
    try {
      editor.commands.setTextSelection({ from: desde, to: hasta })
      return fn(editor)
    } finally {
      editor.destroy()
    }
  }
  /** Los textos con enlace, en orden: [texto, dirección, ¿negrita?]. */
  const enlacesDel = (editor) =>
    editor
      .getJSON()
      .content.flatMap((b) => b.content ?? [])
      .filter((n) => n.marks?.some((m) => m.type === 'link'))
      .map((n) => [n.text, n.marks.find((m) => m.type === 'link').attrs.href, n.marks.some((m) => m.type === 'bold')])
  const cursor = (editor) => [editor.state.selection.from, editor.state.selection.to]

  // «Más información en » ocupa 1..20 y «nuestro sitio», 20..33 (el final del párrafo).
  const alFinal = doc(p(t('Más información en '), t('nuestro sitio', enlace(A))))

  test('el cursor justo después de su última letra (Fin, o un clic a la derecha del renglón): lo reconoce y lo cambia, no agrega otro', () => {
    conEditor(alFinal, 33, 33, (editor) => {
      // Lo que pasaba: ProseMirror no lo ve ahí, porque el enlace no es inclusivo.
      assert.equal(editor.isActive('link'), false)
      assert.deepEqual(editor.getAttributes('link'), {})
      assert.deepEqual(enlaceJuntoAlCursor(editor.state), { href: A, desde: 20, hasta: 33 })
      assert.equal(hayEnlace(editor), true, 'el botón Enlace se marca')
      assert.deepEqual(enlaceParaElDialogo(editor), { href: A, conTexto: false }, 'arranca con la dirección, sin «Texto» y con «Quitar»')
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [['nuestro sitio', B, false]], 'un solo enlace, con la dirección nueva')
      assert.equal(editor.state.doc.textContent, 'Más información en nuestro sitio')
      assert.deepEqual(cursor(editor), [33, 33], 'el cursor queda donde estaba (no el enlace elegido)')
      // Y lo que se escribe después sigue quedando afuera (como al tipear: con las marcas de la posición del cursor).
      editor.commands.command(({ tr }) => Boolean(tr.insertText('. Fin')))
      assert.deepEqual(enlacesDel(editor), [['nuestro sitio', B, false]])
      assert.equal(editor.state.doc.textContent, 'Más información en nuestro sitio. Fin')
    })
  })

  test('quitarlo con el cursor al final: queda el texto, sin el enlace, y el cursor donde estaba', () => {
    conEditor(alFinal, 33, 33, (editor) => {
      quitarEnlace(editor)
      assert.deepEqual(enlacesDel(editor), [])
      assert.equal(editor.state.doc.textContent, 'Más información en nuestro sitio')
      assert.deepEqual(cursor(editor), [33, 33])
      assert.equal(hayEnlace(editor), false)
    })
  })

  test('el cursor en el medio sigue igual: lo cambia entero', () => {
    conEditor(alFinal, 26, 26, (editor) => {
      assert.equal(editor.isActive('link'), true)
      assert.deepEqual(enlaceParaElDialogo(editor), { href: A, conTexto: false })
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [['nuestro sitio', B, false]])
      assert.deepEqual(cursor(editor), [26, 26])
    })
  })

  test('el cursor justo antes de su primera letra (Inicio en un renglón que empieza con él, o pegado a él): también', () => {
    conEditor(doc(p(t('nuestro sitio', enlace(A)), t(' y la boletería'))), 1, 1, (editor) => {
      assert.equal(editor.isActive('link'), false)
      assert.equal(hayEnlace(editor), true)
      assert.deepEqual(enlaceParaElDialogo(editor), { href: A, conTexto: false })
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [['nuestro sitio', B, false]])
      assert.equal(editor.state.doc.textContent, 'nuestro sitio y la boletería')
    })
    // «Ver » ocupa 1..5: el cursor pegado a la primera letra del enlace.
    conEditor(doc(p(t('Ver '), t('el mapa', enlace(A)))), 5, 5, (editor) => {
      assert.deepEqual(enlaceJuntoAlCursor(editor.state), { href: A, desde: 5, hasta: 12 })
      quitarEnlace(editor)
      assert.deepEqual(enlacesDel(editor), [])
      assert.equal(editor.state.doc.textContent, 'Ver el mapa')
    })
  })

  test('dos enlaces distintos pegados: manda el de antes del cursor y se cambia solo ese', () => {
    conEditor(doc(p(t('uno', enlace(A)), t('dos', enlace(B)))), 4, 4, (editor) => {
      assert.deepEqual(enlaceJuntoAlCursor(editor.state), { href: A, desde: 1, hasta: 4 })
      ponerEnlace(editor, C)
      assert.deepEqual(enlacesDel(editor), [
        ['uno', C, false],
        ['dos', B, false],
      ])
    })
  })

  test('un enlace con una parte en negrita es uno solo: se cambia entero y la negrita queda', () => {
    // «Ver » 1..5, «el » 5..8, «mapa» 8..12.
    conEditor(doc(p(t('Ver '), t('el ', enlace(A)), t('mapa', enlace(A), NEGRITA))), 12, 12, (editor) => {
      assert.deepEqual(enlaceJuntoAlCursor(editor.state), { href: A, desde: 5, hasta: 12 })
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [
        ['el ', B, false],
        ['mapa', B, true],
      ])
    })
  })

  test('lejos de un enlace (o con un espacio después de él): el diálogo pide el texto y escribe uno nuevo', () => {
    // «Ver » 1..5, «el sitio» 5..13, « y más» 13..19.
    const contenido = doc(p(t('Ver '), t('el sitio', enlace(A)), t(' y más')))
    for (const posicion of [19, 14, 3]) {
      conEditor(contenido, posicion, posicion, (editor) => {
        assert.equal(enlaceJuntoAlCursor(editor.state), null, `en ${posicion}`)
        assert.equal(hayEnlace(editor), false, `en ${posicion}`)
        assert.deepEqual(enlaceParaElDialogo(editor), { href: '', conTexto: true }, `en ${posicion}`)
      })
    }
    conEditor(contenido, 19, 19, (editor) => {
      ponerEnlace(editor, C, '  la boletería ')
      assert.deepEqual(enlacesDel(editor), [
        ['el sitio', A, false],
        ['la boletería', C, false],
      ])
      assert.equal(editor.state.doc.textContent, 'Ver el sitio y másla boletería')
    })
    // Sin texto: se ve la dirección sin el esquema.
    conEditor(doc({ type: 'paragraph' }), 1, 1, (editor) => {
      assert.deepEqual(enlaceParaElDialogo(editor), { href: '', conTexto: true })
      ponerEnlace(editor, C)
      assert.deepEqual(enlacesDel(editor), [['museo@example.com', C, false]])
    })
  })

  test('con texto elegido manda lo elegido: sin enlace se lo pone; adentro de un enlace, lo cambia entero', () => {
    // «información» ocupa 5..16.
    conEditor(alFinal, 5, 16, (editor) => {
      assert.equal(enlaceJuntoAlCursor(editor.state), null)
      assert.deepEqual(enlaceParaElDialogo(editor), { href: '', conTexto: false })
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [
        ['información', B, false],
        ['nuestro sitio', A, false],
      ])
    })
    // «sitio», adentro del enlace (28..33).
    conEditor(alFinal, 28, 33, (editor) => {
      assert.deepEqual(enlaceParaElDialogo(editor), { href: A, conTexto: false })
      ponerEnlace(editor, B)
      assert.deepEqual(enlacesDel(editor), [['nuestro sitio', B, false]])
    })
  })
})

describe('los enlaces (sin base)', () => {
  test('completarEnlace (el panel): página, correo y teléfono sin el esquema; el esquema en minúsculas', () => {
    const casos = {
      'www.museo.gob.ar/visitas': 'https://www.museo.gob.ar/visitas',
      ' example.com ': 'https://example.com',
      'museo@example.com': 'mailto:museo@example.com',
      '+54 264 000-0000': 'tel:+542640000000',
      '(264) 400-0000': 'tel:2644000000',
      'tel:+54 (264) 000-0000': 'tel:+542640000000',
      'HTTPS://Example.com/Ruta': 'https://Example.com/Ruta',
      'Mailto:museo@example.com': 'mailto:museo@example.com',
      'javascript:alert(1)': 'javascript:alert(1)',
      '#_Toc1': '#_Toc1',
      'museo': 'museo',
      '12': '12',
    }
    for (const [escrito, completo] of Object.entries(casos)) assert.equal(completarEnlace(escrito), completo, escrito)
    for (const escrito of ['www.museo.gob.ar/visitas', 'museo@example.com', '+54 264 000-0000']) {
      assert.ok(esEnlacePermitido(completarEnlace(escrito)), escrito)
    }
  })

  test('completarEnlaces (antes de guardar): completa las direcciones y saca los enlaces que no sirven, sin el texto', () => {
    const editor = doc(
      p(
        t('a', enlace('www.example.com', { target: '_blank' }), NEGRITA),
        t('b', enlace('file:///C:/x.docx')),
        t('c', enlace('javascript:alert(1)')),
      ),
    )
    const r = completarEnlaces(editor)
    assert.deepEqual(r.content[0].content.map((n) => n.marks), [
      [enlace('https://www.example.com', { target: '_blank' }), NEGRITA],
      [],
      [],
    ])
    assert.deepEqual(validar(r).datos, doc(p(t('a', enlace('https://www.example.com'), NEGRITA), t('bc'))))
    assert.equal(completarEnlaces(null), null)
  })

  test('medirDocumento cuenta también lo que no pasó el esquema (mientras se escribe)', () => {
    assert.deepEqual(medirDocumento(null), { bloques: 0, caracteres: 0 })
    assert.deepEqual(medirDocumento(doc({ type: 'paragraph' }, p(t('ab')), { type: 'rara' })), { bloques: 2, caracteres: 2 })
  })
})

describe('TextoRico.jsx: el sitio dibuja el texto sin HTML crudo (sin base)', () => {
  let vite
  let TextoRico
  before(async () => {
    const { createServer } = await import('vite')
    vite = await createServer({
      root: RAIZ,
      configFile: false,
      // Su propia caché: la de node_modules/.vite es la de npm run dev.
      cacheDir: join(tmpdir(), 'mupa-vite-pruebas'),
      logLevel: 'silent',
      appType: 'custom',
      server: { middlewareMode: true, hmr: false, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    TextoRico = (await vite.ssrLoadModule('/src/components/TextoRico.jsx')).default
  })
  after(() => vite?.close())

  const html = (props) => renderToStaticMarkup(createElement(TextoRico, props))

  test('dibuja todo lo que el editor sabe hacer, con la negrita en font-bold', () => {
    assert.equal(
      html({ texto: MUSEO_MAXIMO.comoLlegar }),
      '<h2>EJEMPLO · En colectivo</h2>' +
        '<p>EJEMPLO · Las líneas de ejemplo paran a <strong class="font-bold">una cuadra del museo</strong>. ' +
        'Los fines de semana pasan cada 40 minutos.</p>' +
        '<ul><li>EJEMPLO · Línea 1, desde el centro</li><li>EJEMPLO · Línea 2, desde la terminal de ómnibus</li>' +
        '<li>EJEMPLO · Línea 3, <em>solo de lunes a viernes</em></li></ul>' +
        '<h2>EJEMPLO · En auto</h2>' +
        '<p>EJEMPLO · Hay estacionamiento en la calle. <a href="https://example.com/mapa">Ver el mapa</a><br/>' +
        'Desde la ruta de ejemplo, tomar la avenida hacia el oeste.</p>',
    )
    assert.match(html({ texto: MUSEO_MAXIMO.normas }), /^<ol><li>/)
    assert.match(html({ texto: MUSEO_MAXIMO.normas }), /<strong class="font-bold"><em>sin flash<\/em><\/strong>/)
    assert.match(html({ texto: MUSEO_MAXIMO.normas }), /<a href="mailto:museo@example\.com">museo@example\.com<\/a>/)
    assert.match(html({ texto: MUSEO_MAXIMO.normas }), /<a href="tel:\+542640000000">/)
  })

  test('el nivel de los subtítulos lo elige la página; las clases, también', () => {
    assert.match(html({ texto: MUSEO_MAXIMO.comoLlegar, nivelSubtitulo: 3 }), /^<h3>EJEMPLO · En colectivo<\/h3>/)
    assert.match(html({ texto: MUSEO_MAXIMO.comoLlegar, nivelSubtitulo: 9 }), /^<h2>/)
    const conClases = html({ texto: MUSEO_MAXIMO.comoLlegar, clases: { p: 'cp', h: 'ch', ul: 'cu', li: 'cl', a: 'ca' } })
    assert.match(conClases, /^<h2 class="ch">/)
    assert.match(conClases, /<ul class="cu"><li class="cl">/)
    assert.match(conClases, /<a href="https:\/\/example\.com\/mapa" class="ca">/)
    assert.match(html({ texto: doc(lista('orderedList', p(t('x')))), clases: { ol: 'co' } }), /^<ol class="co">/)
  })

  test('lista numerada que no empieza en 1; elemento con dos párrafos', () => {
    assert.equal(
      html({ texto: { type: 'doc', content: [{ type: 'orderedList', attrs: { start: 4 }, content: [{ type: 'listItem', content: [p(t('a')), p(t('b'))] }] }] } }),
      '<ol start="4"><li><p>a</p><p>b</p></li></ol>',
    )
  })

  test('los textos seguidos con el mismo enlace van en un solo <a>', () => {
    const texto = doc(p(t('Ver ', enlace('https://example.com')), t('el mapa', enlace('https://example.com'), NEGRITA), t(' y más')))
    assert.equal(html({ texto }), '<p><a href="https://example.com">Ver <strong class="font-bold">el mapa</strong></a> y más</p>')
  })

  test('sin HTML crudo: el texto se escapa y un enlace que no es https, http, mailto o tel sale sin el enlace', () => {
    // Escrito a mano, sin pasar por el esquema (el sitio vuelve a mirar cada enlace).
    const texto = doc(
      p(
        t('</p><script>alert(1)</script><img src=x onerror=alert(2)>'),
        t('clic', enlace('javascript:alert(3)')),
        t('dato', enlace('data:text/html,<b>x</b>')),
        t('relativo', enlace('/administracion')),
      ),
      { type: 'image', attrs: { src: 'https://example.com/x.png' } },
      { type: 'heading', attrs: { level: 2 }, content: [t('<b>x</b>')] },
    )
    const salida = html({ texto })
    assert.equal(
      salida,
      '<p>&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;clicdatorelativo</p>' +
        '<h2>&lt;b&gt;x&lt;/b&gt;</h2>',
    )
    assert.ok(!/<a|<script|<img/.test(salida))
  })

  test('null, un documento vacío o algo que no es un documento: nada', () => {
    for (const texto of [null, undefined, { type: 'doc' }, 'texto', { type: 'paragraph', content: [t('x')] }]) {
      assert.equal(html({ texto }), '', JSON.stringify(texto))
    }
  })

  test('ningún componente usa HTML crudo (el sitio, el panel ni compartido/)', () => {
    const encontrados = []
    const recorrer = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const ruta = join(dir, e.name)
        if (e.isDirectory()) recorrer(ruta)
        else if (/\.(jsx?|mjs)$/.test(e.name) && /dangerouslySetInnerHTML|\.innerHTML\s*=/.test(readFileSync(ruta, 'utf8'))) {
          encontrados.push(ruta)
        }
      }
    }
    for (const dir of ['src', 'panel/src', 'compartido']) recorrer(join(RAIZ, dir))
    assert.deepEqual(encontrados, [])
  })
})
