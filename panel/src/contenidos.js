// Lo que el panel sabe de cada contenido (E3.3 y E3.4; plan 5.2 a 5.4): novedades, muestras y salas. Código sin
// React ni DOM (lo usan las pantallas de pantallas/contenido/ y lo prueba server/pruebas/panel-api.test.js).
// - CONTENIDOS: por tipo, sus rutas en la API y en el panel, cómo se nombra ("la novedad", "una muestra"), su campo de
//   título y de texto con formato, si tiene galería y orden, y sus tipos (noticia/actividad, temporal/permanente).
// - traerTodas(api, ruta): un listado entero, página por página (el orden de salas y muestras se cambia con todas).
// - leerFiltros(params, tipos): los filtros del listado de la URL del panel (?estado=&tipo=&q=&pagina=), con lo que no
//   sirve descartado (una dirección tocada a mano no da un error de la API).
// - textosDelSitio(c): lo que el panel dice del sitio al publicar, guardar o despublicar. Hasta que estén las páginas
//   públicas de los contenidos (E4, PAGINAS_PUBLICAS_DE_CONTENIDO) no promete que ya se ve (corrección de E3,
//   16/10/2026: decía "ya está en el sitio" y la dirección daba la 404).
import { PAGINAS_PUBLICAS_DE_CONTENIDO } from '../../compartido/contenidos.js'
import { BUSQUEDA_MAX, ESTADOS_CONTENIDO, POR_PAGINA_MAX } from '../../compartido/esquemas/contenido.js'

/**
 * @typedef {object} Contenido
 * @property {'novedades' | 'muestras' | 'salas'} tipo
 * @property {string} api  la ruta del listado en la API ('/novedades')
 * @property {string} lista  la pantalla del listado en el panel
 * @property {string} textoLista  cómo se llama esa pantalla
 * @property {string} nueva  la pantalla del alta
 * @property {(id: number) => string} ficha  la pantalla de una
 * @property {string} Nombre  'Novedad'
 * @property {string} la  'la novedad'
 * @property {string} una  'una novedad'
 * @property {string} nuevaTexto  'Nueva novedad'
 * @property {'titulo' | 'nombre'} campoTitulo
 * @property {string} etiquetaTitulo
 * @property {'cuerpo' | 'descripcion'} campoTexto
 * @property {string} etiquetaTexto
 * @property {boolean} textoParaPublicar  el texto con formato es obligatorio para publicar
 * @property {boolean} conGaleria
 * @property {boolean} conOrden
 * @property {{ valor: string, texto: string, ayuda: string }[] | null} tipos
 * @property {string} prefijoDireccion  cómo se ve la dirección pública, antes de la parte que se elige
 */

/** @type {Readonly<Record<'novedades' | 'muestras' | 'salas', Contenido>>} */
export const CONTENIDOS = Object.freeze({
  novedades: {
    tipo: 'novedades',
    api: '/novedades',
    lista: '/novedades',
    textoLista: 'Novedades',
    nueva: '/novedades/nueva',
    ficha: (id) => `/novedades/${id}`,
    Nombre: 'Novedad',
    la: 'la novedad',
    una: 'una novedad',
    nuevaTexto: 'Nueva novedad',
    campoTitulo: 'titulo',
    etiquetaTitulo: 'Título',
    campoTexto: 'cuerpo',
    etiquetaTexto: 'Texto de la novedad',
    textoParaPublicar: true,
    conGaleria: true,
    conOrden: false,
    tipos: [
      { valor: 'noticia', texto: 'Noticia', ayuda: 'Algo que pasó o que el museo quiere contar.' },
      {
        valor: 'actividad',
        texto: 'Actividad',
        ayuda: 'Algo que va a pasar en un día y una hora: un taller, una charla, una visita especial.',
      },
    ],
    prefijoDireccion: 'mupa.ar/novedades/',
  },
  muestras: {
    tipo: 'muestras',
    api: '/muestras',
    lista: '/exposiciones',
    textoLista: 'Exposiciones',
    nueva: '/muestras/nueva',
    ficha: (id) => `/muestras/${id}`,
    Nombre: 'Muestra',
    la: 'la muestra',
    una: 'una muestra',
    nuevaTexto: 'Nueva muestra',
    campoTitulo: 'titulo',
    etiquetaTitulo: 'Título',
    campoTexto: 'descripcion',
    etiquetaTexto: 'Descripción de la muestra',
    textoParaPublicar: true,
    conGaleria: true,
    conOrden: true,
    tipos: [
      { valor: 'temporal', texto: 'Temporal', ayuda: 'Con fecha de inicio y, si se sabe, de fin.' },
      { valor: 'permanente', texto: 'Permanente', ayuda: 'Siempre a la vista, sin fechas.' },
    ],
    prefijoDireccion: 'mupa.ar/exposiciones/',
  },
  salas: {
    tipo: 'salas',
    api: '/salas',
    lista: '/exposiciones?pestana=salas',
    textoLista: 'Exposiciones',
    nueva: '/salas/nueva',
    ficha: (id) => `/salas/${id}`,
    Nombre: 'Sala',
    la: 'la sala',
    una: 'una sala',
    nuevaTexto: 'Nueva sala',
    campoTitulo: 'nombre',
    etiquetaTitulo: 'Nombre',
    campoTexto: 'descripcion',
    etiquetaTexto: 'Descripción de la sala',
    textoParaPublicar: false,
    conGaleria: false,
    conOrden: true,
    tipos: null,
    prefijoDireccion: 'mupa.ar/exposiciones#sala-',
  },
})

/**
 * Un listado entero de la API, de a 100 por página (hasta 20 páginas: alcanza de sobra para salas y muestras).
 * @param {{ get: (ruta: string, opciones?: object) => Promise<any> }} api
 * @param {string} ruta  la del listado ('/salas')
 * @param {{ signal?: AbortSignal }} [opciones]
 */
export async function traerTodas(api, ruta, opciones = {}) {
  const items = []
  for (let pagina = 1; pagina <= 20; pagina++) {
    const datos = await api.get(`${ruta}?por=${POR_PAGINA_MAX}&pagina=${pagina}`, opciones)
    items.push(...datos.items)
    if (pagina >= datos.paginas) break
  }
  return items
}

/**
 * Los filtros del listado a partir de la dirección del panel; lo que no sirve queda vacío (y la página, en 1).
 * @param {URLSearchParams} params
 * @param {readonly string[] | null} tipos
 * @returns {{ estado: string, tipo: string, q: string, pagina: number }}
 */
export function leerFiltros(params, tipos = null) {
  const estado = params.get('estado') ?? ''
  const tipo = params.get('tipo') ?? ''
  const pagina = Number(params.get('pagina'))
  return {
    estado: ESTADOS_CONTENIDO.includes(estado) ? estado : '',
    tipo: tipos?.includes(tipo) ? tipo : '',
    q: (params.get('q') ?? '').trim().slice(0, BUSQUEDA_MAX),
    pagina: Number.isInteger(pagina) && pagina >= 1 && pagina <= 100_000 ? pagina : 1,
  }
}

/** La consulta para la URL (del panel o de la API) con los filtros que tienen algo: "?estado=borrador&q=taller". */
export function consultaDe(filtros) {
  const p = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === '' || valor == null || (clave === 'pagina' && valor === 1)) continue
    p.set(clave, String(valor))
  }
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}

/** Mientras no estén las páginas públicas de los contenidos (E4). */
export const SIN_PAGINAS_TODAVIA =
  'Las páginas de novedades y exposiciones del sitio todavía no están: lo publicado se va a ver ahí cuando se sumen.'

/**
 * Los avisos de la ficha que hablan del sitio.
 * @param {Contenido} c
 * @param {boolean} [conPaginas]  PAGINAS_PUBLICAS_DE_CONTENIDO (las pruebas pasan las dos)
 */
export function textosDelSitio(c, conPaginas = PAGINAS_PUBLICAS_DE_CONTENIDO) {
  if (conPaginas) {
    return {
      publicada: `Publicada: ${c.la} ya está en el sitio.`,
      guardadaPublicada: 'Guardado: los cambios ya están en el sitio.',
      notaPublicada: 'Está publicada: los cambios salen al sitio en cuanto los guardás.',
      despublicada: `Quedó como borrador: ${c.la} ya no está en el sitio.`,
      confirmarDespublicar:
        'Deja de estar en el sitio y queda como borrador, con todo lo que tiene. La podés volver a publicar cuando ' +
        'quieras; la dirección web no cambia.',
    }
  }
  return {
    publicada: `Publicada. ${SIN_PAGINAS_TODAVIA}`,
    guardadaPublicada: 'Guardado.',
    notaPublicada: `Está publicada. ${SIN_PAGINAS_TODAVIA}`,
    despublicada: 'Quedó como borrador.',
    confirmarDespublicar:
      'Queda como borrador, con todo lo que tiene. La podés volver a publicar cuando quieras; la dirección web no ' +
      'cambia.',
  }
}
