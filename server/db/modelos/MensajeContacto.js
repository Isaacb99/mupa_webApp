// Modelo de la tabla mensajes_contacto (migración 06, E4.9): los mensajes del formulario de contacto del sitio, con el
// estado del envío por correo (pendiente, enviado o fallido) y el código del error de un fallido. Solo created_at: un
// mensaje no se cambia después (salvo su envío). Los ve solo un admin y se borran a los 180 días (plan 8).
import { DataTypes } from 'sequelize'

/** Los estados del envío por correo. */
export const ENVIOS = Object.freeze(['pendiente', 'enviado', 'fallido'])

/** @param {import('sequelize').Sequelize} sequelize */
export function definirMensajeContacto(sequelize) {
  return sequelize.define(
    'MensajeContacto',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false },
      mensaje: { type: DataTypes.TEXT, allowNull: false },
      envio: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'pendiente' },
      error: { type: DataTypes.STRING(40) },
    },
    { tableName: 'mensajes_contacto', timestamps: true, updatedAt: false },
  )
}
