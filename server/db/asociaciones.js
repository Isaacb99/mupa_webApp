// Los modelos y sus asociaciones (plan 3.1: un modelo por archivo, las asociaciones acá). Lo llama crearConexion()
// (server/db/conexion.js) una vez por instancia de Sequelize; después cada parte los toma de sequelize.models.
// Los modelos describen las tablas que crean las migraciones (server/db/migraciones/): nunca se sincroniza el esquema
// desde acá. fotos_archivos no tiene modelo, a propósito (server/db/modelos/Foto.js).
// Desde E3.3 y E3.4, los contenidos (salas, muestras y novedades) y sus galerías (modelos/Galeria.js): cada uno con su
// portada (as: 'portada'), su galería (as: 'galeria', con la foto de cada lugar) y quién lo creó y lo cambió por
// última vez (as: 'autor' y 'editor').
import { definirFoto } from './modelos/Foto.js'
import { definirGaleria } from './modelos/Galeria.js'
import { definirHorarioSemanal } from './modelos/HorarioSemanal.js'
import { definirMuestra } from './modelos/Muestra.js'
import { definirMuseo } from './modelos/Museo.js'
import { definirNovedad } from './modelos/Novedad.js'
import { definirSala } from './modelos/Sala.js'
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
  const Foto = definirFoto(sequelize)
  const Sala = definirSala(sequelize)
  const Muestra = definirMuestra(sequelize)
  const Novedad = definirNovedad(sequelize)
  const GaleriaMuestra = definirGaleria(sequelize, 'GaleriaMuestra', Muestra)
  const GaleriaNovedad = definirGaleria(sequelize, 'GaleriaNovedad', Novedad)

  Usuario.hasMany(Sesion, { foreignKey: 'usuarioId', as: 'sesiones' })
  Sesion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })
  Museo.belongsTo(Usuario, { foreignKey: 'actualizadoPor', as: 'editor' })
  Foto.belongsTo(Usuario, { foreignKey: 'subidaPor', as: 'autor' })

  for (const Contenido of [Sala, Muestra, Novedad]) {
    Contenido.belongsTo(Foto, { foreignKey: 'portadaId', as: 'portada' })
    Contenido.belongsTo(Usuario, { foreignKey: 'creadoPor', as: 'autor' })
    Contenido.belongsTo(Usuario, { foreignKey: 'actualizadoPor', as: 'editor' })
  }
  Muestra.belongsTo(Sala, { foreignKey: 'salaId', as: 'sala' })
  Sala.hasMany(Muestra, { foreignKey: 'salaId', as: 'muestras' })
  for (const [Contenido, Galeria] of [
    [Muestra, GaleriaMuestra],
    [Novedad, GaleriaNovedad],
  ]) {
    Contenido.hasMany(Galeria, { foreignKey: Galeria.claveDelContenido, as: 'galeria' })
    Galeria.belongsTo(Foto, { foreignKey: 'fotoId', as: 'foto' })
  }

  return {
    Usuario,
    Sesion,
    Museo,
    HorarioSemanal,
    Tarifa,
    Foto,
    Sala,
    Muestra,
    Novedad,
    GaleriaMuestra,
    GaleriaNovedad,
  }
}
