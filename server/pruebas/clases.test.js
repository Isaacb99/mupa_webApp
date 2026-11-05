// Las clases de Tailwind que se arman con una interpolación (R2-01 y R2-02 de la verificación de la Home del tablero
// "Web", 03/11/2026). El escáner de Tailwind (oxide, el que usa @tailwindcss/vite) no encuentra una clase pegada a `${`
// (`…print:hidden${abierto ? ' block' : ''}`): no sale en el CSS, pero el JSX la sigue escribiendo, así que ni el HTML
// del servidor ni las pruebas que miran las clases lo notan. Pasó dos veces: la caja del carrusel de fotos en apilado y
// la regla que esconde la barra de la fila de Novedades. Lo mismo con una clase separada por un escape dentro de una
// cadena (`'flex\nprint:hidden'`: para el navegador el salto separa, para el escáner no).
// Para cada hoja (src/index.css y panel/src/panel.css) la prueba recorre los archivos que lee Tailwind para ella (los
// de su source(".")), busca lo que el escáner encuentra solo si hay un espacio antes de cada `${` y en lugar de cada
// escape o entidad de espacio, y se queda con lo que el compilador de Tailwind reconoce como clase con esa hoja (así
// entran también las variantes propias, como apilado:). Una clase pegada DESPUÉS de una interpolación (`${a}flex`) el
// escáner sí la encuentra. Sin base y sin build.
// @tailwindcss/oxide y @tailwindcss/node se resuelven desde @tailwindcss/vite, como los resuelve el build (no son
// dependencias directas): si cambian de lugar o de forma, la prueba falla con el motivo, no se saltea ni pasa vacía.
import assert from 'node:assert/strict'
import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

// La ruta real: Scanner#files da rutas reales, y por un enlace las relativas saldrían mal.
const RAIZ = realpathSync.native(fileURLToPath(new URL('../../', import.meta.url)))
const requerir = createRequire(createRequire(join(RAIZ, 'package.json')).resolve('@tailwindcss/vite'))

// Lo que el navegador toma como espacio entre clases (TAB, LF, FF, CR y el espacio) escrito como escape de JavaScript,
// más \v, que no separa (una clase con \v está rota igual y conviene marcarla): \n, \r, \t, \f, \v, \x09, \x0A, \x0C,
// \x0D, \x20, \u0009, \u000A, \u000C, \u000D,   y \u{…} con esos códigos.
const ESCAPE = String.raw`\\(?:[nrtfv]|x(?:0[9aAcCdD]|20)|u(?:000[9aAcCdD]|0020)|u\{0*(?:[9aAcCdD]|20)\})`
// Y como entidad en un atributo JSX entre comillas (oxc, el compilador de Vite, las decodifica): &#32;, &#x20;, &#10;…
const ENTIDAD = /&#(?:[xX]0*(?:9|[aAcCdD]|20)|0*(?:9|1[023]|32));/g

/**
 * Un detector con el compilador de Tailwind de una hoja de estilos.
 * @param {string} carpeta la del `@import "tailwindcss" source(".")` de la hoja, relativa a la raíz del repo
 * @param {string} hoja relativa a la raíz del repo
 * @returns {Promise<{ archivos: string[], revisar: (texto: string, extension: string) => { clase: string, linea: number }[] }>}
 *   `archivos`: los que lee Tailwind para esa hoja (sin los .css), absolutos.
 */
async function detector(carpeta, hoja) {
  const { Scanner } = requerir('@tailwindcss/oxide')
  const { compile } = requerir('@tailwindcss/node')
  const compilador = await compile(readFileSync(join(RAIZ, hoja), 'utf8'), { base: join(RAIZ, carpeta), onDependency() {} })
  // Las mismas fuentes que usa el build cuando la hoja dice source(...): así entran también los .ts, .mjs o .html que se
  // sumen algún día. Sin source(...) el plugin lee toda la raíz de Vite, y esta prueba no sabe cuál es: que lo diga.
  if (compilador.root === null) {
    throw new Error(`${hoja} no tiene source(…): Tailwind lee toda la raíz de Vite y esta prueba no la sigue; ajustala`)
  }
  const raiz = compilador.root === 'none' ? [] : [{ ...compilador.root, negated: false }]
  const archivos = new Scanner({ sources: [...raiz, ...compilador.sources] }).files.filter((f) => extname(f) !== '.css')
  const escaner = new Scanner({})
  // build() acumula: si el candidato es una clase, el CSS crece. Cada candidato se prueba una sola vez.
  let css = compilador.build([])
  const vistas = new Map()
  const esClase = (c) => {
    if (!vistas.has(c)) {
      const antes = css
      css = compilador.build([c])
      vistas.set(c, css !== antes)
    }
    return vistas.get(c)
  }
  const revisar = (texto, extension) => {
    const tal = new Set(escaner.getCandidatesWithPositions({ content: texto, extension }).map((c) => c.candidate))
    // Separar no agrega ni saca saltos de línea, así que la línea de cada aparición se cuenta en el texto separado
    // (las posiciones del escáner vienen en unidades de JavaScript, no en bytes).
    const separado = texto
      .replaceAll('${', ' ${')
      .replace(new RegExp(ESCAPE, 'g'), ' ')
      .replace(ENTIDAD, ' ')
    const halladas = new Map()
    for (const { candidate: clase, position } of escaner.getCandidatesWithPositions({ content: separado, extension })) {
      if (tal.has(clase) || !esClase(clase)) continue
      const linea = separado.slice(0, position).split('\n').length
      halladas.set(`${linea} ${clase}`, { clase, linea })
    }
    return [...halladas.values()].sort((a, b) => a.linea - b.linea || a.clase.localeCompare(b.clase))
  }
  return { archivos, revisar }
}

/** Revisa los archivos de una carpeta: los nombres que leyó (relativos) y lo pegado, como `archivo:línea «clase»`. */
async function revisarCarpeta(carpeta, hoja) {
  const { archivos, revisar } = await detector(carpeta, hoja)
  const relativo = (f) => relative(RAIZ, f).replaceAll('\\', '/')
  const pegadas = archivos.flatMap((f) =>
    revisar(readFileSync(f, 'utf8'), extname(f).slice(1)).map(({ clase, linea }) => `${relativo(f)}:${linea} «${clase}»`),
  )
  return { leidos: archivos.map(relativo), pegadas }
}

/** El mensaje cuando la prueba falla: qué pasa y cómo salir, también si lo marcado no es una clase. */
function explicar(pegadas) {
  return [
    'Estas clases van pegadas a una interpolación o a un escape (\\n, \\t…) y el escáner de Tailwind no las encuentra:',
    'no salen en el CSS aunque el HTML las escriba.',
    ...pegadas.map((p) => `  ${p}`),
    "Si es una clase: un espacio antes de ${, o una lista con .filter(Boolean).join(' ') (como TarjetaNovedad); y en",
    'lugar de un escape, un espacio de verdad.',
    'Si no es una clase (un id, un key, un texto): separá la palabra de la interpolación (tabla-${i} en vez de',
    "table${i}); en un texto con un salto (un título de content.js), cortá la cadena antes de la palabra ('La ciencia\\n'",
    "+ 'visible') o escribí el salto dentro de un template.",
  ].join('\n')
}

describe('clases de Tailwind armadas con una interpolación', () => {
  test('control: encuentra una clase pegada a ${, a un escape o a una entidad (también con una variante propia), con su línea, y deja pasar lo que no es clase', async () => {
    const { revisar } = await detector('src', 'src/index.css')
    const ejemplo = [
      "<div className={`flex print:hidden${abierto ? ' block' : ''}`} id={`tab-${id}`}>",
      '  <a href={`mailto:${correo}`} className={`apilado:lg:w-[69.86%]${x}`}>{`h${nivel}`}</a>',
      "  <p className={`${abierto ? 'block ' : ''}text-xl`} />",
      "  <i className={'flex\\nnoscript:hidden'} />",
      '  <b className="flex&#32;noscript:grid" />',
      "  <u className={`md:z-[9]${a}`} /><s className={'flex\\u000Az-[9]'} />",
      "  <q className={`z-[9]${b}`} />",
      '</div>',
    ].join('\n')
    assert.deepEqual(revisar(ejemplo, 'jsx'), [
      { clase: 'print:hidden', linea: 1 },
      { clase: 'apilado:lg:w-[69.86%]', linea: 2 },
      { clase: 'noscript:hidden', linea: 4 },
      { clase: 'noscript:grid', linea: 5 },
      { clase: 'md:z-[9]', linea: 6 },
      { clase: 'z-[9]', linea: 6 },
      { clase: 'z-[9]', linea: 7 },
    ])
  })

  test('ninguna clase del sitio (src/) va pegada a ${ ni a un escape: Tailwind no la encontraría y no saldría en el CSS', async () => {
    const { leidos, pegadas } = await revisarCarpeta('src', 'src/index.css')
    // Si Tailwind no devolviera archivos, la prueba pasaría sin revisar nada.
    assert.ok(leidos.includes('src/main.jsx'), `Tailwind no lee src/main.jsx (${leidos.length} archivos)`)
    assert.deepEqual(pegadas, [], explicar(pegadas))
  })

  test('ninguna del panel (panel/src) tampoco', async () => {
    const { leidos, pegadas } = await revisarCarpeta('panel/src', 'panel/src/panel.css')
    assert.ok(leidos.includes('panel/src/main.jsx'), `Tailwind no lee panel/src/main.jsx (${leidos.length} archivos)`)
    assert.deepEqual(pegadas, [], explicar(pegadas))
  })
})
