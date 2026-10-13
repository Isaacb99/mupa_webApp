// Conexión mínima a Postgres (E0.3): Sequelize 6 con un pool chico, sin modelos ni migraciones (llegan en E1.1, con
// db/migrar.js, asociaciones.js y modelos/). La usan /salud/base y el apagado ordenado.
// Nunca sync(): el esquema lo llevan las migraciones (plan 3.3).
import { Sequelize, QueryTypes } from 'sequelize'

/**
 * Crea la instancia de Sequelize, o null si no hay base (sin DATABASE_URL en desarrollo, o con SIN_BASE).
 * No conecta todavía: la primera consulta abre la primera conexión del pool.
 * @param {ReturnType<import('../config.js').leerConfig>} config
 * @param {{ url?: string }} [opciones]  url: otra base (las pruebas pasan DATABASE_URL_TEST)
 */
export function crearConexion(config, { url = config.DATABASE_URL } = {}) {
  if (!url || config.sinBase) return null
  return new Sequelize(url, {
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
    // Convenciones del modelo de datos (plan 3.1), para cuando lleguen los modelos.
    define: { underscored: true, freezeTableName: true },
  })
}

/**
 * SELECT 1 con tope de tiempo. Devuelve los ms que tardó; tira si falla o si pasa el tope.
 * @param {Sequelize} sequelize
 */
export async function probarBase(sequelize, tope = 2_000) {
  const inicio = performance.now()
  let reloj
  const consulta = sequelize.query('SELECT 1 AS uno', { type: QueryTypes.SELECT })
  // Si gana el tope, la consulta sigue y falla o termina sola más tarde: que no quede un rechazo sin atender.
  consulta.catch(() => {})
  const vencida = new Promise((_, rechazar) => {
    reloj = setTimeout(() => rechazar(Object.assign(new Error('La base no contestó a tiempo'), { code: 'TOPE' })), tope)
  })
  try {
    await Promise.race([consulta, vencida])
    return Math.round(performance.now() - inicio)
  } finally {
    clearTimeout(reloj)
  }
}
