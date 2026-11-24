// Los QR de la audioguía (especificación de las audioguías, versión 2, sección 8): en la PC y SIN la clave, arma un
// SVG y un PDF por cartel a partir de las URL firmadas que da `npm run audioguia-urls` (que corre en el Shell de Render,
// donde vive AUDIOGUIA_CLAVE, o en la PC contra el servidor de prueba con una clave descartable).
//
//   node tools/audioguia-qr.mjs --urls tools/salida/audioguias/qr/urls.txt --salida tools/salida/audioguias/qr
//   node tools/audioguia-qr.mjs --prueba --host 192.168.0.10:5183 --urls … --salida …   (los de prueba)
//
// Opciones:
//   --urls <archivo>   lo que imprimió audioguia-urls: un renglón por espacio, <espacio><TAB><url> (si al copiarlo de la
//                      terminal el tabulador pasó a espacios, también vale). Obligatoria.
//   --salida <carpeta> dónde deja todo (por defecto tools/salida/audioguias/qr, que no se versiona). Tiene que estar
//                      fuera del repo o en tools/salida/: las URL valen lo mismo que los QR impresos.
//   --prueba           los de prueba: --host obligatorio (el de Render o el de la red local, nunca mupa.ar) y la
//                      versión del QR, la mínima que entre para los 13 (7 con esos hosts). Sin --prueba, solo
//                      https://mupa.ar/ y la versión 6 fija.
//   --host <host>      con --prueba: host[:puerto] (o el origen entero, http(s)://host[:puerto]/) de las URL.
//   --dir <carpeta>    la del manifiesto, pistas.json (por defecto DIR_AUDIOGUIAS o <repo>/audioguias). Solo lee el
//                      manifiesto: no hacen falta los MP3.
//   --cm <n>           el lado del código de los carteles de las puertas, en cm (por defecto 10; de 4 a 12). Con 12,
//                      si la hoja de prueba no se lee a 1 m (8.4).
//   --reemplazar       escribir en una carpeta que ya tiene archivos y no es una salida de esta herramienta (sin su
//                      resumen.json): pisa solo los archivos con los nombres que escribe y no borra nada.
//   --ayuda            esto.
//
// Qué hace:
// - Valida cada URL: la forma del código (3.2: <espacio>.<versión>.<firma>, la de server/audioguia/firma.js), que el
//   espacio del renglón sea el del código y esté en el manifiesto, que la versión del código sea la del manifiesto, el
//   host esperado, sin consulta ni fragmento, cada espacio una vez y todos los del recorrido (Recepción, una). No puede
//   comprobar la firma (no tiene la clave): eso lo hace el escaneo de la hoja de prueba.
// - Suma sola la 13.ª: la de Recepción con ?v=ad (la tarjeta del mostrador para la versión con audiodescripción).
// - Cada símbolo con qrcode (1.5.4, en devDependencies), modo byte, corrección Q y 4 módulos de silencio (8.2), como
//   SVG vectorial (un solo trazado, con su viewBox y shape-rendering="crispEdges", módulos negros sobre blanco), con el
//   ancho fijado en mm. Sin --prueba, versión 6 fija para los 13 (si una URL no entra, sale con 1); con --prueba, la
//   mínima que entre para todos (QRCode.create sin version, y después la más alta para los 13).
// - Deja <espacio>.svg y recepcion-ad.svg; un PDF por cartel (<espacio>.pdf, A5 vertical, con el código de --cm; y
//   recepcion-ad.pdf, la tarjeta A6 con el código de 7 cm); prueba.pdf, la hoja de prueba en dos A4 (8.4: el código de
//   Recepción a 12, 10 y 8 cm, después a 6 y 4, el de audiodescripción a 7 en su renglón y la tabla para llenar a mano,
//   con líneas de corte y el aviso de tapar los otros códigos en cada intento: AG-QR-02); todos.pdf (los
//   13 juntos, para mandar a imprimir); y resumen.json (por cartel: la URL, el largo, la versión del QR, la corrección y
//   el tamaño impreso). Lo mismo, sin las URL, por la salida.
// - Los PDF los imprime Chrome headless por CDP (Page.printToPDF con preferCSSPageSize y printBackground) sobre un HTML
//   armado en memoria (Page.setDocumentContent sobre about:blank), con la letra del sitio (Google Sans Flex) y la marca
//   en negro embebidas como data: (nada se pide a la red). Chrome sale con un perfil temporal (cdp-qr-*), un puerto
//   libre y --host-resolver-rules que no resuelve nada (como menu-check.mjs: lo exige server/pruebas/herramientas.test.js),
//   y se termina con todos sus procesos (taskkill /T /F) también con Ctrl+C, que borra además su perfil.
// - Antes de imprimir comprueba en Chrome que en cada hoja nada se salga de la página, que nada caiga encima de un
//   código ni de su zona de silencio y que cada código mida lo que tiene que medir. Después, en cada PDF, con pdfjs-dist
//   (ya en devDependencies): la cantidad y el tamaño de las páginas, que no haya ninguna imagen rasterizada (el código
//   queda vectorial) y el ancho de cada código medido en el PDF (el trazado de sus módulos), contra el pedido, con una
//   tolerancia de 0,05 mm. Si algo falla, no escribe nada y sale con 1.
// Sale con 0 si dejó todo; con 1 ante cualquier problema (los dice en castellano); con 130 si la cortan con Ctrl+C.
// - La carpeta de salida: vacía o nueva, o una que dejó esta herramienta (su resumen.json, con generadoPor y la lista de
//   archivos). En esa, borra SOLO lo que la corrida anterior dejó y esta no vuelve a escribir (un espacio que salió del
//   recorrido); nunca un archivo ajeno, aunque se llame como uno suyo. En cualquier otra carpeta con archivos se niega,
//   salvo con --reemplazar, que pisa solo los suyos y no borra nada (AG-QR-01: con --salida en Descargas borraba los
//   PDF y los SVG que hubiera).
// No usa la base, ni la clave, ni la red.
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { ESPACIO_QUE_SE_REPITE, ESPACIOS_DE_LA_AUDIOGUIA, validarManifiesto } from '../compartido/esquemas/audioguias.js'
import { FORMA_DEL_CODIGO } from '../server/audioguia/firma.js'
import { esPrincipal } from '../server/principal.js'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

/** El host de los QR definitivos (los que se imprimen, después del corte del dominio). */
export const HOST_DEFINITIVO = 'mupa.ar'
/** La versión del símbolo de los 13 definitivos (8.2): con mupa.ar entran todos, con la versión de los códigos de hasta tres cifras. */
export const VERSION_DEFINITIVA = 6
/** La corrección de errores (8.2): Q recupera hasta un 25 % de los módulos. */
export const CORRECCION = 'Q'
/** La zona de silencio, en módulos (ISO/IEC 18004). */
export const SILENCIO = 4
/** El lado del código de los carteles de las puertas (8.3), en cm, y los topes de --cm (con 12 todavía entra en un A5). */
export const CM_PUERTA = 10
export const CM_MIN = 4
export const CM_MAX = 12
/** El de la tarjeta de mano del mostrador, con audiodescripción. */
export const CM_TARJETA = 7
/** Los de la hoja de prueba (8.4): Recepción a 12, 10 y 8 en la primera página, a 6 y 4 en la segunda. */
export const CM_PRUEBA_1 = [12, 10, 8]
export const CM_PRUEBA_2 = [6, 4]
/** El id del cartel de audiodescripción y lo que suma a la URL de Recepción. */
export const ID_AD = 'recepcion-ad'
export const CONSULTA_AD = '?v=ad'
/** Cuánto puede diferir el ancho de un código medido en el PDF del pedido. */
const TOLERANCIA_MM = 0.05
/** Los tamaños de hoja, en mm. */
const HOJAS = { puerta: [148, 210], tarjeta: [105, 148], a4: [210, 297] }

// ---------- La lectura y la validación (sin Chrome; lo importa server/pruebas/audioguia.test.js)

/**
 * Lee el archivo de las URL: un renglón por espacio, <espacio> y la URL separados por un tabulador o por espacios
 * (copiado de la terminal de Render, el tabulador puede llegar como espacios). Ignora los renglones vacíos, el BOM y
 * los \r del Bloc de notas.
 * @param {string} texto
 * @returns {{ renglones: { espacio: string, url: string, renglon: number }[], problemas: string[] }}
 */
export function leerUrls(texto) {
  const renglones = []
  const problemas = []
  String(texto)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .forEach((linea, i) => {
      const limpia = linea.trim()
      if (!limpia) return
      const partes = limpia.split(/\s+/)
      if (partes.length !== 2) {
        problemas.push(`renglón ${i + 1}: tiene que ser <espacio> y la URL, separados por un tabulador`)
        return
      }
      renglones.push({ espacio: partes[0], url: partes[1], renglon: i + 1 })
    })
  if (!renglones.length && !problemas.length) problemas.push('el archivo de las URL está vacío')
  return { renglones, problemas }
}

/**
 * El host esperado de --host, como host[:puerto] en minúsculas: acepta 'mupa-web.onrender.com',
 * '192.168.0.10:5183' o el origen entero ('http://192.168.0.10:5183/').
 * @param {string} texto
 * @returns {string | null}  null si no se entiende
 */
export function hostDe(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return null
  const t = texto.trim()
  const conEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `http://${t}`
  if (!URL.canParse(conEsquema)) return null
  const u = new URL(conEsquema)
  if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) return null
  return u.host.toLowerCase()
}

/**
 * Valida los renglones contra el manifiesto y arma los carteles, con la 13.ª (Recepción con ?v=ad).
 * @param {{ espacio: string, url: string, renglon: number }[]} renglones  los de leerUrls
 * @param {{ version: number, recorrido: { espacio: string, nombreGuion: string, titulo?: string, lema?: string }[] }} manifiesto
 * @param {{ prueba?: boolean, host?: string | null }} [opciones]  host: el de --host, ya con hostDe
 * @returns {{ carteles: object[], problemas: string[], avisos: string[] }}
 *   cada cartel: { id, espacio, url, ad, nombreGuion, titulo, lema }, en el orden del recorrido, con el de
 *   audiodescripción después de Recepción
 */
export function validarCarteles(renglones, manifiesto, { prueba = false, host = null } = {}) {
  const problemas = []
  const avisos = []
  const grupos = new Map()
  for (const g of manifiesto.recorrido) if (!grupos.has(g.espacio)) grupos.set(g.espacio, g)

  if (prueba) {
    if (!host) problemas.push('con --prueba va --host con el host de las URL de prueba (el de Render o el de la red local)')
    else if (host.split(':')[0] === HOST_DEFINITIVO) problemas.push(`--prueba es para otro host (Render o la red local), no ${HOST_DEFINITIVO}`)
  } else if (host && host !== HOST_DEFINITIVO) {
    problemas.push(`sin --prueba, el host es ${HOST_DEFINITIVO} (los carteles definitivos); para otro, --prueba --host`)
  }

  const porEspacio = new Map()
  for (const { espacio, url, renglon } of renglones) {
    const donde = `renglón ${renglon} (${espacio})`
    if (!URL.canParse(url)) {
      problemas.push(`${donde}: no es una URL`)
      continue
    }
    const u = new URL(url)
    if (prueba) {
      if (!/^https?:$/.test(u.protocol)) problemas.push(`${donde}: la URL tiene que ser http o https`)
      if (host && u.host.toLowerCase() !== host) problemas.push(`${donde}: el host es ${u.host} y se esperaba ${host}`)
    } else if (u.protocol !== 'https:' || u.host !== HOST_DEFINITIVO) {
      problemas.push(`${donde}: los definitivos son https://${HOST_DEFINITIVO}/… (para otro host, --prueba --host)`)
    }
    if (u.username || u.password) problemas.push(`${donde}: la URL no lleva usuario ni contraseña`)
    if (u.search || u.hash || url.includes('?') || url.includes('#')) problemas.push(`${donde}: la URL va sin consulta ni fragmento (el ?v=ad de la 13.ª lo suma la herramienta)`)
    const m = /^\/audioguia\/q\/([^/]+)$/.exec(u.pathname)
    const codigo = m ? m[1] : null
    const forma = codigo ? FORMA_DEL_CODIGO.exec(codigo) : null
    if (!forma) {
      problemas.push(`${donde}: la ruta tiene que ser /audioguia/q/<espacio>.<versión>.<firma>`)
      continue
    }
    const [, espacioDelCodigo, textoVersion] = forma
    if (espacioDelCodigo !== espacio) problemas.push(`${donde}: el código es de ${espacioDelCodigo}`)
    if (!grupos.has(espacio)) problemas.push(`${donde}: ${espacio} no está en el recorrido del manifiesto`)
    if (Number(textoVersion) !== manifiesto.version) {
      problemas.push(`${donde}: el código es de la versión ${textoVersion} y el manifiesto está en la ${manifiesto.version}`)
    }
    if (porEspacio.has(espacio)) problemas.push(`${donde}: ${espacio} está dos veces (también en el renglón ${porEspacio.get(espacio).renglon})`)
    else porEspacio.set(espacio, { url, renglon })
  }

  const faltan = [...grupos.keys()].filter((e) => !porEspacio.has(e))
  if (faltan.length) {
    const texto = `faltan las URL de ${faltan.join(', ')} (están en el manifiesto)`
    if (prueba) avisos.push(texto)
    else problemas.push(texto)
  }

  const carteles = []
  for (const [espacio, grupo] of grupos) {
    const cual = porEspacio.get(espacio)
    if (!cual) continue
    const datos = { espacio, nombreGuion: grupo.nombreGuion, titulo: grupo.titulo ?? null, lema: grupo.lema ?? null }
    carteles.push({ id: espacio, url: cual.url, ad: false, ...datos })
    if (espacio === ESPACIO_QUE_SE_REPITE) carteles.push({ id: ID_AD, url: `${cual.url}${CONSULTA_AD}`, ad: true, ...datos })
  }
  if (!porEspacio.has(ESPACIO_QUE_SE_REPITE)) {
    avisos.push('sin la URL de Recepción no hay tarjeta de audiodescripción, y la hoja de prueba usa el primer espacio')
  }
  return { carteles, problemas, avisos }
}

/** Los segmentos de un símbolo: todo en modo byte (8.1), sin que qrcode lo parta en alfanumérico o numérico. */
const segmentosDe = (url) => [{ data: url, mode: 'byte' }]

/**
 * Los símbolos de los carteles. Sin --prueba, la versión 6 fija para todos; con --prueba, la mínima que entre para el
 * más largo, la misma para todos (así la hoja de prueba es tan densa como el más denso).
 * @param {{ id: string, url: string }[]} carteles
 * @param {{ prueba?: boolean }} [opciones]
 * @returns {{ ok: true, version: number, modulos: number, simbolos: object[] } | { ok: false, problema: string }}
 *   cada símbolo: el cartel con { largo, version, modulos, correccion, svg } (svg sin ancho: lo pone svgEnMm)
 */
export function armarSimbolos(carteles, { prueba = false } = {}) {
  if (!carteles.length) return { ok: false, problema: 'no hay ningún cartel que armar' }
  let version = VERSION_DEFINITIVA
  if (prueba) {
    version = 0
    for (const c of carteles) {
      try {
        version = Math.max(version, QRCode.create(segmentosDe(c.url), { errorCorrectionLevel: CORRECCION }).version)
      } catch (err) {
        return { ok: false, problema: `${c.id}: no entra en ningún QR con corrección ${CORRECCION} (${primerRenglon(err)})` }
      }
    }
  }
  const simbolos = []
  for (const c of carteles) {
    let qr
    try {
      qr = QRCode.create(segmentosDe(c.url), { errorCorrectionLevel: CORRECCION, version })
    } catch (err) {
      return {
        ok: false,
        problema: `${c.id}: la URL (${c.url.length} caracteres) no entra en la versión ${version} con corrección ${CORRECCION} (${primerRenglon(err)})`,
      }
    }
    simbolos.push({ ...c, largo: Buffer.byteLength(c.url, 'utf8'), version: qr.version, modulos: qr.modules.size, correccion: CORRECCION, qr })
  }
  return { ok: true, version, modulos: simbolos[0].modulos, simbolos }
}

const primerRenglon = (err) => String(err?.message ?? err).trim().split(/\r?\n/).filter(Boolean).join(' ')

/** El SVG de un símbolo (sin ancho): un solo trazado de módulos negros sobre el fondo blanco, con la zona de silencio. */
export function svgDe(simbolo) {
  // qrcode resuelve toString sincrónico por dentro con un callback; acá, con su renderer de SVG sobre el símbolo ya
  // armado, así el SVG es exactamente el del símbolo que se midió (la misma versión y la misma máscara).
  let svg = null
  QRCode.toString(segmentosDe(simbolo.url), {
    type: 'svg',
    errorCorrectionLevel: CORRECCION,
    version: simbolo.version,
    margin: SILENCIO,
    color: { dark: '#000000ff', light: '#ffffffff' },
  }, (err, texto) => {
    if (err) throw err
    svg = texto
  })
  if (!svg) throw new Error('qrcode no devolvió el SVG')
  return svg.trim()
}

/** El lado de todo el SVG (el código y su silencio) en mm, para un código de `cm` de lado. */
export const ladoConSilencioMm = (cm, modulos) => (cm * 10 * (modulos + 2 * SILENCIO)) / modulos
/** El ancho de la zona de silencio de un código de `cm`, en mm. */
export const silencioMm = (cm, modulos) => (cm * 10 * SILENCIO) / modulos
/** El módulo de un código de `cm`, en mm. */
export const moduloMm = (cm, modulos) => (cm * 10) / modulos

/** El SVG con el ancho y el alto fijados en mm, para un código de `cm` de lado (sin contar el silencio). */
export function svgEnMm(svg, cm, modulos) {
  const lado = redondear(ladoConSilencioMm(cm, modulos), 4)
  return svg.replace(/^<svg /, `<svg width="${lado}mm" height="${lado}mm" `)
}

const redondear = (n, decimales) => Number(n.toFixed(decimales))
const coma = (n, decimales = 1) => n.toFixed(decimales).replace('.', ',')

// ---------- Las hojas (el HTML que imprime Chrome)

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** La marca del MuPa en negro (los dos SVG del header, en blanco en el sitio), sin ids repetidos. */
function marcaEnNegro() {
  const leer = (nombre) =>
    readFileSync(join(RAIZ, 'src', 'assets', nombre), 'utf8')
      .replace(/<\?xml[^>]*>/, '')
      .replace(/\s(id|style|preserveAspectRatio|overflow)="[^"]*"/g, '')
      .replace(/fill="white"/g, 'fill="#010101"')
      .replace(/\swidth="[^"]*"/, '')
      .replace(/\sheight="[^"]*"/, '')
      .trim()
  return { marca: leer('logo-mupa-marca.svg'), texto: leer('logo-mupa-texto.svg') }
}

/** La letra del sitio, embebida (el woff2 recortado de src/assets/fonts). */
const fuenteEnBase64 = () => readFileSync(join(RAIZ, 'src', 'assets', 'fonts', 'google-sans-flex-latin.woff2')).toString('base64')

function estilos() {
  return `
@font-face { font-family: 'GSF'; src: url(data:font/woff2;base64,${fuenteEnBase64()}) format('woff2');
  font-weight: 100 1000; font-stretch: 100% 130%; font-display: block; }
@page puerta { size: ${HOJAS.puerta[0]}mm ${HOJAS.puerta[1]}mm; margin: 0; }
@page tarjeta { size: ${HOJAS.tarjeta[0]}mm ${HOJAS.tarjeta[1]}mm; margin: 0; }
@page a4 { size: ${HOJAS.a4[0]}mm ${HOJAS.a4[1]}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'GSF', sans-serif; color: #010101; background: #ffffff; }
.hoja { position: relative; overflow: hidden; break-after: page; background: #ffffff; }
.hoja:last-child { break-after: auto; }
.puerta { page: puerta; width: ${HOJAS.puerta[0]}mm; height: ${HOJAS.puerta[1]}mm; }
.tarjeta { page: tarjeta; width: ${HOJAS.tarjeta[0]}mm; height: ${HOJAS.tarjeta[1]}mm; }
.a4 { page: a4; width: ${HOJAS.a4[0]}mm; height: ${HOJAS.a4[1]}mm; }
.qr { position: absolute; background: #ffffff; }
.qr svg { display: block; }
.marca { position: absolute; display: flex; align-items: flex-end; }
.marca svg { display: block; height: 100%; width: auto; }
.texto { position: absolute; text-align: center; }
.rotulo { font-weight: 700; line-height: 1.05; letter-spacing: 0.01em; }
.titulo { font-weight: 600; line-height: 1.2; }
.lema { font-weight: 300; line-height: 1.25; }
.indicacion { font-weight: 400; line-height: 1.3; }
.chico { font-weight: 400; line-height: 1.3; font-size: 2.6mm; }
.corte { position: absolute; height: 0; border-top: 0.3mm dashed #6b6b6b; }
.corte.vertical { width: 0; border-top: 0; border-left: 0.3mm dashed #6b6b6b; }
.regla { position: absolute; height: 5mm; }
.regla .barra { position: absolute; left: 0; top: 0; width: 50mm; height: 0.5mm; background: #010101; }
.regla .marca-cm { position: absolute; top: 0; width: 0.3mm; height: 2mm; background: #010101; }
.regla .num { position: absolute; top: 2.2mm; font-size: 2.2mm; line-height: 1; white-space: nowrap; transform: translateX(-50%); }
table { position: absolute; border-collapse: collapse; font-size: 2.8mm; }
th, td { border: 0.25mm solid #010101; padding: 0 1.2mm; height: 8.5mm; text-align: left; font-weight: 400; vertical-align: middle; }
th { font-weight: 600; height: 10mm; line-height: 1.15; }
`
}

/** Un código posicionado: la esquina de arriba a la izquierda de TODO el SVG (con su silencio) en (x, y) mm. */
function bloqueQr(simbolo, cm, x, y) {
  const lado = ladoConSilencioMm(cm, simbolo.modulos)
  return (
    `<div class="qr" data-qr data-cm="${cm}" data-lado-mm="${redondear(lado, 4)}" data-silencio-mm="${redondear(silencioMm(cm, simbolo.modulos), 4)}" ` +
    `style="left:${redondear(x, 3)}mm; top:${redondear(y, 3)}mm; width:${redondear(lado, 4)}mm; height:${redondear(lado, 4)}mm">` +
    `${svgEnMm(simbolo.svg, cm, simbolo.modulos)}</div>`
  )
}

/** La regla de 5 cm, para comprobar con una regla de verdad que se imprimió al 100 %. */
function regla(x, y) {
  let marcas = ''
  for (let i = 0; i <= 5; i++) {
    marcas += `<div class="marca-cm" style="left:${i * 10 - (i === 5 ? 0.3 : 0)}mm"></div>`
    marcas += `<div class="num" style="left:${i * 10}mm">${i === 5 ? '5 cm' : i}</div>`
  }
  return `<div class="regla" style="left:${x}mm; top:${y}mm; width:50mm">${`<div class="barra"></div>${marcas}`}</div>`
}

/** El pie de toda hoja: imprimir al 100 % y la regla. */
function pie(ancho, alto, extra) {
  const y = alto - 13
  return (
    `<div class="texto chico" style="left:6mm; top:${y}mm; width:${ancho - 12}mm; text-align:left">` +
    `Imprimir al 100 % («Tamaño real»), nunca «Ajustar a la página». La regla de abajo mide 5 cm.${extra ? ` ${escapar(extra)}` : ''}</div>` +
    regla(6, alto - 6.5)
  )
}

function marca(x, y, alto, logos) {
  // La marca (131,8 x 43,6) y el texto (253,7 x 38,8), a la misma altura de letra que en el header.
  const anchoMarca = (alto * 131.807) / 43.6304
  const altoTexto = alto * 0.75
  const anchoTexto = (altoTexto * 253.737) / 38.7899
  const separacion = alto * 0.35
  const ancho = anchoMarca + separacion + anchoTexto
  return {
    ancho,
    html:
      `<div class="marca" aria-label="MuPa, Museo Paleontológico de San Juan" style="left:${redondear(x, 3)}mm; top:${redondear(y, 3)}mm; width:${redondear(ancho, 3)}mm; height:${alto}mm; gap:${redondear(separacion, 3)}mm">` +
      `<div style="height:${alto}mm; width:${redondear(anchoMarca, 3)}mm">${logos.marca}</div>` +
      `<div style="height:${redondear(altoTexto, 3)}mm; width:${redondear(anchoTexto, 3)}mm">${logos.texto}</div></div>`,
  }
}

const marcaCentrada = (anchoHoja, y, alto, logos) => {
  const { ancho } = marca(0, 0, alto, logos)
  return marca((anchoHoja - ancho) / 2, y, alto, logos).html
}

const datosDelCodigo = (s, cm) =>
  `QR versión ${s.version}, corrección ${s.correccion}, ${s.modulos} módulos de ${coma(moduloMm(cm, s.modulos), 2)} mm: ${coma(cm, cm % 1 ? 1 : 0)} cm.`

/** El cartel de una puerta: A5 vertical, el rótulo del guion arriba, el código en el medio y la indicación abajo. */
function hojaPuerta(s, cm, logos) {
  const [ancho, alto] = HOJAS.puerta
  const lado = ladoConSilencioMm(cm, s.modulos)
  // Lo de arriba se achica si el código crece (con --cm 12 el código y su silencio ocupan 143 mm de 210).
  const grande = cm <= 10.5
  const altoMarca = grande ? 7.5 : 5.5
  const tRotulo = grande ? 12 : 9
  const tTitulo = grande ? 5.2 : 4.2
  const tLema = grande ? 4.6 : 3.8
  const yRotulo = 8 + altoMarca + (grande ? 6 : 3.5)
  const subtitulo = [s.titulo, s.lema].filter(Boolean)
  const yQr = alto - 13 - (grande ? 18 : 13) - lado
  const textos =
    `<div class="texto" style="left:6mm; top:${yRotulo}mm; width:${ancho - 12}mm">` +
    `<div class="rotulo" style="font-size:${tRotulo}mm">${escapar(s.nombreGuion)}</div>` +
    (s.titulo ? `<div class="titulo" style="font-size:${tTitulo}mm; margin-top:${grande ? 2.5 : 1.5}mm">${escapar(s.titulo)}</div>` : '') +
    (s.lema ? `<div class="lema" style="font-size:${tLema}mm; margin-top:${s.titulo ? 0.8 : grande ? 2.5 : 1.5}mm">${escapar(s.lema)}</div>` : '') +
    `</div>`
  return (
    `<section class="hoja puerta" data-hoja="${escapar(s.id)}" data-subtitulo="${subtitulo.length}">` +
    marcaCentrada(ancho, 8, altoMarca, logos) +
    textos +
    bloqueQr(s, cm, (ancho - lado) / 2, yQr) +
    `<div class="texto indicacion" style="left:10mm; top:${yQr + lado + (grande ? 3 : 1.5)}mm; width:${ancho - 20}mm; font-size:${grande ? 4.4 : 3.8}mm">` +
    `Escaneá este código con la cámara del celular para escuchar la audioguía</div>` +
    pie(ancho, alto, datosDelCodigo(s, cm)) +
    `</section>`
  )
}

/** La tarjeta de mano del mostrador (8.3): A6, el código de Recepción con ?v=ad a 7 cm y el texto para el personal. */
function hojaTarjeta(s, logos) {
  const [ancho, alto] = HOJAS.tarjeta
  const lado = ladoConSilencioMm(CM_TARJETA, s.modulos)
  const yQr = 36
  return (
    `<section class="hoja tarjeta" data-hoja="${ID_AD}">` +
    marcaCentrada(ancho, 6, 5, logos) +
    `<div class="texto" style="left:6mm; top:14mm; width:${ancho - 12}mm">` +
    `<div class="titulo" style="font-size:4.2mm">Audioguía con audiodescripción</div>` +
    `<div class="indicacion" style="font-size:3.1mm; margin-top:1.5mm">Para personas ciegas o con baja visión: escaneá este código con el teléfono de la visita. Abre la audioguía con audiodescripción.</div>` +
    `</div>` +
    bloqueQr(s, CM_TARJETA, (ancho - lado) / 2, yQr) +
    `<div class="texto chico" style="left:6mm; top:${yQr + lado + 1.5}mm; width:${ancho - 12}mm">` +
    `Si ya escaneaste el código común, tocá «Cambiar a la versión con audiodescripción», arriba de todo.</div>` +
    pie(ancho, alto, datosDelCodigo(s, CM_TARJETA)) +
    `</section>`
  )
}

/**
 * Una fila de códigos, de izquierda a derecha desde x0: entre dos símbolos queda la zona de silencio más ancha de los
 * dos (los cuadrados blancos se pisan, los módulos nunca), así entran 10 y 8 cm uno al lado del otro en un A4.
 * @returns {{ html: string, posiciones: { x: number, lado: number, simboloX: number }[] }}
 */
function filaDeCodigos(lista, x0, y) {
  let html = ''
  const posiciones = []
  let finDelAnterior = null
  let silencioAnterior = 0
  for (const { simbolo, cm } of lista) {
    const q = silencioMm(cm, simbolo.modulos)
    const lado = ladoConSilencioMm(cm, simbolo.modulos)
    const simboloX = finDelAnterior === null ? x0 + q : finDelAnterior + Math.max(q, silencioAnterior)
    html += bloqueQr(simbolo, cm, simboloX - q, y)
    posiciones.push({ x: simboloX - q, lado, simboloX, silencio: q })
    finDelAnterior = simboloX + cm * 10
    silencioAnterior = q
  }
  return { html, posiciones }
}

/** Una línea de corte punteada (fuera de los silencios: la revisión de las hojas lo controla). */
const corte = (x, y, largo, vertical = false) =>
  `<div class="corte${vertical ? ' vertical' : ''}" data-corte style="left:${redondear(x, 3)}mm; top:${redondear(y, 3)}mm; ` +
  `${vertical ? 'height' : 'width'}:${redondear(largo, 3)}mm"></div>`

/**
 * Lo que va impreso en las dos hojas para que cada intento pruebe UN código (AG-QR-02 de la verificación de los QR): a
 * 1 m entra el A4 entero en la cámara, el teléfono lee el que le resulta más fácil y no dice cuál.
 */
export const TAPAR_LOS_OTROS =
  'Para cada intento, tapá los otros códigos con una hoja (o recortalos por la línea punteada): el teléfono lee el que ' +
  'le resulta más fácil y no dice cuál.'

/**
 * La hoja de prueba (8.4), en dos A4. Cada código con su silencio entero y una línea de corte entre él y el vecino,
 * salvo el de 10 y el de 8 de la primera, que en un A4 no entran uno al lado del otro sin compartir el margen blanco
 * (los dos símbolos y sus silencios piden 217 mm): ahí, el texto dice que se tape el otro. El de audiodescripción va en
 * su propio renglón, lejos del de 4 cm, que se escanea de cerca (AG-QR-02).
 */
function hojasDePrueba(comun, ad, prueba) {
  const [ancho, alto] = HOJAS.a4
  const n = comun.modulos
  const modulo = (cm, m = n) => `${coma(cm, 0)} cm, módulo de ${coma(moduloMm(cm, m), 2)} mm`
  const tipo = prueba ? 'de prueba' : 'definitivos'
  const cabecera = (pagina) =>
    `Hoja de prueba de los QR de la audioguía (${tipo}), página ${pagina} de 2. ` +
    `QR versión ${comun.version}, corrección ${comun.correccion}, ${n} módulos, modo byte.`
  const aviso = `<div class="chico" style="margin-top:2mm; font-size:2.9mm; font-weight:700">${escapar(TAPAR_LOS_OTROS)}</div>`

  // Página 1: 12 cm arriba a la izquierda (el texto a su derecha); una línea de corte; abajo, 10 y 8 cm uno al lado del
  // otro (sus zonas blancas se pisan).
  const lado12 = ladoConSilencioMm(12, n)
  const fila1 = filaDeCodigos([{ simbolo: comun, cm: 12 }], 2, 3)
  const yFila2 = 3 + lado12 + 3
  const fila2 = filaDeCodigos([{ simbolo: comun, cm: 10 }, { simbolo: comun, cm: 8 }], 1, yFila2)
  // Los rótulos de 10 y 8 cm, debajo del de 8 y a la derecha de la zona blanca del de 10 (las dos zonas se pisan).
  const x8 = Math.max(fila2.posiciones[1].x, fila2.posiciones[0].x + fila2.posiciones[0].lado + 1)
  const lado8 = fila2.posiciones[1].lado
  const xTexto1 = 2 + lado12 + 3
  const pagina1 =
    `<section class="hoja a4" data-hoja="prueba-1">` +
    fila1.html +
    `<div class="texto" style="left:${redondear(xTexto1, 3)}mm; top:6mm; width:${redondear(ancho - xTexto1 - 5, 3)}mm; text-align:left">` +
    `<div class="titulo" style="font-size:4.4mm">Hoja de prueba · ${escapar(comun.nombreGuion)}</div>` +
    `<div class="chico" style="margin-top:2mm; font-size:2.9mm">${escapar(cabecera(1))}</div>` +
    `<div class="chico" style="margin-top:2mm; font-size:2.9mm">A la izquierda: ${modulo(12)}.</div>` +
    `<div class="chico" style="margin-top:2mm; font-size:2.9mm">Escanealos con la cámara común de 2 o 3 teléfonos (un iPhone y un Android, al menos), sin apps, a 30 cm, 1 m y 1,5 m, y anotá lo que pasa en la tabla de la página 2. Pasa si el de 10 cm se lee a 1 m con todos y el de 4 cm de cerca.</div>` +
    aviso +
    `</div>` +
    corte(3, 3 + lado12 + 1.5, ancho - 6) +
    fila2.html +
    `<div class="texto chico" style="left:${redondear(x8, 3)}mm; top:${redondear(yFila2 + lado8 + 2, 3)}mm; width:${redondear(ancho - x8 - 6, 3)}mm; text-align:left; font-size:2.9mm">` +
    `Arriba: ${modulo(8)}.<br>A la izquierda: ${modulo(10)}.<br><b>Estos dos comparten el margen blanco: para probar uno, tapá el otro.</b></div>` +
    pie(ancho, alto, '') +
    `</section>`

  // Página 2: 6 y 4 cm en un renglón, con una línea de corte entre los dos y los rótulos a la derecha; una línea de
  // corte; el de audiodescripción a 7 cm en su renglón, con su rótulo y la explicación de la tabla a la derecha; abajo,
  // la tabla.
  const yFila = 22
  const lado6 = ladoConSilencioMm(6, n)
  const lado4 = ladoConSilencioMm(4, n)
  const ladoAd = ladoConSilencioMm(CM_TARJETA, ad.modulos)
  const separacion = 4
  const x4 = 3 + lado6 + separacion
  const fila6 = filaDeCodigos([{ simbolo: comun, cm: 6 }], 3, yFila)
  const fila4 = filaDeCodigos([{ simbolo: comun, cm: 4 }], x4, yFila)
  const xRotulos = x4 + lado4 + 3
  const yAd = yFila + lado6 + 2 * separacion
  const filaAd = filaDeCodigos([{ simbolo: ad, cm: CM_TARJETA }], 3, yAd)
  const xExplicacion = 3 + ladoAd + 4
  const yTabla = yAd + ladoAd + 5
  const columnas = ['Teléfono', 'App (la cámara, Lens, el lector del iPhone)', 'Distancia (30 cm, 1 m, 1,5 m)', 'Tamaño (cm)', '¿Lo leyó?', '¿Abrió el espacio correcto?', '¿Salió en la versión correcta?']
  const anchos = [28, 34, 26, 18, 18, 36, 36]
  const filas = Math.floor((alto - 16 - yTabla - 10) / 8.5)
  const tabla =
    `<table style="left:3mm; top:${redondear(yTabla, 3)}mm; width:${anchos.reduce((a, b) => a + b, 0)}mm">` +
    `<colgroup>${anchos.map((a) => `<col style="width:${a}mm">`).join('')}</colgroup>` +
    `<tr>${columnas.map((c) => `<th>${escapar(c)}</th>`).join('')}</tr>` +
    `${`<tr>${columnas.map(() => '<td></td>').join('')}</tr>`.repeat(filas)}</table>`
  const pagina2 =
    `<section class="hoja a4" data-hoja="prueba-2">` +
    `<div class="texto" style="left:3mm; top:6mm; width:${ancho - 6}mm; text-align:left">` +
    `<div class="chico" style="font-size:2.9mm">${escapar(cabecera(2))} ` +
    `Los de abajo: ${escapar(comun.nombreGuion)} a 6 y 4 cm, y la tarjeta de audiodescripción a 7 cm.</div>` +
    aviso.replace('margin-top:2mm; ', 'margin-top:1mm; ') +
    `</div>` +
    fila6.html +
    corte(3 + lado6 + separacion / 2, yFila, lado6, true) +
    fila4.html +
    `<div class="texto chico" style="left:${redondear(xRotulos, 3)}mm; top:${redondear(yFila + 2, 3)}mm; width:${redondear(ancho - xRotulos - 3, 3)}mm; text-align:left; font-size:2.9mm">` +
    `A la izquierda: ${modulo(6)}.<br>Al lado: ${modulo(4)} (este se escanea de cerca).</div>` +
    corte(3, yFila + lado6 + separacion, ancho - 6) +
    filaAd.html +
    `<div class="texto chico" style="left:${redondear(xExplicacion, 3)}mm; top:${redondear(yAd + 2, 3)}mm; width:${redondear(ancho - xExplicacion - 3, 3)}mm; text-align:left; font-size:2.9mm">` +
    `A la izquierda: ${modulo(CM_TARJETA, ad.modulos)}. Con audiodescripción (la tarjeta del mostrador).<br><br>` +
    `Un renglón por intento. «Espacio correcto»: la página abre en el espacio del cartel. «Versión correcta»: la común con los códigos comunes y la de audiodescripción con el de 7 cm.</div>` +
    tabla +
    pie(ancho, alto, '') +
    `</section>`
  return pagina1 + pagina2
}

const documento = (hojas) => `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><title>Audioguía · QR</title><style>${estilos()}</style></head><body>${hojas}</body></html>`

/**
 * Los PDF que hay que imprimir: cada uno con su HTML, las hojas que tiene que tener (su tamaño en mm) y los códigos de
 * cada hoja (su lado en cm), para las comprobaciones.
 */
export function trabajos(simbolos, { cm, prueba }) {
  const logos = marcaEnNegro()
  const comun = simbolos.find((s) => s.id === ESPACIO_QUE_SE_REPITE) ?? simbolos.find((s) => !s.ad)
  const ad = simbolos.find((s) => s.ad) ?? comun
  const hojaDe = (s) => (s.ad ? hojaTarjeta(s, logos) : hojaPuerta(s, cm, logos))
  const paginaDe = (s) => (s.ad ? { hoja: HOJAS.tarjeta, codigos: [CM_TARJETA] } : { hoja: HOJAS.puerta, codigos: [cm] })
  const lista = simbolos.map((s) => ({ archivo: `${s.id}.pdf`, html: documento(hojaDe(s)), paginas: [paginaDe(s)], modulos: s.modulos }))
  lista.push({
    archivo: 'todos.pdf',
    html: documento(simbolos.map(hojaDe).join('')),
    paginas: simbolos.map(paginaDe),
    modulos: comun.modulos,
  })
  lista.push({
    archivo: 'prueba.pdf',
    html: documento(hojasDePrueba(comun, ad, prueba)),
    paginas: [
      { hoja: HOJAS.a4, codigos: CM_PRUEBA_1 },
      { hoja: HOJAS.a4, codigos: [...CM_PRUEBA_2, CM_TARJETA] },
    ],
    modulos: comun.modulos,
  })
  return lista
}

// ---------- Chrome (headless, por CDP)

// Como menu-check.mjs (RT-03 de la tanda 1): se termina el árbol entero del Chrome (taskkill /T /F, sincrónico), se
// reintenta borrar el perfil hasta unos 10 s y, al arrancar, se borran los perfiles de esta herramienta de corridas de
// hace más de una hora.
const PREFIJO_PERFIL = 'cdp-qr-'
const enCurso = new Set()
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** Termina un Chrome y todos sus procesos, sin esperar a nada (sirve en el oyente de SIGINT). */
function terminarArbol(pid) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', timeout: 10000 })
    else process.kill(pid, 'SIGKILL')
  } catch {}
}
/** Borra un perfil, reintentando hasta unos 10 s (los procesos de ese Chrome sueltan los archivos un momento después). */
function borrarPerfil(perfil) {
  const pausa = new Int32Array(new SharedArrayBuffer(4))
  for (let i = 0; i < 50; i++) {
    try {
      rmSync(perfil, { recursive: true, force: true })
      return true
    } catch {
      Atomics.wait(pausa, 0, 0, 200)
    }
  }
  return false
}
function borrarPerfilesViejos() {
  for (const nombre of readdirSync(tmpdir())) {
    if (!nombre.startsWith(PREFIJO_PERFIL)) continue
    const ruta = join(tmpdir(), nombre)
    try {
      if (Date.now() - statSync(ruta).mtimeMs > 3600000) rmSync(ruta, { recursive: true, force: true })
    } catch {}
  }
}

/** Abre un Chrome headless nuevo y devuelve cómo hablarle por CDP. */
async function abrirChrome() {
  if (!existsSync(CHROME)) throw new Error(`No está Chrome en ${CHROME} (definí CHROME_PATH).`)
  const perfil = mkdtempSync(join(tmpdir(), PREFIJO_PERFIL))
  // Puerto 0: Chrome elige uno libre y lo anota en DevToolsActivePort, dentro de su perfil (como measure.mjs). La
  // página es un HTML armado acá, con la letra y la marca embebidas: nada tiene que salir, así que no resuelve ningún
  // nombre (MAP * ~NOTFOUND; ::1 excluido, como las demás).
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE ::1',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--lang=es-AR',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      '--window-size=900,1200',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let salio = false
  chrome.once('exit', () => {
    salio = true
  })
  const registro = { pid: chrome.pid, perfil }
  enCurso.add(registro)
  const cerrar = async () => {
    if (!salio) terminarArbol(chrome.pid)
    for (let i = 0; i < 30 && !salio; i++) await dormir(100)
    for (let i = 0; i < 50; i++) {
      try {
        rmSync(perfil, { recursive: true, force: true })
        break
      } catch {
        await dormir(200)
      }
    }
    enCurso.delete(registro)
  }
  try {
    let wsUrl
    for (let i = 0; i < 75 && !wsUrl && !salio; i++) {
      try {
        const puerto = readFileSync(join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
        const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()
        wsUrl = lista.find((t) => t.type === 'page')?.webSocketDebuggerUrl
      } catch {
        await dormir(200)
      }
    }
    if (!wsUrl) throw new Error('Chrome no respondió por CDP')
    const ws = new WebSocket(wsUrl)
    await new Promise((ok, mal) => {
      ws.onopen = ok
      ws.onerror = () => mal(new Error('no se pudo conectar con Chrome por CDP'))
    })
    let id = 0
    const pendientes = new Map()
    const problemas = []
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pendientes.has(m.id)) {
        pendientes.get(m.id)(m)
        pendientes.delete(m.id)
        return
      }
      if (m.method === 'Runtime.exceptionThrown') problemas.push(m.params.exceptionDetails?.exception?.description ?? 'excepción')
      if (m.method === 'Network.requestWillBeSent' && !/^(data|about):/.test(m.params.request.url)) problemas.push(`pidió ${m.params.request.url}`)
    }
    const send = (method, params = {}) =>
      new Promise((ok, mal) => {
        const i = ++id
        const tope = setTimeout(() => {
          pendientes.delete(i)
          mal(new Error(`${method}: Chrome no contestó en 60 s`))
        }, 60000)
        pendientes.set(i, (m) => {
          clearTimeout(tope)
          if (m.error) mal(new Error(`${method}: ${m.error.message}`))
          else ok(m.result)
        })
        ws.send(JSON.stringify({ id: i, method, params }))
      })
    const evaluar = async (expresion) => {
      const r = await send('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
      return r.result.value
    }
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Emulation.setEmulatedMedia', { media: 'print' })
    const { frameTree } = await send('Page.getFrameTree')
    const marco = frameTree.frame.id
    return {
      problemas,
      /** Carga un HTML, espera la letra y devuelve lo que encontró la revisión de la hoja. */
      async cargar(html) {
        await send('Page.setDocumentContent', { frameId: marco, html })
        return evaluar(`(${revisarHojas.toString()})()`)
      },
      async imprimir() {
        const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, transferMode: 'ReturnAsBase64' })
        return Buffer.from(data, 'base64')
      },
      async cerrar() {
        try {
          ws.close()
        } catch {}
        await cerrar()
      },
    }
  } catch (err) {
    await cerrar()
    throw err
  }
}

/**
 * Corre ADENTRO de Chrome (se pasa como texto): espera la letra y revisa cada hoja. Devuelve los problemas: algo que
 * se sale de la hoja, algo encima de un código o de su silencio, un código que no mide lo pedido.
 */
async function revisarHojas() {
  await document.fonts.ready
  const problemas = []
  if (!document.fonts.check('16px GSF')) problemas.push('no cargó la letra del sitio')
  const MM = 96 / 25.4
  const T = 0.6
  const dentro = (r, c) => r.left >= c.left - T && r.top >= c.top - T && r.right <= c.right + T && r.bottom <= c.bottom + T
  const cruza = (a, b) => a.left < b.right - T && b.left < a.right - T && a.top < b.bottom - T && b.top < a.bottom - T
  const textosDe = (el) => {
    const rects = []
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) {
      if (!n.textContent.trim()) continue
      const rango = document.createRange()
      rango.selectNodeContents(n)
      for (const r of rango.getClientRects()) if (r.width && r.height) rects.push(Object.assign(r.toJSON(), { nodo: n, texto: n.textContent.trim().slice(0, 40) }))
    }
    return rects
  }
  for (const hoja of document.querySelectorAll('.hoja')) {
    const nombre = hoja.dataset.hoja
    const caja = hoja.getBoundingClientRect()
    const qrs = [...hoja.querySelectorAll('[data-qr]')]
    // Cada código: su SVG mide lo que dice data-lado-mm y está entero en la hoja.
    for (const q of qrs) {
      const svg = q.querySelector('svg').getBoundingClientRect()
      const esperado = Number(q.dataset.ladoMm) * MM
      if (Math.abs(svg.width - esperado) > 0.05 || Math.abs(svg.height - esperado) > 0.05) {
        problemas.push(`${nombre}: el código de ${q.dataset.cm} cm mide ${(svg.width / MM).toFixed(2)} mm con su silencio y tenía que medir ${q.dataset.ladoMm}`)
      }
      if (!dentro(svg, caja)) problemas.push(`${nombre}: el código de ${q.dataset.cm} cm se sale de la hoja`)
    }
    // Nada se sale de la hoja (las cajas y los renglones de texto).
    for (const el of hoja.querySelectorAll('*')) {
      if (el.closest('svg')) continue
      const r = el.getBoundingClientRect()
      if (r.width && r.height && !dentro(r, caja)) problemas.push(`${nombre}: ${el.className || el.tagName} se sale de la hoja`)
    }
    const renglones = textosDe(hoja)
    for (const r of renglones) if (!dentro(r, caja)) problemas.push(`${nombre}: el renglón «${r.texto}» se sale de la hoja`)
    // Dos textos distintos no se pisan (los renglones de un mismo texto, con su interlineado, tampoco: no se comparan).
    for (let i = 0; i < renglones.length; i++) {
      for (let j = i + 1; j < renglones.length; j++) {
        const a = renglones[i]
        const b = renglones[j]
        if (a.nodo !== b.nodo && cruza(a, b)) problemas.push(`${nombre}: «${a.texto}» y «${b.texto}» se pisan`)
      }
    }
    // Ningún renglón de texto sobre una línea de corte (AG-QR-02).
    for (const c of hoja.querySelectorAll('[data-corte]')) {
      const r = c.getBoundingClientRect()
      for (const t of renglones) if (cruza(t, r)) problemas.push(`${nombre}: el renglón «${t.texto}» cae sobre una línea de corte`)
    }
    // Nada encima de un código ni de su silencio: ni otro elemento (salvo los que lo contienen o están adentro), ni un
    // renglón de texto. Otro código puede pisar el silencio de este con el suyo (blanco sobre blanco), nunca los módulos.
    for (const q of qrs) {
      const zona = q.getBoundingClientRect()
      const s = Number(q.dataset.silencioMm) * MM
      const simbolo = { left: zona.left + s, top: zona.top + s, right: zona.right - s, bottom: zona.bottom - s }
      for (const el of hoja.querySelectorAll('*')) {
        if (el === q || el.contains(q) || q.contains(el) || el.closest('[data-qr]')) continue
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        if (cruza(r, zona)) problemas.push(`${nombre}: ${el.className || el.tagName} cae sobre el código de ${q.dataset.cm} cm o su silencio`)
      }
      for (const otro of qrs) {
        if (otro === q) continue
        const r = otro.getBoundingClientRect()
        const so = Number(otro.dataset.silencioMm) * MM
        const suyo = { left: r.left + so, top: r.top + so, right: r.right - so, bottom: r.bottom - so }
        if (cruza(suyo, zona) || cruza(simbolo, r)) problemas.push(`${nombre}: los códigos de ${q.dataset.cm} y ${otro.dataset.cm} cm se pisan más que el silencio`)
      }
      for (const r of textosDe(hoja)) if (cruza(r, zona)) problemas.push(`${nombre}: el renglón «${r.texto}» cae sobre el código de ${q.dataset.cm} cm o su silencio`)
    }
  }
  return [...new Set(problemas)]
}

// ---------- Lo que se comprueba en el PDF (pdfjs-dist)

/**
 * Lee un PDF con pdfjs-dist y devuelve, por página, su tamaño en mm, si tiene imágenes y los trazados que parecen
 * códigos (muchos tramos rectos, sin curvas, casi cuadrados): su ancho en mm (el de los módulos, sin el silencio) y sus
 * tramos en mm, en las coordenadas de la página (para quien quiera reconstruir el símbolo: la prueba de la herramienta).
 * @param {Buffer} pdf
 */
export async function leerPdf(pdf) {
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const IMAGENES = new Set(
    ['paintImageXObject', 'paintInlineImageXObject', 'paintInlineImageXObjectGroup', 'paintImageXObjectRepeat', 'paintImageMaskXObject',
      'paintImageMaskXObjectGroup', 'paintImageMaskXObjectRepeat', 'paintSolidColorImageMask'].map((n) => OPS[n]).filter((n) => n !== undefined),
  )
  const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0, isEvalSupported: false, disableFontFace: true }).promise
  const paginas = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const pagina = await doc.getPage(p)
      const [x0, y0, x1, y1] = pagina.view
      const pt = 25.4 / 72
      const { fnArray, argsArray } = await pagina.getOperatorList()
      let ctm = [1, 0, 0, 1, 0, 0]
      const pila = []
      const por = (m, n) => [
        m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
        m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
        m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5],
      ]
      const aplicar = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
      let imagenes = 0
      const codigos = []
      for (let i = 0; i < fnArray.length; i++) {
        const fn = fnArray[i]
        const args = argsArray[i]
        if (IMAGENES.has(fn)) imagenes++
        else if (fn === OPS.save) pila.push(ctm)
        else if (fn === OPS.restore) ctm = pila.pop() ?? ctm
        else if (fn === OPS.transform) ctm = por(args, ctm)
        else if (fn === OPS.paintFormXObjectBegin) {
          pila.push(ctm)
          if (Array.isArray(args?.[0]) || ArrayBuffer.isView(args?.[0])) ctm = por([...args[0]], ctm)
        } else if (fn === OPS.paintFormXObjectEnd) ctm = pila.pop() ?? ctm
        else if (fn === OPS.constructPath) {
          const datos = args?.[1]?.[0]
          if (!datos || !ArrayBuffer.isView(datos)) continue
          // Los tramos: moveTo (0) x y, lineTo (1) x y, curveTo (2) 6, quadraticCurveTo (3) 4, closePath (4).
          const tramos = []
          let curvas = 0
          let mueve = 0
          let actual = null
          for (let k = 0; k < datos.length; ) {
            const op = datos[k++]
            if (op === 0) {
              actual = [datos[k++], datos[k++]]
              mueve++
            } else if (op === 1) {
              const fin = [datos[k++], datos[k++]]
              if (actual) tramos.push([actual, fin])
              actual = fin
            } else if (op === 2) {
              k += 6
              curvas++
            } else if (op === 3) {
              k += 4
              curvas++
            } else if (op === 4) {
              // closePath
            } else break
          }
          if (curvas || mueve < 40 || tramos.length < 40) continue
          const enMm = tramos.map(([a, b]) => {
            const [ax, ay] = aplicar(ctm, a[0], a[1])
            const [bx, by] = aplicar(ctm, b[0], b[1])
            return [[(ax - x0) * pt, (y1 - ay) * pt], [(bx - x0) * pt, (y1 - by) * pt]]
          })
          const xs = enMm.flatMap(([a, b]) => [a[0], b[0]])
          const ys = enMm.flatMap(([a, b]) => [a[1], b[1]])
          const ancho = Math.max(...xs) - Math.min(...xs)
          const alto = Math.max(...ys) - Math.min(...ys)
          if (ancho < 10 || alto < ancho * 0.8 || alto > ancho * 1.05) continue
          codigos.push({ anchoMm: ancho, izquierdaMm: Math.min(...xs), arribaMm: Math.min(...ys), tramos: enMm, pintura: args[0] })
        }
      }
      paginas.push({ anchoMm: (x1 - x0) * pt, altoMm: (y1 - y0) * pt, imagenes, codigos })
      pagina.cleanup()
    }
  } finally {
    await doc.destroy()
  }
  return paginas
}

/** Compara un PDF con lo pedido: las páginas, su tamaño, sin imágenes y el ancho de cada código. */
export function revisarPdf(paginas, trabajo) {
  const problemas = []
  const { archivo } = trabajo
  if (paginas.length !== trabajo.paginas.length) problemas.push(`${archivo}: tiene ${paginas.length} páginas y tenía que tener ${trabajo.paginas.length}`)
  paginas.forEach((p, i) => {
    const pedido = trabajo.paginas[i]
    if (!pedido) return
    const donde = `${archivo}, página ${i + 1}`
    if (Math.abs(p.anchoMm - pedido.hoja[0]) > 0.5 || Math.abs(p.altoMm - pedido.hoja[1]) > 0.5) {
      problemas.push(`${donde}: mide ${coma(p.anchoMm)} x ${coma(p.altoMm)} mm y tenía que medir ${pedido.hoja[0]} x ${pedido.hoja[1]}`)
    }
    if (p.imagenes) problemas.push(`${donde}: tiene ${p.imagenes} imágenes rasterizadas (el código tiene que quedar vectorial)`)
    const medidos = p.codigos.map((c) => c.anchoMm).sort((a, b) => b - a)
    const esperados = [...pedido.codigos].map((cm) => cm * 10).sort((a, b) => b - a)
    if (medidos.length !== esperados.length) {
      problemas.push(`${donde}: encontré ${medidos.length} códigos (${medidos.map((m) => coma(m, 2)).join(', ')} mm) y tenía que haber ${esperados.length}`)
      return
    }
    esperados.forEach((e, j) => {
      if (Math.abs(medidos[j] - e) > TOLERANCIA_MM) problemas.push(`${donde}: un código mide ${coma(medidos[j], 3)} mm y tenía que medir ${coma(e, 0)}`)
    })
  })
  return problemas
}

// ---------- La herramienta

const AYUDA = `Uso: node tools/audioguia-qr.mjs --urls <archivo> [--salida <carpeta>] [--dir <carpeta del manifiesto>] [--cm 10] [--reemplazar]
       node tools/audioguia-qr.mjs --prueba --host <host[:puerto]> --urls <archivo> [--salida <carpeta>] …
El archivo de las URL es lo que imprimió npm run audioguia-urls (sin la clave).`

/**
 * Los argumentos.
 * @param {string[]} argv
 * @returns {{ ok: true, urls: string, salida: string, prueba: boolean, host: string | null, dir: string, cm: number, reemplazar: boolean, ayuda: boolean } | { ok: false, error: string }}
 */
export function leerArgumentos(argv) {
  const r = {
    urls: null,
    salida: join(RAIZ, 'tools', 'salida', 'audioguias', 'qr'),
    prueba: false,
    host: null,
    dir: process.env.DIR_AUDIOGUIAS ? resolve(RAIZ, process.env.DIR_AUDIOGUIAS) : join(RAIZ, 'audioguias'),
    cm: CM_PUERTA,
    reemplazar: false,
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
      if (arg === '--prueba') r.prueba = true
      else if (arg === '--ayuda') r.ayuda = true
      else if (arg === '--reemplazar') r.reemplazar = true
      else if (arg === '--urls') r.urls = resolve(valor(i++, arg))
      else if (arg === '--salida') r.salida = resolve(valor(i++, arg))
      else if (arg === '--dir') r.dir = resolve(valor(i++, arg))
      else if (arg === '--host') {
        r.host = hostDe(valor(i++, arg))
        if (!r.host) throw new Error('--host lleva host[:puerto], p. ej. mupa-web.onrender.com o 192.168.0.10:5183')
      } else if (arg === '--cm') {
        const texto = valor(i++, arg).replace(',', '.')
        r.cm = Number(texto)
        if (!/^\d+(\.\d+)?$/.test(texto) || r.cm < CM_MIN || r.cm > CM_MAX) throw new Error(`--cm va de ${CM_MIN} a ${CM_MAX}`)
      } else throw new Error(`no conozco la opción ${arg}`)
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
  if (!r.ayuda && !r.urls) return { ok: false, error: 'falta --urls con el archivo que imprimió npm run audioguia-urls' }
  if (r.host && !r.prueba) return { ok: false, error: '--host es para --prueba (los definitivos son siempre de mupa.ar)' }
  return { ok: true, ...r }
}

/** ¿La carpeta de salida está dentro del repo y fuera de tools/salida/ (o sea, en algo que se puede versionar)? */
export function salidaVersionable(salida) {
  const rel = relative(RAIZ, resolve(salida))
  if (rel.startsWith('..') || isAbsolute(rel)) return false
  const partes = rel.split(/[\\/]/)
  return !(partes[0] === 'tools' && partes[1] === 'salida')
}

/** La marca del resumen.json de esta herramienta: dice que la carpeta es una salida suya. */
export const GENERADO_POR = 'tools/audioguia-qr.mjs'

/**
 * Todos los nombres que esta herramienta puede escribir: <espacio>.svg y .pdf de cualquier espacio de la audioguía,
 * recepcion-ad.svg y .pdf, todos.pdf, prueba.pdf y resumen.json. Nada que no esté acá se borra nunca.
 */
export const NOMBRES_PROPIOS = Object.freeze(
  new Set([
    ...[...ESPACIOS_DE_LA_AUDIOGUIA, ID_AD].flatMap((id) => [`${id}.svg`, `${id}.pdf`]),
    'todos.pdf',
    'prueba.pdf',
    'resumen.json',
  ]),
)

/**
 * Qué hacer con la carpeta de salida antes de escribir (AG-QR-01). Puro: recibe lo que hay y decide.
 * - Vacía (o que no existe): escribir, sin borrar nada.
 * - Una salida de esta herramienta (resumen.json con generadoPor y archivos): borrar lo que la corrida anterior
 *   escribió (su lista archivos, solo nombres propios) y esta no vuelve a escribir. Lo ajeno queda.
 * - Cualquier otra con algo adentro: no, salvo con --reemplazar, que pisa los nombres que escribe y no borra nada.
 * @param {{ nombre: string, archivo: boolean }[]} entradas  lo que hay en la carpeta (archivo: false, una subcarpeta)
 * @param {{ nuevos: Set<string>, resumenAnterior?: any, reemplazar?: boolean }} opciones
 * @returns {{ ok: true, borrar: string[] } | { ok: false, error: string }}
 */
export function planDeLaSalida(entradas, { nuevos, resumenAnterior = null, reemplazar = false }) {
  if (!entradas.length) return { ok: true, borrar: [] }
  const nuestra = resumenAnterior?.generadoPor === GENERADO_POR && Array.isArray(resumenAnterior.archivos)
  if (!nuestra) {
    if (reemplazar) return { ok: true, borrar: [] }
    return {
      ok: false,
      error:
        'la carpeta de --salida ya tiene archivos y no es una salida de esta herramienta (no tiene su resumen.json). ' +
        'Elegí una carpeta vacía o nueva, o pasá --reemplazar para pisar solo los archivos con los nombres que escribe (no borra nada).',
    }
  }
  const anteriores = new Set(resumenAnterior.archivos.filter((n) => typeof n === 'string' && NOMBRES_PROPIOS.has(n)))
  const borrar = entradas
    .filter(({ nombre, archivo }) => archivo && anteriores.has(nombre) && !nuevos.has(nombre))
    .map(({ nombre }) => nombre)
    .sort()
  return { ok: true, borrar }
}

/** El resumen.json de una corrida anterior en la carpeta, o null (no existe, no se lee o no es JSON). */
function leerResumenAnterior(carpeta) {
  try {
    return JSON.parse(readFileSync(join(carpeta, 'resumen.json'), 'utf8'))
  } catch {
    return null
  }
}

async function principal() {
  const args = leerArgumentos(process.argv.slice(2))
  if (!args.ok) {
    console.error(`${args.error}\n${AYUDA}`)
    return 1
  }
  if (args.ayuda) {
    console.log(AYUDA)
    return 0
  }
  if (salidaVersionable(args.salida)) {
    console.error(`--salida está en el repo y fuera de tools/salida/: las URL de los QR valen lo mismo que los impresos y no se versionan (${args.salida}).`)
    return 1
  }

  // El manifiesto (solo pistas.json: no hacen falta los MP3).
  let manifiesto
  try {
    const crudo = JSON.parse(readFileSync(join(args.dir, 'pistas.json'), 'utf8').replace(/^\uFEFF/, ''))
    const validado = validarManifiesto(crudo)
    if (!validado.ok) {
      console.error(`El manifiesto ${join(args.dir, 'pistas.json')} no pasa el esquema:\n- ${validado.problemas.join('\n- ')}`)
      return 1
    }
    manifiesto = validado.manifiesto
  } catch (err) {
    console.error(`No puedo leer ${join(args.dir, 'pistas.json')} (${err.code === 'ENOENT' ? 'no existe' : err.message}). Con --dir, la carpeta del manifiesto.`)
    return 1
  }

  let texto
  try {
    texto = readFileSync(args.urls, 'utf8')
  } catch (err) {
    console.error(`No puedo leer ${args.urls} (${err.code === 'ENOENT' ? 'no existe' : err.message}).`)
    return 1
  }
  const leidas = leerUrls(texto)
  const { carteles, problemas, avisos } = validarCarteles(leidas.renglones, manifiesto, { prueba: args.prueba, host: args.host })
  for (const a of avisos) console.error(`aviso: ${a}`)
  const todos = [...leidas.problemas, ...problemas]
  if (todos.length) {
    console.error(`Las URL no pasan:\n- ${todos.join('\n- ')}`)
    return 1
  }
  const armados = armarSimbolos(carteles, { prueba: args.prueba })
  if (!armados.ok) {
    console.error(armados.problema)
    return 1
  }
  for (const s of armados.simbolos) s.svg = svgDe(s)

  const lista = trabajos(armados.simbolos, { cm: args.cm, prueba: args.prueba })
  const pdfs = new Map()
  const fallas = []
  borrarPerfilesViejos()
  const chrome = await abrirChrome()
  try {
    for (const t of lista) {
      const enLaHoja = await chrome.cargar(t.html)
      fallas.push(...enLaHoja.map((p) => `${t.archivo}: ${p}`))
      const pdf = await chrome.imprimir()
      fallas.push(...revisarPdf(await leerPdf(pdf), t))
      pdfs.set(t.archivo, pdf)
    }
    fallas.push(...chrome.problemas.map((p) => `Chrome: ${p}`))
  } finally {
    await chrome.cerrar()
  }
  if (fallas.length) {
    console.error(`No escribí nada: las hojas no pasan.\n- ${[...new Set(fallas)].join('\n- ')}`)
    return 1
  }

  const nuevos = new Set([...armados.simbolos.map((s) => `${s.id}.svg`), ...pdfs.keys(), 'resumen.json'])
  const entradas = existsSync(args.salida)
    ? readdirSync(args.salida, { withFileTypes: true }).map((d) => ({ nombre: d.name, archivo: d.isFile() }))
    : []
  const plan = planDeLaSalida(entradas, { nuevos, resumenAnterior: leerResumenAnterior(args.salida), reemplazar: args.reemplazar })
  if (!plan.ok) {
    console.error(`No escribí nada: ${plan.error} (${args.salida})`)
    return 1
  }
  mkdirSync(args.salida, { recursive: true })
  for (const nombre of plan.borrar) rmSync(join(args.salida, nombre), { force: true })
  for (const s of armados.simbolos) writeFileSync(join(args.salida, `${s.id}.svg`), `${svgEnMm(s.svg, s.ad ? CM_TARJETA : args.cm, s.modulos)}\n`)
  for (const [archivo, pdf] of pdfs) writeFileSync(join(args.salida, archivo), pdf)
  const resumen = {
    generadoPor: GENERADO_POR,
    archivos: [...nuevos].sort(),
    tipo: args.prueba ? 'prueba' : 'definitivos',
    host: args.prueba ? args.host : HOST_DEFINITIVO,
    versionDeLosCodigos: manifiesto.version,
    versionDelQr: armados.version,
    modulos: armados.modulos,
    correccion: CORRECCION,
    silencioModulos: SILENCIO,
    carteles: armados.simbolos.map((s) => {
      const cm = s.ad ? CM_TARJETA : args.cm
      return {
        id: s.id,
        espacio: s.espacio,
        url: s.url,
        largo: s.largo,
        versionDelQr: s.version,
        correccion: s.correccion,
        hoja: s.ad ? 'A6 (tarjeta del mostrador)' : 'A5 vertical',
        codigoCm: cm,
        conSilencioMm: redondear(ladoConSilencioMm(cm, s.modulos), 2),
        moduloMm: redondear(moduloMm(cm, s.modulos), 3),
      }
    }),
  }
  writeFileSync(join(args.salida, 'resumen.json'), `${JSON.stringify(resumen, null, 2)}\n`)

  console.log(`QR ${resumen.tipo} de ${resumen.host}, versión ${resumen.versionDeLosCodigos} de los códigos: versión ${armados.version} del QR (${armados.modulos} módulos), corrección ${CORRECCION}, ${SILENCIO} módulos de silencio.`)
  for (const c of resumen.carteles) {
    console.log(`  ${c.id.padEnd(16)} ${String(c.largo).padStart(3)} caracteres  QR ${c.versionDelQr}-${c.correccion}  ${coma(c.codigoCm, c.codigoCm % 1 ? 1 : 0)} cm (${coma(c.conSilencioMm)} mm con el silencio; módulo de ${coma(c.moduloMm, 2)} mm)  ${c.hoja}`)
  }
  console.log(`En ${args.salida}: ${armados.simbolos.length} SVG, ${pdfs.size} PDF (${[...pdfs.keys()].filter((a) => !/^(todos|prueba)\.pdf$/.test(a)).length} carteles, todos.pdf y prueba.pdf) y resumen.json (con las URL: no se versiona).`)
  console.log('Los PDF se comprobaron: el tamaño de las hojas, sin imágenes rasterizadas y el ancho de cada código medido en el PDF.')
  return 0
}

if (esPrincipal(import.meta)) {
  process.on('SIGINT', () => {
    // Con Ctrl+C no deja su Chrome vivo ni su perfil en %TEMP%: todo sincrónico (como menu-check.mjs).
    for (const { pid } of enCurso) terminarArbol(pid)
    for (const { perfil } of enCurso) borrarPerfil(perfil)
    process.exit(130)
  })
  principal().then(
    (codigo) => process.exit(codigo),
    (err) => {
      for (const { pid } of enCurso) terminarArbol(pid)
      for (const { perfil } of enCurso) borrarPerfil(perfil)
      console.error(`Error: ${err?.stack ?? err}`)
      process.exit(1)
    },
  )
}
