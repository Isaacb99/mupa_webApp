// La fábrica de las galerías (plan 3.2): una tabla galeria_<tabla del contenido> con la clave del contenido, la de la
// foto y el orden, con claves foráneas de verdad (CASCADE hacia el contenido, RESTRICT hacia la foto; las crean las
// migraciones 04 y 05). Hoy, muestras y novedades; la de las salas llega con el plano (plan 3.5).
//   definirGaleria(sequelize, 'GaleriaMuestra', Muestra)  ->  galeria_muestras (muestra_id, foto_id, orden)
// La clave del contenido sale del nombre del modelo: Muestra -> muestraId (muestra_id), Novedad -> novedadId.
import { DataTypes } from 'sequelize'

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {string} nombre  el del modelo de la galería
 * @param {import('sequelize').ModelStatic<any>} modeloPadre  el del contenido
 */
export function definirGaleria(sequelize, nombre, modeloPadre) {
  const clave = `${modeloPadre.name[0].toLowerCase()}${modeloPadre.name.slice(1)}Id`
  const modelo = sequelize.define(
    nombre,
    {
      [clave]: { type: DataTypes.INTEGER, primaryKey: true },
      fotoId: { type: DataTypes.INTEGER, primaryKey: true },
      orden: { type: DataTypes.SMALLINT, allowNull: false },
    },
    { tableName: `galeria_${modeloPadre.getTableName()}`, timestamps: false },
  )
  modelo.claveDelContenido = clave
  return modelo
}
