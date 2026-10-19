// Modelo de la tabla novedades (migración 05, E3.3): noticias y actividades. eventoInicio y eventoFin son instantes
// (la API los recibe y los da como hora de San Juan, compartido/fechas.js); "Realizada" se calcula, no se guarda
// (compartido/estados.js). Grupos P y C en grupos.js.
import { DataTypes } from 'sequelize'
import { columnasDeControl, columnasPublicables } from './grupos.js'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirNovedad(sequelize) {
  return sequelize.define(
    'Novedad',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tipo: { type: DataTypes.STRING(12), allowNull: false },
      titulo: { type: DataTypes.STRING(160), allowNull: false },
      slug: { type: DataTypes.STRING(180), allowNull: false },
      resumen: { type: DataTypes.STRING(200) },
      cuerpo: { type: DataTypes.JSONB },
      portadaId: { type: DataTypes.INTEGER },
      eventoInicio: { type: DataTypes.DATE },
      eventoFin: { type: DataTypes.DATE },
      lugar: { type: DataTypes.STRING(160) },
      costo: { type: DataTypes.STRING(80) },
      enlaceInscripcion: { type: DataTypes.TEXT },
      ...columnasPublicables(),
      ...columnasDeControl(),
    },
    { tableName: 'novedades', timestamps: true },
  )
}
