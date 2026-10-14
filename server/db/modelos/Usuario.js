// Modelo de la tabla usuarios (migración 01). Describe la tabla; no la crea ni la cambia: eso es de las migraciones.
// Atributos en camelCase y columnas en snake_case (underscored, plan 3.1). passwordHash nunca sale en una respuesta:
// las rutas arman su respuesta campo por campo (server/api/usuarios.js).
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirUsuario(sequelize) {
  return sequelize.define(
    'Usuario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(254), allowNull: false },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      debeCambiarClave: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      claveTemporalVence: { type: DataTypes.DATE },
      rol: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'editor' },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ultimoAcceso: { type: DataTypes.DATE },
    },
    { tableName: 'usuarios', timestamps: true },
  )
}
