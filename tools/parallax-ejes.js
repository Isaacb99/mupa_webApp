(async () => {
  // Expresión para measure.mjs: recorre la sección Identidad (carrusel de los ejes en un marco fijo) y comprueba que en
  // cada tramo se vea el eje que corresponde: su foto en el marco (las otras corridas un ancho de marco a cada lado), su
  // texto y su palabra visibles (los otros transparentes y ocultos), un solo paso por cambio (nada animando si no cambió
  // la parada), que el bloque quede enganchado arriba (en su top de CSS) mientras dura el efecto, que no haya scroll
  // horizontal y, en lg, que la baseline de la palabra grande quede apoyada en el borde de abajo de la foto.
  // Uso: node tools/measure.mjs 1366 657 "$(cat tools/parallax-ejes.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const bloque = document.getElementById('identidad').firstElementChild;
  const fijo = bloque.firstElementChild;
  const marco = fijo.querySelector('[data-marco]');
  const fotos = [...marco.children];
  const textos = [...fijo.querySelector('[data-textos]').children];
  const palabras = [...fijo.querySelector('[data-palabras]').children];
  const top0 = bloque.getBoundingClientRect().top + scrollY;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  // Recorrido de los ejes: el del bloque menos la cola (data-cola), en la que el último eje queda quieto antes de soltarse.
  const cola = bloque.querySelector('[data-cola]')?.offsetHeight ?? 0;
  const recorrido = bloque.offsetHeight - fijo.offsetHeight - cola;
  const ancho = marco.clientWidth;
  const lg = innerWidth >= 1024;
  const res = { ancho: innerWidth, marco: ancho, recorrido, cola, ejes: fotos.length, overflowX: document.documentElement.scrollWidth > innerWidth, pasos: [], fallas: [] };
  const visible = (n) => getComputedStyle(n).visibility === 'visible' && getComputedStyle(n).opacity === '1';
  const todos = [...fotos, ...textos, ...palabras];
  // [progreso, eje esperado, enganchado]; después del 1, la cola: sigue enganchado con el último eje hasta 1 + cola.
  const finCola = 1 + cola / recorrido;
  const casos = [[-0.2, 0, false], [0, 0, true], [0.2, 0, true], [0.35, 1, true], [0.5, 1, true], [0.65, 1, true], [0.85, 2, true], [1, 2, true], [(1 + finCola) / 2, 2, true], [finCola - 0.02, 2, true], [finCola + 0.2, 2, false], [0.5, 1, true], [0.1, 0, true]];
  let anterior = 0;
  for (const [p, esperado, enganchado] of casos) {
    scrollTo({ top: Math.round(top0 - topFijo + p * recorrido), behavior: 'instant' });
    await raf(); await raf();
    const animando = todos.filter((n) => n.getAnimations().length).length;
    await Promise.all(todos.flatMap((n) => n.getAnimations().map((a) => a.finished.catch(() => {})))); await raf(); await raf();
    const marcoIzq = marco.getBoundingClientRect().left;
    const pos = fotos.map((f) => (f.getBoundingClientRect().left - marcoIzq) / ancho);
    const eje = pos.findIndex((x) => Math.abs(x) < 0.002);
    const vTextos = textos.map(visible), vPalabras = palabras.map(visible);
    const top = Math.round(fijo.getBoundingClientRect().top);
    res.pasos.push(`${p} -> eje ${eje} pos=[${pos.map((x) => x.toFixed(2)).join(',')}] textos=${vTextos.map((v) => (v ? 'o' : 'x')).join('')} palabras=${vPalabras.map((v) => (v ? 'o' : 'x')).join('')} animando=${animando} fijoTop=${top}`);
    if (eje !== esperado) res.fallas.push(`p=${p}: eje ${eje}, esperado ${esperado}`);
    pos.forEach((x, i) => { if (Math.abs(x - (i - esperado)) > 0.002) res.fallas.push(`p=${p}: la foto ${i} está en ${x.toFixed(3)} anchos, esperado ${i - esperado}`); });
    vTextos.forEach((v, i) => { if (v !== (i === esperado)) res.fallas.push(`p=${p}: texto ${i} ${v ? 'visible' : 'oculto'}`); });
    vPalabras.forEach((v, i) => { if (v !== (i === esperado)) res.fallas.push(`p=${p}: palabra ${i} ${v ? 'visible' : 'oculta'}`); });
    if (esperado === anterior && animando > 0) res.fallas.push(`p=${p}: ${animando} nodos animando sin cambio de eje`);
    // ±1 px: el alto del bloque en svh puede dar medio píxel, y justo al soltarse el redondeo lo corre.
    if (enganchado && Math.abs(top - topFijo) > 1) res.fallas.push(`p=${p}: no está enganchado (top ${top})`);
    if (lg) {
      // Baseline de la palabra = borde de abajo de la foto (el rect del texto termina en la baseline más el descenso, 0,275 em).
      const pal = palabras[esperado];
      const rango = document.createRange(); rango.selectNodeContents(pal);
      const baseline = rango.getBoundingClientRect().bottom - 0.275 * parseFloat(getComputedStyle(pal).fontSize);
      const fotoAbajo = fotos[esperado].getBoundingClientRect().bottom;
      if (Math.abs(baseline - fotoAbajo) > 2) res.fallas.push(`p=${p}: la palabra no apoya en la foto (baseline ${baseline.toFixed(1)}, foto ${fotoAbajo.toFixed(1)})`);
      res.alineacion = +(baseline - fotoAbajo).toFixed(1);
    }
    anterior = esperado;
  }
  if (res.overflowX) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
