// Datos de ejemplo para trabajar en local (plan 3.4): npm run semilla:ejemplo, después de npm run migrar.
// Solo contra una base local y nunca con NODE_ENV=production (exigirBaseLocal, server/db/guardas.js): pisa datos.
// Todo lo que muestra el sitio va marcado "EJEMPLO ·" y las direcciones son de example.com (reservado para ejemplos),
// como el museo de SIN_BASE (server/museo.js). Crece con cada migración: hoy, la fila del museo, el horario semanal y
// las tarifas; con E3, salas, muestras y novedades; con E4.9, mensajes del formulario. Sin usuarios: el admin se crea
// con npm run crear-admin.
// Se puede correr varias veces: pisa la fila del museo y los 7 días, y reemplaza solo las tarifas "EJEMPLO ·".
import { Op } from 'sequelize'
import { esPrincipal } from '../../principal.js'

const EJEMPLO = 'EJEMPLO · '

const MUSEO = {
  direccion: `${EJEMPLO}Avenida de ejemplo 1234 (Oeste)`,
  localidad: `${EJEMPLO}Ciudad de San Juan`,
  provincia: 'San Juan',
  codigoPostal: '5400',
  telefono: '+54 264 000-0000',
  emailPublico: 'museo@example.com',
  emailDestinoContacto: 'destino@example.com',
  redes: [
    { red: 'instagram', url: 'https://example.com/instagram' },
    { red: 'facebook', url: 'https://example.com/facebook' },
  ],
  mapaEmbedUrl: null,
  mapaUrl: 'https://example.com/mapa',
  // Los textos con formato (como_llegar, normas, accesibilidad) esperan el formato de TipTap (E3.2).
  notaHorarios: `${EJEMPLO}Horarios de prueba: no son los del museo.`,
  notaTarifas: `${EJEMPLO}Precios de prueba: no son los del museo.`,
  compraActiva: false,
  compraUrl: null,
  compraTexto: null,
  avisoTexto: `${EJEMPLO}Aviso de prueba (cierre por feriado).`,
  avisoHasta: null,
  actualizadoPor: null,
}

const MANANA_Y_TARDE = [
  { abre: '09:00', cierra: '13:00' },
  { abre: '16:00', cierra: '20:00' },
]
const HORARIO = [
  { dia: 1, abierto: false, franjas: [], nota: `${EJEMPLO}Cerrado por mantenimiento` },
  { dia: 2, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 3, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 4, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 5, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 6, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: null },
  { dia: 7, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: `${EJEMPLO}Visitas guiadas a las 11` },
]

const TARIFAS = [
  { nombre: `${EJEMPLO}General`, gratuita: false, precio: 3000, condicion: null, orden: 1, visible: true },
  {
    nombre: `${EJEMPLO}Estudiantes y jubilados`,
    gratuita: false,
    precio: 1500,
    condicion: `${EJEMPLO}Con credencial`,
    orden: 2,
    visible: true,
  },
  { nombre: `${EJEMPLO}Menores de 6 años`, gratuita: true, precio: null, condicion: null, orden: 3, visible: true },
  { nombre: `${EJEMPLO}Tarifa oculta`, gratuita: false, precio: 500, condicion: null, orden: 4, visible: false },
]

/** Carga los datos de ejemplo en una transacción. */
export async function cargarEjemplo(sequelize) {
  const { HorarioSemanal, Museo, Tarifa } = sequelize.models
  return sequelize.transaction(async (transaction) => {
    const [museo] = await Museo.upsert({ id: 1, ...MUSEO }, { transaction })
    for (const dia of HORARIO) await HorarioSemanal.upsert(dia, { transaction })
    const borradas = await Tarifa.destroy({ where: { nombre: { [Op.startsWith]: EJEMPLO } }, transaction })
    const tarifas = await Tarifa.bulkCreate(TARIFAS, { transaction })
    return { museo: museo.id, dias: HORARIO.length, tarifas: tarifas.length, tarifasReemplazadas: borradas }
  })
}

if (esPrincipal(import.meta)) {
  const { configDelProceso } = await import('../../config.js')
  const { crearConexion } = await import('../conexion.js')
  const { exigirBaseLocal } = await import('../guardas.js')
  const config = configDelProceso()
  try {
    // Antes de abrir la conexión.
    exigirBaseLocal(config, config.DATABASE_URL)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
  const sequelize = crearConexion(config)
  if (!sequelize) {
    console.error('Falta DATABASE_URL (o está SIN_BASE): no hay base donde cargar el ejemplo.')
    process.exit(1)
  }
  let codigo = 0
  try {
    const r = await cargarEjemplo(sequelize)
    console.log(
      `Ejemplo cargado: museo (fila ${r.museo}), ${r.dias} días de horario y ${r.tarifas} tarifas` +
        (r.tarifasReemplazadas ? ` (reemplazó ${r.tarifasReemplazadas} de ejemplo)` : '') +
        '.',
    )
  } catch (err) {
    console.error(`No se pudo cargar el ejemplo: ${err.message}`)
    codigo = 1
  } finally {
    await sequelize.close()
  }
  process.exit(codigo)
}
