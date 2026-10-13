// Dos modos, los dos con texto comprimido con Brotli y, si se pide, una conexión lenta simulada. Solo escucha en
// 127.0.0.1.
//
// 1) Carpeta (el de siempre): sirve un build estático (la landing de la rama landing, dist-preview/ o la copia en
//    tools/salida/dist-landing) como lo hace el hosting: las mismas cabeceras de caché que los .htaccess de public/.
//    Se niega con un build de Express (el dist/ de master desde E0.4: tiene client/ y server/).
//    Sirve para medir en local en condiciones parecidas a las de Hostinger (vite preview no comprime, así que el JS
//    pesaba el triple que en mupa.ar).
// 2) Proxy (--proxy URL, desde E0.4 del plan): se pone delante del servidor de Express (npm start) y le reenvía todo,
//    con el Host del destino, así Express responde como a su host público. Las cabeceras (caché, ETag, CSP) son las de
//    Express; el proxy solo comprime lo que venga sin comprimir, como el borde de Render (plan 10.1, paso 6), y aplica
//    la red simulada. Para medir con tools/vitals.mjs (plan 13.2).
//
// Con --latencia y --kbps simula una conexión lenta desde el servidor: Chrome no aplica su limitación de red a los
// pedidos a 127.0.0.1 (medido el 29/09/2026: con 150 ms de latencia emulada el primer byte llegaba a los 7 ms), así
// que para medir en local la red se limita acá. La latencia se suma a cada pedido antes de responder y el ancho de
// banda es uno solo, compartido entre todas las respuestas.
//
// Uso: node tools/servir.mjs [carpeta=dist] [puerto=5181] [--latencia 150] [--kbps 1638]
//      node tools/servir.mjs --proxy http://127.0.0.1:5190 [puerto=5181] [--latencia 150] [--kbps 1638]
import { createServer, request } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
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
const proxy = opt('--proxy', null)
const [carpeta = 'dist', puerto = '5181'] = proxy ? [null, argv[0]] : argv
const raiz = proxy ? null : resolve(carpeta)
// Desde E0.4, npm run build deja un build de Express (dist/client, dist/server) con una plantilla vacía en
// dist/client/index.html: servido como carpeta daría una página en blanco o, con un dist/ viejo de la landing al lado,
// la landing vieja, y las recetas darían ok contra lo que no es. Ese build se sirve con npm start y, para la red
// lenta, este script delante con --proxy.
if (raiz) {
  const plantilla = (archivo) => existsSync(archivo) && readFileSync(archivo, 'utf8').includes('<!--app-->')
  if (existsSync(join(raiz, 'client')) || existsSync(join(raiz, 'server')) || plantilla(join(raiz, 'index.html'))) {
    console.error(
      `${raiz} es un build de Express (npm run build), no uno estático: levantalo con npm start y medilo con\n` +
        `  node tools/servir.mjs --proxy http://127.0.0.1:<puerto de npm start> ${puerto} [--latencia 150 --kbps 1638]`,
    )
    process.exit(1)
  }
}
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
// En el proxy se decide por el Content-Type de la respuesta.
const TIPO_TEXTO = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg\+xml)/
const comprimidos = new Map()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const aceptaBrotli = (req) => /\bbr\b/.test(req.headers['accept-encoding'] ?? '')
const brotli = (cuerpo) => brotliCompressSync(cuerpo, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } })

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

async function servirCarpeta(req, res) {
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
    if (TEXTO.has(ext) && aceptaBrotli(req)) {
      if (!comprimidos.has(clave)) comprimidos.set(clave, brotli(cuerpo))
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
}

// Cabeceras que son de cada tramo de la conexión y no se reenvían tal cual.
const DE_LA_CONEXION = ['connection', 'keep-alive', 'transfer-encoding', 'content-length', 'upgrade']

async function reenviar(req, res) {
  const destino = new URL(proxy)
  if (latencia) await sleep(latencia)
  const cabeceras = { ...req.headers, host: destino.host }
  // Se pide sin comprimir: comprime el proxy, como el borde de Render.
  delete cabeceras['accept-encoding']
  for (const nombre of DE_LA_CONEXION) delete cabeceras[nombre]
  const pedido = request(
    { hostname: destino.hostname, port: destino.port, method: req.method, path: req.url, headers: cabeceras },
    (respuesta) => {
      const partes = []
      respuesta.on('data', (parte) => partes.push(parte))
      respuesta.on('end', () => {
        let cuerpo = Buffer.concat(partes)
        const salida = { ...respuesta.headers }
        const largoOriginal = salida['content-length']
        for (const nombre of DE_LA_CONEXION) delete salida[nombre]
        const tipo = salida['content-type'] ?? ''
        if (cuerpo.length && !salida['content-encoding'] && TIPO_TEXTO.test(tipo) && aceptaBrotli(req)) {
          // Los assets llevan ETag y no cambian: su copia comprimida se guarda.
          const clave = salida.etag ? `${req.url}:${salida.etag}` : null
          const comprimido = (clave && comprimidos.get(clave)) ?? brotli(cuerpo)
          if (clave) comprimidos.set(clave, comprimido)
          cuerpo = comprimido
          salida['content-encoding'] = 'br'
          salida.vary = salida.vary ? `${salida.vary}, Accept-Encoding` : 'Accept-Encoding'
        }
        const sinCuerpo = respuesta.statusCode === 204 || respuesta.statusCode === 304
        if (req.method === 'HEAD') {
          if (largoOriginal !== undefined && !salida['content-encoding']) salida['content-length'] = largoOriginal
        } else if (!sinCuerpo) {
          salida['content-length'] = cuerpo.length
        }
        res.writeHead(respuesta.statusCode, salida)
        if (req.method === 'HEAD' || sinCuerpo) res.end()
        else enviar(res, cuerpo)
      })
    },
  )
  pedido.on('error', (err) => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`502: ${proxy} no responde (${err.code ?? err.message})`)
  })
  req.pipe(pedido)
}

createServer(proxy ? reenviar : servirCarpeta).listen(Number(puerto), '127.0.0.1', () => {
  const red = kbps || latencia ? ` (red simulada: ${kbps || 'sin límite de'} kbps, ${latencia} ms de latencia)` : ''
  console.log(`${proxy ? `proxy a ${proxy}` : raiz} en http://127.0.0.1:${puerto}/${red}`)
})
