// Los modelos y sus asociaciones (plan 3.1: un modelo por archivo, las asociaciones acá). Lo llama crearConexion()
// (server/db/conexion.js) una vez por instancia de Sequelize; después cada parte los toma de sequelize.models.
// Los modelos describen las tablas que crean las migraciones (server/db/migraciones/): nunca se sincroniza el esquema
// desde acá.
import { definirHorarioSemanal } from './modelos/HorarioSemanal.js'
import { definirMuseo } from './modelos/Museo.js'
import { definirSesion } from './modelos/Sesion.js'
import { definirTarifa } from './modelos/Tarifa.js'
import { definirUsuario } from './modelos/Usuario.js'

/**
 * @param {import('sequelize').Sequelize} sequelize
 */
export function definirModelos(sequelize) {
  const Usuario = definirUsuario(sequelize)
  const Sesion = definirSesion(sequelize)
  const Museo = definirMuseo(sequelize)
  const HorarioSemanal = definirHorarioSemanal(sequelize)
  const Tarifa = definirTarifa(sequelize)

  Usuario.hasMany(Sesion, { foreignKey: 'usuarioId', as: 'sesiones' })
  Sesion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })
  Museo.belongsTo(Usuario, { foreignKey: 'actualizadoPor', as: 'editor' })

  return { Usuario, Sesion, Museo, HorarioSemanal, Tarifa }
}
