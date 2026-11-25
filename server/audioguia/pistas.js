// La lectura de audioguias/ al arrancar (especificación de las audioguías, versión 2, secciones 1.2 y 1.4):
// cargarPistas(dir) lee el manifiesto (pistas.json), valida la cabecera y el final de cada MP3 (server/audioguia/mp3.js,
// de a una pista por vez y unos pocos kB cada una: el audio lo sirve send desde el disco) y lee cada transcripción.
// Sincrónica, una vez, al armar la app (la llama audioguiaDeLaApp de server/app.js, si hay AUDIOGUIA_CLAVE). El sitio
// NUNCA deja de arrancar por la audioguía: lo que no anda se anota y se saltea.
//
// Una estación del manifiesto SIN NINGUNO de sus cuatro archivos (07.mp3, 07-ad.mp3, 07.txt y 07-ad.txt) está «sin
// grabar» (24/11/2026, la etapa de las recetas): el manifiesto real lleva las 35 estaciones del guion desde antes de que
// lleguen las grabaciones, y una entrega parcial (de la 01 a la 18) deja así las demás. Se saltea sin un error: va a
// sinGrabar y, si hay alguna, una sola línea de aviso, audioguia_sin_grabar, con cuántas. Con uno solo de los cuatro
// archivos ya no está sin grabar: lo que falta es un error, como sigue.
//
// Si algo falla:
// - una versión de una estación que no anda (falta el MP3 o el .txt, el MP3 no pasa leerMp3, el bitrate no es el que
//   declara el manifiesto, la transcripción está vacía o es muy larga): se loguea audioguia_pista_invalida con la
//   estación de esa versión ('07-ad') y el motivo, y se saltea la ESTACIÓN ENTERA (las dos versiones): nunca queda una
//   estación con una sola versión;
// - un grupo que se queda sin estaciones se saltea;
// - sin manifiesto, con un manifiesto que no pasa el esquema o sin ninguna estación válida, no hay audioguía (quien
//   arma la app la deja apagada, 404) y se loguea audioguia_sin_pistas como aviso, con el motivo.
// El log lleva solo el id de la estación y un motivo técnico: nunca un título, una transcripción ni nada de un pedido.
//
// Las transcripciones (1.2): UTF-8, sin BOM (se saca si viene), hasta TRANSCRIPCION_MAX caracteres, los párrafos
// separados por una línea en blanco y las líneas de un párrafo juntadas con un espacio. Da lo mismo si el .txt salió
// del Bloc de notas, de Word o de git con CRLF. El manifiesto, igual: con BOM y CRLF se lee.
// Los nombres de los archivos salen del número de la estación (A11), nunca de algo que llega de un pedido.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { log as logDelServicio } from '../log.js'
import { KBPS_COMUN, numeroEnDosCifras, validarManifiesto } from '../../compartido/esquemas/audioguias.js'
import { leerMp3DeArchivo } from './mp3.js'

/** El nombre del manifiesto adentro de la carpeta. */
export const MANIFIESTO = 'pistas.json'
/** El tope de una transcripción, en caracteres. */
export const TRANSCRIPCION_MAX = 20_000
/** Las dos versiones de cada estación y el sufijo de sus archivos. */
export const SUFIJOS = Object.freeze({ comun: '', ad: '-ad' })

/** Los cuatro archivos de una estación (A11): 7 → ['07.mp3', '07.txt', '07-ad.mp3', '07-ad.txt']. */
export const archivosDeLaEstacion = (numero) => {
  const nn = numeroEnDosCifras(numero)
  return Object.values(SUFIJOS).flatMap((sufijo) => [`${nn}${sufijo}.mp3`, `${nn}${sufijo}.txt`])
}

/**
 * Si la carpeta tiene algún MP3: para el aviso de server/app.js («hay pistas y falta AUDIOGUIA_CLAVE»). El manifiesto
 * solo, sin grabaciones, no es una audioguía que quedó sin clave. Sin la carpeta, false.
 * @param {string} dir
 */
export function hayGrabaciones(dir) {
  try {
    return readdirSync(dir).some((nombre) => nombre.toLowerCase().endsWith('.mp3'))
  } catch {
    return false
  }
}

const sinBom = (texto) => (texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto)

/**
 * Los párrafos de una transcripción: separados por una línea en blanco (que puede tener espacios), con las líneas de
 * cada uno juntadas con un espacio y sin los vacíos.
 * @param {string} texto
 * @returns {string[]}
 */
export function parrafosDe(texto) {
  return sinBom(texto)
    .split(/\r?\n[ \t]*\r?\n/)
    .map((parrafo) =>
      parrafo
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
}

/** La duración a la vista: 72 → '1:12'. */
export const duracionCorta = (segundos) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

/**
 * La duración para el lector de pantalla (L2-16: «1 min 12 s» la leían distinto los lectores en castellano):
 * 60 → '1 minuto', 72 → '1 minuto 12 segundos', 125 → '2 minutos 5 segundos', 45 → '45 segundos'.
 */
export function duracionLarga(segundos) {
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  const partes = []
  if (minutos) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`)
  if (resto || !minutos) partes.push(`${resto} ${resto === 1 ? 'segundo' : 'segundos'}`)
  return partes.join(' ')
}

/**
 * Una versión de una estación: su MP3 y su transcripción. Tira con el motivo si algo no anda.
 * @param {string} dir
 * @param {{ numero: number, kbps?: number, kbpsAd?: number }} estacion
 * @param {'comun' | 'ad'} version
 */
function leerVersion(dir, estacion, version) {
  const id = `${numeroEnDosCifras(estacion.numero)}${SUFIJOS[version]}`
  const nombreArchivo = `${id}.mp3`
  const kbpsDeclarado = (version === 'ad' ? estacion.kbpsAd : estacion.kbps) ?? KBPS_COMUN

  let mp3
  try {
    mp3 = leerMp3DeArchivo(join(dir, nombreArchivo))
  } catch (err) {
    throw new Error(err?.code === 'ENOENT' ? `falta ${nombreArchivo}` : `${nombreArchivo}: ${err.message}`)
  }
  if (mp3.kbps !== kbpsDeclarado) {
    throw new Error(kbpsDeclarado === KBPS_COMUN
      ? `${nombreArchivo}: ${mp3.kbps} kbps sin declarar (se esperaba ${KBPS_COMUN})`
      : `${nombreArchivo}: ${mp3.kbps} kbps y la estación declara ${kbpsDeclarado}`)
  }

  let texto
  try {
    texto = readFileSync(join(dir, `${id}.txt`), 'utf8')
  } catch {
    throw new Error(`falta ${id}.txt`)
  }
  texto = sinBom(texto)
  if (texto.length > TRANSCRIPCION_MAX) throw new Error(`${id}.txt: más de ${TRANSCRIPCION_MAX} caracteres`)
  const parrafos = parrafosDe(texto)
  if (!parrafos.length) throw new Error(`${id}.txt: está vacío`)

  return {
    id,
    datos: {
      numero: estacion.numero,
      version,
      nombreArchivo,
      bytes: mp3.bytes,
      kbps: mp3.kbps,
      duracionS: mp3.duracionS,
      duracion: duracionCorta(mp3.duracionS),
      duracionLarga: duracionLarga(mp3.duracionS),
      parrafos,
    },
  }
}

/**
 * Lee audioguias/: el manifiesto, los MP3 y las transcripciones.
 * @param {string} dir  la carpeta (DIR_AUDIOGUIAS; por defecto, <repo>/audioguias)
 * @param {{ log?: typeof logDelServicio, nombresDelPlano?: Record<string, string> }} [opciones]
 *   log: el del servicio (las pruebas pasan uno que anota); nombresDelPlano: ver compartido/esquemas/audioguias.js
 * @returns {{ dir: string, version: number | null, grupos: object[], espacios: Set<string>,
 *   estaciones: Map<string, object>, provisorias: string[], sinGrabar: string[], problemas: string[] }}
 *   grupos: el recorrido que quedó, en orden, cada uno con su ancla (el id de su h2: espacio-<id>, y espacio-<id>-fin
 *   en la segunda aparición de Recepción, con alFinal) y sus estaciones ({ id: '07', numero, titulo,
 *   tituloProvisorio }); espacios: los ids que quedaron (para validar un QR); estaciones: '07' y '07-ad' → sus datos
 *   (lo único que consulta la ruta del audio); provisorias: las estaciones con tituloProvisorio (npm test avisa y el
 *   script de las URL se niega con mupa.ar); sinGrabar: las estaciones sin ninguno de sus cuatro archivos ('19'),
 *   salteadas sin un error; problemas: lo que se salteó por un error, como texto para npm test
 */
export function cargarPistas(dir, { log = logDelServicio, nombresDelPlano } = {}) {
  const vacia = (problemas) => ({
    dir,
    version: null,
    grupos: [],
    espacios: new Set(),
    estaciones: new Map(),
    provisorias: [],
    sinGrabar: [],
    problemas,
  })

  let datos
  try {
    datos = JSON.parse(sinBom(readFileSync(join(dir, MANIFIESTO), 'utf8')))
  } catch (err) {
    const motivo = err?.code === 'ENOENT' ? 'sin manifiesto' : `${MANIFIESTO} no se puede leer: ${err.message}`
    log('aviso', 'audioguia_sin_pistas', { motivo })
    return vacia([motivo])
  }

  const validado = validarManifiesto(datos, { nombresDelPlano })
  if (!validado.ok) {
    log('aviso', 'audioguia_sin_pistas', { motivo: 'manifiesto inválido', problemas: validado.problemas })
    return vacia(validado.problemas)
  }
  const { version, recorrido } = validado.manifiesto

  const estaciones = new Map()
  const grupos = []
  const provisorias = []
  const sinGrabar = []
  const problemas = []
  const apariciones = new Map()
  for (const grupo of recorrido) {
    const vez = (apariciones.get(grupo.espacio) ?? 0) + 1
    apariciones.set(grupo.espacio, vez)
    const suyas = []
    for (const estacion of grupo.estaciones) {
      if (!archivosDeLaEstacion(estacion.numero).some((nombre) => existsSync(join(dir, nombre)))) {
        sinGrabar.push(numeroEnDosCifras(estacion.numero))
        continue
      }
      const leidas = []
      try {
        for (const v of Object.keys(SUFIJOS)) {
          try {
            leidas.push(leerVersion(dir, estacion, v))
          } catch (err) {
            err.estacion = `${numeroEnDosCifras(estacion.numero)}${SUFIJOS[v]}`
            throw err
          }
        }
      } catch (err) {
        log('error', 'audioguia_pista_invalida', { estacion: err.estacion, motivo: err.message })
        problemas.push(`${err.estacion}: ${err.message}`)
        continue
      }
      for (const { id, datos: d } of leidas) estaciones.set(id, { ...d, espacio: grupo.espacio })
      const id = numeroEnDosCifras(estacion.numero)
      if (estacion.tituloProvisorio) provisorias.push(id)
      suyas.push({ id, numero: estacion.numero, titulo: estacion.titulo, tituloProvisorio: Boolean(estacion.tituloProvisorio) })
    }
    if (!suyas.length) continue
    grupos.push({
      espacio: grupo.espacio,
      nombre: grupo.nombre,
      nombreGuion: grupo.nombreGuion,
      titulo: grupo.titulo ?? null,
      lema: grupo.lema ?? null,
      ancla: vez === 1 ? `espacio-${grupo.espacio}` : `espacio-${grupo.espacio}-fin`,
      alFinal: vez > 1,
      estaciones: suyas,
    })
  }

  if (sinGrabar.length) log('aviso', 'audioguia_sin_grabar', { estaciones: sinGrabar.length })
  if (!estaciones.size) {
    log('aviso', 'audioguia_sin_pistas', { motivo: 'ninguna estación válida' })
    return { ...vacia(problemas), version, sinGrabar }
  }
  return { dir, version, grupos, espacios: new Set(grupos.map((g) => g.espacio)), estaciones, provisorias, sinGrabar, problemas }
}
