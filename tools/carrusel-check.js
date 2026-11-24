(async () => {
  // Expresión para measure.mjs: el carrusel de Novedades de la Home (src/components/CarruselNovedades.jsx; tablero "Web"
  // de la diseñadora, 02/11/2026) y, con parámetros en la dirección, otro carrusel con la misma lógica (ver Uso, abajo).
  // Necesita novedades publicadas (con SIN_BASE no hay: cargarlas por la API en un esquema aislado, como las páginas
  // internas). Comprueba, después de hidratar:
  // - la fila: scroll horizontal nativo, snap obligatorio (antes de hidratar no tiene snap), sin que Lenis tome los
  //   gestos horizontales (data-lenis-prevent-horizontal) y, con Lenis andando, que Mayús + rueda vaya nativa (no la
  //   cancela) y la rueda vertical sí la tome (baja la página);
  // - Anterior y Siguiente: con su nombre, aria-controls a la fila, aria-disabled en las puntas; cada uno lleva la fila a
  //   la tarjeta anterior o siguiente y la región viva dice "Novedad n de total" cuando la fila queda quieta, con n la
  //   primera tarjeta que se ve entera desde la izquierda (la receta la mide en la fila, no la lee de ningún contador);
  // - la región viva: una sola, polite, fuera de la vista (sr-only: no ocupa lugar) y después de los botones en el HTML;
  //   ya en el HTML del servidor, vacía (la receta vuelve a pedir la página con fetch y la busca ahí); vacía al cargar y
  //   callada con el scroll de la fila y con el foco en una tarjeta (que queda entera a la vista; puede vaciarse, nunca
  //   avisa), y un botón vuelve a avisar aunque repita el último aviso (Siguiente, la fila a mano al principio y
  //   Siguiente otra vez: R1-01 de la re-verificación);
  // - las tarjetas: el título es el enlace (con nombre), "leer más" no se repite para el lector; sin scroll horizontal
  //   de la página. En Novedades, además (RF-01, 19/11/2026: el título, tres renglones como mucho, con line-clamp-3
  //   en el enlace), el título de cada tarjeta ocupa 3 renglones como mucho (el alto del h3 sobre su interlineado: lo
  //   que se ve, no lo que dice el CSS) y no se sale de la tarjeta a lo ancho (res.renglonesDelTitulo, uno por
  //   tarjeta). Así, contra un build de antes del 19/11/2026 con un título de cuatro renglones o más, da ok: false a
  //   propósito.
  // Dónde van los controles (res.flechas, por la geometría: los dos botones sobre la fila, "a los costados", o debajo,
  // "abajo"). En Novedades, con más de una tarjeta: a los costados si todas las tarjetas tienen foto (F1, desde el
  // 16/11/2026: FlechasCarrusel.jsx) y abajo si alguna no la tiene (F8: ControlesCarrusel.jsx); en el otro lugar, falla
  // (VFC-01 de la verificación de las flechas: hasta el 17/11/2026 aceptaba los dos). Así, contra un build de antes de
  // las flechas a los costados (el 16/11/2026) da ok: false, a propósito.
  // Con las flechas a los costados comprueba además:
  // - abajo de la fila, nada (decisión Q del desarrollador, 17/11/2026, que reemplazó a F6): ningún contador "n/total"
  //   dibujado en la sección (se busca por el texto que se dibuja, no por la clase) y la sección termina donde termina la
  //   fila (res.debajoDeLaFila: lo que hay entre el borde de abajo de la fila y el final del contenido de la sección; el
  //   16 y el 17/11/2026, hasta Q, quedaba ahí el contador solo, en una fila de 28,8 px a 24 de la de tarjetas), y el
  //   aire de abajo, que es lo que Q cuida: 32 px (±1) del borde de la fila al final de la sección (res.aireDebajo: los
  //   40 de pb-10 menos los 8 del -mb-2 del envoltorio; RF-03, 17/11/2026: más padding en la sección, o sin el margen
  //   negativo, no dejaba ningún elemento abajo y la receta daba ok) y, lo que ve el visitante, 40 px (±1) de lo que se
  //   ve de las tarjetas al final de la sección (res.aireDesdeLasTarjetas: el borde de abajo de lo más bajo de adentro
  //   de las tarjetas, el «leer más» de la más alta; los 8 del py-2 de la fila más esos 32; R3H-02 de la
  //   re-verificación de la ronda 3, 18/11/2026: con el aire de más ADENTRO de la fila —más padding abajo en el <ul>, o
  //   un margen abajo en cada tarjeta— el borde de la fila bajaba con él y la receta seguía midiendo 32);
  // - el lugar: «Anterior» contra el borde izquierdo de la zona visible de la fila y «Siguiente» contra el derecho, a no
  //   más de 24 px (F2: 8 debajo de lg y 16 desde lg; la zona visible es la de las tarjetas en reposo, sin los 8 px de
  //   margen por dentro de la izquierda de la fila: el borde del contenido; res.lugar), de 44x44 o más, centrados en el
  //   alto de la foto de la tarjeta, dentro de la franja de las fotos y sin tapar el título, el resumen ni "leer más" de
  //   ninguna tarjeta (al cargar y en cada paso); y por encima del enlace de la tarjeta (lo que hay en su centro es el
  //   botón);
  // - cuándo se ven, en cada paso: «Anterior» solo si hay tarjetas hacia la izquierda y «Siguiente» solo si hay hacia la
  //   derecha (al cargar, solo «Siguiente»; al final, solo «Anterior»); el que no se ve va con visibility: hidden y no
  //   toma el foco. Antes de mirar, la receta espera hasta 4 s a que cada flecha llegue al estado que le corresponde y,
  //   después, a que terminen sus transiciones: con la PC cargada el fundido puede empezar 1 o 2 s tarde, y con solo
  //   esperar las animaciones en curso daba un falso ok: false (VFU-07 de la verificación). También: el fundido de la
  //   opacidad, de unos 200 ms (sin reduced-motion: con reduced-motion index.css deja las transiciones en 0,01 ms), y el
  //   cursor, la mano sobre la que se ve y el común sobre la deshabilitada (VFU-05). El retardo de 0,8 s con que la que
  //   se oculta pasa a visibility: hidden (el clic de más) NO se comprueba: el desarrollador todavía no decidió si queda
  //   (VFC-07); la receta lo anota en res.retardoDeLaOculta;
  // - el foco que no se pierde (F4): con el foco visible en «Siguiente», llegar al final lo deja a la vista, con
  //   aria-disabled, el cursor común y la flecha tenue (al 45 %, entre 0,4 y 0,6: VFU-02), y al perder el foco se oculta.
  //   Necesita que la página tenga el foco: tools/measure.mjs lo emula (Emulation.setFocusEmulationEnabled, desde el
  //   17/11/2026; con --sin-foco, no). Con el foco, F4 se prueba y una falla cuenta (también si el botón no toma el foco
  //   visible); sin el foco queda dicho en res.focoEnLaPunta y en res.sinProbar, que no son fallas (VFC-03);
  // - el dedo que desliza justo sobre una flecha: el botón deja al navegador solo el gesto vertical (touch-action:
  //   pan-y) y pasa a la tarjeta siguiente o a la anterior; un movimiento corto, el mouse o el lápiz (pen), no (VFC-04).
  //   Acá, con eventos de puntero hechos a mano: prueba los manejadores; el gesto de verdad, con toques por CDP o con un
  //   dedo.
  // Con los controles abajo (los documentales de El Museo, o Novedades si una tarjeta no tiene foto, F8), nada de eso se
  // mira y valen los criterios de siempre, con el contador: uno solo dibujado (ControlesCarrusel.jsx lleva dos en el
  // HTML, un <span> debajo de lg y un <p> desde lg, y el CSS muestra uno; la receta cuenta los que se dibujan, por el
  // texto "n/total": VFC-06), aria-hidden, y "n/total" con la misma n que la región viva. En Novedades con los controles
  // abajo (F8), además, el aire: 16 px de la fila de tarjetas a la de los controles y 40 de ella al final de la sección
  // (res.aireHastaLosControles y res.aireDebajo; RF-03), y 24 de lo que se ve de las tarjetas a los controles
  // (res.aireDesdeLasTarjetas: esos 16 más los 8 del py-2 de la fila; R3H-02).
  // Si falta la fila, un botón, la región viva o (con los controles abajo) el contador, la receta lo anota y devuelve
  // ok: false con lo que ya juntó (hasta el 17/11/2026 se caía con un TypeError y no devolvía nada: VFC-02); cualquier
  // otro error del script también termina en una falla, no en una excepción.
  // Con la PC cargada (17/11/2026): después de cada botón la receta espera a que la fila arranque (3 s como mucho), a
  // que quede quieta y a que la región viva avise (2 s como mucho), y no solo 300 ms sin movimiento. Si la fila tardó
  // más de 2 s en quedar quieta, el hook no avisa, a propósito (useCarrusel.js: «2 s como mucho»): ese paso va en
  // res.lentos, con lo que tardó, y no es una falla (en una corrida normal la fila tarda de 0,3 a 0,6 s: res.pasos lo
  // dice en "tardó"). Todas estas esperas tienen tope: si lo esperado no llega, se mira igual y falla.
  // Lo que no prueba: el retardo de 0,8 s (arriba), un dedo, un mouse o un lápiz de verdad (los eventos son hechos a
  // mano), el lector de pantalla (solo el texto de la región viva), la impresión y la página sin JavaScript.
  // Uso: node tools/measure.mjs 1440 900 tools/carrusel-check.js --url http://127.0.0.1:5183/   (debe dar ok: true)
  //   También en /divulgacion (desde el 06/11/2026: «Últimas noticias» es el mismo carrusel, con el mismo id del h2).
  //   Con --reduce también (los botones mueven la fila sin animar).
  //   Otro carrusel con la misma lógica (src/hooks/useCarrusel.js y ControlesCarrusel.jsx, desde el 10/11/2026): en la
  //   dirección, ?carrusel=<id del h2 de su sección> y ?aviso=<la palabra de la región viva> (por defecto,
  //   novedades-titulo y Novedad). Los documentales de El Museo:
  //     --url "http://127.0.0.1:5183/el-museo?carrusel=el-museo-documentales&aviso=Documental"
  //   Sus tarjetas no son enlaces (url: null) ni tienen "leer más": lo de los enlaces y el foco se prueba solo si las
  //   tarjetas los tienen, y "leer más", solo en Novedades. Desde md los documentales van en una fila de tres, sin
  //   controles (md:hidden): ahí la receta comprueba que la fila no tenga scroll y da ok con una nota.
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  const res = { ancho: innerWidth, alto: innerHeight, pasos: [], fallas: [], sinProbar: [] }
  const falla = (texto) => res.fallas.push(texto)
  const fin = (extra = {}) => ({ ...res, ...extra, ok: res.fallas.length === 0 })
  try {
    const parametros = new URLSearchParams(location.search)
    const idTitulo = parametros.get('carrusel') || 'novedades-titulo'
    const palabra = parametros.get('aviso') || 'Novedad'
    const esNovedades = idTitulo === 'novedades-titulo'
    res.carrusel = idTitulo
    const selectorSeccion = `section[aria-labelledby="${idTitulo}"]`
    const seccion = document.querySelector(selectorSeccion)
    if (!seccion) return { ...res, ok: false, fallas: [`no hay carrusel en la sección de #${idTitulo} (¿hay novedades publicadas?)`] }
    const fila = seccion.querySelector('ul[data-lenis-prevent-horizontal]')
    if (!fila) return { ...res, ok: false, fallas: ['no está la fila (ul con data-lenis-prevent-horizontal)'] }
    let botones = [...seccion.querySelectorAll('button')]
    // Los textos "n/total" que se dibujan fuera de la fila (el contador: dibujo, aria-hidden). Se buscan por el texto y
    // no por la clase (VFC-06): un elemento cuyo texto es "n/total" y que no tiene adentro otro igual; React lo escribe
    // en tres nodos de texto ("1", "/", "6"), por eso se mira el texto del elemento. Dibujado: con alguna caja (un
    // display: none no cuenta; uno con visibility: hidden, sí: ocupa su lugar).
    const esNumero = (e) => /^\d+\s*\/\s*\d+$/.test(e.textContent.trim())
    const contadoresDibujados = () =>
      [...seccion.querySelectorAll('*')].filter((e) => !fila.contains(e) && esNumero(e) && ![...e.children].some(esNumero) && e.getClientRects().length > 0)
    // Los controles no van en este ancho (los documentales desde md): la fila, sin scroll; la página, tampoco.
    const controles = botones[0]?.parentElement
    if (controles && getComputedStyle(controles).display === 'none') {
      if (fila.scrollWidth - fila.clientWidth > 1) falla(`sin controles, la fila tiene scroll (${fila.scrollWidth} en ${fila.clientWidth})`)
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth) falla('la página tiene scroll horizontal')
      if (/mandatory/.test(getComputedStyle(fila).scrollSnapType)) falla('sin controles, la fila tiene snap')
      if (contadoresDibujados().length) falla('sin controles, se dibuja un contador "n/total"')
      return fin({ tarjetas: fila.children.length, nota: 'en este ancho no hay carrusel (los controles no van)' })
    }
    // Hidratada y medida: la fila toma el snap (lo pone el efecto que mide, en el mismo render en que los controles dejan
    // de estar invisibles si las tarjetas desbordan); después, el fundido de las flechas de los costados (200 ms).
    for (let i = 0; i < 100 && !/mandatory/.test(getComputedStyle(fila).scrollSnapType); i++) await espera(50)
    await espera(350)
    // Los controles, leídos otra vez ya hidratada la página.
    botones = [...seccion.querySelectorAll('button')]
    const vivos = [...seccion.querySelectorAll('[aria-live]')]
    const vivo = vivos[0] ?? null
    const tarjetas = [...fila.children]
    const total = tarjetas.length
    res.tarjetas = total
    const desborda = fila.scrollWidth - fila.clientWidth > 1
    res.desborda = desborda

    // Dónde están los botones, por la geometría: sobre la fila (el centro de los dos, entre su borde de arriba y el de
    // abajo) o debajo de ella (los dos más abajo que su borde de abajo).
    const caja = (e) => e.getBoundingClientRect()
    const centroY = (b) => caja(b).top + caja(b).height / 2
    const f0 = caja(fila)
    let lugar = 'no hay'
    if (botones.length) {
      if (botones.some((b) => b.getClientRects().length === 0)) lugar = 'no se dibujan'
      else if (botones.every((b) => centroY(b) > f0.top && centroY(b) < f0.bottom)) lugar = 'a los costados'
      else if (botones.every((b) => centroY(b) >= f0.bottom)) lugar = 'abajo'
      else lugar = 'en otro lugar'
    }
    const aLosCostados = lugar === 'a los costados'
    const abajo = lugar === 'abajo'
    res.flechas = lugar
    // F1 y F8 (VFC-01): en Novedades, dónde tenían que ir.
    const todasConFoto = tarjetas.every((li) => li.querySelector('img'))
    if (esNovedades && total > 1) {
      if (todasConFoto && !aLosCostados) falla(`todas las tarjetas tienen foto y las flechas van ${lugar === 'no hay' ? 'sin dibujarse' : lugar} (F1: a los costados de la fila)`)
      if (!todasConFoto && !abajo) falla(`una tarjeta no tiene foto y las flechas van ${lugar} (F8: abajo, con el contador: sobre una tarjeta sin foto taparían su título)`)
    }
    // El contador.
    const dibujados = contadoresDibujados()
    res.contadores = dibujados.length
    const contador = abajo ? (dibujados[0] ?? null) : null

    // La fila.
    const estilo = getComputedStyle(fila)
    if (estilo.overflowX !== 'auto') falla(`la fila tiene overflow-x ${estilo.overflowX}`)
    if (!/x mandatory/.test(estilo.scrollSnapType)) falla(`la fila tiene scroll-snap-type "${estilo.scrollSnapType}" (esperaba x mandatory después de hidratar)`)
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) falla('la página tiene scroll horizontal')
    // (con una sola tarjeta no hay controles ni región viva: hasta el 16/11/2026 la receta lo daba por falla)
    if (vivo ? vivo.textContent !== '' : false) falla(`la región viva no está vacía al cargar ("${vivo.textContent}")`)
    // Las tarjetas: el título es el enlace (si las tarjetas son enlaces: en Novedades, siempre), "leer más" aria-hidden
    // (en Novedades).
    const conEnlaces = esNovedades || tarjetas.some((li) => li.querySelector('a[href]'))
    res.conEnlaces = conEnlaces
    for (const [i, li] of tarjetas.entries()) {
      if (conEnlaces) {
        const a = li.querySelector('h3 a[href]')
        if (!a || !a.textContent.trim()) falla(`la tarjeta ${i + 1} no tiene el enlace en el título`)
        if (li.querySelectorAll('a[href]').length !== 1) falla(`la tarjeta ${i + 1} tiene ${li.querySelectorAll('a[href]').length} enlaces`)
      } else if (!li.querySelector('h3')?.textContent.trim()) falla(`la tarjeta ${i + 1} no tiene título`)
      if (esNovedades) {
        const leer = [...li.querySelectorAll('p')].find((p) => p.getAttribute('aria-hidden') === 'true')
        if (!leer) falla(`la tarjeta ${i + 1}: "leer más" no es aria-hidden`)
        // El título, tres renglones como mucho y adentro de la tarjeta (RF-01, 19/11/2026).
        const h3 = li.querySelector('h3')
        if (h3) {
          const renglones = Math.round(caja(h3).height / parseFloat(getComputedStyle(h3).lineHeight))
          ;(res.renglonesDelTitulo ??= []).push(renglones)
          if (renglones > 3) falla(`la tarjeta ${i + 1}: el título ocupa ${renglones} renglones (RF-01: 3 como mucho, con «…»)`)
          const t = caja(h3.querySelector('a') ?? h3)
          const c = caja(li)
          if (t.left < c.left - 1 || t.right > c.right + 1) falla(`la tarjeta ${i + 1}: el título se sale de la tarjeta (${Math.round(t.left)}..${Math.round(t.right)} en ${Math.round(c.left)}..${Math.round(c.right)})`)
        }
      }
    }
    if (total < 2) {
      if (botones.length || dibujados.length || vivos.length) falla(`una sola tarjeta y hay controles (${botones.length} botones, ${dibujados.length} contadores, ${vivos.length} regiones vivas)`)
      return fin({ nota: 'una sola tarjeta: sin botones' })
    }

    // Lo que tiene que estar (VFC-02): sin eso no se sigue, y se devuelve lo que ya se juntó.
    const faltan = []
    if (botones.length !== 2) faltan.push(`hay ${botones.length} botones (esperaba Anterior y Siguiente)`)
    if (!vivo) faltan.push('no está la región viva (aria-live)')
    if (abajo && !contador) faltan.push('con los controles abajo, no se dibuja el contador "n/total"')
    if (faltan.length) {
      for (const t of faltan) falla(t)
      return fin({ nota: 'faltan controles: la receta no siguió' })
    }
    const [anterior, siguiente] = botones
    for (const b of botones) {
      if (b.getAttribute('aria-controls') !== fila.id) falla('un botón no apunta a la fila (aria-controls)')
      if (!b.querySelector('.sr-only')?.textContent.trim()) falla('un botón no tiene nombre')
    }
    // El contador (con los controles abajo): uno solo dibujado y aria-hidden (el lector tiene la región viva).
    if (abajo) {
      if (dibujados.length !== 1) falla(`se dibujan ${dibujados.length} contadores "n/total" (esperaba uno)`)
      if (!contador.closest('[aria-hidden="true"]')) falla('el contador "n/total" no es aria-hidden (el lector de pantalla lo leería además de la región viva)')
    }
    // La región viva: una sola, polite, sin ocupar lugar, después de los botones, y ya en el HTML del servidor.
    if (vivos.length !== 1) falla(`hay ${vivos.length} regiones vivas (esperaba una)`)
    if (vivo.getAttribute('aria-live') !== 'polite') falla(`la región viva es aria-live="${vivo.getAttribute('aria-live')}" (esperaba polite)`)
    const rv = caja(vivo)
    if (rv.width > 1 || rv.height > 1) falla(`la región viva se ve (mide ${Math.round(rv.width)}x${Math.round(rv.height)}: tendría que ser sr-only)`)
    if (!(fila.compareDocumentPosition(anterior) & Node.DOCUMENT_POSITION_FOLLOWING)) falla('«Anterior» no va después de la lista en el HTML')
    if (!(anterior.compareDocumentPosition(siguiente) & Node.DOCUMENT_POSITION_FOLLOWING)) falla('«Siguiente» no va después de «Anterior» en el HTML')
    if (!(siguiente.compareDocumentPosition(vivo) & Node.DOCUMENT_POSITION_FOLLOWING) || botones.some((b) => b.contains(vivo))) falla('la región viva no va después de los botones en el HTML')
    try {
      const html = await (await fetch(location.href, { headers: { Accept: 'text/html' }, cache: 'no-store' })).text()
      const delServidor = new DOMParser().parseFromString(html, 'text/html').querySelector(selectorSeccion)
      const vivosServidor = delServidor ? [...delServidor.querySelectorAll('[aria-live]')] : []
      res.vivoEnElServidor = vivosServidor.length
      if (vivosServidor.length !== 1) falla(`en el HTML del servidor hay ${vivosServidor.length} regiones vivas (esperaba una, vacía, desde el principio)`)
      else if (vivosServidor[0].textContent !== '') falla(`en el HTML del servidor la región viva no está vacía ("${vivosServidor[0].textContent}")`)
    } catch (e) {
      res.sinProbar.push(`la región viva en el HTML del servidor (no se pudo pedir la página: ${e.message})`)
    }
    // Lo más bajo que se ve de las tarjetas (R3H-02, 18/11/2026): el borde de abajo de lo más bajo de adentro de ellas
    // (el «leer más» de la más alta), no el de la fila: un padding de más abajo en la fila, o un margen o un padding abajo
    // en las tarjetas, bajan el borde de la fila con ellos. Cuenta solo lo que tiene texto propio a la vista o es una
    // imagen (R4-01 de la re-verificación de la ronda 4, 18/11/2026): contando todo, el <article> con un padding abajo, un
    // espaciador vacío o un ::after de 24 px bajaban este borde con ellos y la receta daba ok con 64 px de aire.
    const conAlgoQueSeVe = (e) => e.getClientRects().length && ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e.matches('img, svg, video, canvas'))
    const abajoTarjetas = Math.max(...tarjetas.flatMap((li) => [...li.querySelectorAll('*')]).filter(conAlgoQueSeVe).map((e) => caja(e).bottom))
    // Con las flechas a los costados, abajo de la fila no queda nada (Q): ni un contador ni una fila.
    if (aLosCostados) {
      if (dibujados.length) falla(`con las flechas a los costados se dibuja un contador "${dibujados[0].textContent.trim()}" (Q: abajo de la fila no va nada)`)
      const s = caja(seccion)
      const debajo = s.bottom - parseFloat(getComputedStyle(seccion).paddingBottom) - caja(fila).bottom
      res.debajoDeLaFila = Math.round(debajo * 10) / 10
      if (debajo > 1) {
        const envoltorio = [...seccion.querySelectorAll('*')].reverse().find((e) => e.contains(fila) && e.contains(siguiente))
        const despues = []
        for (let e = envoltorio; e && e !== seccion; e = e.parentElement) for (let h = e.nextElementSibling; h; h = h.nextElementSibling) if (h.getClientRects().length) despues.push(h.tagName.toLowerCase())
        falla(`abajo de la fila queda una fila: ${Math.round(debajo)} px hasta el final de la sección${despues.length ? ` (${despues.join(', ')})` : ''} (Q: la sección termina donde termina la fila)`)
      }
      // Y el aire, que es lo que Q cuida (RF-03 de la re-verificación de las flechas, 17/11/2026: más padding en la
      // sección, o sin el margen negativo del envoltorio, no dejaba ningún elemento abajo y la receta daba ok): del borde
      // de la fila al final de la sección, 32 px (los 40 de pb-10 menos los 8 del -mb-2 del envoltorio; 32 en las 1760
      // medidas de esa re-verificación, en todos los anchos y modos).
      const aire = s.bottom - caja(fila).bottom
      res.aireDebajo = Math.round(aire * 10) / 10
      if (Math.abs(aire - 32) > 1) falla(`entre la fila y el final de la sección hay ${Math.round(aire * 10) / 10} px (esperaba 32: los 40 de pb-10 menos los 8 del -mb-2 del envoltorio; Q)`)
      // Y desde lo que se ve de las tarjetas: 40 (los 8 del py-2 de la fila más esos 32; 40 en las corridas sanas de la
      // re-verificación de la ronda 3, a 402 y a 1440, en la Home y en Divulgación).
      res.aireDesdeLasTarjetas = Math.round((s.bottom - abajoTarjetas) * 10) / 10
      if (Math.abs(s.bottom - abajoTarjetas - 40) > 1) falla(`entre las tarjetas y el final de la sección hay ${res.aireDesdeLasTarjetas} px (esperaba 40: los 8 del py-2 de la fila menos los 8 del -mb-2 del envoltorio más los 40 de pb-10; Q)`)
    } else if (abajo && esNovedades) {
      // Con los controles abajo (F8: una tarjeta sin foto) el aire es otro: de la fila de los controles (la caja que
      // tiene los dos botones; los botones se pasan de ella con su margen negativo) al final de la sección, los 40 de
      // pb-10 (res.aireDebajo), y de la fila de tarjetas a la de los controles, 16 (el mt-6 de los controles menos los 8
      // del -mb-2 del envoltorio; res.aireHastaLosControles).
      const filaDeControles = caja(anterior.parentElement)
      const aire = caja(seccion).bottom - filaDeControles.bottom
      res.aireDebajo = Math.round(aire * 10) / 10
      res.aireHastaLosControles = Math.round((filaDeControles.top - caja(fila).bottom) * 10) / 10
      if (Math.abs(aire - 40) > 1) falla(`con los controles abajo (F8), entre ellos y el final de la sección hay ${res.aireDebajo} px (esperaba 40: pb-10)`)
      if (Math.abs(res.aireHastaLosControles - 16) > 1) falla(`con los controles abajo (F8), entre la fila y los controles hay ${res.aireHastaLosControles} px (esperaba 16: el mt-6 de los controles menos los 8 del -mb-2 del envoltorio)`)
      // Y desde lo que se ve de las tarjetas hasta los controles: 24 (esos 16 más los 8 del py-2 de la fila).
      res.aireDesdeLasTarjetas = Math.round((filaDeControles.top - abajoTarjetas) * 10) / 10
      if (Math.abs(res.aireDesdeLasTarjetas - 24) > 1) falla(`con los controles abajo (F8), entre las tarjetas y los controles hay ${res.aireDesdeLasTarjetas} px (esperaba 24: los 8 del py-2 de la fila más los 16 hasta los controles)`)
    }

    // Las flechas a los costados (16/11/2026). seVe: a la vista y opaco (pasado el fundido).
    const seVe = (b) => getComputedStyle(b).visibility === 'visible' && Number(getComputedStyle(b).opacity) > 0.99
    const oculto = (b) => getComputedStyle(b).visibility === 'hidden'
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
    /**
     * Espera a que las flechas terminen sus transiciones: el fundido (200 ms) y, en la que se oculta, el retardo de
     * visibility (0,8 s más: mientras tanto sigue recibiendo los clics, para que el clic de más de una ráfaga no abra la
     * novedad de abajo). 2 s como mucho.
     */
    const asentadas = async () => {
      for (let i = 0; i < 40 && botones.some((b) => b.getAnimations({ subtree: true }).length); i++) await espera(50)
    }
    /** Lo que corresponde con la fila como está: si hay tarjetas hacia la izquierda y hacia la derecha. */
    const hayPara = () => {
      const max = fila.scrollWidth - fila.clientWidth
      return { antes: desborda && fila.scrollLeft > 1, despues: desborda && fila.scrollLeft < max - 1 }
    }
    const enSuEstado = (b, hay) => (hay ? seVe(b) : oculto(b))
    /**
     * Espera a que cada flecha llegue al estado que le corresponde (4 s como mucho; VFU-07): con la PC cargada el
     * fundido puede empezar 1 o 2 s tarde y asentadas(), que espera solo mientras HAY transiciones, seguía de largo.
     * Después, a que terminen las transiciones. No tapa una falla: si en 4 s no llega, se mira igual y falla.
     */
    const esperarEstado = async () => {
      for (let i = 0; i < 80; i++) {
        const { antes, despues } = hayPara()
        if (enSuEstado(anterior, antes) && enSuEstado(siguiente, despues)) break
        await espera(50)
      }
      await asentadas()
    }
    /** Lo mismo, para una sola: hasta que quede oculta (antes de ver que no toma el foco). */
    const esperarOculto = async (b) => {
      for (let i = 0; i < 80 && !oculto(b); i++) await espera(50)
      await asentadas()
    }
    const textos = tarjetas.flatMap((li) => [...li.querySelectorAll('h3, p')])
    // Lo que se repetiría en cada paso (el cursor, un texto tapado) se dice una sola vez por botón.
    const dichas = new Set()
    const fallaUnaVez = (clave, texto) => {
      if (dichas.has(clave)) return
      dichas.add(clave)
      falla(texto)
    }
    /** Si un botón a la vista tapa un texto de una tarjeta (al cargar y en cada paso). */
    const tapa = (b, paso) => {
      const r = caja(b)
      for (const t of textos) {
        const q = caja(t)
        if (q.width && q.height && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) {
          fallaUnaVez(`tapa ${b.textContent.trim()}`, `${paso}: «${b.textContent.trim()}» tapa un texto de una tarjeta ("${t.textContent.trim().slice(0, 30)}")`)
          return
        }
      }
    }
    /** Con las flechas a los costados: cada una se ve solo si hay tarjetas para su lado (la fila, quieta). */
    const comprobarFlechas = async (paso) => {
      if (!aLosCostados) return
      await esperarEstado()
      const { antes, despues } = hayPara()
      if (antes ? !seVe(anterior) : !oculto(anterior)) falla(`${paso}: «Anterior» ${antes ? 'no se ve y hay tarjetas a la izquierda' : 'se ve y no hay tarjetas a la izquierda'}`)
      if (despues ? !seVe(siguiente) : !oculto(siguiente)) falla(`${paso}: «Siguiente» ${despues ? 'no se ve y hay tarjetas a la derecha' : 'se ve y no hay tarjetas a la derecha'}`)
      for (const b of botones) {
        if (!seVe(b)) continue
        const cursor = b.getAttribute('aria-disabled') === 'true' ? 'default' : 'pointer'
        if (getComputedStyle(b).cursor !== cursor) fallaUnaVez(`cursor ${b.textContent.trim()} ${cursor}`, `${paso}: sobre «${b.textContent.trim()}» el cursor es "${getComputedStyle(b).cursor}" (esperaba ${cursor}; se dice una vez por botón)`)
        tapa(b, paso)
      }
    }
    if (!desborda) {
      if (aLosCostados) {
        await esperarOculto(anterior)
        await esperarOculto(siguiente)
        if (botones.some((b) => !oculto(b))) falla('entran todas y se ve una flecha')
      }
      return fin({ nota: 'entran todas: los botones quedan invisibles' })
    }
    if (aLosCostados) {
      // El lugar: contra los bordes de la zona visible de la fila, centrados en el alto de la foto y sin tapar ningún
      // texto de una tarjeta.
      const f = caja(fila)
      const zona = { left: f.left + parseFloat(getComputedStyle(fila).paddingLeft), right: f.right - parseFloat(getComputedStyle(fila).paddingRight) }
      const foto = tarjetas[0].querySelector('img') ? caja(tarjetas[0].querySelector('img')) : null
      if (!foto) falla('la primera tarjeta no tiene foto y las flechas van a los costados')
      for (const [b, lado] of [[anterior, 'izquierda'], [siguiente, 'derecha']]) {
        const r = caja(b)
        if (r.width < 43.5 || r.height < 43.5) falla(`«${b.textContent.trim()}» mide ${Math.round(r.width)}x${Math.round(r.height)} (menos de 44x44)`)
        const alBorde = lado === 'izquierda' ? r.left - zona.left : zona.right - r.right
        if (alBorde < -0.5 || alBorde > 24) falla(`«${b.textContent.trim()}» queda a ${Math.round(alBorde)} px del borde de la ${lado} de la zona visible de la fila (F2: 8 debajo de lg y 16 desde lg; 24 como mucho)`)
        if (foto) {
          const corrido = r.top + r.height / 2 - (foto.top + foto.height / 2)
          if (Math.abs(corrido) > 1.5) falla(`«${b.textContent.trim()}» no está centrado en el alto de la foto (${corrido.toFixed(1)} px)`)
          if (r.top < foto.top || r.bottom > foto.bottom) falla(`«${b.textContent.trim()}» se sale de la franja de las fotos`)
        }
        tapa(b, 'al cargar')
        // El fundido de la opacidad (~200 ms), sin reduced-motion.
        const st = getComputedStyle(b)
        const props = st.transitionProperty.split(',').map((x) => x.trim())
        const duraciones = st.transitionDuration.split(',').map((x) => parseFloat(x) * (/ms$/.test(x.trim()) ? 1 : 1000))
        const i = props.findIndex((p) => p === 'opacity' || p === 'all')
        const fundido = i < 0 ? null : duraciones[i % duraciones.length]
        if (lado === 'derecha') res.fundido = reducido ? `${fundido} ms (reduced-motion: no se compara)` : `${fundido} ms`
        if (!reducido && (fundido === null || fundido < 150 || fundido > 300)) falla(`«${b.textContent.trim()}» no aparece ni se va con un fundido de la opacidad de unos 200 ms (transition: ${st.transitionProperty} / ${st.transitionDuration})`)
      }
      res.lugar = { anterior: Math.round(caja(anterior).left - zona.left), siguiente: Math.round(zona.right - caja(siguiente).right) }
      // El retardo de visibility de la que se oculta (el clic de más, 0,8 s): solo se anota (VFC-07: el desarrollador
      // todavía no decidió si queda).
      res.retardoDeLaOculta = `${getComputedStyle(anterior).transitionProperty} / ${getComputedStyle(anterior).transitionDelay} (no se comprueba)`
      // Por encima del enlace de la tarjeta: en el centro de «Siguiente» está el botón (con la sección en la pantalla).
      siguiente.scrollIntoView({ block: 'center', behavior: 'instant' })
      await espera(100)
      const r = caja(siguiente)
      const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      if (!siguiente.contains(encima)) falla(`en el centro de «Siguiente» hay otra cosa (${encima?.tagName?.toLowerCase()}): un clic abriría la novedad`)
      // El que no se ve no toma el foco.
      await comprobarFlechas('al cargar')
      await esperarOculto(anterior)
      anterior.focus()
      if (document.activeElement === anterior) falla('al cargar, «Anterior» (oculto) toma el foco')
      document.activeElement?.blur?.()
    }

    /** Espera a que la fila quede quieta (300 ms sin moverse, 4 s como mucho) y un rato más para la región viva. */
    const quieta = async () => {
      let x = fila.scrollLeft
      let desde = performance.now()
      const inicio = performance.now()
      while (performance.now() - inicio < 4000) {
        await espera(50)
        if (Math.abs(fila.scrollLeft - x) > 0.5) {
          x = fila.scrollLeft
          desde = performance.now()
        } else if (performance.now() - desde > 300) break
      }
      await espera(250)
    }
    // Cuándo se movió la fila (los eventos scroll y scrollend, con el reloj de la página: el mismo que usa el hook).
    const movimientos = { scroll: [], fin: [] }
    fila.addEventListener('scroll', () => movimientos.scroll.push(performance.now()), { passive: true })
    fila.addEventListener('scrollend', () => movimientos.fin.push(performance.now()))
    let tardo = 0
    /**
     * Un botón (o el dedo sobre una flecha): hace la acción y espera a que la fila arranque (3 s como mucho: con la PC
     * cargada el scroll suave puede empezar más de 300 ms después del clic, y quieta() solo no lo veía), a que quede
     * quieta y, si se espera un aviso, a que la región viva lo escriba (2 s como mucho). Como esperarEstado(), no tapa
     * una falla: si no pasa, se mira igual. Deja en `tardo` cuánto tardó la fila en quedar quieta después de la acción,
     * como lo ve el hook (el primer scrollend, o 150 ms después del último scroll): si pasó de 2 s, el hook no avisa, a
     * propósito (useCarrusel.js: «2 s como mucho»), y la receta no lo cuenta como falla (avisoEsperado, abajo). Medido el
     * 17/11/2026 con la CPU limitada x6 y x8 y varios Chrome a la vez: sin esto, de 1 a 4 de 30 corridas daban un falso
     * ok: false («Siguiente 1: la fila no avanzó» o «la región viva dice ""»).
     */
    const mover = async (accion, { aviso = true } = {}) => {
      const x0 = fila.scrollLeft
      const t0 = performance.now()
      accion()
      for (let i = 0; i < 60 && Math.abs(fila.scrollLeft - x0) <= 0.5; i++) await espera(50)
      await quieta()
      if (aviso) for (let i = 0; i < 40 && vivo.textContent === ''; i++) await espera(50)
      const fin = movimientos.fin.find((x) => x >= t0)
      const ultimo = movimientos.scroll.filter((x) => x >= t0).pop()
      tardo = Math.round(Math.min(fin ?? Infinity, ultimo === undefined ? Infinity : ultimo + 150) - t0)
      if (!Number.isFinite(tardo)) tardo = 0
    }
    /**
     * La región viva después de un botón: si no dice lo que corresponde y la fila tardó más de 2 s en quedar quieta,
     * no es una falla (el hook no avisa pasados los 2 s): va en res.lentos. Si no, falla.
     */
    res.lentos = []
    const avisoEsperado = (paso, esperado) => {
      if (vivo.textContent === esperado) return
      if (tardo > 2000) res.lentos.push(`${paso}: la fila tardó ${tardo} ms en quedar quieta (más de los 2 s del hook) y la región viva dice "${vivo.textContent}"`)
      else falla(`${paso}: la región viva dice "${vivo.textContent}" (esperaba "${esperado}")`)
    }
    const primeraEntera = () => {
      const i = tarjetas.findIndex((li) => li.offsetLeft - fila.scrollLeft >= 7)
      return i < 0 ? total : i + 1
    }
    const anotar = (paso) => {
      const n = primeraEntera()
      const visto = contador?.textContent.trim()
      const ven = aLosCostados ? ` ven=${seVe(anterior) ? 'A' : '-'}${seVe(siguiente) ? 'S' : '-'}` : ''
      res.pasos.push(`${paso}: x=${Math.round(fila.scrollLeft)} tardó=${tardo} primera=${n}${contador ? ` contador=${visto}` : ''} vivo="${vivo.textContent}" ant=${anterior.getAttribute('aria-disabled')} sig=${siguiente.getAttribute('aria-disabled')}${ven}`)
      return { n, visto }
    }
    /** Con los controles abajo, el contador dice "n/total" con la n de la fila. */
    const compararContador = (paso, n, visto) => {
      if (contador && visto !== `${n}/${total}`) falla(`${paso}: el contador dice ${visto} y la primera entera es la ${n}`)
    }
    if (primeraEntera() !== 1) falla(`al cargar, la primera tarjeta entera es la ${primeraEntera()}`)
    compararContador('al cargar', 1, contador?.textContent.trim())
    if (anterior.getAttribute('aria-disabled') !== 'true') falla('al cargar, Anterior no está deshabilitado')
    if (siguiente.getAttribute('aria-disabled') !== 'false') falla('al cargar, Siguiente está deshabilitado')

    // Siguiente hasta el final.
    let previo = 1
    for (let i = 0; i < total + 1 && siguiente.getAttribute('aria-disabled') === 'false'; i++) {
      await mover(() => siguiente.click())
      const { n, visto } = anotar(`Siguiente ${i + 1}`)
      if (n <= previo) falla(`Siguiente ${i + 1}: la fila no avanzó (primera entera ${n})`)
      compararContador(`Siguiente ${i + 1}`, n, visto)
      avisoEsperado(`Siguiente ${i + 1}`, `${palabra} ${n} de ${total}`)
      await comprobarFlechas(`Siguiente ${i + 1}`)
      previo = n
    }
    if (siguiente.getAttribute('aria-disabled') !== 'true') falla('al final, Siguiente no quedó deshabilitado')
    if (Math.abs(fila.scrollLeft - (fila.scrollWidth - fila.clientWidth)) > 2) falla('Siguiente no llegó al final de la fila')
    if (aLosCostados) {
      await esperarOculto(siguiente)
      siguiente.focus()
      if (document.activeElement === siguiente) falla('al final, «Siguiente» (oculto) toma el foco')
      document.activeElement?.blur?.()
    }
    // Anterior una vez.
    await mover(() => anterior.click())
    const atras = anotar('Anterior')
    if (atras.n >= previo) falla('Anterior: la fila no volvió')
    compararContador('Anterior', atras.n, atras.visto)
    avisoEsperado('Anterior', `${palabra} ${atras.n} de ${total}`)
    await comprobarFlechas('Anterior')
    // El foco que no se pierde (las flechas a los costados, F4): con el foco visible en «Siguiente», llegar al final lo
    // deja a la vista, con aria-disabled, el cursor común y la flecha tenue; al perder el foco se oculta. Necesita que la
    // página tenga el foco (measure.mjs lo emula); sin él, :focus-visible no vale nunca y queda "sin probar".
    if (aLosCostados) {
      res.focoDeLaPagina = document.hasFocus()
      siguiente.focus({ focusVisible: true })
      if (document.activeElement === siguiente && siguiente.matches(':focus-visible')) {
        for (let i = 0; i < total && siguiente.getAttribute('aria-disabled') === 'false'; i++) {
          await mover(() => siguiente.click())
        }
        // Lo que tarda la que se oculta (el fundido y el retardo), y un poco más: si se fuera a ocultar, ya se ocultó.
        await espera(1200)
        await asentadas()
        anotar('con el foco visible en Siguiente, hasta el final')
        if (document.activeElement !== siguiente) falla('al llegar al final con el foco en «Siguiente», el foco se perdió')
        if (!seVe(siguiente)) falla('al llegar al final con el foco visible en «Siguiente», el botón se ocultó')
        if (siguiente.getAttribute('aria-disabled') !== 'true') falla('al final, «Siguiente» con el foco no tiene aria-disabled')
        if (getComputedStyle(siguiente).cursor !== 'default') falla(`al final, sobre «Siguiente» con el foco el cursor es "${getComputedStyle(siguiente).cursor}" (esperaba default)`)
        const tenue = Number(getComputedStyle(siguiente.querySelector('svg')).opacity)
        res.flechaTenue = tenue
        if (!(tenue >= 0.4 && tenue < 0.6)) falla(`al final, la flecha de «Siguiente» con el foco no queda tenue al 45 % (opacidad ${tenue}; entre 0,4 y 0,6)`)
        siguiente.blur()
        await espera(100)
        await esperarOculto(siguiente)
        if (!oculto(siguiente)) falla('al perder el foco en el final, «Siguiente» no se ocultó')
        res.focoEnLaPunta = 'probado'
        await mover(() => anterior.click())
        anotar('Anterior, otra vez')
      } else if (res.focoDeLaPagina) {
        falla('la página tiene el foco y «Siguiente» no tomó el foco visible: F4 (el foco que no se pierde) no se pudo probar')
        res.focoEnLaPunta = 'no se pudo probar: «Siguiente» no tomó el foco visible'
        document.activeElement?.blur?.()
      } else {
        res.focoEnLaPunta = 'sin probar: la página no tiene el foco (measure.mjs con --sin-foco, o un Chrome que no lo emula)'
        res.sinProbar.push('F4, el foco que no se pierde: la página no tiene el foco (document.hasFocus() es false) y :focus-visible no vale')
        document.activeElement?.blur?.()
      }
    }

    // El dedo que desliza justo sobre una flecha (las flechas a los costados): el botón toma los gestos horizontales
    // (touch-action: pan-y) y pasa a la tarjeta siguiente o a la anterior. Acá, con eventos de puntero hechos a mano (prueba
    // los manejadores; el gesto de verdad se prueba con toques por CDP o con un dedo).
    if (aLosCostados) {
      for (const b of botones) if (!/pan-y/.test(getComputedStyle(b).touchAction)) falla(`«${b.textContent.trim()}» no deja el gesto horizontal al botón (touch-action: ${getComputedStyle(b).touchAction})`)
      const dedo = (b, dx, tipo = 'touch') => {
        const r = caja(b)
        const en = { bubbles: true, cancelable: true, pointerType: tipo, pointerId: 77, isPrimary: true, clientY: r.top + r.height / 2 }
        b.dispatchEvent(new PointerEvent('pointerdown', { ...en, clientX: r.left + r.width / 2 }))
        b.dispatchEvent(new PointerEvent('pointerup', { ...en, clientX: r.left + r.width / 2 + dx }))
      }
      const desdeN = primeraEntera()
      await mover(() => dedo(siguiente, -60))
      const conDedo = anotar('el dedo hacia la izquierda sobre Siguiente')
      if (conDedo.n !== desdeN + 1) falla(`el dedo hacia la izquierda sobre «Siguiente» no pasó a la tarjeta siguiente (de la ${desdeN} a la ${conDedo.n})`)
      await mover(() => dedo(anterior, 60))
      const vuelta = anotar('el dedo hacia la derecha sobre Anterior')
      if (vuelta.n !== desdeN) falla(`el dedo hacia la derecha sobre «Anterior» no volvió a la tarjeta anterior (quedó en la ${vuelta.n})`)
      // Menos de 24 px con el dedo, o el mouse, o el lápiz (VFC-04: no tiene captura implícita y hace clic después de
      // moverse): no es un deslizamiento.
      for (const [dx, tipo, que] of [[-12, 'touch', 'un movimiento del dedo de 12 px'], [-60, 'mouse', 'el mouse'], [-60, 'pen', 'el lápiz']]) {
        await mover(() => dedo(siguiente, dx, tipo), { aviso: false })
        if (primeraEntera() !== desdeN) {
          falla(`${que} sobre «Siguiente» movió la fila (de la ${desdeN} a la ${primeraEntera()})`)
          fila.scrollTo({ left: tarjetas[desdeN - 1].offsetLeft - 8, behavior: 'instant' })
          await quieta()
        }
      }
    }

    // Los textos que toma la región viva (cada uno es un aviso si no está vacío), con un MutationObserver.
    const escritos = []
    new MutationObserver(() => escritos.push(vivo.textContent)).observe(vivo, { childList: true, characterData: true, subtree: true })
    const avisos = (desde) => escritos.slice(desde).filter((t) => t !== '')
    // El scroll de la fila (trackpad, dedo) no avisa nada: la región se vacía (lo que decía ya no vale) o queda igual.
    const antesVivo = vivo.textContent
    let desde = escritos.length
    fila.scrollTo({ left: 0, behavior: 'instant' })
    await quieta()
    const alPrincipio = anotar('scroll a mano al principio')
    if (avisos(desde).length) falla(`el scroll a mano avisó ${JSON.stringify(avisos(desde))}`)
    if (vivo.textContent !== antesVivo && vivo.textContent !== '') falla(`el scroll a mano cambió la región viva ("${vivo.textContent}")`)
    if (alPrincipio.n !== 1) falla(`al volver al principio, la primera tarjeta entera es la ${alPrincipio.n}`)
    compararContador('al volver al principio', 1, alPrincipio.visto)
    await comprobarFlechas('scroll a mano al principio')
    // R1-01 de la re-verificación: Siguiente después del scroll a mano vuelve a avisar, aunque sea el mismo texto que el
    // último aviso (Siguiente hasta la 2, a mano al principio y Siguiente otra vez: "Novedad 2 de total" dos veces).
    await mover(() => siguiente.click())
    const segunda = anotar('Siguiente, a mano al principio y Siguiente otra vez').n
    avisoEsperado('Siguiente, a mano al principio y Siguiente otra vez', `${palabra} ${segunda} de ${total}`)
    desde = escritos.length
    fila.scrollTo({ left: 0, behavior: 'instant' })
    await quieta()
    await mover(() => siguiente.click())
    anotar('otra vez')
    if (avisos(desde).join() !== `${palabra} ${segunda} de ${total}`) {
      if (tardo > 2000) res.lentos.push(`R1-01: la fila tardó ${tardo} ms en quedar quieta (más de los 2 s del hook) y avisó ${JSON.stringify(avisos(desde))}`)
      else falla(`R1-01: el mismo aviso no volvió a sonar (${JSON.stringify(escritos.slice(desde))})`)
    }
    // El foco en una tarjeta cortada la trae entera, sin avisar nada (si las tarjetas son enlaces: sin enlace no hay foco).
    if (conEnlaces) {
      desde = escritos.length
      const ultima = tarjetas[total - 1]
      ultima.querySelector('h3 a').focus()
      await quieta()
      const r = caja(ultima)
      const f = caja(fila)
      anotar('foco en la última tarjeta')
      if (r.left < f.left - 1 || r.right > f.right + 1) falla(`con el foco, la última tarjeta no se ve entera (${Math.round(r.left)}..${Math.round(r.right)} en ${Math.round(f.left)}..${Math.round(f.right)})`)
      if (avisos(desde).length) falla(`el foco en una tarjeta avisó ${JSON.stringify(avisos(desde))}`)
      await comprobarFlechas('foco en la última tarjeta')
      document.activeElement?.blur()
    }

    // Lenis (solo con puntero fino): Mayús + rueda queda nativa; la rueda vertical la toma Lenis (baja la página).
    if (document.documentElement.classList.contains('lenis')) {
      const rueda = (opciones) => {
        const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaMode: 0, ...opciones })
        fila.dispatchEvent(e)
        return e.defaultPrevented
      }
      const conMayus = rueda({ deltaY: 120, shiftKey: true })
      const horizontal = rueda({ deltaX: 120 })
      const vertical = rueda({ deltaY: 120 })
      res.lenis = { conMayus, horizontal, vertical }
      if (conMayus) falla('Lenis canceló Mayús + rueda sobre la fila (tenía que ir nativa: el scroll horizontal)')
      if (horizontal) falla('Lenis canceló la rueda horizontal sobre la fila')
      if (!vertical) falla('Lenis no tomó la rueda vertical sobre la fila')
      await espera(1200)
    } else res.lenis = 'sin Lenis (sin puntero fino o con reduced-motion)'
    return fin()
  } catch (e) {
    // Cualquier otra cosa que corte el script es una falla (con lo que ya se juntó), no una excepción (VFC-02).
    falla(`la receta se cortó: ${e?.message ?? e}`)
    return fin({ excepcion: String(e?.stack ?? e).split('\n').slice(0, 3).join(' | ') })
  }
})()
