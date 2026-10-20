// El sitio público armado en el servidor (E4.2 a E4.4, E4.6 y E4.8; plan 6.1 a 6.5 y 13.1): las páginas internas con
// el render de verdad (src/entry-server.jsx cargado con el Vite del proyecto, como layout.test.js) sobre la base de
// prueba, con el contenido cargado por la API del panel.
// - Las rutas y sus códigos: 200, la 404 de un borrador y de lo que no existe, lo finalizado o realizado con 200 pero
//   fuera de los listados, la paginación de /novedades (301 de ?pagina=1 y 404 de una página que no es un entero de 2
//   en adelante o que pasa del total), un borrador que se publica se ve en el pedido siguiente y despublicado vuelve a
//   dar 404.
// - El <head>: título "<Título> · MuPa", descripción del resumen (hasta 160), canonical y og:url con
//   https://mupa.ar/…, og:image con el og.jpg de la portada y sus medidas, noindex por host (meta y cabecera), JSON-LD
//   que parsea (Museum con los datos cargados y NewsArticle en las novedades).
// - El estado sin datos privados: ni el correo de destino, ni las tarifas ocultas, ni los borradores, ni los campos
//   internos de las fotos (id, peso, quién la subió).
// - Escapes: </script> y $' $& $$ en los títulos no rompen el HTML ni el JSON-LD.
// - El sitemap con las páginas fijas y lo publicado (también lo finalizado o realizado), sin borradores.
// - Ninguna respuesta pública pone Set-Cookie aunque el pedido traiga la cookie de sesión (desde auth.test.js).
// - Sin base (sin la base de prueba también corre): con la base caída la Home sale (200) y las demás, la 503 simple; el
//   cálculo de las precargas (modulepreload) a partir del manifiesto; cada página de la tabla tiene su archivo.
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, test } from 'node:test'
import { urlPublica } from '../../compartido/contenidos.js'
import { hoyEnSanJuan, localDeInstante } from '../../compartido/fechas.js'
import { VARIANTES_FOTO } from '../../compartido/fotos.js'
import { crearApp } from '../app.js'
import { leerConfig } from '../config.js'
import { crearConexion } from '../db/conexion.js'
import { crearAlmacen } from '../fotos/almacen.js'
import { crearMuseoPublico } from '../museo.js'
import { RUTAS } from '../rutas-publicas.js'
import { CSP_PANEL } from '../seguridad.js'
import { cortarEnPalabra, horarioSchema, medidasOg } from '../seo.js'
import { crearSsr, partir, precargasDePaginas } from '../ssr.js'
import { cerrarBase, levantar, pedir, prepararBase, salteoVisible, sql } from './ayudas.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const PLANTILLA =
  '<!doctype html><html lang="es"><head><meta charset="UTF-8" /><!--head--></head>' +
  '<body><div id="root"><!--app--></div><!--estado--></body></html>\n'

// El render de verdad, con el Vite del proyecto (su propia caché, en el temporal del sistema).
let vite
let entrada
before(async () => {
  const { createServer } = await import('vite')
  vite = await createServer({
    root: RAIZ,
    configFile: false,
    cacheDir: join(tmpdir(), 'mupa-vite-pruebas-ssr'),
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  entrada = await vite.ssrLoadModule('/src/entry-server.jsx')
})
after(() => vite?.close())
const obtener = async () => ({ partes: partir(PLANTILLA), render: entrada.render })

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

/** El estado de la página (el JSON de <script id="estado">). */
const estadoDe = (html) => JSON.parse(/<script id="estado" type="application\/json">(.*?)<\/script>/s.exec(html)[1])
/** Los JSON-LD de la página, ya parseados (tira si alguno no parsea). */
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]))
const meta = (html, propiedad) =>
  new RegExp(`<meta (?:property|name)="${propiedad}" content="([^"]*)" />`).exec(html)?.[1] ?? null
const cuantas = (texto, buscado) => texto.split(buscado).length - 1

/** Un día "AAAA-MM-DD" en San Juan, a n días de hoy. */
const dia = (n) => hoyEnSanJuan(new Date(Date.now() + n * 86_400_000))
/** Un día y hora de San Juan ("AAAA-MM-DDTHH:MM", como lo manda el panel), a n días de ahora. */
const diaHora = (n) => localDeInstante(new Date(Date.now() + n * 86_400_000))
const parrafo = (texto) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] })

describe('las páginas internas con base', { skip: base.motivo ?? false }, () => {
  let s
  let admin
  let editor
  let almacen
  const creadas = {}

  const api = (metodo, ruta, cuerpo, quien = editor) =>
    s.pedir(metodo, `api:${ruta}`, { cookie: quien.cookie, cuerpo: cuerpo ?? (metodo === 'GET' ? undefined : {}) })
  const ok = async (promesa, status = 200) => {
    const r = await promesa
    assert.equal(r.status, status, r.texto)
    return r.json?.data
  }

  /** Una foto guardada directo en el almacén (unos bytes: acá no se sirven). */
  async function foto({ alt = 'Una foto de prueba', ancho = 3000, alto = 2000, epigrafe = null } = {}) {
    const archivos = VARIANTES_FOTO.map((variante) => ({ variante, datos: Buffer.from([1, 2, 3]) }))
    const f = await almacen.guardar(
      { alt, decorativa: false, epigrafe, credito: 'Crédito de prueba', subidaPor: editor.usuario.id },
      { ancho, alto, variantes: [480, 960, 1600, 2400], bytes: 12_345, archivos },
    )
    return { id: f.id, clave: f.clave }
  }

  /** Una novedad (completa) publicada o no. */
  async function novedad({ titulo, tipo = 'noticia', publicar = true, ...resto }) {
    const alta = await ok(api('POST', '/novedades', { titulo, tipo }), 201)
    const portada = await foto({ alt: `Portada de ${titulo}` })
    const ficha = await ok(
      api('PUT', `/novedades/${alta.id}`, {
        tipo,
        titulo,
        slug: null,
        resumen: `Resumen de ${titulo}`,
        cuerpo: parrafo(`Texto de ${titulo}`),
        portadaId: portada.id,
        eventoInicio: null,
        eventoFin: null,
        lugar: null,
        costo: null,
        enlaceInscripcion: null,
        ...resto,
      }),
    )
    if (publicar) await ok(api('POST', `/novedades/${alta.id}/publicar`))
    return { ...ficha, portada }
  }

  /** Una muestra (completa) publicada o no. */
  async function muestra({ titulo, tipo = 'temporal', publicar = true, ...resto }) {
    const alta = await ok(api('POST', '/muestras', { titulo, tipo }), 201)
    const portada = await foto({ alt: `Portada de ${titulo}` })
    const ficha = await ok(
      api('PUT', `/muestras/${alta.id}`, {
        tipo,
        titulo,
        slug: null,
        resumen: `Resumen de ${titulo}`,
        descripcion: parrafo(`Descripción de ${titulo}`),
        portadaId: portada.id,
        fechaInicio: null,
        fechaFin: null,
        salaId: null,
        ...resto,
      }),
    )
    if (publicar) await ok(api('POST', `/muestras/${alta.id}/publicar`))
    return { ...ficha, portada }
  }

  before(async () => {
    almacen = crearAlmacen(base.sequelize)
    s = await levantar({}, { almacen, obtener })
    admin = await s.cookiePara('admin', { nombre: 'Admin del sitio' })
    editor = await s.cookiePara('editor', { nombre: 'Editora del sitio' })

    // El museo: con el correo de destino (que nunca puede salir), el horario, una tarifa oculta y los textos.
    await ok(
      api(
        'PUT',
        '/museo',
        {
          direccion: 'Avenida de prueba 1234',
          localidad: 'San Juan',
          provincia: 'San Juan',
          codigoPostal: '5400',
          telefono: '+54 264 000-0000',
          emailPublico: 'museo@example.com',
          emailDestinoContacto: 'destino.secreto@example.com',
          redes: [{ red: 'instagram', url: 'https://www.instagram.com/mupa-prueba' }],
          notaTarifas: 'Nota de las tarifas',
          comoLlegar: parrafo('Así se llega.'),
        },
        admin,
      ),
    )
    await ok(
      api('PUT', '/horarios', {
        dias: [1, 2, 3, 4, 5, 6, 7].map((d) => ({
          dia: d,
          abierto: d !== 1,
          franjas: d === 1 ? [] : [{ abre: '09:00', cierra: '13:00' }],
          nota: d === 7 ? 'Visitas guiadas' : null,
        })),
      }),
    )
    await ok(api('POST', '/tarifas', { nombre: 'General', precio: 3000 }), 201)
    await ok(api('POST', '/tarifas', { nombre: 'Tarifa escondida', precio: 1, visible: false }), 201)
    await ok(api('POST', '/tarifas', { nombre: 'Menores', gratuita: true }), 201)

    // Una sala publicada y otra en borrador.
    const sala = await ok(api('POST', '/salas', { nombre: 'Sala Triásico' }), 201)
    const portadaSala = await foto({ alt: 'La sala' })
    await ok(
      api('PUT', `/salas/${sala.id}`, {
        nombre: 'Sala Triásico',
        slug: null,
        resumen: 'La sala del Triásico',
        descripcion: parrafo('Texto de la sala'),
        portadaId: portadaSala.id,
      }),
    )
    await ok(api('POST', `/salas/${sala.id}/publicar`))
    creadas.sala = sala
    creadas.salaBorrador = await ok(api('POST', '/salas', { nombre: 'Sala en borrador' }), 201)

    // Muestras: actual (en la sala), próxima, finalizada, permanente y un borrador.
    creadas.actual = await muestra({ titulo: 'Muestra actual', fechaInicio: dia(-10), fechaFin: dia(10), salaId: sala.id })
    creadas.proxima = await muestra({ titulo: 'Muestra próxima', fechaInicio: dia(5), fechaFin: dia(40) })
    creadas.finalizada = await muestra({ titulo: 'Muestra finalizada', fechaInicio: dia(-40), fechaFin: dia(-2) })
    creadas.permanente = await muestra({ titulo: 'Muestra permanente', tipo: 'permanente' })
    creadas.muestraBorrador = await muestra({ titulo: 'Muestra en borrador', tipo: 'permanente', publicar: false })

    // Novedades: 14 noticias (dos páginas de 12), una actividad que viene, una realizada y un borrador.
    creadas.noticias = []
    for (let i = 1; i <= 14; i++) creadas.noticias.push(await novedad({ titulo: `Noticia ${String(i).padStart(2, '0')}` }))
    // La fecha de publicación, en orden (la 14 es la más nueva).
    await sql(
      `UPDATE novedades SET publicado_en = now() - (interval '1 hour' * (100 - CAST(substring(titulo from 9) AS int)))
        WHERE titulo LIKE 'Noticia %'`,
    )
    creadas.proximaActividad = await novedad({
      titulo: 'Actividad que viene',
      tipo: 'actividad',
      eventoInicio: diaHora(7),
      lugar: 'El patio',
      costo: 'Gratis',
      enlaceInscripcion: 'https://example.com/inscripcion',
    })
    creadas.realizada = await novedad({
      titulo: 'Actividad realizada',
      tipo: 'actividad',
      eventoInicio: diaHora(-7),
      enlaceInscripcion: 'https://example.com/inscripcion-vieja',
    })
    creadas.novedadBorrador = await novedad({ titulo: 'Novedad en borrador', publicar: false })
  })
  after(() => s?.cerrar())

  test('/exposiciones: las actuales, próximas y permanentes en su orden (sin la finalizada ni el borrador) y la sala', async () => {
    const r = await s.pedir('GET', '/exposiciones')
    assert.equal(r.status, 200)
    assert.equal(r.h['cache-control'], 'no-cache')
    // ETag y 304 (plan 6.3), como la Home.
    assert.ok(r.h.etag)
    assert.equal((await s.pedir('GET', '/exposiciones', { cabeceras: { 'if-none-match': r.h.etag } })).status, 304)
    const { datos, pagina } = estadoDe(r.texto)
    assert.equal(pagina, 'exposiciones')
    assert.deepEqual(
      datos.muestras.map((m) => [m.titulo, m.etiqueta]),
      [
        ['Muestra actual', 'Actual'],
        ['Muestra próxima', 'Próxima'],
        ['Muestra permanente', 'Permanente'],
      ],
    )
    assert.match(datos.muestras[0].detalle, /^Hasta el \d+ de [a-z]+ de 20\d\d$/)
    assert.match(datos.muestras[1].detalle, /^Del \d+ de/)
    assert.equal(datos.muestras[2].detalle, null)
    assert.deepEqual(
      datos.salas.map((x) => [x.nombre, x.ancla, x.muestras.map((m) => m.url)]),
      [['Sala Triásico', 'sala-sala-triasico', [urlPublica('muestras', creadas.actual.slug)]]],
    )
    // El render de verdad: un solo h1, las tarjetas con su enlace y la sala con su ancla.
    assert.equal(cuantas(r.texto, '<h1'), 1)
    assert.match(r.texto, /<section id="sala-sala-triasico" aria-labelledby="sala-sala-triasico-titulo"/)
    assert.match(r.texto, new RegExp(`<a href="${urlPublica('muestras', creadas.permanente.slug)}"`))
    assert.ok(!r.texto.includes('Muestra finalizada') && !r.texto.includes('en borrador'))
    // Las fotos de las tarjetas, con su srcset y sus medidas. La de la primera tarjeta, la del primer pantallazo del
    // celular, con prioridad y sin lazy (PAG-02 de la verificación de E4); todas las demás fotos de la página, lazy.
    assert.match(r.texto, /<img src="\/fotos\/[0-9a-f]{16}\/960\.webp" srcSet="\/fotos\/[0-9a-f]{16}\/480\.webp 480w, [^"]*1600\.webp 1600w" sizes="[^"]+" width="3000" height="2000" alt="Portada de Muestra actual" fetchPriority="high"/)
    const fotos = r.texto.match(/<img src="\/fotos\/[^>]*>/g) ?? []
    assert.equal(fotos.filter((img) => img.includes('fetchPriority="high"')).length, 1)
    assert.ok(fotos.filter((img) => !img.includes('fetchPriority="high"')).every((img) => img.includes('loading="lazy"')))
  })

  test('/exposiciones/<slug>: 200 también finalizada ("Finalizó el …"); un borrador o lo que no existe, 404', async () => {
    const actual = await s.pedir('GET', urlPublica('muestras', creadas.actual.slug))
    assert.equal(actual.status, 200)
    const d = estadoDe(actual.texto).datos
    assert.equal(d.situacion, 'Actual')
    assert.match(d.fechas, /^Del \d+ de .* al \d+ de .* de 20\d\d$/)
    assert.deepEqual(d.sala, { nombre: 'Sala Triásico', url: '/exposiciones#sala-sala-triasico' })
    // La portada no es lazy (React la precarga) y va con su epígrafe y su crédito.
    assert.match(actual.texto, /<img src="\/fotos\/[0-9a-f]{16}\/960\.webp"[^>]*alt="Portada de Muestra actual" fetchPriority="high"/)
    assert.match(actual.texto, /Foto: Crédito de prueba/)
    const finalizada = await s.pedir('GET', urlPublica('muestras', creadas.finalizada.slug))
    assert.equal(finalizada.status, 200)
    assert.equal(estadoDe(finalizada.texto).datos.situacion, 'Finalizada')
    assert.match(estadoDe(finalizada.texto).datos.fechas, /^Finalizó el \d+ de [a-z]+ de 20\d\d$/)
    for (const ruta of [urlPublica('muestras', creadas.muestraBorrador.slug), '/exposiciones/no-existe']) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 404, ruta)
      assert.equal(estadoDe(r.texto).pagina, 'no-encontrada')
      assert.match(r.texto, /<meta name="robots" content="noindex, nofollow" \/>/)
    }
  })

  test('/visitas: el horario con hoy, las tarifas visibles con su precio, las notas y los textos', async () => {
    const r = await s.pedir('GET', '/visitas')
    assert.equal(r.status, 200)
    const { datos, hoy } = estadoDe(r.texto)
    assert.equal(datos.horario.length, 7)
    const deHoy = datos.horario.filter((h) => h.hoy)
    assert.equal(deHoy.length, 1)
    assert.match(deHoy[0].dia, /^Hoy \((lunes|martes|miércoles|jueves|viernes|sábado|domingo)\)$/)
    assert.equal(hoy, hoyEnSanJuan())
    assert.deepEqual(datos.horario[0], { dia: datos.horario[0].hoy ? deHoy[0].dia : 'Lunes', hoy: datos.horario[0].hoy, horas: null, nota: null })
    assert.equal(datos.horario[1].horas, '9:00 a 13:00')
    assert.equal(datos.horario[6].nota, 'Visitas guiadas')
    assert.deepEqual(
      datos.tarifas.map((t) => [t.nombre, t.precio]),
      [
        ['General', '$ 3.000'],
        ['Menores', null],
      ],
    )
    assert.equal(datos.notaTarifas, 'Nota de las tarifas')
    assert.deepEqual(datos.comoLlegar, parrafo('Así se llega.'))
    assert.equal(datos.normas, null)
    assert.match(r.texto, /<tr [^>]*aria-current="date"/)
    assert.match(r.texto, />Gratis</)
    assert.match(r.texto, /<h2 id="comoLlegar"/)
    assert.ok(!r.texto.includes('Tarifa escondida'))
  })

  test('/novedades: las próximas actividades y 12 noticias por página; ?pagina=1 da 301; lo que no es una página, 404', async () => {
    const r = await s.pedir('GET', '/novedades')
    assert.equal(r.status, 200)
    const d = estadoDe(r.texto).datos
    assert.equal(d.pagina, 1)
    assert.equal(d.paginas, 2)
    assert.deepEqual(d.proximas.map((n) => n.titulo), ['Actividad que viene'])
    assert.match(d.proximas[0].detalle, /^[A-ZÁÉÍÓÚ][a-záéíóú]+ \d+ de [a-z]+ de 20\d\d, \d+:\d\d$/)
    assert.equal(d.noticias.length, 12)
    assert.equal(d.noticias[0].titulo, 'Noticia 14')
    assert.ok(!r.texto.includes('Actividad realizada') && !r.texto.includes('Novedad en borrador'))
    assert.match(r.texto, /<link rel="canonical" href="https:\/\/mupa\.ar\/novedades" \/>/)
    assert.match(r.texto, /rel="next"/)

    const dos = await s.pedir('GET', '/novedades?pagina=2')
    assert.equal(dos.status, 200)
    const d2 = estadoDe(dos.texto).datos
    assert.deepEqual([d2.pagina, d2.proximas.length], [2, 0])
    assert.deepEqual(d2.noticias.map((n) => n.titulo), ['Noticia 02', 'Noticia 01'])
    assert.match(dos.texto, /<title>Novedades, página 2 · MuPa<\/title>/)
    assert.match(dos.texto, /<link rel="canonical" href="https:\/\/mupa\.ar\/novedades\?pagina=2" \/>/)

    const uno = await s.pedir('GET', '/novedades?pagina=1')
    assert.equal(uno.status, 301)
    assert.equal(uno.h.location, '/novedades')
    for (const consulta of ['pagina=3', 'pagina=0', 'pagina=02', 'pagina=abc', 'pagina=', 'pagina=2&pagina=3', 'pagina=1.5', 'pagina=-2']) {
      const malo = await s.pedir('GET', `/novedades?${consulta}`)
      assert.equal(malo.status, 404, consulta)
      assert.equal(malo.h['set-cookie'], undefined)
    }
  })

  test('/novedades/<slug>: la actividad que viene con su inscripción; la realizada, 200 y sin inscripción; un borrador, 404', async () => {
    const viene = await s.pedir('GET', urlPublica('novedades', creadas.proximaActividad.slug))
    assert.equal(viene.status, 200)
    const a = estadoDe(viene.texto).datos.actividad
    assert.equal(a.realizada, false)
    assert.equal(a.inscripcion, 'https://example.com/inscripcion')
    assert.equal(a.lugar, 'El patio')
    assert.match(a.cuandoIso, /^20\d\d-\d\d-\d\dT\d\d:\d\d-03:00$/)
    assert.match(viene.texto, /<a href="https:\/\/example\.com\/inscripcion"/)

    const realizada = await s.pedir('GET', urlPublica('novedades', creadas.realizada.slug))
    assert.equal(realizada.status, 200)
    const r = estadoDe(realizada.texto).datos.actividad
    assert.deepEqual([r.realizada, r.inscripcion], [true, null])
    assert.match(realizada.texto, />Realizada</)
    assert.ok(!realizada.texto.includes('inscripcion-vieja'))

    const noticia = await s.pedir('GET', urlPublica('novedades', creadas.noticias[0].slug))
    assert.equal(estadoDe(noticia.texto).datos.actividad, null)
    assert.match(estadoDe(noticia.texto).datos.fecha, /^\d+ de [a-z]+ de 20\d\d$/)

    assert.equal((await s.pedir('GET', urlPublica('novedades', creadas.novedadBorrador.slug))).status, 404)
  })

  test('un borrador que se publica se ve en el pedido siguiente; despublicado, otra vez 404', async () => {
    const n = creadas.novedadBorrador
    const ruta = urlPublica('novedades', n.slug)
    assert.equal((await s.pedir('GET', ruta)).status, 404)
    await ok(api('POST', `/novedades/${n.id}/publicar`))
    assert.equal((await s.pedir('GET', ruta)).status, 200)
    assert.ok((await s.pedir('GET', '/novedades')).texto.includes(ruta))
    assert.ok((await s.pedir('GET', '/sitemap.xml')).texto.includes(`https://mupa.ar${ruta}`))
    await ok(api('POST', `/novedades/${n.id}/despublicar`))
    assert.equal((await s.pedir('GET', ruta)).status, 404)
    assert.ok(!(await s.pedir('GET', '/novedades')).texto.includes(ruta))
    assert.ok(!(await s.pedir('GET', '/sitemap.xml')).texto.includes(ruta))
  })

  test('el <head>: título, descripción, canonical, og:image de la portada con sus medidas y JSON-LD que parsea', async () => {
    const n = creadas.proximaActividad
    const r = await s.pedir('GET', urlPublica('novedades', n.slug))
    assert.match(r.texto, /<title>Actividad que viene · MuPa<\/title>/)
    assert.equal(meta(r.texto, 'description'), 'Resumen de Actividad que viene')
    assert.match(r.texto, new RegExp(`<link rel="canonical" href="https://mupa\\.ar/novedades/${n.slug}" />`))
    assert.equal(meta(r.texto, 'og:url'), `https://mupa.ar/novedades/${n.slug}`)
    assert.equal(meta(r.texto, 'og:type'), 'article')
    assert.equal(meta(r.texto, 'og:title'), 'Actividad que viene')
    assert.equal(meta(r.texto, 'og:image'), `https://mupa.ar/fotos/${n.portada.clave}/og.jpg`)
    assert.deepEqual([meta(r.texto, 'og:image:width'), meta(r.texto, 'og:image:height')], ['1200', '800'])
    assert.equal(meta(r.texto, 'og:image:alt'), 'Portada de Actividad que viene')
    assert.match(meta(r.texto, 'article:published_time'), /^20\d\d-\d\d-\d\dT/)
    assert.doesNotMatch(r.texto, /name="robots"/)
    assert.equal(r.h['x-robots-tag'], undefined)
    const [ld] = jsonLd(r.texto)
    const tipos = ld['@graph'].map((x) => x['@type'])
    assert.deepEqual(tipos, ['Museum', 'NewsArticle'])
    const [museo, articulo] = ld['@graph']
    assert.equal(museo['@id'], 'https://mupa.ar/#museo')
    assert.deepEqual(museo.address, {
      '@type': 'PostalAddress',
      streetAddress: 'Avenida de prueba 1234',
      addressLocality: 'San Juan',
      postalCode: '5400',
      addressRegion: 'San Juan',
      addressCountry: 'AR',
    })
    assert.equal(museo.telephone, '+54 264 000-0000')
    assert.equal(museo.email, 'museo@example.com')
    assert.deepEqual(museo.sameAs, ['https://www.instagram.com/mupa-prueba'])
    assert.deepEqual(museo.openingHoursSpecification, [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => `https://schema.org/${d}`),
        opens: '09:00',
        closes: '13:00',
      },
    ])
    assert.equal(articulo.headline, 'Actividad que viene')
    assert.equal(articulo.mainEntityOfPage, `https://mupa.ar/novedades/${n.slug}`)
    assert.deepEqual(articulo.image, [`https://mupa.ar/fotos/${n.portada.clave}/og.jpg`])
    assert.equal(articulo.publisher['@type'], 'Organization')
    // Las páginas fijas: su título, una descripción y el Museum.
    for (const [ruta, titulo] of [
      ['/exposiciones', 'Exposiciones · MuPa'],
      ['/visitas', 'Visitas · MuPa'],
      ['/novedades', 'Novedades · MuPa'],
    ]) {
      const fija = await s.pedir('GET', ruta)
      assert.ok(fija.texto.includes(`<title>${titulo}</title>`), ruta)
      assert.ok(meta(fija.texto, 'description'), ruta)
      assert.equal(meta(fija.texto, 'og:image'), 'https://mupa.ar/og.jpg', ruta)
      assert.deepEqual(jsonLd(fija.texto)[0]['@graph'].map((x) => x['@type']), ['Museum'], ruta)
    }
    // La Home sigue con WebSite + Museum, ahora con los datos cargados.
    const home = await s.pedir('GET', '/')
    const [ldHome] = jsonLd(home.texto)
    assert.deepEqual(ldHome['@graph'].map((x) => x['@type']), ['WebSite', 'Museum'])
    assert.equal(ldHome['@graph'][1].telephone, '+54 264 000-0000')
  })

  test('noindex por host: fuera de mupa.ar, meta y cabecera; en mupa.ar, ninguna', async () => {
    for (const ruta of ['/exposiciones', urlPublica('novedades', creadas.noticias[0].slug), '/visitas']) {
      const render = await s.pedir('GET', ruta, { host: 'mupa-web.onrender.com' })
      assert.equal(render.status, 200, ruta)
      assert.equal(render.h['x-robots-tag'], 'noindex, nofollow', ruta)
      assert.match(render.texto, /<meta name="robots" content="noindex, nofollow" \/>/, ruta)
      // El canonical sigue apuntando a mupa.ar.
      assert.match(render.texto, /<link rel="canonical" href="https:\/\/mupa\.ar\//, ruta)
      const publico = await s.pedir('GET', ruta)
      assert.equal(publico.h['x-robots-tag'], undefined, ruta)
      assert.doesNotMatch(publico.texto, /name="robots"/, ruta)
      // La CSP pública, nunca la del panel.
      assert.notEqual(publico.h['content-security-policy'], CSP_PANEL, ruta)
      assert.match(publico.h['content-security-policy'], /googletagmanager/, ruta)
    }
  })

  test('el estado no lleva nada privado: ni el correo de destino, ni tarifas ocultas, ni borradores, ni datos internos de las fotos', async () => {
    const rutas = [
      '/',
      '/exposiciones',
      '/visitas',
      '/novedades',
      '/novedades?pagina=2',
      urlPublica('muestras', creadas.actual.slug),
      urlPublica('novedades', creadas.proximaActividad.slug),
    ]
    for (const ruta of rutas) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 200, ruta)
      for (const prohibido of [
        'destino.secreto',
        'emailDestinoContacto',
        'Tarifa escondida',
        'en borrador',
        '"bytes"',
        'subidaPor',
        '"estado":"borrador"',
        'Editora del sitio',
        'actualizadoPor',
      ]) {
        assert.ok(!r.texto.includes(prohibido), `${ruta}: ${prohibido}`)
      }
      const { datos } = estadoDe(r.texto)
      // Las fotos, solo con sus campos públicos.
      const fotos = JSON.stringify(datos).match(/"clave":"[0-9a-f]{16}"[^}]*\}/g) ?? []
      for (const f of fotos) {
        assert.deepEqual(Object.keys(JSON.parse(`{${f}`)).sort(), ['alt', 'alto', 'ancho', 'clave', 'credito', 'decorativa', 'epigrafe', 'variantes'], ruta)
      }
    }
  })

  test('un título con </script> y $\' $& $$: el HTML queda entero y el JSON-LD parsea', async () => {
    const titulo = `</script><script>alert(1)</script> $' $& $$ "comillas" <b>`
    const n = await novedad({ titulo })
    const r = await s.pedir('GET', urlPublica('novedades', n.slug))
    assert.equal(r.status, 200)
    assert.ok(!r.texto.includes('<script>alert(1)'))
    assert.ok(!r.texto.includes('<b>'))
    assert.equal(estadoDe(r.texto).datos.titulo, titulo)
    assert.equal(jsonLd(r.texto)[0]['@graph'][1].headline, titulo)
    // El texto con $ sale tal cual en el h1 (escapado como HTML por React) y en el estado.
    assert.match(r.texto, /<h1 [^>]*>&lt;\/script&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt; \$(&#x27;|&#39;) \$&amp; \$\$ /)
    assert.ok(r.texto.includes(`$' $& $$`), 'en el JSON del estado, tal cual')
    assert.match(r.texto, /<title>&lt;\/script&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt; \$&#39; \$&amp; \$\$/)
    assert.equal(cuantas(r.texto, '<h1'), 1)
    // Y en el listado.
    const lista = await s.pedir('GET', '/novedades')
    assert.ok(!lista.texto.includes('<script>alert(1)'))
    await ok(api('POST', `/novedades/${n.id}/despublicar`))
  })

  test('sitemap.xml: las páginas fijas y lo publicado (también lo finalizado o realizado), sin borradores', async () => {
    const r = await s.pedir('GET', '/sitemap.xml')
    assert.equal(r.status, 200)
    assert.match(r.h['content-type'], /application\/xml/)
    const locs = [...r.texto.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    for (const fija of ['/', '/exposiciones', '/visitas', '/novedades', '/contacto']) assert.ok(locs.includes(`https://mupa.ar${fija}`), fija)
    for (const c of [creadas.actual, creadas.finalizada, creadas.permanente, creadas.proxima]) {
      assert.ok(locs.includes(`https://mupa.ar${urlPublica('muestras', c.slug)}`), c.titulo)
    }
    for (const c of [creadas.realizada, creadas.proximaActividad, ...creadas.noticias]) {
      assert.ok(locs.includes(`https://mupa.ar${urlPublica('novedades', c.slug)}`), c.titulo)
    }
    assert.ok(!r.texto.includes('borrador'))
    assert.ok(!r.texto.includes('administracion'))
    assert.ok(!r.texto.includes('#sala'))
    assert.match(r.texto, /<loc>https:\/\/mupa\.ar\/exposiciones<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    assert.match(r.texto, /<loc>https:\/\/mupa\.ar\/visitas<\/loc>\s*<\/url>/)
  })

  test('ninguna respuesta pública lleva Set-Cookie, aunque el pedido traiga la cookie de sesión', async () => {
    const { cookie } = await s.cookiePara('admin')
    const rutas = [
      '/',
      '/exposiciones',
      urlPublica('muestras', creadas.actual.slug),
      '/visitas',
      '/novedades',
      '/novedades?pagina=1',
      '/novedades?pagina=9',
      urlPublica('novedades', creadas.realizada.slug),
      '/contacto',
      '/contacto?enviado=1',
      '/salud',
      '/robots.txt',
      '/sitemap.xml',
      '/no-existe',
      '/favicon.svg',
      '/assets/app-abc123.js',
      '/assets/falta.js',
      '/index.html',
      '/administracion/',
      '//evil.com/',
    ]
    for (const ruta of rutas) {
      const r = await s.pedir('GET', ruta, { cookie })
      assert.ok(r.status < 500, `${ruta}: ${r.status}`)
      assert.equal(r.h['set-cookie'], undefined, ruta)
      // Nunca un Location que salga del sitio.
      if (r.h.location) assert.ok(r.h.location.startsWith('/') && !r.h.location.startsWith('//'), `${ruta}: ${r.h.location}`)
    }
    const post = await s.pedir('POST', '/', { cookie, cuerpo: {} })
    assert.equal(post.h['set-cookie'], undefined)
  })
})

describe('IndexNow (E4.6): avisa lo publicado, nunca un borrador, sin pedidos de verdad', { skip: base.motivo ?? false }, () => {
  const CLAVE = 'clave-de-prueba-indexnow-123'
  let pedidos
  let fetchOriginal
  before(() => {
    // Un fetch falso: ningún pedido sale de esta PC.
    fetchOriginal = globalThis.fetch
    pedidos = []
    globalThis.fetch = async (url, opciones) => {
      pedidos.push({ url, cuerpo: JSON.parse(opciones.body), metodo: opciones.method })
      return { ok: true, status: 202 }
    }
  })
  after(() => {
    globalThis.fetch = fetchOriginal
  })
  const espera = () => new Promise((r) => setTimeout(r, 20))

  test('con la clave: sirve /<clave>.txt y avisa al publicar, al cambiar algo publicado y al despublicar', async () => {
    const almacen = crearAlmacen(base.sequelize)
    const s = await levantar({ INDEXNOW_CLAVE: CLAVE }, { almacen })
    const original = console.log
    console.log = () => {}
    try {
      const editor = await s.cookiePara('editor')
      const api = (metodo, ruta, cuerpo) => s.pedir(metodo, `api:${ruta}`, { cookie: editor.cookie, cuerpo: cuerpo ?? {} })
      const archivo = await s.pedir('GET', `/${CLAVE}.txt`)
      assert.deepEqual([archivo.status, archivo.texto], [200, CLAVE])
      const archivos = VARIANTES_FOTO.map((variante) => ({ variante, datos: Buffer.from([1]) }))
      const portada = await almacen.guardar(
        { alt: 'Portada', decorativa: false, epigrafe: null, credito: null, subidaPor: null },
        { ancho: 800, alto: 600, variantes: [480, 960, 1600, 2400], bytes: 5, archivos },
      )
      const alta = (await api('POST', '/novedades', { titulo: 'Aviso a los buscadores' })).json.data
      const cuerpo = {
        tipo: 'noticia',
        titulo: 'Aviso a los buscadores',
        slug: null,
        resumen: 'R',
        cuerpo: parrafo('T'),
        portadaId: portada.id,
        eventoInicio: null,
        eventoFin: null,
        lugar: null,
        costo: null,
        enlaceInscripcion: null,
      }
      // Un borrador que se guarda: nada.
      assert.equal((await api('PUT', `/novedades/${alta.id}`, cuerpo)).status, 200)
      await espera()
      assert.equal(pedidos.length, 0)
      // Publicar: la página y el listado.
      assert.equal((await api('POST', `/novedades/${alta.id}/publicar`)).status, 200)
      await espera()
      assert.equal(pedidos.length, 1)
      assert.equal(pedidos[0].url, 'https://api.indexnow.org/indexnow')
      assert.equal(pedidos[0].metodo, 'POST')
      assert.deepEqual(pedidos[0].cuerpo, {
        host: 'mupa.ar',
        key: CLAVE,
        keyLocation: `https://mupa.ar/${CLAVE}.txt`,
        urlList: [`https://mupa.ar/novedades/${alta.slug}`, 'https://mupa.ar/novedades'],
      })
      // Cambiar algo publicado, despublicar: un aviso cada uno. Publicar otra vez lo ya publicado: nada.
      assert.equal((await api('PUT', `/novedades/${alta.id}`, { ...cuerpo, slug: alta.slug, resumen: 'Otro' })).status, 200)
      assert.equal((await api('POST', `/novedades/${alta.id}/despublicar`)).status, 200)
      assert.equal((await api('POST', `/novedades/${alta.id}/despublicar`)).status, 200)
      await espera()
      assert.equal(pedidos.length, 3)
      // Una sala: /exposiciones.
      const sala = (await api('POST', '/salas', { nombre: 'Sala avisada' })).json.data
      await api('PUT', `/salas/${sala.id}`, { nombre: 'Sala avisada', slug: null, resumen: 'R', descripcion: null, portadaId: portada.id })
      assert.equal((await api('POST', `/salas/${sala.id}/publicar`)).status, 200)
      await espera()
      assert.deepEqual(pedidos.at(-1).cuerpo.urlList, ['https://mupa.ar/exposiciones'])
      // Eliminar algo publicado también avisa (su dirección ya da 404).
      assert.equal((await api('DELETE', `/salas/${sala.id}`)).status, 200)
      await espera()
      assert.equal(pedidos.length, 5)
    } finally {
      console.log = original
      await s.cerrar()
    }
  })

  test('sin la clave, o fuera de mupa.ar: no avisa ni sirve el archivo', async () => {
    pedidos.length = 0
    for (const env of [{}, { INDEXNOW_CLAVE: CLAVE, URL_PUBLICA: 'https://mupa-web.onrender.com/' }]) {
      const s = await levantar(env)
      const original = console.log
      console.log = () => {}
      try {
        const editor = await s.cookiePara('editor')
        const api = (metodo, ruta, cuerpo) => s.pedir(metodo, `api:${ruta}`, { cookie: editor.cookie, cuerpo: cuerpo ?? {} })
        const archivos = VARIANTES_FOTO.map((variante) => ({ variante, datos: Buffer.from([1]) }))
        const portada = await crearAlmacen(base.sequelize).guardar(
          { alt: 'Portada', decorativa: false, epigrafe: null, credito: null, subidaPor: null },
          { ancho: 800, alto: 600, variantes: [480, 960, 1600, 2400], bytes: 5, archivos },
        )
        const sala = (await api('POST', '/salas', { nombre: 'Sala sin aviso' })).json.data
        await api('PUT', `/salas/${sala.id}`, { nombre: 'Sala sin aviso', slug: null, resumen: 'R', descripcion: null, portadaId: portada.id })
        // Publicada, cambiada y eliminada: nada sale.
        assert.equal((await api('POST', `/salas/${sala.id}/publicar`)).status, 200)
        await api('PUT', `/salas/${sala.id}`, { nombre: 'Sala sin aviso', slug: null, resumen: 'Otro', descripcion: null, portadaId: portada.id })
        assert.equal((await api('DELETE', `/salas/${sala.id}`)).status, 200)
        if (!env.INDEXNOW_CLAVE) assert.equal((await s.pedir('GET', `/${CLAVE}.txt`)).status, 404)
      } finally {
        console.log = original
        await s.cerrar()
      }
    }
    await espera()
    assert.equal(pedidos.length, 0)
  })
})

describe('sin base', () => {
  test('con la base caída: la Home sale (200) y las demás rutas, la 503 simple; el sitemap, 503', async () => {
    const config = leerConfig({
      NODE_ENV: 'production',
      URL_PUBLICA: 'https://mupa.ar/',
      // Un puerto donde no escucha nadie: cada consulta falla enseguida (ECONNREFUSED).
      DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe',
    })
    const caida = crearConexion(config)
    const ssr = crearSsr({ config, obtener, museoPublico: crearMuseoPublico(config, { sequelize: caida }), sequelize: caida })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const original = console.log
    console.log = () => {}
    try {
      const home = await pedir(puerto, 'GET', '/')
      assert.equal(home.status, 200)
      assert.equal(estadoDe(home.texto).pagina, 'home')
      for (const ruta of ['/exposiciones', '/exposiciones/una', '/visitas', '/novedades', '/novedades/una', '/contacto']) {
        const r = await pedir(puerto, 'GET', ruta)
        assert.equal(r.status, 503, ruta)
        assert.equal(r.h['cache-control'], 'no-store', ruta)
        assert.equal(r.h['retry-after'], '60', ruta)
        assert.doesNotMatch(r.texto, /<script/, ruta)
        assert.match(r.texto, /noindex/, ruta)
        assert.equal(r.h['set-cookie'], undefined, ruta)
      }
      assert.equal((await pedir(puerto, 'GET', '/sitemap.xml')).status, 503)
      // Lo que no es una ruta sigue siendo 404 (no necesita la base).
      assert.equal((await pedir(puerto, 'GET', '/no-existe')).status, 404)
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
      await caida.close()
    }
  })

  test('cada página de la tabla de rutas tiene su archivo (src/Raiz.jsx) y se dibuja con un solo h1', async () => {
    const raiz = await vite.ssrLoadModule('/src/Raiz.jsx')
    const paginas = RUTAS.map((r) => r.pagina)
    assert.deepEqual(Object.keys(raiz.ARCHIVOS_DE_PAGINAS).sort(), [...paginas].sort())
    for (const pagina of paginas) {
      const Pagina = await raiz.cargarPagina(pagina)
      assert.notEqual(Pagina, await raiz.cargarPagina('no-existe'), pagina)
      const html = await entrada.render({ pagina, ruta: '/', datos: {}, museo: {}, hoy: '2026-10-19', medir: false, userway: null })
      assert.equal(cuantas(html, '<h1'), 1, pagina)
      assert.equal(cuantas(html, 'Contenido pendiente'), 0, pagina)
    }
  })

  test('precargasDePaginas: el archivo de cada página y lo que comparte, sin lo que ya trae el principal', () => {
    const manifiesto = {
      'index.html': { file: 'assets/index-a.js', isEntry: true, imports: ['_comun-b.js'] },
      '_comun-b.js': { file: 'assets/comun-b.js' },
      '_ficha-c.js': { file: 'assets/ficha-c.js', imports: ['index.html', '_texto-d.js'] },
      '_texto-d.js': { file: 'assets/texto-d.js', imports: ['index.html'] },
      'src/paginas/Home.jsx': { file: 'assets/Home-e.js', imports: ['index.html', '_comun-b.js'] },
      'src/paginas/Novedad.jsx': { file: 'assets/Novedad-f.js', imports: ['index.html', '_ficha-c.js'] },
    }
    assert.deepEqual(
      precargasDePaginas(manifiesto, {
        home: 'src/paginas/Home.jsx',
        novedad: 'src/paginas/Novedad.jsx',
        falta: 'src/paginas/Falta.jsx',
      }),
      {
        home: ['/assets/Home-e.js'],
        novedad: ['/assets/Novedad-f.js', '/assets/ficha-c.js', '/assets/texto-d.js'],
        falta: [],
      },
    )
  })

  test('seo: la descripción se corta en una palabra (hasta 160), las medidas del og.jpg y el horario por franja', () => {
    assert.equal(cortarEnPalabra('Corto.'), 'Corto.')
    const largo = `${'palabra '.repeat(30)}final`
    const cortado = cortarEnPalabra(largo)
    assert.ok(cortado.length <= 160)
    assert.match(cortado, /palabra…$/)
    assert.equal(cortarEnPalabra('x'.repeat(200)).length, 160)
    assert.deepEqual(medidasOg(3000, 2000), { ancho: 1200, alto: 800 })
    assert.deepEqual(medidasOg(800, 1200), { ancho: 800, alto: 1200 })
    assert.deepEqual(medidasOg(1200, 40000), { ancho: 491, alto: 16383 })
    assert.deepEqual(
      horarioSchema([
        { dia: 1, abierto: false, franjas: [] },
        { dia: 2, abierto: true, franjas: [{ abre: '17:00', cierra: '21:00' }, { abre: '09:00', cierra: '13:00' }] },
        { dia: 3, abierto: true, franjas: [{ abre: '09:00', cierra: '13:00' }] },
      ]).map((h) => [h.dayOfWeek.map((d) => d.replace('https://schema.org/', '')), h.opens, h.closes]),
      [
        [['Tuesday', 'Wednesday'], '09:00', '13:00'],
        [['Tuesday'], '17:00', '21:00'],
      ],
    )
    assert.deepEqual(horarioSchema([{ dia: 1, abierto: false, franjas: [] }]), [])
  })
})
