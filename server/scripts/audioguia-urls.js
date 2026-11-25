// Las URL firmadas de los QR de la audioguía (especificación de las audioguías, versión 2, secciones 3.2, 8.1 y 8.5):
// una por espacio, en el orden del recorrido y con Recepción una sola vez (12 renglones con el recorrido completo),
// como <espacio><TAB><url>, para tools/audioguia-qr.mjs, que arma los SVG y los PDF en la PC sin la clave.
//
//   npm run audioguia-urls -- --url https://mupa.ar/                    (los definitivos: en el Shell de Render)
//   npm run audioguia-urls -- --prueba --host http://192.168.0.10:5183/ (los de prueba: Render o la red local)
//
// - Lee AUDIOGUIA_CLAVE y el manifiesto (DIR_AUDIOGUIAS, por defecto audioguias/) del entorno donde corre: la clave de
//   producción no sale de Render (S2 de la verificación de la versión 1). Para la prueba en la red local, con una clave
//   descartable que no es la de Render.
// - Nunca escribe la clave. Las URL sí, en la salida (stdout, una por renglón): valen lo mismo que los QR impresos.
//   Lo demás (el resumen y los problemas), en stderr, así se puede copiar la salida sola.
// - --url (o --host, el mismo valor): el origen de las URL, con o sin la barra final; sin él, URL_PUBLICA. Sin --prueba
//   tiene que ser https://mupa.ar/ (los carteles definitivos, después del corte del dominio); con --prueba, cualquier
//   otro origen http(s) (mupa-web.onrender.com, la red local), nunca mupa.ar.
// - Sale con 1: sin clave o con una mal formada (server/config.js la deja apagada sin tirar: acá se dice, sin el
//   valor), sin ninguna estación válida, con una opción que no conoce o, para los definitivos, con
//   alguna estación con tituloProvisorio, salteada o sin grabar (no se imprimen carteles definitivos con un título
//   provisorio ni con un espacio a medias). Con --prueba, esas tres van como aviso.
// No usa la base ni la red.
import { esPrincipal } from '../principal.js'

/** El host de los QR definitivos. */
export const HOST_DEFINITIVO = 'mupa.ar'

/**
 * Lee los argumentos.
 * @param {string[]} argv
 * @returns {{ ok: true, url: string | null, prueba: boolean } | { ok: false, error: string }}
 */
export function leerArgumentos(argv) {
  let url = null
  let prueba = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--prueba') prueba = true
    else if (arg === '--url' || arg === '--host') {
      const valor = argv[++i]
      if (typeof valor !== 'string' || valor.startsWith('--')) return { ok: false, error: `${arg} lleva un origen, p. ej. https://mupa.ar/` }
      if (url !== null && url !== valor) return { ok: false, error: '--url y --host son lo mismo: uno solo' }
      url = valor
    } else return { ok: false, error: `no conozco la opción ${arg}` }
  }
  return { ok: true, url, prueba }
}

/**
 * El origen de las URL, con la barra final, o un error.
 * @param {string} texto
 * @param {boolean} prueba
 * @returns {{ ok: true, origen: string } | { ok: false, error: string }}
 */
export function origenDe(texto, prueba) {
  if (!URL.canParse(texto)) return { ok: false, error: 'el origen tiene que ser una URL, p. ej. https://mupa.ar/' }
  const u = new URL(texto)
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.search || u.hash || u.pathname !== '/') {
    return { ok: false, error: 'el origen tiene que ser solo http(s)://host[:puerto]/, sin ruta ni consulta' }
  }
  const definitivo = u.protocol === 'https:' && u.hostname === HOST_DEFINITIVO && !u.port
  if (prueba && u.hostname === HOST_DEFINITIVO) return { ok: false, error: '--prueba es para otro host (Render o la red local), no mupa.ar' }
  if (!prueba && !definitivo) return { ok: false, error: `sin --prueba, solo https://${HOST_DEFINITIVO}/ (los carteles definitivos)` }
  return { ok: true, origen: `${u.origin}/` }
}

/**
 * Los renglones de la salida: un espacio por renglón, en el orden del recorrido, con Recepción una sola vez.
 * @param {{ kQR: Buffer }} claves
 * @param {ReturnType<typeof import('../audioguia/pistas.js').cargarPistas>} audioguia
 * @param {string} origen  con la barra final
 * @param {(claves: object, espacio: string, version: number) => string} codigoDeQr
 * @returns {string[]}
 */
export function renglones(claves, audioguia, origen, codigoDeQr) {
  const vistos = new Set()
  const lista = []
  for (const { espacio } of audioguia.grupos) {
    if (vistos.has(espacio)) continue
    vistos.add(espacio)
    lista.push(`${espacio}\t${origen}audioguia/q/${codigoDeQr(claves, espacio, audioguia.version)}`)
  }
  return lista
}

if (esPrincipal(import.meta)) {
  const fallar = (mensaje) => {
    console.error(mensaje)
    process.exit(1)
  }
  const args = leerArgumentos(process.argv.slice(2))
  if (!args.ok) {
    fallar(`${args.error}\nUso: npm run audioguia-urls -- --url https://mupa.ar/\n     npm run audioguia-urls -- --prueba --host <origen de prueba>`)
  }
  const { configDelProceso } = await import('../config.js')
  const { cargarPistas } = await import('../audioguia/pistas.js')
  const { codigoDeQr, crearClaves } = await import('../audioguia/firma.js')
  const config = configDelProceso()
  if (config.audioguiaClaveInvalida) {
    fallar('AUDIOGUIA_CLAVE está mal formada (de 32 a 128 letras, números, - o _, sin espacios): generala otra vez en el Shell de Render.')
  }
  if (!config.AUDIOGUIA_CLAVE) fallar('Falta AUDIOGUIA_CLAVE en el entorno: sin ella no hay QR (se genera en el Shell de Render).')
  const origen = origenDe(args.url ?? config.urlPublica, args.prueba)
  if (!origen.ok) fallar(origen.error)

  // Lo que cargarPistas loguea (lo que se salteó) va a stderr, legible y sin el formato del servicio.
  const audioguia = cargarPistas(config.dirAudioguias, {
    log: (nivel, evento, datos) => console.error(`${nivel}: ${evento}${datos?.estacion ? ` ${datos.estacion}` : ''}${datos?.motivo ? `: ${datos.motivo}` : ''}`),
  })
  if (!audioguia.estaciones.size) fallar(`No hay ninguna estación válida en ${config.dirAudioguias}: no hay QR que generar.`)

  const definitivos = !args.prueba
  const bloqueos = []
  if (audioguia.provisorias.length) bloqueos.push(`estaciones con tituloProvisorio: ${audioguia.provisorias.join(', ')}`)
  if (audioguia.problemas.length) bloqueos.push(`estaciones salteadas: ${audioguia.problemas.length} (arriba, por qué)`)
  // Las que el manifiesto lista y no tienen ningún archivo (24/11/2026): con alguna, el recorrido está a medias y faltaría
  // el QR de los espacios que se quedan sin estaciones.
  if (audioguia.sinGrabar.length) bloqueos.push(`estaciones sin grabar: ${audioguia.sinGrabar.join(', ')}`)
  if (bloqueos.length && definitivos) {
    fallar(`No se generan los QR definitivos con ${bloqueos.join(' y ')}. Para probar, --prueba con el host de prueba.`)
  }
  for (const b of bloqueos) console.error(`aviso: ${b}`)

  const salida = renglones(crearClaves(config.AUDIOGUIA_CLAVE), audioguia, origen.origen, codigoDeQr)
  console.log(salida.join('\n'))
  console.error(
    `${salida.length} QR, versión ${audioguia.version} de los códigos${definitivos ? '' : ' (de prueba)'}. ` +
      'Estas URL valen lo mismo que los QR impresos: guardalas fuera del repo (tools/salida/audioguias/qr/urls.txt).',
  )
  process.exit(0)
}
