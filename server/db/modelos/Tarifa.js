// Modelo de la tabla tarifas (migración 02). El id es estable: lo va a referenciar la venta de entradas (plan 3.6),
// por eso en el panel se recomienda ocultar una tarifa (visible = false) en vez de borrarla. Precio en pesos, sin
// centavos; una gratuita puede no tener precio.
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirTarifa(sequelize) {
  return sequelize.define(
    'Tarifa',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      gratuita: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      precio: { type: DataTypes.INTEGER },
      condicion: { type: DataTypes.STRING(160) },
      orden: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'tarifas', timestamps: true },
  )
}
