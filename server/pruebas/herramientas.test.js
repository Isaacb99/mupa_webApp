// Las herramientas de verificación de tools/ que abren Chrome no dejan salir nada de esta máquina: le pasan a Chrome
// --host-resolver-rules (CLAUDE.md, Verificación: nada sale de 127.0.0.1). El hueco apareció dos veces con el <iframe>
// del mapa de Visitas y Contacto, que cae dentro del margen de la carga diferida y se pide al cargar la página: salía a
// www.google.com desde analitica-check.mjs y vitals.mjs (COD-02 de la verificación de Visitas, 03/11/2026) y desde
// measure.mjs (VR1-01 de la re-verificación, 04/11/2026). Una herramienta nueva que abra Chrome sin la regla hace fallar
// esta prueba. Las que miden un sitio cualquiera (measure, vitals, acordeon-dedo y apertura-perf) la ponen solo con una
// URL local: contra mupa.ar o Render sale todo, a propósito. Sin base, sin Chrome y sin build: lee el código. Que la
// regla funcione (lo de afuera no resuelve y la página local sí carga, también con 127.0.0.1, localhost y [::1]) se
// probó en Chrome headless con measure.mjs tal cual (tools/salida/e6-visitas/corr-2/herr/measure-local.mjs).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const TOOLS = fileURLToPath(new URL('../../tools/', import.meta.url))

test('toda herramienta de tools/ que abre Chrome le pasa --host-resolver-rules (VR1-01)', () => {
  const lanzan = []
  for (const nombre of readdirSync(TOOLS).sort()) {
    if (!/\.m?js$/.test(nombre)) continue
    // Sin los renglones de comentario: la regla tiene que estar en el código, no nombrada en un comentario.
    const codigo = readFileSync(join(TOOLS, nombre), 'utf8').replace(/^\s*\/\/.*$/gm, '')
    // Abre Chrome: lo lanza con spawn. Las expresiones para measure.mjs (collage-check.js, carrusel-check.js…) no lanzan
    // nada: corren adentro del Chrome de measure.mjs.
    if (!/\bspawn\s*\(/.test(codigo) || !/CHROME_PATH|chrome\.exe/.test(codigo)) continue
    lanzan.push(nombre)
    assert.match(codigo, /--host-resolver-rules=/, `${nombre} abre Chrome sin --host-resolver-rules`)
    // MAP * vale también para las direcciones IP: la que trata [::1] como local y no la excluye (como ::1, sin corchetes)
    // no carga una URL [::1] (vitals.mjs, entre la ronda 1 y la 2 de la corrección de Visitas).
    if (/MAP \* ~NOTFOUND/.test(codigo) && codigo.includes("'[::1]'")) {
      assert.match(codigo, /MAP \* ~NOTFOUND[^'\n]*EXCLUDE ::1\b/, `${nombre} trata [::1] como local y su regla no lo excluye`)
    }
  }
  // Si esto falla, cambió cómo se abre Chrome y la prueba dejó de ver a las herramientas que lo abren.
  for (const nombre of ['measure.mjs', 'vitals.mjs', 'analitica-check.mjs', 'manual.mjs']) {
    assert.ok(lanzan.includes(nombre), `no se reconoce que ${nombre} abre Chrome (${lanzan.join(', ')})`)
  }
})
