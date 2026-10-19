// Modelo de la tabla fotos (migración 03): los datos de cada foto, sin los archivos. Los archivos están en
// fotos_archivos, que no tiene modelo a propósito: así ningún findAll los trae (pueden pesar megas). Los lee y los
// escribe server/fotos/almacen.js, con SQL.
// variantes: los anchos guardados ([480, 960, 1600, 2400]); el ancho real de cada uno es min(variante, ancho).
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirFoto(sequelize) {
  return sequelize.define(
    'Foto',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clave: { type: DataTypes.CHAR(16), allowNull: false },
      ancho: { type: DataTypes.INTEGER, allowNull: false },
      alto: { type: DataTypes.INTEGER, allowNull: false },
      variantes: { type: DataTypes.JSONB, allowNull: false },
      bytes: { type: DataTypes.INTEGER, allowNull: false },
      alt: { type: DataTypes.STRING(250), allowNull: false, defaultValue: '' },
      decorativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      epigrafe: { type: DataTypes.STRING(300) },
      credito: { type: DataTypes.STRING(120) },
      subidaPor: { type: DataTypes.INTEGER },
    },
    { tableName: 'fotos', timestamps: true },
  )
}
