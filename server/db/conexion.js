// Conexión a Postgres: Sequelize 6 con un pool chico y los modelos definidos (server/db/asociaciones.js). La usan el
// sitio (/salud/base, el apagado ordenado), la API del panel (server/api/), las tareas diarias, los comandos
// (migrar.js, semillas/, scripts/admin.js) y las pruebas.
// El esquema lo llevan SOLO las migraciones (server/db/migrar.js, plan 3.3): nunca se sincroniza desde los modelos.
import { Sequelize, QueryTypes } from 'sequelize'
import { conTope } from '../tope.js'
import { definirModelos } from './asociaciones.js'

/**
 * Crea la instancia de Sequelize con los modelos (sequelize.models), o null si no hay base (sin DATABASE_URL en
 * desarrollo, o con SIN_BASE). No conecta todavía: la primera consulta abre la primera conexión del pool.
 * @param {ReturnType<import('../config.js').leerConfig>} config
 * @param {{ url?: string }} [opciones]  url: otra base (las pruebas pasan DATABASE_URL_TEST)
 */
export function crearConexion(config, { url = config.DATABASE_URL } = {}) {
  if (!url || config.sinBase) return null
  const sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: false,
    // Una sola instancia de 512 MB en Render y una base Basic de 256 MB: 5 conexiones alcanzan (plan 2.3).
    pool: { max: 5, min: 0, idle: 10_000, acquire: 10_000 },
    dialectOptions: {
      // Si la base no contesta, el pedido falla a los 5 s en vez de quedar colgado (el /salud/base corta antes, a 2).
      connectionTimeoutMillis: 5_000,
      // DB_SSL=1 solo desde una PC contra la URL externa de Render; adentro de Render la red interna va sin TLS.
      // Si el certificado de Render no valida con las CA de Node, se ve en E5 y se ajusta acá (nunca en silencio).
      ...(config.DB_SSL ? { ssl: { require: true, rejectUnauthorized: true } } : {}),
    },
    // Convenciones del modelo de datos (plan 3.1): columnas en snake_case y el nombre de la tabla tal cual.
    define: { underscored: true, freezeTableName: true },
  })
  definirModelos(sequelize)
  return sequelize
}

/**
 * SELECT 1 con tope de tiempo. Devuelve los ms que tardó; tira si falla o si pasa el tope.
 * @param {Sequelize} sequelize
 */
export async function probarBase(sequelize, tope = 2_000) {
  const inicio = performance.now()
  // Si gana el tope, la consulta sigue y falla o termina sola más tarde (conTope atiende su rechazo).
  await conTope(sequelize.query('SELECT 1 AS uno', { type: QueryTypes.SELECT }), tope, 'La base no contestó a tiempo')
  return Math.round(performance.now() - inicio)
}
