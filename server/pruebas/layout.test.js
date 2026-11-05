// El marco de las páginas públicas (E4.1, plan 6.7): el horario resumido (compartido/horarios.js, código puro) y lo que
// dibujan Layout, Header, el menú y el Pie con el museo máximo y con el vacío (server/museo.js): lo que no está cargado
// no se dibuja (plan 6.1), aria-current en la sección de la página, la 404 sin aria-current, un solo <footer> y un
// solo <main id="main">, y ningún href="./". Sin base.
// Desde el header y el pie del tablero "Web" de la diseñadora (02/11/2026): el header absolute en todas las páginas,
// las secciones del menú y del pie solo si su página existe (src/tablaDePaginas.js; agregar una página la suma sola),
// la dirección de cada sección igual a la de su ruta en el servidor, el botón "Tickets" solo con la compra activa, el
// año del © desde el estado, las redes en el pie y nada más del museo (ni dirección, ni horario, ni teléfono, ni correo).
// Los componentes son JSX: se cargan con el Vite del proyecto (ssrLoadModule, como textoRico.test.js), sin build.
// Desde la Home del tablero "Web" (02/11/2026, etapa 3): el h1 nuevo y la foto del hero con prioridad, la franja de
// accesos (Visitas, "Tickets" solo con la compra, "Recursos educativos" solo cuando exista Educación, nunca "Tienda
// virtual"), el carrusel de Novedades con 0, 1 y 6 tarjetas (el orden, sin portada sin foto, los botones y el contador
// listos para hidratar), "El MuPa en imágenes" con sus piedritas decorativas, el plano con los nombres como texto y el
// origen de clic_entradas (D14). Ronda 1 de su corrección: el hero con alto mínimo y la franja en el flujo (A11Y-02),
// los tamaños con rem (A11Y-04 y A11Y-08), la sombra de la bajada (A11Y-01), el degradé con colores forzados (A11Y-05),
// la fila de Novedades sin snap antes de hidratar y en renglones sin JavaScript (A11Y-06), la región viva vacía antes
// de hidratar (A11Y-03) y las piedritas ancladas a los bordes de la página, que sin Novedades no suben por encima de
// su sección (FID-03 y PAN-03). Ronda 2: los tamaños en rem y sin vw, los del tablero desde 32rem (A11Y-04), el halo de
// la bajada y del h1 (A11Y-01), la caja del carrusel de fotos en espera hasta que arranca el efecto (A11Y-07) y la
// región viva del carrusel de Novedades, que vuelve a avisar aunque repita el texto (R1-01, avisoCarrusel.js).
// Desde la corrección de E4 (ronda 1): las secciones en el pie (A11Y-03), los enlaces de 44 px (A11Y-01), los logos
// blancos marcados para los colores forzados (A11Y-04), ver_pie con un pie más alto que la pantalla (HOME-01), la foto
// con prioridad de la primera tarjeta (PAG-02), el sizes de la portada con su tope de alto (PAG-03), las notas de
// Visitas en varios renglones (PAG-04) y lo que se parte para no ensanchar la página (PAG-01, A11Y-06). Ronda 2: en la
// tabla de horario solo se parten las horas, nunca los días, y la tabla se apila con menos de 14 em de ancho (PAG-06).
// Desde la Visitas del tablero "Web" (03/11/2026, decisiones V1 a V9): el hero con el h1 y la foto con prioridad, cada
// tarjeta (Dirección, Horarios, Contacto) solo con sus datos y la sección sin ninguna ni mapa sin dibujar, el mapa solo
// el de Google, "Museo accesible" con el texto del panel o los párrafos del tablero, y lo que la página dejó de mostrar
// (el aviso, la compra, las tarifas, las notas, cómo llegar y las normas) que no sale aunque esté cargado. Aviso,
// ListaTarifas y TablaHorarios quedan sin usar (se decide al cierre) y se prueban solos.
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
import { origenDeEntradas, pieVisto } from '../../src/analitica.js'
import { ESPERA_MS, crearAvisador } from '../../src/components/avisoCarrusel.js'
import { MUSEO_MAXIMO, MUSEO_VACIO, museoComun } from '../museo.js'
import { RUTAS } from '../rutas-publicas.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

// Un día del horario como lo da server/museo.js.
const dia = (n, franjas = [], nota = null) => ({ dia: n, abierto: franjas.length > 0, franjas, nota })
const f = (abre, cierra) => ({ abre, cierra })
const semana = (porDia) => [1, 2, 3, 4, 5, 6, 7].map((n) => porDia(n))

describe('compartido/horarios.js: el horario resumido', () => {
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
  let tabla
  let navegacionDelSitio
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
    for (const nombre of ['home', 'visitas', 'no-encontrada', 'rara']) paginasCargadas[nombre] = await modulo.cargarPagina(nombre)
    Header = (await vite.ssrLoadModule('/src/components/Header.jsx')).default
    Pie = (await vite.ssrLoadModule('/src/components/Pie.jsx')).default
    contenido = await vite.ssrLoadModule('/src/content.js')
    datos = await vite.ssrLoadModule('/src/components/datosMuseo.js')
    // La misma instancia que leen el menú y el pie (el grafo de módulos de Vite): agregarle una página la "construye".
    tabla = await vite.ssrLoadModule('/src/tablaDePaginas.js')
    navegacionDelSitio = await vite.ssrLoadModule('/src/components/navegacion.js')
  })
  after(() => vite?.close())

  // Como el servidor: el estado pasa por JSON (server/ssr.js).
  const pagina = (estado) =>
    renderToStaticMarkup(
      createElement(Raiz, {
        estado: JSON.parse(
          JSON.stringify({ ruta: '/', datos: {}, hoy: '2026-11-02', anio: 2026, medir: false, userway: null, ...estado }),
        ),
        Pagina: paginasCargadas[estado.pagina],
      }),
    )
  const cuantas = (html, texto) => html.split(texto).length - 1
  const parte = (html, desde, hasta) => html.slice(html.indexOf(desde), html.indexOf(hasta, html.indexOf(desde)) + hasta.length)
  // Las clases del primer elemento que encuentra la expresión (con el atributo class en su primer grupo), separadas.
  const clasesDe = (html, expresion) => {
    const m = expresion.exec(html)
    assert.ok(m, `no está: ${expresion}`)
    return m[1].split(/\s+/)
  }
  const delHeader = (html) => parte(html, '<header', '</header>')
  const delPie = (html) => parte(html, '<footer', '</footer>')
  // El header sin el menú del celular (el <dialog>, que solo existe para el lector abierto).
  const sinDialogo = (html) => html.replace(/<dialog[\s\S]*?<\/dialog>/g, '')
  // Las direcciones de los enlaces de un pedazo de HTML, en orden.
  const hrefs = (html) => [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1])
  const SECCIONES_QUE_EXISTEN = ['/visitas', '/exposiciones', '/novedades', '/contacto']
  const SECCIONES_FUTURAS = ['/el-museo', '/divulgacion', '/educacion', '/circuitos']

  test('la Home con el museo vacío: header absolute, menú con las secciones que existen, pie sin redes ni compra', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_VACIO })
    assert.equal(cuantas(html, '<footer'), 1)
    assert.equal(cuantas(html, '<main id="main" tabindex="-1">'), 1)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.equal(cuantas(html, 'href="./"'), 0)
    assert.equal(cuantas(html, 'Contenido pendiente'), 0)
    for (const texto of ['data-entradas', contenido.navegacion.entradas, contenido.navegacion.comprar, 'aria-label="Redes"', 'tel:', 'mailto:']) {
      assert.equal(cuantas(html, texto), 0, texto)
    }
    // El © con el año del estado.
    assert.ok(delPie(html).includes('© 2026 MUPA - Museo Paleontológico de San Juan'))
    // Visitas en el menú ancho, en el del celular, en la franja de accesos de la Home ("Planificá tu visita") y en el pie;
    // Exposiciones, Novedades y Contacto solo en el pie (no van en el menú del tablero; sin novedades, la Home no
    // dibuja su carrusel ni "Ver todas las novedades"); las secciones cuya página todavía no existe, en ningún lado.
    assert.equal(cuantas(html, 'href="/visitas"'), 4)
    assert.equal(cuantas(delHeader(html), 'href="/visitas"'), 2)
    for (const ruta of ['/exposiciones', '/novedades', '/contacto']) assert.equal(cuantas(html, `href="${ruta}"`), 1, ruta)
    for (const ruta of SECCIONES_FUTURAS) assert.equal(cuantas(html, `href="${ruta}"`), 0, ruta)
    // Sin el selector de idioma del tablero.
    assert.equal(cuantas(html, 'Es (Arg)'), 0)
    assert.match(html, /<button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-movil"/)
    assert.match(html, /<dialog id="menu-movil" aria-label="Menú" data-lenis-prevent=""/)
    // El header va absolute arriba (antes del header, React pone la precarga de los isotipos).
    assert.match(html, /^(<link [^>]*>)*<header class="absolute inset-x-0 top-0 z-40">/)
    assert.equal(cuantas(html, 'aria-current'), 0)
  })

  test('la Home con el museo máximo: el botón "Tickets" (header y menú del celular) y las redes; ningún otro dato del museo', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_MAXIMO })
    const header = delHeader(html)
    // La compra, en el menú ancho y en el del celular, con el texto fijo de content.js (no el que cargó el museo); en la
    // Home, además, en la franja de accesos.
    assert.equal(cuantas(header, 'href="https://example.com/entradas" data-entradas=""'), 2)
    assert.equal(cuantas(header, `>${contenido.navegacion.entradas}</a>`), 2)
    assert.equal(cuantas(html, 'href="https://example.com/entradas" data-entradas=""'), 3)
    assert.equal(cuantas(html, `>${MUSEO_MAXIMO.compra.texto}</a>`), 0)
    // El botón naranja del header con el texto oscuro (D4: blanco a 14 px da 3,3:1).
    for (const a of header.match(/<a href="https:\/\/example.com\/entradas"[^>]*>/g)) assert.match(a, /class="[^"]*bg-naranja[^"]*text-ink/, a)
    // Las redes en el pie, con su nombre como texto del enlace.
    const pie = delPie(html)
    for (const { red, url } of MUSEO_MAXIMO.redes) {
      assert.match(pie, new RegExp(`<a href="${url}"[^>]*>${REDES[red].replace(/[()]/g, '\\$&')}</a>`), red)
    }
    // Lo que el pie ya no muestra (lo muestran Visitas y Contacto): la dirección, el horario, el teléfono y el correo.
    for (const texto of ['EJEMPLO · Avenida de ejemplo', 'Martes a domingo', 'tel:', 'mailto:', 'museo@example.com']) {
      assert.equal(cuantas(pie, texto), 0, texto)
    }
    // Nada del museo que el sitio no muestra (el correo de destino ni siquiera está en el estado).
    assert.equal(cuantas(html, 'example.com/mapa'), 0)
    assert.equal(cuantas(html, '<footer'), 1)
    assert.equal(cuantas(html, '<h1'), 1)
  })

  test('el botón de entradas: solo con la compra activa, siempre "Tickets"; Visitas ya no tiene el suyo (V1, V9)', async () => {
    const conTexto = pagina({ pagina: 'home', museo: { ...MUSEO_VACIO, compra: { url: 'https://example.com/e', texto: 'Entradas online' } } })
    assert.equal(cuantas(delHeader(conTexto), `>${contenido.navegacion.entradas}</a>`), 2)
    assert.equal(cuantas(conTexto, '>Entradas online</a>'), 0)
    const sinTexto = pagina({ pagina: 'home', museo: { ...MUSEO_VACIO, compra: { url: 'https://example.com/e', texto: null } } })
    assert.equal(cuantas(delHeader(sinTexto), `>${contenido.navegacion.entradas}</a>`), 2)
    // En una página que no es la Home, solo los dos del header: Visitas ya no dibuja "Comprar entradas" (desde la
    // Visitas del tablero "Web", 03/11/2026): ningún enlace de compra en el <main>, ni con el texto del museo.
    const compra = { url: 'https://example.com/e', texto: 'Entradas online' }
    const visitasConCompra = pagina({ pagina: 'visitas', ruta: '/visitas', museo: { ...MUSEO_VACIO, compra } })
    assert.equal(cuantas(visitasConCompra, `>${contenido.navegacion.entradas}</a>`), 2)
    assert.equal(cuantas(delMain(visitasConCompra), 'data-entradas'), 0)
    assert.equal(cuantas(delMain(visitasConCompra), 'https://example.com/e'), 0)
    assert.equal(cuantas(visitasConCompra, 'Entradas online'), 0)
    assert.equal(cuantas(visitasConCompra, contenido.navegacion.comprar), 0)
    assert.equal(cuantas(pagina({ pagina: 'home', museo: { ...MUSEO_VACIO, compra: null } }), 'data-entradas'), 0)
    // BotonCompra.jsx queda sin usar (se decide al cierre, D1) y sigue dibujando el texto que cargó el museo o el suyo.
    const BotonCompra = (await vite.ssrLoadModule('/src/components/BotonCompra.jsx')).default
    const boton = (c) => renderToStaticMarkup(createElement(BotonCompra, { compra: c }))
    assert.ok(boton(compra).includes('>Entradas online</a>'))
    assert.ok(boton({ ...compra, texto: null }).includes(`>${contenido.navegacion.comprar}</a>`))
  })

  test('aria-current: "page" en la sección de la página, "true" dentro de ella, nada en la 404; el header siempre absolute', () => {
    const header = (ruta) => renderToStaticMarkup(createElement(Header, { ruta, compra: null }))
    const visitas = header('/visitas')
    assert.equal(cuantas(visitas, 'aria-current="page"'), 2)
    assert.match(visitas, /<a href="\/visitas" aria-current="page"/)
    // En el menú ancho, el subrayado naranja con su borde oscuro (A11Y-01): el del enlace, de 4 px en #010101 y 1 px
    // más arriba; el del texto, el naranja de 2 px en su lugar, encima.
    assert.match(
      visitas,
      /<a href="\/visitas" aria-current="page" class="[^"]* underline decoration-ink decoration-4 underline-offset-\[calc\(0\.4em-1px\)\]"><span class="underline decoration-naranja decoration-2 underline-offset-\[0\.4em\]">Visitas<\/span><\/a>/,
    )
    // Las demás, sin span ni subrayado (solo al pasar el puntero).
    assert.match(header('/'), /<a href="\/visitas" class="[^"]* decoration-1 underline-offset-\[0\.4em\] hover:underline">Visitas<\/a>/)
    assert.equal(cuantas(header('/visitas/algo'), 'aria-current="true"'), 2)
    assert.equal(cuantas(header('/'), 'aria-current'), 0)
    assert.equal(cuantas(header('/visitasx'), 'aria-current'), 0)
    // Exposiciones no va en el menú del header: su ficha marca la sección solo en el pie.
    assert.equal(cuantas(header('/exposiciones/una-muestra'), 'aria-current'), 0)
    const muestra = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO, ruta: '/exposiciones/una-muestra' }))
    assert.equal(cuantas(muestra, 'aria-current="true"'), 1)
    assert.match(muestra, /<a href="\/exposiciones" aria-current="true"/)
    // En todas las páginas el header va absolute arriba (decisión D8).
    assert.match(visitas, /^(<link [^>]*>)*<header class="absolute inset-x-0 top-0 z-40">/)
    assert.match(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO }), /^(<link [^>]*>)*<header class="absolute inset-x-0 top-0 z-40">/)
    // La 404 en una dirección que empieza como una sección: sin aria-current.
    const html = pagina({ pagina: 'no-encontrada', ruta: '/exposiciones/no-existe', museo: MUSEO_VACIO })
    assert.equal(cuantas(html, 'aria-current'), 0)
  })

  test('las secciones: el menú y el pie dibujan solo las que existen; agregar la página de una la suma sola, en su lugar', () => {
    const { navegacion } = contenido
    // Las secciones: los enlaces internos que no son el inicio (el logo) ni "Ir al contenido" (#main) ni la compra.
    const secciones = (enlaces) => enlaces.filter((h) => h.startsWith('/') && h !== '/')
    const delMenu = (html) => secciones(hrefs(sinDialogo(delHeader(html))))
    const delMenuMovil = (html) => secciones(hrefs(/<dialog[\s\S]*?<\/dialog>/.exec(html)[0]))
    const navDelPie = (html) => hrefs(parte(delPie(html), `<nav aria-label="${contenido.pie.secciones}"`, '</nav>'))
    // Hoy: Visitas en el menú; en el pie, las del menú que existen y después las demás.
    let html = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })
    assert.deepEqual(delMenu(html), ['/visitas'])
    assert.deepEqual(delMenuMovil(html), ['/visitas'])
    assert.deepEqual(navDelPie(html), SECCIONES_QUE_EXISTEN)
    assert.deepEqual(navegacionDelSitio.seccionesDelMenu().map((s) => s.ruta), ['/visitas'])
    // Con las cuatro páginas del tablero construidas (sin tocar el header ni el pie): todas, en el orden del tablero.
    const futuras = navegacion.menu.filter((s) => !Object.hasOwn(tabla.PAGINAS, s.pagina)).map((s) => s.pagina)
    assert.deepEqual(futuras, ['el-museo', 'divulgacion', 'educacion', 'circuitos'])
    try {
      for (const p of futuras) tabla.PAGINAS[p] = async () => ({ default: () => null })
      html = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })
      const menu = ['/el-museo', '/visitas', '/divulgacion', '/educacion', '/circuitos']
      assert.deepEqual(delMenu(html), menu)
      assert.deepEqual(delMenuMovil(html), menu)
      assert.deepEqual(navDelPie(html), [...menu, '/exposiciones', '/novedades', '/contacto'])
      assert.ok(html.includes('>Divulgación</a>'))
      // La 404 también las nombra.
      const noEncontrada = pagina({ pagina: 'no-encontrada', ruta: '/x', museo: MUSEO_VACIO })
      const main = parte(noEncontrada, '<main', '</main>')
      for (const ruta of menu) assert.ok(main.includes(`href="${ruta}"`), ruta)
    } finally {
      for (const p of futuras) delete tabla.PAGINAS[p]
    }
    assert.deepEqual(delMenu(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })), ['/visitas'])
    // Sin ninguna sección ni compra, el menú no se dibuja (ni el botón "Menú" del celular).
    const visitas = tabla.PAGINAS.visitas
    try {
      delete tabla.PAGINAS.visitas
      const vacio = renderToStaticMarkup(createElement(Header, { ruta: '/', compra: null }))
      assert.equal(cuantas(vacio, '<nav'), 0)
      assert.equal(cuantas(vacio, 'menu-movil'), 0)
      // Con la compra activa, el botón sí (y el menú del celular con él).
      const conCompra = renderToStaticMarkup(createElement(Header, { ruta: '/', compra: { url: 'https://example.com/e', texto: null } }))
      assert.equal(cuantas(conCompra, 'data-entradas'), 2)
    } finally {
      tabla.PAGINAS.visitas = visitas
    }
  })

  test('la dirección de cada sección es la de su ruta en el servidor (server/rutas-publicas.js)', () => {
    const { navegacion } = contenido
    const secciones = [...navegacion.menu, ...navegacion.otras]
    // Las páginas de las secciones existen en las dos tablas o en ninguna.
    for (const s of secciones) {
      const ruta = RUTAS.find((r) => r.pagina === s.pagina)
      if (Object.hasOwn(tabla.PAGINAS, s.pagina)) {
        assert.ok(ruta, `${s.pagina} está en src/tablaDePaginas.js y no en la tabla de rutas`)
        assert.equal(ruta.patron, s.ruta, s.pagina)
      } else {
        assert.equal(ruta, undefined, `${s.pagina} está en la tabla de rutas y no en src/tablaDePaginas.js`)
      }
    }
    // Sin repetidas.
    assert.equal(new Set(secciones.map((s) => s.pagina)).size, secciones.length)
    assert.equal(new Set(secciones.map((s) => s.ruta)).size, secciones.length)
  })

  test('la 404 dentro del Layout: un h1, el inicio y las secciones, el pie', () => {
    const html = pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_MAXIMO })
    // Las navegaciones con nombres distintos (A11Y-07: la de la 404 y la del pie se llamaban igual). La del menú del
    // celular va adentro de su <dialog>, que solo existe para el lector abierto, cuando la del header está oculta.
    const nombres = [...sinDialogo(html).matchAll(/<nav ([^>]*)>/g)].map(([, atributos]) => {
      const etiqueta = /aria-label="([^"]*)"/.exec(atributos)?.[1]
      if (etiqueta) return etiqueta
      const id = /aria-labelledby="([^"]*)"/.exec(atributos)?.[1]
      return new RegExp(`id="${id}"[^>]*>([^<]*)<`).exec(html)?.[1]
    })
    assert.ok(nombres.length >= 3, nombres.join(' | '))
    assert.ok(nombres.every(Boolean), nombres.join(' | '))
    assert.equal(new Set(nombres).size, nombres.length, nombres.join(' | '))
    assert.equal(cuantas(html, '<h1'), 1)
    assert.ok(html.includes(contenido.noEncontrada.titulo))
    const main = parte(html, '<main', '</main>')
    for (const ruta of ['/', ...SECCIONES_QUE_EXISTEN]) assert.ok(main.includes(`href="${ruta}"`), ruta)
    for (const ruta of SECCIONES_FUTURAS) assert.equal(cuantas(main, `href="${ruta}"`), 0, ruta)
    assert.equal(cuantas(html, '<footer'), 1)
    // El contenido deja el lugar del header (absolute): el mismo padding que las páginas internas.
    assert.match(main, /<main id="main" tabindex="-1"><div class="[^"]*pt-32 [^"]*md:pt-40 [^"]*lg:pt-52/)
    // Una página que la tabla no conoce también va con el Layout.
    assert.equal(cuantas(pagina({ pagina: 'rara', ruta: '/x', museo: MUSEO_VACIO }), '<footer'), 1)
  })

  test('el año del ©: el del estado (lo pone el servidor); sin año en el estado, sin año', () => {
    assert.ok(delPie(pagina({ pagina: 'home', museo: MUSEO_VACIO, anio: 2031 })).includes('>© 2031 MUPA - Museo Paleontológico de San Juan</p>'))
    const sinAnio = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO }))
    assert.ok(sinAnio.includes('>© MUPA - Museo Paleontológico de San Juan</p>'))
    assert.equal(cuantas(sinAnio, '© null'), 0)
    // Un año que no es un entero no se dibuja.
    assert.ok(renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO, anio: '2026' })).includes('>© MUPA - Museo'))
  })

  test('el pie: las redes conocidas con https, cada una con su nombre; las demás no se dibujan; sin redes, sin lista', () => {
    const html = renderToStaticMarkup(
      createElement(Pie, {
        museo: {
          ...MUSEO_VACIO,
          telefono: '4200000 / 4200001',
          emailPublico: 'museo@example.com',
          redes: [
            { red: 'myspace', url: 'https://example.com/a' },
            { red: 'instagram', url: 'http://example.com/b' },
            { red: 'facebook', url: 'javascript:alert(1)' },
            { red: 'youtube', url: 'https://example.com/c' },
          ],
        },
      }),
    )
    assert.match(html, /<ul aria-label="Redes"[^>]*><li><a href="https:\/\/example.com\/c"[^>]*>YouTube<\/a><\/li><\/ul>/)
    for (const malo of ['myspace', 'example.com/a', 'example.com/b', 'javascript:']) assert.equal(cuantas(html, malo), 0, malo)
    // El teléfono y el correo ya no van en el pie (los muestran Visitas y Contacto).
    for (const texto of ['4200000', 'tel:', 'mailto:', 'museo@example.com']) assert.equal(cuantas(html, texto), 0, texto)
    assert.equal(cuantas(renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO })), 'aria-label="Redes"'), 0)
    // Sin museo (null) también dibuja.
    assert.ok(renderToStaticMarkup(createElement(Pie, { museo: null })).includes('<footer'))
  })

  test('el pie: la línea de privacidad solo si existe', () => {
    const { pie } = contenido
    const antes = pie.privacidad
    try {
      pie.privacidad = ''
      const sin = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO }))
      assert.equal(cuantas(sin, '<p '), 1) // el ©
      pie.privacidad = 'Texto de privacidad de prueba.'
      const con = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO }))
      assert.match(con, /<p [^>]*>Texto de privacidad de prueba.<\/p>/)
    } finally {
      pie.privacidad = antes
    }
  })

  test('el pie: las secciones del sitio (sin JavaScript, A11Y-03), con aria-current; enlaces de 44 px (A11Y-01)', () => {
    const html = renderToStaticMarkup(createElement(Pie, { museo: MUSEO_MAXIMO, ruta: '/visitas' }))
    const etiqueta = `<nav aria-label="${contenido.pie.secciones}"`
    assert.ok(html.includes(etiqueta), etiqueta)
    const nav = parte(html, etiqueta, '</nav>')
    assert.deepEqual(hrefs(nav), navegacionDelSitio.seccionesDelSitio().map((s) => s.ruta))
    assert.equal(cuantas(nav, 'aria-current="page"'), 1)
    assert.match(nav, /<a href="\/visitas" aria-current="page"/)
    assert.equal(cuantas(renderToStaticMarkup(createElement(Pie, { museo: MUSEO_VACIO })), 'aria-current'), 0)
    // Todos los enlaces del pie (secciones y redes) miden 44 px de alto y de ancho ("Visitas" medía 43 de ancho:
    // A11Y-07) y se parten si no entran (PAG-01).
    const enlaces = html.match(/<a [^>]*>/g) ?? []
    assert.equal(enlaces.length, SECCIONES_QUE_EXISTEN.length + datos.redesConocidas(MUSEO_MAXIMO.redes).length)
    for (const a of enlaces) assert.match(a, /class="inline-flex min-h-11 min-w-11 [^"]*wrap-anywhere/, a)
    // La fila del tablero: la marca (decorativa: el © dice el nombre) y los logos de 42 px de alto.
    assert.match(html, /<img [^>]*alt=""[^>]*class="block h-10 w-30"/)
    assert.equal(cuantas(html, 'class="h-[2.625rem] w-auto"'), contenido.pie.instituciones.length)
  })

  test('los logos blancos llevan data-logo-blanco (A11Y-04), salvo los del header sobre una foto (A11Y-08)', () => {
    const { logo } = contenido.site
    const isotipos = logo.isotipos.map((i) => i.nombre)
    const imagenes = (html) => html.match(/<img [^>]*>/g) ?? []
    const alt = (img) => /alt="([^"]*)"/.exec(img)?.[1]
    // En la Home (sobreFoto): la marca y los isotipos del header, sin data-logo-blanco; los del menú del celular (sobre
    // el fondo del sitio) y los del pie, con.
    const home = pagina({ pagina: 'home', museo: MUSEO_MAXIMO })
    const header = imagenes(sinDialogo(delHeader(home)))
    assert.deepEqual(header.map(alt), [logo.alt, ...isotipos])
    for (const img of header) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    const menuMovil = imagenes(/<dialog[\s\S]*?<\/dialog>/.exec(home)[0])
    assert.deepEqual(menuMovil.map(alt), [logo.alt, ...isotipos])
    for (const img of menuMovil) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
    const pie = imagenes(delPie(home))
    assert.equal(pie.length, 1 + contenido.pie.instituciones.length)
    for (const img of pie) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
    // En una página sin foto arriba (la 404; Visitas tiene la suya desde el tablero "Web", 03/11/2026), el logo del
    // header sí se invierte.
    const interna = imagenes(sinDialogo(delHeader(pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_VACIO }))))
    assert.equal(interna.length, 1 + isotipos.length)
    for (const img of interna) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
    // Visitas, con la foto del hero debajo del header (Visitas.sobreFoto), como la Home: no.
    const visitas = imagenes(sinDialogo(delHeader(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO }))))
    assert.deepEqual(visitas.map(alt), [logo.alt, ...isotipos])
    for (const img of visitas) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    // La marca es el enlace al inicio y mide 44 px o más de alto sin moverse (padding y margen negativo); los isotipos
    // son una lista con nombre, no enlaces.
    assert.match(home, /<a href="\/" class="-my-1.5 block shrink-0 rounded-sm py-1.5 [^"]*"><img [^>]*alt="MuPa - Museo Paleontológico de San Juan"/)
    assert.match(sinDialogo(delHeader(home)), /<ul aria-label="Instituciones"[^>]*><li><img [^>]*alt="Universidad Nacional de San Juan"/)
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

  test('Aviso y ListaTarifas (sin uso desde la Visitas del tablero, D1): los renglones del museo (PAG-04) y lo que se parte (PAG-01)', async () => {
    const Aviso = (await vite.ssrLoadModule('/src/components/Aviso.jsx')).default
    const ListaTarifas = (await vite.ssrLoadModule('/src/components/ListaTarifas.jsx')).default
    const aviso = renderToStaticMarkup(createElement(Aviso, { texto: 'Cerrado el lunes.\nAbre el martes.' }))
    assert.ok(aviso.includes('Cerrado el lunes.\nAbre el martes.'))
    assert.equal(cuantas(aviso, 'whitespace-pre-line'), 1)
    const tarifas = renderToStaticMarkup(createElement(ListaTarifas, { tarifas: [{ nombre: 'General', precio: '$ 3.000', condicion: null }] }))
    assert.match(tarifas, /<span class="min-w-0 wrap-anywhere">/)
  })

  // Visitas del tablero "Web" de la diseñadora (03/11/2026, decisiones V1 a V9).
  const titulosH3 = (html) => [...html.matchAll(/<h3 [^>]*>([^<]*)<\/h3>/g)].map((m) => m[1])
  const unParrafo = (texto) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] })

  test('Visitas con el museo máximo: el hero, las tres tarjetas con sus datos, el mapa y "Museo accesible" con el texto del panel', () => {
    const v = contenido.visitas
    // Los datos de antes (E4.3) llegan también, como si el servidor los mandara: la página no los mira (V1).
    const viejos = {
      aviso: 'AVISO VIEJO',
      compra: { url: 'https://example.com/compra-vieja', texto: 'COMPRA VIEJA' },
      horario: [{ dia: 'Hoy (lunes)', hoy: true, horas: '9:00 a 13:00', nota: 'NOTA VIEJA' }],
      notaHorarios: 'NOTA DE HORARIOS VIEJA',
      tarifas: [{ nombre: 'TARIFA VIEJA', precio: '$ 9.999', condicion: null }],
      notaTarifas: 'NOTA DE TARIFAS VIEJA',
      comoLlegar: unParrafo('COMO LLEGAR VIEJO'),
      normas: unParrafo('NORMAS VIEJAS'),
    }
    const html = pagina({
      pagina: 'visitas',
      ruta: '/visitas',
      museo: museoComun(MUSEO_MAXIMO),
      datos: { ...viejos, accesibilidad: MUSEO_MAXIMO.accesibilidad },
    })
    const main = delMain(html)
    // Un solo h1, el del hero, con el título del tablero; la sección del hero lo nombra.
    assert.equal(cuantas(html, '<h1'), 1)
    const hero = seccion(main, 'visitas-titulo')
    assert.ok(hero.includes(`<h1 id="visitas-titulo" class="`))
    assert.ok(hero.includes(`>${v.hero.titulo}</h1>`))
    assert.equal(v.hero.titulo, 'Visitá el MuPa')
    // La foto del hero: el LCP, con prioridad y sin lazy, con sus cuatro anchos y su alt.
    const [fotoHero] = hero.match(/<img [^>]*>/g)
    assert.match(fotoHero, /fetchPriority="high"/)
    assert.doesNotMatch(fotoHero, /loading=/)
    assert.deepEqual([...fotoHero.matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [960, 1440, 1920, 2880])
    assert.ok(fotoHero.includes(`alt="${v.hero.imagen.alt}"`))
    // Su punto de interés (FID-01): la punta del pincel, al 80 % del alto, queda en su lugar más allá de 1440.
    assert.equal(v.hero.imagen.posicion, '50% 80%')
    assert.match(fotoHero, /style="object-position:50% 80%"/)
    // El degradé, también con colores forzados (como la Home, A11Y-05).
    assert.match(hero, /<div aria-hidden="true" class="absolute inset-0 bg-\[linear-gradient[^"]*forced-color-adjust-none"><\/div>/)

    // "Información práctica": el rótulo, el h2 y las tres tarjetas en el orden del tablero.
    const practica = seccion(main, 'visitas-practica')
    assert.ok(practica.includes(`>${v.practica.rotulo}</p><h2 id="visitas-practica" class="`))
    assert.ok(practica.includes(`>${v.practica.titulo}</h2>`))
    assert.deepEqual(titulosH3(practica), [v.practica.direccion, v.practica.horarios, v.practica.contacto])
    // La dirección en renglones.
    assert.ok(
      practica.includes(
        `<address class="not-italic"><span class="block">${MUSEO_MAXIMO.direccion}</span>` +
          `<span class="block">5400 ${MUSEO_MAXIMO.localidad}, San Juan</span></address>`,
      ),
    )
    // El horario resumido (V3): los días con las mismas franjas juntos, los cerrados al final, "9:00 a 13:00" sin
    // cortes; sin las notas de los días, sin la nota de horarios, sin la tabla ni "Hoy".
    assert.ok(practica.includes('<li>Martes a domingo: 9:00\u00a0a\u00a013:00 y 17:00\u00a0a\u00a021:00</li><li>Lunes: cerrado</li>'))
    for (const fuera of ['Visitas guiadas', MUSEO_MAXIMO.notaHorarios, '<table', 'aria-current="date"', 'Hoy (']) {
      assert.equal(cuantas(main, fuera), 0, fuera)
    }
    // Contacto: el teléfono con tel:, el correo con mailto: y "Ir a Contacto".
    assert.match(practica, /<a href="tel:\+542640000000" class="inline-flex min-h-11 [^"]*">\+54 264 000-0000<\/a>/)
    assert.match(practica, /<a href="mailto:museo@example\.com" class="inline-flex min-h-11 [^"]*">museo@example\.com<\/a>/)
    assert.match(practica, new RegExp(`<a href="/contacto" class="inline-flex min-h-11 [^"]*">${v.practica.irAContacto}<svg `))
    // El mapa de "Insertar mapa" (V5), con su title y lazy, y "Abrir en Google Maps".
    assert.ok(
      practica.includes(`<iframe src="${MUSEO_MAXIMO.mapaEmbedUrl}" title="${contenido.contacto.mapa}" loading="lazy" class="`),
    )
    assert.match(practica, new RegExp(`<a href="${MUSEO_MAXIMO.mapaUrl}" class="inline-flex min-h-11 [^"]*">${contenido.contacto.abrirMapa}<svg `))

    // "Museo accesible": el texto del panel, en lugar de los párrafos del tablero (V4); la foto lazy; las cuatro tarjetas.
    const accesible = seccion(main, 'visitas-accesible')
    assert.ok(accesible.includes(`>${v.accesible.rotulo}</p><h2 id="visitas-accesible" class="`))
    assert.ok(accesible.includes(`>${v.accesible.titulo}</h2>`))
    assert.ok(accesible.includes(`<p>${MUSEO_MAXIMO.accesibilidad.content[0].content[0].text}</p>`))
    for (const p of v.accesible.parrafos) assert.equal(cuantas(accesible, p.texto), 0)
    // Los párrafos sin viudas (text-wrap: pretty, que se hereda; FID-02).
    assert.match(accesible, /<div class="[^"]* text-pretty [^"]*min-w-0">/)
    const [fotoAccesible] = accesible.match(/<img [^>]*>/g)
    assert.match(fotoAccesible, /loading="lazy"/)
    assert.ok(fotoAccesible.includes(`alt="${v.accesible.imagen.alt}"`))
    assert.deepEqual(titulosH3(accesible), v.accesible.tarjetas.map((t) => t.titulo))
    for (const t of v.accesible.tarjetas) assert.ok(accesible.includes(`>${t.texto}</p>`), t.titulo)

    // Lo que el tablero no trae no sale, aunque esté cargado (V1): ni la compra en la página (de estado.museo llega su
    // dirección, para el header) ni lo que el servidor mandaba antes en los datos. El aviso, las tarifas y su nota ya
    // no llegan en estado.museo (museoComun, arriba; lo prueban museo.test.js y ssr.test.js): se buscan igual.
    const noVa = [
      MUSEO_MAXIMO.aviso.texto,
      ...MUSEO_MAXIMO.tarifas.map((t) => t.nombre),
      '$ 3.000',
      'Gratis',
      MUSEO_MAXIMO.notaTarifas,
      MUSEO_MAXIMO.compra.url,
      'data-entradas',
      'Las líneas de ejemplo',
      'No se pueden tocar',
      'AVISO VIEJO',
      'COMPRA VIEJA',
      'compra-vieja',
      'NOTA VIEJA',
      'NOTA DE HORARIOS VIEJA',
      'TARIFA VIEJA',
      'NOTA DE TARIFAS VIEJA',
      'COMO LLEGAR VIEJO',
      'NORMAS VIEJAS',
    ]
    for (const texto of noVa) assert.equal(cuantas(main, texto), 0, texto)
    // Todos los enlaces del <main> miden 44 px de alto; los íconos son dibujo (aria-hidden), las fotos tienen su alt.
    const enlaces = main.match(/<a [^>]*>/g)
    assert.equal(enlaces.length, 4)
    for (const a of enlaces) assert.match(a, /class="inline-flex min-h-11 /, a)
    const iconos = main.match(/<svg [^>]*>/g)
    assert.equal(iconos.length, 3 + 4 + 2)
    for (const svg of iconos) assert.match(svg, /aria-hidden="true" focusable="false"/)
    for (const img of main.match(/<img [^>]*>/g)) assert.match(img, /alt="[^"]+"/)
  })

  test('Visitas con el museo vacío: sin "Información práctica" (ni su rótulo); "Museo accesible" con los párrafos del tablero', () => {
    const v = contenido.visitas
    const html = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } })
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.ok(main.includes(`>${v.hero.titulo}</h1>`))
    for (const fuera of ['visitas-practica', v.practica.rotulo, v.practica.titulo, '<iframe', '<address', 'tel:', 'mailto:']) {
      assert.equal(cuantas(main, fuera), 0, fuera)
    }
    // Los dos párrafos del tablero, el segundo en gris como en el tablero; las cuatro tarjetas.
    const accesible = seccion(main, 'visitas-accesible')
    const [primero, segundo] = v.accesible.parrafos
    assert.ok(accesible.includes(`<p>${primero.texto}</p><p class="text-muted">${segundo.texto}</p>`))
    assert.deepEqual(titulosH3(accesible), v.accesible.tarjetas.map((t) => t.titulo))
    // Ningún enlace en el <main> (sin datos no hay tarjetas ni mapa).
    assert.equal(cuantas(main, '<a '), 0)
  })

  test('Visitas: cada tarjeta solo con sus datos; el mapa solo el de Google; sin ninguna ni mapa, la sección no se dibuja (V5, V6)', () => {
    const { direccion, horarios, contacto } = contenido.visitas.practica
    // La sección "Información práctica" con este museo (lo demás vacío), o null si no se dibuja.
    const practica = (museo) => {
      const main = delMain(pagina({ pagina: 'visitas', ruta: '/visitas', museo: { ...MUSEO_VACIO, ...museo } }))
      return main.includes('aria-labelledby="visitas-practica"') ? seccion(main, 'visitas-practica') : null
    }
    // Nada cargado: sin la sección ni su rótulo.
    assert.equal(practica({}), null)
    // Solo la localidad: la tarjeta Dirección con ese renglón.
    let html = practica({ localidad: 'San Juan' })
    assert.deepEqual(titulosH3(html), [direccion])
    assert.ok(html.includes('<address class="not-italic"><span class="block">San Juan</span></address>'))
    // Solo el horario; sin ningún día abierto (lo que deja la migración) no hay tarjeta (sería inventar "cerrado").
    assert.deepEqual(titulosH3(practica({ horarios: MUSEO_MAXIMO.horarios })), [horarios])
    const cerrados = MUSEO_MAXIMO.horarios.map((d) => ({ ...d, abierto: false, franjas: [] }))
    assert.equal(practica({ horarios: cerrados }), null)
    // Todos los días con el mismo horario.
    const todos = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ dia: d, abierto: true, franjas: [{ abre: '10:00', cierra: '18:00' }], nota: null }))
    assert.ok(practica({ horarios: todos }).includes('<li>Todos los días: 10:00\u00a0a\u00a018:00</li>'))
    // Solo el teléfono: con tel: si es un número; si no ("4200000 / 4200001"), como texto.
    html = practica({ telefono: '+54 264 000-0000' })
    assert.deepEqual(titulosH3(html), [contacto])
    assert.match(html, /href="tel:\+542640000000"/)
    html = practica({ telefono: '4200000 / 4200001' })
    assert.ok(html.includes('<p>4200000 / 4200001</p>'))
    assert.equal(cuantas(html, 'href="tel:'), 0)
    // Solo el correo; uno que no sirve para un mailto: no se dibuja (ni la tarjeta).
    assert.match(practica({ emailPublico: 'museo@example.com' }), /href="mailto:museo@example\.com"/)
    assert.equal(practica({ emailPublico: 'no es un correo' }), null)
    // El texto de Contacto sube 8 px solo si empieza con un enlace (44 de alto, el texto 28): así su primer renglón queda
    // a la altura del de las otras tarjetas.
    assert.match(practica({ telefono: '+54 264 000-0000' }), /<div class="[^"]* -mt-2 flex flex-col items-start">/)
    assert.match(practica({ emailPublico: 'museo@example.com' }), /<div class="[^"]* -mt-2 flex flex-col items-start">/)
    assert.doesNotMatch(practica({ telefono: '4200000 / 4200001', emailPublico: 'museo@example.com' }), /-mt-2/)
    // El mapa: solo el src de "Insertar mapa" de Google Maps (lo único que deja la CSP); otro, nada.
    html = practica({ mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=1' })
    assert.deepEqual(titulosH3(html), [])
    assert.match(html, /<iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=1" title="[^"]+" loading="lazy"/)
    assert.equal(cuantas(html, contenido.contacto.abrirMapa), 0)
    assert.equal(practica({ mapaEmbedUrl: 'https://example.com/maps/embed?pb=1' }), null)
    assert.equal(practica({ mapaEmbedUrl: 'javascript:alert(1)' }), null)
    // Solo "Abrir en Google Maps" (https): el enlace solo, sin el mapa; con http, nada.
    html = practica({ mapaUrl: 'https://example.com/mapa' })
    assert.equal(cuantas(html, '<iframe'), 0)
    assert.match(html, /<p><a href="https:\/\/example\.com\/mapa" class="inline-flex min-h-11 /)
    assert.equal(practica({ mapaUrl: 'http://example.com/mapa' }), null)
    // Con una o dos tarjetas, en el orden del tablero.
    assert.deepEqual(titulosH3(practica({ localidad: 'San Juan', emailPublico: 'museo@example.com' })), [direccion, contacto])
  })

  test('Visitas: el texto "Accesibilidad" del panel con subtítulos (en h3, debajo del h2), listas y enlaces (V4)', () => {
    const v = contenido.visitas
    const texto = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Rampas y ascensor' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hay rampa en la entrada.' }] },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sillas de ruedas' }] }] }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Escribinos', marks: [{ type: 'link', attrs: { href: 'mailto:museo@example.com' } }] }],
        },
      ],
    }
    const accesible = seccion(
      delMain(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: texto } })),
      'visitas-accesible',
    )
    assert.deepEqual(titulosH3(accesible), ['Rampas y ascensor', ...v.accesible.tarjetas.map((t) => t.titulo)])
    assert.ok(accesible.includes('<p>Hay rampa en la entrada.</p>'))
    assert.match(accesible, /<ul class="list-disc pl-\[1\.25em\]"><li class="mt-3 pl-\[0\.25em\]">Sillas de ruedas<\/li><\/ul>/)
    assert.match(accesible, /<a href="mailto:museo@example\.com" class="[^"]*underline[^"]*">Escribinos<\/a>/)
    for (const p of v.accesible.parrafos) assert.equal(cuantas(accesible, p.texto), 0)
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

  // --- La Home del tablero "Web" de la diseñadora (02/11/2026): reemplaza a la landing (D1) ---

  /** Una foto del panel con sus campos públicos (la clave, 16 cifras hexadecimales). */
  const fotoDelPanel = (n) => ({
    clave: String(n % 10).repeat(16),
    ancho: 1600,
    alto: 1067,
    variantes: [480, 960, 1600],
    alt: `Portada ${n}`,
    decorativa: false,
    epigrafe: null,
    credito: null,
  })
  /** La sombra de la bajada del hero (A11Y-01): la del tablero y, pegado a las letras, un halo oscuro (ronda 2). */
  const SOMBRA_BAJADA =
    '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1/0.9),0_0_0.25em_rgb(1_1_1/0.8),0_0_0.5em_rgb(1_1_1/0.5)]'
  /** La del h1 de los hero (TITULO_HERO): la del tablero y un halo más corto. */
  const SOMBRA_H1 = '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.0625em_rgb(1_1_1/0.9),0_0_0.125em_rgb(1_1_1/0.7)]'
  /** Una tarjeta como las arma cargarHome (server/paginas.js). */
  const novedad = (n, extra = {}) => ({ titulo: `Novedad ${n}`, url: `/novedades/novedad-${n}`, resumen: `Resumen ${n}`, portada: fotoDelPanel(n), ...extra })
  const home = (novedades = [], museo = MUSEO_VACIO) => pagina({ pagina: 'home', museo, datos: { novedades } })
  const delMain = (html) => parte(html, '<main', '</main>')
  const seccion = (html, id) => parte(html, `<section aria-labelledby="${id}"`, '</section>')

  test('la Home: un solo h1 ("Un viaje a nuestros orígenes") con la bajada, la foto del hero con prioridad y nada de la landing', () => {
    const html = home()
    const { hero } = contenido.home
    assert.equal(cuantas(html, '<h1'), 1)
    assert.match(html, new RegExp(`<h1 id="home-titulo" class="[^"]*font-\\[weight:755\\][^"]*">${hero.titulo}</h1>`))
    assert.match(html, /<section aria-labelledby="home-titulo"/)
    assert.ok(html.includes(`>${hero.bajada}</p>`))
    // La foto: sin lazy y con prioridad alta (es el LCP), con su srcset hasta el original de 2394 y su alt.
    const img = new RegExp(`<img [^>]*alt="${hero.imagen.alt}"[^>]*>`).exec(html)?.[0]
    assert.ok(img, 'la foto del hero')
    assert.match(img, /fetchPriority="high"/)
    assert.doesNotMatch(img, /loading="lazy"/)
    assert.match(img, /srcSet="[^"]*2394w"/)
    assert.match(img, /sizes="\(min-width: 64rem\) max\(100vw, 1165px\), max\(100vw, 50rem\)"/)
    // El hero mide 655 como mínimo (crece con el texto: A11Y-02) y la franja va en el flujo, después de la foto, subida
    // con un margen negativo de su alto (nunca absolute: si no, tapaba la bajada con el espaciado de texto de WCAG).
    const heroHtml = seccion(html, 'home-titulo')
    assert.match(heroHtml, /<div class="relative min-h-\[28rem\] overflow-hidden lg:min-h-\[40\.9375rem\]">/)
    assert.doesNotMatch(heroHtml, /lg:h-\[40\.9375rem\]/)
    const nav = /<nav aria-label="[^"]*" class="([^"]*)"/.exec(heroHtml)?.[1]
    assert.ok(nav, 'la franja')
    assert.ok(nav.split(' ').includes('lg:-mt-[5rem]'), nav)
    assert.doesNotMatch(nav, /absolute/)
    assert.ok(clasesDe(heroHtml, /<div class="(relative mx-auto max-w-tablero [^"]*)"/).includes('lg:pb-[6.5rem]'))
    // Los tamaños en rem y sin vw (A11Y-04, ronda 2): crecen con el zoom y con la letra del navegador como el resto del
    // texto, y son los del tablero desde 32rem, así con el zoom al 200 % un escritorio (que ya es el diseño de debajo de
    // lg) los ve al doble. Desde lg la franja nunca baja de 24 px (A11Y-08). La caja, 52,5rem (840).
    const h1 = clasesDe(heroHtml, /<h1 id="home-titulo" class="([^"]*)"/)
    const bajada = clasesDe(heroHtml, /<p class="([^"]*)">[^<]*<\/p>/)
    const visita = clasesDe(heroHtml, /<a href="\/visitas" class="([^"]*)"/)
    for (const [nombre, clases, chico, grande] of [
      ['h1', h1, 'text-[2rem]', 'min-[32rem]:text-[4rem]'],
      ['bajada', bajada, 'text-[1.25rem]', 'min-[32rem]:text-[2rem]'],
      ['franja', visita, 'text-2xl', 'min-[32rem]:text-[2rem]'],
    ]) {
      assert.ok(clases.includes(chico) && clases.includes(grande), `${nombre}: ${clases.join(' ')}`)
      assert.ok(!clases.some((c) => /vw|clamp/.test(c)), `${nombre} sin vw: ${clases.join(' ')}`)
    }
    assert.ok(clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/).includes('lg:max-w-[52.5rem]'))
    assert.ok(!/vw/.test(parte(heroHtml, '<div class="relative mx-auto max-w-tablero', '</h1>')), 'sin vw en la caja ni en el h1')
    // El halo de la bajada y el del h1 (A11Y-01, ronda 2: con la sombra de la ronda 1, del 14 al 16 % del fondo que se
    // ve al lado de las letras de «Argentina» quedaba por debajo de 3:1) y el degradé que no se va con colores forzados
    // (A11Y-05).
    assert.ok(bajada.includes(SOMBRA_BAJADA), bajada.join(' '))
    assert.ok(h1.includes(SOMBRA_H1), h1.join(' '))
    assert.match(heroHtml, /<div aria-hidden="true" class="absolute inset-0 bg-\[linear-gradient[^"]* forced-color-adjust-none"><\/div>/)
    // Las secciones de la landing ya no están (D1: los componentes quedan, sin importarse).
    for (const texto of ['id="identidad"', 'id="obra"', 'id="areas"', 'sanjuaninos', 'Identidad', 'Gestión de una']) {
      assert.equal(cuantas(html, texto), 0, texto)
    }
    assert.equal(cuantas(html, 'Contenido pendiente'), 0)
    assert.equal(cuantas(html, 'href="./"'), 0)
    // Las secciones de la Home, en orden (sin novedades no hay carrusel).
    const orden = ['home-titulo', 'galeria-titulo', 'mapa-titulo'].map((id) => html.indexOf(`aria-labelledby="${id}"`))
    assert.ok(orden.every((i, n) => i > 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    assert.equal(cuantas(html, 'novedades-titulo'), 0)
  })

  test('la franja de accesos: "Planificá tu visita"; "Tickets" solo con la compra; "Recursos educativos" cuando exista Educación; nunca "Tienda virtual"', () => {
    const { accesos } = contenido.home
    const franja = (html) => parte(html, `<nav aria-label="${accesos.etiqueta}"`, '</nav>')
    const enlaces = (html) => [...franja(html).matchAll(/<a href="([^"]*)"([^>]*)>([^<]*)<\/a>/g)].map((m) => [m[1], m[3]])
    // Sin compra: solo Visitas, en celeste.
    let html = home()
    assert.deepEqual(enlaces(html), [['/visitas', accesos.visita]])
    assert.match(franja(html), /class="[^"]*bg-celeste/)
    // Con la compra activa: "Tickets" (el texto del botón del header, no el que cargó el museo), en bordó, medido por la
    // analítica (data-entradas).
    html = home([], MUSEO_MAXIMO)
    assert.deepEqual(enlaces(html), [
      ['/visitas', accesos.visita],
      [MUSEO_MAXIMO.compra.url, contenido.navegacion.entradas],
    ])
    assert.match(franja(html), /<a href="https:\/\/example.com\/entradas" data-entradas="" class="[^"]*bg-bordo/)
    // "Recursos educativos" aparece sola el día que exista la página de Educación, con la dirección del menú.
    try {
      tabla.PAGINAS.educacion = async () => ({ default: () => null })
      html = home([], MUSEO_MAXIMO)
      assert.deepEqual(enlaces(html).map(([href]) => href), ['/visitas', MUSEO_MAXIMO.compra.url, '/educacion'])
      assert.match(franja(html), /<a href="\/educacion" class="[^"]*bg-naranja[^"]*">Recursos educativos<\/a>/)
    } finally {
      delete tabla.PAGINAS.educacion
    }
    assert.equal(cuantas(home([], MUSEO_MAXIMO), 'Tienda virtual'), 0)
    // Sin ningún acceso (sin Visitas ni compra), sin franja.
    const visitas = tabla.PAGINAS.visitas
    try {
      delete tabla.PAGINAS.visitas
      assert.equal(cuantas(home(), `aria-label="${accesos.etiqueta}"`), 0)
    } finally {
      tabla.PAGINAS.visitas = visitas
    }
  })

  test('Novedades: sin novedades no hay sección; con una, la tarjeta sin botones; con seis, el carrusel con "1/6" listo para hidratar', () => {
    const textos = contenido.home.novedades
    assert.equal(cuantas(home([]), textos.verTodas), 0)
    // Una sola: la sección, la tarjeta y "Ver todas las novedades", sin flechas ni contador.
    const una = seccion(home([novedad(1)]), 'novedades-titulo')
    assert.match(una, new RegExp(`<h2 id="novedades-titulo"[^>]*>${textos.titulo}</h2>`))
    assert.ok(una.includes(`>${textos.bajada}</p>`))
    assert.match(una, new RegExp(`<a href="/novedades" class="[^"]*">${textos.verTodas}<svg`))
    assert.equal(cuantas(una, '<li '), 1)
    assert.equal(cuantas(una, '<button'), 0)
    // Seis: en el orden en que llegan, cada una con su enlace (el título, estirado sobre la tarjeta) y "leer más" a la
    // vista pero no para el lector (si no, seis "leer más" iguales).
    const seis = [1, 2, 3, 4, 5, 6].map((n) => novedad(n))
    const html = seccion(home(seis), 'novedades-titulo')
    const titulos = [...html.matchAll(/<h3 [^>]*><a href="([^"]*)" class="[^"]*after:absolute after:inset-0[^"]*">([^<]*)<\/a><\/h3>/g)]
    assert.deepEqual(titulos.map((m) => m[1]), seis.map((n) => n.url))
    assert.deepEqual(titulos.map((m) => m[2]), seis.map((n) => n.titulo))
    assert.match(html, /<h3 class="[^"]*font-mono[^"]*uppercase/)
    // El h2 y el título de las tarjetas, en rem y con el tamaño del tablero desde 32rem (no desde lg): con el zoom al
    // 200 % un escritorio ya es el diseño de debajo de lg (A11Y-04, ronda 2).
    const h2 = clasesDe(html, /<h2 id="novedades-titulo" class="([^"]*)"/)
    assert.ok(h2.includes('text-[2.25rem]') && h2.includes('min-[32rem]:text-[4rem]'), h2.join(' '))
    assert.ok(!h2.some((c) => /vw|clamp/.test(c)), h2.join(' '))
    const h3 = clasesDe(html, /<h3 class="([^"]*)"/)
    assert.ok(h3.includes('min-[32rem]:text-2xl') && h3.includes('min-[32rem]:leading-8'), h3.join(' '))
    assert.ok(!h3.some((c) => c.startsWith('lg:')), h3.join(' '))
    assert.equal(html.match(new RegExp(`<p aria-hidden="true"[^>]*>${textos.leerMas}</p>`, 'g')).length, 6)
    for (const n of seis) assert.ok(html.includes(`>${n.resumen}</p>`), n.resumen)
    // Las portadas: las fotos del panel con su srcset real y su alt, lazy (no son del primer pantallazo).
    const imgs = html.match(/<img [^>]*>/g)
    assert.equal(imgs.length, 6)
    assert.match(imgs[0], /srcSet="\/fotos\/1111111111111111\/480.webp 480w, \/fotos\/1111111111111111\/960.webp 960w, \/fotos\/1111111111111111\/1600.webp 1600w"/)
    assert.match(imgs[0], /alt="Portada 1"/)
    for (const img of imgs) assert.match(img, /loading="lazy"/)
    // La fila: scroll nativo con snap, sin que Lenis tome los gestos horizontales.
    const fila = /<ul id="([^"]+)" aria-label="([^"]+)" data-lenis-prevent-horizontal="" class="([^"]*)"/.exec(html)
    assert.ok(fila, 'la fila de tarjetas')
    assert.equal(fila[2], textos.lista)
    assert.ok(fila[3].split(' ').includes('overflow-x-auto'), fila[3])
    // Antes de hidratar la fila no tiene snap: lo pone el efecto. Sin JavaScript (noscript: @media (scripting: none)) las
    // tarjetas van en renglones, todas a la vista: en una fila con scroll el foco en una tarjeta cortada quedaba a medias
    // (A11Y-06).
    for (const clase of ['snap-x', 'snap-mandatory']) assert.ok(!fila[3].split(' ').includes(clase), clase)
    for (const clase of ['noscript:flex-wrap', 'noscript:overflow-visible']) assert.ok(fila[3].split(' ').includes(clase), clase)
    assert.equal(cuantas(html, 'snap-start'), 6)
    // Anterior y Siguiente con nombre, sobre la fila; el contador "1/6" (dibujo) y la región viva, vacía hasta el primer
    // Anterior o Siguiente (A11Y-03: no avisa con cada scroll). Antes de hidratar la fila de los botones está invisible
    // (sin JavaScript no hacen nada).
    const botones = [...html.matchAll(/<button type="button" aria-controls="([^"]+)" aria-disabled="(true|false)"[^>]*>[\s\S]*?<span class="sr-only">([^<]*)<\/span><\/button>/g)]
    assert.deepEqual(botones.map((b) => [b[1], b[2], b[3]]), [
      [fila[1], 'true', textos.anterior],
      [fila[1], 'false', textos.siguiente],
    ])
    assert.match(html, /<div class="mt-6 flex items-center justify-end gap-2[^"]* invisible">/)
    // renderToStaticMarkup no separa los textos con <!-- --> (el render del servidor sí).
    assert.match(html, /<p aria-hidden="true" class="[^"]*">1(<!-- -->)?\/(<!-- -->)?6<\/p>/)
    assert.ok(html.includes('<p aria-live="polite" class="sr-only"></p>'), 'la región viva, vacía')
    assert.equal(cuantas(html, textos.contador(1, 6)), 0)
  })

  test('Novedades: una sin portada va sin foto; lo largo se parte; el título mantiene sus mayúsculas y minúsculas', () => {
    const largo = `Título${'x'.repeat(150)}`
    const html = seccion(home([novedad(1, { portada: null, titulo: largo }), novedad(2)]), 'novedades-titulo')
    const tarjetas = html.split('<article').slice(1)
    assert.equal(tarjetas.length, 2)
    assert.equal(cuantas(tarjetas[0], '<img'), 0)
    assert.equal(cuantas(tarjetas[1], '<img'), 1)
    // Sin foto, el título no deja el aire de la foto arriba.
    assert.match(tarjetas[0], /<h3 class="order-2 [^"]*uppercase wrap-break-word[^"]*">/)
    assert.doesNotMatch(/<h3 class="([^"]*)"/.exec(tarjetas[0])[1], /\bmt-6\b/)
    assert.match(/<h3 class="([^"]*)"/.exec(tarjetas[1])[1], /\bmt-6\b/)
    // El texto va tal cual (las mayúsculas las pone el CSS).
    assert.ok(tarjetas[0].includes(`>${largo}</a>`))
  })

  test('"El MuPa en imágenes" y "Mapa del Museo": los títulos, las cinco fotos, las piedritas decorativas y los nombres del plano como texto', () => {
    const html = home()
    const { galeria, mapa } = contenido.home
    const fotos = seccion(html, 'galeria-titulo')
    assert.match(fotos, new RegExp(`<h2 id="galeria-titulo" class="[^"]*text-center">${galeria.titulo}</h2>`))
    assert.match(fotos, /<section aria-labelledby="galeria-titulo" class="[^"]*overflow-x-clip/)
    assert.match(fotos, /id="identidad-collage"/)
    for (const f of contenido.identidad.collage) assert.ok(fotos.includes(`alt="${f.alt}"`), f.alt)
    // Hasta que arranca el efecto (sin hidratar, o si el JavaScript no llega) la caja lleva collage-espera y no
    // data-efecto: se ve solo la foto del fondo y las otras no tapan el título del mapa (A11Y-07, ronda 2). data-efecto
    // lo pone el efecto en el navegador, nunca el servidor.
    const caja = clasesDe(fotos, /<div data-caja="true" class="([^"]*)"/)
    assert.ok(caja.includes('collage-espera'), caja.join(' '))
    assert.equal(cuantas(html, 'data-efecto'), 0)
    // Los títulos, en rem y con el tamaño del tablero desde 32rem (A11Y-04, ronda 2).
    const h2 = clasesDe(fotos, /<h2 id="galeria-titulo" class="([^"]*)"/)
    assert.ok(h2.includes('min-[32rem]:text-[4rem]') && !h2.some((c) => /vw|clamp/.test(c)), h2.join(' '))
    // Las dos piedritas: el mismo SVG, decorativas (sin alt, en un envoltorio aria-hidden), lazy y solo desde lg.
    const piedritas = parte(fotos, '<div aria-hidden="true" class="pointer-events-none absolute', '</div>')
    assert.match(piedritas, /hidden[^"]* lg:block/)
    const imgs = piedritas.match(/<img [^>]*>/g)
    assert.equal(imgs.length, 2)
    for (const img of imgs) {
      assert.match(img, /alt=""/)
      assert.match(img, /loading="lazy"/)
      assert.ok(img.includes(`src="${galeria.patron}"`), img)
    }
    assert.match(imgs[1], /rotate-180/)
    // Ancladas a los bordes de la página, no al cuadro de 1440 (FID-03): el envoltorio no tiene max-w-tablero.
    assert.doesNotMatch(/<div aria-hidden="true" class="([^"]*)"/.exec(piedritas)[1], /max-w-tablero|mx-auto/)
    // Sin Novedades la galería va pegada al hero: la piedrita de arriba arranca en el borde de la sección (PAN-03); con
    // Novedades sube 87 px, como en el tablero.
    assert.match(imgs[0], /class="absolute top-0 left-\[-14\.1875rem\]/)
    const conNovedades = parte(seccion(home([novedad(1)]), 'galeria-titulo'), '<div aria-hidden="true" class="pointer-events-none absolute', '</div>')
    assert.match(conNovedades.match(/<img [^>]*>/g)[0], /class="absolute top-\[-5\.4375rem\] left-\[-14\.1875rem\]/)
    // El plano: su alt y, para el lector, los catorce espacios como texto, en orden.
    const plano = seccion(html, 'mapa-titulo')
    assert.match(plano, new RegExp(`<h2 id="mapa-titulo" class="[^"]*text-center">${mapa.titulo}</h2>`))
    assert.match(plano, new RegExp(`<img src="${mapa.imagen.src}" alt="${mapa.imagen.alt}" width="883" height="812" loading="lazy"`))
    const lista = parte(plano, `<ul aria-label="${mapa.etiqueta}" class="sr-only">`, '</ul>')
    assert.deepEqual([...lista.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), mapa.espacios)
    assert.equal(mapa.espacios.length, 14)
    assert.ok(mapa.espacios.includes('Jardín Triásico'))
  })
})

describe('src/analitica.js: el origen de "clic_entradas" (D14)', () => {
  test('menu en el header (también el menú del celular), home en la franja de la Home, pagina en las demás', () => {
    const enlace = (enHeader) => ({ closest: (selector) => (selector === 'header' && enHeader ? {} : null) })
    assert.equal(origenDeEntradas(enlace(true), 'home'), 'menu')
    assert.equal(origenDeEntradas(enlace(true), 'visitas'), 'menu')
    assert.equal(origenDeEntradas(enlace(false), 'home'), 'home')
    assert.equal(origenDeEntradas(enlace(false), 'visitas'), 'pagina')
  })
})

describe('src/components/avisoCarrusel.js: la región viva del carrusel de Novedades (A11Y-03 y R1-01)', () => {
  // Un reloj falso: ahora() devuelve el tiempo que se le pone y programar() guarda las tareas para correrlas a mano.
  const preparar = () => {
    const escrito = []
    const reloj = { t: 1000, tareas: [] }
    const avisador = crearAvisador({
      escribir: (texto) => escrito.push(texto),
      ahora: () => reloj.t,
      programar: (fn, ms) => {
        const tarea = { fn, cuando: reloj.t + ms, hecha: false }
        reloj.tareas.push(tarea)
        return tarea
      },
      cancelar: (tarea) => {
        tarea.hecha = true
      },
    })
    const avanzar = (ms) => {
      reloj.t += ms
      for (const tarea of reloj.tareas) {
        if (!tarea.hecha && tarea.cuando <= reloj.t) {
          tarea.hecha = true
          tarea.fn()
        }
      }
    }
    return { escrito, avisador, avanzar }
  }

  test('el primer aviso se escribe en cuanto la fila llega (la región estaba vacía)', () => {
    const { escrito, avisador } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    assert.deepEqual(escrito, ['Novedad 2 de 6'])
  })

  test('aunque el aviso nuevo diga lo mismo que el anterior, el botón vacía la región y lo vuelve a escribir', () => {
    const { escrito, avisador, avanzar } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    avanzar(1000)
    avisador.pedido()
    avanzar(300)
    avisador.llegada('Novedad 2 de 6', 533)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 2 de 6'])
  })

  test('R1-01: Siguiente, la fila a mano al principio y Siguiente otra vez vuelve a avisar "Novedad 2 de 6"', () => {
    const { escrito, avisador, avanzar } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    avanzar(2000)
    // A mano (el trackpad, el dedo): la región se vacía, sin avisar nada (un texto que se va no se anuncia).
    avisador.movida(300)
    avisador.movida(0)
    assert.deepEqual(escrito, ['Novedad 2 de 6', ''])
    avanzar(2000)
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 2 de 6'])
  })

  test('cada botón vacía la región y el aviso se escribe al menos 100 ms después (con reduced-motion la fila llega enseguida)', () => {
    const { escrito, avisador, avanzar } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    avanzar(5000)
    // Siguiente y la fila llega en el cuadro siguiente: el aviso espera hasta completar los 100 ms.
    avisador.pedido()
    assert.deepEqual(escrito, ['Novedad 2 de 6', ''])
    avanzar(16)
    avisador.llegada('Novedad 3 de 6', 1066)
    assert.deepEqual(escrito, ['Novedad 2 de 6', ''], 'todavía no')
    avanzar(ESPERA_MS - 17)
    assert.deepEqual(escrito, ['Novedad 2 de 6', ''], 'todavía no')
    avanzar(1)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 3 de 6'])
    // Con un scroll suave (más de 100 ms) se escribe en cuanto llega.
    avanzar(2000)
    avisador.pedido()
    avanzar(450)
    avisador.llegada('Novedad 4 de 6', 1599)
    assert.deepEqual(escrito.slice(-2), ['', 'Novedad 4 de 6'])
  })

  test('un botón nuevo antes de que se escriba el aviso anterior lo cancela; la fila quieta en su lugar no vacía nada', () => {
    const { escrito, avisador, avanzar } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    avanzar(1000)
    avisador.pedido()
    avanzar(10)
    avisador.llegada('Novedad 3 de 6', 1066)
    avisador.pedido()
    avanzar(500)
    avisador.llegada('Novedad 4 de 6', 1599)
    avanzar(1000)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 4 de 6'])
    // El snap o el redondeo del scroll (2 px o menos) no la vacían; tampoco la mano antes de un aviso escrito.
    avisador.movida(1600)
    avisador.movida(1597)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 4 de 6'])
  })

  test('mientras espera, la mano no borra lo que todavía no se escribió; cerrar() corta lo pendiente', () => {
    const { escrito, avisador, avanzar } = preparar()
    avisador.pedido()
    avisador.llegada('Novedad 2 de 6', 533)
    avanzar(1000)
    avisador.pedido()
    avanzar(10)
    avisador.llegada('Novedad 3 de 6', 1066)
    avisador.movida(900)
    avanzar(ESPERA_MS)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 3 de 6'])
    avisador.pedido()
    avanzar(10)
    avisador.llegada('Novedad 4 de 6', 1599)
    avisador.cerrar()
    avanzar(1000)
    assert.deepEqual(escrito, ['Novedad 2 de 6', '', 'Novedad 3 de 6', ''])
  })
})
