// Las herramientas de verificación de tools/ que abren Chrome no dejan salir nada de esta máquina: le pasan a Chrome
// --host-resolver-rules (CLAUDE.md, Verificación: nada sale de 127.0.0.1). El hueco apareció dos veces con el <iframe>
// del mapa de Visitas y Contacto, que cae dentro del margen de la carga diferida y se pide al cargar la página: salía a
// www.google.com desde analitica-check.mjs y vitals.mjs (COD-02 de la verificación de Visitas, 03/11/2026) y desde
// measure.mjs (VR1-01 de la re-verificación, 04/11/2026). Una herramienta nueva que abra Chrome sin la regla hace fallar
// esta prueba. Las que miden un sitio cualquiera (measure, vitals, acordeon-dedo y apertura-perf) la ponen solo con una
// URL local: contra mupa.ar o Render sale todo, a propósito. Sin base, sin Chrome y sin build: lee el código. Que la
// regla funcione (lo de afuera no resuelve y la página local sí carga, también con 127.0.0.1, localhost y [::1]) se
// probó en Chrome headless con measure.mjs tal cual (tools/salida/e6-visitas/corr-2/herr/measure-local.mjs).
// Abre Chrome la que lo lanza con child_process (spawn, spawnSync, execFile, exec…, importado de cualquier forma) o con
// Playwright o Puppeteer, y nombra a Chrome (CHROME_PATH o chrome.exe). Hasta el cierre de E6.3 (VIS-TOOL-02,
// 09/11/2026) solo reconocía spawn(: una que lo abriera con execFile no se veía. La prueba de abajo comprueba con
// ejemplos que la detección los reconoce.
//
// Desde la corrección de la tanda 1 (16/11/2026), dos guardas más, también leyendo los archivos como texto (sin base
// ni navegador), cada una con su control (con ejemplos, la prueba comprueba que lo roto la hace fallar):
// - La guarda del relleno de tools/rutas-check.mjs (VH-06): la herramienta busca en el sitio una lista de marcas
//   escrita a mano (MARCAS_DE_RELLENO) y nada la ataba a lo que las pone. Todo hueco entre corchetes de src/content.js
//   (un literal '[…]', que va junto a su comentario «RELLENO DEL TABLERO:») tiene que estar en esa lista, y la
//   constante con que marcan lo suyo el museo de ejemplo (server/museo.js) y la semilla (server/db/semillas/ejemplo.js)
//   tiene que empezar con una marca de la lista. Sin eso, un hueco nuevo («[Foto pendiente]») llegaba al sitio público
//   sin que rutas-check lo viera.
// - El «seis» del panel y del manual (VPI-02): la ayuda de la pantalla Novedades del panel y el manual dicen en letras
//   cuántas novedades salen en la página principal y en Divulgación, que es NOVEDADES_EN_LA_HOME de
//   server/contenido-publico.js (el panel no puede importarla). La prueba la importa (carga sequelize, sin conectarse
//   a nada) y comprueba que los dos digan ese número, y el manual, el ordinal que sigue («la séptima»).
// Y desde el 19/11/2026 (RT-02, decidido ese día), cómo cuenta rutas-check las marcas: la prueba corre el tramo de la
// búsqueda de tools/rutas-check.mjs con un HTML armado acá. «ejemplo ·» y «prueba ·» en minúsculas cuentan solo al
// comienzo de un texto (a mitad de una frase son contenido real), y escritas tal cual, siempre.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { NOVEDADES_EN_LA_HOME } from '../contenido-publico.js'

const TOOLS = fileURLToPath(new URL('../../tools/', import.meta.url))
const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const leer = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8')

/** El código sin los renglones de comentario: la regla tiene que estar en el código, no nombrada en un comentario. */
const sinComentarios = (codigo) => codigo.replace(/^\s*\/\/.*$/gm, '')

/**
 * ¿Este código abre Chrome? Lo lanza con child_process (como sea que lo importe: spawn, execFile, exec, fork…) o con
 * Playwright o Puppeteer, y lo nombra. Las expresiones para measure.mjs (collage-check.js, carrusel-check.js…) no
 * lanzan nada: corren adentro del Chrome de measure.mjs.
 */
function abreChrome(codigo) {
  const lanza = /['"](?:node:)?child_process['"]/.test(codigo) || /['"](?:playwright|puppeteer)[\w/-]*['"]/.test(codigo)
  return lanza && /CHROME_PATH|chrome\.exe/.test(codigo)
}

/** Lo que le falta a una herramienta que abre Chrome, o null. */
function problemaDeRegla(codigo) {
  if (!/--host-resolver-rules=/.test(codigo)) return 'abre Chrome sin --host-resolver-rules'
  // MAP * vale también para las direcciones IP: la que trata [::1] como local y no la excluye (como ::1, sin corchetes)
  // no carga una URL [::1] (vitals.mjs, entre la ronda 1 y la 2 de la corrección de Visitas).
  if (/MAP \* ~NOTFOUND/.test(codigo) && codigo.includes("'[::1]'") && !/MAP \* ~NOTFOUND[^'\n]*EXCLUDE ::1\b/.test(codigo)) {
    return 'trata [::1] como local y su regla no lo excluye'
  }
  return null
}

test('la detección reconoce las formas de abrir Chrome y no confunde lo que no lo abre (VIS-TOOL-02)', () => {
  const CHROME = "const ruta = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'\n"
  const abren = {
    spawn: "import { spawn } from 'node:child_process'\n" + CHROME + 'spawn(ruta, [])',
    execFile: "import { execFile } from 'node:child_process'\n" + CHROME + 'execFile(ruta, [])',
    'exec como método': "import * as cp from 'child_process'\n" + CHROME + 'cp.exec(`"${ruta}" --headless=new`)',
    spawnSync: "const { spawnSync } = require('node:child_process')\n" + CHROME + 'spawnSync(ruta, [])',
    'import dinámico': CHROME + "const { execFileSync } = await import('node:child_process')\nexecFileSync(ruta, [])",
    puppeteer: "import puppeteer from 'puppeteer-core'\nawait puppeteer.launch({ executablePath: process.env.CHROME_PATH })",
    playwright: "import { chromium } from 'playwright'\nawait chromium.launch({ executablePath: process.env.CHROME_PATH })",
  }
  for (const [forma, codigo] of Object.entries(abren)) {
    assert.ok(abreChrome(codigo), `no reconoce ${forma}`)
    assert.equal(problemaDeRegla(codigo), 'abre Chrome sin --host-resolver-rules', forma)
  }
  // Con la regla, y con [::1] excluido cuando lo trata como local, no le falta nada.
  const conRegla = `${abren.execFile}\n['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE ::1, EXCLUDE localhost']\n['127.0.0.1', '[::1]']`
  assert.equal(problemaDeRegla(conRegla), null)
  assert.match(problemaDeRegla(conRegla.replace(', EXCLUDE ::1', '')), /\[::1\]/)
  // No abren Chrome: una expresión regular (/x/.exec(…)), un proceso que no es Chrome, y Chrome nombrado sin lanzarlo.
  const noAbren = {
    'regex.exec': CHROME + 'const m = /a(b)/.exec(texto)',
    'otro proceso': "import { execFile } from 'node:child_process'\nexecFile('node', ['--version'])",
    'solo el nombre': CHROME + 'console.log(ruta)',
  }
  for (const [caso, codigo] of Object.entries(noAbren)) assert.ok(!abreChrome(codigo), caso)
})

// El scroll horizontal de la página se mide contra document.documentElement.clientWidth y no contra innerWidth: con el
// viewport de celular que emula measure.mjs debajo de 768 px (mobile: true), innerWidth crece hasta el ancho del
// contenido y "scrollWidth > innerWidth" nunca da verdadero (VDIS-02 de la verificación del cierre de E6.3, 09/11/2026:
// las recetas no podían ver un desborde debajo de 768 px).
const COMPARA_CON_INNERWIDTH = /scrollWidth\s*>=?\s*(?:window\.)?innerWidth\b|\binnerWidth\s*<=?\s*[\w.]*scrollWidth/

test('la detección de la comparación con innerWidth (VDIS-02)', () => {
  for (const malo of [
    'document.documentElement.scrollWidth > innerWidth',
    'document.documentElement.scrollWidth >= window.innerWidth',
    'innerWidth < document.documentElement.scrollWidth',
  ]) assert.match(malo, COMPARA_CON_INNERWIDTH, malo)
  for (const bueno of [
    'document.documentElement.scrollWidth > document.documentElement.clientWidth',
    'fila.scrollWidth - fila.clientWidth > 1',
    'const ancho = innerWidth',
  ]) assert.doesNotMatch(bueno, COMPARA_CON_INNERWIDTH, bueno)
})

test('las recetas de tools/ miden el scroll horizontal contra clientWidth, no contra innerWidth (VDIS-02)', () => {
  const comparan = []
  for (const nombre of readdirSync(TOOLS).sort()) {
    if (!/\.m?js$/.test(nombre)) continue
    const codigo = sinComentarios(readFileSync(join(TOOLS, nombre), 'utf8'))
    assert.doesNotMatch(codigo, COMPARA_CON_INNERWIDTH, `${nombre} compara el scroll horizontal con innerWidth`)
    if (/documentElement\.scrollWidth\s*>\s*document\.documentElement\.clientWidth/.test(codigo)) comparan.push(nombre)
  }
  // Si esto falla, las recetas cambiaron de forma de medirlo y la prueba dejó de verlas.
  for (const nombre of ['carrusel-check.js', 'collage-check.js', 'areas-check.js', 'mosaico-check.js', 'parallax-ejes.js', 'parallax-expr.js']) {
    assert.ok(comparan.includes(nombre), `${nombre} ya no mide el scroll horizontal de la página (${comparan.join(', ')})`)
  }
})

test('toda herramienta de tools/ que abre Chrome le pasa --host-resolver-rules (VR1-01)', () => {
  const lanzan = []
  for (const nombre of readdirSync(TOOLS).sort()) {
    if (!/\.m?js$/.test(nombre)) continue
    const codigo = sinComentarios(readFileSync(join(TOOLS, nombre), 'utf8'))
    if (!abreChrome(codigo)) continue
    lanzan.push(nombre)
    const problema = problemaDeRegla(codigo)
    assert.equal(problema, null, `${nombre} ${problema}`)
  }
  // Si esto falla, cambió cómo se abre Chrome y la prueba dejó de ver a las herramientas que lo abren.
  for (const nombre of ['measure.mjs', 'vitals.mjs', 'analitica-check.mjs', 'manual.mjs', 'acordeon-dedo.mjs', 'apertura-perf.mjs', 'menu-check.mjs', 'mapa-check.mjs']) {
    assert.ok(lanzan.includes(nombre), `no se reconoce que ${nombre} abre Chrome (${lanzan.join(', ')})`)
  }
})

// ---------- La guarda del relleno de tools/rutas-check.mjs (VH-06 de la verificación de la tanda 1, 16/11/2026)

/** MARCAS_DE_RELLENO de tools/rutas-check.mjs, leída del código (la herramienta es un script: no exporta nada). */
function marcasDeRelleno(codigo) {
  const lista = /^const MARCAS_DE_RELLENO = \[(.*)\]$/m.exec(codigo)?.[1]
  assert.ok(lista, 'no encuentro «const MARCAS_DE_RELLENO = […]», en un renglón, en tools/rutas-check.mjs')
  return [...lista.matchAll(/'([^']*)'/g)].map((m) => m[1])
}

// Cuántos renglones más abajo de su comentario «RELLENO DEL TABLERO:» puede estar un hueco para ser «el de al lado»
// (hoy, hasta 19: los tres documentales de El Museo).
const CERCA = 30
// Literales entre corchetes de src/content.js que NO son un hueco de relleno (hoy, ninguno).
const NO_SON_HUECOS = new Set([])

/**
 * Los huecos de un content.js: los textos del código que son solo algo entre corchetes ('[—]', "[Rol]"), cada uno
 * con su renglón y si tiene arriba, cerca, un comentario «RELLENO DEL TABLERO:». Lo que está en un renglón de
 * comentario no cuenta (los comentarios nombran los huecos): ni un renglón «//» ni uno de adentro de un comentario de
 * bloque («/* … *\/» o «/** … *\/», que pueden ocupar varios renglones; lo que sigue en el renglón después del cierre sí
 * cuenta). Hasta la ronda 3 de la corrección de la tanda 1 (RT-04 de la re-verificación, 17/11/2026) solo salteaba
 * los «//»: un JSDoc que nombrara un hueco entre comillas hacía fallar la prueba sin motivo.
 */
function huecosDe(codigo) {
  const huecos = []
  let comentario = -Infinity
  let enBloque = false
  for (const [i, renglonEntero] of codigo.split('\n').entries()) {
    let renglon = renglonEntero
    if (enBloque || /^\s*\/\*/.test(renglon)) {
      const desde = enBloque ? 0 : renglon.indexOf('/*') + 2
      const cierre = renglon.indexOf('*/', desde)
      if (renglon.slice(0, cierre < 0 ? undefined : cierre).includes('RELLENO DEL TABLERO:')) comentario = i
      enBloque = cierre < 0
      if (enBloque) continue
      renglon = renglon.slice(cierre + 2)
    }
    if (/^\s*\/\//.test(renglon)) {
      if (renglon.includes('RELLENO DEL TABLERO:')) comentario = i
      continue
    }
    for (const m of renglon.matchAll(/(['"`])(\[[^\]'"`]{1,80}\])\1/g)) {
      huecos.push({ hueco: m[2], renglon: i + 1, conComentario: i - comentario <= CERCA })
    }
  }
  return huecos
}

/** La constante con que un archivo marca su contenido de ejemplo: const EJEMPLO = '…'. */
const constanteDeEjemplo = (codigo) => /^const EJEMPLO = '([^']*)'$/m.exec(codigo)?.[1] ?? null

/** Lo que la guarda de rutas-check no vería: una lista de problemas, vacía si está todo atado. */
function problemasDeLaGuarda({ marcas, contenido, deEjemplo }) {
  const problemas = []
  const vistos = new Set()
  for (const { hueco, renglon, conComentario } of huecosDe(contenido)) {
    if (marcas.includes(hueco) || NO_SON_HUECOS.has(hueco) || vistos.has(hueco)) continue
    vistos.add(hueco)
    problemas.push(
      conComentario
        ? `src/content.js, renglón ${renglon}: el hueco «${hueco}» es relleno (está junto a un «RELLENO DEL TABLERO:») y no está en MARCAS_DE_RELLENO de tools/rutas-check.mjs: sumalo ahí, o rutas-check no lo ve en el sitio`
        : `src/content.js, renglón ${renglon}: «${hueco}» es un texto entre corchetes sin su comentario «RELLENO DEL TABLERO:» cerca: si es relleno, ponele el comentario (DV10 e IN4) y sumalo a MARCAS_DE_RELLENO de tools/rutas-check.mjs; si no lo es, a NO_SON_HUECOS de esta prueba`,
    )
  }
  for (const [archivo, codigo] of Object.entries(deEjemplo)) {
    const valor = constanteDeEjemplo(codigo)
    if (valor === null) problemas.push(`${archivo}: no encuentro «const EJEMPLO = '…'» (con lo que marca su contenido de ejemplo)`)
    else if (!marcas.some((marca) => valor.startsWith(marca))) {
      problemas.push(`${archivo}: su contenido de ejemplo empieza con «${valor}», que no empieza con ninguna marca de MARCAS_DE_RELLENO de tools/rutas-check.mjs (${marcas.join(', ')})`)
    }
  }
  return problemas
}

test('el control de la guarda del relleno: un hueco sin marca o una constante de ejemplo cambiada la hacen fallar (VH-06)', () => {
  const marcas = ['[—]', '[Rol]', 'EJEMPLO ·']
  const deEjemplo = { 'server/museo.js': "const EJEMPLO = 'EJEMPLO · '\n" }
  const contenido = [
    "export const elMuseo = {",
    "  // RELLENO DEL TABLERO: las cifras. El tablero dice \"200\"; va \"[—]\" y, en el equipo, \"[Otro hueco]\".",
    "  cifras: [{ cifra: '[—]', rotulo: 'Piezas' }],",
    "  equipo: [{ nombre: 'Ana', rol: \"[Rol]\" }],",
    "}",
  ].join('\n')
  // Todo atado: los dos huecos están en la lista y lo nombrado en el comentario no cuenta.
  assert.deepEqual(problemasDeLaGuarda({ marcas, contenido, deEjemplo }), [])
  assert.deepEqual(huecosDe(contenido).map((h) => [h.hueco, h.renglon, h.conComentario]), [['[—]', 3, true], ['[Rol]', 4, true]])
  // Sin una marca en la lista (como si se la sacara de rutas-check.mjs), su hueco aparece.
  const sinRol = problemasDeLaGuarda({ marcas: ['[—]', 'EJEMPLO ·'], contenido, deEjemplo })
  assert.equal(sinRol.length, 1)
  assert.match(sinRol[0], /renglón 4: el hueco «\[Rol\]» es relleno/)
  // Un hueco nuevo, con su comentario o sin él (ahí lo dice): los dos fallan, una vez cada uno.
  const nuevo = `${contenido}\n// RELLENO DEL TABLERO: la foto.\nexport const foto = { alt: '[Foto pendiente]', otra: '[Foto pendiente]' }`
  assert.match(problemasDeLaGuarda({ marcas, contenido: nuevo, deEjemplo }).join('\n'), /^src\/content\.js, renglón 7: el hueco «\[Foto pendiente\]» es relleno.*$/)
  const lejos = `${contenido}\n${'\n'.repeat(CERCA + 1)}export const algo = { titulo: \`[Sin título]\` }`
  assert.match(problemasDeLaGuarda({ marcas, contenido: lejos, deEjemplo }).join('\n'), /^src\/content\.js, renglón \d+: «\[Sin título\]» es un texto entre corchetes sin su comentario.*$/)
  // No son huecos: una clase de Tailwind, un texto que tiene corchetes adentro y un arreglo.
  const noSon = "const a = { clase: 'w-[10rem]', texto: 'Sala [A] del museo', lista: ['a', 'b'] }"
  assert.deepEqual(huecosDe(noSon), [])
  // Lo que está adentro de un comentario de bloque no cuenta, en uno o en varios renglones (RT-04, 17/11/2026: un JSDoc
  // que nombraba «'[Nombre]'» hacía fallar la guarda); lo que sigue al cierre, en el mismo renglón, sí; y un comentario
  // de bloque «RELLENO DEL TABLERO:» vale como el de «//».
  const enBloques = [
    '/**',
    " * El formato de un hueco: '[Nombre]', con su comentario al lado.",
    ' */',
    "/* '[En un renglón]' */ export const tras = '[Tras el cierre]'",
    '/* RELLENO DEL TABLERO: el texto.',
    " * sigue el comentario '[Adentro]'",
    " */ export const relleno = '[Con comentario]'",
  ].join('\n')
  assert.deepEqual(huecosDe(enBloques).map((h) => [h.hueco, h.renglon, h.conComentario]), [
    ['[Tras el cierre]', 4, false],
    ['[Con comentario]', 7, true],
  ])
  // La constante de ejemplo: si cambia y deja de empezar con una marca, o si no está.
  assert.match(problemasDeLaGuarda({ marcas, contenido, deEjemplo: { 'server/museo.js': "const EJEMPLO = 'Ejemplo: '\n" } })[0], /empieza con «Ejemplo: »/)
  assert.match(problemasDeLaGuarda({ marcas, contenido, deEjemplo: { 'server/museo.js': "const OTRA = 'x'\n" } })[0], /no encuentro «const EJEMPLO/)
  assert.match(problemasDeLaGuarda({ marcas: ['[—]', '[Rol]'], contenido, deEjemplo })[0], /no empieza con ninguna marca/)
  // Y la lista se lee del código de la herramienta.
  assert.deepEqual(marcasDeRelleno("const X = 1\nconst MARCAS_DE_RELLENO = ['[—]', 'EJEMPLO ·']\n"), ['[—]', 'EJEMPLO ·'])
  assert.throws(() => marcasDeRelleno('const MARCAS = []'), /no encuentro/)
})

test('la guarda del relleno de rutas-check: los huecos de content.js y el contenido de ejemplo llevan una marca que busca (VH-06)', () => {
  const marcas = marcasDeRelleno(leer('tools', 'rutas-check.mjs'))
  assert.ok(marcas.length > 0, 'MARCAS_DE_RELLENO está vacía')
  const problemas = problemasDeLaGuarda({
    marcas,
    contenido: leer('src', 'content.js'),
    deEjemplo: {
      'server/museo.js': leer('server', 'museo.js'),
      'server/db/semillas/ejemplo.js': leer('server', 'db', 'semillas', 'ejemplo.js'),
    },
  })
  assert.deepEqual(problemas, [], problemas.join('\n'))
})

// ---------- Cómo cuenta rutas-check las marcas (RT-02 de la re-verificación de la tanda 1, decidido el 19/11/2026)
// «Ejemplo ·» y «prueba ·» en minúsculas cuentan solo al COMIENZO de un texto: un contenido real que las tiene a mitad
// de una frase («Un buen ejemplo · de divulgación», «A prueba · de agua») no es una marca. Hasta ese día contaban, y en
// el corte del dominio eran una falla por página (de 8 piezas reales, 4 marcadas: 11 fallas en vez de 2). Las
// escritas tal cual («EJEMPLO ·», «PRUEBA ·») cuentan siempre. La herramienta es un script (no exporta nada): la prueba
// toma de su código el tramo de la búsqueda, de «const MARCAS_DE_RELLENO» a «const textoDeMarcas» (sin el resto: ese
// tramo no usa nada de afuera), y lo corre con un HTML armado acá. Su control: con la rutas-check de antes del arreglo,
// esta prueba falla (tools/salida/tanda-1/decisiones-19/impl/, no versionado).

/** La búsqueda de las marcas de tools/rutas-check.mjs, tomada de su código: { marcas(html), MARCAS }. */
function busquedaDeMarcas(codigo) {
  const desde = codigo.indexOf('\nconst MARCAS_DE_RELLENO = [')
  const hasta = codigo.indexOf('\nconst textoDeMarcas = ', desde)
  assert.ok(desde >= 0 && hasta > desde, 'no encuentro en tools/rutas-check.mjs el tramo de «const MARCAS_DE_RELLENO = [» a «const textoDeMarcas =»')
  const { marcasDeRelleno: buscar, MARCAS_DE_RELLENO: MARCAS } = new Function(`${codigo.slice(desde, hasta)}\nreturn { marcasDeRelleno, MARCAS_DE_RELLENO }`)()
  return { marcas: (html) => Object.fromEntries(buscar(html)), MARCAS }
}

test('rutas-check: «ejemplo ·» y «prueba ·» en minúsculas cuentan solo al comienzo de un texto; las mayúsculas, siempre (RT-02)', () => {
  const { marcas, MARCAS } = busquedaDeMarcas(leer('tools', 'rutas-check.mjs'))
  assert.ok(MARCAS.includes('EJEMPLO ·') && MARCAS.includes('PRUEBA ·'), MARCAS.join(', '))
  // Contenido real, con las dos a mitad de una frase: en el <title>, las etiquetas para compartir, el JSON-LD, lo que
  // se ve (con formato: una negrita, un enlace) y el estado. Ninguna cuenta.
  const reales = [
    '<title>Un buen ejemplo · de divulgación · MuPa</title>',
    '<meta property="og:title" content="A prueba · de agua: cómo se guardan los fósiles">',
    '<script type="application/ld+json">{"headline":"Una muestra a prueba · del tiempo"}</script>',
    '<h1 class="x">A prueba · de agua</h1>',
    '<p>Este taller es un <strong class="font-bold">buen ejemplo</strong> · de cómo se dibuja un dinosaurio.</p>',
    '<p>Más información en <a href="https://example.com/prueba">la página de la prueba</a> · inscripción abierta.</p>',
    '<p>Por ejemplo · los cinodontes tenían pelo.</p>',
    '<p>Por ejemplo&nbsp;&middot; los cinodontes, y a prueba &#183; de agua.</p>',
    '<img alt="Un buen ejemplo · de restauración" src="/x.webp">',
    '<p>El contraejemplo · de Darwin y la contraprueba · del laboratorio.</p>',
    '<script id="estado" type="application/json">{"titulo":"Un buen ejemplo · de divulgación","resumen":"Fue a prueba · de todo"}</script>',
  ]
  for (const html of reales) assert.deepEqual(marcas(html), {}, html)
  assert.deepEqual(marcas(reales.join('\n')), {})
  // Las marcas de verdad, al comienzo de un texto: un título, un párrafo, el enlace de una tarjeta, un atributo, un
  // valor del JSON, entre comillas, con entidades o partida por el formato. Cuentan, una vez cada aparición.
  const casos = [
    ['<title>prueba · borrar después · MuPa</title>', { 'PRUEBA ·': 1 }],
    ['<h1 class="x">Ejemplo · Huellas del Triásico</h1>', { 'EJEMPLO ·': 1 }],
    ['<h3 class="x"><a href="/novedades/x" class="y">prueba · borrar después</a></h3>', { 'PRUEBA ·': 1 }],
    ['<meta property="og:title" content="prueba · borrar después">', { 'PRUEBA ·': 1 }],
    ['<img alt="Ejemplo · foto de la fachada" src="/x.webp">', { 'EJEMPLO ·': 1 }],
    ['<script type="application/ld+json">{"headline":"Ejemplo · charla","name":"prueba · otra"}</script>', { 'EJEMPLO ·': 1, 'PRUEBA ·': 1 }],
    ['<p>  prueba · con espacios adelante</p>', { 'PRUEBA ·': 1 }],
    ['<p>“Ejemplo · entre comillas”, «prueba · también» y ‘ejemplo · simples’</p>', { 'EJEMPLO ·': 2, 'PRUEBA ·': 1 }],
    ['<p><strong class="font-bold">Ejemplo</strong> · partida por la negrita</p>', { 'EJEMPLO ·': 1 }],
    ['<p>Ejemplo&nbsp;&#183; con entidades</p><p>prueba &middot; otra</p>', { 'EJEMPLO ·': 1, 'PRUEBA ·': 1 }],
    // Escritas tal cual, en mayúsculas: también a mitad de una frase, en un atributo y con una entidad.
    ['<p>Un texto con EJEMPLO · en el medio y PRUEBA &middot; con entidad.</p>', { 'EJEMPLO ·': 1, 'PRUEBA ·': 1 }],
    ['<img alt="Foto PRUEBA · de la sala" src="/x.webp">', { 'PRUEBA ·': 1 }],
  ]
  for (const [html, esperado] of casos) assert.deepEqual(marcas(html), esperado, html)
  // « MuPa»: el final del <title> de toda página interna. Una novedad que se llama «Prueba» o «Ejemplo» no es una marca;
  // escrita tal cual, en mayúsculas, sí (como siempre). Pegado a otra palabra («MuPaleo») no es el final del título.
  assert.deepEqual(marcas('<title>Prueba · MuPa</title><meta property="og:title" content="Ejemplo · MuPa">'), {})
  assert.deepEqual(marcas('<title>PRUEBA · MuPa</title>'), { 'PRUEBA ·': 1 })
  assert.deepEqual(marcas('<p>Ejemplo · MuPaleo</p>'), { 'EJEMPLO ·': 1 })
  // Una marca no se arma con el final de un párrafo y el comienzo del siguiente.
  assert.deepEqual(marcas('<p>Un buen ejemplo</p><p>· primer punto</p>'), {})
  // Los huecos de content.js, tal cual, en cualquier lugar.
  assert.deepEqual(marcas('<dd>[—]</dd><p>El cargo: [Rol] y [Nombre del integrante].</p>'), { '[—]': 1, '[Nombre del integrante]': 1, '[Rol]': 1 })
  // Y si el tramo cambia de forma, la prueba lo dice (no pasa callada).
  assert.throws(() => busquedaDeMarcas('const OTRA = 1'), /no encuentro en tools\/rutas-check\.mjs el tramo/)
})

// ---------- El «seis» del panel y del manual (VPI-02 de la verificación de la tanda 1, 16/11/2026)

// El número en letras y el ordinal del que sigue («las últimas seis»; «cuando publicás la séptima»). Si
// NOVEDADES_EN_LA_HOME pasa a un número que no está acá, se suma a esta tabla.
const EN_LETRAS = {
  2: ['dos', 'tercera'],
  3: ['tres', 'cuarta'],
  4: ['cuatro', 'quinta'],
  5: ['cinco', 'sexta'],
  6: ['seis', 'séptima'],
  7: ['siete', 'octava'],
  8: ['ocho', 'novena'],
  9: ['nueve', 'décima'],
  10: ['diez', 'undécima'],
  12: ['doce', 'decimotercera'],
}

/** El texto de un HTML, sin las etiquetas y en un renglón. */
const textoDe = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')

/** Lo que no coincide entre la constante y lo que dicen el panel y el manual: una lista, vacía si dicen lo mismo. */
function problemasDelNumero(numero, panel, manual) {
  const letras = EN_LETRAS[numero]
  if (!letras) return [`NOVEDADES_EN_LA_HOME vale ${numero} y la tabla EN_LETRAS de esta prueba no lo tiene: sumalo`]
  const [cardinal, ordinal] = letras
  const problemas = []
  const enElPanel = /salen las últimas (\p{L}+) publicadas/u.exec(sinComentarios(panel).replace(/\s+/g, ' '))?.[1]
  if (!enElPanel) problemas.push('panel/src/pantallas/Novedades.jsx: no encuentro «salen las últimas … publicadas» en la ayuda (si la frase cambió, cambiá esta prueba)')
  else if (enElPanel !== cardinal) problemas.push(`panel/src/pantallas/Novedades.jsx dice «las últimas ${enElPanel} publicadas» y NOVEDADES_EN_LA_HOME vale ${numero} («${cardinal}»)`)
  const texto = textoDe(manual)
  const enElManual = /[Ll]as últimas (\p{L}+) novedades publicadas salen también en la página principal/u.exec(texto)?.[1]
  if (!enElManual) problemas.push('docs/manual/manual.html: no encuentro «Las últimas … novedades publicadas salen también en la página principal» (si la frase cambió, cambiá esta prueba)')
  else if (enElManual !== cardinal) problemas.push(`docs/manual/manual.html dice «las últimas ${enElManual}» y NOVEDADES_EN_LA_HOME vale ${numero} («${cardinal}»)`)
  const laQueSigue = /[Cc]uando publicás la (\p{L}+),/u.exec(texto)?.[1]
  if (!laQueSigue) problemas.push('docs/manual/manual.html: no encuentro «Cuando publicás la …,» (si la frase cambió, cambiá esta prueba)')
  else if (laQueSigue !== ordinal) problemas.push(`docs/manual/manual.html dice «cuando publicás la ${laQueSigue}» y con ${numero} en la página principal tiene que decir «la ${ordinal}»`)
  return problemas
}

test('el control del «seis»: con otro número en la constante, o con otro en el panel o en el manual, falla (VPI-02)', () => {
  const panel = "// las últimas ocho publicadas (un comentario no cuenta)\n<p>\n  En la página principal y en Divulgación salen las últimas seis publicadas; una actividad…\n</p>"
  const manual = '<p>Las <strong>últimas seis</strong> novedades publicadas salen también en la <strong>página principal</strong> y\n en <strong>Divulgación</strong>. Cuando publicás la séptima, la más vieja deja de salir ahí.</p>'
  assert.deepEqual(problemasDelNumero(6, panel, manual), [])
  // La constante cambia y los textos quedan viejos: los tres lugares.
  assert.equal(problemasDelNumero(5, panel, manual).length, 3)
  assert.match(problemasDelNumero(5, panel, manual).join('\n'), /«cinco»[\s\S]*«cinco»[\s\S]*«la sexta»/)
  // Uno solo de los textos cambia.
  assert.match(problemasDelNumero(6, panel.replace('seis', 'cinco'), manual)[0], /Novedades\.jsx dice «las últimas cinco publicadas»/)
  assert.match(problemasDelNumero(6, panel, manual.replace('seis', 'ocho'))[0], /manual\.html dice «las últimas ocho»/)
  assert.match(problemasDelNumero(6, panel, manual.replace('séptima', 'sexta'))[0], /tiene que decir «la séptima»/)
  // La frase ya no está, o el número no está en la tabla: también falla (no pasa callada).
  assert.equal(problemasDelNumero(6, '<p>Otra ayuda.</p>', '<p>Otro manual.</p>').length, 3)
  assert.match(problemasDelNumero(11, panel, manual)[0], /la tabla EN_LETRAS de esta prueba no lo tiene/)
})

test('el panel y el manual dicen en letras NOVEDADES_EN_LA_HOME, y el manual, el ordinal que sigue (VPI-02)', () => {
  assert.ok(Number.isInteger(NOVEDADES_EN_LA_HOME), `NOVEDADES_EN_LA_HOME no es un entero: ${NOVEDADES_EN_LA_HOME}`)
  const problemas = problemasDelNumero(NOVEDADES_EN_LA_HOME, leer('panel', 'src', 'pantallas', 'Novedades.jsx'), leer('docs', 'manual', 'manual.html'))
  assert.deepEqual(problemas, [], problemas.join('\n'))
})
