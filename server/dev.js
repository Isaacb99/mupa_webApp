// Desarrollo (npm run dev): la misma app de Express que en producción, con Vite en middlewareMode adentro. Cada
// pedido de una página vuelve a leer index.html, lo pasa por Vite (HMR, React Refresh) y renderiza con
// src/entry-server.jsx cargado por Vite, así un cambio en un componente se ve al recargar sin reiniciar nada.
// Queda en http://localhost:5300/ (el puerto por defecto de tools/measure.mjs), escuchando solo en 127.0.0.1. No usa
// el 5173 de Vite: otro proyecto con Vite en esta PC lo toma en [::1] y "localhost" abría ese (09/10/2026).
// Acepta --port y --host (los manda .claude/launch.json); --strictPort no hace falta: si el puerto está ocupado, sale.
//
// Diferencias con producción, solo de desarrollo:
// - la CSP pública suma el script inline del preámbulo de React Refresh y el websocket de Vite (server/seguridad.js);
// - los archivos los sirve Vite (/src/…, /@vite/…), no dist/client;
// - en desarrollo no aparecen las diferencias de hidratación del build (URL con hash, SVG chicos incrustados): la
//   prueba de hidratación se hace sobre un build (plan 13.3).
// El panel tiene su propio Vite (vite.panel.config.js), también en middlewareMode y en el mismo servidor: queda en
// http://localhost:5300/administracion/ con recarga en caliente. Express lo monta dentro de /administracion
// (server/panel.js), después de la API; su websocket de HMR escucha en /administracion/ y el del sitio en /, así no
// chocan. Cada Vite tiene su caché de dependencias (node_modules/.vite y node_modules/.vite-panel).
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createServer as crearServidorTcp } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const opcion = (nombre) => {
  const i = argv.indexOf(nombre)
  return i >= 0 ? argv[i + 1] : undefined
}
if (opcion('--port')) process.env.PORT = opcion('--port')
if (opcion('--host')) process.env.HOST = opcion('--host')

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { configDelProceso } = await import('./config.js')
const config = configDelProceso()
if (config.produccion) {
  console.error('server/dev.js es solo para desarrollo: en producción, npm run build y npm start.')
  process.exit(1)
}

const { createServer: crearVite } = await import('vite')
const { crearApp } = await import('./app.js')
const { crearConexion } = await import('./db/conexion.js')
const { crearAlmacen } = await import('./fotos/almacen.js')
const { crearMuseoPublico } = await import('./museo.js')
const { crearSsr, partir } = await import('./ssr.js')
const { crearRegistroDeTareas, programarTareas } = await import('./tareas.js')

const servidor = createServer()
const vite = await crearVite({
  root: raiz,
  appType: 'custom',
  // El websocket de HMR va por el mismo servidor y el mismo puerto.
  server: { middlewareMode: true, hmr: { server: servidor } },
})

const vitePanel = await crearVite({
  configFile: resolve(raiz, 'vite.panel.config.js'),
  appType: 'custom',
  server: { middlewareMode: true, hmr: { server: servidor } },
})

async function obtener(req) {
  try {
    const crudo = await readFile(resolve(raiz, 'index.html'), 'utf8')
    const plantilla = await vite.transformIndexHtml(req.originalUrl, crudo)
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')
    return { partes: partir(plantilla), render }
  } catch (err) {
    vite.ssrFixStacktrace(err)
    throw err
  }
}

const sequelize = crearConexion(config)
const ssr = crearSsr({ config, obtener, museoPublico: crearMuseoPublico(config, { sequelize }) })
const registroTareas = crearRegistroDeTareas()
// Las fotos (con su caché en memoria): las mismas para /fotos, la API del panel y la tarea de las huérfanas.
const almacen = sequelize ? crearAlmacen(sequelize) : null
const app = crearApp({
  config,
  ssr,
  sequelize,
  estaticos: (app) => app.use(vite.middlewares),
  desarrollo: true,
  registroTareas,
  vitePanel,
  almacen,
})
servidor.on('request', app)

servidor.once('error', (err) => {
  console.error(`No se pudo escuchar en ${config.host}:${config.PORT}: ${err.message}`)
  process.exit(1)
})

// En Windows, otro servidor (por ejemplo el Vite de otro proyecto) puede estar escuchando el mismo puerto solo en
// [::1] mientras este escucha en 127.0.0.1: los dos arrancan sin error y el navegador, que prueba "localhost" primero
// por IPv6, abre el otro. Antes de escuchar se prueba ese puerto en [::1]; si está ocupado, se sale con un aviso.
function ocupadoEnIpv6(puerto) {
  return new Promise((resolver) => {
    const prueba = crearServidorTcp()
    prueba.once('error', (err) => resolver(err.code === 'EADDRINUSE')) // sin IPv6 (EADDRNOTAVAIL) no hay conflicto
    prueba.once('listening', () => prueba.close(() => resolver(false)))
    prueba.listen({ port: puerto, host: '::1', exclusive: true })
  })
}
if (config.host === '127.0.0.1' && (await ocupadoEnIpv6(config.PORT))) {
  console.error(
    `El puerto ${config.PORT} ya lo usa otro programa en localhost ([::1]): el navegador abriría ese y no este sitio. ` +
      `Cerralo o elegí otro puerto: npm run dev -- --port <número>`,
  )
  process.exit(1)
}

// Las tareas diarias, como en producción (si la base no está migrada, avisan en el log y siguen).
const tareas = programarTareas({ sequelize, registro: registroTareas, almacen })

servidor.listen(config.PORT, config.host, () => {
  const base = sequelize ? 'con base' : config.sinBase ? `SIN_BASE=${config.sinBase}` : 'sin base (no hay DATABASE_URL)'
  const origen = `http://${config.host === '127.0.0.1' ? 'localhost' : config.host}:${config.PORT}`
  console.log(`Sitio en ${origen}/ (${base})`)
  console.log(`Panel en ${origen}/administracion/`)
})

async function cerrar() {
  tareas.detener()
  servidor.close()
  await Promise.allSettled([vite.close(), vitePanel.close(), sequelize?.close()])
  process.exit(0)
}
process.on('SIGINT', cerrar)
process.on('SIGTERM', cerrar)
