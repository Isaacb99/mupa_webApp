// El marco de las páginas públicas (E4.1, plan 6.7): el horario resumido del pie (compartido/horarios.js, código puro)
// y lo que dibujan Layout, Header, el menú y el Pie con el museo máximo y con el vacío (server/museo.js): lo que no está
// cargado no se dibuja (plan 6.1), el teléfono como tel: y el correo como mailto:, las redes con su nombre, "Comprar
// entradas" solo con la compra activa, aria-current en la sección de la página, la 404 sin aria-current, un solo
// <footer> y un solo <main id="main">, y ningún href="./". Sin base.
// Los componentes son JSX: se cargan con el Vite del proyecto (ssrLoadModule, como textoRico.test.js), sin build.
// Desde la corrección de E4 (ronda 1): las secciones en el pie (A11Y-03), los enlaces de 44 px (A11Y-01), los logos
// blancos marcados para los colores forzados (A11Y-04), ver_pie con un pie más alto que la pantalla (HOME-01), la foto
// con prioridad de la primera tarjeta (PAG-02), el sizes de la portada con su tope de alto (PAG-03), las notas de
// Visitas en varios renglones (PAG-04) y lo que se parte para no ensanchar la página (PAG-01, A11Y-06). Ronda 2: en la
// tabla de horario solo se parten las horas, nunca los días, y la tabla se apila con menos de 14 em de ancho (PAG-06).
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DIAS, resumirHorario, textoDias, textoFranjas, textoHora, unirConY } from '../../compartido/horarios.js'
import { DIAS as DIAS_DEL_ESQUEMA } from '../../compartido/esquemas/horarios.js'
import { REDES as REDES_DEL_ESQUEMA } from '../../compartido/esquemas/museo.js'
import { REDES } from '../../compartido/redes.js'
import { pieVisto } from '../../src/analitica.js'
import { MUSEO_MAXIMO, MUSEO_VACIO } from '../museo.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

// Un día del horario como lo da server/museo.js.
const dia = (n, franjas = [], nota = null) => ({ dia: n, abierto: franjas.length > 0, franjas, nota })
const f = (abre, cierra) => ({ abre, cierra })
const semana = (porDia) => [1, 2, 3, 4, 5, 6, 7].map((n) => porDia(n))

describe('compartido/horarios.js: el horario resumido del pie', () => {
  test('los nombres de los días son los del esquema del panel (un solo lugar)', () => {
    assert.equal(DIAS_DEL_ESQUEMA, DIAS)
    assert.equal(REDES_DEL_ESQUEMA, REDES)
    assert.equal(DIAS.length, 7)
    assert.equal(DIAS[0], 'Lunes')
  })

  test('las horas sin el cero de adelante y las franjas ordenadas', () => {
    assert.equal(textoHora('09:00'), '9:00')
    assert.equal(textoHora('00:30'), '0:30')
    assert.equal(textoHora('17:45'), '17:45')
    assert.equal(textoFranjas([f('17:00', '21:00'), f('09:00', '13:00')]), '9:00 a 13:00 y 17:00 a 21:00')
    assert.equal(textoFranjas([f('10:00', '18:00')]), '10:00 a 18:00')
    assert.equal(unirConY(['a', 'b', 'c']), 'a, b y c')
    assert.equal(unirConY(['a']), 'a')
    assert.equal(unirConY([]), '')
  })

  test('los días: seguidos de a tres o más con "a", los demás uno por uno, los siete "todos los días"', () => {
    assert.equal(textoDias([2, 3, 4, 5, 6, 7]), 'Martes a domingo')
    assert.equal(textoDias([1, 2, 3, 4, 5]), 'Lunes a viernes')
    assert.equal(textoDias([6, 7]), 'Sábado y domingo')
    assert.equal(textoDias([1]), 'Lunes')
    assert.equal(textoDias([1, 3, 5]), 'Lunes, miércoles y viernes')
    assert.equal(textoDias([1, 2, 3, 5, 6]), 'Lunes a miércoles, viernes y sábado')
    assert.equal(textoDias([5, 1, 3, 2, 3]), 'Lunes a miércoles y viernes')
    // La semana va de lunes a domingo: el domingo y el lunes no son seguidos.
    assert.equal(textoDias([7, 1]), 'Lunes y domingo')
    assert.equal(textoDias([1, 2, 3, 4, 5, 6, 7]), 'Todos los días')
    assert.equal(textoDias([]), '')
    assert.equal(textoDias([0, 8, 2.5]), '')
  })

  test('días seguidos con las mismas franjas van juntos y los cerrados al final', () => {
    const horario = semana((n) => (n === 1 ? dia(1) : dia(n, [f('09:00', '13:00'), f('17:00', '21:00')])))
    assert.deepEqual(resumirHorario(horario), {
      lineas: [
        { dias: 'Martes a domingo', horas: '9:00 a 13:00 y 17:00 a 21:00' },
        { dias: 'Lunes', horas: null },
      ],
      notas: [],
    })
  })

  test('franjas distintas: una línea por cada horario, en el orden de la semana', () => {
    const horario = semana((n) => {
      if (n <= 5) return dia(n, [f('09:00', '18:00')])
      if (n === 6) return dia(n, [f('10:00', '14:00')])
      return dia(n)
    })
    assert.deepEqual(resumirHorario(horario).lineas, [
      { dias: 'Lunes a viernes', horas: '9:00 a 18:00' },
      { dias: 'Sábado', horas: '10:00 a 14:00' },
      { dias: 'Domingo', horas: null },
    ])
  })

  test('el mismo horario en días que no son seguidos va en una línea', () => {
    const horario = semana((n) => ([2, 4].includes(n) ? dia(n) : dia(n, [f('10:00', '17:00')])))
    assert.deepEqual(resumirHorario(horario).lineas, [
      { dias: 'Lunes, miércoles y viernes a domingo', horas: '10:00 a 17:00' },
      { dias: 'Martes y jueves', horas: null },
    ])
  })

  test('abierto todos los días con el mismo horario', () => {
    assert.deepEqual(resumirHorario(semana((n) => dia(n, [f('08:00', '20:00')]))).lineas, [
      { dias: 'Todos los días', horas: '8:00 a 20:00' },
    ])
  })

  test('las notas, aparte y juntas si dicen lo mismo (también la de un día cerrado)', () => {
    const horario = semana((n) => {
      if (n === 1) return dia(1, [], 'Abre los feriados')
      return dia(n, [f('09:00', '13:00')], n >= 6 ? 'Visitas guiadas a las 11' : null)
    })
    assert.deepEqual(resumirHorario(horario).notas, [
      { dias: 'Lunes', texto: 'Abre los feriados' },
      { dias: 'Sábado y domingo', texto: 'Visitas guiadas a las 11' },
    ])
  })

  test('todo cerrado (lo que deja la migración: el horario sin cargar) o vacío: no hay resumen', () => {
    const vacio = { lineas: [], notas: [] }
    assert.deepEqual(resumirHorario(semana((n) => dia(n))), vacio)
    assert.deepEqual(resumirHorario(semana((n) => dia(n, [], 'Cerrado por obras'))), vacio)
    assert.deepEqual(resumirHorario([]), vacio)
    assert.deepEqual(resumirHorario(undefined), vacio)
    assert.deepEqual(resumirHorario(null), vacio)
    assert.deepEqual(resumirHorario('no es una lista'), vacio)
  })

  test('lo que no se puede leer no cuenta: días fuera de 1..7, horas mal escritas, abierto sin franjas', () => {
    const horario = [
      { dia: 9, abierto: true, franjas: [f('09:00', '13:00')], nota: null },
      { dia: 2, abierto: true, franjas: [f('9:00', '13:00'), f('25:00', '26:00'), f('14:00', '12:00')], nota: '  ' },
      { dia: 3, abierto: true, franjas: [f('10:00', '12:00')], nota: null },
      { dia: 3, abierto: false, franjas: [], nota: 'repetido' },
      null,
    ]
    // El martes queda sin franjas válidas: cuenta como cerrado. Un día que falta (lunes, jueves…) no se nombra.
    assert.deepEqual(resumirHorario(horario), {
      lineas: [
        { dias: 'Miércoles', horas: '10:00 a 12:00' },
        { dias: 'Martes', horas: null },
      ],
      notas: [],
    })
  })

  test('el museo de ejemplo: máximo con su resumen, vacío sin nada', () => {
    assert.deepEqual(resumirHorario(MUSEO_MAXIMO.horarios), {
      lineas: [
        { dias: 'Martes a domingo', horas: '9:00 a 13:00 y 17:00 a 21:00' },
        { dias: 'Lunes', horas: null },
      ],
      notas: [{ dias: 'Domingo', texto: 'EJEMPLO · Visitas guiadas a las 11' }],
    })
    assert.deepEqual(resumirHorario(MUSEO_VACIO.horarios), { lineas: [], notas: [] })
  })
})

describe('src/analitica.js: ver_pie con un pie más alto que la pantalla (HOME-01)', () => {
  // Como las da IntersectionObserver: cuánto se ve, cuánto mide el pie y la pantalla.
  const entrada = (visible, alto, pantalla) => ({
    isIntersecting: visible > 0,
    intersectionRect: { height: visible },
    boundingClientRect: { height: alto },
    rootBounds: { height: pantalla },
  })
  test('un pie bajo cuenta cuando se ve la mitad (como antes)', () => {
    assert.equal(pieVisto(entrada(137, 277, 664)), false)
    assert.equal(pieVisto(entrada(138.5, 277, 664)), true)
    assert.equal(pieVisto(entrada(277, 277, 664)), true)
  })
  test('uno más alto que la pantalla cuenta cuando ocupa media pantalla (con 0,5 fijo no contaba nunca)', () => {
    // El pie con todo lo que admite el panel: 1420 px a 390x664; se ve como mucho el 47 %.
    assert.equal(pieVisto(entrada(300, 1420, 664)), false)
    assert.equal(pieVisto(entrada(332, 1420, 664)), true)
    assert.equal(pieVisto(entrada(568, 1497, 568)), true)
    assert.equal(pieVisto(entrada(0, 1420, 664)), false)
  })
})

describe('Layout, header, menú y pie (sin base)', () => {
  let vite
  let Raiz
  const paginasCargadas = {}
  let Header
  let Pie
  let contenido
  let datos
  before(async () => {
    const { createServer } = await import('vite')
    vite = await createServer({
      root: RAIZ,
      configFile: false,
      // Su propia caché: la de node_modules/.vite es la de npm run dev.
      cacheDir: join(tmpdir(), 'mupa-vite-pruebas-layout'),
      logLevel: 'silent',
      appType: 'custom',
      server: { middlewareMode: true, hmr: false, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    const modulo = await vite.ssrLoadModule('/src/Raiz.jsx')
    Raiz = modulo.default
    // Desde E4 cada página va en su archivo (src/Raiz.jsx): se cargan antes, como hacen el servidor y el navegador.
    for (const nombre of ['home', 'no-encontrada', 'rara']) paginasCargadas[nombre] = await modulo.cargarPagina(nombre)
    Header = (await vite.ssrLoadModule('/src/components/Header.jsx')).default
    Pie = (await vite.ssrLoadModule('/src/components/Pie.jsx')).default
    contenido = await vite.ssrLoadModule('/src/content.js')
    datos = await vite.ssrLoadModule('/src/components/datosMuseo.js')
  })
  after(() => vite?.close())

  // Como el servidor: el estado pasa por JSON (server/ssr.js).
  const pagina = (estado) =>
    renderToStaticMarkup(
      createElement(Raiz, {
        estado: JSON.parse(JSON.stringify({ ruta: '/', datos: {}, hoy: '2026-10-19', medir: false, userway: null, ...estado })),
        Pagina: paginasCargadas[estado.pagina],
      }),
    )
  const cuantas = (html, texto) => html.split(texto).length - 1

  test('la Home con el museo vacío: el pie de la landing, sin rótulos ni datos, sin compra', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_VACIO })
    assert.equal(cuantas(html, '<footer'), 1)
    assert.equal(cuantas(html, '<main id="main" tabindex="-1">'), 1)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.equal(cuantas(html, 'href="./"'), 0)
    assert.equal(cuantas(html, 'Contenido pendiente'), 0)
    for (const rotulo of ['Dirección', 'Horario', 'Redes', 'tel:', 'mailto:', 'data-entradas', 'Comprar entradas']) {
      assert.equal(cuantas(html, rotulo), 0, rotulo)
    }
    assert.ok(html.includes('© Museo Paleontológico de San Juan'))
    // El menú: las cuatro secciones en el menú ancho, en el del celular y en el pie (A11Y-03), y el botón que abre el
    // <dialog>.
    for (const ruta of ['/exposiciones', '/visitas', '/novedades', '/contacto']) assert.equal(cuantas(html, `href="${ruta}"`), 3, ruta)
    assert.match(html, /<button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-movil"/)
    assert.match(html, /<dialog id="menu-movil" aria-label="Menú" data-lenis-prevent=""/)
    // En la Home el header va sobre el hero.
    // (Antes del header, React pone el preload del logo.)
    assert.match(html, /^(<link [^>]*>)*<header class="absolute inset-x-0 top-0 z-40">/)
    assert.equal(cuantas(html, 'aria-current'), 0)
  })

  test('la Home con el museo máximo: dirección, horario, tel:, mailto:, las seis redes y la compra', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_MAXIMO })
    assert.ok(html.includes('EJEMPLO · Avenida de ejemplo 1234 (Oeste), entre calle Uno y calle Dos, edificio de la ex estación'))
    assert.ok(html.includes('5400 EJEMPLO · Ciudad de San Juan, San Juan'))
    assert.ok(html.includes('Martes a domingo: 9:00\u00a0a\u00a013:00 y 17:00\u00a0a\u00a021:00'))
    assert.ok(html.includes('Lunes: cerrado'))
    assert.ok(html.includes('Domingo: EJEMPLO · Visitas guiadas a las 11'))
    assert.match(html, /<a href="tel:\+542640000000"[^>]*>\+54 264 000-0000<\/a>/)
    assert.match(html, /<a href="mailto:museo@example.com"[^>]*>museo@example.com<\/a>/)
    for (const { red, url } of MUSEO_MAXIMO.redes) {
      assert.match(html, new RegExp(`<a href="${url}"[^>]*>${REDES[red].replace(/[()]/g, '\\$&')}</a>`), red)
    }
    // La compra, en el menú ancho y en el del celular, con el texto que cargó el museo.
    assert.equal(cuantas(html, 'href="https://example.com/entradas" data-entradas=""'), 2)
    assert.equal(cuantas(html, '>Comprar entradas</a>'), 2)
    // Nada del museo que el pie no muestra (el correo de destino ni siquiera está en el estado).
    assert.equal(cuantas(html, 'example.com/mapa'), 0)
    assert.equal(cuantas(html, '<footer'), 1)
    assert.equal(cuantas(html, '<h1'), 1)
  })

  test('la compra con otro texto, o sin texto (el de content.js)', () => {
    const conTexto = pagina({ pagina: 'home', museo: { ...MUSEO_VACIO, compra: { url: 'https://example.com/e', texto: 'Entradas online' } } })
    assert.equal(cuantas(conTexto, '>Entradas online</a>'), 2)
    const sinTexto = pagina({ pagina: 'home', museo: { ...MUSEO_VACIO, compra: { url: 'https://example.com/e', texto: null } } })
    assert.equal(cuantas(sinTexto, `>${contenido.navegacion.comprar}</a>`), 2)
  })

  test('aria-current: "page" en la sección de la página, "true" dentro de ella, nada en la 404', () => {
    const header = (ruta) => renderToStaticMarkup(createElement(Header, { ruta, compra: null, sobreHero: false }))
    const visitas = header('/visitas')
    assert.equal(cuantas(visitas, 'aria-current="page"'), 2)
    assert.match(visitas, /<a href="\/visitas" aria-current="page"/)
    const muestra = header('/exposiciones/una-muestra')
    assert.equal(cuantas(muestra, 'aria-current="true"'), 2)
    assert.match(muestra, /<a href="\/exposiciones" aria-current="true"/)
    assert.equal(cuantas(header('/'), 'aria-current'), 0)
    assert.equal(cuantas(header('/visitasx'), 'aria-current'), 0)
    // En las otras páginas el header va en el flujo.
    assert.match(visitas, /^(<link [^>]*>)*<header class="relative">/)
    // La 404 en una dirección que empieza como una sección: sin aria-current.
    const html = pagina({ pagina: 'no-encontrada', ruta: '/exposiciones/no-existe', museo: MUSEO_VACIO })
    assert.equal(cuantas(html, 'aria-current'), 0)
  })

  test('la 404 dentro del Layout: un h1, el inicio y las secciones, el pie', () => {
    const html = pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_MAXIMO })
    assert.equal(cuantas(html, '<h1'), 1)
    assert.ok(html.includes(contenido.noEncontrada.titulo))
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    for (const ruta of ['/', '/exposiciones', '/visitas', '/novedades', '/contacto']) assert.ok(main.includes(`href="${ruta}"`), ruta)
    assert.equal(cuantas(html, '<footer'), 1)
    assert.ok(html.includes('tel:+542640000000'))
    // Una página que la tabla no conoce también va con el Layout.
    assert.equal(cuantas(pagina({ pagina: 'rara', ruta: '/x', museo: MUSEO_VACIO }), '<footer'), 1)
  })

  test('el pie: lo que no se puede usar no se dibuja (teléfono raro, redes desconocidas o sin https)', () => {
    const html = renderToStaticMarkup(
      createElement(Pie, {
        museo: {
          ...MUSEO_VACIO,
          telefono: '4200000 / 4200001',
          emailPublico: 'no es un correo',
          redes: [
            { red: 'myspace', url: 'https://example.com/a' },
            { red: 'instagram', url: 'http://example.com/b' },
            { red: 'facebook', url: 'javascript:alert(1)' },
            { red: 'youtube', url: 'https://example.com/c' },
          ],
        },
      }),
    )
    // El teléfono con dos números va como texto, sin tel:.
    assert.ok(html.includes('4200000 / 4200001'))
    assert.equal(cuantas(html, 'tel:'), 0)
    assert.equal(cuantas(html, 'mailto:'), 0)
    assert.equal(cuantas(html, 'no es un correo'), 0)
    assert.equal(cuantas(html, '<a href="https://example.com/c"'), 1)
    for (const malo of ['myspace', 'example.com/a', 'example.com/b', 'javascript:']) assert.equal(cuantas(html, malo), 0, malo)
    // Sin museo (null) también dibuja.
    assert.ok(renderToStaticMarkup(createElement(Pie, { museo: null })).includes('<footer'))
  })

  test('el pie: la línea de privacidad solo si existe', () => {
    const { pie } = contenido
    const antes = pie.privacidad
    try {
      pie.privacidad = ''
      const sin = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO }))
      assert.equal(cuantas(sin, '<p>'), 1) // el ©
      pie.privacidad = 'Texto de privacidad de prueba.'
      const con = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO }))
      assert.ok(con.includes('<p>Texto de privacidad de prueba.</p>'))
    } finally {
      pie.privacidad = antes
    }
  })

  test('el pie: las secciones del sitio (sin JavaScript, A11Y-03), con aria-current; enlaces de 44 px (A11Y-01)', () => {
    const html = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_MAXIMO, ruta: '/visitas' }))
    const nav = /<nav aria-label="Secciones del sitio"[^>]*>(.*?)<\/nav>/s.exec(html)?.[1] ?? ''
    for (const s of contenido.navegacion.secciones) assert.ok(nav.includes(`href="${s.ruta}"`), s.ruta)
    assert.equal(cuantas(nav, 'aria-current="page"'), 1)
    assert.match(nav, /<a href="\/visitas" aria-current="page"/)
    assert.equal(cuantas(renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO, ruta: '/exposiciones/x' })), 'aria-current="true"'), 1)
    assert.equal(cuantas(renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO })), 'aria-current'), 0)
    // Todos los enlaces del pie (secciones, teléfono, correo y redes) miden 44 px de alto.
    const enlaces = html.match(/<a [^>]*>/g) ?? []
    assert.equal(enlaces.length, 4 + 1 + 1 + datos.redesConocidas(MUSEO_MAXIMO.redes).length)
    for (const a of enlaces) assert.match(a, /class="inline-flex min-h-11 /, a)
    // Lo que carga el museo se parte si no entra (una dirección o una nota larga): PAG-01.
    assert.ok(cuantas(html, 'wrap-anywhere') >= 4)
  })

  test('los logos blancos (header, menú del celular, pie y el cierre de Identidad) llevan data-logo-blanco (A11Y-04)', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_MAXIMO })
    const instituciones = contenido.pie.instituciones.filter((i) => i.logo).map((i) => i.nombre)
    const logos = (html.match(/<img [^>]*>/g) ?? []).filter((img) => {
      const alt = /alt="([^"]*)"/.exec(img)?.[1]
      return alt === contenido.site.nombre || alt === contenido.site.logo.textoAlt || instituciones.includes(alt)
    })
    // El logo (dos piezas) en el header y en el menú del celular; las instituciones en el pie y en Identidad.
    assert.equal(logos.length, 2 + 2 + 2 * instituciones.length)
    for (const img of logos) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
    // Y el logo del header mide 44 px o más de alto debajo de lg sin moverse (padding y margen negativo).
    assert.match(html, /<a href="\/" class="inline-grid [^"]*max-lg:-my-3 max-lg:py-3/)
  })

  test('las tarjetas: la primera de la página con la foto con prioridad, las demás lazy (PAG-02); lo largo se parte (PAG-01)', async () => {
    const { SeccionDeTarjetas } = await vite.ssrLoadModule('/src/components/Seccion.jsx')
    const foto = (n) => ({ clave: `${n}`.repeat(16), ancho: 1600, alto: 1067, variantes: [480, 960, 1600], alt: `Foto ${n}`, decorativa: false })
    const tarjetas = [1, 2, 3].map((n) => ({ titulo: `Título ${n}`, url: `/novedades/t${n}`, portada: foto(n), resumen: 'Un resumen.' }))
    const imgs = (primera) =>
      renderToStaticMarkup(createElement(SeccionDeTarjetas, { id: 'x', titulo: 'X', tarjetas, primera })).match(/<img [^>]*>/g)
    const [a, b, c] = imgs(true)
    assert.match(a, /fetchPriority="high"/)
    assert.doesNotMatch(a, /loading="lazy"/)
    for (const img of [b, c]) assert.match(img, /loading="lazy"/)
    // Una lista que no es la primera de la página: todas lazy.
    for (const img of imgs(false)) assert.match(img, /loading="lazy"/)
    const html = renderToStaticMarkup(createElement(SeccionDeTarjetas, { id: 'x', titulo: 'X', tarjetas }))
    assert.equal(cuantas(html, '<li class="min-w-0">'), 3)
    assert.match(html, /<h3 class="[^"]*wrap-anywhere/)
  })

  test('la portada de una ficha: sizes con el tope de alto, así una vertical no baja el archivo de 1600 (PAG-03)', async () => {
    const { tamanoPortada } = await vite.ssrLoadModule('/src/components/Ficha.jsx')
    // Vertical 1:2: 75vh × 0,5 = 37,5vh.
    assert.equal(tamanoPortada({ ancho: 1200, alto: 2400 }), '(min-width: 80rem) min(72rem, 37.5vh), min(100vw, 37.5vh)')
    // 3:2: 112,5vh.
    assert.equal(tamanoPortada({ ancho: 1500, alto: 1000 }), '(min-width: 80rem) min(72rem, 112.5vh), min(100vw, 112.5vh)')
    assert.equal(tamanoPortada({ ancho: 0, alto: 0 }), '(min-width: 80rem) 72rem, 100vw')
  })

  test('Visitas: las notas y el aviso en varios renglones (PAG-04); la tabla y las tarifas se parten (A11Y-06, PAG-01)', async () => {
    const Visitas = (await vite.ssrLoadModule('/src/paginas/Visitas.jsx')).default
    const html = renderToStaticMarkup(
      createElement(Visitas, {
        estado: {
          datos: {
            aviso: 'Cerrado el lunes.\nAbre el martes.',
            notaHorarios: 'Feriados: horario de domingo.\nEl 25 de diciembre, cerrado.',
            notaTarifas: 'Se paga en efectivo o con tarjeta.\nJubilados: 50 %.',
            horario: [{ dia: 'Lunes', hoy: true, horas: '9:00 a 13:00', nota: null }],
            tarifas: [{ nombre: 'General', precio: '$ 3.000', condicion: null }],
          },
        },
      }),
    )
    assert.ok(html.includes('Se paga en efectivo o con tarjeta.\nJubilados: 50 %.'))
    assert.equal(cuantas(html, 'whitespace-pre-line'), 3)
    assert.match(html, /<td [^>]*class="[^"]*wrap-anywhere/)
    assert.match(html, /<span class="min-w-0 wrap-anywhere">/)
  })

  test('el horario: solo las horas se parten, los días nunca (PAG-06), y apilado si la tabla mide menos de 14 em (A11Y-06)', async () => {
    const TablaHorarios = (await vite.ssrLoadModule('/src/components/TablaHorarios.jsx')).default
    const nota = 'Visitas guiadas a las 11 y a las 17; los feriados abre de 10 a 20 con entrada libre para todo el público.'
    const dias = ['Lunes', 'Hoy (martes)', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia, i) => ({
      dia,
      hoy: i === 1,
      horas: i === 0 ? null : '9:00 a 13:00 y 17:00 a 21:00',
      nota: i === 2 ? nota : null,
    }))
    const html = renderToStaticMarkup(createElement(TablaHorarios, { dias, etiqueta: 'horario' }))
    const clases = (etiqueta) => [...html.matchAll(new RegExp(`<${etiqueta}\\b[^>]*class="([^"]*)"`, 'g'))].map((m) => m[1].split(/\s+/))
    // Puesto en toda la tabla (lo de A11Y-06 en la ronda 1), el ancho mínimo de la columna de los días bajaba a una
    // letra y, con una nota larga, "Miércoles" salía partido: solo la celda de las horas parte palabras.
    const [tabla] = clases('table')
    assert.ok(!tabla.includes('wrap-anywhere'), 'la tabla no parte palabras')
    const ths = clases('th')
    assert.equal(ths.length, 7, 'los encabezados de fila (los de columna no llevan clases)')
    for (const th of ths) {
      for (const c of th) assert.doesNotMatch(c, /^(wrap-anywhere|break-all|hyphens-auto|wrap-break-word)$/, `el día no parte palabras: ${c}`)
      assert.ok(th.includes('@max-[14em]:wrap-break-word'), 'apilada, solo si la palabra no entra en todo el ancho')
    }
    const tds = clases('td')
    assert.equal(tds.length, 7)
    for (const td of tds) assert.ok(td.includes('wrap-anywhere'), 'las horas y la nota se parten (una dirección web)')
    // Con menos de 14 em de ancho (la letra al 200 % o el zoom en un celular): el día arriba y las horas debajo, con los
    // role de la tabla explícitos (con display block, Safari puede dejar de anunciarla como tabla).
    assert.match(html, /^<div class="@container mt-6"><table role="table" aria-labelledby="horario" class="[^"]*@max-\[14em\]:block/)
    assert.equal(cuantas(html, 'role="rowgroup"'), 2)
    assert.equal(cuantas(html, 'role="row"'), 8)
    assert.equal(cuantas(html, 'role="columnheader" scope="col"'), 2)
    assert.equal(cuantas(html, 'role="rowheader" scope="row"'), 7)
    assert.equal(cuantas(html, 'role="cell"'), 7)
    for (const tr of clases('tr').slice(1)) assert.ok(tr.includes('@max-[14em]:block'))
    assert.equal(cuantas(html, 'aria-current="date"'), 1)
    assert.ok(html.includes(`>${nota}</span>`))
  })

  test('datosMuseo.js: la dirección en renglones y el teléfono', () => {
    const { renglonesDireccion, enlaceTelefono, correoPublico, redesConocidas } = datos
    assert.deepEqual(renglonesDireccion({ direccion: 'Calle 1', codigoPostal: '5400', localidad: 'San Juan', provincia: 'San Juan' }), [
      'Calle 1',
      '5400 San Juan, San Juan',
    ])
    assert.deepEqual(renglonesDireccion({ provincia: 'San Juan' }), ['San Juan'])
    assert.deepEqual(renglonesDireccion({ localidad: 'Rivadavia' }), ['Rivadavia'])
    assert.deepEqual(renglonesDireccion(MUSEO_VACIO), [])
    assert.deepEqual(renglonesDireccion(null), [])
    assert.deepEqual(enlaceTelefono('+54 (264) 420-0000'), { texto: '+54 (264) 420-0000', href: 'tel:+542644200000' })
    assert.deepEqual(enlaceTelefono('264 420 0000 interno 12'), { texto: '264 420 0000 interno 12', href: null })
    assert.equal(enlaceTelefono(''), null)
    assert.equal(enlaceTelefono(null), null)
    assert.equal(correoPublico('museo@example.com'), 'museo@example.com')
    assert.equal(correoPublico('museo@'), null)
    assert.deepEqual(redesConocidas([{ red: 'x', url: 'https://example.com/x' }]), [{ red: 'x', url: 'https://example.com/x', nombre: 'X (Twitter)' }])
    assert.deepEqual(redesConocidas(undefined), [])
  })
})
