// Migraciones con umzug (plan 3.3): llevan el registro de lo aplicado en la tabla SequelizeMeta y son lo único que
// cambia el esquema. Los modelos (server/db/modelos/) nunca crean ni alteran tablas.
//
//   npm run migrar           aplica las pendientes (en Render, el preDeployCommand: si falla, el deploy se aborta)
//   npm run migrar:atras     deshace la última; en producción, o contra una base que no es local, exige
//                            --confirmo-borrar-datos (server/db/guardas.js): npm run migrar:atras -- --confirmo-borrar-datos
//   node --env-file-if-exists=.env server/db/migrar.js estado   lista las aplicadas y las pendientes
//
// Cada archivo de migraciones/ exporta up({ context }) y down({ context }), con context = la QueryInterface; los
// nombres empiezan con la fecha, así el orden alfabético es el de aplicación. El proyecto es ESM: el resolve importa
// cada archivo por su URL (umzug, por defecto, haría require). Regla expand/contract (plan 3.3): mientras corre el
// pre-deploy la versión anterior sigue sirviendo, así que una columna nueva entra nullable o con default.
// Lo usa también server/pruebas/ayudas.js (prepararBase), contra la base de prueba.
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SequelizeStorage, Umzug } from 'umzug'
import { esPrincipal } from '../principal.js'

const CARPETA = dirname(fileURLToPath(import.meta.url))

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ logger?: Console }} [opciones]  sin logger, en silencio (las pruebas)
 */
export function crearMigrador(sequelize, { logger } = {}) {
  return new Umzug({
    migrations: {
      glob: ['migraciones/*.js', { cwd: CARPETA }],
      resolve: ({ name, path, context }) => ({
        name,
        up: async () => (await import(pathToFileURL(path).href)).up({ context }),
        down: async () => (await import(pathToFileURL(path).href)).down({ context }),
      }),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger,
  })
}

if (esPrincipal(import.meta)) {
  const accion = process.argv[2]
  if (!['up', 'down', 'estado'].includes(accion)) {
    console.error('Uso: node server/db/migrar.js up | down [--confirmo-borrar-datos] | estado')
    process.exit(1)
  }
  const { configDelProceso } = await import('../config.js')
  const { crearConexion } = await import('./conexion.js')
  const { exigirConfirmacion } = await import('./guardas.js')
  const config = configDelProceso()
  try {
    // Antes de abrir la conexión: deshacer una migración borra tablas con sus datos.
    if (accion === 'down') exigirConfirmacion(config, config.DATABASE_URL, process.argv)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
  const sequelize = crearConexion(config)
  if (!sequelize) {
    console.error('Falta DATABASE_URL (o está SIN_BASE): no hay base que migrar.')
    process.exit(1)
  }
  let codigo = 0
  try {
    const migrador = crearMigrador(sequelize, { logger: console })
    if (accion === 'estado') {
      const hechas = await migrador.executed()
      const pendientes = await migrador.pending()
      console.log(`Aplicadas (${hechas.length}):${hechas.map((m) => `\n  ${m.name}`).join('')}`)
      console.log(`Pendientes (${pendientes.length}):${pendientes.map((m) => `\n  ${m.name}`).join('')}`)
    } else {
      const hechas = accion === 'down' ? await migrador.down() : await migrador.up()
      const verbo = accion === 'down' ? 'Deshecha' : 'Aplicada'
      if (!hechas.length) console.log(accion === 'down' ? 'No había migraciones para deshacer.' : 'No había migraciones pendientes.')
      for (const m of hechas) console.log(`${verbo}: ${m.name}`)
    }
  } catch (err) {
    // El mensaje de Postgres (sin la URL ni la contraseña) y la migración que falló.
    console.error(`La migración falló: ${err.message}`)
    codigo = 1
  } finally {
    await sequelize.close()
  }
  process.exit(codigo)
}
