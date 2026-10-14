// Modelo de la tabla horario_semanal (migración 02): los 7 días (ISO: 1 = lunes), que la migración crea cerrados.
// franjas: [{ abre: '09:00', cierra: '13:00' }], hasta 2, con abre < cierra (zod, E2.4).
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirHorarioSemanal(sequelize) {
  return sequelize.define(
    'HorarioSemanal',
    {
      dia: { type: DataTypes.SMALLINT, primaryKey: true },
      abierto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      franjas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      nota: { type: DataTypes.STRING(120) },
    },
    { tableName: 'horario_semanal', timestamps: false },
  )
}
