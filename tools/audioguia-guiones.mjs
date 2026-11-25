// Corta el guion de la audioguía en las transcripciones de cada estación (especificación de las audioguías, versión 2,
// secciones 1.2, 12 y 12.1), sin dependencias de npm y sin abrir nada (ni Chrome, ni child_process): lee el guion
// exportado como texto y el manifiesto (audioguias/pistas.json) y escribe NN.txt (o NN-ad.txt) y un informe.
//
//   node tools/audioguia-guiones.mjs --guion <archivo.txt> --salida <carpeta> [--ad] [--dir <carpeta del manifiesto>]
//
// Un desvío a propósito de la especificación (12.1 ponía el corte de los guiones adentro de tools/audioguia-mp3.mjs):
// esa herramienta todavía no existe (faltan los audios), y cuando exista importa cortarGuion de acá. Las transcripciones
// van a tools/salida/audioguias/guiones/ y entran a audioguias/ recién con sus audios, después de la escucha (12.1):
// la herramienta NUNCA escribe en audioguias/ (ni en DIR_AUDIOGUIAS, ni en la carpeta de --dir), porque una estación
// con solo su .txt, sin sus MP3, deja de estar «sin grabar» y es un error para server/audioguia/pistas.js (la saltea
// entera).
//
// Opciones:
//   --guion <archivo>   el guion en texto (UTF-8, con o sin BOM, con CRLF o LF): de Google Docs, Archivo > Descargar >
//                       Texto sin formato (.txt). Un .docx no: lo va a leer tools/audioguia-mp3.mjs. Obligatoria.
//   --salida <carpeta>  dónde escribe (se crea si no está). Obligatoria; por ejemplo tools/salida/audioguias/guiones.
//   --ad                el guion de la versión con audiodescripción: escribe NN-ad.txt e informe-ad.md (así las dos
//                       versiones comparten la carpeta).
//   --dir <carpeta>     la del manifiesto, pistas.json (por defecto DIR_AUDIOGUIAS o <repo>/audioguias). Solo lo lee.
//   --ayuda             esto.
//
// Cómo corta (cortarGuion, pura: un texto y un manifiesto, sin tocar el disco):
// - Si el documento tiene un renglón «TEXTOS DE AUDIOGUÍAS» (el de «EXPERIENCIA MUPA 2026»), corta solo lo que viene
//   después (antes está el «DESGLOSE DE PISTAS», con los mismos encabezados en una lista). Si no lo tiene, el documento
//   entero, y lo avisa. Un renglón con viñeta («* », «- », «• ») nunca es un encabezado.
// - El encabezado de cada estación: «AUDIOGUÍA NN: …» (también «Audioguía 6:», con o sin tilde, con una o dos cifras;
//   después del número, «:», «.», «-», «–», «—», «)» o nada), o un renglón que empieza por el número en dos cifras
//   («07 …», «07. …», «07 - …», como pide la ficha técnica, 12) y sigue con una mayúscula, un signo que abre o nada (así
//   un párrafo como «10 metros de largo…» no es un encabezado). Del título se saca la anotación «(Referencial de sala)»
//   o «(Referencia de sala)» y los espacios de las puntas, y se compara con el del manifiesto: una diferencia es un
//   aviso, no un error (el título de la página es el del manifiesto).
// - La transcripción es SOLO el texto que se graba: lo que viene después de la marca de la voz («🎧 VOZ EN OFF …»,
//   «VOZ EN OFF» o «LOCUTOR/A»; si la marca trae «:» y texto en el mismo renglón, ese texto es el primer párrafo) hasta
//   el encabezado siguiente. Nunca va lo de antes de la marca (la DURACIÓN ESTIMADA, el FOLEY —el ambiente sonoro
//   debajo de la voz: la música y el ambiente de fondo no se anotan, 12—, cualquier otra nota: un aviso si hay una que
//   no es ninguna de esas), ni un renglón de DURACIÓN o de FOLEY que aparezca después de la marca (un aviso), ni una
//   segunda marca de la voz (un aviso: hay una sola voz por pista), ni un renglón que es solo una raya
//   («________________», el separador de Google Docs), ni lo que viene después de una raya: la raya corta el texto de la
//   voz (si después hay algo más que renglones vacíos, otras rayas o el encabezado de un espacio —una nota para el
//   estudio, unos créditos después de la última estación—, un aviso con el primer renglón), ni el encabezado del
//   espacio siguiente al final del texto (el rótulo de un espacio del manifiesto, nombreGuion, solo o con su frase
//   entre comillas: «SALA 3 “EL LABORATORIO. …”». Un renglón así en el medio del texto se deja, con un aviso). Un
//   renglón todo en mayúsculas en el texto de la voz («CRÉDITOS») se deja, con un aviso: suele ser un título o una
//   nota (así se ve también una nota sin raya después de la última estación, aunque los renglones que la siguen quedan
//   en el texto). Lo que está entre corchetes en el texto de la voz («[Suena una tormenta]») va tal cual (12).
// - Una estación sin la marca de la voz es un error (no se adivina dónde empieza el texto que se graba), y también una
//   sin texto después de la marca o con más de TRANSCRIPCION_MAX caracteres (el tope de server/audioguia/pistas.js).
// - Cada párrafo del documento (un renglón del .txt), en un renglón; los párrafos, separados por una línea en blanco;
//   los espacios repetidos de adentro (también tabuladores y espacios duros, como el U+00A0), uno solo; sin espacios a
//   los costados. Nada más se cambia: ni la ortografía, ni la caja, ni la puntuación (D13 y 1.2: el texto del museo,
//   tal cual; las dudas se le preguntan).
// - Los números: exactamente los del manifiesto, cada uno una vez. Uno que falta, uno repetido o uno que el manifiesto
//   no tiene son errores de estructura.
// - Con algún error no escribe ninguna transcripción (así no queda una tanda a medias en la carpeta): solo el informe,
//   con los errores arriba, y sale con 1.
//
// El informe (informe.md, o informe-ad.md): por estación, el título del documento y el del manifiesto, la duración
// estimada que da el guion (marcada si pasa de 90 s: la ficha técnica pide de 60 a 90, 12), las palabras que se dicen
// (sin lo que está entre corchetes) y la duración leída a ~150 palabras por minuto; más los errores y los avisos.
// La lectura es una estimación para comparar: el audio de verdad lo mide tools/audioguia-mp3.mjs.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { numeroEnDosCifras, validarManifiesto } from '../compartido/esquemas/audioguias.js'
import { MANIFIESTO, TRANSCRIPCION_MAX } from '../server/audioguia/pistas.js'
import { esPrincipal } from '../server/principal.js'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** La carpeta de la audioguía del repo, donde la herramienta nunca escribe. */
export const DIR_DEL_REPO = join(RAIZ, 'audioguias')

/** La velocidad de lectura para la estimación del informe. */
export const PALABRAS_POR_MINUTO = 150
/** Lo más que dura una estación común según la ficha técnica (12: de 60 a 90 s). */
export const DURACION_MAX_S = 90

// ——— El corte (puro) ———

/** Los espacios de adentro de un renglón: JS cuenta en \s los tabuladores, el U+00A0, los de U+2000 a U+200A y el U+FEFF. */
const ESPACIOS = /\s+/gu
const juntarEspacios = (texto) => texto.replace(ESPACIOS, ' ').trim()

const SECCION = /^TEXTOS\s+DE\s+AUDIOGU[IÍ]AS\s*:?$/iu
const VINETA = /^(?:[*•◦▪‣·]|-|–)\s/u
const ENCABEZADO_CON_PALABRA = /^AUDIOGU[IÍ]A\s*(\d{1,2})(?!\d)\s*[:.\-–—)]?\s*(.*)$/iu
const ENCABEZADO_CON_NUMERO = /^(\d{2})(?!\d)(?:\s*[:.\-–—)]\s*|\s+|$)(.*)$/u
/** Después de un número suelto, el título empieza con una mayúscula o un signo que abre (o no hay título). */
const COMIENZO_DE_TITULO = /^(?:$|[\p{Lu}¿¡“"«'(])/u
const ANOTACION = /\s*\(\s*Referenci(?:al|a)\s+de\s+sala\s*\)\s*$/iu
const MARCA_DE_VOZ = /^(?:\u{1F3A7}\uFE0F?\s*)?(?:VOZ\s+EN\s+OFF|LOCUTOR\s*\/\s*A)(?![\p{L}\p{N}])/iu
const DURACION = /^DURACI[OÓ]N(?:\s+ESTIMADA)?\s*:\s*(.*)$/iu
const FOLEY = /^FOLEY\s*:/iu
/** Un renglón que es solo una raya: el separador que Google Docs exporta como «________________». */
const RAYA = /^[_\-–—=~*\s]{3,}$/u
/** Lo que puede seguir al rótulo de un espacio en su encabezado: nada, o una frase entre comillas. */
const RESTO_DEL_ENCABEZADO_DE_ESPACIO = /^\s*:?\s*(?:[“"«][^”"»]*[”"»]\s*\.?)?$/u

/**
 * Los segundos de una duración del guion: «00:01:50» → 110, «1:50» → 110. null si no se entiende.
 * @param {string} texto
 */
export function segundosDe(texto) {
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(texto.trim())
  if (!m || Number(m[3]) > 59) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

/** Una duración para el informe: 110 → «1:50». */
export const duracionCorta = (segundos) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

/**
 * Las palabras que se dicen: sin lo que está entre corchetes (un sonido que cuenta algo no lo lee la voz) y contando
 * solo lo que tiene una letra o una cifra (una raya suelta no es una palabra).
 * @param {string[]} parrafos
 */
export function palabrasDichas(parrafos) {
  return parrafos
    .join(' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/\s+/u)
    .filter((p) => /[\p{L}\p{N}]/u.test(p)).length
}

/** El archivo de una transcripción: 7 → '07.txt' (o '07-ad.txt'). */
export const archivoDeTranscripcion = (numero, ad = false) => `${numeroEnDosCifras(numero)}${ad ? '-ad' : ''}.txt`

/** El contenido de una transcripción: un párrafo por renglón, separados por una línea en blanco, con LF y sin BOM. */
export const textoDeTranscripcion = (parrafos) => `${parrafos.join('\n\n')}\n`

/**
 * El número y el título de un encabezado de estación, o null si el renglón no lo es.
 * @param {string} renglon  sin espacios en las puntas
 * @returns {{ numero: number, titulo: string } | null}
 */
export function encabezadoDeEstacion(renglon) {
  const linea = renglon.normalize('NFC')
  if (VINETA.test(linea)) return null
  let m = ENCABEZADO_CON_PALABRA.exec(linea)
  if (!m) {
    m = ENCABEZADO_CON_NUMERO.exec(linea)
    if (!m || !COMIENZO_DE_TITULO.test(m[2])) return null
  }
  const numero = Number(m[1])
  if (numero < 1) return null
  return { numero, titulo: juntarEspacios(m[2].replace(ANOTACION, '')) }
}

/**
 * ¿Es el encabezado de un espacio? El rótulo de uno de los espacios del manifiesto (nombreGuion), solo o con su frase
 * entre comillas. Un párrafo que termina con una cita («…lo llamamos “ciclo de las rocas”.») no lo es: no empieza con
 * el rótulo.
 * @param {string} renglon  sin espacios en las puntas
 * @param {string[]} rotulos
 */
export function esEncabezadoDeEspacio(renglon, rotulos) {
  const linea = renglon.normalize('NFC').toLocaleUpperCase('es')
  return rotulos.some((rotulo) => {
    const r = rotulo.normalize('NFC').toLocaleUpperCase('es')
    return linea.startsWith(r) && RESTO_DEL_ENCABEZADO_DE_ESPACIO.test(linea.slice(r.length))
  })
}

/**
 * ¿Es un renglón todo en mayúsculas? Con al menos dos letras afuera de los corchetes (un sonido escrito en mayúsculas,
 * «[SUENA UN TRUENO]», no cuenta). En el texto de la voz suele ser un título o una nota que no se graba («CRÉDITOS»).
 * @param {string} renglon
 */
export function todoEnMayusculas(renglon) {
  const letras = renglon.normalize('NFC').replace(/\[[^\]]*\]/g, '').replace(/[^\p{L}]/gu, '')
  return letras.length >= 2 && letras === letras.toLocaleUpperCase('es') && letras !== letras.toLocaleLowerCase('es')
}

/** «1 aviso», «2 avisos». */
const cuantos = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

const citar = (texto, largo = 80) => `«${texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto}»`

/**
 * Corta el guion en las transcripciones de las estaciones del manifiesto.
 * @param {string} texto  el guion en texto (con o sin BOM, con CRLF o LF)
 * @param {unknown} manifiesto  el de audioguias/pistas.json, ya leído (se valida otra vez)
 * @param {{ ad?: boolean }} [opciones]  ad: el guion de la versión con audiodescripción (solo cambia los nombres)
 * @returns {{
 *   estaciones: { numero: number, archivo: string, tituloDocumento: string | null, tituloManifiesto: string,
 *     renglon: number | null, duracionGuion: string | null, duracionGuionS: number | null, parrafos: string[],
 *     texto: string, palabras: number, lecturaS: number }[],
 *   errores: string[], avisos: string[], seccion: number | null, renglones: number, ad: boolean }}
 *   estaciones: en el orden del manifiesto (las que tienen un error van igual, sin texto); renglon: el del encabezado
 *   en el documento (desde 1); seccion: el renglón de «TEXTOS DE AUDIOGUÍAS», o null si no está
 */
export function cortarGuion(texto, manifiesto, { ad = false } = {}) {
  const errores = []
  const avisos = []
  const lineas = String(texto).replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)
  const base = { estaciones: [], errores, avisos, seccion: null, renglones: lineas.length, ad }

  const validado = validarManifiesto(manifiesto)
  if (!validado.ok) {
    errores.push(`el manifiesto no pasa el esquema: ${validado.problemas.join('; ')}`)
    return base
  }
  const delManifiesto = validado.manifiesto.recorrido.flatMap((g) => g.estaciones)
  const rotulos = [...new Set(validado.manifiesto.recorrido.map((g) => g.nombreGuion))].sort((a, b) => b.length - a.length)

  // Dónde empieza: después de «TEXTOS DE AUDIOGUÍAS» o, sin ella, desde el principio.
  const secciones = lineas.flatMap((l, i) => (SECCION.test(l.trim().normalize('NFC')) ? [i] : []))
  if (secciones.length > 1) {
    errores.push(`«TEXTOS DE AUDIOGUÍAS» está ${secciones.length} veces (renglones ${secciones.map((i) => i + 1).join(', ')}): no sé desde cuál cortar`)
    return base
  }
  const desde = secciones.length ? secciones[0] + 1 : 0
  base.seccion = secciones.length ? secciones[0] + 1 : null
  if (!secciones.length) avisos.push('el documento no tiene el renglón «TEXTOS DE AUDIOGUÍAS»: se cortó entero (sin los renglones con viñeta)')

  // Los encabezados de estación, con su renglón.
  const encabezados = []
  for (let i = desde; i < lineas.length; i++) {
    const e = encabezadoDeEstacion(lineas[i].trim())
    if (e) encabezados.push({ ...e, indice: i })
  }

  const antes = lineas.slice(desde, encabezados[0]?.indice ?? lineas.length).map((l) => l.trim())
  const sueltos = antes.filter((l) => l && !esEncabezadoDeEspacio(l, rotulos) && !RAYA.test(l))
  if (sueltos.length && secciones.length) {
    avisos.push(`${sueltos.length} renglones antes de la primera estación que no se usan (el primero: ${citar(sueltos[0])})`)
  }

  // Los números contra el manifiesto.
  const esperados = new Map(delManifiesto.map((e) => [e.numero, e]))
  const porNumero = new Map()
  for (const e of encabezados) {
    if (!esperados.has(e.numero)) {
      errores.push(`la ${numeroEnDosCifras(e.numero)} (renglón ${e.indice + 1}) no está en el manifiesto`)
      continue
    }
    if (porNumero.has(e.numero)) {
      errores.push(`la ${numeroEnDosCifras(e.numero)} está dos veces (renglones ${porNumero.get(e.numero).indice + 1} y ${e.indice + 1})`)
      continue
    }
    porNumero.set(e.numero, e)
  }

  // Cada bloque: del encabezado hasta el encabezado siguiente (cualquiera, también uno repetido o de más).
  const estaciones = []
  for (const est of delManifiesto) {
    const nn = numeroEnDosCifras(est.numero)
    const fila = {
      numero: est.numero,
      archivo: archivoDeTranscripcion(est.numero, ad),
      tituloDocumento: null,
      tituloManifiesto: est.titulo,
      renglon: null,
      duracionGuion: null,
      duracionGuionS: null,
      parrafos: [],
      texto: '',
      palabras: 0,
      lecturaS: 0,
    }
    estaciones.push(fila)
    const e = porNumero.get(est.numero)
    if (!e) {
      errores.push(`falta la ${nn} (${citar(est.titulo)})`)
      continue
    }
    fila.renglon = e.indice + 1
    fila.tituloDocumento = e.titulo || null
    if (e.titulo && e.titulo.normalize('NFC') !== est.titulo.normalize('NFC')) {
      avisos.push(`la ${nn}: el título del documento, ${citar(e.titulo, 120)}, no es el del manifiesto, ${citar(est.titulo, 120)}`)
    }
    const siguiente = encabezados.find((x) => x.indice > e.indice)?.indice ?? lineas.length
    const bloque = lineas.slice(e.indice + 1, siguiente).map((l) => l.trim())

    const iVoz = bloque.findIndex((l) => MARCA_DE_VOZ.test(l.normalize('NFC')))
    for (const l of iVoz < 0 ? bloque : bloque.slice(0, iVoz)) {
      const d = DURACION.exec(l.normalize('NFC'))
      if (d) {
        if (fila.duracionGuion === null) {
          fila.duracionGuion = d[1].trim()
          fila.duracionGuionS = segundosDe(d[1])
          if (fila.duracionGuionS === null) avisos.push(`la ${nn}: la duración estimada ${citar(d[1].trim())} no se entiende (se espera 00:01:10)`)
        }
      } else if (l && !FOLEY.test(l.normalize('NFC')) && !RAYA.test(l) && iVoz >= 0) {
        avisos.push(`la ${nn}: antes de la marca de la voz hay un renglón que no se graba y no es la duración ni el FOLEY: ${citar(l)}`)
      }
    }
    if (iVoz < 0) {
      errores.push(`la ${nn} (renglón ${e.indice + 1}) no trae la marca de la voz («🎧 VOZ EN OFF …», «VOZ EN OFF» o «LOCUTOR/A»): no se adivina dónde empieza el texto que se graba`)
      continue
    }

    // El texto de la voz: lo que viene después de la marca (y, si la marca trae «:», lo de después en su renglón).
    const marca = bloque[iVoz]
    const dosPuntos = marca.indexOf(':')
    const voz = [...(dosPuntos >= 0 ? [marca.slice(dosPuntos + 1).trim()] : []), ...bloque.slice(iVoz + 1)]
    // Una raya corta el texto de la voz: lo que viene después (una nota para el estudio, unos créditos después de la
    // última estación) no se graba. Sin un aviso si después solo hay renglones vacíos, otras rayas o el encabezado de un
    // espacio (el separador de Google Docs entre un espacio y el siguiente); si hay algo más, un aviso con el primero.
    const iRaya = voz.findIndex((l) => l && RAYA.test(l))
    if (iRaya >= 0) {
      const tras = voz.slice(iRaya + 1).filter((l) => l && !RAYA.test(l) && !esEncabezadoDeEspacio(l, rotulos))
      if (tras.length) {
        avisos.push(
          `la ${nn}: después de una raya hay ${cuantos(tras.length, 'renglón que no entró', 'renglones que no entraron')} en el texto ` +
            `(el primero: ${citar(tras[0])}): la raya corta el texto de la voz; si es parte de lo que se graba, hay que sacar la raya del guion`,
        )
      }
      voz.length = iRaya
    }
    // Al final, los renglones vacíos, las rayas y el encabezado del espacio siguiente no son del texto.
    while (voz.length) {
      const l = voz.at(-1)
      if (!l || RAYA.test(l) || esEncabezadoDeEspacio(l, rotulos)) voz.pop()
      else break
    }
    const parrafos = []
    for (const l of voz) {
      if (!l || RAYA.test(l)) continue
      const n = l.normalize('NFC')
      if (MARCA_DE_VOZ.test(n)) {
        avisos.push(`la ${nn}: la marca de la voz está otra vez en el texto (${citar(l)}): se sacó, hay una sola voz por pista`)
        continue
      }
      if (FOLEY.test(n) || DURACION.test(n)) {
        avisos.push(`la ${nn}: después de la marca de la voz hay un renglón de ${FOLEY.test(n) ? 'FOLEY' : 'DURACIÓN'} (${citar(l)}): no se graba, se sacó`)
        continue
      }
      if (esEncabezadoDeEspacio(l, rotulos)) {
        avisos.push(`la ${nn}: en el medio del texto hay un renglón que parece el encabezado de un espacio (${citar(l)}): quedó en el texto`)
      } else if (todoEnMayusculas(n)) {
        avisos.push(`la ${nn}: en el texto de la voz hay un renglón todo en mayúsculas (${citar(l)}): quedó en el texto (¿es un título o una nota, como «CRÉDITOS»?)`)
      }
      parrafos.push(juntarEspacios(l))
    }
    if (!parrafos.length) {
      errores.push(`la ${nn} (renglón ${e.indice + 1}) no tiene texto después de la marca de la voz`)
      continue
    }
    const contenido = textoDeTranscripcion(parrafos)
    if (contenido.length > TRANSCRIPCION_MAX) {
      errores.push(`la ${nn}: la transcripción tiene ${contenido.length} caracteres (el tope es ${TRANSCRIPCION_MAX})`)
      continue
    }
    fila.parrafos = parrafos
    fila.texto = contenido
    fila.palabras = palabrasDichas(parrafos)
    fila.lecturaS = Math.round((fila.palabras * 60) / PALABRAS_POR_MINUTO)
  }

  return { ...base, estaciones }
}

/** Una celda de una tabla de Markdown. */
const celda = (texto) => String(texto ?? '—').replace(/\|/g, '\\|').replace(/\s+/g, ' ')

/**
 * El informe en Markdown.
 * @param {ReturnType<typeof cortarGuion>} resultado
 * @param {{ guion: string, manifiesto: string, salida?: string, escritas?: boolean }} datos  los nombres para la cabecera
 */
export function informe(resultado, { guion, manifiesto, salida, escritas = !resultado.errores.length }) {
  const { estaciones, errores, avisos, seccion, renglones, ad } = resultado
  const largas = estaciones.filter((e) => e.duracionGuionS !== null && e.duracionGuionS > DURACION_MAX_S)
  const largasLeidas = estaciones.filter((e) => e.texto && e.lecturaS > DURACION_MAX_S)
  const suma = (lista, campo) => lista.reduce((t, e) => t + (e[campo] ?? 0), 0)
  const r = []
  r.push(`# Las transcripciones de la audioguía${ad ? ', con audiodescripción' : ''}`, '')
  r.push(`- Guion: \`${guion}\` (${renglones} renglones).`)
  r.push(`- Manifiesto: \`${manifiesto}\`, ${estaciones.length} estaciones.`)
  r.push(seccion ? `- Corte: desde «TEXTOS DE AUDIOGUÍAS» (renglón ${seccion}).` : '- Corte: el documento entero (no tiene «TEXTOS DE AUDIOGUÍAS»).')
  r.push(
    escritas
      ? `- Escritas: ${estaciones.length} transcripciones (${estaciones[0]?.archivo ?? '—'} a ${estaciones.at(-1)?.archivo ?? '—'})${salida ? ` en \`${salida}\`` : ''}, UTF-8 sin BOM, con LF.`
      : '- **No se escribió ninguna transcripción**: hay errores (abajo).',
  )
  r.push(`- Errores: ${errores.length}. Avisos: ${avisos.length}.`)
  r.push(
    `- La duración estimada del guion, de las ${estaciones.length}: ${duracionCorta(suma(estaciones, 'duracionGuionS'))}` +
      `; ${cuantos(largas.length, 'pasa', 'pasan')} de ${DURACION_MAX_S} s (la ficha técnica pide de 60 a ${DURACION_MAX_S} s): ` +
      `${largas.map((e) => `${numeroEnDosCifras(e.numero)} (${duracionCorta(e.duracionGuionS)})`).join(', ') || 'ninguna'}.`,
  )
  r.push(
    `- Leídas a ~${PALABRAS_POR_MINUTO} palabras por minuto: ${duracionCorta(suma(estaciones, 'lecturaS'))} (${suma(estaciones, 'palabras')} palabras)` +
      `; ${cuantos(largasLeidas.length, 'pasaría', 'pasarían')} de ${DURACION_MAX_S} s: ` +
      `${largasLeidas.map((e) => `${numeroEnDosCifras(e.numero)} (${duracionCorta(e.lecturaS)})`).join(', ') || 'ninguna'}.`,
    '',
  )
  if (errores.length) r.push(`## Errores (${errores.length})`, '', ...errores.map((x) => `- ${x}`), '')
  if (avisos.length) r.push(`## Avisos (${avisos.length})`, '', ...avisos.map((x) => `- ${x}`), '')
  r.push('## Por estación', '')
  r.push(`| N.º | Archivo | Título en el documento | Título en el manifiesto | Duración del guion | Palabras | Leída a ~${PALABRAS_POR_MINUTO} por minuto |`)
  r.push('|---|---|---|---|---|---|---|')
  for (const e of estaciones) {
    const igual = e.tituloDocumento !== null && e.tituloDocumento.normalize('NFC') === e.tituloManifiesto.normalize('NFC')
    const duracion = e.duracionGuionS === null
      ? celda(e.duracionGuion)
      : e.duracionGuionS > DURACION_MAX_S
        ? `**${duracionCorta(e.duracionGuionS)} (más de ${DURACION_MAX_S} s)**`
        : duracionCorta(e.duracionGuionS)
    r.push(
      `| ${numeroEnDosCifras(e.numero)} | ${e.texto ? e.archivo : '—'} | ${celda(e.tituloDocumento)} | ${igual ? '(igual)' : `**${celda(e.tituloManifiesto)}**`} | ${duracion} | ${e.texto ? e.palabras : '—'} | ${!e.texto ? '—' : e.lecturaS > DURACION_MAX_S ? `**${duracionCorta(e.lecturaS)}**` : duracionCorta(e.lecturaS)} |`,
    )
  }
  r.push('')
  r.push(
    'La transcripción es solo el texto de la voz (lo que va después de «🎧 VOZ EN OFF …»): sin el encabezado, la duración, ' +
      'el FOLEY ni el encabezado del espacio siguiente; lo que va entre corchetes, tal cual. Cada párrafo en un renglón, ' +
      'con los espacios repetidos juntados; nada más se cambió. Las palabras no cuentan lo que va entre corchetes. ' +
      'Antes de la escucha, se revisan una vez contra el documento (especificación de las audioguías, 12.1).',
    '',
  )
  return r.join('\n')
}

// ——— Lo que toca el disco ———

/**
 * La ruta real (sin symlinks ni junctions), aunque todavía no exista: la del ancestro que existe más el resto.
 * @param {string} ruta
 */
export function rutaReal(ruta) {
  const resto = []
  let actual = resolve(ruta)
  for (;;) {
    try {
      return join(realpathSync.native(actual), ...resto)
    } catch {
      const padre = dirname(actual)
      if (padre === actual) return resolve(ruta)
      resto.unshift(basename(actual))
      actual = padre
    }
  }
}

/**
 * ¿ruta es carpeta o está adentro? Con las rutas reales y, en Windows, sin distinguir mayúsculas.
 * @param {string} carpeta
 * @param {string} ruta
 */
export function estaDentro(carpeta, ruta) {
  const caja = process.platform === 'win32' ? (s) => s.toLowerCase() : (s) => s
  const rel = relative(caja(rutaReal(carpeta)), caja(rutaReal(ruta)))
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

/**
 * El texto de un archivo de guion: UTF-8 estricto (un .txt guardado en Windows-1252 da error, no letras cambiadas) y
 * nunca un .docx (que es un ZIP).
 * @param {Buffer} bytes
 * @returns {{ ok: true, texto: string } | { ok: false, error: string }}
 */
export function textoDelArchivo(bytes) {
  if (bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return { ok: false, error: 'es un .docx (un ZIP), no texto: en Google Docs, Archivo > Descargar > Texto sin formato (.txt)' }
  }
  try {
    return { ok: true, texto: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  } catch {
    return { ok: false, error: 'no es UTF-8 (¿se guardó en ANSI o Windows-1252?): guardalo otra vez como UTF-8' }
  }
}

const AYUDA = `Uso: node tools/audioguia-guiones.mjs --guion <archivo.txt> --salida <carpeta> [--ad] [--dir <carpeta del manifiesto>]
Corta el guion en las transcripciones de cada estación (NN.txt, o NN-ad.txt con --ad) y deja un informe.
Nunca escribe en audioguias/: las transcripciones entran ahí con sus audios, después de la escucha.`

/**
 * Los argumentos.
 * @param {string[]} argv
 * @returns {{ ok: true, guion: string | null, salida: string | null, ad: boolean, dir: string, ayuda: boolean } | { ok: false, error: string }}
 */
export function leerArgumentos(argv) {
  const r = {
    guion: null,
    salida: null,
    ad: false,
    dir: process.env.DIR_AUDIOGUIAS ? resolve(RAIZ, process.env.DIR_AUDIOGUIAS) : DIR_DEL_REPO,
    ayuda: false,
  }
  const valor = (i, arg) => {
    const v = argv[i + 1]
    if (typeof v !== 'string' || v.startsWith('--') || !v.trim()) throw new Error(`${arg} lleva un valor`)
    return v
  }
  try {
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]
      if (arg === '--ad') r.ad = true
      else if (arg === '--ayuda' || arg === '-h') r.ayuda = true
      else if (arg === '--guion') r.guion = resolve(valor(i++, arg))
      else if (arg === '--salida') r.salida = resolve(valor(i++, arg))
      else if (arg === '--dir') r.dir = resolve(valor(i++, arg))
      else throw new Error(`no conozco la opción ${arg}`)
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
  if (r.ayuda) return { ok: true, ...r }
  if (!r.guion) return { ok: false, error: 'falta --guion con el guion exportado como texto' }
  if (!r.salida) return { ok: false, error: 'falta --salida con la carpeta donde escribir (por ejemplo tools/salida/audioguias/guiones)' }
  return { ok: true, ...r }
}

/**
 * La carpeta de la audioguía en la que no se escribe, o null: la del repo, la de DIR_AUDIOGUIAS y la del manifiesto.
 * @param {string} salida
 * @param {string} dir  la del manifiesto
 */
export function carpetaProhibida(salida, dir) {
  const prohibidas = [DIR_DEL_REPO, dir, ...(process.env.DIR_AUDIOGUIAS ? [resolve(RAIZ, process.env.DIR_AUDIOGUIAS)] : [])]
  return prohibidas.find((carpeta) => estaDentro(carpeta, salida)) ?? null
}

/** El comando. Devuelve el código de salida. */
export function principal(argv = process.argv.slice(2)) {
  const args = leerArgumentos(argv)
  if (!args.ok) {
    console.error(`${args.error}\n${AYUDA}`)
    return 1
  }
  if (args.ayuda) {
    console.log(AYUDA)
    return 0
  }

  const prohibida = carpetaProhibida(args.salida, args.dir)
  if (prohibida) {
    console.error(
      `No escribo en ${prohibida} (ni adentro): es la carpeta de la audioguía. Las transcripciones entran ahí recién con ` +
        'sus audios, después de la escucha (especificación de las audioguías, 12.1): una estación con solo su .txt, sin ' +
        'sus MP3, deja de estar «sin grabar» y server/audioguia/pistas.js la saltea entera como un error. Usá una carpeta ' +
        'de tools/salida/audioguias/, por ejemplo tools/salida/audioguias/guiones.',
    )
    return 1
  }

  const rutaManifiesto = join(args.dir, MANIFIESTO)
  let manifiesto
  try {
    manifiesto = JSON.parse(readFileSync(rutaManifiesto, 'utf8').replace(/^\uFEFF/, ''))
  } catch (err) {
    console.error(`No puedo leer ${rutaManifiesto} (${err.code === 'ENOENT' ? 'no existe' : err.message}). Con --dir, la carpeta del manifiesto.`)
    return 1
  }
  let bytes
  try {
    bytes = readFileSync(args.guion)
  } catch (err) {
    console.error(`No puedo leer el guion ${args.guion} (${err.code === 'ENOENT' ? 'no existe' : err.message}).`)
    return 1
  }
  const leido = textoDelArchivo(bytes)
  if (!leido.ok) {
    console.error(`El guion ${args.guion} ${leido.error}.`)
    return 1
  }

  const resultado = cortarGuion(leido.texto, manifiesto, { ad: args.ad })
  const escritas = !resultado.errores.length
  const nombreInforme = args.ad ? 'informe-ad.md' : 'informe.md'
  try {
    mkdirSync(args.salida, { recursive: true })
    if (escritas) for (const e of resultado.estaciones) writeFileSync(join(args.salida, e.archivo), e.texto, 'utf8')
    const rel = (ruta) => (estaDentro(RAIZ, ruta) ? relative(RAIZ, ruta).split(sep).join('/') : ruta)
    writeFileSync(
      join(args.salida, nombreInforme),
      informe(resultado, { guion: basename(args.guion), manifiesto: rel(rutaManifiesto), salida: rel(args.salida), escritas }),
      'utf8',
    )
  } catch (err) {
    console.error(`No puedo escribir en ${args.salida}: ${err.message}`)
    return 1
  }

  for (const a of resultado.avisos) console.error(`aviso: ${a}`)
  if (!escritas) {
    for (const x of resultado.errores) console.error(`error: ${x}`)
    console.error(
      `${cuantos(resultado.errores.length, 'error', 'errores')} de estructura: no escribí ninguna transcripción (los .txt que haya en ` +
        `${args.salida} son de antes). El detalle, en ${join(args.salida, nombreInforme)}.`,
    )
    return 1
  }
  const largas = resultado.estaciones.filter((e) => e.duracionGuionS > DURACION_MAX_S).length
  console.log(
    `${resultado.estaciones.length} transcripciones en ${args.salida} (${resultado.estaciones[0].archivo} a ` +
      `${resultado.estaciones.at(-1).archivo}) y ${nombreInforme}. ${cuantos(resultado.avisos.length, 'aviso', 'avisos')}; ` +
      `${cuantos(largas, 'estación pasa', 'estaciones pasan')} de ${DURACION_MAX_S} s según el guion.`,
  )
  return 0
}

if (esPrincipal(import.meta)) {
  process.exitCode = principal()
}
