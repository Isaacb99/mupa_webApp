// Los comandos de línea (npm run migrar, crear-admin…) llamados por un enlace: un symlink o, en Windows, una junction
// (server/principal.js). Antes comparaban import.meta.url con resolve(process.argv[1]) y, por un enlace, no hacían
// nada y salían con 0. Sin base: se los llama sin argumentos, que imprimen el uso y salen con 1 antes de conectar.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..')
const enlaces = []

/** Una junction (en Windows; en los demás, un symlink) a carpeta, en una carpeta temporal propia. */
function enlazar(destino) {
  const carpeta = mkdtempSync(join(tmpdir(), 'mupa-enlace-'))
  const enlace = join(carpeta, 'enlace')
  symlinkSync(destino, enlace, 'junction')
  enlaces.push({ carpeta, enlace })
  return enlace
}

// Primero el enlace (unlink no sigue el enlace: el destino, que puede ser server/, no se toca) y después la carpeta,
// que tiene que haber quedado vacía (rmdir sin recursive).
after(() => {
  for (const { carpeta, enlace } of enlaces) {
    unlinkSync(enlace)
    rmdirSync(carpeta)
  }
})

const correr = (archivo) => spawnSync(process.execPath, [archivo], { encoding: 'utf8', timeout: 30_000 })

test('migrar.js y admin.js llamados por un enlace corren (sin argumentos: el uso y código 1)', () => {
  const server = enlazar(SERVER)
  for (const comando of [join('db', 'migrar.js'), join('scripts', 'admin.js')]) {
    const r = correr(join(server, comando))
    assert.equal(r.status, 1, `${comando}: ${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /^Uso:/, comando)
  }
})

test('esPrincipal: true en el archivo que se pasó a node (también por un enlace y sin import.meta.main), false si se lo importa', () => {
  const real = mkdtempSync(join(tmpdir(), 'mupa-principal-'))
  try {
    const helper = pathToFileURL(join(SERVER, 'principal.js')).href
    // [con import.meta.main, sin él (el respaldo con realpath), la comparación vieja]
    writeFileSync(
      join(real, 'a.mjs'),
      `import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { esPrincipal } from ${JSON.stringify(helper)}
const vieja = import.meta.url === pathToFileURL(resolve(process.argv[1])).href
console.log(JSON.stringify([esPrincipal(import.meta), esPrincipal({ url: import.meta.url }), vieja]))
`,
    )
    writeFileSync(join(real, 'b.mjs'), "import './a.mjs'\n")
    const enlace = enlazar(real)
    const salida = (archivo) => JSON.parse(correr(archivo).stdout)
    assert.deepEqual(salida(join(real, 'a.mjs')), [true, true, true], 'directo')
    assert.deepEqual(salida(join(enlace, 'a.mjs')), [true, true, false], 'por el enlace (la comparación vieja daba false)')
    assert.deepEqual(salida(join(enlace, 'b.mjs')), [false, false, false], 'importado')
  } finally {
    rmSync(real, { recursive: true, force: true })
  }
})
