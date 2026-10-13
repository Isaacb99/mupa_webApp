// Los datos públicos del museo que van en el estado de cada página (el pie, el JSON-LD y, desde E4, Visitas y
// Contacto), con "el último museo bueno" en memoria por si la base no responde (plan 2.3 y 6.3).
//
// En E0 todavía no hay tablas: leerMuseo() devuelve un objeto vacío y la Home no usa nada de esto (el pie con estos
// datos llega con E4.1). En E2.3 leerMuseo() pasa a leer la fila museo y el horario_semanal, NUNCA
// email_destino_contacto (plan 9, "Salida").
//
// Con SIN_BASE (solo para probar en local, plan 6.7) no se consulta nada y el museo es uno de ejemplo: "maximo" (todos
// los campos llenos, 6 redes, dirección larga: así lo que el museo cargue después queda dentro de lo probado) o
// "vacio". Las direcciones son de example.com (reservado para ejemplos). La forma de este objeto es provisoria: la
// fija E2.3 junto con la del panel.
import { codigoDeError, log } from './log.js'

const EJEMPLO = 'EJEMPLO · '

export const MUSEO_MAXIMO = Object.freeze({
  direccion: `${EJEMPLO}Avenida de ejemplo 1234 (Oeste), entre calle Uno y calle Dos, edificio de la ex estación`,
  localidad: `${EJEMPLO}Ciudad de San Juan`,
  provincia: 'San Juan',
  codigoPostal: '5400',
  telefono: '+54 264 000-0000',
  emailPublico: 'museo@example.com',
  redes: [
    { red: 'instagram', url: 'https://example.com/instagram' },
    { red: 'facebook', url: 'https://example.com/facebook' },
    { red: 'youtube', url: 'https://example.com/youtube' },
    { red: 'tiktok', url: 'https://example.com/tiktok' },
    { red: 'x', url: 'https://example.com/x' },
    { red: 'linkedin', url: 'https://example.com/linkedin' },
  ],
  mapaUrl: 'https://example.com/mapa',
  notaHorarios: `${EJEMPLO}Los feriados nacionales el museo abre en horario de domingo.`,
  horarios: [1, 2, 3, 4, 5, 6, 7].map((dia) => ({
    dia,
    abierto: dia !== 1,
    franjas: dia === 1 ? [] : [{ abre: '09:00', cierra: '13:00' }, { abre: '17:00', cierra: '21:00' }],
    nota: null,
  })),
})

export const MUSEO_VACIO = Object.freeze({})

/** @param {{ sinBase: false | 'maximo' | 'vacio' }} config */
export function crearMuseoPublico(config, { leerMuseo = async () => ({}) } = {}) {
  if (config.sinBase) {
    const fijo = config.sinBase === 'vacio' ? MUSEO_VACIO : MUSEO_MAXIMO
    return async () => fijo
  }
  let ultimoMuseo = null
  return async function museoPublico() {
    try {
      return (ultimoMuseo = await leerMuseo())
    } catch (err) {
      log('aviso', 'museo_sin_base', { mensaje: err.message, codigo: codigoDeError(err) })
      return ultimoMuseo ?? MUSEO_VACIO
    }
  }
}
