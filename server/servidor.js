// Arranque en producción (npm start; plan 2.3, "Arranque"):
//  1. valida la configuración (server/config.js): si algo falta, dice qué y no arranca;
//  2. crea la conexión a Postgres (pool de 5) y la prueba sin frenar el arranque: si la base no responde, el sitio
//     igual sale (/salud no la mira y la Home usa el último museo bueno);
//  3. lee una sola vez la plantilla y el render del build (DIR_BUILD, por defecto dist);
//  4. (E4.5) verificará la casilla de envío del formulario, sin esperar;
//  5. escucha en PORT (y, desde E3/E4.9, programa las tareas diarias);
//  6. ante SIGTERM (Render, en cada deploy) o SIGINT: deja de aceptar conexiones, termina las que están en curso
//     (cerrando las keep-alive, server/apagado.js), cierra la base y sale. Render manda SIGKILL a los 30 s.
//
// En local: npm run build y después, p. ej., PORT=5190 URL_PUBLICA=http://127.0.0.1:5190/ npm start (con
// NODE_ENV=production para probar exactamente lo de Render: noindex y GA4 por host). Las variables del entorno pisan
// las del .env.
import { createServer } from 'node:http'
import { crearApagado } from './apagado.js'
import { configDelProceso } from './config.js'
import { crearApp, estaticosDelBuild } from './app.js'
import { crearConexion, probarBase } from './db/conexion.js'
import { codigoDeError, log } from './log.js'
import { crearMuseoPublico } from './museo.js'
import { cargarBuild, crearSsr } from './ssr.js'

const config = configDelProceso()
const sequelize = crearConexion(config)

let build
try {
  build = await cargarBuild(config.DIR_BUILD)
} catch (err) {
  log('error', 'sin_build', err)
  console.error(`No se pudo leer el build de "${config.DIR_BUILD}": ¿corriste npm run build?`)
  process.exit(1)
}

const ssr = crearSsr({ config, obtener: build.obtener, museoPublico: crearMuseoPublico(config) })
const app = crearApp({ config, ssr, sequelize, estaticos: estaticosDelBuild(config.DIR_BUILD), fechaHome: build.fecha })

const servidor = createServer()
const apagado = crearApagado(servidor, { limiteMs: 25_000 })
servidor.on('request', apagado.manejador(app))
// Más que el tiempo que el proxy de Render deja abierta una conexión ociosa, para que nunca reuse una que Node ya
// cerró (un 502 suelto). A confirmar en el primer deploy (E5.1).
servidor.keepAliveTimeout = 65_000
servidor.headersTimeout = 66_000

servidor.once('error', (err) => {
  log('error', 'no_escucha', err)
  process.exit(1)
})
servidor.listen(config.PORT, config.host, () => {
  log('info', 'arranque', {
    url: `http://${config.host}:${config.PORT}/`,
    entorno: config.NODE_ENV,
    urlPublica: config.urlPublica,
    canonico: config.CANONICO,
    base: sequelize ? 'configurada' : config.sinBase ? `SIN_BASE=${config.sinBase}` : 'sin configurar',
  })
})

if (sequelize) {
  probarBase(sequelize, 5_000)
    .then((ms) => log('info', 'base_ok', { ms }))
    .catch((err) => log('aviso', 'base_no_responde', { mensaje: err.message, codigo: codigoDeError(err) }))
}

async function apagar(senal) {
  if (apagado.apagando) {
    log('aviso', 'apagado_forzado', { senal })
    process.exit(1)
  }
  log('info', 'apagado', { senal })
  if (!(await apagado.apagar())) {
    log('aviso', 'apagado_vencido')
    process.exit(1)
  }
  try {
    await sequelize?.close()
  } catch (err) {
    log('aviso', 'base_no_cerro', { mensaje: err.message })
  }
  process.exit(0)
}
process.on('SIGTERM', () => apagar('SIGTERM'))
process.on('SIGINT', () => apagar('SIGINT'))
