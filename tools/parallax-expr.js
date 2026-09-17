(async () => {
  const h1 = document.querySelector('h1'); if (!h1) return { error: 'sin h1 (¿error de render?)', root: document.getElementById('root').innerHTML.slice(0, 200) };
  const bloque = h1.querySelector('[aria-hidden]'); const spans = [...bloque.children];
  const fijas = spans.slice(0, 3), palabra = spans[3];
  const vh = innerHeight; const h1Top = h1.getBoundingClientRect().top + scrollY;
  const inicio = Math.min(0.8 * vh, h1Top), fin = Math.max(inicio - 0.5 * vh, 0.15 * vh);
  const rect = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; };
  const res = { ancho: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, font: getComputedStyle(h1).fontSize, h1Top: Math.round(h1Top), inicio: Math.round(inicio), fin: Math.round(fin),
    fijas: fijas.map(s => s.textContent + ' ' + JSON.stringify(rect(s))), palabra: palabra.textContent + ' ' + JSON.stringify(rect(palabra)), h1Derecha: Math.round(h1.getBoundingClientRect().right), parrafoIzq: Math.round(document.querySelector('p').getBoundingClientRect().left), pasos: [] };
  for (const p of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.3]) {
    const T = inicio - p * (inicio - fin); scrollTo({ top: Math.max(0, h1Top - T), behavior: 'instant' });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const yP = palabra.getBoundingClientRect().top;
    res.pasos.push(p + ' -> dy=[' + fijas.map(l => Math.round(yP - l.getBoundingClientRect().top)).join(', ') + '] scrollY=' + Math.round(scrollY));
  }
  return res;
})()
