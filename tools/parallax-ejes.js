(async () => {
  // Expresión para measure.mjs: recorre la sección Identidad (paneles de los ejes que se deslizan con el scroll) y
  // comprueba que en cada tramo se vea el panel que corresponde, en posición exacta, con un solo viaje por cambio,
  // que el bloque quede enganchado debajo del header mientras dura el efecto y que no haya scroll horizontal.
  // Uso: node tools/measure.mjs 1366 657 "$(cat tools/parallax-ejes.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const bloque = document.getElementById('identidad').firstElementChild;
  const fijo = bloque.firstElementChild; const ventana = fijo.children[1]; const pista = ventana.firstElementChild;
  const top0 = bloque.getBoundingClientRect().top + scrollY;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  const recorrido = bloque.offsetHeight - fijo.offsetHeight;
  const ancho = ventana.clientWidth;
  const res = { ancho, recorrido, paneles: pista.children.length, overflowX: document.documentElement.scrollWidth > innerWidth, pasos: [], fallas: [] };
  // [progreso, panel esperado, enganchado]
  const casos = [[-0.2, 0, false], [0, 0, true], [0.2, 0, true], [0.35, 1, true], [0.5, 1, true], [0.65, 1, true], [0.85, 2, true], [1, 2, true], [1.2, 2, false], [0.5, 1, true], [0.1, 0, true]];
  for (const [p, esperado, enganchado] of casos) {
    scrollTo({ top: Math.round(top0 - topFijo + p * recorrido), behavior: 'instant' });
    await raf(); await raf();
    const viajes = pista.getAnimations().length;
    await Promise.all(pista.getAnimations().map((a) => a.finished.catch(() => {}))); await raf(); await raf();
    const x = pista.getBoundingClientRect().left - ventana.getBoundingClientRect().left;
    const panel = -x / ancho; const top = Math.round(fijo.getBoundingClientRect().top);
    res.pasos.push(`${p} -> panel ${panel.toFixed(3)} viajes=${viajes} fijoTop=${top}`);
    if (Math.abs(panel - esperado) > 0.001) res.fallas.push(`p=${p}: panel ${panel.toFixed(3)}, esperado ${esperado}`);
    if (Math.abs(x - Math.round(x)) > 0.01) res.fallas.push(`p=${p}: posición no entera (${x})`);
    if (viajes > 1) res.fallas.push(`p=${p}: ${viajes} viajes a la vez`);
    // ±1 px: el alto del bloque en svh puede dar medio píxel, y justo al soltarse el redondeo lo corre.
    if (enganchado && Math.abs(top - topFijo) > 1) res.fallas.push(`p=${p}: no está enganchado (top ${top})`);
  }
  if (res.overflowX) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
