// Modelo de la tabla salas (migración 04, E3.4): las salas del museo, en su orden. planoRef está reservado para el
// plano (módulo 4, plan 3.5): el panel no lo muestra ni la API lo cambia. Grupos P y C en grupos.js.
import { DataTypes } from 'sequelize'
import { columnasDeControl, columnasPublicables } from './grupos.js'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirSala(sequelize) {
  return sequelize.define(
    'Sala',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(120), allowNull: false },
      slug: { type: DataTypes.STRING(140), allowNull: false },
      resumen: { type: DataTypes.STRING(200) },
      descripcion: { type: DataTypes.JSONB },
      portadaId: { type: DataTypes.INTEGER },
      orden: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      planoRef: { type: DataTypes.STRING(60) },
      ...columnasPublicables(),
      ...columnasDeControl(),
    },
    { tableName: 'salas', timestamps: true },
  )
}
