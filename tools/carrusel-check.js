(async () => {
  // Expresión para measure.mjs: el carrusel de Novedades de la Home (src/components/CarruselNovedades.jsx; tablero "Web"
  // de la diseñadora, 02/11/2026). Necesita novedades publicadas (con SIN_BASE no hay: cargarlas por la API en un
  // esquema aislado, como las páginas internas). Comprueba, después de hidratar:
  // - la fila: scroll horizontal nativo, snap obligatorio (antes de hidratar no tiene snap), sin que Lenis tome los
  //   gestos horizontales (data-lenis-prevent-horizontal) y, con Lenis andando, que Mayús + rueda vaya nativa (no la
  //   cancela) y la rueda vertical sí la tome (baja la página);
  // - Anterior y Siguiente: con su nombre, aria-controls a la fila, aria-disabled en las puntas; cada uno lleva la fila a
  //   la tarjeta anterior o siguiente, el contador "n/total" (n: la primera tarjeta entera) lo sigue y la región viva
  //   dice "Novedad n de total" cuando la fila queda quieta;
  // - la región viva: vacía al cargar y callada con el scroll de la fila y con el foco en una tarjeta (que queda entera
  //   a la vista; puede vaciarse, nunca avisa), y un botón vuelve a avisar aunque repita el último aviso (Siguiente, la
  //   fila a mano al principio y Siguiente otra vez: R1-01 de la re-verificación);
  // - las tarjetas: el título es el enlace (con nombre), "leer más" no se repite para el lector; sin scroll horizontal
  //   de la página.
  // Uso: node tools/measure.mjs 1440 900 tools/carrusel-check.js --url http://127.0.0.1:5183/   (debe dar ok: true)
  //   También en /divulgacion (desde el 06/11/2026: «Últimas noticias» es el mismo carrusel, con el mismo id del h2).
  //   Con --reduce también (los botones mueven la fila sin animar).
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  const res = { ancho: innerWidth, alto: innerHeight, pasos: [], fallas: [] }
  const falla = (texto) => res.fallas.push(texto)
  const seccion = document.querySelector('section[aria-labelledby="novedades-titulo"]')
  if (!seccion) return { ...res, ok: false, fallas: ['no hay carrusel de Novedades (¿hay novedades publicadas?)'] }
  const fila = seccion.querySelector('ul[data-lenis-prevent-horizontal]')
  const botones = [...seccion.querySelectorAll('button')]
  const vivo = seccion.querySelector('[aria-live]')
  const contador = seccion.querySelector('p[aria-hidden="true"].min-w-11')
  const tarjetas = fila ? [...fila.children] : []
  const total = tarjetas.length
  if (!fila) return { ...res, ok: false, fallas: ['no está la fila (ul con data-lenis-prevent-horizontal)'] }
  // Hidratada y medida: la fila de los botones deja de estar invisible (si las tarjetas desbordan).
  for (let i = 0; i < 100 && botones[0]?.parentElement.classList.contains('invisible'); i++) await espera(50)
  const desborda = fila.scrollWidth - fila.clientWidth > 1
  res.tarjetas = total
  res.desborda = desborda

  // La fila.
  const estilo = getComputedStyle(fila)
  if (estilo.overflowX !== 'auto') falla(`la fila tiene overflow-x ${estilo.overflowX}`)
  if (!/x mandatory/.test(estilo.scrollSnapType)) falla(`la fila tiene scroll-snap-type "${estilo.scrollSnapType}" (esperaba x mandatory después de hidratar)`)
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth) falla('la página tiene scroll horizontal')
  if (vivo?.textContent !== '') falla(`la región viva no está vacía al cargar ("${vivo?.textContent}")`)
  // Las tarjetas: el título es el enlace, "leer más" aria-hidden.
  for (const [i, li] of tarjetas.entries()) {
    const a = li.querySelector('h3 a[href]')
    if (!a || !a.textContent.trim()) falla(`la tarjeta ${i + 1} no tiene el enlace en el título`)
    if (li.querySelectorAll('a[href]').length !== 1) falla(`la tarjeta ${i + 1} tiene ${li.querySelectorAll('a[href]').length} enlaces`)
    const leer = [...li.querySelectorAll('p')].find((p) => p.getAttribute('aria-hidden') === 'true')
    if (!leer) falla(`la tarjeta ${i + 1}: "leer más" no es aria-hidden`)
  }
  if (total < 2) return { ...res, ok: res.fallas.length === 0, nota: 'una sola tarjeta: sin botones' }
  if (botones.length !== 2) falla(`hay ${botones.length} botones (esperaba Anterior y Siguiente)`)
  const [anterior, siguiente] = botones
  for (const b of botones) {
    if (b.getAttribute('aria-controls') !== fila.id) falla('un botón no apunta a la fila (aria-controls)')
    if (!b.querySelector('.sr-only')?.textContent.trim()) falla('un botón no tiene nombre')
  }
  if (!desborda) return { ...res, ok: res.fallas.length === 0, nota: 'entran todas: los botones quedan invisibles' }

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
  const primeraEntera = () => {
    const i = tarjetas.findIndex((li) => li.offsetLeft - fila.scrollLeft >= 7)
    return i < 0 ? total : i + 1
  }
  const anotar = (paso) => {
    const n = primeraEntera()
    const visto = contador?.textContent
    res.pasos.push(`${paso}: x=${Math.round(fila.scrollLeft)} contador=${visto} vivo="${vivo.textContent}" ant=${anterior.getAttribute('aria-disabled')} sig=${siguiente.getAttribute('aria-disabled')}`)
    return { n, visto }
  }
  if (contador?.textContent !== `1/${total}`) falla(`el contador al cargar dice "${contador?.textContent}"`)
  if (anterior.getAttribute('aria-disabled') !== 'true') falla('al cargar, Anterior no está deshabilitado')
  if (siguiente.getAttribute('aria-disabled') !== 'false') falla('al cargar, Siguiente está deshabilitado')

  // Siguiente hasta el final.
  let previo = 1
  for (let i = 0; i < total + 1 && siguiente.getAttribute('aria-disabled') === 'false'; i++) {
    siguiente.click()
    await quieta()
    const { n, visto } = anotar(`Siguiente ${i + 1}`)
    if (n <= previo) falla(`Siguiente ${i + 1}: la fila no avanzó (primera entera ${n})`)
    if (visto !== `${n}/${total}`) falla(`Siguiente ${i + 1}: el contador dice ${visto} y la primera entera es la ${n}`)
    if (vivo.textContent !== `Novedad ${n} de ${total}`) falla(`Siguiente ${i + 1}: la región viva dice "${vivo.textContent}"`)
    previo = n
  }
  if (siguiente.getAttribute('aria-disabled') !== 'true') falla('al final, Siguiente no quedó deshabilitado')
  if (Math.abs(fila.scrollLeft - (fila.scrollWidth - fila.clientWidth)) > 2) falla('Siguiente no llegó al final de la fila')
  // Anterior una vez.
  anterior.click()
  await quieta()
  const atras = anotar('Anterior')
  if (atras.n >= previo) falla('Anterior: la fila no volvió')
  if (vivo.textContent !== `Novedad ${atras.n} de ${total}`) falla(`Anterior: la región viva dice "${vivo.textContent}"`)

  // Los textos que toma la región viva (cada uno es un aviso si no está vacío), con un MutationObserver.
  const escritos = []
  new MutationObserver(() => escritos.push(vivo.textContent)).observe(vivo, { childList: true, characterData: true, subtree: true })
  const avisos = (desde) => escritos.slice(desde).filter((t) => t !== '')
  // El scroll de la fila (trackpad, dedo) no avisa nada: la región se vacía (lo que decía ya no vale) o queda igual.
  const antesVivo = vivo.textContent
  let desde = escritos.length
  fila.scrollTo({ left: 0, behavior: 'instant' })
  await quieta()
  anotar('scroll a mano al principio')
  if (avisos(desde).length) falla(`el scroll a mano avisó ${JSON.stringify(avisos(desde))}`)
  if (vivo.textContent !== antesVivo && vivo.textContent !== '') falla(`el scroll a mano cambió la región viva ("${vivo.textContent}")`)
  if (contador?.textContent !== `1/${total}`) falla(`al volver al principio el contador dice ${contador?.textContent}`)
  // R1-01 de la re-verificación: Siguiente después del scroll a mano vuelve a avisar, aunque sea el mismo texto que el
  // último aviso (Siguiente hasta la 2, a mano al principio y Siguiente otra vez: "Novedad 2 de total" dos veces).
  siguiente.click()
  await quieta()
  const segunda = anotar('Siguiente, a mano al principio y Siguiente otra vez').n
  if (vivo.textContent !== `Novedad ${segunda} de ${total}`) falla(`la región viva dice "${vivo.textContent}"`)
  desde = escritos.length
  fila.scrollTo({ left: 0, behavior: 'instant' })
  await quieta()
  siguiente.click()
  await quieta()
  anotar('otra vez')
  if (avisos(desde).join() !== `Novedad ${segunda} de ${total}`) falla(`R1-01: el mismo aviso no volvió a sonar (${JSON.stringify(escritos.slice(desde))})`)
  // El foco en una tarjeta cortada la trae entera, sin avisar nada.
  desde = escritos.length
  const ultima = tarjetas[total - 1]
  ultima.querySelector('h3 a').focus()
  await quieta()
  const r = ultima.getBoundingClientRect()
  const f = fila.getBoundingClientRect()
  anotar('foco en la última tarjeta')
  if (r.left < f.left - 1 || r.right > f.right + 1) falla(`con el foco, la última tarjeta no se ve entera (${Math.round(r.left)}..${Math.round(r.right)} en ${Math.round(f.left)}..${Math.round(f.right)})`)
  if (avisos(desde).length) falla(`el foco en una tarjeta avisó ${JSON.stringify(avisos(desde))}`)
  document.activeElement?.blur()

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
  res.ok = res.fallas.length === 0
  return res
})()
