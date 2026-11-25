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
// accesos (Visitas, "Tickets" solo con la compra, "Recursos educativos" con la página de Educación, nunca "Tienda
// virtual"), el carrusel de Novedades con 0, 1 y 6 tarjetas (el orden, sin portada sin foto, los botones y el contador
// listos para hidratar; desde el 17/11/2026, sin el contador: Q, abajo), "El MuPa en imágenes" con sus piedritas
// decorativas, el plano con los nombres como texto y el
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
// ListaTarifas y TablaHorarios quedan sin usar, sin borrar (C1, 09/11/2026), y se prueban solos.
// Desde el rediseño de Exposiciones, Novedades y sus fichas con el lenguaje del tablero (04/11/2026, decisiones R1 a
// R7): las listas con el hero de las páginas internas (la foto con prioridad, sus cuatro anchos y su punto de interés)
// y sobreFoto; cada sección con su rótulo y su h2; las tarjetas con la etiqueta, la fecha y el resumen, todas las fotos
// lazy (la del LCP es la del hero) y, desde el ajuste del LCP del 05/11/2026, con prioridad baja (también las de las
// salas y las de las galerías); las salas con su ancla, su h3 y la portada entera; la paginación con flechas, solo
// con más de una página; y las fichas sin hero ni sobreFoto, con el título arriba, la portada entera con prioridad y su
// tope de alto, los datos de la actividad y la galería con su rótulo. Lo que no está no se dibuja.
// Desde el rediseño de Contacto y la 404 (05/11/2026, R1 a R4): Contacto con el hero y sobreFoto, los datos como las
// tarjetas de información de Visitas (en un <dl>, con su ícono, solo los cargados), el mapa de 1280x400 con "Abrir en
// Google Maps" y el formulario con los campos, el botón y los avisos del tablero en todos sus estados (errores, 429,
// 503 con el cuadro de solo lectura, "Recibimos tu mensaje"); la 404 como las fichas, con el título sin foto y las
// secciones como enlaces con flecha.
// Desde Divulgación (06/11/2026, DV1 a DV10): Divulgación en el menú, el del celular, el pie y la 404, con aria-current;
// su hero con la bajada (el texto a 168, la caja de 932, la bajada a 16 con el halo) y sobreFoto; "Últimas noticias"
// con 0, 1 y 6 novedades; los cuatro bloques de texto y foto y el newsletter con los textos del tablero; ningún control
// sin destino (DV9: "Coordinar visita" a Contacto, y como texto sin esa página; las actividades y los "enlaces" de las
// tarjetas, como texto); el límite de los guiones en los h1 de los hero (DV4) y HeroPagina sin bajada como antes.
// Desde la versión de celular (10/11/2026, decisiones M1 a M5 y O2; acá, el marco): abreElDia con fechas fijas; la
// barra de hoy con abiertoHoy true, false y sin dato (dos veces, sin ids ni región viva, solo debajo de lg) y su enlace
// a la tarjeta Horarios de Visitas; el header con la fila de 73, el botón del menú como ícono con su nombre accesible
// y oculto sin JavaScript; el menú abierto con los renglones del cuadro, la línea desde el segundo, la sección actual
// y "Tickets" a todo el ancho solo con la compra; el logo con las medidas del cuadro y su corte en 20rem; el pie con
// 16 entre bloques y las listas en dos columnas (en una si no entran, con la letra agrandada); y el lugar del marco
// (10,0625rem debajo de lg) en la Home, los hero, las fichas y la 404. Un solo HTML para todos los anchos: lo de
// celular y lo de escritorio los elige el CSS.
// Y la base compartida de celular (el mismo día): el hero de las ocho páginas internas con la caja de 350 y el texto
// abajo debajo de 32rem (arriba desde ahí), el degradé del cuadro y la posición de celular de la foto solo donde hace
// falta (El Museo, Contacto y Educación); el h1 de las internas en 28/32 debajo de 32rem con el halo en rem, y la
// bajada en 16/24; el h2 en 36/48 debajo de 32rem, y el rótulo a 16 del h2 debajo de lg (Seccion.jsx y los cinco
// escritos a mano).
// Y la corrección (11 y 12/11/2026): los arreglos de la verificación de la versión de celular (la barra, el menú, el
// pie, los respaldos del h1 de los hero debajo de lg, los halos de la Home de 32rem a lg, la foto de celular hasta
// 32rem, la pila contra el margen, la foto del patio, la fila de documentales y los controles de los carruseles), cada
// uno en su prueba, con el VMAR, VHOM, VMUS, VREG, VA11 o VREN de su hallazgo; y, en la segunda ronda, la bajada de
// Divulgación balanceada debajo de 32rem (RV-01).
// Y la Home de celular (el mismo día): el hero con la caja de 500 y el texto abajo, la foto de celular en un <picture>
// con sus dos precargas (cada una con su media), el h1 en 28/32 balanceado y la bajada en 16/24; la franja apilada con
// el orden y los colores del cuadro (los fondos y el <li> de "Tickets", comparados enteros); la tarjeta del carrusel de
// a una por pantalla (también en Divulgación); la pila de fotos con su z-index debajo de md y el abanico desde md; y el
// plano sin nombres en un <picture>, con las capas del hover fuera del celular, y su SVG contra el de escritorio.
// Y la tanda 1 de detalles (16/11/2026, T4, T6 y T7): la tarjeta de los documentales de El Museo con el tope de la de
// Novedades debajo de md (y el ancho entero sin JavaScript y al imprimir) y el sizes de sus fotos; "Recursos
// educativos" de la franja de la Home a su sección (/educacion#educacion-recursos, con el id de content.js), que existe
// en la página de Educación, y el h2 de SeccionRecursos con su margen de scroll; y el alt de las fotos de relleno
// repetidas de Divulgación y de Circuitos, vacío (solo la primera de cada página lo conserva).
// Y la tanda 1b (16/11/2026, G): el recorrido de "El MuPa en imágenes", uno solo para todos los anchos (16rem por foto
// que sale y una cola del 30 % de la pantalla, sin variantes lg:), y que no vuelvan los 24,2rem y el 45 % del celular.
// Y las flechas a los costados del carrusel de Novedades (16/11/2026, F; FlechasCarrusel.jsx), en la Home y en
// Divulgación: «Anterior» y «Siguiente» una sola vez, después de la lista, con su nombre y aria-controls, en la capa
// sobre la fila (con la guía, que mide lo que la foto de la tarjeta) y ocultos hasta medir; abajo, el contador solo, en
// un <span>, sin botones (hasta el 17/11/2026: ver Q, abajo); con una tarjeta sin portada, los controles de siempre
// abajo (ControlesCarrusel.jsx); los estados de FlechasCarrusel y de la región viva (AvisoCarrusel; hasta el 17/11,
// ContadorCarrusel), sueltos; y El Museo, igual que antes. Y su corrección (17/11/2026, VFU-02, VFU-05, VFC-04 y VFC-05
// de la verificación): las clases de cada botón y de la guía, comparadas enteras (con la flecha tenue al 45 % y el
// cursor), y el gesto del dedo sobre una flecha (gestoDelDedo), que solo cuenta el dedo. Y el contador de abajo, que se
// fue (17/11/2026, decisión Q del desarrollador): con las flechas a los costados, abajo de la fila no queda nada (ni el
// contador ni ninguna fila: la sección termina con el envoltorio de la fila) y la región viva, la misma, va en ese
// envoltorio, después de las flechas, vacía y una sola vez; con una tarjeta sin portada, los controles de abajo, como
// antes.
// Y la audioguía (24/11/2026; especificación de las audioguías, versión 2, 5, 6 y 9.3): la página en la tabla de
// páginas y fuera de navegacion (ni menú, ni pie, ni 404), sus textos de content.js, la página sin acceso (con los cuatro
// motivos y con datos {}) y con acceso en las dos versiones (el bloque de versión con un solo enlace, «Ir a…», el
// índice al h2 enfocable de cada espacio, las listas con role="list", los 13 h2 distintos, el espacio actual con una
// sola marca, cada estación con su h3, su duración, su <audio preload="none">, su aviso y su transcripción) y el
// page_location y el título fijos de GA4 (paginaParaGa4).
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { diaDeLaSemana, hoyEnSanJuan } from '../../compartido/fechas.js'
import { DIAS, abreElDia, resumirHorario, textoDias, textoFranjas, textoHora, unirConY } from '../../compartido/horarios.js'
import { DIAS as DIAS_DEL_ESQUEMA } from '../../compartido/esquemas/horarios.js'
import { REDES as REDES_DEL_ESQUEMA } from '../../compartido/esquemas/museo.js'
import { REDES } from '../../compartido/redes.js'
import { origenDeEntradas, paginaParaGa4, pieVisto, TITULO_AUDIOGUIA } from '../../src/analitica.js'
import { ESPERA_MS, crearAvisador } from '../../src/components/avisoCarrusel.js'
import { SALAS_DEL_PLANO } from '../../src/components/mapaSalas.js'
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

  test('abreElDia (la barra de hoy del celular, M3): con fechas fijas, lunes cerrado y martes abierto; sin horario, null', () => {
    const maximo = MUSEO_MAXIMO.horarios // lunes cerrado; de martes a domingo, abierto
    const todaLaSemana = (h) => [1, 2, 3, 4, 5, 6, 7].map((d) => abreElDia(h, d))
    // Con fechas fijas (no depende del día en que corre la prueba): el lunes 09/11/2026, el martes 10 y el domingo 15.
    assert.equal(diaDeLaSemana('2026-11-09'), 1)
    assert.equal(abreElDia(maximo, diaDeLaSemana('2026-11-09')), false)
    assert.equal(abreElDia(maximo, diaDeLaSemana('2026-11-10')), true)
    assert.equal(abreElDia(maximo, diaDeLaSemana('2026-11-15')), true)
    assert.deepEqual(todaLaSemana(maximo), [false, true, true, true, true, true, true])
    // Lo que viaja en el estado (museoComun, sin las notas) da lo mismo.
    assert.deepEqual(todaLaSemana(museoComun(MUSEO_MAXIMO).horarios), todaLaSemana(maximo))
    // El horario sin cargar (los 7 días cerrados que deja la migración), vacío o lo que no es un horario: null (la
    // barra no se dibuja), nunca "cerrado".
    const sinCargar = semana((n) => dia(n))
    assert.deepEqual(todaLaSemana(sinCargar), [null, null, null, null, null, null, null])
    assert.equal(abreElDia(MUSEO_VACIO.horarios, 2), null)
    for (const nada of [[], null, undefined, 'martes', {}]) assert.equal(abreElDia(nada, 2), null)
    // Un día que falta en la lista: no se sabe (null), no "cerrado"; los demás, como siempre.
    const sinMiercoles = maximo.filter((d) => d.dia !== 3)
    assert.equal(abreElDia(sinMiercoles, 3), null)
    assert.equal(abreElDia(sinMiercoles, 4), true)
    // Marcado abierto pero sin una franja válida: cerrado, como en el resumen.
    const sinFranja = maximo.map((d) => (d.dia === 4 ? { ...d, franjas: [f('18:00', '09:00')] } : d))
    assert.equal(abreElDia(sinFranja, 4), false)
    assert.equal(abreElDia(sinFranja, 5), true)
    // Lo que no es un día (hoy no es una fecha, un número fuera de 1 a 7, un texto): null.
    assert.equal(diaDeLaSemana('no es una fecha'), null)
    for (const noEsDia of [null, 0, 8, '2', undefined]) assert.equal(abreElDia(maximo, noEsDia), null, String(noEsDia))
    // La misma condición que la tarjeta Horarios de Visitas (resumirHorario): hay respuesta si y solo si hay resumen.
    const soloSabado = semana((n) => dia(n, n === 6 ? [f('10:00', '18:00')] : []))
    for (const h of [maximo, MUSEO_VACIO.horarios, [], sinCargar, soloSabado, sinFranja, sinMiercoles]) {
      assert.equal(todaLaSemana(h).some((r) => r !== null), resumirHorario(h).lineas.length > 0)
    }
    assert.deepEqual(todaLaSemana(soloSabado), [false, false, false, false, false, true, false])
    // La medianoche de San Juan (UTC-3): a las 23:59 del lunes 9 sigue cerrado; a las 00:01 del martes 10, abierto.
    const antes = hoyEnSanJuan(new Date('2026-11-10T02:59:00Z'))
    const despues = hoyEnSanJuan(new Date('2026-11-10T03:01:00Z'))
    assert.deepEqual([antes, despues], ['2026-11-09', '2026-11-10'])
    assert.deepEqual([abreElDia(maximo, diaDeLaSemana(antes)), abreElDia(maximo, diaDeLaSemana(despues))], [false, true])
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
    for (const nombre of ['home', 'el-museo', 'visitas', 'divulgacion', 'educacion', 'circuitos', 'exposiciones', 'muestra', 'novedades', 'novedad', 'contacto', 'audioguia', 'no-encontrada', 'rara']) {
      paginasCargadas[nombre] = await modulo.cargarPagina(nombre)
    }
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
  const SECCIONES_QUE_EXISTEN = ['/el-museo', '/visitas', '/divulgacion', '/educacion', '/circuitos', '/exposiciones', '/novedades', '/contacto']
  // Desde El Museo (06/11/2026) existen las cinco secciones del menú del tablero: ninguna futura.
  const SECCIONES_FUTURAS = []

  test('la Home con el museo vacío: header absolute, menú con las secciones que existen, pie sin redes ni compra', () => {
    const html = pagina({ pagina: 'home', museo: MUSEO_VACIO })
    assert.equal(cuantas(html, '<footer'), 1)
    assert.equal(cuantas(html, '<main id="main" tabindex="-1" class="grow">'), 1)
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
    // Divulgación (desde el 06/11/2026), en el menú ancho, en el del celular y en el pie.
    assert.equal(cuantas(html, 'href="/divulgacion"'), 3)
    assert.equal(cuantas(delHeader(html), 'href="/divulgacion"'), 2)
    // Educación (desde el 06/11/2026), en el menú ancho, en el del celular y en el pie; la franja de accesos de la Home
    // ("Recursos educativos", D11) lleva a su sección, con el ancla (desde el 16/11/2026: T6 de la tanda 1).
    assert.equal(cuantas(html, 'href="/educacion"'), 3)
    assert.equal(cuantas(delHeader(html), 'href="/educacion"'), 2)
    assert.equal(cuantas(html, 'href="/educacion#educacion-recursos"'), 1)
    assert.equal(cuantas(delHeader(html), 'href="/educacion#'), 0)
    assert.equal(cuantas(delPie(html), 'href="/educacion#'), 0)
    // Circuitos (desde el 06/11/2026), en el menú ancho, en el del celular y en el pie.
    assert.equal(cuantas(html, 'href="/circuitos"'), 3)
    assert.equal(cuantas(delHeader(html), 'href="/circuitos"'), 2)
    // El Museo (desde el 06/11/2026), primera en el menú ancho, en el del celular y en el pie.
    assert.equal(cuantas(html, 'href="/el-museo"'), 3)
    assert.equal(cuantas(delHeader(html), 'href="/el-museo"'), 2)
    for (const ruta of ['/exposiciones', '/novedades', '/contacto']) assert.equal(cuantas(html, `href="${ruta}"`), 1, ruta)
    for (const ruta of SECCIONES_FUTURAS) assert.equal(cuantas(html, `href="${ruta}"`), 0, ruta)
    // Sin el selector de idioma del tablero.
    assert.equal(cuantas(html, 'Es (Arg)'), 0)
    // El botón del menú de debajo de xl: el ícono de tres líneas con su nombre accesible, sin texto a la vista, y su
    // <dialog>. Sin JavaScript no se ve (no abriría nada): el camino son las secciones del pie.
    assert.match(
      html,
      /<div class="xl:hidden noscript:hidden"><button type="button" aria-label="Menú" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-movil" class="[^"]*"><svg [^>]*aria-hidden="true"[^>]*><path d="M5 10h30M5 20h30M5 30h30"><\/path><\/svg><\/button>/,
    )
    assert.match(html, /<dialog id="menu-movil" aria-label="Menú" data-lenis-prevent=""/)
    // Sin horario cargado (el museo vacío no lo tiene, y este estado no trae abiertoHoy), sin la barra de hoy.
    assert.equal(cuantas(html, 'data-hoy'), 0)
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
    // BotonCompra.jsx queda sin usar, sin borrar (C1), y sigue dibujando el texto que cargó el museo o el suyo.
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
    // Divulgación (desde el 06/11/2026): la suya, en el menú ancho y en el del celular, con el subrayado naranja.
    const divulgacion = header('/divulgacion')
    assert.equal(cuantas(divulgacion, 'aria-current="page"'), 2)
    assert.match(
      divulgacion,
      /<a href="\/divulgacion" aria-current="page" class="[^"]* decoration-ink [^"]*"><span class="underline decoration-naranja[^"]*">Divulgación<\/span><\/a>/,
    )
    assert.match(divulgacion, /<a href="\/visitas" class="[^"]* hover:underline">Visitas<\/a>/)
    // Educación (desde el 06/11/2026), igual.
    const educacion = header('/educacion')
    assert.equal(cuantas(educacion, 'aria-current="page"'), 2)
    assert.match(
      educacion,
      /<a href="\/educacion" aria-current="page" class="[^"]* decoration-ink [^"]*"><span class="underline decoration-naranja[^"]*">Educación<\/span><\/a>/,
    )
    // Circuitos (desde el 06/11/2026), igual.
    const circuitos = header('/circuitos')
    assert.equal(cuantas(circuitos, 'aria-current="page"'), 2)
    assert.match(
      circuitos,
      /<a href="\/circuitos" aria-current="page" class="[^"]* decoration-ink [^"]*"><span class="underline decoration-naranja[^"]*">Circuitos<\/span><\/a>/,
    )
    assert.equal(cuantas(header('/circuitos/x'), 'aria-current="true"'), 2)
    // El Museo (desde el 06/11/2026), igual (el menú dice "El Museo"; el h1, "Acerca del MuPa").
    const museo = header('/el-museo')
    assert.equal(cuantas(museo, 'aria-current="page"'), 2)
    assert.match(
      museo,
      /<a href="\/el-museo" aria-current="page" class="[^"]* decoration-ink [^"]*"><span class="underline decoration-naranja[^"]*">El Museo<\/span><\/a>/,
    )
    assert.equal(cuantas(header('/el-museo/x'), 'aria-current="true"'), 2)
    assert.equal(cuantas(header('/el-museox'), 'aria-current'), 0)
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

  test('las secciones: el menú y el pie dibujan solo las que existen; sacar la página de una la saca sola, y las demás quedan en su lugar', () => {
    const { navegacion } = contenido
    // Las secciones: los enlaces internos que no son el inicio (el logo) ni "Ir al contenido" (#main) ni la compra.
    const secciones = (enlaces) => enlaces.filter((h) => h.startsWith('/') && h !== '/')
    const delMenu = (html) => secciones(hrefs(sinDialogo(delHeader(html))))
    const delMenuMovil = (html) => secciones(hrefs(/<dialog[\s\S]*?<\/dialog>/.exec(html)[0]))
    const navDelPie = (html) => hrefs(parte(delPie(html), `<nav aria-label="${contenido.pie.secciones}"`, '</nav>'))
    // Hoy (desde El Museo, 06/11/2026): las cinco del tablero en el menú, en su orden (D3); en el pie, las del menú y
    // después las demás. Ninguna futura.
    const HOY = ['/el-museo', '/visitas', '/divulgacion', '/educacion', '/circuitos']
    let html = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })
    assert.deepEqual(delMenu(html), HOY)
    assert.deepEqual(delMenuMovil(html), HOY)
    assert.deepEqual(navDelPie(html), SECCIONES_QUE_EXISTEN)
    assert.deepEqual(navegacionDelSitio.seccionesDelMenu().map((s) => s.ruta), HOY)
    assert.ok(html.includes('>El Museo</a>'))
    const futuras = navegacion.menu.filter((s) => !Object.hasOwn(tabla.PAGINAS, s.pagina)).map((s) => s.pagina)
    assert.deepEqual(futuras, [])
    // Sin la página de El Museo (sin tocar el header ni el pie): sale del menú, del del celular, del pie y de la 404, y
    // las demás quedan en su orden.
    const elMuseo = tabla.PAGINAS['el-museo']
    try {
      delete tabla.PAGINAS['el-museo']
      html = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })
      const sinMuseo = HOY.slice(1)
      assert.deepEqual(delMenu(html), sinMuseo)
      assert.deepEqual(delMenuMovil(html), sinMuseo)
      assert.deepEqual(navDelPie(html), [...sinMuseo, '/exposiciones', '/novedades', '/contacto'])
      assert.equal(cuantas(html, 'href="/el-museo"'), 0)
      const noEncontrada = pagina({ pagina: 'no-encontrada', ruta: '/x', museo: MUSEO_VACIO })
      const main = parte(noEncontrada, '<main', '</main>')
      assert.equal(cuantas(main, 'href="/el-museo"'), 0)
      for (const ruta of sinMuseo) assert.ok(main.includes(`href="${ruta}"`), ruta)
    } finally {
      tabla.PAGINAS['el-museo'] = elMuseo
    }
    assert.deepEqual(delMenu(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO })), HOY)
    // Sin ninguna sección ni compra, el menú no se dibuja (ni el botón "Menú" del celular).
    const visitas = tabla.PAGINAS.visitas
    const divulgacion = tabla.PAGINAS.divulgacion
    const educacion = tabla.PAGINAS.educacion
    const circuitos = tabla.PAGINAS.circuitos
    const elMuseoPagina = tabla.PAGINAS['el-museo']
    try {
      delete tabla.PAGINAS['el-museo']
      delete tabla.PAGINAS.visitas
      delete tabla.PAGINAS.divulgacion
      delete tabla.PAGINAS.educacion
      delete tabla.PAGINAS.circuitos
      const vacio = renderToStaticMarkup(createElement(Header, { ruta: '/', compra: null }))
      assert.equal(cuantas(vacio, '<nav'), 0)
      assert.equal(cuantas(vacio, 'menu-movil'), 0)
      // Con la compra activa, el botón sí (y el menú del celular con él).
      const conCompra = renderToStaticMarkup(createElement(Header, { ruta: '/', compra: { url: 'https://example.com/e', texto: null } }))
      assert.equal(cuantas(conCompra, 'data-entradas'), 2)
    } finally {
      tabla.PAGINAS.visitas = visitas
      tabla.PAGINAS.divulgacion = divulgacion
      tabla.PAGINAS.educacion = educacion
      tabla.PAGINAS.circuitos = circuitos
      tabla.PAGINAS['el-museo'] = elMuseoPagina
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
    // El contenido deja el lugar del header (absolute), como las fichas: debajo de lg, la reserva del marco de celular
    // (10,0625rem); desde lg, lo de siempre.
    assert.match(main, /<main id="main" tabindex="-1" class="grow"><div class="[^"]* pt-\[10\.0625rem\] pb-16 lg:pt-52 lg:pb-20">/)
    // Desde el rediseño con el lenguaje del tablero (05/11/2026, R2): como las fichas, el título sin foto (el ancho del
    // contenido del tablero y el h1 de los hero, a la izquierda y sin sombra), el texto como bajada, "Volver al inicio"
    // con la flecha hacia atrás y las secciones como enlaces con flecha, debajo del rótulo; ninguna imagen ni sobreFoto.
    assert.match(main, /<main id="main" tabindex="-1" class="grow"><div class="mx-auto w-full max-w-tablero [^"]*lg:px-20 [^"]*">/)
    const h1 = /<h1 class="([^"]*)">([^<]*)<\/h1>/.exec(main)
    assert.equal(h1[2], contenido.noEncontrada.titulo)
    assert.match(h1[1], /font-hero .*font-\[weight:755\] \[font-stretch:130%\] text-paper/)
    assert.doesNotMatch(h1[1], /text-center|text-shadow/)
    assert.ok(main.includes(`<p class="text-lg leading-7 font-normal text-muted text-pretty mt-6">${contenido.noEncontrada.texto}</p>`))
    assert.match(main, new RegExp(`<a href="/" class="inline-flex min-h-11 [^"]*font-mono[^"]*"><svg [^>]*aria-hidden="true"[^>]*><path d="M15\\.83 10H4\\.17[^"]*"></path></svg>${contenido.noEncontrada.volver}</a>`))
    const nav = parte(main, '<nav aria-labelledby="secciones-404"', '</nav>')
    assert.match(nav, new RegExp(`<h2 id="secciones-404" class="font-mono text-sm [^"]*uppercase">${contenido.noEncontrada.secciones}</h2>`))
    const enlaces = [...nav.matchAll(/<a href="([^"]*)" class="inline-flex min-h-11 [^"]*">([^<]*)<svg [^>]*aria-hidden="true"/g)]
    assert.deepEqual(enlaces.map((m) => m[1]), SECCIONES_QUE_EXISTEN)
    assert.equal(cuantas(main, '<img'), 0)
    for (const img of sinDialogo(delHeader(html)).match(/<img [^>]*>/g)) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
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
    // La marca es el enlace al inicio y mide 44 px o más de alto sin moverse (padding y margen negativo: en el celular,
    // con la marca de 26,5 de alto, 10 arriba y abajo; desde sm, con la de 40, 6); los isotipos son una lista con
    // nombre, no enlaces.
    assert.match(home, /<a href="\/" class="-my-2\.5 block shrink-0 rounded-sm py-2\.5 sm:-my-1\.5 sm:py-1\.5 [^"]*"><img [^>]*alt="MuPa - Museo Paleontológico de San Juan"/)
    assert.match(sinDialogo(delHeader(home)), /<ul aria-label="Instituciones"[^>]*><li><img [^>]*alt="Universidad Nacional de San Juan"/)
  })

  test('las tarjetas (tablero, R4): todas las fotos lazy y con prioridad baja (la del LCP es la del hero, R1); lo largo se parte (PAG-01)', async () => {
    const { default: SeccionDeTarjetas } = await vite.ssrLoadModule('/src/components/SeccionDeTarjetas.jsx')
    const foto = (n) => ({ clave: `${n}`.repeat(16), ancho: 1600, alto: 1067, variantes: [480, 960, 1600], alt: `Foto ${n}`, decorativa: false })
    const tarjetas = [1, 2, 3].map((n) => ({ titulo: `Título ${n}`, url: `/novedades/t${n}`, portada: foto(n), resumen: 'Un resumen.' }))
    const html = renderToStaticMarkup(createElement(SeccionDeTarjetas, { id: 'x', rotulo: 'Novedades', titulo: 'X', tarjetas }))
    // Desde el hero de las listas, ninguna foto de tarjeta va con prioridad (antes, la de la primera: PAG-02), y desde
    // el ajuste del LCP (05/11/2026) van con prioridad baja: no le disputan el ancho de banda a la foto del hero (Foto.jsx).
    const imgs = html.match(/<img [^>]*>/g)
    assert.equal(imgs.length, 3)
    for (const img of imgs) {
      assert.match(img, /loading="lazy"/)
      assert.match(img, /fetchPriority="low"/)
      assert.doesNotMatch(img, /fetchPriority="high"/)
    }
    assert.equal(cuantas(html, '<li class="min-w-0">'), 3)
    assert.match(html, /<h3 class="[^"]*wrap-anywhere/)
    // El rótulo y el h2 de la sección (el lenguaje del tablero: Roboto Mono 14 y Thin 64), a 24 desde lg y a 16 debajo.
    assert.match(html, /<section aria-labelledby="x" class="py-16 lg:py-20"><div class="mx-auto w-full max-w-tablero [^"]*"><p class="font-mono text-sm [^"]*uppercase">Novedades<\/p><h2 id="x" class="font-titulo [^"]*font-thin[^"]* mt-4 lg:mt-6">X<\/h2>/)
  })

  test('la portada de una ficha: sizes con el tope de alto (PAG-03), con el ancho del contenido del tablero', async () => {
    const { tamanoPortada } = await vite.ssrLoadModule('/src/components/Ficha.jsx')
    // Vertical 1:2: 75vh × 0,5 = 37,5vh.
    assert.equal(tamanoPortada({ ancho: 1200, alto: 2400 }), '(min-width: 90rem) min(80rem, 37.5vh), min(100vw, 37.5vh)')
    // 3:2: 112,5vh.
    assert.equal(tamanoPortada({ ancho: 1500, alto: 1000 }), '(min-width: 90rem) min(80rem, 112.5vh), min(100vw, 112.5vh)')
    assert.equal(tamanoPortada({ ancho: 0, alto: 0 }), '(min-width: 90rem) 80rem, 100vw')
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
    // Sin posición de celular (con el título abajo, la punta del pincel sigue a la vista): ni la variable ni su clase.
    assert.equal(v.hero.imagen.posicionMovil, undefined)
    assert.equal(cuantas(hero, 'posicion-movil'), 0)
    // El hero entero: la caja de celular y la de escritorio, la foto, el degradé (también con colores forzados, como la
    // Home, A11Y-05) y el texto con el lugar del marco.
    comprobarHero(main, 'visitas-titulo', v.hero.titulo, v.hero.imagen)

    // "Información práctica": el rótulo, el h2 (a 24 desde lg y a 16 debajo) y las tres tarjetas en el orden del tablero.
    const practica = seccion(main, 'visitas-practica')
    assert.ok(practica.includes(`>${v.practica.rotulo}</p><h2 id="visitas-practica" class="`))
    assert.deepEqual(margenesDelH2(practica, 'visitas-practica'), ['mt-4', 'lg:mt-6'])
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
    // El correo con el corte después de la arroba (<wbr>, en un <span>: el enlace es inline-flex; BDIS-02 del cierre) y
    // el nombre del enlace en aria-label (Chrome cuenta el <wbr> como un espacio).
    assert.match(practica, /<a href="mailto:museo@example\.com" aria-label="museo@example\.com" class="inline-flex min-h-11 [^"]*"><span>museo@<wbr\/>example\.com<\/span><\/a>/)
    assert.match(practica, new RegExp(`<a href="/contacto" class="inline-flex min-h-11 [^"]*">${v.practica.irAContacto}<svg `))
    // El mapa de "Insertar mapa" (V5), con su title y lazy, y "Abrir en Google Maps".
    assert.ok(
      practica.includes(`<iframe src="${MUSEO_MAXIMO.mapaEmbedUrl}" title="${contenido.contacto.mapa}" loading="lazy" class="`),
    )
    assert.match(practica, new RegExp(`<a href="${MUSEO_MAXIMO.mapaUrl}" class="inline-flex min-h-11 [^"]*">${contenido.contacto.abrirMapa}<svg `))

    // "Museo accesible": el texto del panel, en lugar de los párrafos del tablero (V4); la foto lazy; las cuatro tarjetas.
    const accesible = seccion(main, 'visitas-accesible')
    assert.ok(accesible.includes(`>${v.accesible.rotulo}</p><h2 id="visitas-accesible" class="`))
    assert.deepEqual(margenesDelH2(accesible, 'visitas-accesible'), ['mt-4', 'lg:mt-6'])
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
    // La lista y el subtítulo, los de una columna de texto del tablero (EST-05 de la verificación del rediseño de las
    // internas): cada ítem 16/24, la viñeta un círculo crema de 6 px a 12 del texto, 12 entre ítems; el subtítulo Thin.
    assert.match(accesible, /<ul class="\[&amp;&gt;li\]:relative \[&amp;&gt;li\]:pl-\[1\.125rem\] [^"]*\[&amp;&gt;li\]:before:size-1\.5 \[&amp;&gt;li\]:before:rounded-full \[&amp;&gt;li\]:before:bg-paper forced-colors:\[&amp;&gt;li\]:before:bg-\[CanvasText\]"><li class="mt-3 text-base leading-6">Sillas de ruedas<\/li><\/ul>/)
    assert.match(accesible, /<h3 class="font-titulo [^"]*font-thin[^"]*">Rampas y ascensor<\/h3>/)
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
  /** La del h1 de los hero de antes del cuadro de celular, con el halo en em: ya no la lleva ninguno. */
  const SOMBRA_H1 = '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.0625em_rgb(1_1_1/0.9),0_0_0.125em_rgb(1_1_1/0.7)]'
  /**
   * La del h1 de los hero (el de la Home, TITULO_HERO, y el de las páginas internas, TITULO_HERO_PAGINA; desde el
   * cuadro de celular, 10/11/2026): la del tablero y un halo corto en rem (donde el h1 mide 4rem es el mismo de
   * SOMBRA_H1; debajo no se achica con la letra). Y, debajo de 32rem, la de la bajada de HeroPagina.jsx, más cerrada y
   * en rem (desde 32rem lleva SOMBRA_BAJADA; la de la Home lleva SOMBRA_BAJADA en todos los anchos).
   */
  const SOMBRA_H1_PAGINA = '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.25rem_rgb(1_1_1/0.9),0_0_0.5rem_rgb(1_1_1/0.7)]'
  const SOMBRA_BAJADA_CELULAR =
    '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125rem_rgb(1_1_1),0_0_0.25rem_rgb(1_1_1/0.9),0_0_0.5rem_rgb(1_1_1/0.8),0_0_0.75rem_rgb(1_1_1/0.6)]'
  /**
   * La caja, el degradé y el bloque del texto del hero de una página interna. Debajo de lg, los del cuadro de celular:
   * 350 como mínimo en una columna flex, con el texto abajo SOLO debajo de 32rem (los teléfonos; desde ahí, arriba,
   * como antes del celular: en tablets el título abajo pisaba el cartel de la foto de Contacto) y el degradé que llega
   * a 0 en el 142,86 % del alto; desde lg, el bloque de 480 y el degradé del tablero (109,92 %). El texto: el ancho
   * entero, la reserva del marco y 64 abajo.
   */
  const CAJA_HERO_PAGINA = 'relative flex min-h-[21.875rem] flex-col justify-end overflow-hidden min-[32rem]:justify-start lg:block lg:min-h-[30rem]'
  const DEGRADE_HERO_PAGINA =
    'absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_142.86%)] ' +
    'lg:bg-[linear-gradient(to_bottom,rgb(14_16_13/0.75),rgb(14_16_13/0)_109.92%)] forced-color-adjust-none'
  const TEXTO_HERO_PAGINA = 'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-16 md:px-10 lg:px-20'
  /** Los márgenes de arriba (con o sin variante) de una lista de clases, en su orden. */
  const margenesDeArriba = (clases) => clases.filter((c) => /(^|:)mt-/.test(c))
  /** Los del h2 de una sección, buscado por su id. */
  const margenesDelH2 = (html, id) => margenesDeArriba(clasesDe(html, new RegExp(`<h2 id="${id}" class="([^"]*)"`)))
  /** Una tarjeta como las arma cargarHome (server/paginas.js). */
  const novedad = (n, extra = {}) => ({ titulo: `Novedad ${n}`, url: `/novedades/novedad-${n}`, resumen: `Resumen ${n}`, portada: fotoDelPanel(n), ...extra })
  const home = (novedades = [], museo = MUSEO_VACIO) => pagina({ pagina: 'home', museo, datos: { novedades } })
  const delMain = (html) => parte(html, '<main', '</main>')
  const seccion = (html, id) => parte(html, `<section aria-labelledby="${id}"`, '</section>')
  /**
   * Las tarjetas del carrusel de Novedades (CarruselNovedades.jsx: la Home y Divulgación), todas con portada y resumen:
   * - debajo de lg, la del cuadro de celular: una por pantalla (el ancho del contenido, 384 como mucho), la portada en
   *   354/300 y el título y el resumen a todo el ancho de la tarjeta; 24 entre el enlace de arriba y la fila (8 de
   *   margen: el enlace mide 44 y la fila tiene 8 por dentro);
   * - desde lg, la del tablero: el 37,89 % del contenido (485 a 1440), la portada en 485/355 y el texto en una columna
   *   del 86,4 %;
   * - el título, 24/32 en todos los anchos (hasta el cuadro de celular, 20/28 debajo de 32rem);
   * - el sizes de la portada declara 320 px como mucho debajo de lg (un teléfono de densidad 3 pide la variante de 960);
   * - el título, tres renglones como mucho (RF-01, 19/11/2026): el enlace de cada tarjeta, con la lista de clases
   *   ENTERA (ENLACE_TITULO_CARRUSEL), y la fila con el lugar para el anillo del foco debajo de lg.
   */
  function comprobarTarjetasDelCarrusel(html, n) {
    const lis = [...html.matchAll(/<li class="([^"]*)"><article /g)].map((m) => m[1])
    assert.equal(lis.length, n)
    for (const li of lis) assert.equal(li, 'w-[min(100%,24rem)] shrink-0 snap-start lg:w-[min(30.3125rem,calc((100vw-10rem)*0.3789))]')
    // El enlace del título de cada tarjeta, con todas sus clases y en su orden (no clase por clase: una de más, como un
    // overflow-hidden en el h3, o una de menos, como el recorte, tienen que fallar).
    const enlaces = [...html.matchAll(/<h3 class="[^"]*"><a href="[^"]*" class="([^"]*)">/g)].map((m) => m[1].split(' '))
    assert.equal(enlaces.length, n)
    for (const clases of enlaces) assert.deepEqual(clases, ENLACE_TITULO_CARRUSEL)
    // Y el recorte, SOLO en el enlace del título (RC-01 de la verificación de RF-01, 19/11/2026): en la sección, un
    // atributo class con un line-clamp- por tarjeta, el del enlace. Sin esto pasaban un line-clamp-3 de más en el
    // resumen, en la tarjeta o en el <li> (los dos de arriba miran solo el enlace y el h3).
    const conRecorte = [...html.matchAll(/class="([^"]*)"/g)].filter((m) => /(^|[\s:])line-clamp-/.test(m[1]))
    assert.equal(conRecorte.length, n, conRecorte.map((m) => m[1]).join('\n'))
    const h3 = clasesDe(html, /<h3 class="([^"]*)"/)
    // Y el h3, sin recorte ni overflow (cortaría el anillo del foco del enlace: RF-01).
    for (const [, clases] of html.matchAll(/<h3 class="([^"]*)"><a /g)) {
      assert.deepEqual(clases.split(' ').filter((c) => /(^|:)(line-clamp|overflow|truncate)/.test(c)), [], clases)
    }
    assert.deepEqual(h3.filter((c) => /(^|:)(text-(xl|2xl)|leading-\d+|max-w-)/.test(c)), ['text-2xl', 'leading-8', 'lg:max-w-[86.4%]'])
    assert.ok(!h3.some((c) => c.startsWith('min-[')), h3.join(' '))
    assert.deepEqual(clasesDe(html, /<p class="(order-3 [^"]*)"/).filter((c) => /(^|:)max-w-/.test(c)), ['lg:max-w-[86.4%]'])
    const fotos = html.match(/<img [^>]*>/g) ?? []
    assert.equal(fotos.length, n)
    for (const img of fotos) {
      assert.deepEqual(clasesDe(img, / class="([^"]*)"/), ['order-1', 'aspect-[354/300]', 'w-full', 'rounded-xl', 'object-cover', 'lg:aspect-[485/355]'])
      assert.ok(img.includes('sizes="(min-width: 90rem) 485px, (min-width: 64rem) calc((100vw - 10rem) * 0.3789), min(calc(100vw - 3rem), 20rem)"'), img)
    }
    // Los márgenes de arriba y de abajo los lleva el envoltorio de la fila (desde las flechas a los costados,
    // 16/11/2026: la capa de las flechas se posiciona contra él, que así mide lo que la fila); la fila, ninguno.
    const fila = clasesDe(html, /<ul id="[^"]+" aria-label="[^"]+" data-lenis-prevent-horizontal="" class="([^"]*)"/)
    assert.equal(cuantas(html, '<div class="relative mt-2 -mb-2 lg:mt-4"><ul id="'), 1)
    assert.deepEqual(fila.filter((c) => /(^|:)-?m[tb]-/.test(c)), [])
    assert.ok(fila.includes('-ml-2') && fila.includes('pl-2') && fila.includes('py-2'), fila.join(' '))
    assert.deepEqual(fila.filter((c) => /(^|:)gap-/.test(c)), ['gap-6', 'lg:gap-[min(3rem,calc((100vw-10rem)*0.0375))]', 'noscript:gap-y-10'])
    // El lugar para el anillo del foco de un título recortado (RF-01, 19/11/2026): con el foco del teclado en un
    // título, debajo de lg, la fila gana 8 px a la derecha (sin eso, el anillo de un título de dos o tres renglones
    // quedaba cortado a la derecha en el celular); sin el foco, y desde lg, nada a la derecha.
    assert.deepEqual(fila.filter((c) => /(^|:)-?[mp][rx]-|has-\[/.test(c)), [
      'max-lg:has-[a:focus-visible]:-mr-2',
      'max-lg:has-[a:focus-visible]:pr-2',
    ])
    // La guía de las flechas (FlechasCarrusel.jsx): el ancho de la tarjeta y la proporción de su foto, las MISMAS
    // clases (si cambia la tarjeta y no la guía, las flechas dejan de quedar centradas en la foto). Y la lista entera:
    // una clase de más (un alto fijo) también las descentra (VFC-05).
    if (n > 1) {
      const guia = clasesDe(html, /<\/ul><div class="pointer-events-none absolute [^"]*"><div class="([^"]*)"><\/div>/)
      const medidas = (clases) => clases.filter((c) => /(^|:)(w|aspect)-\[/.test(c)).sort()
      const img = clasesDe(fotos[0], / class="([^"]*)"/)
      assert.deepEqual(medidas(guia), medidas([...lis[0].split(' '), ...img]))
      assert.deepEqual(guia, GUIA_FLECHAS)
    }
  }
  /**
   * Las clases de las flechas a los costados (FlechasCarrusel.jsx y, la guía, CarruselNovedades.jsx), escritas acá
   * ENTERAS y en su orden: las pruebas comparan la lista completa de cada botón y de la guía, no clase por clase
   * (VFC-05 de la verificación de las flechas, 16/11/2026: mirando de a una, pasaban un max-lg:hidden o un lg:hidden
   * de más en los botones —las flechas fuera del celular o del escritorio—, un hidden de más en «Siguiente» y un alto
   * fijo de más en la guía, que las descentra). Si cambia una clase del componente, cambia acá.
   * - El botón: 44x44, toma el puntero (la capa no), centrado en el alto de la guía, redondo, el fondo del sitio al
   *   75 % (al 90 % con el puntero encima) y la flecha blanca; el cursor, la mano, y el común si está deshabilitado
   *   (VFU-05); el fundido de 200 ms, que no se apaga con reduced-motion (index.css lo deja en 0,01 ms: se perdería
   *   el retardo de visibility); el contorno y el aro del foco; los colores forzados; y, deshabilitado, la flecha (no
   *   el botón) al 45 % (VFU-02: al 35 % no llegaba a 3:1 sobre una portada clara).
   * - Su borde: «Anterior» contra el izquierdo y «Siguiente» contra el derecho, a 8 px debajo de lg y a 16 desde lg.
   * - Oculta: transparente y, 0,8 s después (el retardo de visibility: el clic de más de una ráfaga no cae en la
   *   tarjeta de abajo), visibility: hidden; salvo con el foco visible.
   * - La guía: en la celda de los botones, arriba y a la izquierda, con el ancho de la tarjeta y la proporción de su
   *   foto.
   */
  const FLECHA_COSTADO = [
    'pointer-events-auto', 'col-start-1', 'row-start-1', 'grid', 'size-11', 'place-items-center', 'self-center', 'rounded-full', 'border',
    'border-transparent', 'bg-ink/75', 'text-blanco', 'cursor-pointer', '[touch-action:pan-y_pinch-zoom]',
    'transition-[opacity,visibility,background-color]', 'duration-200', 'hover:bg-ink/90', 'focus-visible:outline-2',
    'focus-visible:outline-blanco', 'focus-visible:[box-shadow:0_0_0_4px_var(--color-ink)]',
    'forced-colors:bg-[ButtonFace]', 'aria-disabled:cursor-default', 'aria-disabled:[&>svg]:opacity-45',
  ]
  const BORDE_FLECHA = [['ml-2', 'justify-self-start', 'lg:ml-4'], ['mr-2', 'justify-self-end', 'lg:mr-4']]
  const FLECHA_OCULTA = ['invisible', 'opacity-0', '[transition-delay:0s,800ms,0s]', 'focus-visible:visible', 'focus-visible:opacity-100']
  const GUIA_FLECHAS = [
    'col-start-1', 'row-start-1', 'self-start', 'justify-self-start',
    'aspect-[354/300]', 'w-[min(100%,24rem)]', 'lg:aspect-[485/355]', 'lg:w-[min(30.3125rem,calc((100vw-10rem)*0.3789))]',
  ]
  /**
   * El enlace del título de una tarjeta del carrusel de Novedades (TarjetaNovedad de CarruselNovedades.jsx), con sus
   * clases ENTERAS y en su orden. Desde el 19/11/2026 (RF-01), el título va recortado a tres renglones con «…»
   * (line-clamp-3), en el enlace y no en el h3 (el overflow del h3 cortaba el anillo del foco), ceñido al texto (w-fit:
   * un título de un renglón conserva su anillo), nunca más ancho que la columna (max-w-full: una palabra larguísima
   * se parte), con overflow: clip y 1 px de margen en vez del hidden de line-clamp-3 (con hidden, el borde suavizado de
   * la primera letra y del subrayado quedaba cortado) y, al imprimir, entero (print:line-clamp-none). Lo demás es lo de
   * siempre: el after estirado sobre la tarjeta, el subrayado con el puntero sobre la tarjeta y el anillo del foco.
   */
  const ENLACE_TITULO_CARRUSEL = [
    'line-clamp-3', 'w-fit', 'max-w-full', 'overflow-clip', '[overflow-clip-margin:1px]', 'rounded-sm', 'decoration-1',
    'underline-offset-4', 'after:absolute',
    'after:inset-0', 'group-hover:underline', 'focus-visible:outline-2', 'focus-visible:outline-offset-4',
    'focus-visible:outline-blanco', 'print:line-clamp-none',
  ]
  /**
   * Las flechas a los costados del carrusel de Novedades (FlechasCarrusel.jsx, 16/11/2026), como salen del servidor:
   * la capa sobre la fila (después de la lista, dentro de su envoltorio; no toma el puntero; ni sin JavaScript ni al
   * imprimir), con «Anterior» y «Siguiente» una sola vez, con su nombre y aria-controls a la fila, de 44x44, con el
   * puntero y ocultos hasta que el efecto mide (visibility: hidden, salvo con el foco visible); después de la capa, en
   * el mismo envoltorio, la región viva (AvisoCarrusel), vacía y una sola vez; y abajo de la fila, nada: desde el
   * 17/11/2026 (decisión Q) ni el contador ni ninguna fila, y la sección termina con el envoltorio (hasta ese día iba
   * abajo la fila del contador: el contador en un <span> y la región viva). El orden en el HTML: la lista, «Anterior»,
   * «Siguiente» y la región viva.
   */
  function comprobarFlechasALosCostados(html, total, textos) {
    const fila = /<ul id="([^"]+)" aria-label="[^"]+" data-lenis-prevent-horizontal=""/.exec(html)
    assert.ok(fila, 'la fila')
    const sinEntidades = html.replaceAll('&amp;', '&').replaceAll('&gt;', '>')
    const capa = /<\/ul><div class="([^"]*)"><div class="[^"]*"><\/div>(<button[\s\S]*?<\/button><button[\s\S]*?<\/button>)<\/div><p aria-live="polite" class="sr-only"><\/p><\/div>/.exec(sinEntidades)
    assert.ok(capa, 'la capa de las flechas y la región viva, después de la lista y dentro del envoltorio de la fila')
    assert.deepEqual(capa[1].split(' '), ['pointer-events-none', 'absolute', 'inset-x-0', 'top-2', 'z-10', 'grid', 'noscript:hidden', 'print:hidden'])
    assert.equal(cuantas(html, '<button'), 2)
    const botones = [...capa[2].matchAll(/<button type="button" aria-controls="([^"]+)" aria-disabled="(true|false)" class="([^"]*)">[\s\S]*?<span class="sr-only">([^<]*)<\/span><\/button>/g)]
    assert.deepEqual(botones.map((b) => [b[1], b[2], b[4]]), [
      [fila[1], 'true', textos.anterior],
      [fila[1], 'false', textos.siguiente],
    ])
    // Cada botón, con su lista de clases ENTERA (ni una de más ni una de menos: VFC-05): las de la flecha, las de su
    // borde y, como sale del servidor (hasta que el efecto mide), las de oculta.
    for (const [i, b] of botones.entries()) {
      const clases = b[3].split(' ')
      assert.deepEqual(clases, [...FLECHA_COSTADO, ...BORDE_FLECHA[i], ...FLECHA_OCULTA], b[4])
      // Con reduced-motion las transiciones no se apagan (index.css las deja en 0,01 ms): se perdería el retardo.
      assert.ok(!clases.some((c) => c.startsWith('motion-reduce:')), clases.join(' '))
    }
    // La región viva: una sola (dice "Novedad n de total" después de un botón), vacía, en el envoltorio de la fila.
    assert.equal(cuantas(html, 'aria-live='), 1)
    assert.equal(cuantas(html, '<p aria-live="polite" class="sr-only"></p>'), 1)
    // Abajo de la fila, nada (Q, 17/11/2026): el envoltorio de la fila, que termina con la región viva, es lo último del
    // contenedor de la sección (ninguna fila después, ni vacía ni invisible), y no hay contador "n/total" (ni en un
    // <span> ni en un <p>) en ningún lado.
    assert.equal(cuantas(sinEntidades, '<p aria-live="polite" class="sr-only"></p></div></div></section>'), 1, 'nada abajo de la fila')
    assert.equal(cuantas(html, '<span aria-hidden="true"'), 0)
    assert.equal(cuantas(html, '<p aria-hidden="true"'), cuantas(html, '<article '), 'solo los "leer más"')
    assert.doesNotMatch(html, new RegExp(`>\d+(<!-- -->)?/(<!-- -->)?${total}<`), 'sin contador')
    const orden = ['</ul>', `>${textos.anterior}</span></button>`, `>${textos.siguiente}</span></button>`, 'aria-live='].map((x) => html.indexOf(x))
    assert.ok(orden.every((x, i) => x >= 0 && (i === 0 || x > orden[i - 1])), orden.join(' '))
  }

  test('la Home: un solo h1 ("Un viaje a nuestros orígenes") con la bajada, la foto del hero con prioridad y nada de la landing', () => {
    const html = home()
    const { hero } = contenido.home
    assert.equal(cuantas(html, '<h1'), 1)
    assert.match(html, new RegExp(`<h1 id="home-titulo" class="[^"]*font-\\[weight:755\\][^"]*">${hero.titulo}</h1>`))
    assert.match(html, /<section aria-labelledby="home-titulo"/)
    assert.ok(html.includes(`>${hero.bajada}</p>`))
    // La foto: sin lazy y con prioridad alta (es el LCP), con su srcset hasta el original de 2394 y su alt. Va en un
    // <picture> que no arma caja, después del <source> de la foto de celular (el recorte vertical, debajo de 32rem, en
    // sus dos anchos y con sus medidas: hasta el 11/11/2026, 30rem, VHOM-01); la <img>, con el encuadre del tablero y,
    // debajo de 32rem, apoyada abajo.
    const heroHtml = seccion(html, 'home-titulo')
    const { movil } = hero.imagen
    assert.equal(cuantas(heroHtml, '<picture'), 1)
    assert.ok(
      heroHtml.includes(
        `<picture class="contents"><source media="(width &lt; 32rem)" srcSet="${movil.srcSet}" sizes="100vw" width="963" height="1198"/><img `,
      ),
      'el <picture> con el <source> de celular',
    )
    assert.equal(movil.media, '(width < 32rem)')
    assert.equal(hero.imagen.mediaResto, '(width >= 32rem)')
    assert.deepEqual([...movil.srcSet.matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [720, 963])
    assert.ok(movil.srcSet.includes(`${movil.src} 963w`) && movil.srcSet.includes('hero-esqueletos-movil-720'), movil.srcSet)
    assert.equal(cuantas(heroHtml, '<img '), 1)
    const img = new RegExp(`<img [^>]*alt="${hero.imagen.alt}"[^>]*>`).exec(heroHtml)?.[0]
    assert.ok(img, 'la foto del hero')
    assert.ok(heroHtml.includes(`${img}</picture>`), 'la <img>, dentro del <picture>')
    assert.match(img, /fetchPriority="high"/)
    assert.doesNotMatch(img, /loading="lazy"/)
    assert.match(img, /srcSet="[^"]*2394w"/)
    assert.doesNotMatch(img, /movil/)
    assert.match(img, /sizes="\(min-width: 64rem\) max\(100vw, 1165px\), max\(100vw, 50rem\)"/)
    assert.deepEqual(clasesDe(img, / class="([^"]*)"/), ['absolute', 'inset-0', 'size-full', 'object-cover', 'object-[50%_67.3%]', 'max-[32rem]:object-[50%_100%]'])
    // React no precarga sola una <img> que está dentro de un <picture>: el componente pide las dos precargas, con
    // prioridad y cada una con el media de su foto (así el navegador baja solo la que va a dibujar), y salen antes del
    // header, al principio de lo dibujado (el servidor las lleva al <head>: ssr.test.js). Ninguna otra con prioridad.
    const precargas = html.match(/<link rel="preload" as="image"[^>]*fetchPriority="high"[^>]*\/>/g) ?? []
    assert.deepEqual(precargas, [
      `<link rel="preload" as="image" fetchPriority="high" imageSrcSet="${movil.srcSet}" imageSizes="100vw" media="(width &lt; 32rem)"/>`,
      `<link rel="preload" as="image" fetchPriority="high" imageSrcSet="${hero.imagen.srcSet}" imageSizes="${hero.imagen.sizes}" media="(width &gt;= 32rem)"/>`,
    ])
    assert.ok(html.indexOf(precargas[1]) < html.indexOf('<header'), 'las precargas, antes del header')
    assert.equal(cuantas(html, 'fetchPriority="high"'), 3, 'las dos precargas y la <img> del hero')
    // La caja: debajo de lg, la del cuadro de celular (500 como mínimo, en una columna con el texto apoyado abajo); desde
    // lg, el bloque de 655 como mínimo (crece con el texto: A11Y-02). Nunca un alto fijo ni en vh.
    assert.ok(
      heroHtml.includes('<div class="relative flex min-h-[31.25rem] flex-col justify-end overflow-hidden lg:block lg:min-h-[40.9375rem]"><picture '),
      'la caja del hero',
    )
    for (const fuera of ['min-h-[28rem]', 'lg:h-[40.9375rem]', 'min-[32rem]:justify-start']) assert.equal(cuantas(heroHtml, fuera), 0, fuera)
    // La franja va en el flujo, después de la foto, y desde lg sube con un margen negativo de su alto (nunca absolute: si
    // no, tapaba la bajada con el espaciado de texto de WCAG).
    const nav = /<nav aria-label="[^"]*" class="([^"]*)"/.exec(heroHtml)?.[1]
    assert.ok(nav, 'la franja')
    assert.deepEqual(nav.split(' '), ['relative', 'lg:-mt-[5rem]'])
    // El bloque del texto: el ancho entero (en la columna flex se encogería), 24 a los costados, la reserva del marco de
    // celular arriba y 48 abajo; desde lg, el h1 a 208 y abajo el aire de la franja (o 64 sin ella).
    const TEXTO_HERO_HOME = 'relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-12 md:px-10 lg:px-20 lg:pt-52'
    const textoDe = (h) => clasesDe(h, /<\/div><div class="(relative mx-auto [^"]*)"><div class="mx-auto lg:max-w-/).join(' ')
    assert.equal(textoDe(heroHtml), `${TEXTO_HERO_HOME} lg:pb-[6.5rem]`)
    {
      const { visitas, educacion } = tabla.PAGINAS
      try {
        delete tabla.PAGINAS.visitas
        delete tabla.PAGINAS.educacion
        assert.equal(textoDe(seccion(home(), 'home-titulo')), `${TEXTO_HERO_HOME} lg:pb-16`, 'sin franja')
      } finally {
        tabla.PAGINAS.visitas = visitas
        tabla.PAGINAS.educacion = educacion
      }
    }
    // Los tamaños en rem y sin vw (A11Y-04, ronda 2): crecen con el zoom y con la letra del navegador como el resto del
    // texto. Desde 32rem, los del tablero (así, con el zoom al 200 %, un escritorio, que ya es el diseño de debajo de
    // lg, los ve al doble); debajo, los del cuadro de celular: el h1 en 28/32, la bajada en 16/24 en una columna de 320 a
    // 16 del h1. La franja, 32/56 desde 22,5rem y nunca menos de 24 px (el blanco sobre el naranja alcanza solo como
    // texto grande: A11Y-08), en cajas de 64 debajo de lg y de 80 desde lg. La caja del texto, 52,5rem (840) desde lg.
    const h1 = clasesDe(heroHtml, /<h1 id="home-titulo" class="([^"]*)"/)
    const bajada = clasesDe(heroHtml, /<p class="([^"]*)">[^<]*<\/p>/)
    const visita = clasesDe(heroHtml, /<a href="\/visitas" class="([^"]*)"/)
    const tamanos = (clases) => clases.filter((c) => /(^|:)text-(\[|base$|xl$|2xl$)/.test(c))
    const interlineados = (clases) => clases.filter((c) => /(^|:)leading-/.test(c))
    assert.deepEqual(tamanos(h1), ['text-[1.75rem]', 'min-[32rem]:text-[4rem]'])
    assert.deepEqual(interlineados(h1), ['leading-8', 'min-[32rem]:leading-[1.125]'])
    assert.deepEqual(tamanos(bajada), ['text-base', 'min-[32rem]:text-[2rem]'])
    assert.deepEqual(interlineados(bajada), ['leading-normal', 'lg:leading-[1.75]'])
    assert.deepEqual(margenesDeArriba(bajada), ['mt-4', 'min-[32rem]:mt-6', 'lg:mt-[1em]'])
    assert.deepEqual(bajada.filter((c) => /(^|:)max-w-/.test(c)), ['max-w-[20rem]', 'min-[32rem]:max-w-none'])
    assert.deepEqual(tamanos(visita), ['text-2xl', 'min-[22.5rem]:text-[2rem]'])
    assert.deepEqual(interlineados(visita), ['leading-[1.75]'])
    assert.deepEqual(visita.filter((c) => /(^|:)(min-h|p[xy])-/.test(c)), ['min-h-16', 'px-6', 'py-1', 'lg:min-h-20', 'lg:px-[1em]', 'lg:py-[0.375em]'])
    for (const [nombre, clases] of [['h1', h1], ['bajada', bajada], ['franja', visita]]) {
      assert.ok(!clases.some((c) => /vw|vh|clamp/.test(c)), `${nombre} sin vw: ${clases.join(' ')}`)
    }
    // El corte fijo del título y el renglón sin balancear, solo desde lg: debajo, balanceado, como el cuadro de celular.
    for (const clase of ['lg:whitespace-pre-line', 'lg:text-wrap']) assert.ok(h1.includes(clase), `${clase} en ${h1.join(' ')}`)
    for (const clase of ['whitespace-pre-line', 'text-wrap']) assert.ok(!h1.includes(clase), `sobra ${clase} en ${h1.join(' ')}`)
    assert.ok(clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/).includes('lg:max-w-[52.5rem]'))
    assert.ok(!/vw/.test(parte(heroHtml, '<div class="relative mx-auto w-full max-w-tablero', '</h1>')), 'sin vw en la caja ni en el h1')
    // El halo de la bajada y el del h1 (A11Y-01, ronda 2: con la sombra de la ronda 1, del 14 al 16 % del fondo que se
    // ve al lado de las letras de «Argentina» quedaba por debajo de 3:1); el del h1, en rem (no se achica con la letra
    // del celular). Y el degradé, que no se va con colores forzados (A11Y-05).
    // De 32rem a lg (las tablets: el texto va abajo, sobre la parte clara de la foto), un halo más fuerte en los dos
    // (VHOM-02); debajo de 32rem y desde lg, los de siempre.
    assert.deepEqual(bajada.filter((c) => c.includes('text-shadow')), [
      SOMBRA_BAJADA,
      'min-[32rem]:max-lg:[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1),0_0_0.25em_rgb(1_1_1/0.9),0_0_0.5em_rgb(1_1_1/0.7),0_0_0.75em_rgb(1_1_1/0.5)]',
    ])
    assert.deepEqual(h1.filter((c) => c.includes('text-shadow')), [
      SOMBRA_H1_PAGINA,
      'min-[32rem]:max-lg:[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.25rem_rgb(1_1_1/0.95),0_0_0.5rem_rgb(1_1_1/0.8),0_0_0.75rem_rgb(1_1_1/0.5)]',
    ])
    // Debajo de lg, con los respaldos medidos contra «nuestros orígenes» (la familia de la portada: VHOM-04).
    assert.deepEqual(h1.filter((c) => /(^|:)font-hero/.test(c)), ['font-hero', 'max-lg:font-hero-portada'])
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

  test('la franja de accesos: "Planificá tu visita"; "Tickets" solo con la compra; "Recursos educativos", a su sección, solo con la página de Educación; nunca "Tienda virtual"', () => {
    const { accesos } = contenido.home
    const franja = (html) => parte(html, `<nav aria-label="${accesos.etiqueta}"`, '</nav>')
    // El texto de cada enlace, con los espacios juntos (con la compra, "Recursos educativos" lleva un salto de línea).
    const enlaces = (html) => [...franja(html).matchAll(/<a href="([^"]*)"([^>]*)>([^<]*)<\/a>/g)].map((m) => [m[1], m[3].replace(/\s+/g, ' ')])
    // Los fondos de cada caja (toda clase de fondo, con o sin variante, en su orden) y la clase de su <li>: los del
    // tablero desde lg y, debajo, los del cuadro de celular (O3), que tiene cruzados los de "Tickets" y "Recursos
    // educativos" y pone "Tickets" primero. Se comparan enteros: buscar "bg-naranja" a secas lo encontraría también
    // dentro de la clase de lg.
    const cajas = (html) =>
      [...franja(html).matchAll(/<li class="([^"]*)"><a href="([^"]*)"[^>]*class="([^"]*)"/g)].map((m) => ({
        href: m[2],
        li: m[1],
        fondos: m[3].split(' ').filter((c) => /(^|:)bg-/.test(c)),
        clases: m[3].split(' '),
      }))
    const CAJA = 'flex min-w-0 lg:flex-1'
    const CAJA_ENTRADAS = 'flex min-w-0 max-lg:order-first lg:w-[12.5rem] lg:shrink-0'
    // Sin compra: Visitas, en celeste, y "Recursos educativos" (desde el 06/11/2026, la página de Educación existe), en
    // bordó debajo de lg y en naranja desde lg, con la dirección del menú (D11).
    // "Recursos educativos" lleva a su sección de Educación (T6 de la tanda 1, 16/11/2026): la ruta del menú y, de
    // ancla, el id de esa sección en content.js (no va escrito a mano en HeroHome.jsx). Y el ancla existe: es el h2 que
    // nombra a la sección "Recursos educativos" de la página, una sola vez.
    const RECURSOS = `${contenido.navegacion.menu.find((s) => s.pagina === 'educacion').ruta}#${contenido.educacion.recursos.id}`
    assert.equal(RECURSOS, '/educacion#educacion-recursos')
    const educacionMain = delMain(educacionCon())
    assert.equal(cuantas(educacionMain, 'id="educacion-recursos"'), 1)
    assert.match(educacionMain, /<section aria-labelledby="educacion-recursos" [^>]*><div [^>]*><p [^>]*>Recursos<\/p><h2 id="educacion-recursos" /)
    let html = home()
    assert.deepEqual(enlaces(html), [['/visitas', accesos.visita], [RECURSOS, accesos.recursos]])
    assert.deepEqual(cajas(html).map(({ href, li, fondos }) => [href, li, fondos]), [
      ['/visitas', CAJA, ['bg-celeste']],
      [RECURSOS, CAJA, ['bg-bordo', 'lg:bg-naranja']],
    ])
    assert.equal(cuantas(franja(html), 'max-lg:order-first'), 0)
    assert.match(franja(html), /<a href="\/educacion#educacion-recursos" class="[^"]*">Recursos educativos<\/a>/)
    // Solo la caja de la franja lleva el ancla: el menú, el del celular y el pie siguen yendo al principio de la página.
    assert.equal(cuantas(html, RECURSOS), 1)
    assert.equal(cuantas(franja(html), 'href="/educacion"'), 0)
    // Con la compra activa: "Tickets" (el texto del botón del header, no el que cargó el museo), en naranja debajo de lg
    // y en bordó desde lg, medido por la analítica (data-entradas). En el HTML va segundo, como en escritorio (el orden
    // del foco y del lector de pantalla no cambia); debajo de lg sube primero a la vista con su <li>, el único que
    // cambia de lugar. La lista, apilada debajo de lg y en una fila desde lg.
    html = home([], MUSEO_MAXIMO)
    assert.deepEqual(enlaces(html), [
      ['/visitas', accesos.visita],
      [MUSEO_MAXIMO.compra.url, contenido.navegacion.entradas],
      [RECURSOS, accesos.recursos],
    ])
    assert.deepEqual(cajas(html).map(({ href, li, fondos }) => [href, li, fondos]), [
      ['/visitas', CAJA, ['bg-celeste']],
      [MUSEO_MAXIMO.compra.url, CAJA_ENTRADAS, ['bg-naranja', 'lg:bg-bordo']],
      [RECURSOS, CAJA, ['bg-bordo', 'lg:bg-naranja']],
    ])
    assert.equal(cuantas(franja(html), 'max-lg:order-first'), 1)
    assert.match(franja(html), /<a href="https:\/\/example.com\/entradas" data-entradas="" class="/)
    assert.equal(cuantas(franja(html), 'data-entradas'), 1)
    assert.ok(franja(html).includes('<ul class="mx-auto flex max-w-tablero flex-col lg:flex-row lg:px-20"><li '), 'la lista de la franja')
    // El texto, blanco en las tres (a 24 px o más es texto grande: 3,3:1 sobre el naranja), y nunca el verde de "Tienda
    // virtual" (M2).
    for (const { href, clases } of cajas(html)) assert.deepEqual(clases.filter((c) => /(^|:)text-(blanco|ink|paper)$/.test(c)), ['text-blanco'], href)
    assert.equal(cuantas(franja(html), 'verde'), 0)
    // "Recursos educativos" no se mide (no lleva data-entradas). Con las tres cajas lleva el corte después de la primera
    // palabra (un salto de línea en el texto, que vale solo de lg a 1081 px: ahí va en dos renglones con la fuente y con
    // el respaldo, COD-01 de la verificación de las internas); con dos cajas (sin la compra, arriba) no lo lleva. Con
    // el ancla (T6), el corte sigue igual.
    assert.match(
      franja(html),
      /<a href="\/educacion#educacion-recursos" class="[^"]*bg-bordo lg:bg-naranja lg:whitespace-pre-line min-\[67\.625rem\]:whitespace-normal">Recursos\neducativos<\/a>/,
    )
    assert.equal(cuantas(html, RECURSOS), 1)
    assert.equal(cuantas(franja(home()), 'whitespace-pre-line'), 0)
    // Las cajas nunca miden menos de lo que sube la franja (80 desde lg): con el espaciado de WCAG 1.4.12 quedaba foto
    // debajo (A11Y-02 de la verificación de la Home).
    for (const m of franja(html).matchAll(/<a href="[^"]*"[^>]*class="([^"]*)"/g)) assert.ok(m[1].split(' ').includes('lg:min-h-20'), m[1])
    // Sin la página de Educación, no va (como antes del 06/11/2026).
    const educacion = tabla.PAGINAS.educacion
    try {
      delete tabla.PAGINAS.educacion
      assert.deepEqual(enlaces(home([], MUSEO_MAXIMO)).map(([href]) => href), ['/visitas', MUSEO_MAXIMO.compra.url])
      // Ni la caja ni el ancla: el id sale de content.js, pero sin la página no hay adónde ir.
      assert.equal(cuantas(home([], MUSEO_MAXIMO), 'educacion-recursos'), 0)
    } finally {
      tabla.PAGINAS.educacion = educacion
    }
    assert.equal(cuantas(home([], MUSEO_MAXIMO), 'Tienda virtual'), 0)
    // Sin ningún acceso (sin Visitas, Educación ni compra), sin franja.
    const visitas = tabla.PAGINAS.visitas
    try {
      delete tabla.PAGINAS.visitas
      delete tabla.PAGINAS.educacion
      assert.equal(cuantas(home(), `aria-label="${accesos.etiqueta}"`), 0)
    } finally {
      tabla.PAGINAS.visitas = visitas
      tabla.PAGINAS.educacion = educacion
    }
  })

  test('Novedades: sin novedades no hay sección; con una, la tarjeta sin botones; con seis, el carrusel con las flechas a los costados listas para hidratar y sin contador', () => {
    const textos = contenido.home.novedades
    assert.equal(cuantas(home([]), textos.verTodas), 0)
    // Una sola: la sección, la tarjeta y "Ver todas las novedades", sin flechas, contador ni región viva.
    const una = seccion(home([novedad(1)]), 'novedades-titulo')
    assert.match(una, new RegExp(`<h2 id="novedades-titulo"[^>]*>${textos.titulo}</h2>`))
    assert.ok(una.includes(`>${textos.bajada}</p>`))
    assert.match(una, new RegExp(`<a href="/novedades" class="[^"]*">${textos.verTodas}<svg`))
    assert.equal(cuantas(una, '<li '), 1)
    assert.equal(cuantas(una, '<button'), 0)
    assert.equal(cuantas(una, 'aria-live='), 0)
    // Seis: en el orden en que llegan, cada una con su enlace (el título, estirado sobre la tarjeta) y "leer más" a la
    // vista pero no para el lector (si no, seis "leer más" iguales).
    const seis = [1, 2, 3, 4, 5, 6].map((n) => novedad(n))
    const html = seccion(home(seis), 'novedades-titulo')
    // El aire de abajo: la sección termina 40 px debajo de la fila (pb-10; con los 8 del -mb-2 del envoltorio, a 32 del
    // borde de la fila). Lo que Q cuida es ese aire, y con la sección en pb-16 (24 px más) las pruebas pasaban (RF-03
    // de la re-verificación de las flechas, 17/11/2026); en el navegador lo mide tools/carrusel-check.js.
    assert.ok(html.startsWith('<section aria-labelledby="novedades-titulo" class="pt-12 pb-10">'), html.slice(0, 90))
    const titulos = [...html.matchAll(/<h3 [^>]*><a href="([^"]*)" class="[^"]*after:absolute after:inset-0[^"]*">([^<]*)<\/a><\/h3>/g)]
    assert.deepEqual(titulos.map((m) => m[1]), seis.map((n) => n.url))
    assert.deepEqual(titulos.map((m) => m[2]), seis.map((n) => n.titulo))
    assert.match(html, /<h3 class="[^"]*font-mono[^"]*uppercase/)
    // El h2, en rem y con el tamaño del tablero desde 32rem (no desde lg): con el zoom al 200 % un escritorio ya es el
    // diseño de debajo de lg (A11Y-04, ronda 2).
    const h2 = clasesDe(html, /<h2 id="novedades-titulo" class="([^"]*)"/)
    assert.ok(h2.includes('text-[2.25rem]') && h2.includes('min-[32rem]:text-[4rem]'), h2.join(' '))
    assert.ok(!h2.some((c) => /vw|clamp/.test(c)), h2.join(' '))
    assert.equal(html.match(new RegExp(`<p aria-hidden="true"[^>]*>${textos.leerMas}</p>`, 'g')).length, 6)
    for (const n of seis) assert.ok(html.includes(`>${n.resumen}</p>`), n.resumen)
    // Las tarjetas: debajo de lg, la del cuadro de celular; desde lg, la del tablero.
    comprobarTarjetasDelCarrusel(html, 6)
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
    // Y adentro de la fila, el aire de siempre (R3H-02 de la re-verificación de la ronda 3, 18/11/2026: con «py-2 pb-8»
    // en la fila, o un margen abajo en cada tarjeta, de las tarjetas al final de la sección quedaban 64 px en vez de 40 y
    // las pruebas pasaban): la fila, solo con su py-2 arriba y abajo (los 8 px para el foco), y las tarjetas sin margen
    // ni padding arriba o abajo. En el navegador lo mide tools/carrusel-check.js (res.aireDesdeLasTarjetas).
    assert.deepEqual(fila[3].split(' ').filter((c) => /(^|:)p[ytb]?-/.test(c)), ['py-2'], fila[3])
    const clasesDeLasTarjetas = [...html.matchAll(/<li class="([^"]*)"/g)].map((m) => m[1])
    assert.equal(clasesDeLasTarjetas.length, 6)
    for (const clases of clasesDeLasTarjetas) assert.deepEqual(clases.split(' ').filter((c) => /(^|:)-?[mp][ytb]?-/.test(c)), [], clases)
    // Ni adentro de la tarjeta (R4-01 de la re-verificación de la ronda 4, 18/11/2026: un padding abajo en el <article>, un
    // ::after o un espaciador vacío después de «leer más» también sumaban aire, y las pruebas pasaban): el <article> con
    // sus clases de siempre, y después de «leer más», solo la portada.
    assert.equal(cuantas(html, '<article class="group relative flex flex-col">'), 6)
    assert.equal(html.match(new RegExp(`<p aria-hidden="true"[^>]*>${textos.leerMas}</p><img [^>]*/?></article>`, 'g'))?.length, 6)
    // Antes de hidratar la fila no tiene snap: lo pone el efecto. Sin JavaScript (noscript: @media (scripting: none)) las
    // tarjetas van en renglones, todas a la vista: en una fila con scroll el foco en una tarjeta cortada quedaba a medias
    // (A11Y-06).
    for (const clase of ['snap-x', 'snap-mandatory']) assert.ok(!fila[3].split(' ').includes(clase), clase)
    for (const clase of ['noscript:flex-wrap', 'noscript:overflow-visible']) assert.ok(fila[3].split(' ').includes(clase), clase)
    assert.equal(cuantas(html, 'snap-start'), 6)
    // Anterior y Siguiente con nombre, a los costados de la fila, sobre las fotos (desde el 16/11/2026: FlechasCarrusel),
    // y la región viva en el envoltorio de la fila, vacía hasta el primer Anterior o Siguiente (A11Y-03: no avisa con
    // cada scroll); abajo, nada (desde el 17/11/2026, decisión Q: ni el contador "1/6"). Antes de hidratar los botones
    // no se ven (sin JavaScript no hacen nada). renderToStaticMarkup no separa los textos con <!-- --> (el render del
    // servidor sí).
    comprobarFlechasALosCostados(html, 6, textos)
    assert.deepEqual([textos.anterior, textos.siguiente], ['Anterior', 'Siguiente'])
    assert.equal(cuantas(html, textos.contador(1, 6)), 0)
    // Con dos (en el celular desbordan): lo mismo.
    comprobarFlechasALosCostados(seccion(home([novedad(1), novedad(2)]), 'novedades-titulo'), 2, textos)
  })

  test('Novedades (F8): si una tarjeta no tiene portada, sin flechas a los costados: los controles de siempre abajo, con sus botones y su contador', () => {
    const textos = contenido.home.novedades
    const seis = [1, 2, 3, 4, 5, 6].map((n) => novedad(n, n === 4 ? { portada: null } : {}))
    const html = seccion(home(seis), 'novedades-titulo')
    assert.equal(cuantas(html, '<img'), 5)
    // Ni la capa ni la guía: sobre una tarjeta sin foto las flechas taparían el título.
    assert.equal(cuantas(html, 'pointer-events-none'), 0)
    assert.equal(cuantas(html, 'pointer-events-auto'), 0)
    // La fila, en su envoltorio, como siempre; y abajo, ← "1/6" → (ControlesCarrusel.jsx, sin cambios), invisible hasta
    // medir: los dos botones con su nombre y aria-controls, el contador (el <span> de debajo de lg y el <p> de lg) y
    // la región viva, vacía.
    const fila = /<ul id="([^"]+)" aria-label="[^"]+" data-lenis-prevent-horizontal=""/.exec(html)
    assert.ok(html.includes('</ul></div><div class="mt-6 flex items-center justify-end gap-2 noscript:hidden print:hidden invisible"><button'), 'los controles, abajo')
    const botones = [...html.matchAll(/<button type="button" aria-controls="([^"]+)" aria-disabled="(true|false)"[^>]*>[\s\S]*?<span class="sr-only">([^<]*)<\/span><\/button>/g)]
    assert.deepEqual(botones.map((b) => [b[1], b[2], b[3]]), [
      [fila[1], 'true', textos.anterior],
      [fila[1], 'false', textos.siguiente],
    ])
    assert.match(html, /<span aria-hidden="true" class="[^"]* lg:hidden">1(<!-- -->)?\/(<!-- -->)?6<\/span>/)
    assert.match(html, /<p aria-hidden="true" class="hidden [^"]* lg:block">1(<!-- -->)?\/(<!-- -->)?6<\/p>/)
    assert.equal(cuantas(html, 'aria-live='), 1)
    // Con todas las portadas vuelven las flechas a los costados (y abajo no queda nada: ni botones ni contador).
    const conTodas = seccion(home(seis.map((t, i) => ({ ...t, portada: fotoDelPanel(i + 1) }))), 'novedades-titulo')
    comprobarFlechasALosCostados(conTodas, 6, textos)
    // Lo decide cada portada, no la primera: con la última sin foto, también abajo.
    const ultimaSin = seccion(home([novedad(1), novedad(2, { portada: null })]), 'novedades-titulo')
    assert.equal(cuantas(ultimaSin, 'pointer-events-none'), 0)
    assert.ok(ultimaSin.includes('justify-end gap-2 noscript:hidden print:hidden invisible"><button'))
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
    // Con portada y sin ella, el enlace del título con las mismas clases, ENTERAS: el recorte a tres renglones también
    // sin portada (RC-01 de la verificación de RF-01, 19/11/2026: si el recorte iba solo en las que tienen portada, como
    // en F8, ninguna prueba lo veía).
    for (const tarjeta of tarjetas) {
      const enlace = /<h3 class="[^"]*"><a href="[^"]*" class="([^"]*)">/.exec(tarjeta)
      assert.ok(enlace, tarjeta.slice(0, 300))
      assert.deepEqual(enlace[1].split(' '), ENLACE_TITULO_CARRUSEL)
    }
  })

  test('"El MuPa en imágenes" y "Mapa del Museo": los títulos, las cinco fotos, las piedritas decorativas y los nombres del plano como texto', () => {
    const html = home()
    const { galeria, mapa } = contenido.home
    const fotos = seccion(html, 'galeria-titulo')
    assert.match(fotos, new RegExp(`<h2 id="galeria-titulo" class="[^"]*">${galeria.titulo}</h2>`))
    // La sección: 48 arriba y 40 abajo debajo de md (el cuadro de celular) y 64 y 64 desde md; recorta lo que sale por
    // los costados (las piedritas) sin armar una caja de scroll.
    assert.deepEqual(clasesDe(fotos, /<section aria-labelledby="galeria-titulo" class="([^"]*)"/), ['relative', 'overflow-x-clip', 'pt-12', 'pb-10', 'md:py-16'])
    assert.match(fotos, /id="identidad-collage"/)
    // Hasta que arranca el efecto (sin hidratar, o si el JavaScript no llega) la caja lleva collage-espera y no
    // data-efecto: se ve solo la foto del fondo y las otras no tapan el título del mapa (A11Y-07, ronda 2). data-efecto
    // lo pone el efecto en el navegador, nunca el servidor.
    const caja = clasesDe(fotos, /<div data-caja="true" class="([^"]*)"/)
    assert.ok(caja.includes('collage-espera'), caja.join(' '))
    assert.equal(cuantas(html, 'data-efecto'), 0)
    // Los títulos, en rem y con el tamaño del tablero desde 32rem (A11Y-04, ronda 2); a la izquierda debajo de md (el
    // cuadro de celular) y centrados desde md.
    const alineacion = (clases) => clases.filter((c) => /(^|:)text-(left|center|right|start|end)$/.test(c))
    const h2 = clasesDe(fotos, /<h2 id="galeria-titulo" class="([^"]*)"/)
    assert.ok(h2.includes('min-[32rem]:text-[4rem]') && !h2.some((c) => /vw|clamp/.test(c)), h2.join(' '))
    assert.deepEqual(alineacion(h2), ['md:text-center'])
    // Las cinco fotos, en el orden de siempre en el HTML (lamas, dremel, restaurador, pincel y patio: el que usa el
    // acomodo de escritorio, con la del patio adelante). Debajo de md, la pila del cuadro de celular: cada una a todo el
    // ancho y de la mitad del alto de la caja, un octavo más abajo que la anterior de la pila, y el orden de la pila
    // (lamas, restaurador, pincel, patio y, adelante, la del dremel) lo da su z-index, que desde md no va.
    const capasDeFotos = [...fotos.matchAll(/<div class="(pointer-events-auto [^"]*)"><img [^>]*alt="([^"]*)"/g)]
    assert.deepEqual(capasDeFotos.map((m) => m[2]), contenido.identidad.collage.map((f) => f.alt))
    assert.equal(capasDeFotos.length, 5)
    const PILA = [
      ['top-0', 'z-[1]'],
      ['top-1/2', 'z-[5]'],
      ['top-[12.5%]', 'z-[2]'],
      ['top-1/4', 'z-[3]'],
      ['top-[37.5%]', 'z-[4]'],
    ]
    const ABANICO = [
      ['md:left-[7.626%]', 'md:top-[0.03%]', 'md:w-[53.79%]', 'md:h-[57.44%]'],
      ['md:left-[33.72%]', 'md:top-[29.17%]', 'md:w-[66.31%]', 'md:h-[70.82%]'],
      ['md:left-[41.05%]', 'md:top-[8.98%]', 'md:w-[53.96%]', 'md:h-[57.6%]'],
      ['md:left-[-0.028%]', 'md:top-[22.73%]', 'md:w-[66.34%]', 'md:h-[70.85%]'],
      ['md:left-[23.56%]', 'md:top-[29.67%]', 'md:w-[53.92%]', 'md:h-[57.6%]'],
    ]
    capasDeFotos.forEach((m, i) => {
      const clases = m[1].split(' ')
      const lugar = (variante) => clases.filter((c) => new RegExp(`^${variante}(left|top|w|h|z)-`).test(c))
      assert.deepEqual(lugar(''), ['left-0', 'h-1/2', 'w-full', ...PILA[i]], `la foto ${i} en la pila`)
      const [izquierda, arriba, ancho, alto] = ABANICO[i]
      assert.deepEqual(lugar('md:'), [izquierda, arriba, 'md:z-auto', ancho, alto], `la foto ${i} en el abanico`)
      for (const clase of ['pointer-events-auto', 'absolute', 'overflow-hidden', 'rounded-[1.025rem]']) assert.ok(clases.includes(clase), `${i}: ${clase}`)
    })
    // La caja: debajo de md, 354:472 del ancho del contenido (480 como mucho, y nunca más alta que la pantalla menos
    // 9rem), con los z-index de las fotos adentro; desde md, la del tablero. Quieta (apilado), sin el tope de alto.
    assert.deepEqual(caja.filter((c) => /(^|:)aspect-/.test(c)), ['aspect-[354/472]', 'md:aspect-[1006/628]'])
    assert.deepEqual(caja.filter((c) => /(^|:)w-/.test(c)), [
      'w-[min(100%,30rem,calc((100svh-9rem)*0.75))]',
      'md:w-[min(calc(100%-5rem),calc((100svh-6rem)*1.6019))]',
      'lg:w-[min(69.86%,calc((100svh-6rem)*1.6019))]',
      'apilado:w-[min(100%,30rem)]',
      'apilado:md:w-[calc(100%-5rem)]',
      'apilado:lg:w-[69.86%]',
    ])
    assert.deepEqual(caja.filter((c) => /isolat/.test(c)), ['max-md:isolate'])
    // Debajo de md, contra el margen izquierdo, como el título y el plano (de 480 a 767 px iba centrada: VHOM-03).
    assert.deepEqual(caja.filter((c) => /(^|:)m[lrx]-/.test(c)), ['mx-auto', 'max-md:ml-0'])
    assert.ok(fotos.includes('<div class="mx-auto w-full max-w-[90rem] px-6 md:px-0"><div data-caja="true" '), 'el envoltorio de la caja, con 24 a los costados debajo de md')
    // El bloque enganchado: debajo de md la caja va a 7,5rem del borde de arriba (el aire de la sección, el título y
    // 24: se engancha viéndose como el cuadro) y desde md, centrada; quieto (apilado), 24 debajo del título debajo de md
    // y 80 desde md. Los altos, solo en svh (nunca vh ni dvh: la barra de Safari).
    const bloque = clasesDe(fotos, /<div id="identidad-collage" class="([^"]*)"/)
    assert.deepEqual(bloque.filter((c) => /(^|:)pt-/.test(c)), ['apilado:pt-6', 'apilado:md:pt-20'])
    assert.ok(bloque.includes('collage-cola'), bloque.join(' '))
    const fijo = clasesDe(fotos, /<div class="(sticky [^"]*)"/)
    assert.deepEqual(fijo.filter((c) => /(^|:)(pt|items)-/.test(c)), ['items-start', 'pt-[7.5rem]', 'md:items-center', 'md:pt-0', 'apilado:pt-0'])
    assert.ok(fijo.includes('h-svh') && fijo.includes('apilado:static'), fijo.join(' '))
    assert.ok(!/\d(d|l)?vh/.test(parte(fotos, '<div id="identidad-collage"', '<img ')), 'ningún alto en vh ni dvh')
    // El recorrido (G de la tanda 1b, 16/11/2026): uno solo para todos los anchos, el que tenía escritorio. El bloque
    // mide la pantalla fija, 16rem de scroll por cada foto que sale (4 con 5 fotos: --fotos) y la cola, y la cola (la
    // última foto quieta antes de soltarse), el 30 % de la pantalla; sin variantes lg:, que serían iguales. Debajo de
    // lg eran 24,2rem por foto y una cola del 45 % (145svh en el bloque): el desarrollador encontró la galería muy
    // larga en el celular (1848 px con la pila clavada en un iPhone de 664 de alto; ahora, 1223). Quieto (apilado),
    // sin alto fijo ni cola.
    const altos = (clases) => clases.filter((c) => /(^|:)(h|min-h|max-h)-/.test(c))
    assert.deepEqual(altos(bloque), ['h-[calc(130svh+(var(--fotos)-1)*16rem)]', 'apilado:h-auto'])
    assert.match(fotos, /<div id="identidad-collage" class="[^"]*" style="--fotos:5">/)
    const cola = clasesDe(fotos, /<div data-cola="true" aria-hidden="true" class="([^"]*)"/)
    assert.deepEqual(altos(cola), ['h-[30svh]'])
    assert.ok(cola.includes('apilado:hidden') && cola.includes('pointer-events-none'), cola.join(' '))
    assert.equal(cuantas(fotos, 'data-cola='), 1)
    for (const viejo of ['24.2rem', '145svh', '45svh']) assert.ok(!fotos.includes(viejo), `volvió ${viejo}, del recorrido largo del celular`)
    for (const clases of [bloque, fijo, cola]) assert.deepEqual(clases.filter((c) => /^lg:(h|min-h|max-h)-/.test(c)), [], 'el recorrido no cambia en lg')
    for (const img of fotos.match(/<img [^>]*alt="[^"]+"[^>]*>/g)) {
      assert.ok(img.includes('sizes="(min-width: 1440px) 667px, (min-width: 1024px) 46vw, (min-width: 768px) 66vw, min(calc(100vw - 3rem), 350px)"'), img)
      assert.ok(img.includes('loading="lazy"') && img.includes('fetchPriority="low"'), img)
    }
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
    // Debajo de md (el cuadro de celular, M5): 48 arriba y 40 abajo, el título a la izquierda y, 24 más abajo, el plano
    // SIN los nombres de las salas (imagen.movil); desde md, lo de escritorio: el plano con los nombres lo pone el
    // <source> de un <picture> que no arma caja. Los tres SVG miden lo mismo (un solo width y height).
    const plano = seccion(html, 'mapa-titulo')
    assert.match(plano, new RegExp(`<h2 id="mapa-titulo" class="[^"]*">${mapa.titulo}</h2>`))
    assert.deepEqual(clasesDe(plano, /<section aria-labelledby="mapa-titulo" class="([^"]*)"/), ['pt-12', 'pb-10', 'md:py-16'])
    assert.deepEqual(alineacion(clasesDe(plano, /<h2 id="mapa-titulo" class="([^"]*)"/)), ['md:text-center'])
    assert.equal(new Set([mapa.imagen.src, mapa.imagen.hover, mapa.imagen.movil]).size, 3)
    assert.match(mapa.imagen.movil, /mapa-museo-movil/)
    assert.ok(
      plano.includes(
        `<div class="relative mx-auto mt-6 w-[min(100%,55.1728rem)] md:mt-10"><picture class="contents"><source media="(min-width: 48rem)" srcSet="${mapa.imagen.src}"/>` +
          `<img src="${mapa.imagen.movil}" alt="${mapa.imagen.alt}" width="883" height="812" loading="lazy" decoding="async" fetchPriority="low" class="block h-auto w-full"/></picture>`,
      ),
      'el plano: el de celular en la <img> y el de escritorio en el <source>',
    )
    assert.equal(cuantas(plano, '<picture'), 1)
    assert.equal(cuantas(plano, '<source'), 1)
    const lista = parte(plano, `<ul aria-label="${mapa.etiqueta}" class="sr-only">`, '</ul>')
    assert.deepEqual([...lista.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), mapa.espacios)
    assert.equal(mapa.espacios.length, 14)
    assert.ok(mapa.espacios.includes('Jardín Triásico'))
    // El hover (D15): el plano en reposo primero y encima una capa por sala con la versión bordó, recortada a su sala
    // (un clipPath por sala en un svg decorativo), transparente hasta el hover, con el fundido y sin él con
    // reduced-motion; todas lazy, decorativas y sin nada que sea un control.
    assert.notEqual(mapa.imagen.hover, mapa.imagen.src)
    const capas = plano.match(/<img [^>]*>/g)
    assert.equal(capas.length, 15)
    assert.ok(capas[0].startsWith(`<img src="${mapa.imagen.movil}"`), capas[0])
    const ids = ['confiteria', 'sala-inmersiva', 'tienda', 'sala-8', 'microcine', 'sala-1', 'sala-educativa', 'sala-2', 'sala-3', 'sala-4', 'sala-5', 'jardin-triasico', 'sala-6', 'sala-7']
    assert.equal(ids.length, mapa.espacios.length)
    assert.deepEqual(SALAS_DEL_PLANO.map((s) => s.id), ids)
    assert.deepEqual([...plano.matchAll(/data-sala="([^"]*)"/g)].map((m) => m[1]), ids)
    capas.slice(1).forEach((img, i) => {
      for (const atributo of [`src="${mapa.imagen.hover}"`, 'alt=""', 'loading="lazy"', 'decoding="async"', 'fetchPriority="low"', 'draggable="false"', `data-sala="${ids[i]}"`, `style="clip-path:url(#mapa-${ids[i]})"`]) {
        assert.ok(img.includes(atributo), `${ids[i]}: ${atributo}`)
      }
      const clases = clasesDe(img, /class="([^"]*)"/)
      // Debajo de md no se dibujan (el celular no tiene hover): como son lazy, el teléfono no baja su archivo.
      for (const clase of ['absolute', 'inset-0', 'size-full', 'opacity-0', 'hover:opacity-100', 'transition-opacity', 'duration-200', 'motion-reduce:transition-none', 'max-md:hidden', 'print:hidden']) {
        assert.ok(clases.includes(clase), `${ids[i]}: ${clase}`)
      }
      assert.deepEqual(clases.filter((c) => /hidden$/.test(c)), ['max-md:hidden', 'print:hidden'], ids[i])
    })
    const recortes = parte(plano, '<svg aria-hidden="true"', '</svg>')
    assert.match(recortes, /focusable="false"/)
    assert.deepEqual([...recortes.matchAll(/<clipPath id="mapa-([^"]*)" clipPathUnits="objectBoundingBox" transform="scale\(\.0011328 \.0012318\)"><path d="M[^"]+"><\/path><\/clipPath>/g)].map((m) => m[1]), ids)
    for (const control of ['<a ', '<button', 'tabindex', 'tabIndex', 'role=', 'cursor-pointer', 'onClick']) {
      assert.equal(cuantas(plano, control), 0, control)
    }
    // Ninguna se precarga (React precarga las imágenes que no son lazy).
    const precargadas = (html.match(/<link rel="preload"[^>]*>/g) ?? []).join(' ')
    for (const archivo of [mapa.imagen.src, mapa.imagen.hover, mapa.imagen.movil]) assert.equal(cuantas(precargadas, archivo), 0, archivo)
  })

  test('el plano de celular (mapa-museo-movil.svg, M5): el de escritorio sin los nombres de las salas, con la misma caja', async () => {
    const { readFile } = await import('node:fs/promises')
    const leer = (nombre) => readFile(join(RAIZ, 'src', 'assets', nombre), 'utf8')
    const [escritorio, celular, hover] = await Promise.all(['mapa-museo.svg', 'mapa-museo-movil.svg', 'mapa-museo-hover.svg'].map(leer))
    // La misma caja en los tres (un solo width y height en el HTML: nada se corre al cambiar de uno a otro).
    const raiz = (svg) => /^<svg width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)"/.exec(svg)?.slice(1).join(' ')
    assert.equal(raiz(escritorio), '882.765 811.848 0 0 882.765 811.848')
    assert.equal(raiz(celular), raiz(escritorio))
    assert.equal(raiz(hover), raiz(escritorio))
    // Los nombres del dibujo son trazados: las 105 letras, rellenas de #010101 y sin trazo (como los 6 puntos de la
    // planta, que quedan). El de celular es el de escritorio sin esas 105 y con todo lo demás, en el mismo orden (salvo
    // el grosor de los trazos).
    const trazados = (svg) => svg.match(/<path [^>]*\/>/g) ?? []
    const negroSinTrazo = (p) => /fill="#010101"/.test(p) && !/ stroke="/.test(p)
    const sinGrosor = (p) => p.replace(/ stroke-width="[^"]*"/, '')
    assert.equal(trazados(escritorio).length, 292)
    assert.equal(trazados(escritorio).filter(negroSinTrazo).length, 105 + 6)
    assert.equal(trazados(celular).length, 292 - 105)
    const negrosDelCelular = trazados(celular).filter(negroSinTrazo)
    assert.equal(negrosDelCelular.length, 6)
    // Los seis que quedan son los puntos de la planta (rombos de menos de una unidad del dibujo), no letras (que miden
    // varias unidades): todos sus números, de a pares x e y, entran en un cuadrado de 1.
    for (const p of negrosDelCelular) {
      const numeros = [.../ d="([^"]+)"/.exec(p)[1].matchAll(/-?\d+(?:\.\d+)?/g)].map(Number)
      const xs = numeros.filter((_, i) => i % 2 === 0)
      const ys = numeros.filter((_, i) => i % 2 === 1)
      assert.ok(Math.max(...xs) - Math.min(...xs) < 1 && Math.max(...ys) - Math.min(...ys) < 1, p)
    }
    const delCelular = trazados(celular).map(sinGrosor)
    const quitados = []
    let iguales = 0
    for (const p of trazados(escritorio).map(sinGrosor)) {
      if (p === delCelular[iguales]) iguales++
      else quitados.push(p)
    }
    assert.equal(iguales, delCelular.length, 'el de celular: los trazados del de escritorio, en el mismo orden')
    assert.equal(quitados.length, 105)
    assert.ok(quitados.every(negroSinTrazo), 'lo que no está son letras de los nombres')
    // Las salas, del mismo naranja (y el Jardín, salmón); ningún texto vivo ni nada que no sea un trazado.
    for (const color of ['#EB622D', '#CF7349', '#EAE2DF']) assert.ok(celular.includes(`fill="${color}"`), color)
    assert.equal((celular.match(/<(?!path |svg |\/svg>)[a-zA-Z]/g) ?? []).length, 0)
    // Los trazos, más gruesos que en el de escritorio (el cuadro de celular achica el plano sin achicarlos).
    const grosores = (svg) => [...new Set([...svg.matchAll(/ stroke-width="([^"]+)"/g)].map((m) => m[1]))].sort()
    assert.deepEqual(grosores(escritorio), ['.6'])
    assert.deepEqual(grosores(celular), ['1.5', '2.5'])
    // Y pesa menos de la mitad (viaja solo a los teléfonos).
    assert.ok(celular.length < escritorio.length / 2, `${celular.length} B`)
  })

  test('mapaSalas.js: las 14 salas del plano con su trazado, sin crecer sin que se note', () => {
    assert.equal(SALAS_DEL_PLANO.length, 14)
    assert.equal(new Set(SALAS_DEL_PLANO.map((s) => s.id)).size, 14)
    for (const { id, d } of SALAS_DEL_PLANO) {
      assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, id)
      assert.match(d, /^M[\d\s.,MLHVCSQTAZmlhvcsqtaz-]+$/, id)
    }
    // Los trazados viajan en el JS de la Home (hoy 3.699 B).
    assert.ok(SALAS_DEL_PLANO.reduce((total, s) => total + s.d.length, 0) < 4500)
    // Van en el orden de home.mapa.espacios (src/content.js), y desde M6 ese orden decide también qué nombre muestra la
    // etiqueta de cada sala al tocarla (espacios[i] para SALAS_DEL_PLANO[i], en MapaMuseo.jsx): el id de cada sala es su
    // nombre sin tildes y con guiones (RM-01 de la re-verificación, 17/11/2026: con «Sala 3» y «Sala 4» cambiadas de
    // lugar en content.js, cada una mostraba el nombre de la otra y las pruebas pasaban).
    const slug = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-')
    assert.deepEqual(contenido.home.mapa.espacios.map(slug), SALAS_DEL_PLANO.map((s) => s.id))
  })

  // El mapa del celular con el toque (decisión M6 del desarrollador, 17/11/2026): debajo de md, tocar una sala la pinta
  // de bordó y muestra su nombre. Todo lo arma el JavaScript del navegador: lo que sale del servidor no cambia (el HTML
  // de escritorio queda igual) y lo que decide qué sala se tocó es código puro de mapaSalas.js, que se prueba acá sin
  // el DOM. Lo que hace en el navegador (los toques, la etiqueta, el fundido) se midió con toques por CDP
  // (tools/salida/tanda-1/mapa-tactil, no versionado).
  test('el mapa táctil (M6): del servidor no sale nada nuevo; las capas y las etiquetas las arma el navegador', async () => {
    const { readFile } = await import('node:fs/promises')
    const plano = seccion(home(), 'mapa-titulo')
    for (const marca of ['data-sala-tocada', 'data-etiqueta-sala', 'mapa-toque', '<image', '<mask', 'mapa-museo-movil-tocada', 'data-activa']) {
      assert.equal(cuantas(plano, marca), 0, marca)
    }
    // Ni un control: el toque es el click del contenedor (React no lo escribe en el HTML).
    assert.equal(cuantas(plano, 'onClick'), 0)
    assert.equal(cuantas(plano, 'onPointerDown'), 0)
    // Las capas usan el plano "tocado", que importa solo MapaMuseo (así viaja en el JS de la Home y en ninguna otra
    // página), y se dibujan solo debajo de md, sin el puntero, decorativas y fuera de la impresión.
    const fuente = await readFile(join(RAIZ, 'src', 'components', 'MapaMuseo.jsx'), 'utf8')
    assert.match(fuente, /^import mapaTocada from '\.\.\/assets\/mapa-museo-movil-tocada\.svg'$/m)
    assert.equal(cuantas(await readFile(join(RAIZ, 'src', 'content.js'), 'utf8'), 'tocada'), 0)
    const capa = /<svg\s+aria-hidden="true"\s+focusable="false"\s+viewBox=\{`0 0 \$\{ANCHO_PLANO\} \$\{ALTO_PLANO\}`\}\s+className="([^"]*)"/.exec(fuente)
    assert.ok(capa, 'el svg de las capas')
    assert.deepEqual(capa[1].split(' '), ['pointer-events-none', 'absolute', 'inset-0', 'size-full', 'md:hidden', 'print:hidden'])
    const etiqueta = /const ETIQUETA =\s+((?:'[^']*'\s*\+?\s*)+)/.exec(fuente)[1].replace(/'\s*\+\s*'/g, '').replace(/'/g, '').trim().split(/\s+/)
    for (const clase of ['pointer-events-none', 'absolute', 'bg-bordo', 'text-blanco', 'font-mono', 'text-base', 'opacity-0', 'data-activa:opacity-100', 'transition-opacity', 'duration-200', 'motion-reduce:transition-none', 'md:hidden', 'print:hidden']) {
      assert.ok(etiqueta.includes(clase), `la etiqueta: ${clase}`)
    }
    assert.match(fuente, /aria-hidden="true"\s+data-etiqueta-sala=\{id\}/)
    for (const control of ['role=', 'tabIndex', 'cursor-pointer', '<button', '<a ']) assert.equal(cuantas(fuente, control), 0, control)
    // Lo que hace el JavaScript del toque, sobre la fuente (RM-01 de la re-verificación, 17/11/2026: con la etiqueta
    // vacía, con el nombre de otra sala, sin etiquetas, sin el corte de md, sin el tope del toque largo, con otra
    // tolerancia o con otra máscara, las pruebas pasaban; lo que eso hace en el navegador lo midieron, con toques por CDP,
    // tools/salida/tanda-1/mapa-tactil y rv-mapa, no versionados):
    // - la etiqueta de cada sala, con las capas, dice SU nombre: el de home.mapa.espacios con el mismo índice (el orden
    //   lo ata la prueba de mapaSalas.js, arriba);
    assert.match(fuente, /const \{[^}]*\bespacios\b[^}]*\} = home\.mapa(?![.\w])/)
    assert.match(fuente, /\{capas &&\s+SALAS_DEL_PLANO\.map\(\(\{ id \}, i\) => [({][\s\S]{0,800}?data-etiqueta-sala=\{id\}[\s\S]{0,800}?>\s*\{espacios\[i\]\}\s*<\/span>/)
    assert.match(fuente, /\{capas && \(\s*<svg\s+aria-hidden="true"/)
    // - desde md el toque no hace nada (ni arma las capas ni pide el plano tocado: en escritorio un clic bajaba sus
    //   10.662 B), con el mismo corte que el <source> del plano de escritorio; y el toque largo (el menú de la imagen) no
    //   cuenta: tocar, apoyar el dedo y el IntersectionObserver;
    const desdeMd = /^const DESDE_MD = '([^']+)'/m.exec(fuente)?.[1]
    assert.ok(desdeMd && plano.includes(`<source media="${desdeMd}" `), `el corte del toque (${desdeMd}) es el del <source> del plano`)
    assert.match(fuente, /const desdeMd = \(\) => matchMedia\(DESDE_MD\)\.matches/)
    assert.match(fuente, /if \(desdeMd\(\) \|\| !plano\.current \|\| e\.timeStamp - apoyo\.current > LARGO_MS\) return/)
    assert.match(fuente, /if \(!capas && !desdeMd\(\)\) setCapas\(true\)/)
    assert.match(fuente, /if \(e\.isIntersecting && !desdeMd\(\)\) setCapas\(true\)/)
    // - y los valores medidos, a confirmar por el desarrollador (M6): la tolerancia de 6 px, el toque largo de 500 ms y
    //   cuánto se agranda la máscara de cada sala para tomar su contorno (medido con librsvg contra el plano de celular
    //   con esa sala en bordó; sin agrandar queda el hilo naranja y de más pinta las vecinas). Cambiarlos es a
    //   propósito, midiendo otra vez; y cada capa va con la máscara de su sala.
    assert.match(fuente, /^const TOLERANCIA_PX = 6(?![\d.])/m)
    // La sala del toque es la que da salaEnElPunto, sin respaldo (anclado al final del renglón: con «?? la primera
    // sala», tocar el plano fuera de las salas la encendía y la expresión suelta pasaba; R3M-01 de la re-verificación de
    // la ronda 3, 18/11/2026).
    assert.match(fuente, /^\s*const sala = salaEnElPunto\(x, y, TOLERANCIA_PX \/ k\)$/m)
    assert.match(fuente, /^const LARGO_MS = 500(?![\d.])/m)
    assert.match(fuente, /^const RADIO = \{ confiteria: 4\.5, 'sala-8': 4, 'jardin-triasico': 0 \}/m)
    assert.match(fuente, /^const RADIO_COMUN = 3\.5(?!\d)/m)
    assert.match(fuente, /const radio = RADIO\[id\] \?\? RADIO_COMUN/)
    assert.match(fuente, /<mask key=\{id\} id=\{`mapa-toque-\$\{id\}`\}>\s*<path\s+d=\{d\}\s+fill="#fff"\s+stroke=\{radio \? '#fff' : undefined\}\s+strokeWidth=\{radio \? 2 \* radio : undefined\}/)
    assert.match(fuente, /<image\s+key=\{id\}\s+href=\{mapaTocada\}\s+width=\{ANCHO_PLANO\}\s+height=\{ALTO_PLANO\}\s+mask=\{`url\(#mapa-toque-\$\{id\}\)`\}/)
    // - y lo que enciende y apaga (R2-01 de la re-verificación de la ronda 2, 17/11/2026: con el toque roto —sin los dos
    //   manejadores, la capa o la etiqueta que nunca se encienden o que se encienden las otras, la capa encendida sin
    //   verse, tocar la misma o fuera que no apaga, x e y cambiados, la etiqueta sin acomodar—, todo lo de arriba
    //   pasaba): el toque llega (los dos manejadores en el plano); la capa y la etiqueta se encienden SOLO con su sala
    //   (data-activa) y la capa encendida se ve; tocar la misma o fuera de las salas apaga (anclado a setCapas: con un
    //   «if (sala)» delante de setActiva, fuera de las salas no apagaba y la expresión suelta pasaba), y tocar fuera del
    //   plano también; el punto se lee con x de clientX e y de clientY; y la etiqueta se acomoda arriba o abajo de su
    //   sala, se dibuja donde dice ese lado (bottom encima, top debajo) y se vuelve a acomodar si el plano cambia de
    //   tamaño (RM-02, 17/11/2026: al girar el teléfono tapaba su sala). En el navegador, con toques de verdad, lo mira
    //   tools/mapa-check.mjs.
    assert.match(fuente, /onPointerDown=\{apoyar\}\s+onClick=\{tocar\}/)
    assert.match(fuente, /data-sala-tocada=\{id\}\s+data-activa=\{id === activa \? '' : undefined\}\s+className=\{CAPA_TOCADA\}/)
    assert.match(fuente, /data-etiqueta-sala=\{id\}\s+data-activa=\{id === activa \? '' : undefined\}\s+className=\{ETIQUETA\}/)
    const capaTocada = (/const CAPA_TOCADA = '([^']*)'/.exec(fuente)?.[1] ?? '').split(' ')
    for (const clase of ['opacity-0', 'data-activa:opacity-100', 'transition-opacity', 'duration-200', 'motion-reduce:transition-none']) {
      assert.ok(capaTocada.includes(clase), `la capa: ${clase}`)
    }
    assert.match(fuente, /setCapas\(true\)\s+setActiva\(sala === activa \? null : sala\)/)
    assert.match(fuente, /if \(!plano\.current\?\.contains\(e\.target\)\) setActiva\(null\)/)
    assert.match(fuente, /document\.addEventListener\('click', fuera\)/)
    assert.match(fuente, /const x = \(e\.clientX - r\.left\) \/ k/)
    assert.match(fuente, /const y = \(\(e\.clientY - r\.top\) \* ALTO_PLANO\) \/ r\.height/)
    assert.match(fuente, /setLugar\(\(antes\) =>/)
    assert.match(fuente, /style=\{estiloDeEtiqueta\(id, lugar\[id\]\)\}/)
    // En el ancho, la etiqueta va centrada en proporción a su sala (R3M-01: con left 0, siempre contra el borde
    // izquierdo del plano, a ~290 px de la Sala 6, las pruebas pasaban).
    assert.match(fuente, /const centro = \(50 \* \(x0 \+ x1\)\) \/ ANCHO_PLANO\s+const estilo = \{ left: `\$\{centro\}%`, translate: `-\$\{centro\}% 0` \}/)
    assert.match(fuente, /else if \(sitio\.lado === 'sobre'\) estilo\.bottom = `min\(calc\(\$\{100 - arriba\}% \+ \$\{AIRE_PX\}px\)/)
    assert.match(fuente, /else estilo\.top = `min\(calc\(\$\{\(100 \* y1\) \/ ALTO_PLANO\}% \+ \$\{AIRE_PX\}px\)/)
    assert.match(fuente, /new ResizeObserver\(decidir\)\s+vigia\.observe\(plano\.current\)/)
  })

  test('mapaSalas.js: qué sala hay en un punto y la caja de cada una (M6), sin el DOM', async () => {
    const { ANCHO_PLANO, ALTO_PLANO, cajaDeSala, salaEnElPunto } = await import('../../src/components/mapaSalas.js')
    assert.equal(ANCHO_PLANO, 882.765)
    assert.equal(ALTO_PLANO, 811.848)
    // Un punto adentro de cada sala (el centro que midió el cierre de E6.3 en Chrome con isPointInFill) y su caja (la de
    // getBBox de tools/salida/e6-cierre/prep-mapa/spec.md: x, y, ancho y alto, con una décima de margen).
    const SALAS = {
      confiteria: [120.3, 166.4, 44.3, 96.4, 153.9, 124.9],
      'sala-inmersiva': [257.4, 262.1, 183.4, 174.1, 148.6, 148.6],
      tienda: [86.5, 342.4, 30.5, 306.4, 113.4, 84.8],
      'sala-8': [212.2, 458, 104.2, 350, 215, 215],
      microcine: [202.4, 624.6, 146.4, 564.6, 113.5, 121],
      'sala-1': [305.5, 691.7, 257.5, 649.7, 94.5, 94.5],
      'sala-educativa': [366.7, 517.7, 308.7, 471.7, 117.3, 117.3],
      'sala-2': [485.1, 689.6, 371.1, 619.6, 226, 132],
      'sala-3': [670.3, 687.8, 622.3, 645.8, 94.5, 94.5],
      'sala-4': [657.7, 557.2, 609.7, 517.2, 94.5, 94.5],
      'sala-5': [743.7, 476.6, 695.7, 436.6, 94.5, 94.5],
      'jardin-triasico': [672.6, 455.6, 598.6, 383.6, 148.5, 144.5],
      'sala-6': [776.8, 350.8, 728.8, 310.8, 94.5, 94.5],
      'sala-7': [605.3, 418, 511.3, 322, 187.3, 197.2],
    }
    assert.deepEqual(Object.keys(SALAS), SALAS_DEL_PLANO.map((s) => s.id))
    for (const [id, [x, y, x0, y0, ancho, alto]] of Object.entries(SALAS)) {
      assert.equal(salaEnElPunto(x, y), id, `${id}: su punto`)
      assert.equal(salaEnElPunto(x, y, 15), id, `${id}: con tolerancia, también`)
      const caja = cajaDeSala(id)
      for (const [i, esperado] of [x0, y0, x0 + ancho, y0 + alto].entries()) assert.ok(Math.abs(caja[i] - esperado) < 0.25, `${id}: la caja ${caja} contra ${esperado}`)
    }
    assert.equal(cajaDeSala('no-existe'), null)
    // Fuera de las salas: nada sin tolerancia; con ella, la más cercana si está a menos (si no, nada).
    for (const [x, y] of [[20, 20], [470, 560], [540, 600], [450, 420], [800, 700], [700, 250], [60, 600]]) {
      assert.equal(salaEnElPunto(x, y), null, `${x},${y}`)
      assert.equal(salaEnElPunto(x, y, 15), null, `${x},${y} con tolerancia`)
    }
    assert.equal(salaEnElPunto(600, 580), null)
    assert.equal(salaEnElPunto(600, 580, 15), 'sala-4')
    // En el medio del hueco entre dos vecinas (de 2,7 a 15,7 unidades): ninguna sin tolerancia y, con ella, una de las
    // dos (la más cercana).
    for (const [a, b, x, y] of [
      ['jardin-triasico', 'sala-7', 646.3, 440.9],
      ['jardin-triasico', 'sala-5', 699, 463.4],
      ['jardin-triasico', 'sala-4', 663.7, 516.3],
      ['confiteria', 'sala-inmersiva', 184.6, 211.2],
      ['sala-8', 'microcine', 205.8, 566.3],
      ['sala-8', 'sala-educativa', 315, 497.7],
    ]) {
      assert.equal(salaEnElPunto(x, y), null, `${a}/${b}`)
      assert.ok([a, b].includes(salaEnElPunto(x, y, 15)), `${a}/${b}: ${salaEnElPunto(x, y, 15)}`)
    }
    // La roseta de Sala 8 está adentro de la sala: tocarla es tocar la sala.
    assert.equal(salaEnElPunto(200.19, 473.74), 'sala-8')
  })

  test('el plano tocado (mapa-museo-movil-tocada.svg, M6): el de celular con las 14 salas y los 13 contornos en bordó', async () => {
    const { readFile } = await import('node:fs/promises')
    const leer = (nombre) => readFile(join(RAIZ, 'src', 'assets', nombre), 'utf8')
    const [celular, tocada] = await Promise.all(['mapa-museo-movil.svg', 'mapa-museo-movil-tocada.svg'].map(leer))
    const raiz = (svg) => /^<svg width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)"/.exec(svg)?.slice(1).join(' ')
    assert.equal(raiz(tocada), raiz(celular))
    const trazados = (svg) => svg.match(/<path [^>]*\/>/g) ?? []
    const a = trazados(celular)
    const b = trazados(tocada)
    assert.equal(b.length, a.length)
    assert.equal(b.length, 187)
    // Trazado por trazado, iguales salvo el color de 27: los 14 rellenos de las salas (#EB622D y, el Jardín, #CF7349)
    // y los 13 contornos (#EB622D al 70 %), que pasan a #8A1812 (el contorno, al 100 %, como en el "Group 4").
    const rellenos = SALAS_DEL_PLANO.map((s) => s.d)
    let cambiados = 0
    a.forEach((p, i) => {
      if (p === b[i]) return
      cambiados++
      const d = / d="([^"]+)"/.exec(p)[1]
      assert.equal(/ d="([^"]+)"/.exec(b[i])[1], d, `trazado ${i}: la misma geometría`)
      if (rellenos.includes(d)) {
        assert.equal(b[i], p.replace(/fill="#(EB622D|CF7349)"/, 'fill="#8A1812"'), `relleno ${i}`)
      } else {
        assert.equal(b[i], p.replace('stroke="#EB622D" stroke-opacity=".7"', 'stroke="#8A1812"'), `contorno ${i}`)
      }
    })
    assert.equal(cambiados, 27)
    for (const color of ['#EB622D', '#CF7349']) assert.equal(cuantas(tocada, color), 0, color)
    assert.equal(cuantas(tocada, 'fill="#8A1812"'), 14)
    assert.equal(cuantas(tocada, 'stroke="#8A1812"'), 13)
    // Sin los nombres (ningún relleno blanco) y del mismo peso que el de celular.
    assert.equal(cuantas(tocada, 'fill="white"'), 0)
    assert.ok(Math.abs(tocada.length - celular.length) < 400, `${tocada.length} B`)
  })

  // Exposiciones, Novedades y las fichas de una muestra y de una novedad con el lenguaje del tablero "Web" (04/11/2026,
  // decisiones R1 a R7 del desarrollador): las listas con el hero de las páginas internas y su foto (con prioridad: el
  // LCP) y la página sobreFoto; las fichas sin hero, con el título arriba y la portada entera con su tope de alto; lo
  // que no está no se dibuja.
  const fotoN = (n, extra = {}) => ({
    clave: String(n % 10).repeat(16),
    ancho: 1600,
    alto: 1067,
    variantes: [480, 960, 1600],
    alt: `Foto ${n}`,
    decorativa: false,
    epigrafe: null,
    credito: null,
    ...extra,
  })
  const conSubtitulo = (titulo, texto) => ({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: titulo }] },
      { type: 'paragraph', content: [{ type: 'text', text: texto }] },
    ],
  })
  /** Las fotos del <main>: la del hero (una de src/assets) y las del panel (/fotos/…). */
  const fotosDelPanel = (html) => (html.match(/<img [^>]*>/g) ?? []).filter((img) => img.includes('src="/fotos/'))
  /**
   * El hero de una página interna (HeroPagina.jsx):
   * - la caja: debajo de lg, la del cuadro de celular (350 como mínimo; el texto abajo solo debajo de 32rem y arriba
   *   desde ahí); desde lg, el bloque de 480;
   * - la foto: sin lazy, con prioridad, sus cuatro anchos, su alt y su punto de interés; si trae posicionMovil, además
   *   la variable en el style y la clase que la usa debajo de 32rem; si no, ni una ni otra (el <img> de siempre);
   * - el degradé con sus dos fondos (el de celular y, desde lg, el del tablero), también con colores forzados;
   * - el bloque del texto: el ancho entero, la reserva del marco de celular, 64 abajo y, desde lg, el h1 a 208 o a 168.
   */
  function comprobarHero(main, id, titulo, imagen) {
    const hero = seccion(main, id)
    assert.ok(hero.startsWith(`<section aria-labelledby="${id}" class="relative"><div class="${CAJA_HERO_PAGINA}"><img `), `${id}: la caja`)
    assert.ok(hero.includes(`<h1 id="${id}" class="`), id)
    assert.ok(hero.includes(`>${titulo}</h1>`), titulo)
    assert.match(clasesDe(hero, /<h1 id="[^"]*" class="([^"]*)"/).join(' '), /font-hero .*font-\[weight:755\]/)
    // Debajo de lg, los respaldos medidos contra las frases que ahí deciden los renglones (la familia de las internas:
    // VREN-01).
    assert.deepEqual(clasesDe(hero, /<h1 id="[^"]*" class="([^"]*)"/).filter((c) => /(^|:)font-hero/.test(c)), ['font-hero', 'max-lg:font-hero-internas'], id)
    const fotos = hero.match(/<img [^>]*>/g)
    assert.equal(fotos.length, 1)
    assert.match(fotos[0], /fetchPriority="high"/)
    assert.doesNotMatch(fotos[0], /loading=/)
    assert.deepEqual([...fotos[0].matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [960, 1440, 1920, 2880])
    assert.ok(fotos[0].includes(`alt="${imagen.alt}"`), imagen.alt)
    const clasesFoto = clasesDe(fotos[0], / class="([^"]*)"/)
    if (imagen.posicionMovil) {
      assert.ok(fotos[0].includes(`style="object-position:${imagen.posicion};--posicion-movil:${imagen.posicionMovil}"`), fotos[0])
      assert.deepEqual(clasesFoto, ['absolute', 'inset-0', 'size-full', 'object-cover', 'max-[32rem]:object-(--posicion-movil)!'], id)
    } else {
      assert.ok(fotos[0].includes(`style="object-position:${imagen.posicion}"`), imagen.posicion)
      assert.deepEqual(clasesFoto, ['absolute', 'inset-0', 'size-full', 'object-cover'], id)
      assert.equal(cuantas(hero, 'posicion-movil'), 0, id)
    }
    assert.ok(hero.includes(`<div aria-hidden="true" class="${DEGRADE_HERO_PAGINA}"></div>`), `${id}: el degradé`)
    const texto = clasesDe(hero, /<\/div><div class="(relative mx-auto [^"]*)"><div class="mx-auto lg:max-w-/)
    assert.equal(texto.slice(0, -1).join(' '), TEXTO_HERO_PAGINA, `${id}: ${texto.join(' ')}`)
    assert.match(texto.at(-1), /^lg:pt-(52|\[10\.5rem\])$/, id)
  }
  /**
   * La bajada del hero de una página interna: debajo de 32rem, 16/24 con su halo en rem (la de la Home de celular);
   * desde 32rem, 32 px con el interlineado normal y el halo de la de la Home (A11Y-01); desdeLg, su interlineado ahí;
   * anchos, sus anchos máximos (la de Divulgación, en una columna de 320 debajo de 32rem: VREN-01).
   */
  function comprobarBajadaDeHero(clases, desdeLg, anchos = ['max-w-none', 'lg:max-w-[52.5rem]']) {
    assert.deepEqual(clases.filter((c) => /(^|:)max-w-/.test(c)), anchos)
    const esperadas = [
      'mt-4', 'text-base', 'leading-6', 'min-[32rem]:text-[2rem]',
      'min-[32rem]:leading-normal', SOMBRA_BAJADA_CELULAR, `min-[32rem]:${SOMBRA_BAJADA}`, desdeLg,
    ]
    for (const c of esperadas) assert.ok(clases.includes(c), `${c} en ${clases.join(' ')}`)
    // Lo de antes del cuadro de celular (20/30 debajo de 32rem y el halo en em en todos los anchos), ya no.
    for (const c of ['text-[1.25rem]', 'leading-normal', SOMBRA_BAJADA]) assert.ok(!clases.includes(c), `sobra ${c} en ${clases.join(' ')}`)
    assert.deepEqual(clases.filter((c) => /(^|:)leading-/.test(c)), ['leading-6', 'min-[32rem]:leading-normal', desdeLg])
  }
  /** El header de una página con o sin foto debajo (sobreFoto: los logos no se invierten con colores forzados). */
  const logosDelHeader = (html) => sinDialogo(delHeader(html)).match(/<img [^>]*>/g)

  test('Exposiciones (R1, R4): el hero con su foto (sobreFoto); Muestras y Salas con su rótulo y su h2; cada sala con su ancla', async () => {
    const e = contenido.paginas.exposiciones
    const muestras = [
      {
        titulo: 'Muestra actual con un título largo para ver cómo se parte',
        url: '/exposiciones/muestra-actual',
        resumen: 'El resumen de la actual.',
        portada: fotoN(1),
        etiqueta: 'Actual',
        detalle: 'Hasta el 30 de noviembre de 2026',
      },
      { titulo: 'Muestra permanente', url: '/exposiciones/muestra-permanente', resumen: null, portada: null, etiqueta: 'Permanente', detalle: null },
    ]
    const salas = [
      {
        nombre: 'Sala Triásico',
        ancla: 'sala-sala-triasico',
        resumen: 'La sala del Triásico.',
        descripcion: conSubtitulo('Lo que hay', 'Fósiles de Ischigualasto.'),
        portada: fotoN(2, { epigrafe: 'Un epígrafe', credito: 'Archivo MuPa' }),
        muestras: [
          { titulo: 'Muestra actual con un título largo para ver cómo se parte', url: '/exposiciones/muestra-actual' },
          { titulo: 'Muestra Paleontológicamente-Ischigualastoensemuestra', url: '/exposiciones/palabra-larga' },
        ],
      },
      { nombre: 'Sala sin nada', ancla: 'sala-sala-sin-nada', resumen: null, descripcion: null, portada: null, muestras: [] },
    ]
    const html = pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras, salas } })
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    comprobarHero(main, 'exposiciones-titulo', e.titulo, e.imagen)
    assert.equal(e.imagen.posicion, '40% 45%')
    assert.equal(e.imagen.posicionMovil, undefined)
    // sobreFoto: el logo y los isotipos del header no llevan data-logo-blanco (A11Y-08).
    assert.equal(paginasCargadas.exposiciones.sobreFoto, true)
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))

    // Muestras: el rótulo (el título de la página) y el h2; las tarjetas con la etiqueta, el título (el enlace,
    // estirado), la fecha y el resumen; la que no tiene portada, sin foto. Todas las fotos de las tarjetas, lazy.
    assert.ok(main.includes(`>${e.titulo}</p><h2 id="muestras" class="`))
    assert.ok(main.includes(`>${e.muestras}</h2>`))
    const lista = parte(main, '<ul class="mt-12 grid', '</ul>')
    assert.equal(cuantas(lista, '<article class="group relative flex flex-col">'), 2)
    assert.match(lista, /<p class="font-mono text-xs [^"]*uppercase order-2 mt-6">Actual<\/p><h3 class="[^"]*font-mono[^"]*uppercase[^"]*wrap-anywhere[^"]* order-3 mt-2"><a href="\/exposiciones\/muestra-actual" class="[^"]*after:absolute after:inset-0[^"]*">/)
    assert.ok(lista.includes('>Hasta el 30 de noviembre de 2026</p>'))
    assert.ok(lista.includes('>El resumen de la actual.</p>'))
    // La permanente, sin portada: la etiqueta arranca arriba (sin el aire de debajo de la foto).
    assert.match(lista, /<p class="font-mono text-xs [^"]*uppercase order-2">Permanente<\/p><h3 class="[^"]* order-3 mt-2">/)
    const [fotoTarjeta, ...otras] = lista.match(/<img [^>]*>/g)
    assert.equal(otras.length, 0)
    assert.match(fotoTarjeta, /loading="lazy" fetchPriority="low"/)
    assert.match(fotoTarjeta, /class="aspect-\[485\/355\] w-full rounded-xl object-cover order-1"/)

    // Salas: el rótulo y el h2; cada sala con su ancla (la usa "Ver en el sitio" del panel) y su h3. El ancla deja arriba
    // el aire de una sección (scroll-mt: PAN-01 de la verificación del rediseño).
    assert.ok(main.includes(`>${e.titulo}</p><h2 id="salas" class="`))
    const triasico = parte(main, '<section id="sala-sala-triasico" aria-labelledby="sala-sala-triasico-titulo"', '</section>')
    assert.ok(main.includes('<section id="sala-sala-triasico" aria-labelledby="sala-sala-triasico-titulo" class="grid scroll-mt-16 gap-8 lg:scroll-mt-20 '))
    assert.match(triasico, /<h3 id="sala-sala-triasico-titulo" class="font-titulo [^"]*font-thin[^"]*">Sala Triásico<\/h3>/)
    assert.ok(triasico.includes('>La sala del Triásico.</p>'))
    // La descripción: sus subtítulos en h4 (debajo del h3 de la sala), un nivel más chicos que el subtítulo del tablero
    // (el nombre de la sala ya lo es).
    assert.ok(triasico.includes('<h4 class="pt-2 text-xl leading-7 font-medium">Lo que hay</h4>'))
    // "En esta sala" y la muestra, como enlace con flecha, con la flecha pegada a la última palabra (PAN-02 de la
    // verificación del rediseño: en un título de varios renglones, al final del texto); 7,6 arriba y abajo.
    assert.match(triasico, new RegExp(`<h4 class="font-mono text-xs [^"]*mt-10">${e.enLaSala}</h4>`))
    assert.match(triasico, /<a href="\/exposiciones\/muestra-actual" class="inline-flex min-h-11 [^"]*max-w-full py-\[0\.475rem\]"><span class="min-w-0 wrap-anywhere">Muestra actual con un título largo para ver cómo se <span class="whitespace-nowrap">parte<svg [^>]*class="shrink-0 ml-2 inline-block size-5 align-\[-0\.25em\]"/)
    // De una última palabra de más de 8 caracteres, solo las últimas 4 letras van pegadas a la flecha (el resto se
    // parte si no entra); el texto del enlace es el título.
    assert.match(triasico, /<a href="\/exposiciones\/palabra-larga" [^>]*><span class="min-w-0 wrap-anywhere">Muestra Paleontológicamente-Ischigualastoensemue<span class="whitespace-nowrap">stra<svg /)
    // La portada entera (sin recorte), con esquinas de 16, lazy, con su epígrafe y su crédito, y con el tope de alto de la
    // de una ficha (75 % de la pantalla: el ancho sale de su proporción) y su sizes (EST-02 de la verificación).
    assert.match(triasico, /<figure><img src="\/fotos\/2{16}\/960\.webp"[^>]*loading="lazy"[^>]*class="h-auto rounded-2xl" style="width:min\(100%, calc\(75svh \* 1\.4995[0-9]*\)\)"\/><figcaption class="mt-3 text-sm leading-\[1\.375rem\] text-muted wrap-anywhere">Un epígrafe Foto: Archivo MuPa<\/figcaption><\/figure>/)
    const { tamanoSala } = await vite.ssrLoadModule('/src/paginas/Exposiciones.jsx')
    assert.ok(triasico.includes(`sizes="${tamanoSala(salas[0].portada)}"`))
    // La sala sin nada: solo su nombre.
    const vacia = parte(main, '<section id="sala-sala-sin-nada"', '</section>')
    assert.ok(vacia.includes('>Sala sin nada</h3>'))
    for (const fuera of ['<p', '<img', '<h4', '<ul']) assert.equal(cuantas(vacia, fuera), 0, fuera)
    // Ninguna foto del panel va con prioridad: la del primer pantallazo es la del hero (todas lazy y con prioridad baja).
    assert.equal(fotosDelPanel(main).length, 2)
    for (const img of fotosDelPanel(main)) assert.match(img, /loading="lazy" fetchPriority="low"/)

    // Sin muestras ni salas: solo el hero (sin rótulos ni secciones vacías).
    const sola = delMain(pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras: [], salas: [] } }))
    assert.equal(cuantas(sola, '<section'), 1)
    assert.equal(cuantas(sola, `>${e.titulo}</p>`), 0)
    assert.equal(cuantas(sola, '<h2'), 0)
  })

  test('la portada de una sala no pasa del 75 % de la pantalla: su sizes, con su proporción (tamanoSala, EST-02)', async () => {
    const { tamanoSala } = await vite.ssrLoadModule('/src/paginas/Exposiciones.jsx')
    const columna = [
      '(min-width: 90rem) 600px',
      '(min-width: 64rem) calc((100vw - 15rem) / 2)',
      '(min-width: 48rem) calc(100vw - 5rem)',
      'calc(100vw - 3rem)',
    ]
    // Sin medidas, el ancho de su columna (como hasta la corrección).
    assert.equal(tamanoSala({}), columna.join(', '))
    // Una vertical de 1680x4000: el tope de alto le deja 75 × 1680 / 4000 = 31,5vh de ancho; una apaisada, igual con su
    // proporción (el navegador se queda con lo menor).
    const conTope = (vh) => columna.map((c) => c.replace(/^(\(min-width: [^)]*\) )?(.*)$/, (_, m = '', t) => `${m}min(${t}, ${vh})`)).join(', ')
    assert.equal(tamanoSala({ ancho: 1680, alto: 4000 }), conTope('31.5vh'))
    assert.equal(tamanoSala({ ancho: 2400, alto: 1600 }), conTope('112.5vh'))
  })

  test('el h1 de las páginas internas: 64/72 desde md, 48 desde 32rem y 28/32 debajo (el cuadro de celular), en rem y con guiones (A11Y-01)', () => {
    // Con 64 desde 32rem, entre 512 y ~600 px (el zoom de un escritorio) "Exposiciones" y "encontramos" se partían por
    // la mitad, y "paleontológicos" (el título de una ficha) hasta 767; a 320, con 32, "encontramo / s". Debajo de 32rem
    // va en 28/32, el del cuadro de celular (hasta el 10/11/2026, 30 con el interlineado de 1,125).
    const tamanos = ['text-[1.75rem]', 'leading-8', 'min-[32rem]:text-[3rem]', 'min-[32rem]:leading-[1.125]', 'md:text-[4rem]', 'hyphens-auto']
    // Los de antes del cuadro de celular (30 px acá y 32 en la Home) y el paso de la Home a 64 en 32rem, que no van.
    const sobran = ['text-[1.875rem]', 'leading-[1.125]', 'text-[2rem]', 'min-[32rem]:text-[4rem]']
    const h1De = (html) => clasesDe(delMain(html), /<h1(?: id="[^"]*")? class="([^"]*)"/)
    const casos = {
      hero: h1De(pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras: [], salas: [] } })),
      novedades: h1De(pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { proximas: [], noticias: [], pagina: 1, paginas: 1 } })),
      contacto: h1De(pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_VACIO, datos: { ...SIN_AVISOS, formulario: false } })),
      visitas: h1De(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } })),
      divulgacion: h1De(pagina({ pagina: 'divulgacion', ruta: '/divulgacion', museo: MUSEO_VACIO, datos: { novedades: [] } })),
      educacion: h1De(pagina({ pagina: 'educacion', ruta: '/educacion', museo: MUSEO_VACIO, datos: {} })),
      circuitos: h1De(pagina({ pagina: 'circuitos', ruta: '/circuitos', museo: MUSEO_VACIO, datos: {} })),
      elMuseo: h1De(pagina({ pagina: 'el-museo', ruta: '/el-museo', museo: MUSEO_VACIO, datos: {} })),
      ficha: h1De(pagina({ pagina: 'muestra', ruta: '/exposiciones/x', museo: MUSEO_VACIO, datos: { titulo: 'Herrerasaurus ischigualastensis' } })),
      noEncontrada: h1De(pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_VACIO })),
    }
    for (const [nombre, clases] of Object.entries(casos)) {
      for (const t of tamanos) assert.ok(clases.includes(t), `${nombre}: ${t} en ${clases.join(' ')}`)
      for (const t of sobran) assert.ok(!clases.includes(t), `${nombre}: sobra ${t} en ${clases.join(' ')}`)
      assert.ok(!clases.some((c) => /vw|clamp/.test(c)), `${nombre}: ${clases.join(' ')}`)
      // Un solo tamaño y un solo interlineado por tramo.
      assert.deepEqual(clases.filter((c) => /(^|:)text-\[/.test(c)), ['text-[1.75rem]', 'min-[32rem]:text-[3rem]', 'md:text-[4rem]'], nombre)
      assert.deepEqual(clases.filter((c) => /(^|:)leading-/.test(c)), ['leading-8', 'min-[32rem]:leading-[1.125]'], nombre)
    }
    // El halo pegado a las letras de los h1 de los ocho hero, en rem (no se achica con la letra del celular; desde md
    // es el de antes); las fichas y la 404, sin foto detrás, sin sombra.
    const conHero = ['hero', 'novedades', 'contacto', 'visitas', 'divulgacion', 'educacion', 'circuitos', 'elMuseo']
    for (const nombre of conHero) {
      assert.ok(casos[nombre].includes(SOMBRA_H1_PAGINA) && !casos[nombre].includes(SOMBRA_H1), `${nombre}: ${casos[nombre].join(' ')}`)
    }
    for (const nombre of ['ficha', 'noEncontrada']) assert.ok(!casos[nombre].some((c) => c.includes('text-shadow')), nombre)
    // Los guiones con al menos 5 letras a cada lado, en los h1 de los hero (DV4, 06/11/2026: «divulgación científica»
    // en tres renglones no se parte «cien- / tífica»); en el título de una ficha (lo carga el museo) y en el de la 404
    // (TITULO_SIN_FOTO), sin ese límite.
    const limite = '[hyphenate-limit-chars:auto_5_5]'
    for (const nombre of conHero) assert.ok(casos[nombre].includes(limite), nombre)
    for (const nombre of ['ficha', 'noEncontrada']) assert.ok(!casos[nombre].includes(limite), nombre)
    // El de la Home, sin el paso intermedio (sus palabras entran a 64 desde 32rem): 28/32 debajo de 32rem (el cuadro de
    // celular de la Home) y 64/72 desde ahí, con el mismo halo en rem y sin guiones.
    const home = clasesDe(pagina({ pagina: 'home', museo: MUSEO_VACIO, datos: { novedades: [] } }), /<h1 id="home-titulo" class="([^"]*)"/)
    assert.deepEqual(home.filter((c) => /(^|:)text-\[/.test(c)), ['text-[1.75rem]', 'min-[32rem]:text-[4rem]'])
    assert.deepEqual(home.filter((c) => /(^|:)leading-/.test(c)), ['leading-8', 'min-[32rem]:leading-[1.125]'])
    assert.ok(home.includes(SOMBRA_H1_PAGINA) && !home.includes(SOMBRA_H1), home.join(' '))
    for (const clase of ['hyphens-auto', limite]) assert.ok(!home.includes(clase), clase)
  })

  test('Novedades (R1, R4): el hero en todas las páginas; las secciones con su rótulo; la paginación con flechas, solo con más de una página', () => {
    const n = contenido.paginas.novedades
    const proximas = [
      {
        titulo: 'Actividad que viene',
        url: '/novedades/actividad-que-viene',
        resumen: 'El resumen de la actividad.',
        portada: fotoN(3),
        detalle: 'Sábado 14 de noviembre de 2026, 18:00',
        fechaIso: '2026-11-14T18:00-03:00',
      },
    ]
    const noticias = [
      { titulo: 'Noticia 1', url: '/novedades/noticia-1', resumen: 'El resumen de la noticia.', portada: fotoN(4), detalle: '3 de noviembre de 2026', fechaIso: '2026-11-03' },
      { titulo: 'Noticia sin foto', url: '/novedades/noticia-sin-foto', resumen: null, portada: null, detalle: null, fechaIso: null },
    ]
    const html = pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { pagina: 1, paginas: 1, proximas, noticias } })
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    comprobarHero(main, 'novedades-titulo', n.titulo, n.imagen)
    assert.equal(n.imagen.posicionMovil, undefined)
    assert.equal(paginasCargadas.novedades.sobreFoto, true)
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    assert.ok(main.includes(`>${n.titulo}</p><h2 id="proximas" class="`))
    assert.ok(main.includes(`>${n.proximas}</h2>`))
    assert.ok(main.includes(`>${n.titulo}</p><h2 id="noticias" class="`))
    assert.ok(main.includes(`>${n.noticias}</h2>`))
    // La fecha con <time>; la que no tiene fecha ni resumen ni foto, solo su título.
    assert.ok(main.includes('<time dateTime="2026-11-14T18:00-03:00">Sábado 14 de noviembre de 2026, 18:00</time>'))
    assert.ok(main.includes('<time dateTime="2026-11-03">3 de noviembre de 2026</time>'))
    const sinFoto = main.split('<article').find((a) => a.includes('>Noticia sin foto</a>'))
    assert.match(sinFoto, /^ class="group relative flex flex-col"><h3 class="[^"]* order-3"><a [^>]*>Noticia sin foto<\/a><\/h3><\/article>/)
    for (const img of fotosDelPanel(main)) assert.match(img, /loading="lazy" fetchPriority="low"/)
    // Con una sola página, sin paginación.
    assert.equal(cuantas(main, '<nav'), 0)

    // La página 2 de 3: el mismo hero, sin las próximas, y la paginación debajo de las noticias, dentro de su sección.
    const dos = delMain(pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { pagina: 2, paginas: 3, proximas: [], noticias } }))
    comprobarHero(dos, 'novedades-titulo', n.titulo, n.imagen)
    assert.equal(cuantas(dos, 'id="proximas"'), 0)
    const nav = parte(dos, `<nav aria-label="${n.paginas}"`, '</nav>')
    // Desde sm, en tres columnas: cada cosa en la suya, esté o no la otra (no se corren de una página a otra: EST-04).
    assert.match(nav, /^<nav aria-label="[^"]*" class="mt-16 flex [^"]*sm:grid sm:grid-cols-\[1fr_auto_1fr\]">/)
    assert.match(nav, /<a href="\/novedades" rel="prev" class="inline-flex min-h-11 [^"]*font-mono[^"]* sm:col-start-1 sm:justify-self-start"><svg [^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>Anterior<\/a>/)
    // "Página 2 de 3" como el contador del carrusel de la Home (Roboto Mono Medium 24 en blanco: EST-04), en el medio.
    assert.ok(nav.includes(`<p class="font-mono text-2xl leading-[1.2] font-medium text-blanco sm:col-start-2">${n.pagina(2, 3)}</p>`))
    assert.match(nav, /<a href="\/novedades\?pagina=3" rel="next" class="inline-flex min-h-11 [^"]* sm:col-start-3 sm:justify-self-end">Siguiente<svg /)
    assert.ok(seccion(dos, 'noticias').includes('<nav'), 'la paginación va en la sección de las noticias')
    // En la última, sin "Siguiente"; en la primera, sin "Anterior" (no se dibuja un "Anterior" que no lleva a ningún lado).
    const tres = delMain(pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { pagina: 3, paginas: 3, proximas: [], noticias } }))
    assert.equal(cuantas(tres, 'rel="next"'), 0)
    assert.equal(cuantas(tres, 'rel="prev"'), 1)
    const una = delMain(pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { pagina: 1, paginas: 3, proximas, noticias } }))
    assert.equal(cuantas(una, 'rel="prev"'), 0)
    assert.match(una, /<a href="\/novedades\?pagina=2" rel="next"/)
    const navUna = parte(una, `<nav aria-label="${n.paginas}"`, '</nav>')
    assert.match(navUna, /^<nav [^>]*><p class="[^"]* sm:col-start-2">/)
    assert.equal(cuantas(navUna, n.anterior), 0)
    // Sin nada que mostrar: solo el hero.
    const sola = delMain(pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { pagina: 1, paginas: 1, proximas: [], noticias: [] } }))
    assert.equal(cuantas(sola, '<section'), 1)
    assert.equal(cuantas(sola, '<h2'), 0)
  })

  test('las fichas (R2): sin hero ni sobreFoto; el título arriba; la portada entera con prioridad y su tope de alto; lo que no está no se dibuja', async () => {
    const { tamanoPortada } = await vite.ssrLoadModule('/src/components/Ficha.jsx')
    const e = contenido.paginas.exposiciones
    const portada = fotoN(5, { ancho: 1200, alto: 2400, epigrafe: 'Epígrafe de la portada', credito: 'Ana Pérez' })
    const muestra = {
      titulo: 'Muestra actual',
      slug: 'muestra-actual',
      resumen: 'El resumen de la muestra.',
      situacion: 'Actual',
      fechas: 'Del 1 de octubre al 30 de noviembre de 2026',
      sala: { nombre: 'Sala Triásico', url: '/exposiciones#sala-sala-triasico' },
      portada,
      descripcion: conSubtitulo('Un subtítulo', 'La descripción.'),
      galeria: [fotoN(6), fotoN(7, { epigrafe: 'Otra' })],
    }
    const html = pagina({ pagina: 'muestra', ruta: '/exposiciones/muestra-actual', museo: MUSEO_VACIO, datos: muestra })
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    // Sin hero: ni la foto del hero ni su degradé, y la página no es sobreFoto (el logo se invierte con colores forzados).
    assert.equal(paginasCargadas.muestra.sobreFoto, undefined)
    assert.equal(cuantas(main, 'linear-gradient'), 0)
    assert.equal(cuantas(main, 'hero-'), 0)
    for (const img of logosDelHeader(html)) assert.ok(img.includes('data-logo-blanco=""'), img.slice(0, 120))
    // El contenedor del tablero con el lugar del header (debajo de lg, la reserva del marco de celular); el enlace a
    // la sección con la flecha; la etiqueta y el h1.
    assert.match(main, /<article class="mx-auto w-full max-w-tablero px-6 md:px-10 lg:px-20 pt-\[10\.0625rem\] pb-16 lg:pt-52 lg:pb-20">/)
    assert.match(main, new RegExp(`<p><a href="/exposiciones" class="inline-flex min-h-11 [^"]*font-mono[^"]*"><svg [^>]*>[\\s\\S]*?</svg>${e.titulo}</a></p>`))
    assert.match(main, /<p class="font-mono text-sm [^"]*uppercase">Actual<\/p><h1 class="font-hero [^"]*font-\[weight:755\][^"]*wrap-anywhere[^"]* mt-6">Muestra actual<\/h1>/)
    assert.ok(main.includes('>Del 1 de octubre al 30 de noviembre de 2026</p>'))
    // La sala, como los datos de una actividad (EST-06): en un <dl> (a lo ancho: es un dato solo), el rótulo "Sala" y
    // debajo el enlace (que sube 8 px: mide 44 y su texto, 28).
    assert.match(main, /<dl class="mt-8"><div class="flex min-w-0 flex-col gap-2"><dt class="font-mono text-xs [^"]*uppercase">Sala<\/dt><dd class="text-lg leading-7 [^"]*text-muted[^"]* -mt-2"><a href="\/exposiciones#sala-sala-triasico" class="inline-flex min-h-11 [^"]*">Sala Triásico<\/a><\/dd><\/div><\/dl>/)
    assert.equal(cuantas(main, 'Sala:'), 0)
    assert.ok(main.includes('<p class="text-xl leading-8 font-normal text-paper wrap-anywhere text-pretty mt-8">El resumen de la muestra.</p>'))
    // La portada: entera (sin recorte ni proporción forzada), con prioridad (el LCP), su tope de alto, esquinas de 16 y
    // su epígrafe y su crédito.
    const fotos = fotosDelPanel(main)
    assert.equal(fotos.length, 3)
    const [fotoPortada, ...deLaGaleria] = fotos
    assert.match(fotoPortada, /fetchPriority="high"/)
    assert.doesNotMatch(fotoPortada, /loading=/)
    assert.ok(fotoPortada.includes(`sizes="${tamanoPortada(portada)}"`))
    assert.match(fotoPortada, /class="h-auto rounded-2xl" style="width:min\(100%, calc\(75svh \* 0\.5\)\)"/)
    assert.doesNotMatch(fotoPortada, /object-cover|aspect-/)
    assert.ok(main.includes('<figcaption class="mt-3 text-sm leading-[1.375rem] text-muted wrap-anywhere">Epígrafe de la portada Foto: Ana Pérez</figcaption>'))
    // El texto: sus subtítulos en h2 (debajo del h1), con las clases del tablero (el subtítulo de una columna de texto del
    // tablero: Thin 40/52, EST-05), en su columna de 42 em.
    assert.match(main, /<div class="text-lg leading-\[1\.875rem\] [^"]*\[&amp;&gt;\*\+\*\]:mt-6 mt-12 max-w-\[42em\]"><h2 class="font-titulo text-\[1\.75rem\] leading-9 font-thin min-\[32rem\]:text-\[2\.5rem\] min-\[32rem\]:leading-\[3\.25rem\]">Un subtítulo<\/h2><p>La descripción\.<\/p><\/div>/)
    // La galería: su sección con el rótulo (la sección del sitio) y el h2; las fotos enteras, lazy y con prioridad baja
    // (no le disputan el ancho de banda a la portada: ajuste del LCP, 05/11/2026).
    const galeria = seccion(main, 'fotos')
    assert.match(galeria, new RegExp(`<section aria-labelledby="fotos" class="mt-16 lg:mt-20"><p class="font-mono text-sm [^"]*">${e.titulo}</p><h2 id="fotos" class="font-titulo [^"]* mt-4 lg:mt-6">${contenido.paginas.fotos}</h2><ul class="mt-12 columns-1 gap-10 sm:columns-2 lg:columns-3">`))
    for (const img of deLaGaleria) {
      assert.match(img, /loading="lazy" fetchPriority="low"/)
      assert.match(img, /class="h-auto w-full rounded-2xl"/)
    }

    // Una muestra con solo el título: nada más que el enlace a la sección y el h1.
    const sola = delMain(pagina({ pagina: 'muestra', ruta: '/exposiciones/sola', museo: MUSEO_VACIO, datos: { titulo: 'Solo el título' } }))
    assert.match(sola, /<h1 class="font-hero [^"]*">Solo el título<\/h1>/)
    assert.equal(cuantas(sola, '<img'), 0)
    assert.equal(cuantas(sola, '<section'), 0)
    assert.equal(cuantas(sola, 'Sala:'), 0)
    assert.equal(cuantas(sola, '<p class="font-mono text-sm'), 0)

    // Una noticia: su fecha con <time>, sin datos de actividad ni etiqueta ni inscripción.
    const nov = contenido.paginas.novedad
    const noticia = delMain(
      pagina({
        pagina: 'novedad',
        ruta: '/novedades/noticia',
        museo: MUSEO_VACIO,
        datos: { tipo: 'noticia', titulo: 'Una noticia', resumen: null, fecha: '3 de noviembre de 2026', fechaIso: '2026-11-03', actividad: null, portada: fotoN(8), cuerpo: null, galeria: [] },
      }),
    )
    assert.match(noticia, new RegExp(`<p><a href="/novedades" class="inline-flex min-h-11 [^"]*"><svg [^>]*>[\\s\\S]*?</svg>${contenido.paginas.novedades.titulo}</a></p>`))
    assert.ok(noticia.includes('<time dateTime="2026-11-03">3 de noviembre de 2026</time>'))
    for (const fuera of ['<dl', nov.inscripcion, nov.realizada, 'id="fotos"', '<p class="font-mono text-sm']) assert.equal(cuantas(noticia, fuera), 0, fuera)
    assert.match(fotosDelPanel(noticia)[0], /fetchPriority="high"/)

    // Una actividad que viene: cuándo, dónde y cuánto, cada uno con su rótulo, e "Inscribirse" (el botón naranja con el
    // texto oscuro).
    const viene = delMain(
      pagina({
        pagina: 'novedad',
        ruta: '/novedades/actividad',
        museo: MUSEO_VACIO,
        datos: {
          tipo: 'actividad',
          titulo: 'Una actividad',
          fecha: '1 de noviembre de 2026',
          fechaIso: '2026-11-01',
          actividad: { cuando: 'Sábado 14 de noviembre de 2026, 18:00', cuandoIso: '2026-11-14T18:00-03:00', realizada: false, lugar: 'https://example.com/un-lugar-que-es-una-direccion-larguisima', costo: 'Gratis', inscripcion: 'https://example.com/inscripcion' },
          portada: null,
          cuerpo: null,
          galeria: [],
        },
      }),
    )
    const dl = parte(viene, '<dl', '</dl>')
    assert.deepEqual([...dl.matchAll(/<dt class="[^"]*">([^<]*)<\/dt>/g)].map((m) => m[1]), [nov.cuando, nov.lugar, nov.costo])
    assert.ok(dl.includes('<time dateTime="2026-11-14T18:00-03:00">Sábado 14 de noviembre de 2026, 18:00</time>'))
    assert.match(dl, /<dd class="[^"]*wrap-anywhere">https:\/\/example\.com\/un-lugar/)
    assert.match(viene, new RegExp(`<a href="https://example.com/inscripcion" class="inline-flex min-h-11 [^"]*bg-naranja [^"]*text-ink [^"]*">${nov.inscripcion}</a>`))
    // Una actividad no lleva la fecha de publicación (como antes) y, sin portada, no hay ninguna foto.
    assert.equal(cuantas(viene, '1 de noviembre de 2026'), 0)
    assert.equal(cuantas(viene, '<img'), 0)
    // La realizada: "Realizada" como etiqueta, solo cuándo y sin la inscripción.
    const realizada = delMain(
      pagina({
        pagina: 'novedad',
        ruta: '/novedades/realizada',
        museo: MUSEO_VACIO,
        datos: { tipo: 'actividad', titulo: 'Una realizada', actividad: { cuando: 'Ayer', cuandoIso: '2026-11-03T18:00-03:00', realizada: true, lugar: null, costo: null, inscripcion: null }, portada: null, cuerpo: null, galeria: [] },
      }),
    )
    assert.match(realizada, new RegExp(`<p class="font-mono text-sm [^"]*uppercase">${nov.realizada}</p><h1 class="[^"]* mt-6">Una realizada</h1>`))
    assert.deepEqual([...realizada.matchAll(/<dt class="[^"]*">([^<]*)<\/dt>/g)].map((m) => m[1]), [nov.cuando])
    assert.equal(cuantas(realizada, nov.inscripcion), 0)
  })

  // Contacto con el lenguaje del tablero "Web" (05/11/2026, decisiones R1, R3 y R4): el hero con su foto y la página
  // sobreFoto; los datos como las tarjetas de información de Visitas (en un <dl>, cada una con su ícono) y el mapa de
  // 1280x400; el formulario con los campos, los avisos y el botón del tablero, en todos sus estados (los arma el
  // servidor: server/paginas.js y server/contacto.js). Lo que no está no se dibuja.
  const SIN_AVISOS = { formulario: true, enviado: false, valores: null, errores: null, error: null }
  const contacto = (museo, datos = SIN_AVISOS) => delMain(pagina({ pagina: 'contacto', ruta: '/contacto', museo, datos }))
  /** El aviso con que llega la página (el resumen de errores, el error de todo el formulario o "Recibimos tu mensaje"). */
  const avisoDe = (main) => /<(div|p) tabindex="-1" role="([^"]*)"(?: aria-labelledby="[^"]*")? class="([^"]*)">([\s\S]*?)<\/\1>/.exec(main)

  test('Contacto (R1, R4): el hero con su foto (sobreFoto); los datos como tarjetas con su ícono y el mapa de 1280x400; el formulario del tablero', () => {
    const c = contenido.contacto
    const f = c.formulario
    const html = pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_MAXIMO, datos: SIN_AVISOS })
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    comprobarHero(main, 'contacto-titulo', c.titulo, c.imagen)
    // El punto de interés: el cartel, entero y debajo del h1 también más allá de 1440 (EST-03 de la verificación).
    assert.equal(c.imagen.posicion, '50% 88%')
    // En el celular el h1 va abajo: la foto se corre a la derecha para que no quede encima de las letras del cartel.
    assert.equal(c.imagen.posicionMovil, '100% 88%')
    assert.equal(paginasCargadas.contacto.sobreFoto, true)
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    // Las dos secciones, en este orden: los datos y el formulario.
    assert.ok(main.indexOf('aria-labelledby="datos-contacto"') < main.indexOf('<section id="formulario"'))

    // Los datos: el rótulo (el título de la página) y el h2; cuatro tarjetas en un <dl>, cada una con su ícono
    // (aria-hidden), su rótulo (Roboto Mono 12) y su dato (Regular 18/28 en gris); en dos columnas de 620 con 40 entre sí
    // desde lg (no en cuatro: el correo se partía, EST-01 de la verificación), con el padding de las de Visitas.
    const datos = seccion(main, 'datos-contacto')
    assert.ok(datos.includes(`>${c.titulo}</p><h2 id="datos-contacto" class="`))
    assert.deepEqual(margenesDelH2(datos, 'datos-contacto'), ['mt-4', 'lg:mt-6'])
    assert.ok(datos.includes(`>${c.datos}</h2>`))
    const dl = parte(datos, '<dl', '</dl>')
    assert.match(dl, /^<dl class="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0">/)
    assert.equal(cuantas(dl, 'xl:grid-cols-4'), 0)
    const tarjetas = [...dl.matchAll(/<div class="flex min-w-0 flex-col gap-5 lg:px-6 lg:py-10 xl:px-10"><dt class="flex items-center gap-4"><span class="([^"]*)"><svg ([^>]*)>[\s\S]*?<\/svg><\/span><span class="([^"]*)">([^<]*)<\/span><\/dt><dd class="([^"]*)">/g)]
    assert.deepEqual(tarjetas.map((m) => m[4]), [c.direccion, c.telefono, c.correo, c.redes])
    for (const [, cuadro, svg, rotulo, , dato] of tarjetas) {
      assert.match(cuadro, /size-12 [^"]*rounded-xl bg-caja/)
      assert.match(svg, /aria-hidden="true"/)
      assert.match(rotulo, /^font-mono text-xs [^"]*uppercase$/)
      assert.match(dato, /^text-lg leading-7 font-normal text-muted wrap-anywhere/)
    }
    assert.ok(dl.includes('<address class="not-italic"><span class="block">EJEMPLO · Avenida de ejemplo 1234 (Oeste), entre calle Uno y calle Dos, edificio de la ex estación</span><span class="block">5400 EJEMPLO · Ciudad de San Juan, San Juan</span></address>'))
    // El teléfono, el correo y las redes son enlaces de 44 px: su dato sube 8 px (-mt-2); la dirección, no.
    assert.deepEqual(tarjetas.map((m) => m[5].endsWith(' -mt-2')), [false, true, true, true])
    assert.match(dl, /<a href="tel:\+542640000000" class="inline-flex min-h-11 [^"]*underline[^"]*">\+54 264 000-0000<\/a>/)
    assert.match(dl, /<a href="mailto:museo@example\.com" aria-label="museo@example\.com" class="inline-flex min-h-11 [^"]*"><span>museo@<wbr\/>example\.com<\/span><\/a>/)
    const redes = [...dl.matchAll(/<li class="min-w-0"><a href="([^"]*)" class="inline-flex min-h-11 [^"]*">([^<]*)<\/a><\/li>/g)]
    assert.deepEqual(redes.map((m) => [m[1], m[2]]), MUSEO_MAXIMO.redes.map((r) => [r.url, REDES[r.red]]))
    // El mapa como en Visitas: 1280x400 con esquinas de 16, title y lazy; 16 abajo "Abrir en Google Maps" con la flecha.
    assert.match(datos, /<iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=EJEMPLO" title="[^"]+" loading="lazy" class="block h-\[25rem\] w-full rounded-2xl [^"]*"><\/iframe><p class="mt-4"><a href="https:\/\/example\.com\/mapa" class="inline-flex min-h-11 [^"]*font-mono[^"]*">/)
    assert.ok(datos.includes(`${c.abrirMapa}<svg `))

    // El formulario: el rótulo y el h2; "Todos los campos son obligatorios." como bajada; las etiquetas con la letra del
    // rótulo de una sección, pero sin pasar a mayúsculas (son el nombre del campo para el lector de pantalla: A11Y-03 de
    // la verificación); los campos con el fondo, el borde y el foco del tablero; el nombre y el correo lado a lado y el
    // mensaje a lo ancho (se agranda solo hacia abajo); el botón naranja con el texto oscuro (D4) y un borde transparente
    // (con colores forzados se ve: A11Y-02). Sin aviso.
    const form = parte(main, '<section id="formulario"', '</section>')
    assert.match(form, /^<section id="formulario" aria-labelledby="formulario-titulo" class="py-16 lg:py-20">/)
    assert.ok(form.includes(`>${c.titulo}</p><h2 id="formulario-titulo" class="`))
    assert.deepEqual(margenesDelH2(form, 'formulario-titulo'), ['mt-4', 'lg:mt-6'])
    assert.ok(form.includes(`>${f.titulo}</h2>`))
    assert.equal(avisoDe(form), null)
    assert.match(form, /<form class="mt-12 grid gap-x-10 gap-y-8 lg:grid-cols-2" action="\/contacto#formulario" method="post">/)
    assert.ok(form.includes(`<p class="text-lg leading-7 font-normal text-muted text-pretty lg:col-span-2">${f.obligatorios}</p>`))
    for (const [campo, columnas] of [['nombre', 'min-w-0'], ['email', 'min-w-0'], ['mensaje', 'min-w-0 lg:col-span-2']]) {
      assert.match(form, new RegExp(`<div class="${columnas}"><label for="contacto-${campo}" class="block font-mono text-sm leading-5 font-medium text-paper">`), campo)
      const control = new RegExp(`<(?:input|textarea)[^>]*id="contacto-${campo}"[^>]*>`).exec(form)[0]
      assert.match(control, /class="mt-3 block w-full scroll-mt-32 [^"]*border bg-caja [^"]*text-paper [^"]*focus-visible:outline-blanco border-muted/, campo)
    }
    assert.match(form, /<textarea [^>]*class="[^"]* resize-y"/)
    assert.match(form, new RegExp(`<button type="submit" class="inline-flex min-h-11 [^"]*border border-transparent bg-naranja [^"]*text-ink [^"]* cursor-pointer aria-disabled:cursor-wait">${f.enviar}</button>`))
    assert.equal(cuantas(form, 'uppercase'), 1, 'solo el rótulo de la sección va en mayúsculas')
    // La trampa, igual que siempre.
    assert.ok(form.includes('<div aria-hidden="true" class="sr-only"><label for="contacto-sitio-web">'))
  })

  test('Contacto: los avisos del formulario con su caja (errores, 429, 503 con el cuadro de solo lectura, "Recibimos tu mensaje")', () => {
    const f = contenido.contacto.formulario
    const valores = { nombre: 'Ana', email: 'no es un correo', mensaje: 'corto' }
    // Los errores de los campos: el resumen (grupo con su título) con enlaces de 44 px a cada campo; cada campo con su
    // error (16/24 en naranja, entre la etiqueta y el control) y el borde naranja; lo escrito vuelve.
    let main = contacto(MUSEO_MAXIMO, { ...SIN_AVISOS, valores, errores: { email: 'invalido', mensaje: 'corto' } })
    let aviso = avisoDe(main)
    assert.equal(aviso[2], 'group')
    assert.match(aviso[3], /^mt-12 w-fit max-w-full rounded-xl border bg-caja [^"]* border-naranja$/)
    assert.ok(aviso[4].includes(`<h3 id="contacto-revisar" class="font-medium">${f.revisar}</h3>`))
    assert.deepEqual([...aviso[4].matchAll(/<a href="(#[^"]*)" class="[^"]*underline[^"]* inline-flex min-h-11 items-center">/g)].map((m) => m[1]), ['#contacto-email', '#contacto-mensaje'])
    for (const campo of ['email', 'mensaje']) {
      assert.match(main, new RegExp(`</label><p id="contacto-${campo}-error" class="mt-2 text-base leading-6 font-normal text-naranja">`), campo)
      assert.match(new RegExp(`<(?:input|textarea)[^>]*id="contacto-${campo}"[^>]*>`).exec(main)[0], /aria-invalid="true" aria-describedby="contacto-[a-z]+-error" class="[^"]* border-naranja/, campo)
    }
    assert.match(/<input[^>]*id="contacto-nombre"[^>]*>/.exec(main)[0], /border-muted/)
    assert.match(main, /<input type="text" [^>]*value="Ana"\/>/)
    assert.match(main, /<textarea [^>]*>corto<\/textarea>/)

    // El 429 (y cualquier error de todo el formulario): el aviso (alert) con el correo público como enlace del tablero,
    // y el formulario con lo escrito. Sin correo público, sin "o escribinos a".
    main = contacto(MUSEO_MAXIMO, { ...SIN_AVISOS, valores, error: 'limite_ip' })
    aviso = avisoDe(main)
    assert.equal(aviso[2], 'alert')
    assert.match(aviso[3], / border-naranja$/)
    assert.match(aviso[4], new RegExp(`^<p>${f.generales.limite_ip} ${f.oEscribinos} <a href="mailto:museo@example\\.com" class="rounded-sm underline [^"]*">museo@example\\.com</a>\\.</p>$`))
    assert.ok(main.includes('<form '))
    aviso = avisoDe(contacto(MUSEO_VACIO, { ...SIN_AVISOS, valores, error: 'limite_dia' }))
    assert.equal(aviso[4], `<p>${f.generales.limite_dia}.</p>`)

    // El 503 no_disponible (el formulario se apagó mientras la persona escribía): el aviso, sin formulario, y lo escrito
    // en el cuadro de solo lectura, con su etiqueta como las de los campos.
    main = contacto(MUSEO_MAXIMO, { ...SIN_AVISOS, formulario: false, valores, error: 'no_disponible' })
    assert.equal(avisoDe(main)[2], 'alert')
    assert.equal(cuantas(main, '<form'), 0)
    assert.match(main, /<div class="mt-12 min-w-0"><label for="contacto-escrito" class="block font-mono text-sm leading-5 font-medium text-paper">Tu mensaje<\/label><textarea id="contacto-escrito" readOnly="" rows="8" class="[^"]*bg-caja [^"]*border-muted resize-y">corto<\/textarea><\/div>/)

    // "Recibimos tu mensaje" (status), con el borde verde, y el formulario debajo.
    main = contacto(MUSEO_MAXIMO, { ...SIN_AVISOS, enviado: true })
    aviso = avisoDe(main)
    assert.equal(aviso[1], 'p')
    assert.equal(aviso[2], 'status')
    assert.match(aviso[3], / border-verde-claro$/)
    assert.equal(aviso[4], f.enviado)
    assert.ok(main.indexOf(f.enviado) < main.indexOf('<form '))
  })

  test('Contacto: cada tarjeta solo con su dato; el mapa solo el de Google; sin datos ni formulario, solo el hero', () => {
    const c = contenido.contacto
    /** Los rótulos de las tarjetas de los datos (o null si la sección no se dibuja). */
    const tarjetas = (museo, datos = SIN_AVISOS) => {
      const main = contacto({ ...MUSEO_VACIO, ...museo }, datos)
      if (!main.includes('aria-labelledby="datos-contacto"')) return null
      return [...seccion(main, 'datos-contacto').matchAll(/<\/span><span class="font-mono text-xs [^"]*">([^<]*)<\/span><\/dt>/g)].map((m) => m[1])
    }
    // Sin nada del museo y sin formulario: solo el hero (ni las secciones ni sus rótulos).
    const solo = contacto(MUSEO_VACIO, { ...SIN_AVISOS, formulario: false })
    assert.equal(cuantas(solo, '<section'), 1)
    assert.equal(cuantas(solo, '<h2'), 0)
    // Sin nada del museo y con formulario: el hero y el formulario.
    assert.equal(tarjetas({}), null)
    assert.ok(contacto(MUSEO_VACIO).includes('<section id="formulario"'))
    // Con formulario apagado y datos: solo los datos.
    assert.equal(cuantas(contacto(MUSEO_MAXIMO, { ...SIN_AVISOS, formulario: false }), '<section id="formulario"'), 0)
    // Cada tarjeta, solo con su dato; en el orden de siempre.
    assert.deepEqual(tarjetas({ localidad: 'San Juan' }), [c.direccion])
    assert.deepEqual(tarjetas({ emailPublico: 'museo@example.com', redes: MUSEO_MAXIMO.redes.slice(0, 1) }), [c.correo, c.redes])
    assert.equal(tarjetas({ emailPublico: 'no es un correo' }), null)
    // El teléfono: con tel: si es un número (sube 8 px); si no, como texto.
    let main = contacto({ ...MUSEO_VACIO, telefono: '4200000 / 4200001' })
    assert.ok(main.includes('<dd class="text-lg leading-7 font-normal text-muted wrap-anywhere">4200000 / 4200001</dd>'))
    assert.equal(cuantas(main, 'href="tel:'), 0)
    main = contacto({ ...MUSEO_VACIO, telefono: '+54 264 000-0000' })
    assert.match(main, /<dd class="[^"]* -mt-2"><a href="tel:\+542640000000"/)
    // El mapa: solo el src de "Insertar mapa" de Google Maps; sin "Abrir en Google Maps", el mapa solo.
    main = contacto({ ...MUSEO_VACIO, mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=1' })
    assert.deepEqual(tarjetas({ mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=1' }), [])
    assert.match(main, /<div class="mt-12"><iframe src="https:\/\/www\.google\.com\/maps\/embed\?pb=1" title="[^"]+" loading="lazy"[^>]*><\/iframe><\/div>/)
    assert.equal(tarjetas({ mapaEmbedUrl: 'https://example.com/maps/embed?pb=1' }), null)
    // Solo "Abrir en Google Maps": el enlace solo, sin el mapa ni el aire de debajo del mapa.
    main = contacto({ ...MUSEO_VACIO, mapaUrl: 'https://example.com/mapa' })
    assert.equal(cuantas(main, '<iframe'), 0)
    assert.match(main, /<div class="mt-12"><p><a href="https:\/\/example\.com\/mapa" class="inline-flex min-h-11 /)
  })

  // --- Divulgación (tablero "Web" de la diseñadora, Figma 2857:5439, 06/11/2026; decisiones DV1 a DV10) ---

  const divulgacionCon = (novedades = [], museo = MUSEO_VACIO) =>
    pagina({ pagina: 'divulgacion', ruta: '/divulgacion', museo, datos: { novedades } })
  /** Lo que no tiene que aparecer nunca: el selector de idioma, las erratas del tablero y el texto de "pendiente". */
  const NUNCA_EN_DIVULGACION = ['Contenido pendiente', 'Es (Arg)', 'Tikets', 'Ultimas', 'MuPA', 'manipulado', 'para si ']
  /** Los enlaces de un pedazo de HTML: cada <a> con su href (o null si no tiene). */
  const anclas = (html) => [...html.matchAll(/<a\b([^>]*)>/g)].map((m) => /\shref="([^"]*)"/.exec(m[1])?.[1] ?? null)

  test('Divulgación (DV1, DV4, DV5): el hero con la bajada, sobreFoto, sin novedades sin "Últimas noticias"', () => {
    const { hero } = contenido.divulgacion
    const html = divulgacionCon()
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.equal(cuantas(html, '<footer'), 1)
    // El h1 con su corte de renglón, la foto con prioridad, sus cuatro anchos, el alt, la posicion y el degradé.
    assert.ok(main.includes(`<h1 id="divulgacion-titulo" class="`))
    assert.ok(main.includes(`>${hero.titulo}</h1>`))
    assert.ok(hero.titulo.includes('\n'))
    comprobarHero(main, 'divulgacion-titulo', hero.titulo, hero.imagen)
    const heroHtml = seccion(main, 'divulgacion-titulo')
    // La bajada: un <p> debajo del h1, a 16 (mt-4), en la caja de 840; 16/24 debajo de 32rem y, desde ahí, 32 px con el
    // halo de la de la Home (A11Y-01), en 32/56 desde lg.
    const bajada = new RegExp(`<p class="([^"]*)">${hero.bajada}</p>`).exec(heroHtml)
    assert.ok(bajada, 'la bajada')
    const clasesBajada = bajada[1].split(' ')
    comprobarBajadaDeHero(clasesBajada, 'lg:leading-[1.75]', ['max-w-[20rem]', 'min-[32rem]:max-w-none', 'lg:max-w-[52.5rem]'])
    assert.ok(heroHtml.indexOf('</h1>') < heroHtml.indexOf(hero.bajada))
    // Sin posición de celular: la foto, como en escritorio.
    assert.equal(hero.imagen.posicionMovil, undefined)
    // El texto arranca a 168 (no a 208) y la caja del h1 mide 932 (no 840).
    const texto = clasesDe(heroHtml, /<div class="(relative mx-auto w-full max-w-tablero [^"]*)"/)
    assert.ok(texto.includes('lg:pt-[10.5rem]') && !texto.includes('lg:pt-52'), texto.join(' '))
    const caja = clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/)
    assert.deepEqual(caja, ['mx-auto', 'lg:max-w-[58.25rem]'])
    // Sin novedades, sin "Últimas noticias" (la página sale igual, DV3).
    assert.equal(cuantas(html, 'novedades-titulo'), 0)
    assert.equal(cuantas(html, contenido.divulgacion.noticias.titulo), 0)
    // sobreFoto: los logos del header no se invierten con colores forzados (A11Y-08).
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    for (const texto of NUNCA_EN_DIVULGACION) assert.equal(cuantas(html, texto), 0, texto)
  })

  test('Divulgación (DV1, DV9, DV10): los cuatro bloques de texto y foto y el newsletter, con los textos del tablero', () => {
    const { bloques, newsletter } = contenido.divulgacion
    const main = delMain(divulgacionCon())
    // Las secciones, en el orden del tablero, cada una con su h2.
    const ids = ['divulgacion-titulo', ...bloques.map((b) => b.id), 'divulgacion-newsletter']
    const orden = ids.map((id) => main.indexOf(`<section aria-labelledby="${id}"`))
    assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    assert.equal(cuantas(main, '<section'), ids.length)
    assert.equal(cuantas(main, '<h2'), bloques.length + 1)
    for (const b of bloques) {
      const html = seccion(main, b.id)
      // El rótulo (en mayúsculas por CSS) y, 24 abajo (16 debajo de lg), el h2 Thin 64 con su corte de renglón.
      assert.match(html, new RegExp(`<p class="font-mono text-sm leading-5 font-medium text-paper uppercase">${b.rotulo}</p>`), b.id)
      const h2 = new RegExp(`<h2 id="${b.id}" class="([^"]*)">([^<]*)</h2>`).exec(html)
      assert.ok(h2, b.id)
      assert.equal(h2[2], b.titulo)
      for (const c of ['font-thin', 'min-[32rem]:text-[4rem]', 'whitespace-pre-line']) assert.ok(h2[1].split(' ').includes(c), `${b.id}: ${c}`)
      assert.deepEqual(margenesDeArriba(h2[1].split(' ')), ['mt-4', 'lg:mt-6'], b.id)
      // Los párrafos, la nota en gris.
      for (const parrafo of b.parrafos) {
        const clase = parrafo.secundario ? 'text-muted' : 'text-paper'
        assert.match(html, new RegExp(`<p class="text-lg leading-\\[1\\.875rem\\] font-normal ${clase} [^"]*">${parrafo.texto}</p>`), parrafo.texto)
      }
      // Dos columnas de 600 con 80 entre sí desde lg; la foto 10:7 con esquinas de 16, lazy y con prioridad baja.
      assert.ok(html.includes('<div class="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-x-20">'), b.id)
      const fotos = html.match(/<img [^>]*>/g)
      assert.equal(fotos.length, 1, b.id)
      for (const a of ['loading="lazy"', 'decoding="async"', 'fetchPriority="low"', `alt="${b.imagen.alt}"`, 'aspect-[10/7]', 'rounded-2xl', 'object-cover']) {
        assert.ok(fotos[0].includes(a), `${b.id}: ${a}`)
      }
    }
    // El alt de la foto de relleno, repetida en los cuatro bloques (T7 de la tanda 1, 16/11/2026): solo el primer
    // bloque lo lleva; en los otros tres va vacío (decorativa), así el lector de pantalla no la anuncia cuatro veces.
    const ALT_DE_RELLENO = 'Paleontóloga registrando un hallazgo en el campo con una cuadrícula de hilos sobre el fósil'
    assert.deepEqual(bloques.map((b) => b.imagen.alt), [ALT_DE_RELLENO, '', '', ''])
    assert.deepEqual(bloques.map((b) => /<img [^>]*\salt="([^"]*)"/.exec(seccion(main, b.id))?.[1]), [ALT_DE_RELLENO, '', '', ''])
    assert.equal(cuantas(main, 'alt=""'), 3)
    // Va vacío solo mientras la foto sea la repetida: un bloque que estrene la suya tiene que traer su alt.
    for (const b of bloques.slice(1)) assert.equal(b.imagen.src, bloques[0].imagen.src, `${b.id}: con una foto propia, lleva su alt (y esta prueba cambia)`)
    // Infraestructura: la lista con la viñeta de 6 px, 12 entre ítems, y "Coordinar visita" a Contacto (DV9).
    const infra = seccion(main, 'divulgacion-infraestructura')
    const lista = /<ul class="([^"]*)">((?:<li>[^<]*<\/li>)+)<\/ul>/.exec(infra)
    assert.ok(lista, 'la lista')
    assert.deepEqual([...lista[2].matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), bloques[0].lista)
    // (React escribe "&" y ">" de los atributos como entidades.)
    const clasesLista = lista[1].replaceAll('&amp;', '&').replaceAll('&gt;', '>').split(' ')
    for (const c of ['[&>li]:before:size-1.5', '[&>li]:before:rounded-full', 'gap-3', 'text-base', 'leading-6']) assert.ok(clasesLista.includes(c), c)
    assert.match(infra, /<a href="\/contacto" class="inline-flex min-h-11 [^"]* -my-2 self-start">Coordinar visita<svg [^>]*aria-hidden="true"/)
    // El laboratorio: las cuatro actividades como texto con la flecha (sin destino: DV9), ni enlaces ni botones.
    const lab = seccion(main, 'divulgacion-laboratorio')
    const acciones = [...lab.matchAll(/<li class="flex items-center gap-2 font-mono text-base leading-\[1\.8\] text-blanco">([^<]*)<svg [^>]*aria-hidden="true"/g)]
    assert.deepEqual(acciones.map((m) => m[1]), bloques[1].acciones)
    assert.equal(cuantas(lab, '<a'), 0)
    assert.equal(cuantas(lab, '<button'), 0)
    // Investigaciones: el h2 en dos renglones (el "\n" del tablero, whitespace-pre-line) y el párrafo del laboratorio.
    assert.ok(seccion(main, 'divulgacion-investigaciones').includes('>Investigaciones recientes\ndel equipo MuPa - UNSJ</h2>'))
    // Contenido multimedial: el texto con su corte de renglón, sin video ni enlace.
    const multimedial = seccion(main, 'divulgacion-multimedial')
    assert.ok(multimedial.includes('>Entrevistas con científicos:\nConocé quiénes son los científicos detrás del laboratorio triásico.</p>'))
    assert.equal(cuantas(multimedial, '<a'), 0)
    assert.equal(cuantas(multimedial, '<iframe'), 0)
    // El newsletter: el h2 sin rótulo, la bajada en gris a 16, tres tarjetas con el ícono en naranja en su cuadrado, el
    // rótulo en un h3, el texto en gris y el "enlace" como texto (DV9); sin campo, botón ni formulario.
    const news = seccion(main, 'divulgacion-newsletter')
    assert.match(news, new RegExp(`<h2 id="divulgacion-newsletter" class="[^"]*font-thin[^"]*">${newsletter.titulo}</h2><p class="text-lg leading-7 font-normal text-muted text-pretty mt-4 max-w-none">${newsletter.bajada}</p>`))
    assert.equal(cuantas(news, 'font-mono text-sm leading-5 font-medium text-paper uppercase'), 0)
    // El mismo margen de scroll que el h2 de "Recursos educativos" de Educación (SeccionRecursos.jsx: T6 de la tanda 1).
    assert.deepEqual(clasesDe(news, /<h2 id="divulgacion-newsletter" class="([^"]*)"/).filter((c) => /(^|:)scroll-m/.test(c)), ['scroll-mt-25', 'lg:scroll-mt-29'])
    const tarjetas = [...news.matchAll(/<li class="([^"]*)"><span class="flex size-12 [^"]*bg-caja[^"]*"><svg [^>]*class="shrink-0 size-6 text-naranja"[\s\S]*?<\/svg><\/span><div class="flex flex-col gap-2"><h3 class="font-mono text-xs [^"]*">([^<]*)<\/h3><p class="text-base [^"]*text-muted[^"]*">([^<]*)<\/p><\/div><p class="flex items-center gap-2 font-mono text-sm leading-5 font-normal text-paper">([^<]*)<svg [^>]*aria-hidden="true"/g)]
    assert.deepEqual(tarjetas.map((m) => [m[2], m[3], m[4]]), newsletter.tarjetas.map((t) => [t.titulo, t.texto, t.accion]))
    for (const m of tarjetas) for (const c of ['lg:px-6', 'lg:py-10', 'xl:px-10', 'gap-6']) assert.ok(m[1].split(' ').includes(c), c)
    assert.ok(news.includes('<ul class="mt-12 grid gap-10 lg:grid-cols-3">'))
    for (const t of ['<a', '<button', '<input', '<form']) assert.equal(cuantas(news, t), 0, t)
    // DV9: en todo el <main>, ningún enlace sin destino ni con "#" (sin novedades, el único es "Coordinar visita"), y
    // ningún botón (sin novedades no hay carrusel).
    assert.deepEqual(anclas(main), ['/contacto'])
    assert.equal(cuantas(main, '<button'), 0)
    // Encabezados: un h1, un h2 por sección (sin novedades, cinco) y un h3 por tarjeta del newsletter.
    assert.equal(cuantas(main, '<h3'), 3)
    for (const texto of NUNCA_EN_DIVULGACION) assert.equal(cuantas(main, texto), 0, texto)
  })

  test('Divulgación (DV9): sin la página de Contacto, "Coordinar visita" va como texto (ningún control sin destino)', () => {
    const contactoPagina = tabla.PAGINAS.contacto
    try {
      delete tabla.PAGINAS.contacto
      const infra = seccion(delMain(divulgacionCon()), 'divulgacion-infraestructura')
      assert.equal(cuantas(infra, '<a'), 0)
      assert.match(infra, /<p class="flex items-center gap-2 font-mono text-base leading-\[1\.8\] text-blanco">Coordinar visita<svg [^>]*aria-hidden="true"/)
    } finally {
      tabla.PAGINAS.contacto = contactoPagina
    }
  })

  test('Divulgación (DV2): con una novedad, la tarjeta sin botones; con seis, "Últimas noticias" con la bajada de la Home y las flechas a los costados, sin contador', () => {
    const { noticias } = contenido.divulgacion
    const textos = contenido.home.novedades
    // Una: la sección con su tarjeta, sin flechas ni contador.
    const una = seccion(delMain(divulgacionCon([novedad(1)])), 'novedades-titulo')
    assert.match(una, new RegExp(`<h2 id="novedades-titulo"[^>]*>${noticias.titulo}</h2>`))
    assert.equal(cuantas(una, '<li '), 1)
    assert.equal(cuantas(una, '<button'), 0)
    // Seis: el h2 "Últimas noticias" con el id de la Home, la bajada de la Home, "Ver todas las novedades" a /novedades
    // y las flechas a los costados, sin contador (Q, 17/11/2026); entre el hero y el primer bloque.
    const seis = [1, 2, 3, 4, 5, 6].map((n) => novedad(n))
    const html = divulgacionCon(seis)
    const main = delMain(html)
    const s = seccion(main, 'novedades-titulo')
    assert.match(s, new RegExp(`<h2 id="novedades-titulo" class="[^"]*">${noticias.titulo}</h2>`))
    assert.ok(s.includes(`>${textos.bajada}</p>`))
    assert.match(s, new RegExp(`<a href="/novedades" class="[^"]*">${textos.verTodas}<svg`))
    // Las flechas a los costados, la región viva en el envoltorio de la fila y nada abajo, como en la Home (16 y
    // 17/11/2026: el componente es el mismo).
    comprobarFlechasALosCostados(s, 6, textos)
    assert.equal(cuantas(s, '<article'), 6)
    // Las mismas tarjetas que la Home, también las de celular (el componente es el mismo).
    comprobarTarjetasDelCarrusel(s, 6)
    const i = (id) => main.indexOf(`aria-labelledby="${id}"`)
    assert.ok(i('divulgacion-titulo') < i('novedades-titulo') && i('novedades-titulo') < i('divulgacion-infraestructura'))
    // Ningún enlace sin destino ni con "#": las seis novedades, "Ver todas las novedades" y "Coordinar visita".
    const enlaces = anclas(main)
    assert.ok(enlaces.every((h) => h && h !== '#' && h.startsWith('/')), enlaces.join(', '))
    assert.deepEqual(enlaces, ['/novedades', ...seis.map((n) => n.url), '/contacto'])
    assert.equal(cuantas(main, '<h2'), 6)
    assert.equal(cuantas(html, '<h1'), 1)
    for (const texto of NUNCA_EN_DIVULGACION) assert.equal(cuantas(html, texto), 0, texto)
  })

  test('HeroPagina sin bajada (Visitas, Exposiciones, Novedades, Contacto, Educación y El Museo): la caja de celular y la de escritorio, el texto con el lugar del marco, la caja de 840 y ningún <p> en el hero', () => {
    const casos = {
      'visitas-titulo': pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } }),
      'exposiciones-titulo': pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras: [], salas: [] } }),
      'novedades-titulo': pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { proximas: [], noticias: [], pagina: 1, paginas: 1 } }),
      'contacto-titulo': pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_VACIO, datos: { ...SIN_AVISOS, formulario: false } }),
      'educacion-titulo': pagina({ pagina: 'educacion', ruta: '/educacion', museo: MUSEO_VACIO, datos: {} }),
      'el-museo-titulo': pagina({ pagina: 'el-museo', ruta: '/el-museo', museo: MUSEO_VACIO, datos: {} }),
    }
    for (const [id, html] of Object.entries(casos)) {
      const hero = seccion(delMain(html), id)
      assert.ok(hero.includes(`<h1 id="${id}"`), id)
      // La caja: debajo de lg, una columna flex de 350 como mínimo, con el texto al final debajo de 32rem y al principio
      // desde ahí; desde lg, el bloque de 480.
      assert.ok(
        hero.startsWith(
          `<section aria-labelledby="${id}" class="relative"><div class="relative flex min-h-[21.875rem] flex-col justify-end overflow-hidden min-[32rem]:justify-start lg:block lg:min-h-[30rem]"><img `,
        ),
        id,
      )
      // El texto: el ancho entero (en la columna flex, centrado con márgenes automáticos, se encogería), la reserva del
      // marco de celular y, desde lg, el h1 a 208; la caja del h1, de 840.
      assert.ok(hero.includes('<div class="relative mx-auto w-full max-w-tablero px-6 pt-[10.0625rem] pb-16 md:px-10 lg:px-20 lg:pt-52"><div class="mx-auto lg:max-w-[52.5rem]"><h1'), id)
      assert.equal(cuantas(hero, '<p'), 0, id)
      // Nada de la caja de antes (320 como mínimo, el texto arriba) ni alturas en vh o dvh.
      assert.equal(cuantas(hero, 'min-h-[20rem]'), 0, id)
      assert.doesNotMatch(hero, /\d(vh|dvh)\b/, id)
    }
  })

  // --- Educación (tablero "Web", Figma 2846:1561; decisiones IN1 a IN10 del desarrollador, 06/11/2026) ---
  const educacionCon = (museo = MUSEO_VACIO) => pagina({ pagina: 'educacion', ruta: '/educacion', museo, datos: {} })
  /** Lo que nunca va en el <main>: el selector de idioma, las erratas, "pendiente" y controles sin destino. */
  const NUNCA_EN_EDUCACION = ['Contenido pendiente', 'Es (Arg)', 'Tikets', 'Videos Educativos', 'triásico', 'href="#"', '<button', '<form', '<input']

  test('Educación (IN1, IN6, IN7): el hero sin bajada, sobreFoto, y las tres secciones en el orden del tablero', () => {
    const { hero, escolares, recursos } = contenido.educacion
    const html = educacionCon()
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.equal(cuantas(html, '<footer'), 1)
    assert.ok(main.includes('<h1 id="educacion-titulo" class="'))
    assert.equal(hero.titulo, 'Educación')
    comprobarHero(main, 'educacion-titulo', hero.titulo, hero.imagen)
    // En el celular el h1 va abajo: la foto se corre para que el título vaya sobre la mano con el pincel.
    assert.equal(hero.imagen.posicionMovil, '25% 90%')
    // Sin bajada: el texto a 208 (lg:pt-52), la caja de 840 y ningún <p> en el hero.
    const heroHtml = seccion(main, 'educacion-titulo')
    assert.ok(heroHtml.includes('lg:pt-52'))
    assert.deepEqual(clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/), ['mx-auto', 'lg:max-w-[52.5rem]'])
    assert.equal(cuantas(heroHtml, '<p'), 0)
    // sobreFoto: los logos del header no se invierten con colores forzados (A11Y-08).
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    // El orden: el hero, "Visitas Escolares" y "Recursos educativos"; 3 secciones, 2 h2 y 3 h3 (las tarjetas).
    const ids = ['educacion-titulo', escolares.id, recursos.id]
    assert.deepEqual(ids, ['educacion-titulo', 'educacion-visitas', 'educacion-recursos'])
    const orden = ids.map((id) => main.indexOf(`<section aria-labelledby="${id}"`))
    assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    assert.equal(cuantas(main, '<section'), 3)
    assert.equal(cuantas(main, '<h2'), 2)
    assert.equal(cuantas(main, '<h3'), 3)
    // La página se marca en el menú (y no lee la base: sus datos son {}).
    assert.equal(cuantas(delHeader(html), 'aria-current="page"'), 2)
    // (En el <main>: el header tiene el botón "Menú" del celular.)
    for (const texto of NUNCA_EN_EDUCACION) assert.equal(cuantas(main, texto), 0, texto)
  })

  test('Educación (IN1, IN2, IN6): "Visitas Escolares" con el rótulo, los párrafos, la lista, "Coordinar visita" a Contacto y la foto de los chicos', () => {
    const { escolares } = contenido.educacion
    const html = seccion(delMain(educacionCon()), 'educacion-visitas')
    assert.match(html, new RegExp(`<p class="font-mono text-sm leading-5 font-medium text-paper uppercase">${escolares.rotulo}</p>`))
    const h2 = /<h2 id="educacion-visitas" class="([^"]*)">([^<]*)<\/h2>/.exec(html)
    assert.ok(h2)
    assert.equal(h2[2], 'Visitas Escolares')
    for (const c of ['font-thin', 'min-[32rem]:text-[4rem]']) assert.ok(h2[1].split(' ').includes(c), c)
    // A 24 del rótulo desde lg y a 16 debajo.
    assert.deepEqual(margenesDeArriba(h2[1].split(' ')), ['mt-4', 'lg:mt-6'])
    assert.equal(escolares.parrafos.length, 2)
    for (const parrafo of escolares.parrafos) {
      const clase = parrafo.secundario ? 'text-muted' : 'text-paper'
      assert.match(html, new RegExp(`<p class="text-lg leading-\\[1\\.875rem\\] font-normal ${clase} [^"]*">${parrafo.texto}</p>`), parrafo.texto)
    }
    // La lista de niveles con la viñeta de 6 px.
    const lista = /<ul class="([^"]*)">((?:<li>[^<]*<\/li>)+)<\/ul>/.exec(html)
    assert.ok(lista, 'la lista')
    assert.deepEqual([...lista[2].matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), ['Nivel inicial', 'Primaria', 'Secundaria', 'Nivel superior'])
    assert.ok(lista[1].replaceAll('&amp;', '&').replaceAll('&gt;', '>').split(' ').includes('[&>li]:before:size-1.5'))
    // "Coordinar visita" a Contacto (IN2), con la flecha aria-hidden.
    assert.match(html, /<a href="\/contacto" class="inline-flex min-h-11 [^"]* -my-2 self-start">Coordinar visita<svg [^>]*aria-hidden="true"/)
    assert.equal(cuantas(html, '<a '), 1)
    // La foto: los chicos de guardapolvo (R-B), 10:7, lazy y con prioridad baja, en 600 y 1140.
    const fotos = html.match(/<img [^>]*>/g)
    assert.equal(fotos.length, 1)
    for (const a of ['loading="lazy"', 'decoding="async"', 'fetchPriority="low"', `alt="${escolares.imagen.alt}"`, 'aspect-[10/7]', 'rounded-2xl', 'object-cover']) {
      assert.ok(fotos[0].includes(a), a)
    }
    assert.match(escolares.imagen.alt, /guardapolvo/)
    assert.deepEqual([...fotos[0].matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [600, 1140])
    assert.ok(fotos[0].includes('educacion-escolares-600'))
  })

  test('Educación (IN1, IN2, IN3): "Recursos educativos" con el rótulo a 16, la bajada y tres tarjetas con el ícono en crema y la acción como texto', () => {
    const { recursos } = contenido.educacion
    const main = delMain(educacionCon())
    const html = seccion(main, 'educacion-recursos')
    // El rótulo y, 16 abajo en todos los anchos (mt-4 solo, sin el lg:mt-6 de las demás secciones), el h2; la bajada en
    // gris a 16.
    assert.match(html, /<p class="font-mono text-sm leading-5 font-medium text-paper uppercase">Recursos<\/p><h2 id="educacion-recursos" class="([^"]*)">Recursos educativos<\/h2>/)
    const h2 = clasesDe(html, /<h2 id="educacion-recursos" class="([^"]*)"/)
    assert.ok(h2.includes('font-thin'), h2.join(' '))
    assert.deepEqual(margenesDeArriba(h2), ['mt-4'], h2.join(' '))
    // El h2 es el ancla de la sección ("Recursos educativos" de la franja de la Home lleva a /educacion#educacion-recursos:
    // T6 de la tanda 1, 16/11/2026). Su margen de scroll: los 36 del rótulo (el renglón de 20 y los 16 hasta el h2) más
    // el aire de la sección (64; 80 desde lg), así al llegar la ventana arranca en el borde de la sección.
    assert.deepEqual(h2.filter((c) => /(^|:)scroll-m/.test(c)), ['scroll-mt-25', 'lg:scroll-mt-29'], h2.join(' '))
    assert.match(main, /<section aria-labelledby="educacion-recursos" class="py-16 lg:py-20">/)
    // La cuenta de ese margen sale también del renglón del rótulo (VS-04 de la verificación de la tanda 1, 16/11/2026):
    // leading-5 (20) + el mt-4 del h2 (16) + el aire de la sección (py-16, 64; lg:py-20, 80) = 100 y 116 px, que son
    // scroll-mt-25 y lg:scroll-mt-29 (en unidades de Tailwind: 5 + 4 + 16 y 5 + 4 + 20). La expresión de arriba ya
    // compara la clase entera del rótulo, pero no dice por qué importa: si cambia ROTULO_SECCION (tablero.js) y alguien
    // pone al día esa expresión, esto avisa que hay que rehacer ANCLA (SeccionRecursos.jsx). El rótulo, sin margen ni
    // padding propios arriba o abajo (sumarían a la cuenta).
    const rotuloDeRecursos = clasesDe(html, /<p class="([^"]*)">Recursos<\/p><h2 id="educacion-recursos" /)
    // Un solo renglón de 20 (leading-5, sin variantes: un lg:leading-7 lo cambiaría desde lg) y sin bordes arriba o
    // abajo (un border-b-4 sumaría 4 px a la cuenta): RT-05 de la re-verificación, 17/11/2026, con includes() pasaban.
    assert.deepEqual(
      rotuloDeRecursos.filter((c) => /(^|:)(leading-|border(-[ytb])?(-\d+)?$)/.test(c)),
      ['leading-5'],
      `el renglón del rótulo ya no es solo leading-5, o tiene un borde arriba o abajo (${rotuloDeRecursos.join(' ')}): hay que rehacer el margen de scroll del h2 (ANCLA, en SeccionRecursos.jsx)`,
    )
    assert.deepEqual(rotuloDeRecursos.filter((c) => /(^|:)-?[mp][ytb]?-/.test(c)), [], 'el rótulo con margen o padding propios arriba o abajo: hay que rehacer el margen de scroll del h2 (ANCLA, en SeccionRecursos.jsx)')
    // Lo que npm test no mira (también VS-04): estas pruebas leen el HTML del servidor, no el CSS construido. Que la
    // tarjeta de los documentales de El Museo (T4 de la tanda 1; su prueba, más abajo) mida el ancho entero sin
    // JavaScript y al imprimir depende de que noscript:w-full y print:w-full queden en el CSS después de
    // w-[min(100%,24rem)] (al 16/11/2026, quedan): esos dos modos se comprueban en el navegador, no en npm test
    // (tools/salida/tanda-1/v-sitio/herr/v-t4-geo.mjs, modos nojs e imprimir; no versionado).
    assert.ok(html.includes(`<p class="text-lg leading-7 font-normal text-muted text-pretty mt-4 max-w-none">${recursos.bajada}</p>`))
    // Las tarjetas: el ícono en crema (sin text-naranja), el h3, el texto en gris y la acción como texto con la flecha.
    const tarjetas = [...html.matchAll(/<li class="([^"]*)"><span class="flex size-12 [^"]*bg-caja[^"]*text-paper"><svg [^>]*class="shrink-0 size-6"[\s\S]*?<\/svg><\/span><div class="flex flex-col gap-2"><h3 class="font-mono text-xs [^"]*">([^<]*)<\/h3><p class="text-base [^"]*text-muted[^"]*">([^<]*)<\/p><\/div><p class="flex items-center gap-2 font-mono text-sm leading-5 font-normal text-paper">([^<]*)<svg [^>]*aria-hidden="true"/g)]
    assert.deepEqual(tarjetas.map((m) => [m[2], m[3], m[4]]), [
      ['Guías didácticas', 'Material educativo descargable para docentes: nivel inicial, primaria, secundaria y universidad.', 'Ver guías'],
      ['Videos educativos', 'Contenido audiovisual sobre paleontología y geología del Triásico: conferencias y documentales.', 'Ver videos'],
      ['Biblioteca digital', 'Acceso a publicaciones científicas del MuPa: artículos, libros y tesis.', 'Explorar'],
    ])
    for (const m of tarjetas) for (const c of ['lg:px-6', 'lg:py-10', 'xl:px-10', 'gap-6']) assert.ok(m[1].split(' ').includes(c), c)
    assert.equal(cuantas(html, 'text-naranja'), 0)
    assert.ok(html.includes('<ul class="mt-12 grid gap-10 lg:grid-cols-3">'))
    // IN3: cada tarjeta con la forma de una fila, sin url (la acción va como texto).
    for (const t of recursos.tarjetas) assert.deepEqual(Object.keys(t), ['icono', 'titulo', 'texto', 'accion', 'url'])
    assert.ok(recursos.tarjetas.every((t) => t.url === null))
    for (const t of ['<a', '<button', '<input', '<form']) assert.equal(cuantas(html, t), 0, t)
    // IN2: en todo el <main>, el único enlace es "Coordinar visita"; ningún botón ni "#".
    assert.deepEqual(anclas(main), ['/contacto'])
    assert.equal(cuantas(main, '<button'), 0)
    for (const texto of NUNCA_EN_EDUCACION) assert.equal(cuantas(main, texto), 0, texto)
  })

  test('Educación (IN2): sin la página de Contacto, "Coordinar visita" va como texto (ningún control sin destino)', () => {
    const contactoPagina = tabla.PAGINAS.contacto
    try {
      delete tabla.PAGINAS.contacto
      const main = delMain(educacionCon())
      assert.equal(cuantas(main, '<a'), 0)
      assert.match(seccion(main, 'educacion-visitas'), /<p class="flex items-center gap-2 font-mono text-base leading-\[1\.8\] text-blanco">Coordinar visita<svg [^>]*aria-hidden="true"/)
    } finally {
      tabla.PAGINAS.contacto = contactoPagina
    }
  })

  // --- Circuitos (tablero "Web", Figma 2860:5827; decisiones IN1 a IN10 del desarrollador, 06/11/2026) ---
  const circuitosCon = (museo = MUSEO_VACIO) => pagina({ pagina: 'circuitos', ruta: '/circuitos', museo, datos: {} })
  /** Lo que nunca va en la página: el selector de idioma, las erratas del tablero, "pendiente" y controles sin destino. */
  const NUNCA_EN_CIRCUITOS = ['Contenido pendiente', 'Es (Arg)', 'Tikets', 'Palentológicos', 'San Juan. <', 'href="#"', '<form', '<input']

  test('Circuitos (IN1, IN6, IN7): el hero con la bajada en dos renglones (32/40), sobreFoto, y los dos circuitos en el orden del tablero', () => {
    const { hero, destinos } = contenido.circuitos
    const html = circuitosCon()
    const main = delMain(html)
    assert.equal(cuantas(html, '<h1'), 1)
    assert.equal(cuantas(html, '<footer'), 1)
    // El h1 del tablero con su corte ("Palentológicos": la errata, corregida y en minúscula).
    assert.equal(hero.titulo, 'Circuitos\npaleontológicos')
    comprobarHero(main, 'circuitos-titulo', hero.titulo, hero.imagen)
    const heroHtml = seccion(main, 'circuitos-titulo')
    // La bajada: a 16 del h1, en la caja de 840, con el halo, en 32/40 desde lg (no en 32/56, como Divulgación) y en
    // 16/24 debajo de 32rem.
    assert.equal(hero.bajada, 'Extendé tu visita al MuPa con otros destinos paleontológicos y urbanos de San Juan.')
    const bajada = new RegExp(`<p class="([^"]*)">${hero.bajada}</p>`).exec(heroHtml)
    assert.ok(bajada, 'la bajada')
    const clasesBajada = bajada[1].split(' ')
    comprobarBajadaDeHero(clasesBajada, 'lg:leading-[1.25]')
    assert.ok(!clasesBajada.includes('lg:leading-[1.75]'), bajada[1])
    assert.ok(heroHtml.indexOf('</h1>') < heroHtml.indexOf(hero.bajada))
    // Sin posición de celular: la foto, como en escritorio.
    assert.equal(hero.imagen.posicionMovil, undefined)
    // Con bajada: el texto a 168 y la caja del h1 de 932.
    const texto = clasesDe(heroHtml, /<div class="(relative mx-auto w-full max-w-tablero [^"]*)"/)
    assert.ok(texto.includes('lg:pt-[10.5rem]') && !texto.includes('lg:pt-52'), texto.join(' '))
    assert.deepEqual(clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/), ['mx-auto', 'lg:max-w-[58.25rem]'])
    // sobreFoto: los logos del header no se invierten con colores forzados (A11Y-08).
    for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
    // El orden: el hero, Valle de la Luna y Parque las Huellas; 3 secciones, 2 h2 y 1 h3 ("Conexión MuPa").
    const ids = ['circuitos-titulo', ...destinos.map((d) => `circuito-${d.slug}`)]
    assert.deepEqual(ids, ['circuitos-titulo', 'circuito-valle-de-la-luna', 'circuito-parque-las-huellas'])
    const orden = ids.map((id) => main.indexOf(`<section aria-labelledby="${id}"`))
    assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    assert.equal(cuantas(main, '<section'), 3)
    assert.equal(cuantas(main, '<h2'), 2)
    assert.equal(cuantas(main, '<h3'), 1)
    // La página se marca en el menú (y no lee la base: sus datos son {}).
    assert.equal(cuantas(delHeader(html), 'aria-current="page"'), 2)
    for (const texto of NUNCA_EN_CIRCUITOS) assert.equal(cuantas(html, texto), 0, texto)
  })

  test('Circuitos (IN1, IN2, IN3, IN5): cada circuito con el rótulo, el h2, el párrafo, "Coordinar visita" a Contacto y la foto; Valle de la Luna con la lista y "Conexión MuPa"', () => {
    const { rotulo, destinos } = contenido.circuitos
    const main = delMain(circuitosCon())
    // IN3: cada circuito con la forma de una fila, las mismas claves en los dos.
    for (const d of destinos) assert.deepEqual(Object.keys(d), ['slug', 'nombre', 'parrafos', 'lista', 'enlace', 'apartado', 'imagen'])
    for (const d of destinos) {
      const id = `circuito-${d.slug}`
      const html = seccion(main, id)
      // El rótulo (en mayúsculas por CSS) y, 24 abajo (16 debajo de lg), el h2 Thin 64.
      assert.match(html, new RegExp(`<p class="font-mono text-sm leading-5 font-medium text-paper uppercase">${rotulo}</p><h2 id="${id}"`), id)
      const h2 = new RegExp(`<h2 id="${id}" class="([^"]*)">([^<]*)</h2>`).exec(html)
      assert.ok(h2, id)
      assert.equal(h2[2], d.nombre)
      for (const c of ['font-thin', 'min-[32rem]:text-[4rem]']) assert.ok(h2[1].split(' ').includes(c), `${id}: ${c}`)
      assert.deepEqual(margenesDeArriba(h2[1].split(' ')), ['mt-4', 'lg:mt-6'], id)
      for (const parrafo of d.parrafos) {
        assert.match(html, new RegExp(`<p class="text-lg leading-\\[1\\.875rem\\] font-normal text-paper [^"]*">${parrafo.texto}</p>`), parrafo.texto)
      }
      // "Coordinar visita" a Contacto (IN2), con la flecha aria-hidden; un solo enlace por circuito.
      assert.match(html, /<a href="\/contacto" class="inline-flex min-h-11 [^"]* -my-2 self-start">Coordinar visita<svg [^>]*aria-hidden="true"/)
      assert.equal(cuantas(html, '<a '), 1)
      // Dos columnas desde lg; la foto 10:7 con esquinas de 16, lazy y con prioridad baja, en 600 y 880 (desde el
      // original, R-C), con un alt que no nombra a nadie (IN5).
      assert.ok(html.includes('<div class="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-x-20">'), id)
      const fotos = html.match(/<img [^>]*>/g)
      assert.equal(fotos.length, 1, id)
      for (const a of ['loading="lazy"', 'decoding="async"', 'fetchPriority="low"', `alt="${d.imagen.alt}"`, 'aspect-[10/7]', 'rounded-2xl', 'object-cover']) {
        assert.ok(fotos[0].includes(a), `${id}: ${a}`)
      }
      assert.deepEqual([...fotos[0].matchAll(/ (\d+)w/g)].map((m) => Number(m[1])), [600, 880])
      assert.ok(fotos[0].includes('bloque-ciencia-600'), id)
      assert.doesNotMatch(d.imagen.alt, /Martínez|Alcober/)
    }
    // El alt de la foto de relleno, repetida en los dos circuitos (T7 de la tanda 1, 16/11/2026): el primero lo lleva y
    // el segundo va vacío (decorativa), así el lector de pantalla no la anuncia dos veces.
    const ALT_DE_RELLENO = 'Paleontóloga registrando un hallazgo en el campo con una cuadrícula de hilos sobre el fósil'
    assert.deepEqual(destinos.map((d) => d.imagen.alt), [ALT_DE_RELLENO, ''])
    assert.deepEqual(destinos.map((d) => /<img [^>]*\salt="([^"]*)"/.exec(seccion(main, `circuito-${d.slug}`))?.[1]), [ALT_DE_RELLENO, ''])
    assert.equal(cuantas(main, 'alt=""'), 1)
    // Va vacío solo mientras la foto sea la repetida: un circuito que estrene la suya tiene que traer su alt.
    assert.equal(destinos[1].imagen.src, destinos[0].imagen.src, 'con una foto propia, el segundo circuito lleva su alt (y esta prueba cambia)')
    // Valle de la Luna: la lista con la viñeta de 6 px y, después del enlace, "Conexión MuPa" (h3 Thin 40/52) y su párrafo.
    const [valle, huellas] = destinos
    const v = seccion(main, 'circuito-valle-de-la-luna')
    const lista = /<ul class="([^"]*)">((?:<li>[^<]*<\/li>)+)<\/ul>/.exec(v)
    assert.ok(lista, 'la lista')
    assert.deepEqual([...lista[2].matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), ['Dinosaurios del Triásico Inferior', 'Recorrido guiado en vehículo', 'Paisaje lunar'])
    assert.ok(lista[1].replaceAll('&amp;', '&').replaceAll('&gt;', '>').split(' ').includes('[&>li]:before:size-1.5'))
    const h3 = /<h3 class="([^"]*)">([^<]*)<\/h3>/.exec(v)
    assert.ok(h3, 'el h3')
    assert.equal(h3[2], 'Conexión MuPa')
    for (const c of ['font-titulo', 'font-thin', 'min-[32rem]:text-[2.5rem]', 'min-[32rem]:leading-[3.25rem]']) assert.ok(h3[1].split(' ').includes(c), c)
    const apartado = valle.apartado.parrafos[0].texto
    assert.match(apartado, /Ricardo Martínez/)
    const i = (texto) => v.indexOf(texto)
    const orden = [valle.parrafos[0].texto, '<ul', '>Coordinar visita<', '>Conexión MuPa</h3>', apartado].map(i)
    assert.ok(orden.every((n, k) => n >= 0 && (k === 0 || n > orden[k - 1])), orden.join(', '))
    assert.ok(v.includes(`<p class="text-lg leading-[1.875rem] font-normal text-paper wrap-break-word text-pretty">${apartado}</p>`))
    // Parque las Huellas: sin lista y sin apartado.
    const h = seccion(main, 'circuito-parque-las-huellas')
    assert.equal(cuantas(h, '<ul'), 0)
    assert.equal(cuantas(h, '<h3'), 0)
    assert.match(huellas.parrafos[0].texto, /Oscar Alcober/)
    // IN2: en todo el <main>, los dos "Coordinar visita"; ningún botón, formulario ni "#".
    assert.deepEqual(anclas(main), ['/contacto', '/contacto'])
    assert.equal(cuantas(main, '<button'), 0)
    for (const texto of NUNCA_EN_CIRCUITOS) assert.equal(cuantas(main, texto), 0, texto)
  })

  test('Circuitos (IN2): sin la página de Contacto, los dos "Coordinar visita" van como texto (ningún control sin destino)', () => {
    const contactoPagina = tabla.PAGINAS.contacto
    try {
      delete tabla.PAGINAS.contacto
      const main = delMain(circuitosCon())
      assert.equal(cuantas(main, '<a'), 0)
      for (const id of ['circuito-valle-de-la-luna', 'circuito-parque-las-huellas']) {
        assert.match(seccion(main, id), /<p class="flex items-center gap-2 font-mono text-base leading-\[1\.8\] text-blanco">Coordinar visita<svg [^>]*aria-hidden="true"/, id)
      }
    } finally {
      tabla.PAGINAS.contacto = contactoPagina
    }
  })

  // --- El Museo (tablero "Web", Figma 2823:10228; decisiones IN1 a IN10 del desarrollador, 06/11/2026) ---
  const elMuseoCon = (museo = MUSEO_VACIO) => pagina({ pagina: 'el-museo', ruta: '/el-museo', museo, datos: {} })
  /**
   * Lo que nunca va en el <main>: el selector de idioma, las erratas del tablero ("Tikets", "Áreas de extensión",
   * "Director Científico"), "Producción" (D3), la cifra de ejemplo "200" (IN1), el subtítulo de la nota que el tablero
   * no dibuja, "pendiente" del plan 6.1 y controles sin destino (IN2). Los únicos botones son los dos del carrusel de
   * documentales del celular (se prueban aparte).
   */
  const NUNCA_EN_EL_MUSEO = [
    'Contenido pendiente', 'Es (Arg)', 'Tikets', 'Producción', '>200<', 'Áreas de extensión', 'Director Científico',
    'Conocé quiénes están detrás', 'href="#"', '<form', '<input',
  ]
  /**
   * El aire de cada sección (el cuadro de celular, 3123:19747): 120 desde lg, 48 de md a lg y, debajo de md, 64 entre
   * una y otra, 48 arriba de la primera y 40 debajo de la última. Las dos con piedritas, posicionadas y con overflow-x-clip.
   */
  const AIRE_EL_MUSEO = {
    'el-museo-presentacion': ['relative', 'overflow-x-clip', 'pt-12', 'pb-8', 'md:py-12', 'lg:py-30'],
    'el-museo-cogestion': ['relative', 'overflow-x-clip', 'py-8', 'md:py-12', 'lg:py-30'],
    'el-museo-mision': ['py-8', 'md:py-12', 'lg:py-30'],
    'el-museo-documentales': ['py-8', 'md:py-12', 'lg:py-30'],
    'el-museo-numeros': ['py-8', 'md:py-12', 'lg:py-30'],
    'el-museo-autoridades': ['py-8', 'md:py-12', 'lg:py-30'],
    'el-museo-equipo': ['pt-8', 'pb-10', 'md:py-12', 'lg:py-30'],
  }
  const ID_SECCIONES_EL_MUSEO = [
    'el-museo-presentacion', 'el-museo-cogestion', 'el-museo-mision', 'el-museo-documentales', 'el-museo-numeros',
    'el-museo-autoridades', 'el-museo-equipo',
  ]
  const h2De = (html, id) => {
    const m = new RegExp(`<h2 id="${id}" class="([^"]*)">([^<]*)</h2>`).exec(html)
    assert.ok(m, id)
    return { clases: m[1].split(' '), texto: m[2] }
  }
  /** Los recuadros neutros en lugar de un retrato (IN5). */
  const RECUADRO_EL_MUSEO = '<span aria-hidden="true" class="block size-30 shrink-0 rounded-[1.25rem] bg-caja"></span>'

  test('El Museo (IN1, IN6, IN7): el hero sin bajada, sobreFoto, y las siete secciones en el orden del tablero, con 120 de aire desde lg y el del cuadro de celular debajo', () => {
    const m = contenido.elMuseo
    for (const museo of [MUSEO_VACIO, MUSEO_MAXIMO]) {
      const html = elMuseoCon(museo)
      const main = delMain(html)
      assert.equal(cuantas(html, '<h1'), 1)
      assert.equal(cuantas(html, '<footer'), 1)
      // El h1 del tablero ("Acerca del MuPa", aunque el menú diga "El Museo"), sin bajada: a 208 y en la caja de 840.
      assert.equal(m.hero.titulo, 'Acerca del MuPa')
      comprobarHero(main, 'el-museo-titulo', m.hero.titulo, m.hero.imagen)
      // En el celular el h1 va abajo: la foto se corre para que el título quede sobre el cielo y no sobre la torre.
      assert.equal(m.hero.imagen.posicionMovil, '62% 60%')
      const heroHtml = seccion(main, 'el-museo-titulo')
      assert.ok(heroHtml.includes('lg:pt-52'))
      assert.deepEqual(clasesDe(heroHtml, /<div class="(mx-auto lg:max-w-[^"]*)"/), ['mx-auto', 'lg:max-w-[52.5rem]'])
      assert.equal(cuantas(heroHtml, '<p'), 0)
      assert.ok(heroHtml.includes('hero-el-museo-1440'))
      // sobreFoto: los logos del header no se invierten con colores forzados (A11Y-08).
      for (const img of logosDelHeader(html)) assert.ok(!img.includes('data-logo-blanco'), img.slice(0, 120))
      // El orden: el hero y las siete secciones; 8 secciones, 7 h2 y 10 h3 (las dos partes de la cogestión, Misión,
      // Visión, Valores, los tres documentales y las dos autoridades: los integrantes del equipo, sin encabezado).
      const ids = ['el-museo-titulo', ...ID_SECCIONES_EL_MUSEO]
      const orden = ids.map((id) => main.indexOf(`<section aria-labelledby="${id}"`))
      assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
      assert.equal(cuantas(main, '<section'), 8)
      assert.equal(cuantas(main, '<h2'), 7)
      assert.equal(cuantas(main, '<h3'), 10)
      const titulos = ID_SECCIONES_EL_MUSEO.map((id) => h2De(main, id).texto)
      assert.deepEqual(titulos, [
        'El MuPa', 'Cómo nos organizamos', 'Misión y visión', 'Haciendo el MuPa', 'El MuPa en números', 'Autoridades',
        'Nuestro equipo',
      ])
      // 120 de aire arriba y abajo desde lg en todas (el tablero de esta página; las demás, 80); 48 de md a lg; debajo de
      // md, el del cuadro de celular (64 entre secciones, 48 arriba de la primera y 40 debajo de la última).
      assert.deepEqual(Object.keys(AIRE_EL_MUSEO), ID_SECCIONES_EL_MUSEO)
      for (const [id, aire] of Object.entries(AIRE_EL_MUSEO)) {
        assert.deepEqual(clasesDe(main, new RegExp(`<section aria-labelledby="${id}" class="([^"]*)"`)), aire, id)
      }
      // El rótulo antes del h2: a 16 en todos los anchos (mt-4) en Cogestión, Haciendo el MuPa, Autoridades y Nuestro
      // equipo; en El MuPa, a 24 desde lg y a 16 debajo, como las demás secciones del sitio; Misión y visión y los
      // números, sin rótulo. El del equipo, centrado debajo de md (el cuadro de celular).
      const rotulos = {
        'el-museo-presentacion': [m.presentacion.rotulo, ['mt-4', 'lg:mt-6']],
        'el-museo-cogestion': [m.cogestion.rotulo, ['mt-4']],
        'el-museo-documentales': [m.documentales.rotulo, ['mt-4']],
        'el-museo-autoridades': [m.autoridades.rotulo, ['mt-4']],
        'el-museo-equipo': [m.equipo.rotulo, ['mt-4']],
      }
      for (const [id, [rotulo, margenes]] of Object.entries(rotulos)) {
        const centro = id === 'el-museo-equipo' ? ' max-md:text-center' : ''
        assert.ok(seccion(main, id).includes(`<p class="font-mono text-sm leading-5 font-medium text-paper uppercase${centro}">${rotulo}</p><h2 id="${id}"`), id)
        const { clases } = h2De(main, id)
        assert.ok(clases.includes('font-thin'), `${id}: ${clases.join(' ')}`)
        assert.deepEqual(margenesDeArriba(clases), margenes, `${id}: ${clases.join(' ')}`)
      }
      for (const id of ['el-museo-mision', 'el-museo-numeros']) {
        assert.equal(cuantas(seccion(main, id).split(`<h2 id="${id}"`)[0], '<p'), 0, id)
        assert.ok(!h2De(main, id).clases.some((c) => /^mt-/.test(c)), id)
      }
      // La página se marca en el menú (y no lee la base: sus datos son {}).
      assert.equal(cuantas(delHeader(html), 'aria-current="page"'), 2)
      for (const texto of NUNCA_EN_EL_MUSEO) assert.equal(cuantas(main, texto), 0, texto)
    }
  })

  test('El Museo: "El MuPa" con los dos párrafos, la foto del patio (con el recorte del cuadro de celular debajo de md) y las piedritas; "Cómo nos organizamos" con las dos partes, sus logos y las piedritas de la Identidad', () => {
    const { presentacion, cogestion } = contenido.elMuseo
    const main = delMain(elMuseoCon())
    // El MuPa: la sección posicionada y sin scroll horizontal (por las piedritas); los párrafos de la nota.
    const p = seccion(main, 'el-museo-presentacion')
    assert.deepEqual(clasesDe(main, /<section aria-labelledby="el-museo-presentacion" class="([^"]*)"/), AIRE_EL_MUSEO['el-museo-presentacion'])
    assert.equal(presentacion.parrafos.length, 2)
    for (const texto of presentacion.parrafos) {
      assert.ok(p.includes(`<p class="text-lg leading-[1.875rem] font-normal text-paper wrap-break-word text-pretty">${texto}</p>`), texto)
    }
    // Dos columnas desde md (de md a lg con 32; desde lg con 80); debajo, una, a 24 del h2.
    assert.ok(p.includes('<div class="mt-6 grid gap-6 md:grid-cols-2 md:gap-8 lg:mt-12 lg:gap-x-20">'))
    // La foto del patio (la del Collage de la Home), lazy y con prioridad baja: desde 32rem, entera en 5:3 con esquinas de
    // 16 (la foto misma, como antes del celular: el envoltorio va sin caja, con display contents); debajo de 32rem (los
    // teléfonos), en un envoltorio de 354/230 que la recorta, agrandada 1,515 veces desde abajo (el recorte del cuadro
    // de celular, sin un archivo nuevo). De 32rem a md, entera: agrandada perdía resolución en un iPad mini (VMUS-01).
    const fotos = p.match(/<img [^>]*>/g)
    assert.equal(fotos.length, 2)
    const patio = fotos.find((f) => f.includes('carrusel-patio'))
    for (const a of ['loading="lazy"', 'decoding="async"', 'fetchPriority="low"', `alt="${presentacion.imagen.alt}"`]) {
      assert.ok(patio.includes(a), a)
    }
    assert.deepEqual(/ class="([^"]*)"/.exec(patio)[1].split(' '), [
      'block', 'aspect-[5/3]', 'h-auto', 'w-full', 'rounded-2xl', 'object-cover', 'max-[32rem]:aspect-auto',
      'max-[32rem]:size-full', 'max-[32rem]:rounded-none', 'max-[32rem]:origin-bottom', 'max-[32rem]:scale-[1.515]',
    ])
    assert.ok(p.includes(`<div class="contents max-[32rem]:isolate max-[32rem]:block max-[32rem]:aspect-[354/230] max-[32rem]:overflow-hidden max-[32rem]:rounded-2xl">${patio}</div>`))
    assert.equal(cuantas(p, 'max-md:'), 0)
    assert.deepEqual([...patio.matchAll(/ (\d+)w/g)].map((x) => Number(x[1])), [700, 1400])
    // El sizes: el de siempre desde lg; de md a lg, la mitad del contenido; de 32rem a md, el contenido; debajo, el
    // contenido por 1,52 (la foto se ve agrandada).
    assert.match(
      patio,
      /sizes="\(min-width: 90rem\) 600px, \(min-width: 64rem\) calc\(\(100vw - 15rem\) \/ 2\), \(min-width: 48rem\) calc\(\(100vw - 7rem\) \/ 2\), \(min-width: 32rem\) calc\(100vw - 3rem\), calc\(\(100vw - 3rem\) \* 1\.52\)"/,
    )
    // Las piedritas: decorativas (alt vacío dentro de un aria-hidden), solo desde lg, lazy; 96 px sobre la sección.
    assert.match(
      p,
      /<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 hidden h-0 lg:block"><img src="[^"]*patron-galeria[^"]*" alt="" width="408" height="462" loading="lazy" fetchPriority="low" class="absolute top-\[-6\.0625rem\] right-\[-5\.6875rem\] w-\[25\.5rem\] max-w-none"\/><\/div>/,
    )
    // Cómo nos organizamos: las dos partes (una lista), cada una con su rótulo en h3, el logo de la institución (el
    // blanco del pie, con data-logo-blanco y su nombre de alt), la introducción en gris y su lista.
    const c = seccion(main, 'el-museo-cogestion')
    assert.deepEqual(clasesDe(main, /<section aria-labelledby="el-museo-cogestion" class="([^"]*)"/), AIRE_EL_MUSEO['el-museo-cogestion'])
    // La lista de las partes va posicionada: una piedra que la cruce pasa por detrás de las letras (MUS-01). Desde lg, de
    // 502 y 738 con 40 entre sí; de md a lg, dos iguales con 32; debajo de md, una debajo de la otra con 48, a 24 del h2.
    assert.ok(c.includes('<ul class="relative mt-6 grid gap-12 md:grid-cols-2 md:gap-8 lg:mt-12 lg:grid-cols-[502fr_738fr] lg:gap-10">'))
    assert.deepEqual([...c.matchAll(/<h3 class="([^"]*)">([^<]*)<\/h3>/g)].map((x) => x[2]), ['Co-gestión académica', 'Gestión provincial'])
    assert.match(c, /<h3 class="font-mono text-xs leading-4 font-medium text-paper uppercase">Co-gestión académica<\/h3>/)
    const logos = c.match(/<img [^>]*data-logo-blanco[^>]*>/g)
    assert.equal(logos.length, 2)
    assert.match(logos[0], /logo-unsj[^"]*" alt="Universidad Nacional de San Juan" width="205" height="94.4" loading="lazy"/)
    assert.match(logos[1], /logo-gobierno-san-juan[^"]*" alt="Gobierno de San Juan" width="253.5" height="73.06" loading="lazy"/)
    for (const parte of cogestion.partes) {
      assert.ok(c.includes(`<p class="text-base leading-[1.625rem] font-normal text-muted wrap-break-word text-pretty">${parte.intro}</p>`), parte.intro)
      for (const item of parte.items) assert.ok(c.includes(`<li>${item}</li>`), item)
    }
    assert.deepEqual(cogestion.partes.map((x) => x.items.length), [5, 4])
    assert.equal(cuantas(c, '<li'), 2 + 5 + 4)
    // Las piedritas de la Identidad de la landing, con su desvanecido (la utilidad patron-b); entre lg y xl, 48 px más
    // afuera (con 280, a 1024 pisaban el final de la lista de Gobierno).
    assert.match(c, /<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 hidden h-0 lg:block"><img src="[^"]*patron-b[^"]*" alt=""[^>]*class="patron-b absolute top-\[31\.375rem\] right-\[-20\.5rem\] w-\[38\.58rem\] max-w-none xl:right-\[-17\.5rem\]"\/><\/div>/)
    // IN3: cada parte con la forma de una fila.
    for (const parte of cogestion.partes) assert.deepEqual(Object.keys(parte), ['rotulo', 'institucion', 'intro', 'items'])
  })

  test('El Museo (IN1, IN2): Misión y visión con siete Valores que no son controles; los documentales en una fila desde md y, debajo, un carrusel de a uno con sus controles; el "play" decorado; los números con "[—]"', () => {
    const { mision, documentales, numeros } = contenido.elMuseo
    const main = delMain(elMuseoCon())
    // Misión y visión: el rótulo de cada una en h3 y su texto en 20/32; "Valores" en h3 Thin 40/52 y las siete píldoras,
    // una lista sin enlaces ni botones.
    const mv = seccion(main, 'el-museo-mision')
    // Misión y Visión en dos columnas desde md; debajo, una debajo de la otra, a 32 del h2 y entre sí; Valores, a 32.
    assert.ok(mv.includes('<div class="mt-8 grid gap-8 md:grid-cols-2 lg:mt-16 lg:gap-x-20">'))
    assert.match(mv, /<div class="mt-8 lg:mt-16"><h3 class="font-titulo [^"]*">Valores<\/h3>/)
    for (const item of mision.items) {
      assert.ok(mv.includes(`<h3 class="font-mono text-sm leading-5 font-medium text-paper uppercase">${item.rotulo}</h3><p class="text-xl leading-8 font-normal text-paper wrap-anywhere text-pretty">${item.texto}</p>`), item.rotulo)
    }
    assert.match(mv, /<h3 class="font-titulo [^"]*font-thin[^"]*min-\[32rem\]:text-\[2\.5rem\][^"]*">Valores<\/h3><ul class="mt-8 flex flex-wrap gap-4">/)
    const pildoras = [...mv.matchAll(/<li class="([^"]*)">([^<]*)<\/li>/g)]
    assert.deepEqual(pildoras.map((x) => x[2]), mision.valores.lista)
    assert.equal(pildoras.length, 7)
    for (const [, clases] of pildoras) for (const cl of ['rounded-full', 'border', 'border-paper', 'font-mono', 'text-sm']) assert.ok(clases.split(' ').includes(cl), cl)
    assert.equal(cuantas(mv, '<a'), 0)
    // Haciendo el MuPa: la bajada (de la nota) y la lista de los tres documentales, UNA vez en el HTML: desde md, la fila
    // de tres de escritorio (sin controles: entran los tres, IN2); debajo de md, un carrusel de a uno, como el cuadro de
    // celular, con scroll horizontal nativo (Lenis no toma los gestos horizontales), sin snap antes de hidratar (lo pone
    // el efecto, solo debajo de md) y, sin JavaScript o al imprimir, las tres en renglones.
    const d = seccion(main, 'el-museo-documentales')
    assert.ok(d.includes(`<p class="text-lg leading-7 font-normal text-muted text-pretty mt-4">${documentales.bajada}</p>`))
    // La fila se llama como su sección (aria-labelledby al h2): enfocada, el lector dice cuál es (VREG-01 y VA11-02).
    const fila = /<ul id="([^"]+)" aria-labelledby="el-museo-documentales" data-lenis-prevent-horizontal="" class="([^"]*)">/.exec(d)
    assert.ok(fila, 'la fila de los documentales')
    assert.equal(cuantas(d, '<ul'), 1)
    // (el & de la clase de la barra va escapado en el atributo)
    assert.deepEqual(fila[2].replaceAll('&amp;', '&').split(' '), [
      'relative', 'mt-4', '-mr-2', '-mb-2', '-ml-2', 'flex', 'scroll-pl-2', 'gap-8', 'overflow-x-auto', 'overscroll-x-contain',
      'py-2', 'pr-2', 'pl-2', '[scrollbar-width:none]', '[&::-webkit-scrollbar]:hidden', 'noscript:flex-wrap', 'noscript:overflow-visible',
      'print:flex-wrap', 'print:overflow-visible', 'focus-visible:outline-2', 'focus-visible:outline-blanco', 'md:m-0',
      'md:mt-8', 'md:grid', 'md:grid-cols-3', 'md:gap-6',
      'md:overflow-visible', 'md:p-0', 'lg:mt-12', 'lg:gap-8',
    ])
    for (const clase of ['snap-x', 'snap-mandatory', 'max-md:snap-x', 'max-md:snap-mandatory']) assert.ok(!fila[2].split(' ').includes(clase), clase)
    // La fila toma el foco (para deslizarla con el teclado) recién cuando el efecto mide que desborda: el HTML del
    // servidor no lo lleva.
    assert.equal(cuantas(d, 'tabindex'), 0)
    // Cada documental una vez: debajo de md, del ancho del contenido con el tope de 24rem de la tarjeta de Novedades
    // (T4 de la tanda 1, 16/11/2026: en los teléfonos, el ancho del contenido, como el cuadro; en las tablets de menos
    // de 768 px, 384, y asoma la siguiente), con el snap a su borde izquierdo; sin JavaScript y al imprimir (apiladas),
    // el ancho entero, como antes; y de su columna desde md.
    assert.deepEqual([...d.matchAll(/<h3 class="[^"]*">([^<]*)<\/h3>/g)].map((x) => x[1]), documentales.lista.map((x) => x.titulo))
    for (const doc of documentales.lista) assert.equal(cuantas(main, `>${doc.titulo}<`), 1, doc.titulo)
    assert.equal(cuantas(d, '<li class="group relative w-[min(100%,24rem)] min-w-0 shrink-0 snap-start noscript:w-full print:w-full md:w-auto">'), 3)
    // El tope es el de la tarjeta de Novedades (CarruselNovedades.jsx), y ninguna quedó con el ancho de antes.
    assert.match(seccion(home([novedad(1), novedad(2)]), 'novedades-titulo'), /<li class="w-\[min\(100%,24rem\)\] shrink-0 snap-start /)
    assert.equal(cuantas(d, '<li class="group relative w-full '), 0)
    assert.equal(cuantas(d, '<li'), 3)
    for (const n of [1, 2, 3]) assert.ok(d.includes(`<p class="font-mono text-xs leading-4 font-medium text-paper uppercase">Documental · ${n}</p>`), n)
    assert.equal(cuantas(d, '>[Título pendiente]</p>'), 3)
    // Las fotos: 354/280 en el celular (el cuadro) y 405/280 desde md, lazy y con prioridad baja.
    const fotos = d.match(/<img [^>]*>/g)
    assert.equal(fotos.length, 3)
    for (const f of fotos) {
      const clases = / class="([^"]*)"/.exec(f)[1].split(' ')
      assert.deepEqual(clases, ['block', 'aspect-[354/280]', 'h-auto', 'w-full', 'rounded-xl', 'object-cover', 'md:aspect-[405/280]'])
      for (const a of ['loading="lazy"', 'fetchPriority="low"']) assert.ok(f.includes(a), a)
      // El sizes: un tercio desde md y, debajo, el contenido con el tope de la tarjeta (T4: 24rem); sin JavaScript
      // (apiladas, con el ancho entero), el contenido, como antes.
      assert.match(f, /sizes="\(min-width: 90rem\) 405px, \(min-width: 64rem\) calc\(\(100vw - 14rem\) \/ 3\), \(min-width: 48rem\) calc\(\(100vw - 8rem\) \/ 3\), \(scripting: none\) calc\(100vw - 3rem\), min\(calc\(100vw - 3rem\), 24rem\)"/)
    }
    // El "play": un círculo decorado (aria-hidden), con el ícono; no es un enlace ni un botón.
    assert.equal(cuantas(d, '<span aria-hidden="true" class="absolute top-1/2 left-1/2 flex size-16'), 3)
    assert.equal(cuantas(d, '<polygon points="5 3 19 12 5 21 5 3"'), 3)
    // Los controles de abajo del carrusel (ControlesCarrusel.jsx; los de Novedades son FlechasCarrusel.jsx desde el
    // 16/11/2026), a la izquierda y solo debajo de md, con JavaScript y en la pantalla; invisibles hasta que la página
    // hidrata. Anterior y Siguiente con su nombre y aria-controls a la fila (IN2: en el celular hacen algo), el "1/3" de
    // dibujo y la región viva vacía (dice "Documental 2 de 3" después de un botón).
    assert.equal(cuantas(d, '<a'), 0)
    assert.equal(cuantas(d, '<button'), 2)
    const botones = [...d.matchAll(/<button type="button" aria-controls="([^"]+)" aria-disabled="(true|false)"[^>]*>[\s\S]*?<span class="sr-only">([^<]*)<\/span><\/button>/g)]
    assert.deepEqual(botones.map((b) => [b[1], b[2], b[3]]), [
      [fila[1], 'true', documentales.anterior],
      [fila[1], 'false', documentales.siguiente],
    ])
    assert.deepEqual([documentales.anterior, documentales.siguiente], ['Anterior', 'Siguiente'])
    assert.ok(d.includes('<div class="mt-6 flex items-center justify-start gap-2 md:hidden noscript:hidden print:hidden invisible"><button'))
    assert.match(d, /<span aria-hidden="true" class="[^"]*">1(<!-- -->)?\/(<!-- -->)?3<\/span>/)
    assert.ok(d.includes('<p aria-live="polite" class="sr-only"></p>'), 'la región viva, vacía')
    assert.equal(documentales.contador(2, 3), 'Documental 2 de 3')
    assert.equal(cuantas(d, 'Documental 1 de 3'), 0)
    // Los controles van después de la fila, dentro de la sección.
    assert.ok(d.indexOf('</ul>') < d.indexOf('<button'))
    // IN3: cada documental, una fila sin enlace.
    for (const doc of documentales.lista) {
      assert.deepEqual(Object.keys(doc), ['titulo', 'subtitulo', 'url', 'imagen'])
      assert.equal(doc.url, null)
    }
    // El MuPa en números: el h2 centrado y una lista de definiciones con la etiqueta (dt) y la cifra (dd, arriba con
    // order-first); "[—]" en las cuatro (IN1: el tablero dice "200"); "Área de extensión" (la errata, corregida).
    const n = seccion(main, 'el-museo-numeros')
    assert.ok(h2De(n, 'el-museo-numeros').clases.includes('text-center'))
    assert.deepEqual([...n.matchAll(/<dt class="[^"]*">([^<]*)<\/dt>/g)].map((x) => x[1]), ['Área de extensión', 'Piezas fósiles', 'Dispositivos interactivos', 'Científicos e investigadores'])
    const cifras = [...n.matchAll(/<dd class="([^"]*)">([^<]*)<\/dd>/g)]
    assert.deepEqual(cifras.map((x) => x[2]), ['[—]', '[—]', '[—]', '[—]'])
    // La cifra a 64/72 en todos los anchos (el cuadro de celular también; era 36 debajo de 32rem).
    for (const [, clases] of cifras) {
      const lista = clases.split(' ')
      for (const cl of ['order-first', 'font-hero', 'font-[weight:755]', 'text-[4rem]', 'leading-[1.125]']) assert.ok(lista.includes(cl), cl)
      for (const cl of ['text-[2.25rem]', 'min-[32rem]:text-[4rem]']) assert.ok(!lista.includes(cl), cl)
    }
    // Cuatro columnas desde lg, dos de md a lg y una debajo de md (el cuadro de celular; con una, los rótulos entran con
    // la letra agrandada, VDIS-01); 24 debajo del h2 en el celular. La palabra que igual no entre se parte.
    assert.ok(n.includes('<dl class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:mt-16 lg:grid-cols-4">'))
    // Cada cifra: 40 arriba y abajo en todos los anchos (180 de alto en el celular), 8 a los costados debajo de lg y 24
    // desde lg, con la línea entre columnas solo desde lg.
    for (const [, clases] of n.matchAll(/<div class="([^"]*)"><dt/g)) {
      assert.deepEqual(clases.split(' '), ['flex', 'min-w-0', 'flex-col', 'gap-2', 'px-2', 'py-10', 'text-center', 'lg:px-6', 'lg:not-last:border-r', 'lg:border-line'])
    }
    for (const [, clases] of n.matchAll(/<dt class="([^"]*)">/g)) assert.ok(clases.split(' ').includes('wrap-break-word'))
    assert.equal(cuantas(n, 'lg:not-last:border-r'), 4)
    for (const c of numeros.cifras) assert.deepEqual(Object.keys(c), ['cifra', 'rotulo'])
  })

  test('El Museo (IN2, IN3, IN5): las autoridades y el equipo sin retrato (el recuadro neutro); con foto en la fila, la foto con su nombre; el equipo centrado debajo de md; ningún enlace y solo los dos botones del carrusel', () => {
    const { autoridades, equipo, documentales } = contenido.elMuseo
    const main = delMain(elMuseoCon())
    // Autoridades: el recuadro (aria-hidden, en el color de la caja), el cargo, el nombre en h3 y la biografía; ninguna foto.
    const a = seccion(main, 'el-museo-autoridades')
    // En dos columnas desde md; debajo, una debajo de la otra, a 32 del h2 y con 32 entre sí (el cuadro de celular).
    assert.ok(a.includes('<ul class="mt-8 grid gap-8 md:grid-cols-2 lg:mt-16 lg:gap-12 lg:gap-x-20">'))
    assert.equal(cuantas(a, '<img'), 0)
    assert.equal(cuantas(a, RECUADRO_EL_MUSEO), 2)
    for (const persona of autoridades.personas) {
      assert.ok(a.includes(`<p class="font-mono text-xs leading-4 font-medium text-paper uppercase">${persona.cargo}</p><h3 class="mt-2 text-[1.75rem] leading-9 font-medium text-paper wrap-break-word">${persona.nombre}</h3>`), persona.nombre)
      assert.ok(a.includes(`<p class="text-base leading-[1.625rem] font-normal text-muted wrap-break-word text-pretty">${persona.bio}</p>`), persona.nombre)
      assert.deepEqual(Object.keys(persona), ['cargo', 'nombre', 'bio', 'foto'])
      assert.equal(persona.foto, null)
    }
    assert.deepEqual(autoridades.personas.map((x) => [x.cargo, x.nombre]), [['Director', 'Oscar Alcober'], ['Director científico', 'Ricardo Martínez']])
    // Nuestro equipo: el párrafo en gris (en su caja de 700) y cuatro integrantes de relleno, sin foto. Debajo de md, el
    // rótulo, el h2 y el párrafo centrados (el cuadro de celular; el título y el párrafo, los de escritorio: O7) y los
    // integrantes de a uno, con 32 entre sí; de md a lg, de a dos; desde lg, de a cuatro, a la izquierda.
    const e = seccion(main, 'el-museo-equipo')
    assert.ok(e.includes(`<p class="text-lg leading-[1.875rem] font-normal text-muted wrap-break-word text-pretty mt-4 max-w-[43.75rem] max-md:mx-auto max-md:text-center">${equipo.parrafo}</p>`))
    assert.ok(h2De(e, 'el-museo-equipo').clases.includes('max-md:text-center'))
    assert.deepEqual(margenesDeArriba(h2De(e, 'el-museo-equipo').clases), ['mt-4'])
    assert.ok(e.includes('<ul class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">'))
    assert.equal(cuantas(e, '<img'), 0)
    assert.equal(cuantas(e, RECUADRO_EL_MUSEO), 4)
    assert.equal(cuantas(e, '>[Nombre del integrante]</p>'), 4)
    assert.equal(cuantas(e, '>[Rol]</p>'), 4)
    assert.equal(cuantas(e, '<h3'), 0)
    for (const persona of equipo.personas) assert.deepEqual(Object.keys(persona), ['nombre', 'rol', 'foto'])
    // IN2: en todo el <main>, ningún enlace ni formulario y exactamente dos botones (Anterior y Siguiente del carrusel de
    // documentales del celular, que sí hacen algo); solo la foto del hero sin loading (las demás, lazy).
    assert.deepEqual(anclas(main), [])
    assert.equal(cuantas(main, '<button'), 2)
    assert.equal(cuantas(seccion(main, 'el-museo-documentales'), '<button'), 2)
    const imgs = main.match(/<img [^>]*>/g)
    assert.equal(imgs.filter((i) => !i.includes('loading="lazy"')).length, 1)
    assert.ok(imgs.find((i) => !i.includes('loading="lazy"')).includes('hero-el-museo'))
    for (const texto of NUNCA_EN_EL_MUSEO) assert.equal(cuantas(main, texto), 0, texto)
    // IN3: con la foto en la fila de una persona, la foto (con su nombre de alt) en lugar del recuadro; con la url de un
    // documental, el título es el enlace, estirado sobre la tarjeta.
    const martinez = autoridades.personas[1]
    const doc = documentales.lista[0]
    try {
      martinez.foto = { src: '/retrato-de-prueba.webp' }
      doc.url = 'https://example.com/documental'
      const con = delMain(elMuseoCon())
      const ca = seccion(con, 'el-museo-autoridades')
      assert.equal(cuantas(ca, RECUADRO_EL_MUSEO), 1)
      assert.match(ca, /<img src="\/retrato-de-prueba.webp" width="120" height="120" alt="Ricardo Martínez" loading="lazy" decoding="async" fetchPriority="low" class="block size-30 shrink-0 rounded-\[1\.25rem\] object-cover"\/>/)
      const cd = seccion(con, 'el-museo-documentales')
      assert.match(cd, /<h3 class="[^"]*"><a href="https:\/\/example.com\/documental" class="[^"]*after:absolute after:inset-0[^"]*">El MuPa por dentro<\/a><\/h3>/)
      assert.equal(cuantas(cd, '<a '), 1)
    } finally {
      martinez.foto = null
      doc.url = null
    }
  })

  test('HeroPagina y BloqueTextoFoto: sin bajadaJusta ni apartado, la bajada de Divulgación en 1,75 desde lg y sus bloques sin h3', async () => {
    const tablero = await vite.ssrLoadModule('/src/components/tablero.js')
    // La bajada de Divulgación, carácter por carácter: debajo de 32rem, 16/24 con su halo en rem en una columna de 320
    // (la de la Home de celular: así va siempre en dos renglones, VREN-01) y balanceada (sin «Juan» sola en el segundo
    // renglón, RV-01); desde 32rem, 32 px a todo el ancho con el interlineado normal y el halo en em, como antes; desde
    // lg, 840 de ancho y 1,75. La de Circuitos, la misma a todo el ancho también debajo de 32rem, sin el balance, y con
    // 1,25 desde lg.
    const bajada =
      'mx-auto mt-4 max-w-[20rem] min-[32rem]:max-w-none max-[32rem]:text-balance text-center text-base leading-6 font-normal text-paper ' +
      '[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125rem_rgb(1_1_1),0_0_0.25rem_rgb(1_1_1/0.9),0_0_0.5rem_rgb(1_1_1/0.8),0_0_0.75rem_rgb(1_1_1/0.6)] ' +
      'min-[32rem]:text-[2rem] min-[32rem]:leading-normal ' +
      'min-[32rem]:[text-shadow:0_0_1rem_rgb(0_0_0/0.25),0_0_0.125em_rgb(1_1_1/0.9),0_0_0.25em_rgb(1_1_1/0.8),0_0_0.5em_rgb(1_1_1/0.5)] ' +
      'lg:max-w-[52.5rem] lg:leading-[1.75]'
    assert.equal(tablero.BAJADA_HERO_PAGINA, bajada)
    assert.equal(
      tablero.BAJADA_HERO_PAGINA_JUSTA,
      bajada
        .replace('lg:leading-[1.75]', 'lg:leading-[1.25]')
        .replace('max-w-[20rem] min-[32rem]:max-w-none max-[32rem]:text-balance', 'max-w-none'),
    )
    // El balance va solo debajo de 32rem y solo en la de Divulgación.
    assert.equal(tablero.BAJADA_HERO_PAGINA.split(' ').filter((c) => c.endsWith('text-balance')).join(' '), 'max-[32rem]:text-balance')
    assert.ok(!tablero.BAJADA_HERO_PAGINA_JUSTA.includes('text-balance'))
    assert.ok(tablero.BAJADA_HERO_PAGINA_JUSTA.endsWith(' lg:max-w-[52.5rem] lg:leading-[1.25]'))
    // En Divulgación, la bajada sigue en 1,75 y sus cuatro bloques sin h3 (los 3 h3 son las tarjetas del newsletter).
    const main = delMain(pagina({ pagina: 'divulgacion', ruta: '/divulgacion', museo: MUSEO_VACIO, datos: { novedades: [] } }))
    assert.ok(seccion(main, 'divulgacion-titulo').includes(`<p class="${bajada}">`))
    for (const b of contenido.divulgacion.bloques) assert.equal(cuantas(seccion(main, b.id), '<h3'), 0, b.id)
  })

  test('SeccionRecursos (IN3): con url, la acción es un enlace de 44 px con la flecha; sin url, texto; el ícono naranja solo con iconoNaranja', async () => {
    const SeccionRecursos = (await vite.ssrLoadModule('/src/components/SeccionRecursos.jsx')).default
    const tarjetas = [
      { icono: 'descarga', titulo: 'Con enlace', texto: 'Texto.', accion: 'Ver', url: 'https://example.com/guias' },
      { icono: 'video', titulo: 'Sin enlace', texto: 'Texto.', accion: 'Mirar', url: null },
    ]
    const html = renderToStaticMarkup(createElement(SeccionRecursos, { id: 'prueba', rotulo: 'Rótulo', titulo: 'T', bajada: 'B', tarjetas }))
    assert.match(html, /<a href="https:\/\/example.com\/guias" class="-my-3 inline-flex min-h-11 [^"]*focus-visible:outline-blanco">Ver<svg [^>]*aria-hidden="true"/)
    assert.match(html, /<p class="flex items-center gap-2 font-mono text-sm leading-5 font-normal text-paper">Mirar<svg/)
    assert.equal(cuantas(html, '<a '), 1)
    assert.equal(cuantas(html, 'text-naranja'), 0)
    const naranja = renderToStaticMarkup(createElement(SeccionRecursos, { id: 'p', titulo: 'T', bajada: 'B', tarjetas, iconoNaranja: true }))
    assert.equal(cuantas(naranja, 'class="shrink-0 size-6 text-naranja"'), 2)
    // Sin rótulo, el h2 sin mt-4 (el newsletter de Divulgación) y ningún <p> antes del h2.
    assert.match(naranja, /<div class="[^"]*"><h2 id="p" class="[^"]*font-thin[^"]*">T<\/h2>/)
    assert.ok(!clasesDe(naranja, /<h2 id="p" class="([^"]*)"/).includes('mt-4'))
    // Con rótulo o sin él, el h2 (el ancla de la sección) lleva su margen de scroll (T6 de la tanda 1, 16/11/2026).
    for (const [h, id] of [[html, 'prueba'], [naranja, 'p']]) {
      assert.deepEqual(clasesDe(h, new RegExp(`<h2 id="${id}" class="([^"]*)"`)).filter((c) => /(^|:)scroll-m/.test(c)), ['scroll-mt-25', 'lg:scroll-mt-29'], id)
    }
  })

  test('los respaldos del h1 de los hero debajo de lg (VHOM-04 y VREN-01): cada familia con sus caras, y cada cara con su size-adjust y sus métricas', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(fileURLToPath(new URL('../../src/index.css', import.meta.url)), 'utf8')
    const familia = (nombre) => {
      const m = new RegExp(`--${nombre}: ([^;]*);`).exec(css)
      assert.ok(m, nombre)
      return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    }
    // La de siempre (desde lg, y las fichas y la 404), y las dos de debajo de lg: cambian solo las caras medidas.
    assert.deepEqual(familia('font-hero'), ['Google Sans Flex', 'GSF Hero Fallback', 'GSF Hero Fallback Roboto', 'GSF Hero Fallback Arial'])
    assert.deepEqual(familia('font-hero-portada'), ['Google Sans Flex', 'GSF Hero Portada Fallback', 'GSF Hero Fallback Roboto', 'GSF Hero Portada Fallback Arial'])
    assert.deepEqual(familia('font-hero-internas'), ['Google Sans Flex', 'GSF Hero Fallback', 'GSF Hero Fallback Roboto', 'GSF Hero Internas Fallback Arial'])
    // Cada cara: la local de siempre, con el size-adjust medido y las métricas de Google Sans Flex (0,966 y 0,286 em)
    // divididas por él, como las demás (si no, el renglón se corre al llegar la fuente).
    const caras = Object.fromEntries(
      [...css.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => [/font-family: "([^"]+)"/.exec(m[1])?.[1], m[1]]),
    )
    for (const [nombre, local, ajuste] of [
      ['GSF Hero Portada Fallback', 'local("Segoe UI Bold")', 138.15],
      ['GSF Hero Portada Fallback Arial', 'local("Arial Bold")', 132.94],
      ['GSF Hero Internas Fallback Arial', 'local("Arial Bold")', 133.79],
    ]) {
      const cara = caras[nombre]
      assert.ok(cara, nombre)
      assert.ok(cara.includes(local), nombre)
      assert.ok(cara.includes('font-weight: 100 1000;'), nombre)
      const valor = (prop) => Number(new RegExp(`${prop}: ([\\d.]+)%`).exec(cara)[1])
      assert.equal(valor('size-adjust'), ajuste, nombre)
      assert.ok(Math.abs(valor('ascent-override') - 9660 / ajuste) < 0.01, nombre)
      assert.ok(Math.abs(valor('descent-override') - 2860 / ajuste) < 0.01, nombre)
    }
  })

  test('FlechasCarrusel y AvisoCarrusel (los controles de Novedades desde el 16/11/2026): cada flecha a la vista solo si hay más para su lado; la región viva, siempre en el HTML y vacía hasta el primer botón; sin contador (Q); con una tarjeta, nada', async () => {
    const modulo = await vite.ssrLoadModule('/src/components/FlechasCarrusel.jsx')
    const FlechasCarrusel = modulo.default
    const { AvisoCarrusel } = modulo
    const textos = { anterior: 'Atrás', siguiente: 'Adelante' }
    const base = { idFila: 'fila-x', aviso: '', anterior: () => {}, siguiente: () => {} }
    const con = (estado) => ({ ...base, estado: { listo: true, desborda: true, actual: 1, alInicio: false, alFinal: false, ...estado } })
    const flechas = (carrusel, total = 4) =>
      renderToStaticMarkup(createElement(FlechasCarrusel, { carrusel, total, textos, guia: 'aspect-[2/1] w-10' })).replaceAll('&amp;', '&').replaceAll('&gt;', '>')
    /**
     * De cada botón, en su orden: el nombre, aria-disabled y si está oculto. Sus clases se comparan ENTERAS (VFC-05):
     * a la vista, las de la flecha y las de su borde (FLECHA_COSTADO y BORDE_FLECHA, arriba), y oculto, esas y las de
     * oculta (FLECHA_OCULTA); cualquier otra lista, con una clase de más o de menos, hace fallar la prueba.
     */
    const botones = (html) =>
      [...html.matchAll(/<button type="button" aria-controls="fila-x" aria-disabled="(true|false)" class="([^"]*)">[\s\S]*?<span class="sr-only">([^<]*)<\/span><\/button>/g)].map((b, i) => {
        const clases = b[2].split(' ')
        const aLaVista = [...FLECHA_COSTADO, ...BORDE_FLECHA[i]]
        const oculto = clases.length > aLaVista.length
        assert.deepEqual(clases, oculto ? [...aLaVista, ...FLECHA_OCULTA] : aLaVista, b[3])
        return [b[3], b[1], oculto]
      })
    // Antes de medir (el estado inicial, el mismo en el servidor y en el navegador): los dos ocultos.
    const sinMedir = flechas(con({ listo: false, desborda: false, alInicio: true }))
    assert.deepEqual(botones(sinMedir), [['Atrás', 'true', true], ['Adelante', 'false', true]])
    // La capa, con la guía (las clases que le pasan, después de las suyas) antes de los botones.
    assert.match(sinMedir, /^<div class="pointer-events-none absolute inset-x-0 top-2 z-10 grid noscript:hidden print:hidden"><div class="col-start-1 row-start-1 self-start justify-self-start aspect-\[2\/1\] w-10"><\/div><button /)
    // Medido: al principio, solo «Siguiente»; en el medio, los dos; al final, solo «Anterior».
    assert.deepEqual(botones(flechas(con({ alInicio: true }))), [['Atrás', 'true', true], ['Adelante', 'false', false]])
    assert.deepEqual(botones(flechas(con({ actual: 2 }))), [['Atrás', 'false', false], ['Adelante', 'false', false]])
    assert.deepEqual(botones(flechas(con({ actual: 4, alFinal: true }))), [['Atrás', 'false', false], ['Adelante', 'true', true]])
    // Medido, pero entran todas: ninguno. Con una sola tarjeta, nada.
    assert.deepEqual(botones(flechas(con({ desborda: false, alInicio: true, alFinal: true }))), [['Atrás', 'true', true], ['Adelante', 'true', true]])
    assert.equal(flechas(con({}), 1), '')
    // Oculto es visibility: hidden (no toma el foco ni figura para el lector), salvo con el foco visible: ahí se
    // queda, con la flecha tenue (aria-disabled) y el contorno entero. A la vista, la lista entera sin ninguna de esas
    // clases. Con reduced-motion no hay fundido (index.css deja las transiciones en 0,01 ms), pero el retardo de
    // visibility sigue: el botón no las apaga.
    const visible = /aria-disabled="false" class="([^"]*)"/.exec(flechas(con({ alInicio: true })))[1].split(' ')
    assert.deepEqual(visible, [...FLECHA_COSTADO, ...BORDE_FLECHA[1]])
    assert.ok(!visible.some((c) => c.startsWith('motion-reduce:')))
    for (const c of FLECHA_OCULTA) assert.ok(!visible.includes(c), c)
    // Tenue: solo la flecha, al 45 % (al 35 % daba 2,73:1 sobre una portada blanca: VFU-02), y el contorno del foco,
    // entero. El cursor: la mano, y el común si está deshabilitado (VFU-05).
    assert.deepEqual(visible.filter((c) => /opacity-/.test(c) && c.startsWith('aria-disabled:')), ['aria-disabled:[&>svg]:opacity-45'])
    assert.ok(!visible.some((c) => /^aria-disabled:opacity/.test(c)), 'tenue, solo la flecha (el contorno del foco se ve entero)')
    assert.deepEqual(visible.filter((c) => /(^|:)cursor-/.test(c)), ['cursor-pointer', 'aria-disabled:cursor-default'])
    // La capa no lleva la región viva (va aparte, después de ella: AvisoCarrusel).
    assert.equal(cuantas(sinMedir, 'aria-live'), 0)
    // La región viva (AvisoCarrusel): solo el párrafo para el lector, con el aviso del hook, sin envoltorio ni clases que
    // la escondan: está desde el principio, igual antes y después de medir y con todas a la vista (no ocupa lugar), y
    // vacía hasta el primer botón; con una tarjeta, nada. Y ya no hay contador (Q, 17/11/2026): el módulo no exporta
    // ContadorCarrusel (era la fila de abajo, con el "n/total" en un <span> y la región viva, invisible hasta medir).
    const aviso = (carrusel, total = 4) => renderToStaticMarkup(createElement(AvisoCarrusel, { carrusel, total }))
    assert.equal(aviso(con({ listo: false, desborda: false, alInicio: true })), '<p aria-live="polite" class="sr-only"></p>')
    assert.equal(aviso({ ...con({ actual: 3 }), aviso: 'Novedad 3 de 4' }), '<p aria-live="polite" class="sr-only">Novedad 3 de 4</p>')
    assert.equal(aviso(con({ desborda: false })), '<p aria-live="polite" class="sr-only"></p>')
    assert.equal(aviso(con({}), 1), '')
    assert.equal(modulo.ContadorCarrusel, undefined)
  })

  test('FlechasCarrusel: el dedo que desliza sobre una flecha (gestoDelDedo: 24 px o más a lo ancho y más a lo ancho que a lo alto) y solo el dedo (useDedoSobreLaFlecha: el mouse y el lápiz no cuentan, VFC-04)', async () => {
    const { gestoDelDedo, useDedoSobreLaFlecha } = await vite.ssrLoadModule('/src/components/FlechasCarrusel.jsx')
    const desde = { x: 200, y: 100 }
    const hasta = (dx, dy = 0) => gestoDelDedo(desde, { x: desde.x + dx, y: desde.y + dy })
    // Un toque (sin moverse) y hasta 23 px a lo ancho: no es un deslizamiento (es el clic del botón, o nada).
    for (const dx of [0, 1, 10, 23, -23, 23.9, -23.9]) assert.equal(hasta(dx), null, `${dx} px`)
    // Desde 24 px: hacia la izquierda, «Siguiente»; hacia la derecha, «Anterior».
    for (const [dx, gesto] of [[-24, 'siguiente'], [24, 'anterior'], [-200, 'siguiente'], [60, 'anterior']]) assert.equal(hasta(dx), gesto, `${dx} px`)
    // Más a lo ancho que a lo alto; vertical o en diagonal de 45° o más, es de la página: nada.
    for (const [dx, dy, gesto] of [[-30, 29, 'siguiente'], [30, -29, 'anterior'], [-60, -40, 'siguiente'], [-30, -30, null], [30, 30, null], [-40, -60, null], [0, -150, null], [-24, 24, null]]) {
      assert.equal(hasta(dx, dy), gesto, `(${dx}, ${dy})`)
    }
    // El hook, con eventos de mentira (sin DOM): los manejadores que lleva cada botón.
    const llamadas = []
    let dedo
    function Sonda() {
      dedo = useDedoSobreLaFlecha(() => llamadas.push('anterior'), () => llamadas.push('siguiente'))
      return null
    }
    renderToStaticMarkup(createElement(Sonda))
    const deslizar = (tipo, x0, x1, { id = 1, idFin = id, y1 = 100 } = {}) => {
      dedo.onPointerDown({ pointerType: tipo, pointerId: id, clientX: x0, clientY: 100 })
      dedo.onPointerUp({ pointerType: tipo, pointerId: idFin, clientX: x1, clientY: y1 })
      return llamadas.splice(0)
    }
    // El dedo: 30 px a la izquierda, «Siguiente»; a la derecha, «Anterior»; 10 px, nada (es el clic del botón); en
    // diagonal, nada; y un pointerup de otro dedo no cuenta.
    assert.deepEqual(deslizar('touch', 200, 170), ['siguiente'])
    assert.deepEqual(deslizar('touch', 200, 230), ['anterior'])
    assert.deepEqual(deslizar('touch', 200, 190), [])
    assert.deepEqual(deslizar('touch', 200, 150, { y1: 160 }), [])
    assert.deepEqual(deslizar('touch', 200, 150, { idFin: 2 }), [])
    // El mouse y el lápiz: nada (son un clic común; con el lápiz, el deslizamiento y el clic disparaban los dos).
    for (const tipo of ['mouse', 'pen']) {
      assert.deepEqual(deslizar(tipo, 200, 170), [], tipo)
      assert.deepEqual(deslizar(tipo, 200, 260), [], tipo)
    }
    // El lápiz que aprieta en una flecha y suelta fuera del botón (sin captura implícita, ese pointerup no llega) no
    // deja guardado dónde se apoyó: el pointerup siguiente sobre la otra flecha, sin haber apretado en ella, no hace
    // nada (antes, la fila se movía).
    dedo.onPointerDown({ pointerType: 'pen', pointerId: 2, clientX: 200, clientY: 100 })
    dedo.onPointerUp({ pointerType: 'pen', pointerId: 2, clientX: 80, clientY: 100 })
    assert.deepEqual(llamadas, [])
    // El dedo que la página se queda (pointercancel: el gesto vertical) tampoco cuenta.
    dedo.onPointerDown({ pointerType: 'touch', pointerId: 3, clientX: 200, clientY: 100 })
    dedo.onPointerCancel({ pointerType: 'touch', pointerId: 3 })
    dedo.onPointerUp({ pointerType: 'touch', pointerId: 3, clientX: 150, clientY: 100 })
    assert.deepEqual(llamadas, [])
  })

  test('ControlesCarrusel (los de los documentales de El Museo y, en Novedades, solo si una tarjeta no tiene foto): las clases de su fila, invisible hasta medir; con una tarjeta, nada', async () => {
    const ControlesCarrusel = (await vite.ssrLoadModule('/src/components/ControlesCarrusel.jsx')).default
    // Lo que da useCarrusel antes de medir (el estado inicial, el mismo en el servidor y en el navegador) y después.
    const sinMedir = { idFila: 'fila-x', aviso: '', anterior: () => {}, siguiente: () => {}, estado: { listo: false, desborda: false, actual: 1, alInicio: true, alFinal: false } }
    const textos = { anterior: 'Atrás', siguiente: 'Adelante' }
    const dibujar = (props) => renderToStaticMarkup(createElement(ControlesCarrusel, { textos, className: 'mt-6 flex justify-start', ...props }))
    const html = dibujar({ carrusel: sinMedir, total: 4 })
    assert.match(html, /^<div class="mt-6 flex justify-start invisible"><button type="button" aria-controls="fila-x" aria-disabled="true"[^>]*>[\s\S]*?<span class="sr-only">Atrás<\/span><\/button>/)
    assert.match(html, /<button type="button" aria-controls="fila-x" aria-disabled="false"[^>]*>[\s\S]*?<span class="sr-only">Adelante<\/span><\/button>/)
    // El contador: debajo de lg en un <span> (el espaciado de WCAG 1.4.12 suma margen a los párrafos y en un <p> el número
    // se subía 24 px: VA11-03); desde lg, el <p> de siempre (O1: desde lg no cambia nada), con las mismas clases. Los
    // dos con el mismo número, y el CSS muestra uno.
    const CONTADOR = 'min-w-11 text-center font-mono text-2xl leading-[1.2] font-medium text-blanco'
    assert.ok(html.includes(`<span aria-hidden="true" class="${CONTADOR} lg:hidden">1/4</span>`), html)
    assert.ok(html.includes(`<p aria-hidden="true" class="hidden ${CONTADOR} lg:block">1/4</p>`), html)
    assert.equal(cuantas(html, '<p aria-hidden'), 1)
    assert.equal(cuantas(html, '<span aria-hidden'), 1)
    // En el principio o en el final: debajo de lg solo la flecha queda tenue (el contorno del foco se ve entero:
    // VA11-04); desde lg, el botón entero, como siempre. Las mismas clases en los dos botones.
    const sinEntidades = html.replaceAll('&amp;', '&').replaceAll('&gt;', '>')
    const clasesBoton = clasesDe(sinEntidades, /<button type="button" aria-controls="fila-x" aria-disabled="true" class="([^"]*)"/)
    assert.deepEqual(clasesBoton.filter((c) => /opacity/.test(c)), [
      'max-lg:[&>svg]:transition-opacity',
      'lg:transition-opacity',
      'max-lg:aria-disabled:[&>svg]:opacity-35',
      'lg:aria-disabled:opacity-35',
    ])
    assert.deepEqual(clasesDe(sinEntidades, /<button type="button" aria-controls="fila-x" aria-disabled="false" class="([^"]*)"/), clasesBoton)
    assert.ok(html.includes('<p aria-live="polite" class="sr-only"></p>'))
    // Medido y con tarjetas que no entran: a la vista, con el contador y el aviso del hook.
    const medido = { ...sinMedir, aviso: 'Documental 2 de 4', estado: { listo: true, desborda: true, actual: 2, alInicio: false, alFinal: false } }
    const visible = dibujar({ carrusel: medido, total: 4 })
    assert.match(visible, /^<div class="mt-6 flex justify-start">/)
    assert.match(visible, />2\/4<\/span>/)
    assert.match(visible, />2\/4<\/p>/)
    assert.ok(visible.includes('<p aria-live="polite" class="sr-only">Documental 2 de 4</p>'))
    assert.equal(cuantas(visible, 'aria-disabled="true"'), 0)
    // Medido, pero entran todas: invisible (ocupa su lugar); con una sola tarjeta, nada.
    assert.match(dibujar({ carrusel: { ...medido, estado: { ...medido.estado, desborda: false } }, total: 4 }), /^<div class="mt-6 flex justify-start invisible">/)
    assert.equal(dibujar({ carrusel: sinMedir, total: 1 }), '')
  })

  test('toda imagen lazy del sitio lleva fetchPriority="low" (la convención del 05/11/2026; BCOD-02 del cierre)', () => {
    // Las páginas con datos (y la Home también sin novedades, con el Collage y las piedritas más arriba): una imagen que no
    // es del primer pantallazo va lazy y con prioridad baja; sin fetchPriority, Chrome le sube la prioridad a una lazy
    // que asoma (en una página corta, o en la Home sin novedades a 1920x1080) y compite con la foto del LCP.
    const muestras = [{ titulo: 'Una muestra', url: '/exposiciones/una', resumen: 'R', portada: fotoN(1), etiqueta: 'Actual', detalle: 'Hasta el 30 de noviembre de 2026' }]
    const salas = [{ nombre: 'Sala', ancla: 'sala-sala', resumen: 'R', descripcion: null, portada: fotoN(2), muestras: [{ titulo: 'Una muestra', url: '/exposiciones/una' }] }]
    const noticias = [{ titulo: 'Noticia', url: '/novedades/noticia', resumen: 'R', portada: fotoN(3), detalle: '3 de noviembre de 2026', fechaIso: '2026-11-03' }]
    const ficha = { titulo: 'Muestra', slug: 'muestra', resumen: null, situacion: 'Actual', fechas: null, sala: null, portada: fotoN(4), descripcion: null, galeria: [fotoN(5), fotoN(6)] }
    const paginas = {
      'home sin novedades': pagina({ pagina: 'home', museo: MUSEO_MAXIMO, datos: { novedades: [] } }),
      'home con seis': pagina({ pagina: 'home', museo: MUSEO_MAXIMO, datos: { novedades: [1, 2, 3, 4, 5, 6].map((n) => novedad(n)) } }),
      'el-museo': pagina({ pagina: 'el-museo', ruta: '/el-museo', museo: MUSEO_MAXIMO, datos: {} }),
      visitas: pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_MAXIMO, datos: { accesibilidad: null } }),
      divulgacion: pagina({ pagina: 'divulgacion', ruta: '/divulgacion', museo: MUSEO_MAXIMO, datos: { novedades: [1, 2].map((n) => novedad(n)) } }),
      educacion: pagina({ pagina: 'educacion', ruta: '/educacion', museo: MUSEO_MAXIMO, datos: {} }),
      circuitos: pagina({ pagina: 'circuitos', ruta: '/circuitos', museo: MUSEO_MAXIMO, datos: {} }),
      exposiciones: pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_MAXIMO, datos: { muestras, salas } }),
      novedades: pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_MAXIMO, datos: { proximas: [], noticias, pagina: 1, paginas: 1 } }),
      muestra: pagina({ pagina: 'muestra', ruta: '/exposiciones/muestra', museo: MUSEO_MAXIMO, datos: ficha }),
      contacto: pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_MAXIMO, datos: SIN_AVISOS }),
      'no-encontrada': pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_MAXIMO }),
    }
    for (const [nombre, html] of Object.entries(paginas)) {
      const lazy = (html.match(/<img [^>]*>/g) ?? []).filter((img) => img.includes('loading="lazy"'))
      assert.ok(lazy.length > 0, nombre)
      for (const img of lazy) assert.ok(img.includes('fetchPriority="low"'), `${nombre}: ${img.slice(0, 160)}`)
    }
  })

  test('el pie: desde lg, las secciones y las redes en una fila si entran y, si no, las redes enteras abajo, a la derecha (BDIS-01); debajo de md, cada lista en dos columnas; 16 entre bloques debajo de lg', () => {
    const html = delPie(pagina({ pagina: 'home', museo: MUSEO_MAXIMO, datos: { novedades: [] } }))
    assert.match(html, /<div class="mt-8 flex flex-col gap-x-12 gap-y-2 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">/)
    // Las dos listas: una grilla de dos columnas debajo de md (el pie de celular), cada una de 6,5rem como mínimo (si
    // dos no entran, con la letra del navegador agrandada, una: VMAR-03); desde md, envueltas en renglones como
    // siempre, y desde lg las redes contra el borde derecho.
    const LISTA_PIE = 'grid grid-cols-[repeat(auto-fit,minmax(max(6.5rem,calc(50%_-_0.8rem)),1fr))] gap-x-6 md:flex md:flex-wrap'
    assert.ok(html.includes(`<nav aria-label="${contenido.pie.secciones}" class="min-w-0"><ul class="${LISTA_PIE}"><li>`))
    assert.ok(html.includes(`<ul aria-label="${contenido.pie.redes}" class="min-w-0 ${LISTA_PIE} lg:ml-auto"><li>`))
    assert.equal(cuantas(html, 'grid-cols-2'), 0)
    assert.equal(cuantas(html, 'class="flex flex-wrap gap-x-6"') + cuantas(html, 'class="flex min-w-0 flex-wrap gap-x-6 lg:ml-auto"'), 0)
    // El pie del cuadro de celular: 16 entre el bloque de la marca con el © y los logos (desde lg, en una fila con 32),
    // y el © sin una palabra sola en el último renglón.
    assert.match(html, /<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8"><div class="flex flex-col items-start gap-4"><img /)
    assert.match(html, /<p class="text-xs leading-4 text-muted text-pretty">© 2026 MUPA - Museo Paleontológico de San Juan<\/p>/)
    // Sin redes (el museo vacío), la lista de las secciones sola, igual.
    const sinRedes = delPie(pagina({ pagina: 'home', museo: MUSEO_VACIO, datos: { novedades: [] } }))
    assert.equal(cuantas(sinRedes, LISTA_PIE), 1)
    assert.equal(cuantas(html, LISTA_PIE), 2)
  })

  test('el logo del header: en el celular, la marca de 80, la línea de 41 y los isotipos de 32, con 24 entre piezas; desde sm, lo del tablero; con menos de 20rem de ancho, solo la marca (CIR-02)', () => {
    const html = sinDialogo(delHeader(pagina({ pagina: 'home', museo: MUSEO_VACIO, datos: { novedades: [] } })))
    // El bloque: 24 entre piezas en todos los anchos.
    assert.match(html, /<div class="flex min-w-0 items-center gap-6"><a href="\/"/)
    // La marca: 80 de ancho con su alto (26,5) en el celular y 120x40 desde sm.
    assert.match(html, /<img [^>]*alt="MuPa - Museo Paleontológico de San Juan" width="120" height="40" class="block h-auto w-20 sm:h-10 sm:w-30"/)
    // La línea (41 de alto en todos los anchos) y los isotipos (32; 40 desde sm). Con la letra del navegador agrandada,
    // debajo de 20rem de ancho no entran con el ícono del menú y no van: siguen en el pie.
    assert.match(html, /<span aria-hidden="true" class="-mr-px h-\[2\.5625rem\] shrink-0 border-l border-blanco max-\[20rem\]:hidden"><\/span>/)
    assert.match(html, /<ul aria-label="[^"]*" class="flex shrink-0 items-center gap-6 max-\[20rem\]:hidden">/)
    assert.equal(cuantas(html, 'class="block size-8 sm:size-10"'), contenido.site.logo.isotipos.length)
    // Nada de las medidas de antes: la marca de 96x32, la línea de 32, 12 entre piezas, el corte de 19,5rem.
    for (const no of ['h-8', 'w-24', 'gap-3', '19.5rem', 'sm:h-[2.5625rem]', 'sm:gap-6']) assert.equal(cuantas(html, no), 0, no)
    // El del menú abierto, el mismo (sobre el fondo del sitio: con data-logo-blanco).
    const dialogo = /<dialog[\s\S]*?<\/dialog>/.exec(pagina({ pagina: 'home', museo: MUSEO_VACIO, datos: { novedades: [] } }))[0]
    assert.match(dialogo, /<img [^>]*alt="MuPa - Museo Paleontológico de San Juan" width="120" height="40" data-logo-blanco="" class="block h-auto w-20 sm:h-10 sm:w-30"/)
    assert.match(dialogo, /<ul aria-label="[^"]*" class="flex shrink-0 items-center gap-6 max-\[20rem\]:hidden">/)
    // En el pie siguen los logos de las instituciones, enteros.
    const pie = delPie(pagina({ pagina: 'home', museo: MUSEO_VACIO, datos: { novedades: [] } }))
    assert.equal(cuantas(pie, 'class="h-[2.625rem] w-auto"'), contenido.pie.instituciones.length)
  })

  // --- El marco de celular (Figma "Web Mobile", 10/11/2026; decisiones M1 a M5 y O2 del desarrollador): la barra de
  // hoy, el header con el ícono del menú, el menú abierto y el lugar que le deja cada página. ---

  /** La Home con el museo máximo y el dato de la barra de hoy, que resuelve el servidor (server/ssr.js); acá, a mano. */
  const conBarra = (abiertoHoy) => pagina({ pagina: 'home', museo: MUSEO_MAXIMO, datos: { novedades: [] }, abiertoHoy })
  /** Las barras de hoy de un pedazo de HTML, cada una entera (no tienen otro <div> adentro). */
  const barras = (html) => html.match(/<div data-hoy="[^"]*"[^>]*>.*?<\/div>/g) ?? []
  /** El <dialog> del menú de debajo de xl. */
  const dialogoDe = (html) => /<dialog[\s\S]*?<\/dialog>/.exec(html)[0]

  test('la barra de hoy (M3): "abierto" o "cerrado" según estado.abiertoHoy, con "Horarios" a la tarjeta de Visitas; sin el dato, no está', () => {
    const { barraHoy } = contenido
    for (const [abiertoHoy, palabra, texto, punto] of [
      [true, 'abierto', barraHoy.abierto, 'text-verde-claro'],
      [false, 'cerrado', barraHoy.cerrado, 'text-bordo'],
    ]) {
      const html = conBarra(abiertoHoy)
      // Dos veces e iguales: en el header y adentro del menú (que, abierto, tapa la del header). En ningún otro lado.
      const todas = barras(html)
      assert.equal(todas.length, 2, palabra)
      assert.equal(todas[0], todas[1])
      assert.equal(barras(sinDialogo(delHeader(html))).length, 1)
      assert.equal(barras(dialogoDe(html)).length, 1)
      assert.equal(cuantas(delMain(html), 'data-hoy') + cuantas(delPie(html), 'data-hoy'), 0)
      const barra = todas[0]
      assert.ok(barra.startsWith(`<div data-hoy="${palabra}" class="`), barra.slice(0, 80))
      // Va en el HTML en todos los anchos: solo se ve debajo de lg, y nunca al imprimir. Negra, de 40 como mínimo.
      const clases = clasesDe(barra, /^<div data-hoy="[^"]*" class="([^"]*)"/)
      for (const c of ['lg:hidden', 'print:hidden', 'bg-ink', 'min-h-10', 'max-[22rem]:min-h-12', 'px-6', 'md:px-10']) assert.ok(clases.includes(c), `${c} en ${clases.join(' ')}`)
      // El estado: texto común (no una región viva: no cambia con la página abierta), con el punto decorado. En un
      // <span>, no en un párrafo: el espaciado de texto de WCAG 1.4.12 les suma margen a los párrafos y la barra crecía.
      assert.match(
        barra,
        new RegExp(
          `<span class="[^"]*text-xs[^"]*text-paper[^"]*"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" class="[^"]*${punto}"><circle [^>]*></circle><circle [^>]*></circle></svg>${texto}</span>`,
        ),
      )
      assert.doesNotMatch(barra, /<p[ >]/)
      // Sin ids (va dos veces) ni roles.
      for (const no of ['role=', 'aria-live', ' id=']) assert.equal(cuantas(barra, no), 0, no)
      // "Horarios": a la tarjeta Horarios de Visitas, de 44 de alto para el dedo, con la flecha de 12 decorada.
      assert.match(
        barra,
        new RegExp(
          `<a href="/visitas#visitas-horarios" class="[^"]*min-h-11[^"]*font-mono[^"]*">${barraHoy.horarios}<svg [^>]*aria-hidden="true"[^>]*class="shrink-0 size-3"><path [^>]*></path></svg></a></div>$`,
        ),
      )
      // Sus 44 arrancan en el borde de arriba de la barra y sobresalen 4 px abajo, encima de la fila del logo (z-10), con
      // el texto centrado en los 40 de la barra (pb-1); 6 de aire a los costados que no corren el texto, así el
      // contorno del foco no pisa la «H» ni la flecha (VMAR-02, VMAR-01 y VA11-01).
      const enlace = clasesDe(barra, /<a href="\/visitas#visitas-horarios" class="([^"]*)"/)
      for (const c of ['relative', 'z-10', '-mx-1.5', 'px-1.5', '-mb-1', 'pb-1', 'min-h-11', 'focus-visible:-outline-offset-2']) assert.ok(enlace.includes(c), `${c} en ${enlace.join(' ')}`)
      assert.ok(!enlace.some((c) => /^-?my-/.test(c)), enlace.join(' '))
      assert.equal(cuantas(html, texto), 2)
      assert.equal(cuantas(html, 'href="/visitas#visitas-horarios"'), 2)
    }
    assert.equal(cuantas(conBarra(true), barraHoy.cerrado) + cuantas(conBarra(false), barraHoy.abierto), 0)
    // Entre "abierto" y "cerrado" cambian solo la palabra y el color del punto.
    const igualado = (html) => html.replaceAll('abierto', 'cerrado').replaceAll('text-verde-claro', 'text-bordo')
    assert.equal(igualado(conBarra(true)), igualado(conBarra(false)))
    // Sin el dato (null: el horario sin cargar; o un estado sin la clave), sin barra ni enlace; lo que no es true ni
    // false tampoco la dibuja (el componente no calcula ni adivina nada).
    for (const nada of [null, undefined, 'abierto', 'true', 1, 0]) {
      const html = conBarra(nada)
      assert.equal(cuantas(html, 'data-hoy'), 0, String(nada))
      assert.equal(cuantas(html, 'visitas-horarios'), 0, String(nada))
      assert.equal(cuantas(html, barraHoy.abierto) + cuantas(html, barraHoy.cerrado), 0, String(nada))
    }
    // Sin barra, el resto de la página es el mismo.
    assert.equal(conBarra(false).replace(/<div data-hoy="[^"]*"[^>]*>.*?<\/div>/g, ''), conBarra(null))
    // "Ir al contenido" sigue siendo lo primero del header; después la barra, la marca y el botón del menú.
    const header = sinDialogo(delHeader(conBarra(false)))
    const orden = ['href="#main"', 'data-hoy="cerrado"', 'alt="MuPa - Museo Paleontológico de San Juan"', 'aria-controls="menu-movil"'].map((t) => header.indexOf(t))
    assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    assert.match(delHeader(conBarra(false)), /^<header class="absolute inset-x-0 top-0 z-40"><a href="#main"/)
    // En todas las páginas (también en la 404 y en una interna), con el mismo enlace.
    const visitas = pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_MAXIMO, datos: { accesibilidad: null }, abiertoHoy: true })
    const noEncontrada = pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_MAXIMO, abiertoHoy: false })
    for (const html of [visitas, noEncontrada]) {
      assert.equal(barras(html).length, 2)
      assert.equal(cuantas(html, 'href="/visitas#visitas-horarios"'), 2)
    }
    // En Visitas, la tarjeta Horarios lleva el id adonde apunta el enlace de la barra (los dos lo escriben a mano:
    // acá se atan), una sola vez, con aire arriba al llegar.
    const ancla = /<a href="\/visitas#([^"]+)"/.exec(barras(visitas)[0])[1]
    assert.equal(cuantas(visitas, `id="${ancla}"`), 1)
    assert.ok(delMain(visitas).includes(`<li id="${ancla}" class="flex min-w-0 scroll-mt-6 `))
    assert.match(delMain(visitas), /<li id="visitas-horarios" class="flex min-w-0 scroll-mt-6 flex-col gap-5 [^"]*"><div class="flex items-center gap-4"><span [^>]*><svg [\s\S]*?<\/svg><\/span><h3 [^>]*>Horarios<\/h3>/)
    // Las otras tarjetas, sin id; sin horario cargado no hay tarjeta Horarios (ni barra que lleve a ella).
    assert.equal(cuantas(delMain(visitas), '<li id='), 1)
    assert.equal(cuantas(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } }), 'visitas-horarios'), 0)
    // Sin la página de Visitas, la barra va sin el enlace.
    const paginaDeVisitas = tabla.PAGINAS.visitas
    try {
      delete tabla.PAGINAS.visitas
      const sinVisitas = barras(conBarra(false))
      assert.equal(sinVisitas.length, 2)
      for (const barra of sinVisitas) {
        assert.equal(cuantas(barra, '<a '), 0)
        assert.ok(barra.includes(`${barraHoy.cerrado}</span></div>`))
      }
    } finally {
      tabla.PAGINAS.visitas = paginaDeVisitas
    }
  })

  test('el header de celular: la fila de 73 (16 de padding debajo de lg) y los botones del menú como íconos con su nombre; sin JavaScript, el botón no se ve', () => {
    const html = conBarra(false)
    const header = sinDialogo(delHeader(html))
    // La fila: 16 arriba y abajo en todo el tramo de debajo de lg (con el logo de 41 mide 73: con la barra de 40, los
    // 113 del marco); desde lg, lo de siempre (128 de alto, sin padding vertical).
    const fila = clasesDe(header, /<div class="(mx-auto flex max-w-tablero [^"]*)"/)
    for (const c of ['py-4', 'px-6', 'md:px-10', 'lg:h-32', 'lg:px-16', 'lg:py-0']) assert.ok(fila.includes(c), `${c} en ${fila.join(' ')}`)
    for (const c of ['py-6', 'md:py-8']) assert.ok(!fila.includes(c), `${c} en ${fila.join(' ')}`)
    // El botón: solo el ícono, con "Menú" como nombre accesible; un bloque flexible de 44x44 (en línea, apoyado en la
    // línea de base del renglón, la fila medía 79 y no 73).
    const boton = /<button type="button" aria-label="([^"]*)" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-movil" class="([^"]*)">(.*?)<\/button>/.exec(header)
    assert.ok(boton, 'el botón del menú')
    assert.equal(boton[1], contenido.navegacion.abrir)
    const clasesBoton = boton[2].split(' ')
    for (const c of ['flex', 'size-11', '-m-0.5', 'text-blanco', 'focus-visible:outline-2']) assert.ok(clasesBoton.includes(c), `${c} en ${boton[2]}`)
    assert.ok(!clasesBoton.includes('inline-flex'), boton[2])
    // Con colores forzados, el fondo de botón del sistema: sin él, con un tema claro el ícono (del color del texto del
    // sistema) quedaba negro sobre la foto oscura de un hero y casi no se veía. Es el único fondo del botón: en el
    // modo normal va sin fondo, sobre la foto; con el puntero encima, un fondo blanco tenue (el hover sutil de D8:
    // VMAR-04), con su transición, que no corre con reduced-motion.
    assert.deepEqual(clasesBoton.filter((c) => c.split(':').at(-1).startsWith('bg-')), ['hover:bg-blanco/10', 'forced-colors:bg-[ButtonFace]'], boton[2])
    for (const c of ['transition-colors', 'motion-reduce:transition-none']) assert.ok(clasesBoton.includes(c), `${c} en ${boton[2]}`)
    assert.match(boton[3], /^<svg viewBox="0 0 40 40" [^>]*aria-hidden="true"[^>]*class="shrink-0 size-10"><path d="M5 10h30M5 20h30M5 30h30"><\/path><\/svg>$/)
    // Sin JavaScript no se ve (no abriría nada); desde xl tampoco (ahí está el menú ancho).
    assert.ok(header.includes('<div class="xl:hidden noscript:hidden"><button '))
    // La cruz del menú abierto: igual, con "Cerrar" como nombre.
    const dialogo = dialogoDe(html)
    const cruz = /<button type="button" aria-label="([^"]*)" class="([^"]*)">(.*?)<\/button>/.exec(dialogo)
    assert.ok(cruz, 'la cruz')
    assert.equal(cruz[1], contenido.navegacion.cerrar)
    assert.equal(cruz[2], boton[2])
    assert.match(cruz[3], /^<svg viewBox="0 0 40 40" [^>]*aria-hidden="true"[^>]*class="shrink-0 size-10"><path d="M30 10 10 30M10 10l20 20"><\/path><\/svg>$/)
    // Son los dos únicos botones del header, y ninguno tiene texto a la vista (ni "Menú" ni "Cerrar").
    const botones = delHeader(html).match(/<button [^>]*>.*?<\/button>/g)
    assert.equal(botones.length, 2)
    for (const b of botones) assert.match(b, /^<button [^>]*aria-label="[^"]+"[^>]*><svg [^>]*>.*?<\/svg><\/button>$/)
    for (const texto of [contenido.navegacion.abrir, contenido.navegacion.cerrar]) assert.equal(cuantas(delHeader(html), `>${texto}<`), 0, texto)
    // La fila de arriba del menú abierto es la del header: la cruz queda donde estaban las tres líneas.
    assert.deepEqual(
      clasesDe(dialogo, /<div class="(flex items-center justify-between [^"]*)"/),
      fila.filter((c) => !['mx-auto', 'max-w-tablero'].includes(c)),
    )
  })

  test('el menú abierto (O2): la barra y la fila arriba; los renglones del cuadro, con la línea desde el segundo; la sección actual; "Tickets" a todo el ancho, solo con la compra', () => {
    const { navegacion } = contenido
    const d = dialogoDe(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_MAXIMO, datos: { accesibilidad: null }, abiertoHoy: true }))
    // Arriba, la barra de hoy; después la fila con el logo y la cruz; después la lista.
    const orden = ['data-hoy="abierto"', `aria-label="${navegacion.cerrar}"`, `<nav aria-label="${navegacion.etiqueta}"`].map((t) => d.indexOf(t))
    assert.ok(orden.every((i, n) => i >= 0 && (n === 0 || i > orden[n - 1])), orden.join(', '))
    // 48 arriba y abajo de la lista, que desde md tiene el tope de 354 del cuadro.
    assert.match(d, /<nav aria-label="[^"]*" class="px-6 py-12 md:px-10 lg:px-16"><div class="md:max-w-\[22\.125rem\]"><ul><li>/)
    // Los renglones: las cinco secciones en orden; el primero sin línea y los demás con la línea arriba.
    const renglones = [...d.matchAll(/<li( class="([^"]*)")?><a href="([^"]*)"( aria-current="([^"]*)")? class="([^"]*)">(.*?)<\/a><\/li>/g)]
    assert.deepEqual(renglones.map((m) => m[3]), navegacion.menu.map((s) => s.ruta))
    assert.equal(renglones[0][2], undefined)
    for (const m of renglones.slice(1)) assert.deepEqual(m[2].split(' '), ['mt-1', 'border-t', 'border-blanco', 'pt-[0.1875rem]'], m[3])
    // Cada enlace: el renglón entero, de 65, en Roboto Mono Regular 16/28,8 blanca, con el foco por dentro y 8 de aire a
    // cada lado que no corren el texto (el margen negativo): así el contorno no pisa la primera letra (VMAR-01).
    for (const m of renglones) {
      const clases = m[6].split(' ')
      assert.ok(!clases.includes('w-full'), m[6])
      for (const c of ['flex', '-mx-2', 'w-[calc(100%+1rem)]', 'px-2', 'min-h-[4.0625rem]', 'font-mono', 'text-base', 'leading-[1.8]', 'font-normal', 'text-blanco', 'wrap-anywhere', 'focus-visible:-outline-offset-2']) {
        assert.ok(clases.includes(c), `${c} en ${m[6]}`)
      }
      assert.ok(!clases.some((c) => /clamp|vw|inline/.test(c)), m[6])
    }
    // La sección de la página: aria-current en el enlace y el subrayado naranja en el texto; las demás, el texto solo.
    const actual = renglones.find((m) => m[3] === '/visitas')
    assert.equal(actual[5], 'page')
    assert.equal(actual[7], '<span class="underline decoration-naranja decoration-2 underline-offset-[0.4em]">Visitas</span>')
    for (const m of renglones.filter((x) => x !== actual)) {
      assert.equal(m[5], undefined, m[3])
      assert.equal(m[7], navegacion.menu.find((s) => s.ruta === m[3]).texto)
    }
    // "Tickets": 4 debajo del último renglón y a todo el ancho, con el texto oscuro (D4) y data-entradas.
    const tickets = /<\/li><\/ul><a href="https:\/\/example\.com\/entradas" data-entradas="" class="([^"]*)">([^<]*)<\/a><\/div><\/nav>/.exec(d)
    assert.ok(tickets, 'el botón de entradas')
    assert.equal(tickets[2], navegacion.entradas)
    const clasesTickets = tickets[1].split(' ')
    for (const c of ['mt-1', 'w-full', 'min-h-11', 'bg-naranja', 'text-ink']) assert.ok(clasesTickets.includes(c), `${c} en ${tickets[1]}`)
    for (const c of ['mt-10', 'text-blanco']) assert.ok(!clasesTickets.includes(c), `${c} en ${tickets[1]}`)
    // Sin la compra, sin el botón (la lista cierra el bloque); sin horario, sin barra.
    const sinNada = dialogoDe(pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } }))
    assert.equal(cuantas(sinNada, 'data-entradas'), 0)
    assert.match(sinNada, /<\/li><\/ul><\/div><\/nav>/)
    assert.equal(cuantas(sinNada, 'data-hoy'), 0)
    // Nunca el selector de idioma ni los textos con errata del cuadro.
    for (const no of ['Es (Arg)', 'Tikets', 'Producción']) assert.equal(cuantas(d, no) + cuantas(sinNada, no), 0, no)
    // Dentro de una sección ("true"), el mismo subrayado.
    const dentro = dialogoDe(renderToStaticMarkup(createElement(Header, { ruta: '/visitas/algo', compra: null })))
    assert.match(dentro, /<a href="\/visitas" aria-current="true" class="[^"]*"><span class="underline decoration-naranja [^"]*">Visitas<\/span><\/a>/)
  })

  test('el lugar del marco de celular: debajo de lg, 10,0625rem (los 113 del marco y 48 de aire) en la Home, los hero, las fichas y la 404; desde lg, lo de siempre', () => {
    const ficha = { titulo: 'Muestra', slug: 'muestra', resumen: null, situacion: 'Actual', fechas: null, sala: null, portada: null, descripcion: null, galeria: [] }
    const delHero = /<div class="(relative mx-auto [^"]*max-w-tablero [^"]*)"/
    // Cada caso: el HTML, dónde está el bloque que deja el lugar y su padding de arriba desde lg.
    const casos = {
      'la Home': [home(), delHero, 'lg:pt-52'],
      'un hero sin bajada (Visitas)': [pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } }), delHero, 'lg:pt-52'],
      'un hero con bajada (Divulgación)': [divulgacionCon(), delHero, 'lg:pt-[10.5rem]'],
      'un hero con la bajada justa (Circuitos)': [circuitosCon(), delHero, 'lg:pt-[10.5rem]'],
      'una ficha': [pagina({ pagina: 'muestra', ruta: '/exposiciones/muestra', museo: MUSEO_VACIO, datos: ficha }), /<article class="(mx-auto w-full max-w-tablero [^"]*)"/, 'lg:pt-52'],
      'la 404': [pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_VACIO }), /<main id="main" tabindex="-1" class="grow"><div class="(mx-auto w-full max-w-tablero [^"]*)"/, 'lg:pt-52'],
    }
    for (const [nombre, [html, expresion, desdeLg]] of Object.entries(casos)) {
      const clases = clasesDe(delMain(html), expresion)
      // Todo lo que pone padding arriba: la reserva de celular de base y la de escritorio con su lg:. Nada en md.
      const arriba = clases.filter((c) => c.split(':').at(-1).startsWith('pt-'))
      assert.deepEqual(arriba, ['pt-[10.0625rem]', desdeLg], `${nombre}: ${clases.join(' ')}`)
    }
  })

  test('el hero de las ocho páginas internas en el celular (O8): la caja de 350 con el texto abajo debajo de 32rem y arriba desde ahí, el degradé del cuadro y la posición de celular de la foto solo donde hace falta', () => {
    const c = contenido
    const casos = [
      ['el-museo-titulo', elMuseoCon(), c.elMuseo.hero, '62% 60%'],
      ['visitas-titulo', pagina({ pagina: 'visitas', ruta: '/visitas', museo: MUSEO_VACIO, datos: { accesibilidad: null } }), c.visitas.hero, undefined],
      ['divulgacion-titulo', divulgacionCon(), c.divulgacion.hero, undefined],
      ['educacion-titulo', educacionCon(), c.educacion.hero, '25% 90%'],
      ['circuitos-titulo', circuitosCon(), c.circuitos.hero, undefined],
      ['exposiciones-titulo', pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras: [], salas: [] } }), c.paginas.exposiciones, undefined],
      ['novedades-titulo', pagina({ pagina: 'novedades', ruta: '/novedades', museo: MUSEO_VACIO, datos: { proximas: [], noticias: [], pagina: 1, paginas: 1 } }), c.paginas.novedades, undefined],
      ['contacto-titulo', pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_VACIO, datos: { ...SIN_AVISOS, formulario: false } }), c.contacto, '100% 88%'],
    ]
    assert.equal(casos.length, 8)
    for (const [id, html, hero, posicionMovil] of casos) {
      const main = delMain(html)
      comprobarHero(main, id, hero.titulo, hero.imagen)
      assert.equal(hero.imagen.posicionMovil, posicionMovil, id)
      // La foto y su precarga no cambian con el celular: la misma, 3:1, con el sizes de siempre.
      assert.equal(hero.imagen.sizes, '(min-width: 64rem) max(100vw, 1440px), max(100vw, 960px)', id)
      assert.equal(hero.imagen.ancho / hero.imagen.alto, 3, id)
      // Un solo hero por página, y es lo primero del <main>.
      assert.equal(cuantas(main, CAJA_HERO_PAGINA), 1, id)
      assert.ok(main.replace(/^<main[^>]*>/, '').startsWith(`<section aria-labelledby="${id}" class="relative">`), id)
    }
    // Las fichas y la 404 van sin hero (R2): ni la caja ni el degradé.
    const ficha = { titulo: 'Muestra', slug: 'muestra', resumen: null, situacion: 'Actual', fechas: null, sala: null, portada: null, descripcion: null, galeria: [] }
    const sinHero = [
      pagina({ pagina: 'muestra', ruta: '/exposiciones/muestra', museo: MUSEO_VACIO, datos: ficha }),
      pagina({ pagina: 'no-encontrada', ruta: '/no-existe', museo: MUSEO_VACIO }),
    ]
    for (const html of sinHero) {
      assert.equal(cuantas(delMain(html), 'min-h-[21.875rem]'), 0)
      assert.equal(cuantas(delMain(html), 'linear-gradient'), 0)
    }
  })

  test('HeroPagina: la posición de celular de la foto va como variable en el style y una clase la usa debajo de 32rem; sin ella, el <img> de siempre', async () => {
    const { default: HeroPagina } = await vite.ssrLoadModule('/src/components/HeroPagina.jsx')
    const imagen = { src: '/a-1440.webp', srcSet: '/a-960.webp 960w, /a-1440.webp 1440w', sizes: '100vw', ancho: 2880, alto: 960, alt: 'Una foto' }
    const img = (extra, props = {}) =>
      /<img [^>]*>/.exec(renderToStaticMarkup(createElement(HeroPagina, { id: 'x', titulo: 'Título', imagen: { ...imagen, ...extra }, ...props })))[0]
    const FOTO = 'class="absolute inset-0 size-full object-cover"'
    // Sin ninguna posición: sin style (centrada). Con el punto de interés solo: el object-position en línea.
    assert.ok(img({}).endsWith(`fetchPriority="high" ${FOTO}/>`), img({}))
    assert.ok(img({ posicion: '50% 80%' }).endsWith(`fetchPriority="high" ${FOTO} style="object-position:50% 80%"/>`), img({ posicion: '50% 80%' }))
    // Con la de celular: la variable después del object-position y la clase que la usa debajo de 32rem, con el ! final
    // (important: le tiene que ganar al estilo en línea).
    const conMovil = img({ posicion: '50% 60%', posicionMovil: '62% 60%' })
    assert.ok(
      conMovil.endsWith(
        'fetchPriority="high" class="absolute inset-0 size-full object-cover max-[32rem]:object-(--posicion-movil)!" style="object-position:50% 60%;--posicion-movil:62% 60%"/>',
      ),
      conMovil,
    )
    // Solo la de celular (sin punto de interés de escritorio): la variable sola.
    const soloMovil = img({ posicionMovil: '62% 60%' })
    assert.ok(soloMovil.endsWith('max-[32rem]:object-(--posicion-movil)!" style="--posicion-movil:62% 60%"/>'), soloMovil)
    // La foto no depende del texto: con bajada, el mismo <img>.
    assert.equal(img({ posicion: '50% 60%', posicionMovil: '62% 60%' }, { bajada: 'Una bajada' }), conMovil)
    assert.equal(img({ posicion: '50% 80%' }, { bajada: 'Una bajada', bajadaJusta: true }), img({ posicion: '50% 80%' }))
  })

  test('el rótulo a 16 del h2 debajo de lg y a 24 desde lg (el cuadro de celular): Seccion y los h2 con rótulo escritos a mano; con cerca, a 16 en todos los anchos', async () => {
    const { default: Seccion } = await vite.ssrLoadModule('/src/components/Seccion.jsx')
    const h2 = (props) =>
      clasesDe(renderToStaticMarkup(createElement(Seccion, { id: 'x', titulo: 'X', ...props }, 'adentro')), /<h2 id="x" class="([^"]*)"/)
    assert.deepEqual(margenesDeArriba(h2({ rotulo: 'Rótulo' })), ['mt-4', 'lg:mt-6'])
    assert.deepEqual(margenesDeArriba(h2({ rotulo: 'Rótulo', cerca: true })), ['mt-4'])
    // Sin rótulo no hay nada arriba del h2: sin margen, con cerca o sin ella.
    assert.deepEqual(margenesDeArriba(h2({})), [])
    assert.deepEqual(margenesDeArriba(h2({ cerca: true })), [])
    // Los que no pasan por Seccion.jsx: los dos de Visitas, los dos de Contacto y el del bloque de texto y foto
    // (Divulgación, Educación y Circuitos).
    const visitas = delMain(pagina({ pagina: 'visitas', ruta: '/visitas', museo: museoComun(MUSEO_MAXIMO), datos: { accesibilidad: null } }))
    const contacto = delMain(pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_MAXIMO, datos: SIN_AVISOS }))
    const aMano = {
      'visitas-practica': visitas,
      'visitas-accesible': visitas,
      'datos-contacto': contacto,
      'formulario-titulo': contacto,
      [contenido.divulgacion.bloques[0].id]: delMain(divulgacionCon()),
      'educacion-visitas': delMain(educacionCon()),
      [`circuito-${contenido.circuitos.destinos[0].slug}`]: delMain(circuitosCon()),
    }
    assert.equal(Object.keys(aMano).length, 7)
    for (const [id, main] of Object.entries(aMano)) {
      const clases = clasesDe(main, new RegExp(`<p class="font-mono text-sm leading-5 font-medium text-paper uppercase">[^<]*</p><h2 id="${id}" class="([^"]*)"`))
      assert.deepEqual(margenesDeArriba(clases), ['mt-4', 'lg:mt-6'], id)
    }
  })

  test('el h2 de las secciones (TITULO_SECCION): 36/48 debajo de 32rem (el cuadro de celular) y 64 con el interlineado de 1,24 desde ahí', async () => {
    const tablero = await vite.ssrLoadModule('/src/components/tablero.js')
    assert.equal(
      tablero.TITULO_SECCION,
      'font-titulo text-[2.25rem] leading-12 font-thin text-paper hyphens-auto wrap-break-word min-[32rem]:text-[4rem] min-[32rem]:leading-[1.24]',
    )
    // En las páginas: cada h2 de sección con un solo tamaño y un solo interlineado por tramo (el de 1,24 ya no va de
    // base: debajo de 32rem pisaría los 48 px del cuadro).
    const paginas = {
      home: home([novedad(1)]),
      visitas: pagina({ pagina: 'visitas', ruta: '/visitas', museo: museoComun(MUSEO_MAXIMO), datos: { accesibilidad: null } }),
      divulgacion: divulgacionCon(),
      educacion: educacionCon(),
      circuitos: circuitosCon(),
      elMuseo: elMuseoCon(),
      contacto: pagina({ pagina: 'contacto', ruta: '/contacto', museo: MUSEO_MAXIMO, datos: SIN_AVISOS }),
    }
    let vistos = 0
    for (const [nombre, html] of Object.entries(paginas)) {
      for (const [, clase] of delMain(html).matchAll(/<h2 id="[^"]*" class="(font-titulo [^"]*)"/g)) {
        const clases = clase.split(' ')
        assert.deepEqual(clases.filter((c) => /(^|:)leading-/.test(c)), ['leading-12', 'min-[32rem]:leading-[1.24]'], `${nombre}: ${clase}`)
        assert.deepEqual(clases.filter((c) => /(^|:)text-\[/.test(c)), ['text-[2.25rem]', 'min-[32rem]:text-[4rem]'], `${nombre}: ${clase}`)
        vistos++
      }
    }
    assert.ok(vistos >= 20, `h2 de sección vistos: ${vistos}`)
  })

  test('las viñetas de las listas del tablero se ven con colores forzados (EDU-01, CIR-01 y MUS-03)', () => {
    for (const html of [pagina({ pagina: 'educacion', ruta: '/educacion', museo: MUSEO_VACIO, datos: {} }), pagina({ pagina: 'el-museo', ruta: '/el-museo', museo: MUSEO_VACIO, datos: {} })]) {
      // En el HTML la clase va escapada (&amp;&gt;).
      const listas = [...delMain(html).matchAll(/<ul class="([^"]*\[&amp;&gt;li\]:before:bg-paper[^"]*)"/g)].map((m) => m[1].split(' '))
      assert.ok(listas.length > 0)
      for (const clases of listas) assert.ok(clases.includes('forced-colors:[&amp;&gt;li]:before:bg-[CanvasText]'), clases.join(' '))
    }
  })

  test('"En esta sala": de una última palabra de más de 8 letras, solo las 4 últimas van pegadas a la flecha (VR1-01)', () => {
    const salas = [
      {
        nombre: 'Sala',
        ancla: 'sala-sala',
        resumen: null,
        descripcion: null,
        portada: null,
        muestras: [
          { titulo: 'Ciencia interdisciplinariamente', url: '/exposiciones/a' },
          { titulo: 'Huellas del Triásico', url: '/exposiciones/b' },
        ],
      },
    ]
    const main = delMain(pagina({ pagina: 'exposiciones', ruta: '/exposiciones', museo: MUSEO_VACIO, datos: { muestras: [], salas } }))
    assert.match(main, /<span class="min-w-0 wrap-anywhere">Ciencia interdisciplinariam<span class="whitespace-nowrap">ente<svg /)
    assert.match(main, /<span class="min-w-0 wrap-anywhere">Huellas del <span class="whitespace-nowrap">Triásico<svg /)
  })

  // ——— La audioguía (src/paginas/Audioguia.jsx; especificación de las audioguías, versión 2, 5 y 9.3) ———
  // Los datos, armados como los arma el servidor (datosDeLaPagina de server/audioguia/rutas.js) sobre un recorrido de
  // los 13 grupos del guion (1.2.1: Recepción al principio y al final), con títulos de prueba.
  const GRUPOS_DE_PRUEBA = [
    ['recepcion', 'RECEPCIÓN', null, null, [1]],
    ['sala-1', 'SALA 1', 'EL CICLO DE LA VIDA', 'Empecemos desde cero', [2, 3, 4, 5]],
    ['sala-2', 'SALA 2', 'ISCHIGUALASTO', 'El origen de los dinosaurios', [6, 7, 8, 9, 10, 11, 12, 13]],
    ['sala-3', 'SALA 3', 'EL LABORATORIO', 'Donde los fósiles se transforman en conocimiento', [14]],
    ['sala-4', 'SALA 4', 'LA CAMPAÑA', 'Tras las huellas del pasado', [15]],
    ['sala-5', 'SALA 5', 'GEOLOGÍA', 'La historia escrita en rocas', [16, 17, 18]],
    ['sala-6', 'SALA 6', 'PALEOBOTÁNICA', 'Las plantas nos cuentan el pasado', [19, 20, 21, 22, 23]],
    ['sala-7', 'SALA 7', 'UN VIAJE AL TRIÁSICO', 'El fin de un mundo, el inicio de otro', [24, 25, 26, 27]],
    ['jardin-triasico', 'JARDÍN TRIÁSICO', null, 'Paisaje vivo', [28]],
    ['sala-educativa', 'PLAZA INTERACTIVA', null, 'Aprender jugando', [29]],
    ['sala-8', 'SALA GIGANTISMO', 'GIGANTISMO', 'La grandeza del pasado', [30, 31, 32, 33]],
    ['sala-inmersiva', 'SALA INMERSIVA', null, 'La memoria del tiempo', [34]],
    ['recepcion', 'RECEPCIÓN', null, null, [35]],
  ]
  const dos = (n) => String(n).padStart(2, '0')
  const audioguiaDePrueba = () => {
    const vistas = new Set()
    const estaciones = new Map()
    const grupos = GRUPOS_DE_PRUEBA.map(([espacio, nombreGuion, titulo, lema, numeros]) => {
      const alFinal = vistas.has(espacio)
      vistas.add(espacio)
      for (const n of numeros) {
        estaciones.set(dos(n), { duracion: '1:12', duracionLarga: '1 minuto 12 segundos', parrafos: [`Común ${n}, primero.`, `Común ${n}, segundo.`] })
        estaciones.set(`${dos(n)}-ad`, { duracion: '1:40', duracionLarga: '1 minuto 40 segundos', parrafos: [`Con audiodescripción ${n}.`] })
      }
      return {
        espacio,
        nombreGuion,
        titulo,
        lema,
        ancla: alFinal ? `espacio-${espacio}-fin` : `espacio-${espacio}`,
        alFinal,
        estaciones: numeros.map((n) => ({ id: dos(n), numero: n, titulo: `Título de la estación ${n}` })),
      }
    })
    return { grupos, estaciones }
  }
  let datosDeLaAudioguia
  const audioguiaCon = ({ version = 'comun', espacioActual = 'sala-2' } = {}) =>
    datosDeLaAudioguia({ audioguia: audioguiaDePrueba(), version, espacioActual, token: '1.2026-11-24.firma' })
  const paginaAudioguia = (datos) =>
    pagina({ pagina: 'audioguia', ruta: datos.espacioActual ? `/audioguia/${datos.espacioActual}` : '/audioguia', museo: MUSEO_MAXIMO, datos })
  // El elemento con ese id (su etiqueta de apertura), o null.
  const elementoConId = (html, id) => new RegExp(`<[a-z0-9]+ [^>]*id="${id}"[^>]*>`).exec(html)?.[0] ?? null

  test('la audioguía está en la tabla de páginas, fuera de la tabla del servidor y de navegacion (ni menú, ni pie, ni 404)', async () => {
    const rutas = await import('../audioguia/rutas.js')
    datosDeLaAudioguia = rutas.datosDeLaPagina
    assert.ok(Object.hasOwn(tabla.PAGINAS, 'audioguia'))
    assert.equal(tabla.ARCHIVOS_DE_PAGINAS.audioguia, 'src/paginas/Audioguia.jsx')
    assert.deepEqual(rutas.PAGINAS_FUERA_DE_LA_TABLA, ['audioguia'])
    assert.ok(!RUTAS.some((r) => r.pagina === 'audioguia'))
    const enNavegacion = [...contenido.navegacion.menu, ...contenido.navegacion.otras].map((s) => s.pagina)
    assert.ok(!enNavegacion.includes('audioguia'))
    for (const html of [pagina({ pagina: 'home', museo: MUSEO_MAXIMO }), pagina({ pagina: 'no-encontrada', ruta: '/x', museo: MUSEO_MAXIMO })]) {
      assert.equal(cuantas(html, '/audioguia'), 0)
    }
    // Sin sobreFoto: el título arriba, como las fichas.
    assert.notEqual(paginasCargadas.audioguia.sobreFoto, true)
  })

  test('la audioguía: los textos de content.js, con todas sus claves y el guion blando en tituloAd (5.4)', () => {
    const t = contenido.audioguia
    assert.deepEqual(Object.keys(t).sort(), [
      'alFinal', 'artista', 'bajada', 'duracion', 'estacion', 'estasAca', 'estasAcaLector', 'etiquetaIndice', 'etiquetaRecorrido',
      'irA', 'irAlEspacio', 'motivos', 'navegadorApp', 'navegadorAppPregunta', 'sinConexion', 'sinSoporte', 'titulo', 'tituloAd',
      'transcripcion', 'version',
    ])
    assert.deepEqual(Object.keys(t.version).sort(), ['actualAd', 'actualComun', 'cambiarAAd', 'cambiarAComun'])
    assert.deepEqual(Object.keys(t.motivos).sort(), ['codigo', 'sin-codigo', 'sin-cookie', 'vencido'])
    assert.equal(t.titulo, 'Audioguía')
    assert.equal(t.tituloAd, 'Audioguía con audio­descripción')
    assert.equal(cuantas(t.tituloAd, '­'), 1)
    for (const valor of [t.titulo, t.bajada, t.irA, t.estasAca, ...Object.values(t.version), ...Object.values(t.motivos)]) {
      assert.ok(typeof valor === 'string' && valor.length > 0)
    }
  })

  test('la audioguía sin acceso: el h1, el motivo y el enlace a Visitas; ningún <audio> ni dirección de una estación', () => {
    const casos = [
      [{}, 'sin-codigo'],
      [{ acceso: false, motivo: 'sin-codigo' }, 'sin-codigo'],
      [{ acceso: false, motivo: 'sin-cookie' }, 'sin-cookie'],
      [{ acceso: false, motivo: 'codigo' }, 'codigo'],
      [{ acceso: false, motivo: 'vencido' }, 'vencido'],
      [{ acceso: false, motivo: 'otra-cosa' }, 'sin-codigo'],
    ]
    for (const [datos, motivo] of casos) {
      const main = delMain(pagina({ pagina: 'audioguia', ruta: '/audioguia', museo: MUSEO_MAXIMO, datos }))
      assert.equal(cuantas(main, '<h1'), 1, motivo)
      assert.match(main, /<h1 class="[^"]*">Audioguía<\/h1>/, motivo)
      assert.ok(main.includes(contenido.audioguia.motivos[motivo].replace(/"/g, '&quot;')), motivo)
      assert.equal(cuantas(main, '<audio'), 0, motivo)
      assert.equal(cuantas(main, '/audioguia/pista/'), 0, motivo)
      assert.equal(cuantas(main, '<details'), 0, motivo)
      assert.equal(hrefs(main).join(' '), '/visitas', motivo)
      assert.equal(cuantas(main, 'href="#"'), 0, motivo)
    }
  })

  test('el h1 de la audioguía: el de las fichas con un tope propio debajo de 32rem, en las tres formas (AGP-SPE-01 y AGP-NAV-03)', async () => {
    const { TITULO_SIN_FOTO } = await vite.ssrLoadModule('/src/components/tablero.js')
    // El de las fichas y la 404 no cambió (con el tope en él, cambiarían también ellas).
    assert.ok(!TITULO_SIN_FOTO.includes('max-[32rem]'))
    const esperada = `${TITULO_SIN_FOTO} max-[32rem]:text-[length:min(1.75rem,9.3vw)] max-[32rem]:leading-[min(2rem,10.6286vw)]`
    const htmls = [
      pagina({ pagina: 'audioguia', ruta: '/audioguia', museo: MUSEO_MAXIMO, datos: {} }),
      paginaAudioguia(audioguiaCon()),
      paginaAudioguia(audioguiaCon({ version: 'ad' })),
    ]
    for (const html of htmls) {
      const clase = /<h1 class="([^"]*)">/.exec(delMain(html))[1]
      assert.equal(clase, esperada)
    }
  })

  test('la audioguía con acceso: el bloque de versión, «Ir a…», el índice, la bajada y la región del aviso (5.2 y 5.3)', () => {
    const datos = audioguiaCon()
    const main = delMain(paginaAudioguia(datos))
    assert.equal(cuantas(main, '<h1'), 1)
    assert.match(main, /<h1 class="[^"]*">Audioguía<\/h1>/)
    // El bloque de versión: enfocable, con la frase del estado y UN solo enlace, a la otra versión; sin aria-current ni <nav>.
    const bloque = parte(main, '<div id="audioguia-version"', '</div>')
    assert.match(bloque, /^<div id="audioguia-version" tabindex="-1" class="scroll-mt-25 lg:scroll-mt-29 focus:outline-none mt-10">/)
    assert.ok(bloque.includes(`>${contenido.audioguia.version.actualComun}</p>`))
    assert.deepEqual(hrefs(bloque), ['/audioguia/sala-2?v=ad#audioguia-version'])
    assert.ok(bloque.includes(`${contenido.audioguia.version.cambiarAAd}<svg`))
    assert.equal(cuantas(bloque, 'aria-current'), 0)
    assert.equal(cuantas(bloque, '<nav'), 0)
    // «Ir a SALA 2, el espacio en el que estás», al h2 del espacio, enfocable.
    assert.ok(main.includes('<a href="#espacio-sala-2" class="'))
    assert.ok(main.includes('>Ir a SALA 2, el espacio en el que estás<svg'))
    // El índice: un enlace por grupo (13), cada uno a un elemento con tabindex="-1" (el h2 de su espacio).
    const indice = parte(main, '<nav aria-label="Espacios de la audioguía"', '</nav>')
    assert.match(indice, /^<nav aria-label="Espacios de la audioguía" class="mt-10"><ul role="list" /)
    const destinos = hrefs(indice)
    assert.equal(destinos.length, 13)
    assert.deepEqual(destinos, GRUPOS_DE_PRUEBA.map(([e], i) => (i === 12 ? `#espacio-${e}-fin` : `#espacio-${e}`)))
    for (const href of [...destinos, '#espacio-sala-2']) {
      const elemento = elementoConId(main, href.slice(1))
      assert.ok(elemento?.startsWith('<h2 '), href)
      assert.ok(elemento.includes('tabindex="-1"'), href)
    }
    assert.ok(indice.includes('>RECEPCIÓN, al final del recorrido</a>'))
    // La bajada, en un párrafo; el role="status" vacío.
    assert.ok(main.includes(`>${contenido.audioguia.bajada}</p>`))
    assert.equal(cuantas(main, 'role="status"'), 1)
    assert.ok(main.includes('<p role="status" class="sr-only"></p>'))
    assert.equal(cuantas(main, 'aria-live'), 0)
    // Sin espacio actual, sin «Ir a…».
    const sinEspacio = delMain(paginaAudioguia(audioguiaCon({ espacioActual: null })))
    assert.equal(cuantas(sinEspacio, '>Ir a '), 0)
    assert.equal(cuantas(main, '>Ir a '), 1)
    assert.deepEqual(hrefs(parte(sinEspacio, '<div id="audioguia-version"', '</div>')), ['/audioguia?v=ad#audioguia-version'])
  })

  test('la audioguía con acceso: el recorrido, los 13 h2 distintos, las listas y una estación completa (5.2)', () => {
    const datos = audioguiaCon()
    const main = delMain(paginaAudioguia(datos))
    const recorrido = parte(main, '<ol role="list" aria-label="Recorrido de la audioguía"', '<details class="mt-20">')
    assert.ok(recorrido.length > 0)
    // Listas: el <ul> del índice, el <ol> del recorrido y un <ol> por espacio, todos con role="list".
    assert.equal(cuantas(main, '<ol role="list"'), 14)
    assert.equal(cuantas(main, '<ul role="list"'), 1)
    assert.equal(cuantas(main, '<ol') + cuantas(main, '<ul'), 15)
    // Los 13 h2: distintos, con «, estás en este espacio» (sr-only) solo en el actual y «, al final del recorrido» en la
    // segunda Recepción.
    const h2 = [...main.matchAll(/<h2 id="([^"]*)" tabindex="-1" class="([^"]*)">(.*?)<\/h2>/g)]
    assert.equal(h2.length, 13)
    const textosH2 = h2.map((m) => m[3].replace(/<[^>]+>/g, ''))
    assert.equal(new Set(textosH2).size, 13)
    assert.equal(textosH2[2], 'SALA 2, estás en este espacio')
    assert.equal(h2[2][3], 'SALA 2<span class="sr-only">, estás en este espacio</span>')
    assert.equal(textosH2[12], 'RECEPCIÓN, al final del recorrido')
    assert.equal(cuantas(main, ', estás en este espacio'), 1)
    for (const m of h2) assert.ok(m[2].split(' ').includes('scroll-mt-25') && m[2].split(' ').includes('lg:scroll-mt-29'), m[1])
    // El espacio actual: aria-current="location", el borde, el rótulo visible aria-hidden con ROTULO_ACTUAL; los demás, nada.
    assert.equal(cuantas(main, 'aria-current="location"'), 1)
    assert.equal(cuantas(main, 'aria-current'), 1)
    assert.ok(main.includes('<li class="border-l-2 border-naranja pl-4 lg:pl-6" aria-current="location"><p aria-hidden="true" class="font-mono text-sm leading-5 font-medium text-naranja uppercase">Estás en este espacio</p><h2 id="espacio-sala-2"'))
    assert.equal(cuantas(main, 'border-naranja'), 1)
    assert.equal(cuantas(main, 'target:'), 0)
    assert.equal(cuantas(main, 'has-['), 0)
    // El título y el lema del guion debajo del h2; Recepción, sin ninguno.
    assert.ok(main.includes('>ISCHIGUALASTO · El origen de los dinosaurios</p>'))
    assert.ok(main.includes('>Paisaje vivo</p>'))
    // Una estación: el h3 con el número aria-hidden y «Estación N:» sr-only, la duración, el audio, el aviso y la transcripción.
    const e7 = parte(main, '<li id="estacion-07">', '</details></li>')
    assert.match(
      e7,
      /^<li id="estacion-07"><h3 id="estacion-07-titulo" class="[^"]*"><span aria-hidden="true" class="[^"]*">07<\/span><span class="sr-only">Estación 7: <\/span>Título de la estación 7<\/h3>/,
    )
    assert.match(e7, /<p class="[^"]*"><span aria-hidden="true">1:12<\/span><span class="sr-only">Duración: 1 minuto 12 segundos<\/span><\/p>/)
    assert.match(
      e7,
      /<audio controls="" controlsList="nodownload" preload="none" src="\/audioguia\/pista\/07\?t=1\.2026-11-24\.firma" aria-labelledby="estacion-07-titulo" class="[^"]*">Tu navegador no puede reproducir este audio\.<\/audio><p data-aviso="" class="[^"]*"><\/p><details/,
    )
    assert.match(e7, /<summary class="min-h-11 [^"]*">Leer la transcripción<span class="sr-only">: Título de la estación 7<\/span><\/summary>/)
    assert.ok(e7.includes('<p>Común 7, primero.</p><p>Común 7, segundo.</p>'))
    assert.equal(cuantas(e7, '<details open'), 0)
    // Las 35 estaciones: un audio con preload="none" cada una, un aviso sin aria-live, 35 summary distintos.
    assert.equal(cuantas(main, '<audio '), 35)
    assert.equal(cuantas(main, 'preload="none"'), 35)
    assert.equal(cuantas(main, 'controlsList="nodownload"'), 35)
    assert.equal(cuantas(main, '<p data-aviso=""'), 35)
    const audios = [...main.matchAll(/<audio [^>]*aria-labelledby="([^"]*)"/g)].map((m) => m[1])
    assert.equal(audios.length, 35)
    for (const id of audios) assert.ok(elementoConId(main, id)?.startsWith('<h3 '), id)
    const summaries = [...main.matchAll(/<summary [^>]*>(.*?)<\/summary>/g)].map((m) => m[1])
    assert.equal(summaries.length, 36)
    assert.equal(new Set(summaries.slice(0, 35)).size, 35)
    // Al final, el <details> de los navegadores de las apps.
    const final = main.slice(main.lastIndexOf('<details'))
    assert.ok(final.startsWith('<details class="mt-20"><summary class="min-h-11 '), final)
    assert.ok(final.includes(`>${contenido.audioguia.navegadorAppPregunta}</summary>`))
    assert.ok(final.includes(`>${contenido.audioguia.navegadorApp}</p>`))
    assert.ok(final.endsWith('</p></details></div></main>'))
    // Ids únicos; ningún enlace sin destino.
    const ids = [...main.matchAll(/ id="([^"]*)"/g)].map((m) => m[1])
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(cuantas(main, 'href="#"'), 0)
  })

  test('la audioguía: los nombres de los espacios son los del plano de la Home (home.mapa.espacios), y el manifiesto real, si está, también', async () => {
    const { validarManifiesto, ESPACIOS_DE_LA_AUDIOGUIA } = await import('../../compartido/esquemas/audioguias.js')
    const nombresDelPlano = Object.fromEntries(SALAS_DEL_PLANO.map((s, i) => [s.id, contenido.home.mapa.espacios[i]]))
    // Los de la tabla 1.2.1 de la especificación (los espacios del guion son los del plano: el desarrollador lo confirmó).
    const NOMBRES = {
      'sala-1': 'Sala 1', 'sala-2': 'Sala 2', 'sala-3': 'Sala 3', 'sala-4': 'Sala 4', 'sala-5': 'Sala 5', 'sala-6': 'Sala 6',
      'sala-7': 'Sala 7', 'jardin-triasico': 'Jardín Triásico', 'sala-educativa': 'Sala Educativa', 'sala-8': 'Sala 8',
      'sala-inmersiva': 'Sala Inmersiva',
    }
    for (const [id, nombre] of Object.entries(NOMBRES)) assert.equal(nombresDelPlano[id], nombre, id)
    assert.deepEqual(ESPACIOS_DE_LA_AUDIOGUIA.filter((id) => id !== 'recepcion').sort(), Object.keys(NOMBRES).sort())
    // Un manifiesto con un nombre que no es el del plano no pasa con los nombres de content.js.
    const recorrido = GRUPOS_DE_PRUEBA.map(([espacio, nombreGuion, , , numeros]) => ({
      espacio,
      nombre: espacio === 'recepcion' ? 'Recepción' : NOMBRES[espacio],
      nombreGuion,
      estaciones: numeros.map((n) => ({ numero: n, titulo: `Título ${n}` })),
    }))
    assert.equal(validarManifiesto({ version: 1, recorrido }, { nombresDelPlano }).ok, true)
    const mal = structuredClone(recorrido)
    mal[10].nombre = 'Sala Gigantismo'
    assert.equal(validarManifiesto({ version: 1, recorrido: mal }, { nombresDelPlano }).ok, false)
    // La carpeta real (audioguias/pistas.json, en el repo desde el 24/11/2026 con las 35 estaciones del guion): el nombre
    // de cada espacio, el del plano. Si algún día no está, no hay nada que comparar (audioguia.test.js, 9.2, lo avisa).
    const { existsSync, readFileSync } = await import('node:fs')
    const real = join(RAIZ, 'audioguias', 'pistas.json')
    if (existsSync(real)) {
      const r = validarManifiesto(JSON.parse(readFileSync(real, 'utf8').replace(/^﻿/, '')), { nombresDelPlano })
      assert.equal(r.ok, true, r.problemas?.join('\n'))
      for (const g of r.manifiesto.recorrido) {
        assert.equal(g.nombre, g.espacio === 'recepcion' ? 'Recepción' : nombresDelPlano[g.espacio], `${g.espacio}: el nombre del plano`)
      }
    }
  })

  test('la audioguía con audiodescripción: el h1 con el guion blando, la frase, el enlace a la común y los src en -ad (5.3)', () => {
    const datos = audioguiaCon({ version: 'ad', espacioActual: 'recepcion' })
    const html = paginaAudioguia(datos)
    const main = delMain(html)
    assert.match(main, /<h1 class="[^"]*">Audioguía con audio­descripción<\/h1>/)
    const bloque = parte(main, '<div id="audioguia-version"', '</div>')
    assert.ok(bloque.includes(`>${contenido.audioguia.version.actualAd}</p>`))
    assert.deepEqual(hrefs(bloque), ['/audioguia/recepcion?v=comun#audioguia-version'])
    assert.ok(bloque.includes(`${contenido.audioguia.version.cambiarAComun}<svg`))
    const srcs = [...main.matchAll(/<audio [^>]*src="([^"]*)"/g)].map((m) => m[1])
    assert.equal(srcs.length, 35)
    for (const src of srcs) assert.match(src, /^\/audioguia\/pista\/\d{2}-ad\?t=/)
    // Los ids del DOM no cambian con la versión.
    assert.ok(main.includes('<li id="estacion-07">'))
    assert.ok(main.includes('<p>Con audiodescripción 7.</p>'))
    assert.equal(cuantas(main, 'Común 7'), 0)
    // Recepción actual: solo la primera (una sola marca), y «Ir a RECEPCIÓN…» a la primera.
    assert.equal(cuantas(main, 'aria-current="location"'), 1)
    assert.ok(main.includes('<a href="#espacio-recepcion" class="'))
    assert.match(main, /<h2 id="espacio-recepcion" [^>]*>RECEPCIÓN<span class="sr-only">, estás en este espacio<\/span><\/h2>/)
    assert.match(main, /<h2 id="espacio-recepcion-fin" [^>]*>RECEPCIÓN, al final del recorrido<\/h2>/)
  })

  test('la audioguía, en el código (AGP-NAV-01 y AGP-NAV-02): ningún load() y los <details> con suppressHydrationWarning', async () => {
    // Lo que el HTML del servidor no muestra (en el navegador, tools/salida/audioguias/corr-1/herr/reintento.mjs e
    // hidratacion.mjs). AGP-NAV-01: en Chrome un load() explícito pide el audio aunque tenga preload="none", y un load()
    // en el error era un bucle sin fin; un audio que falló sin la señal vuelve a quedar listo sacándole el src y
    // poniéndoselo otra vez. AGP-NAV-02: un <details> que la persona abre antes de hidratar no es una diferencia.
    const { readFileSync } = await import('node:fs')
    const fuente = readFileSync(join(RAIZ, 'src', 'paginas', 'Audioguia.jsx'), 'utf8')
    const codigo = fuente
      .split('\n')
      .filter((renglon) => !/^\s*(\/\/|\/?\*)/.test(renglon))
      .join('\n')
    assert.doesNotMatch(codigo, /\.load\(/)
    assert.match(
      codigo,
      /if \(mensaje === textos\.sinConexion && audio\.error\) \{\n\s+const srcDelAudio = audio\.getAttribute\('src'\)\n\s+audio\.removeAttribute\('src'\)\n\s+if \(srcDelAudio\) audio\.setAttribute\('src', srcDelAudio\)\n\s+\}/,
    )
    const detalles = codigo.match(/<details\b[^>]*>/g) ?? []
    assert.equal(detalles.length, 2)
    for (const d of detalles) assert.match(d, /\bsuppressHydrationWarning\b/)
  })
})

describe('src/analitica.js: la audioguía no le dice a GA4 qué versión se escucha (especificación de las audioguías, 6)', () => {
  test('page_location sin la consulta ni el fragmento y el título fijo, solo en la audioguía', () => {
    const lugar = { origin: 'https://mupa.ar', pathname: '/audioguia/sala-2', search: '?v=ad', hash: '#espacio-sala-2' }
    assert.deepEqual(paginaParaGa4({ pagina: 'audioguia' }, lugar), {
      page_location: 'https://mupa.ar/audioguia/sala-2',
      page_title: 'Audioguía · MuPa',
    })
    assert.equal(TITULO_AUDIOGUIA, 'Audioguía · MuPa')
    const otra = { origin: 'https://mupa.ar', pathname: '/visitas', search: '?v=ad', hash: '' }
    for (const pagina of ['home', 'visitas', 'no-encontrada', undefined]) assert.deepEqual(paginaParaGa4({ pagina }, otra), {})
    // Lo mismo pasando el referrer: vacío, de otra página del sitio o de otro sitio con /audioguia, no cambia nada.
    for (const referrer of ['', 'https://mupa.ar/visitas?v=ad', 'https://otro.example/audioguia/q/x', 'no es una URL'])
      assert.deepEqual(paginaParaGa4({ pagina: 'visitas' }, otra, referrer), {})
  })

  test('la 404 en una dirección de la audioguía va como /audioguia: ni el código del QR, ni el espacio, ni ?v=ad (AGP-COD-01)', () => {
    const codigo = 'sala-1.1.AAAAAAAAAAAAAAAAAAAAAA'
    for (const pathname of [`/audioguia/q/${codigo}`, `/audioguia/q/${codigo}/`, '/audioguia', '/audioguia/', '/audioguia/sala-2', '/Audioguia/sala-2', '/AUDIOGUIA/q', '/audioguia/tienda/x']) {
      const lugar = { origin: 'https://mupa.ar', pathname, search: '?v=ad&r=1', hash: '#espacio-sala-2' }
      const r = paginaParaGa4({ pagina: 'no-encontrada' }, lugar, '')
      assert.deepEqual(r, { page_location: 'https://mupa.ar/audioguia' }, pathname)
    }
    // Lo que solo empieza parecido no es de la audioguía.
    for (const pathname of ['/audioguias', '/audioguiax/q', '/a/audioguia'])
      assert.deepEqual(paginaParaGa4({ pagina: 'no-encontrada' }, { origin: 'https://mupa.ar', pathname }, ''), {}, pathname)
  })

  test('el referrer de una dirección de la audioguía del mismo sitio va recortado, en cualquier página', () => {
    const lugar = { origin: 'https://mupa.ar', pathname: '/visitas' }
    for (const referrer of ['https://mupa.ar/audioguia/q/sala-1.1.AAAA?v=ad', 'https://mupa.ar/Audioguia/sala-2?v=ad#x', 'https://mupa.ar/audioguia'])
      assert.deepEqual(paginaParaGa4({ pagina: 'visitas' }, lugar, referrer), { page_referrer: 'https://mupa.ar/audioguia' }, referrer)
    // En la propia audioguía, la dirección y el título como siempre, y el referrer recortado si viene de otra de sus direcciones.
    assert.deepEqual(
      paginaParaGa4({ pagina: 'audioguia' }, { origin: 'https://mupa.ar', pathname: '/audioguia/sala-2' }, 'https://mupa.ar/audioguia/recepcion?v=ad'),
      { page_location: 'https://mupa.ar/audioguia/sala-2', page_title: 'Audioguía · MuPa', page_referrer: 'https://mupa.ar/audioguia' },
    )
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
