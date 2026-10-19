// Modelo de la tabla muestras (migración 04, E3.4): las muestras (temporales o permanentes), en su orden. Las fechas
// son días ("AAAA-MM-DD"); la situación (Actual, Próxima, Finalizada, Permanente) se calcula, no se guarda
// (compartido/estados.js). Grupos P y C en grupos.js.
import { DataTypes } from 'sequelize'
import { columnasDeControl, columnasPublicables } from './grupos.js'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirMuestra(sequelize) {
  return sequelize.define(
    'Muestra',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: DataTypes.STRING(160), allowNull: false },
      slug: { type: DataTypes.STRING(180), allowNull: false },
      tipo: { type: DataTypes.STRING(12), allowNull: false },
      fechaInicio: { type: DataTypes.DATEONLY },
      fechaFin: { type: DataTypes.DATEONLY },
      salaId: { type: DataTypes.INTEGER },
      resumen: { type: DataTypes.STRING(200) },
      descripcion: { type: DataTypes.JSONB },
      portadaId: { type: DataTypes.INTEGER },
      orden: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      ...columnasPublicables(),
      ...columnasDeControl(),
    },
    { tableName: 'muestras', timestamps: true },
  )
}
