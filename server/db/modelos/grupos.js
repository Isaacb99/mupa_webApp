// Los grupos de columnas que se repiten en lo publicable (plan 3.1), para los modelos de salas, muestras y novedades:
// - P: estado ('borrador' | 'publicado') y publicadoEn (la primera publicación: la fecha visible; no se borra al
//   despublicar, y con ella la dirección web queda fija).
// - C: creadoPor y actualizadoPor (la cuenta que lo creó y la última que lo cambió; null si se borró la cuenta). Los
//   created_at y updated_at los pone Sequelize (timestamps).
import { DataTypes } from 'sequelize'

export const columnasPublicables = () => ({
  estado: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'borrador' },
  publicadoEn: { type: DataTypes.DATE },
})

export const columnasDeControl = () => ({
  creadoPor: { type: DataTypes.INTEGER },
  actualizadoPor: { type: DataTypes.INTEGER },
})
