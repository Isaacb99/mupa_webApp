// Modelo de la tabla museo (migración 02): una sola fila, id = 1, que crea la migración vacía. La editan el panel
// (E2.3, E2.4) y la semilla de ejemplo; la lee server/museo.js para el estado de las páginas, NUNCA con
// emailDestinoContacto (plan 9, "Salida"). Los textos con formato (comoLlegar, normas, accesibilidad) son jsonb que
// valida compartido/esquemas/textoRico.js desde E3.2.
import { DataTypes } from 'sequelize'

/** @param {import('sequelize').Sequelize} sequelize */
export function definirMuseo(sequelize) {
  return sequelize.define(
    'Museo',
    {
      id: { type: DataTypes.SMALLINT, primaryKey: true, defaultValue: 1 },
      direccion: { type: DataTypes.STRING(200) },
      localidad: { type: DataTypes.STRING(100) },
      provincia: { type: DataTypes.STRING(60) },
      codigoPostal: { type: DataTypes.STRING(10) },
      telefono: { type: DataTypes.STRING(40) },
      emailPublico: { type: DataTypes.STRING(254) },
      emailDestinoContacto: { type: DataTypes.STRING(254) },
      redes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      mapaEmbedUrl: { type: DataTypes.TEXT },
      mapaUrl: { type: DataTypes.TEXT },
      comoLlegar: { type: DataTypes.JSONB },
      normas: { type: DataTypes.JSONB },
      accesibilidad: { type: DataTypes.JSONB },
      notaHorarios: { type: DataTypes.STRING(300) },
      notaTarifas: { type: DataTypes.STRING(300) },
      compraActiva: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      compraUrl: { type: DataTypes.TEXT },
      compraTexto: { type: DataTypes.STRING(40) },
      avisoTexto: { type: DataTypes.STRING(200) },
      avisoHasta: { type: DataTypes.DATEONLY },
      actualizadoPor: { type: DataTypes.INTEGER },
    },
    // Sin created_at: la fila la crea la migración y solo se actualiza.
    { tableName: 'museo', timestamps: true, createdAt: false },
  )
}
