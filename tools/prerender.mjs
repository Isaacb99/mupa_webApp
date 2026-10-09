// Prerenderizado: deja la página ya renderizada dentro del index.html del build, para que los buscadores (y cualquiera
// que llegue antes de que cargue el JavaScript) reciban el contenido en el HTML y no un <div id="root"> vacío. En el
// navegador React adopta ese HTML (hydrateRoot en src/main.jsx) y todo sigue funcionando igual.
// Hace un segundo build de Vite, para Node, de src/entry-server.jsx en una carpeta temporal, lo ejecuta y mete el
// resultado en <carpeta>/index.html. Lo llaman los scripts "build" y "build:preview" de package.json.
// Uso: node tools/prerender.mjs [carpeta=dist] [modo=production]
import { build } from 'vite'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [carpeta = 'dist', modo = 'production'] = process.argv.slice(2)
const temporal = resolve('node_modules/.cache/prerender')
const RAIZ_VACIA = '<div id="root"></div>'

await build({
  mode: modo,
  logLevel: 'warn',
  build: { ssr: 'src/entry-server.jsx', outDir: temporal, emptyOutDir: true, copyPublicDir: false },
})

try {
  const { render } = await import(pathToFileURL(join(temporal, 'entry-server.js')).href)
  const html = render()
  const ruta = join(carpeta, 'index.html')
  const pagina = readFileSync(ruta, 'utf8')
  if (!pagina.includes(RAIZ_VACIA)) throw new Error(`${ruta} no tiene ${RAIZ_VACIA}: ¿ya estaba prerenderizado?`)
  // La función en el reemplazo evita que un "$&" del contenido se tome como patrón.
  writeFileSync(ruta, pagina.replace(RAIZ_VACIA, () => `<div id="root">${html}</div>`))
  console.log(`prerender: ${ruta} con ${(html.length / 1024).toFixed(1)} kB de contenido`)
} finally {
  rmSync(temporal, { recursive: true, force: true })
}
