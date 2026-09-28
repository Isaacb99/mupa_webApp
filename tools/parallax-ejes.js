(async () => {
  // Expresión para measure.mjs: recorre la sección Identidad (carrusel de los ejes en un marco fijo) y comprueba que en
  // cada tramo se vea el eje que corresponde: su foto en el marco (las otras corridas un ancho de marco a cada lado) y
  // su texto visible (los otros transparentes y ocultos), un solo paso por cambio (nada animando si no cambió la
  // parada), que el bloque quede enganchado arriba (en su top de CSS) mientras dura el efecto, que no haya scroll
  // horizontal y, en lg, que el recuadro de la etiqueta (V03) se superponga al borde izquierdo de la foto sin estirar
  // la columna de texto.
  // Uso: node tools/measure.mjs 1366 657 "$(cat tools/parallax-ejes.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const bloque = document.getElementById('identidad').firstElementChild;
  const fijo = bloque.firstElementChild;
  const marco = fijo.querySelector('[data-marco]');
  const fotos = [...marco.children];
  const columna = fijo.querySelector('[data-textos]');
  // Solo los artículos: el marco naranja vive en la misma columna y no se anima (por eso se mide aparte).
  const textos = [...columna.children].filter((n) => n.tagName === 'ARTICLE');
  const recuadro = columna.querySelector(':scope > div[aria-hidden]');
  const top0 = bloque.getBoundingClientRect().top + scrollY;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  // Recorrido de los ejes: el del bloque menos la cola (data-cola), en la que el último eje queda quieto antes de soltarse.
  const cola = bloque.querySelector('[data-cola]')?.offsetHeight ?? 0;
  const recorrido = bloque.offsetHeight - fijo.offsetHeight - cola;
  const ancho = marco.clientWidth;
  const lg = innerWidth >= 1024;
  const res = { ancho: innerWidth, marco: ancho, recorrido, cola, ejes: fotos.length, overflowX: document.documentElement.scrollWidth > innerWidth, pasos: [], fallas: [] };
  const visible = (n) => getComputedStyle(n).visibility === 'visible' && getComputedStyle(n).opacity === '1';
  const todos = [...fotos, ...textos];
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
    const vTextos = textos.map(visible);
    const top = Math.round(fijo.getBoundingClientRect().top);
    res.pasos.push(`${p} -> eje ${eje} pos=[${pos.map((x) => x.toFixed(2)).join(',')}] textos=${vTextos.map((v) => (v ? 'o' : 'x')).join('')} animando=${animando} fijoTop=${top}`);
    if (eje !== esperado) res.fallas.push(`p=${p}: eje ${eje}, esperado ${esperado}`);
    pos.forEach((x, i) => { if (Math.abs(x - (i - esperado)) > 0.002) res.fallas.push(`p=${p}: la foto ${i} está en ${x.toFixed(3)} anchos, esperado ${i - esperado}`); });
    vTextos.forEach((v, i) => { if (v !== (i === esperado)) res.fallas.push(`p=${p}: texto ${i} ${v ? 'visible' : 'oculto'}`); });
    if (esperado === anterior && animando > 0) res.fallas.push(`p=${p}: ${animando} nodos animando sin cambio de eje`);
    // ±1 px: el alto del bloque en svh puede dar medio píxel, y justo al soltarse el redondeo lo corre.
    if (enganchado && Math.abs(top - topFijo) > 1) res.fallas.push(`p=${p}: no está enganchado (top ${top})`);
    if (lg && enganchado) {
      // Marco de la etiqueta (V03): arranca con la columna, se pasa de su ancho y se superpone ~110 px a la foto. Desde
      // el V04 el título va en la columna, arriba de la etiqueta, y la foto arranca en la tinta del título: el recuadro
      // queda ~233 px (a 1440) por debajo del borde de arriba de la foto, y la foto a ~58 px del borde del bloque fijo.
      const caja = recuadro.getBoundingClientRect();
      const foto = marco.getBoundingClientRect();
      const titulo = document.getElementById('identidad-titulo').getBoundingClientRect();
      const solape = caja.right - foto.left;
      const parrafo = textos[esperado].querySelector('p').getBoundingClientRect().width;
      res.etiqueta = { ancho: +caja.width.toFixed(1), solape: +solape.toFixed(1), parrafo: +parrafo.toFixed(1), bajoFoto: +(caja.top - foto.top).toFixed(1), fotoTop: +(foto.top - top).toFixed(1), tituloTop: +(titulo.top - top).toFixed(1) };
      if (solape < 60 || solape > 160) res.fallas.push(`p=${p}: el recuadro se superpone ${solape.toFixed(1)} px a la foto`);
      if (caja.top - foto.top < 150 || caja.top - foto.top > 300) res.fallas.push(`p=${p}: el recuadro está a ${(caja.top - foto.top).toFixed(1)} px de la foto (esperaba ~233)`);
      if (Math.abs(foto.top - titulo.top - 10) > 6) res.fallas.push(`p=${p}: la foto no arranca en la tinta del título (${(foto.top - titulo.top).toFixed(1)} px bajo su caja, esperaba ~10)`);
      if (foto.right < innerWidth - 1) res.fallas.push(`p=${p}: la foto no llega al borde derecho (${foto.right.toFixed(1)})`);
      if (recuadro.getAnimations().length) res.fallas.push(`p=${p}: el marco está animando (tiene que quedarse quieto)`);
      if (parrafo > 420) res.fallas.push(`p=${p}: el recuadro estira la columna de texto (${parrafo.toFixed(1)} px)`);
    }
    anterior = esperado;
  }
  if (res.overflowX) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
