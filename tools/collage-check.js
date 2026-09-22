(async () => {
  // Expresión para measure.mjs: recorre el collage enganchado de Identidad (las fotos salen del montón de a una con el
  // scroll) y comprueba que en cada tramo estén fuera exactamente las fotos que corresponden (las de adelante), que las
  // que salieron hayan subido hasta pasar el borde de arriba de la pantalla (y queden con visibility hidden: sin puntero
  // ni lector), sin fundidos, y las demás en su lugar; que cada cambio anime solo las fotos que cambian, que el bloque
  // quede enganchado arriba mientras dura el efecto y que la caja entre entera en la pantalla.
  // Uso: node tools/measure.mjs 1440 900 "$(cat tools/collage-check.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const bloque = document.getElementById('identidad-collage');
  const fijo = bloque.firstElementChild;
  const caja = bloque.querySelector('[data-caja]');
  const fotos = [...caja.children];
  const n = fotos.length;
  const top0 = bloque.getBoundingClientRect().top + scrollY;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  const recorrido = bloque.offsetHeight - fijo.offsetHeight;
  const cajaRect = caja.getBoundingClientRect();
  const res = {
    ancho: innerWidth, alto: innerHeight, recorrido, fotos: n, caja: [Math.round(cajaRect.width), Math.round(cajaRect.height)],
    overflowX: document.documentElement.scrollWidth > innerWidth, pasos: [], fallas: [],
  };
  if (cajaRect.height > innerHeight) res.fallas.push(`la caja (${Math.round(cajaRect.height)} px) no entra en la pantalla`);
  // [progreso, fotos fuera esperadas, enganchado]. Los umbrales del motor están a 1/8, 3/8, 5/8 y 7/8 (con histéresis).
  const casos = [[-0.2, 0, false], [0, 0, true], [0.2, 1, true], [0.3, 1, true], [0.45, 2, true], [0.7, 3, true], [0.95, 4, true], [1, 4, true], [1.2, 4, false], [0.45, 2, true], [0.05, 0, true]];
  let fueraAntes = 0;
  for (const [p, esperadas, enganchado] of casos) {
    scrollTo({ top: Math.round(top0 - topFijo + p * recorrido), behavior: 'instant' });
    await raf(); await raf();
    const animando = fotos.filter((f) => f.getAnimations().length).length;
    await Promise.all(fotos.flatMap((f) => f.getAnimations().map((a) => a.finished.catch(() => {}))));
    await raf(); await raf();
    const fuera = fotos.map((f) => f.dataset.fuera === '1');
    const cuantas = fuera.filter(Boolean).length;
    const top = Math.round(fijo.getBoundingClientRect().top);
    res.pasos.push(`${p} -> fuera ${cuantas} [${fuera.map((x) => (x ? 'x' : 'o')).join('')}] animaron=${animando} fijoTop=${top}`);
    if (cuantas !== esperadas) res.fallas.push(`p=${p}: ${cuantas} fotos fuera, esperadas ${esperadas}`);
    fuera.forEach((x, i) => {
      if (x !== i >= n - esperadas) res.fallas.push(`p=${p}: la foto ${i} ${x ? 'salió' : 'quedó'} y no correspondía`);
      const t = getComputedStyle(fotos[i]).translate;
      const v = getComputedStyle(fotos[i]).visibility;
      const r = fotos[i].getBoundingClientRect();
      if (getComputedStyle(fotos[i]).opacity !== '1') res.fallas.push(`p=${p}: la foto ${i} no está opaca (sin fundidos)`);
      // Fuera = subió hasta pasar el borde de arriba de la pantalla (mientras la caja está enganchada).
      if (x && enganchado && r.bottom > 0) res.fallas.push(`p=${p}: la foto ${i} salió pero se sigue viendo (bottom ${Math.round(r.bottom)})`);
      if (!x && t !== 'none' && t !== '0px 0px' && t !== '0px') res.fallas.push(`p=${p}: la foto ${i} está corrida (${t})`);
      // Las que salieron no deben recibir el puntero ni figurar para el lector: visibility hidden.
      if (x && v !== 'hidden') res.fallas.push(`p=${p}: la foto ${i} salió pero sigue visible para el puntero (${v})`);
      if (!x && v !== 'visible') res.fallas.push(`p=${p}: la foto ${i} quedó pero está oculta (${v})`);
    });
    // La foto que se ve en el centro de la caja tiene que ser la que recibe el puntero.
    const r = caja.getBoundingClientRect();
    const golpe = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const idx = fotos.findIndex((f) => f.contains(golpe));
    if (idx >= 0 && fuera[idx]) res.fallas.push(`p=${p}: el puntero en el centro cae en la foto ${idx}, que ya salió`);
    if (animando > Math.abs(esperadas - fueraAntes)) res.fallas.push(`p=${p}: animaron ${animando} fotos y cambiaron ${Math.abs(esperadas - fueraAntes)}`);
    // ±1 px: el alto del bloque en svh puede dar medio píxel, y justo al soltarse el redondeo lo corre.
    if (enganchado && Math.abs(top - topFijo) > 1) res.fallas.push(`p=${p}: no está enganchado (top ${top})`);
    fueraAntes = esperadas;
  }
  if (res.overflowX) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
