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
// - Sin base (sin la base de prueba también corre): con la base caída la Home sale (200, con el año del © del pie en el
//   estado, que pone el servidor) y las demás, la 503 simple; el cálculo de las precargas (modulepreload) a partir del
//   manifiesto; cada página de la tabla tiene su archivo.
// - La Home del tablero "Web" (02/11/2026): con base, las 6 últimas novedades publicadas en orden (sin borradores ni
//   actividades realizadas) y una sin portada sin foto; sin base, con 0, 1 y 6 novedades de un lector falso, y con la
//   base caída o colgada sale igual (200, sin el carrusel; colgada, a los TOPE_HOME_MS), nunca la 503. Con una falla
//   sin código ("timeout expired"), el aviso del log lleva el mensaje (PAN-05). El lastmod de la Home en el sitemap es
//   el más nuevo entre el build y la última novedad publicada, y publicar una novedad le avisa a IndexNow también la
//   Home (COD-03/PAN-04).
// - Visitas del tablero "Web" (03/11/2026, V1 y V8): con base, las tarjetas con los datos cargados por la API y el texto
//   "Accesibilidad", sin nada de lo que ya no muestra aunque esté cargado, y la descripción nueva; sin base, cargarVisitas
//   (solo el texto de accesibilidad, y la 503 sin el museo de ahora) y la página con el museo máximo y el vacío (la foto
//   del hero precargada con prioridad).
// - Exposiciones, Novedades y sus fichas con el lenguaje del tablero (04/11/2026, R1 a R3): en las listas la foto del
//   hero es la única precargada con prioridad (las de las tarjetas, lazy y sin precargar, también en la página 2 de
//   Novedades); las fichas, sin hero y con la portada como única foto precargada.
// - El ajuste del LCP (05/11/2026): las fotos lazy, con prioridad baja; el orden del <head> (la precarga de la foto con
//   prioridad primero, fuera de lo dibujado; el JS y el CSS de Vite; los modulepreload al final) con una plantilla como
//   la del build, y separarPrecargasConPrioridad sola.
// - Contacto y la 404 con el lenguaje del tablero (05/11/2026, R1 y R2): /contacto con un museo falso, con la foto del
//   hero precargada con prioridad en el <head>, los datos y el mapa; el vacío, solo el hero; sin el museo de ahora, la
//   503 simple. La 404 sigue sin foto (el <head> arranca con el título).
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
import { crearLectorPublico, LECTOR_VACIO, TOPE_HOME_MS } from '../contenido-publico.js'
import { crearConexion } from '../db/conexion.js'
import { crearAlmacen } from '../fotos/almacen.js'
import { crearMuseoPublico, MUSEO_MAXIMO, MUSEO_VACIO } from '../museo.js'
import { cargarVisitas, horarioDeLaSemana } from '../paginas.js'
import { RUTAS } from '../rutas-publicas.js'
import { CSP_PANEL } from '../seguridad.js'
import { cortarEnPalabra, entradasDelSitemap, horarioSchema, medidasOg } from '../seo.js'
import { crearSsr, partir, precargasDePaginas, separarPrecargasConPrioridad } from '../ssr.js'
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
          accesibilidad: parrafo('Hay rampa en la entrada.'),
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
    // Las fotos de las tarjetas, con su srcset y sus medidas, todas lazy: desde el rediseño con el lenguaje del tablero
    // (04/11/2026, R1) la del primer pantallazo, la del LCP, es la del hero (antes, la de la primera tarjeta: PAG-02 de
    // la verificación de E4). React la precarga con prioridad, al principio de lo dibujado (antes del header).
    assert.match(r.texto, /<img src="\/fotos\/[0-9a-f]{16}\/960\.webp" srcSet="\/fotos\/[0-9a-f]{16}\/480\.webp 480w, [^"]*1600\.webp 1600w" sizes="[^"]+" width="3000" height="2000" alt="Portada de Muestra actual" loading="lazy"/)
    const fotos = r.texto.match(/<img src="\/fotos\/[^>]*>/g) ?? []
    assert.ok(fotos.length >= 4, `${fotos.length}`)
    // Y con prioridad baja (ajuste del LCP, 05/11/2026): no le disputan el ancho de banda a la foto del hero.
    assert.ok(fotos.every((img) => img.includes('loading="lazy" fetchPriority="low"')))
    const hero = /<img [^>]*hero-exposiciones-[^>]*>/.exec(r.texto)?.[0]
    assert.ok(hero, 'la foto del hero')
    assert.match(hero, /fetchPriority="high"/)
    const precargas = r.texto.match(/<link rel="preload" as="image"[^>]*>/g) ?? []
    const delHero = precargas.filter((l) => l.includes('hero-exposiciones-'))
    assert.equal(delHero.length, 1, precargas.join('\n'))
    assert.match(delHero[0], /fetchpriority="high"/i)
    assert.ok(r.texto.indexOf(delHero[0]) < r.texto.indexOf('<header'))
    // Desde el ajuste del LCP (05/11/2026), en el <head>, antes del título (server/ssr.js, separarPrecargasConPrioridad).
    assert.ok(r.texto.indexOf(delHero[0]) < r.texto.indexOf('<title>'))
    // Ninguna foto del panel se precarga (todas lazy).
    assert.equal(precargas.filter((l) => l.includes('/fotos/')).length, 0)
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
    // Sin hero (rediseño del 04/11/2026, R2): el título arriba, sin foto detrás; la única foto precargada es la portada.
    assert.equal(cuantas(actual.texto, 'hero-'), 0)
    const precargas = actual.texto.match(/<link rel="preload" as="image"[^>]*>/g) ?? []
    assert.deepEqual(precargas.filter((l) => l.includes('/fotos/')).length, 1)
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

  test('/visitas (tablero "Web", V1): las tarjetas con los datos cargados y el texto de accesibilidad; nada de lo que ya no muestra', async () => {
    const r = await s.pedir('GET', '/visitas')
    assert.equal(r.status, 200)
    const { datos, museo, pagina } = estadoDe(r.texto)
    assert.equal(pagina, 'visitas')
    // Los datos de la página: solo el texto "Accesibilidad" (V1: ni el horario de la semana, ni las tarifas, ni las
    // notas, ni el aviso, ni la compra, ni "Cómo llegar", ni las normas). Lo demás de las tarjetas viene en estado.museo.
    assert.deepEqual(datos, { accesibilidad: parrafo('Hay rampa en la entrada.') })
    assert.ok(!('comoLlegar' in museo) && !('accesibilidad' in museo))
    // El museo común tampoco lleva lo que el sitio ya no muestra (COD-01 y PAN-01): ni las tarifas, ni sus notas, ni
    // la nota de cada día; el HTML entero (también el estado), ninguno de esos textos.
    for (const campo of ['tarifas', 'notaTarifas', 'notaHorarios', 'aviso']) assert.ok(!(campo in museo), campo)
    assert.ok(museo.horarios.every((h) => !('nota' in h)))
    for (const fuera of ['Visitas guiadas', 'Nota de las tarifas', '"General"', '"Menores"', 'Así se llega.']) {
      assert.equal(cuantas(r.texto, fuera), 0, fuera)
    }
    // Lo dibujado (sin el estado).
    const app = r.texto.slice(r.texto.indexOf('<div id="root">'), r.texto.indexOf('<script id="estado"'))
    assert.equal(cuantas(app, '<h1'), 1)
    assert.ok(app.includes('>Visitá el MuPa</h1>'))
    assert.ok(app.includes('<span class="block">Avenida de prueba 1234</span><span class="block">5400 San Juan, San Juan</span>'))
    assert.ok(app.includes('<li>Martes a domingo: 9:00\u00a0a\u00a013:00</li><li>Lunes: cerrado</li>'))
    assert.match(app, /<a href="tel:\+542640000000" class="inline-flex min-h-11 /)
    assert.match(app, /<a href="mailto:museo@example\.com" class="inline-flex min-h-11 /)
    assert.match(app, /<a href="\/contacto" class="inline-flex min-h-11 /)
    assert.ok(app.includes('<p>Hay rampa en la entrada.</p>'))
    // Sin "Insertar mapa" cargado, sin el mapa.
    assert.equal(cuantas(app, '<iframe'), 0)
    for (const fuera of ['Visitas guiadas', 'Nota de las tarifas', 'Gratis', '$ 3.000', '>General<', 'Así se llega.', 'aria-current="date"', 'data-entradas="" class="inline-block']) {
      assert.equal(cuantas(app, fuera), 0, fuera)
    }
    assert.ok(!r.texto.includes('Tarifa escondida'))
    // La descripción nueva (V8): sin las tarifas.
    assert.equal(
      meta(r.texto, 'description'),
      'Cómo llegar, horarios, contacto y recursos de accesibilidad para visitar el Museo Paleontológico de San Juan.',
    )
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
    // El hero de la página (rediseño del 04/11/2026, R1), en las dos: su foto, la del LCP, precargada con prioridad; las
    // de las tarjetas, lazy y sin precargar.
    for (const html of [r.texto, dos.texto]) {
      assert.equal(cuantas(html, '<h1 id="novedades-titulo"'), 1)
      const precargas = html.match(/<link rel="preload" as="image"[^>]*>/g) ?? []
      assert.equal(precargas.filter((l) => l.includes('hero-novedades-') && /fetchpriority="high"/i.test(l)).length, 1, precargas.join('\n'))
      assert.equal(precargas.filter((l) => l.includes('/fotos/')).length, 0)
      assert.ok((html.match(/<img src="\/fotos\/[^>]*>/g) ?? []).every((img) => img.includes('loading="lazy" fetchPriority="low"')))
      // La del hero, en el <head> (ajuste del LCP, 05/11/2026).
      assert.ok(html.indexOf('hero-novedades-') < html.indexOf('</head>'))
    }

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

  test('la Home (tablero "Web"): las 6 últimas novedades publicadas, noticias y actividades, sin borradores ni realizadas, en orden', async () => {
    const r = await s.pedir('GET', '/')
    assert.equal(r.status, 200)
    const { datos } = estadoDe(r.texto)
    // La actividad que viene se publicó después que las noticias (y la realizada, después, pero no se lista: plan 6.1);
    // después, las noticias de la más nueva a la más vieja. Hay 16 publicadas: van 6.
    const esperadas = [creadas.proximaActividad, ...creadas.noticias.slice(-5).reverse()]
    assert.deepEqual(datos.novedades.map((n) => n.titulo), esperadas.map((n) => n.titulo))
    assert.deepEqual(datos.novedades.map((n) => n.url), esperadas.map((n) => urlPublica('novedades', n.slug)))
    assert.deepEqual(Object.keys(datos.novedades[0]).sort(), ['portada', 'resumen', 'titulo', 'url'])
    for (const fuera of [creadas.novedadBorrador, creadas.realizada, creadas.noticias[0], creadas.noticias[8]]) {
      assert.ok(!r.texto.includes(urlPublica('novedades', fuera.slug)), fuera.titulo)
    }
    // El carrusel en el HTML: el título de cada tarjeta es su enlace, con su portada (las fotos del panel) y su resumen.
    assert.match(r.texto, /<section aria-labelledby="novedades-titulo"/)
    for (const n of esperadas) {
      assert.ok(r.texto.includes(`<a href="${urlPublica('novedades', n.slug)}" class="`), n.titulo)
      assert.ok(r.texto.includes(`/fotos/${n.portada.clave}/480.webp 480w`), n.titulo)
      assert.ok(r.texto.includes(`>Resumen de ${n.titulo}</p>`), n.titulo)
    }
    assert.ok(r.texto.includes('href="/novedades"'))
    assert.equal(cuantas(r.texto, '<h1'), 1)
    // Una publicada sin portada (el panel no deja publicar sin ella; acá se la quita a mano): su tarjeta va sin foto.
    const sinFoto = creadas.noticias[12]
    await sql('UPDATE novedades SET portada_id = NULL WHERE id = :id', { id: sinFoto.id })
    try {
      const otra = await s.pedir('GET', '/')
      const tarjeta = estadoDe(otra.texto).datos.novedades.find((n) => n.titulo === sinFoto.titulo)
      assert.equal(tarjeta.portada, null)
      const html = otra.texto.split('<article').find((a) => a.includes(`>${sinFoto.titulo}</a>`))
      assert.ok(html, 'la tarjeta sin portada')
      assert.equal(cuantas(html.slice(0, html.indexOf('</article>')), '<img'), 0)
    } finally {
      await sql('UPDATE novedades SET portada_id = :foto WHERE id = :id', { id: sinFoto.id, foto: sinFoto.portada.id })
    }
  })

  test('un borrador que se publica se ve en el pedido siguiente; despublicado, otra vez 404', async () => {
    const n = creadas.novedadBorrador
    const ruta = urlPublica('novedades', n.slug)
    assert.equal((await s.pedir('GET', ruta)).status, 404)
    assert.ok(!(await s.pedir('GET', '/')).texto.includes(ruta), 'en borrador no está en la Home')
    await ok(api('POST', `/novedades/${n.id}/publicar`))
    assert.equal((await s.pedir('GET', ruta)).status, 200)
    assert.ok((await s.pedir('GET', '/novedades')).texto.includes(ruta))
    assert.ok((await s.pedir('GET', '/sitemap.xml')).texto.includes(`https://mupa.ar${ruta}`))
    // Recién publicada, es la primera del carrusel de la Home.
    assert.equal(estadoDe((await s.pedir('GET', '/')).texto).datos.novedades[0].url, ruta)
    await ok(api('POST', `/novedades/${n.id}/despublicar`))
    assert.equal((await s.pedir('GET', ruta)).status, 404)
    assert.ok(!(await s.pedir('GET', '/novedades')).texto.includes(ruta))
    assert.ok(!(await s.pedir('GET', '/sitemap.xml')).texto.includes(ruta))
    assert.ok(!(await s.pedir('GET', '/')).texto.includes(ruta), 'despublicada no está en la Home')
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
        // Lo que el sitio ya no muestra ni el panel deja cambiar (la Visitas del tablero, V1 y V2): ni en lo dibujado ni
        // en el estado (COD-01 y PAN-01 de la verificación de Visitas).
        'Nota de las tarifas',
        'Visitas guiadas',
        '"General"',
        '"tarifas"',
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

  test('con la clave, después del corte: sirve /<clave>.txt y avisa al publicar, al cambiar algo publicado y al despublicar', async () => {
    const almacen = crearAlmacen(base.sequelize)
    const s = await levantar({ INDEXNOW_CLAVE: CLAVE, CANONICO: '1' }, { almacen })
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
      // Publicar: la página, el listado y la Home, que muestra las últimas novedades (tablero "Web", PAN-04).
      assert.equal((await api('POST', `/novedades/${alta.id}/publicar`)).status, 200)
      await espera()
      assert.equal(pedidos.length, 1)
      assert.equal(pedidos[0].url, 'https://api.indexnow.org/indexnow')
      assert.equal(pedidos[0].metodo, 'POST')
      assert.deepEqual(pedidos[0].cuerpo, {
        host: 'mupa.ar',
        key: CLAVE,
        keyLocation: `https://mupa.ar/${CLAVE}.txt`,
        urlList: [`https://mupa.ar/novedades/${alta.slug}`, 'https://mupa.ar/novedades', 'https://mupa.ar/'],
      })
      // Cambiar algo publicado, despublicar: un aviso cada uno, también con la Home. Publicar otra vez lo ya publicado: nada.
      assert.equal((await api('PUT', `/novedades/${alta.id}`, { ...cuerpo, slug: alta.slug, resumen: 'Otro' })).status, 200)
      assert.equal((await api('POST', `/novedades/${alta.id}/despublicar`)).status, 200)
      assert.equal((await api('POST', `/novedades/${alta.id}/despublicar`)).status, 200)
      await espera()
      assert.equal(pedidos.length, 3)
      for (const p of pedidos) assert.ok(p.cuerpo.urlList.includes('https://mupa.ar/'), JSON.stringify(p.cuerpo.urlList))
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

  test('sin la clave, fuera de mupa.ar o antes del corte (E5-01): no avisa', async () => {
    pedidos.length = 0
    // Antes del corte (CANONICO=0), mupa.ar sigue siendo la landing de Hostinger: como en Render desde el primer deploy.
    for (const env of [
      {},
      { INDEXNOW_CLAVE: CLAVE, URL_PUBLICA: 'https://mupa-web.onrender.com/', CANONICO: '1' },
      { INDEXNOW_CLAVE: CLAVE, CANONICO: '0' },
    ]) {
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
      const estado = estadoDe(home.texto)
      assert.equal(estado.pagina, 'home')
      // Sin las novedades (la base no respondió): la Home sale igual, sin el carrusel (tablero "Web", D12).
      assert.deepEqual(estado.datos, { novedades: [] })
      assert.equal(cuantas(home.texto, 'novedades-titulo'), 0)
      assert.equal(cuantas(home.texto, '<h1'), 1)
      assert.match(home.texto, /aria-labelledby="mapa-titulo"/)
      // El año del © del pie lo pone el servidor en el estado: el de hoy en San Juan (tablero "Web", 02/11/2026).
      assert.equal(estado.anio, Number(estado.hoy.slice(0, 4)))
      assert.ok([hoyEnSanJuan(new Date(Date.now() - 60_000)), hoyEnSanJuan()].includes(estado.hoy))
      assert.ok(home.texto.includes(`>© ${estado.anio} MUPA - Museo Paleontológico de San Juan</p>`))
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

  test('la Home con 0, 1 y 6 novedades (un lector falso): el carrusel solo con novedades, en su orden; una sin portada, sin foto', async () => {
    // La dirección de la base no se usa (el lector y el museo son los de la prueba): producción la exige.
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    const foto = (n) => ({ clave: String(n).repeat(16), ancho: 1600, alto: 1067, variantes: [480, 960, 1600], alt: `Portada ${n}`, decorativa: false })
    let publicadas = []
    let pedidos = []
    const lector = {
      ...LECTOR_VACIO,
      async ultimasNovedades(opciones) {
        pedidos.push(opciones)
        return publicadas
      },
    }
    const ssr = crearSsr({ config, obtener, museoPublico: async () => MUSEO_VACIO, lector })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    try {
      // Ninguna: sin la sección.
      let r = await pedir(puerto, 'GET', '/')
      assert.equal(r.status, 200)
      assert.deepEqual(estadoDe(r.texto).datos, { novedades: [] })
      assert.equal(cuantas(r.texto, 'novedades-titulo'), 0)
      assert.equal(pedidos.length, 1)
      assert.ok(pedidos[0].ahora instanceof Date)
      // Una: la sección con su tarjeta, sin las flechas ni el contador.
      publicadas = [{ titulo: 'Una sola', slug: 'una-sola', resumen: 'Su resumen', portada: foto(1) }]
      r = await pedir(puerto, 'GET', '/')
      assert.deepEqual(estadoDe(r.texto).datos.novedades, [{ titulo: 'Una sola', url: '/novedades/una-sola', resumen: 'Su resumen', portada: foto(1) }])
      assert.match(r.texto, /<section aria-labelledby="novedades-titulo"/)
      assert.ok(r.texto.includes('<a href="/novedades/una-sola" class="'))
      const seccion = r.texto.slice(r.texto.indexOf('<section aria-labelledby="novedades-titulo"'))
      assert.equal(cuantas(seccion.slice(0, seccion.indexOf('</section>')), '<button'), 0)
      // Seis, en el orden del lector; la tercera sin portada (sin foto), las demás con la suya.
      publicadas = [1, 2, 3, 4, 5, 6].map((n) => ({
        titulo: `Novedad ${n}`,
        slug: `novedad-${n}`,
        resumen: n === 4 ? null : `Resumen ${n}`,
        portada: n === 3 ? null : foto(n),
      }))
      r = await pedir(puerto, 'GET', '/')
      const { novedades } = estadoDe(r.texto).datos
      assert.deepEqual(novedades.map((n) => n.url), [1, 2, 3, 4, 5, 6].map((n) => `/novedades/novedad-${n}`))
      const articulos = r.texto.split('<article').slice(1).map((a) => a.slice(0, a.indexOf('</article>')))
      assert.equal(articulos.length, 6)
      assert.deepEqual(articulos.map((a) => cuantas(a, '<img')), [1, 1, 0, 1, 1, 1])
      // Sin resumen, sin su párrafo (y nunca "null").
      assert.equal(cuantas(articulos[3], 'Resumen'), 0)
      assert.equal(cuantas(r.texto, '>null<'), 0)
      // El contador, como lo dibuja el servidor (el navegador hidrata con lo mismo).
      assert.match(r.texto, /<p aria-hidden="true" class="[^"]*">1<!-- -->\/<!-- -->6<\/p>/)
      assert.equal(cuantas(r.texto, '<h1'), 1)
    } finally {
      await new Promise((r) => servidor.close(r))
    }
  })

  test('la Home con la base colgada (no contesta): 200 a los ~2 s (TOPE_HOME_MS), sin novedades; nunca la 503', async () => {
    // La dirección de la base no se usa (el lector y el museo son los de la prueba): producción la exige.
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    // Una base que nunca contesta: cada consulta queda esperando. El lector de verdad corta a los TOPE_HOME_MS y el museo
    // (el de verdad, con su tope) sale con el vacío.
    const colgada = { query: () => new Promise(() => {}) }
    const ssr = crearSsr({
      config,
      obtener,
      museoPublico: crearMuseoPublico(config, { leer: () => new Promise(() => {}) }),
      lector: crearLectorPublico(colgada),
    })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const logs = []
    const original = console.log
    console.log = (linea) => logs.push(linea)
    try {
      const desde = performance.now()
      const r = await pedir(puerto, 'GET', '/')
      const ms = performance.now() - desde
      assert.equal(r.status, 200)
      assert.ok(ms >= TOPE_HOME_MS - 50 && ms < TOPE_HOME_MS + 1500, `${Math.round(ms)} ms`)
      assert.deepEqual(estadoDe(r.texto).datos, { novedades: [] })
      assert.equal(cuantas(r.texto, 'novedades-titulo'), 0)
      assert.ok(logs.some((l) => /"evento":"home_sin_novedades"/.test(l) && /"codigo":"TOPE"/.test(l)), logs.join('\n'))
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
    }
  })

  test('la Home con una falla de la base sin código ("timeout expired"): sale sin novedades y el aviso lleva el mensaje (PAN-05)', async () => {
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    // Como pg al conectar con la base muda: un Error sin code.
    const muda = { query: () => Promise.reject(new Error('timeout expired')) }
    const ssr = crearSsr({ config, obtener, museoPublico: async () => MUSEO_VACIO, lector: crearLectorPublico(muda) })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const logs = []
    const original = console.log
    console.log = (linea) => logs.push(linea)
    try {
      const r = await pedir(puerto, 'GET', '/')
      assert.equal(r.status, 200)
      assert.deepEqual(estadoDe(r.texto).datos, { novedades: [] })
      const linea = logs.map((l) => JSON.parse(l)).find((l) => l.evento === 'home_sin_novedades')
      assert.ok(linea, logs.join('\n'))
      assert.equal(linea.nivel, 'aviso')
      assert.equal(linea.mensaje, 'timeout expired')
      assert.equal(linea.codigo, undefined)
      // Las páginas internas con la misma falla: la 503 simple, y el aviso también con el mensaje.
      logs.length = 0
      assert.equal((await pedir(puerto, 'GET', '/novedades')).status, 503)
      const pagina = logs.map((l) => JSON.parse(l)).find((l) => l.evento === 'pagina_sin_base')
      assert.equal(pagina?.mensaje, 'timeout expired')
      assert.equal(pagina?.pagina, 'novedades')
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
    }
  })

  test('cargarVisitas (V1): solo el texto de accesibilidad del museo de ahora; con el último bueno, BASE_NO_DISPONIBLE', async () => {
    const museo = (estado) => async () => estado
    assert.deepEqual(await cargarVisitas({ museo: museo({ museo: MUSEO_MAXIMO, alDia: true }) }), {
      accesibilidad: MUSEO_MAXIMO.accesibilidad,
    })
    assert.deepEqual(await cargarVisitas({ museo: museo({ museo: MUSEO_VACIO, alDia: true }) }), { accesibilidad: null })
    await assert.rejects(cargarVisitas({ museo: museo({ museo: MUSEO_MAXIMO, alDia: false }) }), { code: 'BASE_NO_DISPONIBLE' })
  })

  test('horarioDeLaSemana (sin uso desde la Visitas del tablero, se decide al cierre): "Hoy" con la fecha de San Juan', () => {
    const filas = horarioDeLaSemana(MUSEO_MAXIMO.horarios, '2026-11-03')
    assert.equal(filas.length, 7)
    assert.deepEqual(filas[0], { dia: 'Lunes', hoy: false, horas: null, nota: null })
    assert.deepEqual(filas[1], { dia: 'Hoy (martes)', hoy: true, horas: '9:00 a 13:00 y 17:00 a 21:00', nota: null })
    assert.equal(filas[6].nota, 'EJEMPLO · Visitas guiadas a las 11')
    assert.deepEqual(horarioDeLaSemana(MUSEO_MAXIMO.horarios.map((d) => ({ ...d, abierto: false })), '2026-11-03'), [])
  })

  test('/visitas con un museo falso: el máximo (con el mapa) y el vacío (sin "Información práctica"); sin el de ahora, la 503 simple', async () => {
    // La dirección de la base no se usa (el museo es el de la prueba): producción la exige.
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    let ahora = { museo: MUSEO_MAXIMO, alDia: true }
    const museoPublico = Object.assign(async () => ahora.museo, { conEstado: async () => ahora })
    const ssr = crearSsr({ config, obtener, museoPublico, lector: LECTOR_VACIO })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const dibujado = (html) => html.slice(html.indexOf('<div id="root">'), html.indexOf('<script id="estado"'))
    const original = console.log
    console.log = () => {}
    try {
      let r = await pedir(puerto, 'GET', '/visitas')
      assert.equal(r.status, 200)
      assert.deepEqual(estadoDe(r.texto).datos, { accesibilidad: MUSEO_MAXIMO.accesibilidad })
      let app = dibujado(r.texto)
      assert.equal(cuantas(app, '<h1'), 1)
      assert.match(app, /<section aria-labelledby="visitas-practica"/)
      assert.match(app, /<iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=EJEMPLO" title="[^"]+" loading="lazy"/)
      assert.equal(cuantas(app, MUSEO_MAXIMO.aviso.texto), 0)
      assert.equal(cuantas(app, MUSEO_MAXIMO.notaTarifas), 0)
      // React precarga la foto del hero (el LCP), con prioridad: al principio de lo dibujado, antes del header (con los
      // logos del header, que tampoco son lazy). La de "Museo accesible" (lazy), no.
      const precargas = r.texto.match(/<link rel="preload" as="image"[^>]*>/g) ?? []
      const delHero = precargas.filter((l) => l.includes('hero-visitas-'))
      assert.equal(delHero.length, 1, precargas.join('\n'))
      assert.match(delHero[0], /fetchpriority="high"/i)
      assert.ok(r.texto.indexOf(delHero[0]) < r.texto.indexOf('<header'))
      assert.equal(precargas.filter((l) => l.includes('visitas-accesibilidad')).length, 0)
      // El vacío: sin la sección (ni su rótulo) y con los párrafos del tablero.
      ahora = { museo: MUSEO_VACIO, alDia: true }
      r = await pedir(puerto, 'GET', '/visitas')
      assert.equal(r.status, 200)
      assert.deepEqual(estadoDe(r.texto).datos, { accesibilidad: null })
      app = dibujado(r.texto)
      assert.equal(cuantas(app, 'visitas-practica'), 0)
      assert.match(app, /<section aria-labelledby="visitas-accesible"/)
      assert.match(app, /El MuPa cuenta con recursos de accesibilidad autónoma/)
      // Sin el museo de ahora (la base no respondió: el último bueno), la 503 simple, como antes del tablero.
      ahora = { museo: MUSEO_MAXIMO, alDia: false }
      r = await pedir(puerto, 'GET', '/visitas')
      assert.equal(r.status, 503)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.doesNotMatch(r.texto, /<script/)
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
    }
  })

  test('/contacto con un museo falso (R1): la foto del hero precargada con prioridad en el <head>; los datos y el mapa; el vacío, solo el hero; sin el de ahora, la 503', async () => {
    // Sin casilla de envío (la configuración de la prueba no tiene SMTP_USUARIO): sin formulario, como en producción
    // antes de cargar la casilla. El formulario y sus estados están en contacto.test.js y en layout.test.js.
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    let ahora = { museo: MUSEO_MAXIMO, alDia: true }
    const museoPublico = Object.assign(async () => ahora.museo, { conEstado: async () => ahora })
    const ssr = crearSsr({ config, obtener, museoPublico, lector: LECTOR_VACIO })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const puerto = servidor.address().port
    const dibujado = (html) => html.slice(html.indexOf('<div id="root">'), html.indexOf('<script id="estado"'))
    const original = console.log
    console.log = () => {}
    try {
      let r = await pedir(puerto, 'GET', '/contacto')
      assert.equal(r.status, 200)
      assert.equal(estadoDe(r.texto).datos.formulario, false)
      let app = dibujado(r.texto)
      assert.equal(cuantas(app, '<h1'), 1)
      assert.match(app, /<h1 id="contacto-titulo" class="[^"]*">Contacto<\/h1>/)
      assert.match(app, /<section aria-labelledby="datos-contacto"/)
      assert.match(app, /<iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=EJEMPLO" title="[^"]+" loading="lazy"/)
      assert.equal(cuantas(app, '<form'), 0)
      // La foto del hero (el LCP), con prioridad: una sola precarga, en el <head> antes del título (server/ssr.js).
      const precargas = r.texto.match(/<link rel="preload" as="image"[^>]*>/g) ?? []
      const delHero = precargas.filter((l) => l.includes('hero-contacto-'))
      assert.equal(delHero.length, 1, precargas.join('\n'))
      assert.match(delHero[0], /fetchpriority="high"/i)
      assert.ok(r.texto.indexOf(delHero[0]) < r.texto.indexOf('<title>'))
      assert.match(app, /<img src="[^"]*hero-contacto-1440[^"]*" srcSet="[^"]*" sizes="[^"]*" width="2880" height="960" alt="[^"]+" fetchPriority="high"/)
      // El vacío: solo el hero (sin los datos ni sus rótulos; sin casilla, sin formulario).
      ahora = { museo: MUSEO_VACIO, alDia: true }
      r = await pedir(puerto, 'GET', '/contacto')
      assert.equal(r.status, 200)
      app = dibujado(r.texto)
      assert.equal(cuantas(app, 'datos-contacto'), 0)
      assert.equal(cuantas(app, '<h2'), 0)
      assert.match(app, /<section aria-labelledby="contacto-titulo" class="relative"><div [^>]*><img src="[^"]*hero-contacto-1440/)
      // Sin el museo de ahora (la base no respondió: el último bueno), la 503 simple, como antes del rediseño.
      ahora = { museo: MUSEO_MAXIMO, alDia: false }
      r = await pedir(puerto, 'GET', '/contacto')
      assert.equal(r.status, 503)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.doesNotMatch(r.texto, /<script/)
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
    }
  })

  test('sitemap: la Home lleva la fecha más nueva entre el build y la última novedad publicada (COD-03/PAN-04)', () => {
    const urlPublica = 'https://mupa.ar/'
    const fijas = ['/', '/exposiciones', '/novedades', '/visitas']
    const lastmod = (contenidos, fechaHome) =>
      Object.fromEntries(entradasDelSitemap({ urlPublica, fijas, contenidos, fechaHome }).map((e) => [e.loc, e.lastmod]))
    const build = new Date('2026-10-30T15:00:00Z')
    // Sin novedades: la del build.
    assert.equal(lastmod([], build)['https://mupa.ar/'], '2026-10-30')
    // Una novedad cambiada después del build: la suya (el día en San Juan: 02:30 UTC del 3 es el 2 allá).
    const novedad = { tipo: 'novedades', slug: 'una', actualizadoEn: new Date('2026-11-03T02:30:00Z') }
    const muestra = { tipo: 'muestras', slug: 'otra', actualizadoEn: new Date('2026-11-05T15:00:00Z') }
    const conNovedad = lastmod([novedad, muestra], build)
    assert.equal(conNovedad['https://mupa.ar/'], '2026-11-02')
    assert.equal(conNovedad['https://mupa.ar/novedades'], '2026-11-02')
    // Una muestra no cambia la Home (la Home no muestra muestras).
    assert.equal(conNovedad['https://mupa.ar/exposiciones'], '2026-11-05')
    // Un build más nuevo que la novedad: la del build.
    assert.equal(lastmod([novedad], new Date('2026-11-10T15:00:00Z'))['https://mupa.ar/'], '2026-11-10')
    // Sin fecha del build válida y sin novedades: sin lastmod.
    assert.equal(lastmod([], new Date('x'))['https://mupa.ar/'], undefined)
    assert.equal(lastmod([novedad], undefined)['https://mupa.ar/'], '2026-11-02')
  })

  test('separarPrecargasConPrioridad: aparta las precargas de imagen con fetchPriority="high" del principio de lo dibujado', () => {
    const alta = '<link rel="preload" as="image" imageSrcSet="/a-960.webp 960w, /a-1440.webp 1440w" imageSizes="(min-width: 64rem) max(100vw, 1440px)" fetchPriority="high"/>'
    const comun = '<link rel="preload" as="image" href="/logo.svg"/>'
    // La de la foto con prioridad sale aparte; la otra (un logo del header) queda donde estaba, en su orden.
    assert.deepEqual(separarPrecargasConPrioridad(`${comun}${alta}<header>x</header>`), [alta, `${comun}<header>x</header>`])
    // Un ">" de un valor llega escapado (&gt;): no corta la etiqueta.
    const conMayor = '<link rel="preload" as="image" imageSizes="(min-width: 64rem) 1440px" title="a &gt; b" fetchPriority="high"/>'
    assert.deepEqual(separarPrecargasConPrioridad(`${conMayor}<main/>`), [conMayor, '<main/>'])
    // Solo lo del principio: una etiqueta igual más adelante (dentro de la página) no se toca.
    assert.deepEqual(separarPrecargasConPrioridad(`<header>${alta}</header>`), ['', `<header>${alta}</header>`])
    // Sin precargas, o con una sin terminar, todo queda igual.
    assert.deepEqual(separarPrecargasConPrioridad('<header>x</header>'), ['', '<header>x</header>'])
    assert.deepEqual(separarPrecargasConPrioridad('<link rel="preload" as="image"'), ['', '<link rel="preload" as="image"'])
  })

  test('el orden del <head> (ajuste del LCP, 05/11/2026): la foto del hero primero; el JS y el CSS de Vite; los modulepreload al final', async () => {
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_existe' })
    // La plantilla como la deja el build de Vite: el JS principal y el CSS al final del <head>.
    const plantilla =
      '<!doctype html><html lang="es"><head><meta charset="UTF-8" /><!--head-->\n' +
      '    <script type="module" crossorigin src="/assets/index-a.js"></script>\n' +
      '    <link rel="stylesheet" crossorigin href="/assets/index-b.css">\n  </head>' +
      '<body><div id="root"><!--app--></div><!--estado--></body></html>\n'
    const precargas = { visitas: ['/assets/Visitas-c.js', '/assets/HeroPagina-d.js'] }
    const conVite = async () => ({ partes: partir(plantilla), render: entrada.render, precargas })
    const museoPublico = Object.assign(async () => MUSEO_MAXIMO, { conEstado: async () => ({ museo: MUSEO_MAXIMO, alDia: true }) })
    const ssr = crearSsr({ config, obtener: conVite, museoPublico, lector: LECTOR_VACIO })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const original = console.log
    console.log = () => {}
    try {
      const r = await pedir(servidor.address().port, 'GET', '/visitas')
      assert.equal(r.status, 200)
      const head = r.texto.slice(0, r.texto.indexOf('</head>'))
      const raiz = r.texto.slice(r.texto.indexOf('<div id="root">'), r.texto.indexOf('<script id="estado"'))
      // La foto del hero (el LCP), una sola vez y en el <head>, antes de todo lo demás que pide la página.
      const precargasFoto = r.texto.match(/<link rel="preload" as="image"[^>]*fetchPriority="high"[^>]*>/gi) ?? []
      assert.equal(precargasFoto.length, 1, precargasFoto.join('\n'))
      assert.match(precargasFoto[0], /hero-visitas-/)
      const enHead = (texto) => head.indexOf(texto)
      assert.ok(enHead(precargasFoto[0]) > 0)
      assert.ok(enHead(precargasFoto[0]) < enHead('<title>'))
      assert.ok(enHead('<title>') < enHead('<script type="module"'))
      assert.ok(enHead('<script type="module"') < enHead('rel="stylesheet"'))
      // Los modulepreload, después del CSS (con HTTP/1.1 no le quitan una conexión al CSS ni a la foto).
      assert.ok(enHead('rel="stylesheet"') < enHead('<link rel="modulepreload" crossorigin href="/assets/Visitas-c.js" />'))
      assert.ok(enHead('/assets/Visitas-c.js') < enHead('/assets/HeroPagina-d.js'))
      // Lo dibujado sigue igual, sin la precarga de la foto: arranca con la de los logos del header (no son lazy).
      assert.equal(cuantas(raiz, 'fetchPriority="high"'), 1, 'solo el <img> del hero')
      assert.match(raiz, /^<div id="root"><link rel="preload" as="image" href="[^"]*isotipo-unsj[^"]*"\/><header/)
      assert.equal(cuantas(raiz, '<h1'), 1)
      // Sin la foto con prioridad (la 404), el <head> arranca como siempre, con el título.
      const no = await pedir(servidor.address().port, 'GET', '/no-existe')
      assert.equal(no.status, 404)
      assert.match(no.texto, /<meta charset="UTF-8" \/><title>/)
    } finally {
      console.log = original
      await new Promise((r) => servidor.close(r))
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
