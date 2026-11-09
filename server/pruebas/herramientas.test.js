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
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const TOOLS = fileURLToPath(new URL('../../tools/', import.meta.url))

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
  for (const nombre of ['measure.mjs', 'vitals.mjs', 'analitica-check.mjs', 'manual.mjs', 'acordeon-dedo.mjs', 'apertura-perf.mjs']) {
    assert.ok(lanzan.includes(nombre), `no se reconoce que ${nombre} abre Chrome (${lanzan.join(', ')})`)
  }
})
