(async () => {
  // Expresión para measure.mjs: recorre la línea de tiempo de Obra histórica con cuatro gestos (rueda con scroll suave
  // de Chrome: muescas de 100 px repartidas en 12 frames con ease-in-out; muescas instantáneas; flicks de 500 px; un
  // salto directo), muestreando cada frame qué hito está en blanco y el color real de cada uno. Comprueba que el
  // resaltado pase por todos los hitos de a uno (nunca saltea), que cada uno llegue al blanco pleno (R >= 250) y quede
  // encendido al menos 280 ms (el piso de useHitoActivo es 300), y que termine en el hito que corresponde a la posición
  // final. Sirve en los dos modos: lista enganchada (el hito es la parada del recorrido del bloque; se comprueba además
  // que la lista quede enganchada a su top, que entre en la pantalla y que el top sea de al menos 32 px) y lista suelta
  // (pantallas bajas o reduced-motion: línea de lectura al 55 %).
  // Uso: node tools/measure.mjs 1440 900 "$(cat tools/hitos-check.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // Hasta el primer gesto (rueda, tecla, toque) el hook pinta directo, sin recorrido: un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const ol = document.querySelector('#obra ol');
  const items = [...ol.children];
  const fijo = ol.parentElement;
  const bloque = fijo.parentElement;
  const enganchado = getComputedStyle(fijo).position === 'sticky';
  const activo = () => items.findIndex((li) => li.className.includes('text-paper'));
  const rojo = (li) => parseInt(getComputedStyle(li).color.match(/\d+/)[0], 10);
  const linea = innerHeight * 0.55;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  const recorrido = bloque.offsetHeight - fijo.offsetHeight;
  const res = { ancho: innerWidth, alto: innerHeight, hitos: items.length, modo: enganchado ? 'enganchada' : 'suelta', recorrido: enganchado ? recorrido : 0, tramos: [], fallas: [] };
  // Hito esperado para la posición de scroll actual (sin histéresis: los extremos de cada tramo quedan lejos de los umbrales).
  const esperado = () => {
    if (!enganchado) return items.reduce((acc, li, i) => (li.getBoundingClientRect().top <= linea ? i : acc), 0);
    const p = Math.min(Math.max((topFijo - bloque.getBoundingClientRect().top) / recorrido, 0), 1);
    return Math.round(p * (items.length - 1));
  };
  res.topFijo = topFijo;
  if (enganchado && topFijo + fijo.offsetHeight > innerHeight) res.fallas.push(`la lista enganchada (top ${topFijo} + ${fijo.offsetHeight} px) no entra en la pantalla (${innerHeight} px)`);
  if (enganchado && topFijo < 32) res.fallas.push(`la lista se engancha a ${topFijo} px del borde (mínimo 32)`);

  // Recorre de `desde` a `hasta` con el gesto `mover(y0, y1)` (que scrollea y muestrea) en pasos de `salto` px.
  async function recorrer(nombre, desde, hasta, salto, mover) {
    scrollTo({ top: desde, behavior: 'instant' });
    await raf(); await raf();
    // Espera a que termine el recorrido que dejó el tramo anterior (hasta 6 hitos x 300 ms).
    await new Promise((r) => setTimeout(r, 2200));
    const vistos = [];
    const maxRojo = items.map(() => 0);
    let ultimo = activo(), t0 = performance.now();
    let seSolto = false;
    const muestrear = () => {
      items.forEach((li, i) => { maxRojo[i] = Math.max(maxRojo[i], rojo(li)); });
      const a = activo();
      if (a !== ultimo) { vistos.push([ultimo, Math.round(performance.now() - t0)]); ultimo = a; t0 = performance.now(); }
      if (enganchado) {
        const p = (topFijo - bloque.getBoundingClientRect().top) / recorrido;
        if (p > 0.02 && p < 0.98 && Math.abs(fijo.getBoundingClientRect().top - topFijo) > 1) seSolto = true;
      }
    };
    for (let y = desde; salto > 0 ? y < hasta : y > hasta; y += salto) {
      const y1 = salto > 0 ? Math.min(y + salto, hasta) : Math.max(y + salto, hasta);
      await mover(y, y1, muestrear);
    }
    // Después del último gesto, tiempo para que el recorrido llegue al final y termine el fundido (hasta 5 x 300 + 300 ms).
    for (let f = 0; f < 150; f++) { await raf(); muestrear(); }
    vistos.push([ultimo, Math.round(performance.now() - t0)]);
    const secuencia = vistos.map(([i]) => i);
    const esperadoFinal = esperado();
    const [a, b] = [Math.min(secuencia[0], esperadoFinal), Math.max(secuencia[0], esperadoFinal)];
    const saltos = secuencia.slice(1).filter((v, i) => Math.abs(v - secuencia[i]) !== 1);
    const cortos = vistos.slice(1, -1).filter(([, ms]) => ms < 280);
    const apagados = items.map((_, i) => i).filter((i) => i >= a && i <= b && maxRojo[i] < 250);
    res.tramos.push(`${nombre}: ${vistos.map(([i, ms]) => `${i}(${ms}ms)`).join(' > ')} final esperado ${esperadoFinal}; rojo máx [${maxRojo.join(', ')}]`);
    if (saltos.length) res.fallas.push(`${nombre}: la secuencia saltea hitos (${secuencia.join('>')})`);
    if (cortos.length) res.fallas.push(`${nombre}: hitos intermedios de menos de 280 ms (${cortos.map(([i, ms]) => `${i}:${ms}`).join(', ')})`);
    if (apagados.length) res.fallas.push(`${nombre}: hitos que no llegan al blanco (${apagados.map((i) => `${i}:${maxRojo[i]}`).join(', ')})`);
    if (secuencia[secuencia.length - 1] !== esperadoFinal) res.fallas.push(`${nombre}: termina en ${secuencia[secuencia.length - 1]}, esperado ${esperadoFinal}`);
    if (seSolto) res.fallas.push(`${nombre}: el bloque no quedó enganchado durante el recorrido`);
  }

  // Gestos. instantaneo: un scrollTo y 6 frames de muestreo. suave: la curva de la rueda de Chrome, 12 frames ease-in-out
  // y 6 frames de pausa (como muescas seguidas a ritmo normal).
  const instantaneo = async (y0, y1, muestrear) => { scrollTo({ top: y1, behavior: 'instant' }); for (let f = 0; f < 6; f++) { await raf(); muestrear(); } };
  const suave = async (y0, y1, muestrear) => {
    for (let f = 1; f <= 12; f++) {
      const t = f / 12, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      scrollTo({ top: Math.round(y0 + (y1 - y0) * e), behavior: 'instant' });
      await raf(); muestrear();
    }
    for (let f = 0; f < 6; f++) { await raf(); muestrear(); }
  };

  let inicio, fin;
  if (enganchado) {
    const top0 = bloque.getBoundingClientRect().top + scrollY;
    inicio = Math.round(top0 - topFijo - 60);
    fin = Math.round(top0 - topFijo + recorrido + 60);
  } else {
    const tops = items.map((li) => li.getBoundingClientRect().top + scrollY);
    inicio = Math.round(tops[0] - linea - 60);
    fin = Math.round(tops[tops.length - 1] - linea + 60);
  }
  await recorrer('rueda suave bajando', inicio, fin, 100, suave);
  await recorrer('rueda suave subiendo', fin, inicio, -100, suave);
  await recorrer('muescas instantáneas', inicio, fin, 100, instantaneo);
  await recorrer('flick bajando', inicio, fin, 500, instantaneo);
  await recorrer('salto directo', inicio, fin, fin - inicio, instantaneo);
  res.ok = res.fallas.length === 0;
  return res;
})()
