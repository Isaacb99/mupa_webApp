// Sirve una carpeta ya construida (dist/ o dist-preview/) como lo hace el hosting: texto comprimido con Brotli y las
// mismas cabeceras de caché que los .htaccess de public/. Sirve para medir en local en condiciones parecidas a las de
// producción (vite preview no comprime, así que el JS pesaba el triple que en mupa.ar).
// Con --latencia y --kbps además simula una conexión lenta desde el servidor: Chrome no aplica su limitación de red a
// los pedidos a 127.0.0.1 (medido el 29/09/2026: con 150 ms de latencia emulada el primer byte llegaba a los 7 ms), así
// que para medir en local la red se limita acá. El ancho de banda es uno solo, compartido entre todas las respuestas.
// Solo escucha en 127.0.0.1.
// Uso: node tools/servir.mjs [carpeta=dist] [puerto=5181] [--latencia 150] [--kbps 1638]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const argv = process.argv.slice(2)
const opt = (k, d) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv.splice(i, 2)[1] : d
}
const latencia = Number(opt('--latencia', 0))
const kbps = Number(opt('--kbps', 0))
const [carpeta = 'dist', puerto = '5181'] = argv
const raiz = resolve(carpeta)
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
}
const TEXTO = new Set(['.html', '.js', '.css', '.svg', '.txt', '.xml', '.json'])
const comprimidos = new Map()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function cache(ruta, ext) {
  if (ext === '.html') return 'no-cache'
  if (ruta.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  return 'public, max-age=86400'
}

// Conexión lenta: cada TIC ms se reparte el cupo de bytes entre las respuestas en curso, en partes iguales.
const TIC = 20
const cola = []
let reloj = null
function tic() {
  let cupo = Math.ceil(((kbps * 1024) / 8) * (TIC / 1000))
  while (cupo > 0 && cola.length) {
    const parte = Math.max(1, Math.floor(cupo / cola.length))
    for (const t of [...cola]) {
      const n = Math.min(parte, t.cuerpo.length - t.pos, cupo)
      t.res.write(t.cuerpo.subarray(t.pos, t.pos + n))
      t.pos += n
      cupo -= n
      if (t.pos >= t.cuerpo.length) {
        t.res.end()
        cola.splice(cola.indexOf(t), 1)
      }
      if (cupo <= 0) break
    }
  }
  if (!cola.length) {
    clearInterval(reloj)
    reloj = null
  }
}
function enviar(res, cuerpo) {
  if (!kbps || !cuerpo.length) {
    res.end(cuerpo)
    return
  }
  const tarea = { res, cuerpo, pos: 0 }
  cola.push(tarea)
  res.on('close', () => {
    const i = cola.indexOf(tarea)
    if (i >= 0) cola.splice(i, 1)
  })
  reloj ??= setInterval(tic, TIC)
}

createServer(async (req, res) => {
  try {
    if (latencia) await sleep(latencia)
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (ruta.endsWith('/')) ruta += 'index.html'
    const archivo = normalize(join(raiz, ruta))
    // Nada fuera de la carpeta ni los .htaccess (el hosting los niega con 403).
    if (!archivo.startsWith(raiz + sep) || /(^|[\\/])\.ht/.test(archivo)) {
      res.writeHead(403).end('403')
      return
    }
    const ext = extname(archivo).toLowerCase()
    // La copia comprimida se guarda por archivo y fecha: si el build se regenera, se sirve el archivo nuevo.
    const { mtimeMs } = await stat(archivo)
    const clave = archivo + ':' + mtimeMs
    let cuerpo = await readFile(archivo)
    const cabeceras = { 'Content-Type': TIPOS[ext] ?? 'application/octet-stream', 'Cache-Control': cache(ruta, ext) }
    if (TEXTO.has(ext) && /\bbr\b/.test(req.headers['accept-encoding'] ?? '')) {
      if (!comprimidos.has(clave)) {
        comprimidos.set(clave, brotliCompressSync(cuerpo, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }))
      }
      cuerpo = comprimidos.get(clave)
      cabeceras['Content-Encoding'] = 'br'
      cabeceras.Vary = 'Accept-Encoding'
    }
    cabeceras['Content-Length'] = cuerpo.length
    res.writeHead(200, cabeceras)
    if (req.method === 'HEAD') res.end()
    else enviar(res, cuerpo)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404')
  }
}).listen(Number(puerto), '127.0.0.1', () => {
  const red = kbps || latencia ? ` (red simulada: ${kbps || 'sin límite de'} kbps, ${latencia} ms de latencia)` : ''
  console.log(`${raiz} en http://127.0.0.1:${puerto}/${red}`)
})
