(async () => {
  // Expresión para measure.mjs: recorre el mosaico de fotos de Obra histórica (debajo de la línea de tiempo) y comprueba
  // que las fotos aparezcan de a una con el scroll, en orden, que cada cambio anime solo la que cambia, que al volver
  // para arriba desaparezcan en el orden inverso y que no haya scroll horizontal.
  // Uso: node tools/measure.mjs 1440 900 "$(cat tools/mosaico-check.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const mosaico = document.querySelector('#obra ul[data-mosaico]');
  const fotos = [...mosaico.children];
  const top0 = mosaico.getBoundingClientRect().top + scrollY;
  const alto = innerHeight;
  const recorrido = Math.max(mosaico.offsetHeight, alto * 0.75);
  const res = { ancho: innerWidth, fotos: fotos.length, altoMosaico: mosaico.offsetHeight, recorrido, pasos: [], fallas: [] };
  const visible = (n) => {
    const e = getComputedStyle(n);
    return e.visibility === 'visible' && Number(e.opacity) > 0.99 && (e.translate === 'none' || e.translate === '0px');
  };
  // Progreso p -> scroll: p = 0 cuando el borde de arriba entra por el 90 % de la pantalla.
  const ir = async (p) => {
    scrollTo({ top: Math.round(top0 - alto * 0.9 + p * recorrido), behavior: 'instant' });
    await raf(); await raf();
    const animando = fotos.filter((f) => f.getAnimations().length).length;
    await Promise.all(fotos.flatMap((f) => f.getAnimations().map((a) => a.finished.catch(() => {})))); await raf(); await raf();
    return animando;
  };
  // [progreso, fotos visibles esperadas]: cambian a mitad de cada tramo (1/5 por foto, con histéresis de 0,1 tramo).
  const casos = [[-0.2, 0], [0.05, 0], [0.15, 1], [0.35, 2], [0.55, 3], [0.75, 4], [0.95, 5], [1.2, 5], [0.55, 3], [0.05, 0]];
  let anterior = 0;
  for (const [p, esperadas] of casos) {
    const animando = await ir(p);
    const vistas = fotos.map(visible);
    const cantidad = vistas.filter(Boolean).length;
    res.pasos.push(`${p} -> ${vistas.map((v) => (v ? 'o' : 'x')).join('')} (${cantidad}) animando=${animando}`);
    if (cantidad !== esperadas) res.fallas.push(`p=${p}: se ven ${cantidad} fotos, esperaba ${esperadas}`);
    // Tienen que ser las primeras: aparecen en orden.
    vistas.forEach((v, i) => { if (v !== i < esperadas) res.fallas.push(`p=${p}: la foto ${i} ${v ? 'se ve' : 'no se ve'}`); });
    if (esperadas === anterior && animando > 0) res.fallas.push(`p=${p}: ${animando} fotos animando sin cambio`);
    if (esperadas !== anterior && animando > Math.abs(esperadas - anterior)) {
      res.fallas.push(`p=${p}: ${animando} fotos animando para ${Math.abs(esperadas - anterior)} cambio(s)`);
    }
    anterior = esperadas;
  }
  if (document.documentElement.scrollWidth > innerWidth) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
