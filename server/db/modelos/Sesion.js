// Modelo de la tabla sesiones (migración 01). Las consultas de sesiones que miden tiempo (vencimiento, inactividad,
// renovación) van en SQL con el reloj de la base, en server/auth/sesiones.js; el modelo sirve para la asociación y
// para contar o borrar.
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirSesion(sequelize) {
  return sequelize.define(
    'Sesion',
    {
      // bigserial: pg lo devuelve como texto.
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false },
      creadaEn: { type: DataTypes.DATE, allowNull: false },
      ultimoUso: { type: DataTypes.DATE, allowNull: false },
      expiraEn: { type: DataTypes.DATE, allowNull: false },
      userAgent: { type: DataTypes.STRING(300) },
    },
    { tableName: 'sesiones', timestamps: false },
  )
}
