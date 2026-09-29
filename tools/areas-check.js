(async () => {
  // Expresión para measure.mjs: recorre la cabecera de Áreas (las cuatro etiquetas y las piedras de la marca MuPa del
  // patrón, que se encienden con el scroll) y comprueba que se enciendan de a una y en orden al bajar, que al final
  // estén las cuatro (y las cuatro piedras de la marca que se ve en ese tamaño), que al subir se apaguen en orden
  // inverso, que el color de fondo de la etiqueta encendida sea el de su banda y que no haya scroll horizontal. Detecta
  // el modo: bloque enganchado (debajo de lg, si entra en la pantalla: comprueba además que quede fijo en su top
  // mientras se encienden y que se suelte después) o suelto (lg, pantallas bajas, reduced-motion).
  // Uso: node tools/measure.mjs 1440 900 "$(cat tools/areas-check.js)" [--url ...]   (debe dar ok: true)
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  // El motor no anima hasta el primer gesto (rueda, tecla, toque): un wheel sintético lo habilita.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
  const lista = document.querySelector('#areas ul[role="list"]');
  const etiquetas = [...lista.querySelectorAll('li')];
  // La marca que se ve en este tamaño (hay una en escritorio, colgada de la lista, y otra en celular, en su franja).
  const marca = [...document.querySelectorAll('#areas svg[data-marca]')].find((s) => getComputedStyle(s).display !== 'none');
  const piedras = [...(marca?.querySelectorAll('path') ?? [])];
  const fijo = lista.parentElement;
  const bloque = fijo.parentElement;
  const enganchado = getComputedStyle(fijo).position === 'sticky';
  const alto = innerHeight;
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0;
  const top0 = (enganchado ? bloque : lista).getBoundingClientRect().top + scrollY;
  const recorrido = enganchado ? bloque.offsetHeight - fijo.offsetHeight : Math.max(alto * 0.55, lista.offsetHeight * 1.2);
  const res = { ancho: innerWidth, alto, modo: enganchado ? 'enganchado' : 'suelto', topFijo, etiquetas: etiquetas.length, piedras: piedras.length, recorrido, pasos: [], fallas: [] };
  const fondo = (n) => getComputedStyle(n).backgroundColor;
  const encendida = (n) => n.hasAttribute('data-activa');
  const apagadoFondo = 'rgba(0, 0, 0, 0)';
  if (enganchado && fijo.offsetHeight + 64 > alto) res.fallas.push(`el bloque fijo (${fijo.offsetHeight} px) no entra en la pantalla con 2rem de margen`);
  // Progreso p -> scroll. Enganchado: 0 cuando el bloque llega a su top, 1 cuando se suelta. Suelto: 0 cuando el borde
  // de arriba de la lista pasa el 75 % de la pantalla.
  const ir = async (p) => {
    scrollTo({ top: Math.round(enganchado ? top0 - topFijo + p * recorrido : top0 - alto * 0.75 + p * recorrido), behavior: 'instant' });
    await raf(); await raf();
    // Las transiciones de CSS: 350 ms al encender, 500 al apagar.
    await espera(650);
    await raf();
  };
  // [progreso, encendidas esperadas]: cambian a mitad de cada tramo (1/4 por etiqueta, con histéresis de 0,1 tramo).
  const casos = [[-0.2, 0], [0.05, 0], [0.2, 1], [0.45, 2], [0.7, 3], [0.95, 4], [1.2, 4], [0.7, 3], [0.2, 1], [-0.1, 0]];
  for (const [p, esperadas] of casos) {
    await ir(p);
    const vistas = etiquetas.map(encendida);
    const cantidad = vistas.filter(Boolean).length;
    const fondos = etiquetas.map(fondo);
    const piedrasOn = piedras.map((n) => getComputedStyle(n).opacity === '1');
    const top = Math.round(fijo.getBoundingClientRect().top);
    res.pasos.push(`${p} -> ${vistas.map((v) => (v ? 'o' : 'x')).join('')} (${cantidad}) piedras=${piedrasOn.map((v) => (v ? 'o' : 'x')).join('')} fijoTop=${top}`);
    if (cantidad !== esperadas) res.fallas.push(`p=${p}: ${cantidad} encendidas, esperaba ${esperadas}`);
    vistas.forEach((v, i) => {
      if (v !== i < esperadas) res.fallas.push(`p=${p}: la etiqueta ${i} ${v ? 'encendida' : 'apagada'} y no correspondía`);
      // Encendida: fondo de color; apagada: transparente (solo el borde).
      if (v && fondos[i] === apagadoFondo) res.fallas.push(`p=${p}: la etiqueta ${i} está encendida pero sin fondo`);
      if (!v && fondos[i] !== apagadoFondo) res.fallas.push(`p=${p}: la etiqueta ${i} está apagada pero con fondo (${fondos[i]})`);
    });
    if (piedras.length !== etiquetas.length) res.fallas.push(`hay ${piedras.length} piedras para ${etiquetas.length} etiquetas`);
    piedrasOn.forEach((v, i) => { if (v !== i < esperadas) res.fallas.push(`p=${p}: la piedra ${i} ${v ? 'pintada' : 'apagada'} y no correspondía`); });
    // Enganchado: el bloque queda en su top mientras dura el efecto (±1 px) y se suelta después.
    if (enganchado && p >= 0 && p <= 1 && Math.abs(top - topFijo) > 1) res.fallas.push(`p=${p}: el bloque no está enganchado (top ${top}, esperaba ${topFijo})`);
    if (enganchado && p > 1.1 && top >= topFijo - 1) res.fallas.push(`p=${p}: el bloque sigue enganchado después del recorrido (top ${top})`);
  }
  // La primera etiqueta encendida tiene que llevar el color de su banda (Ciencia: celeste).
  await ir(0.2);
  const banda = getComputedStyle(document.querySelector('#areas h3[data-cabecera]')).backgroundColor;
  if (fondo(etiquetas[0]) !== banda) res.fallas.push(`la etiqueta encendida tiene fondo ${fondo(etiquetas[0])} y la banda ${banda}`);
  if (document.documentElement.scrollWidth > innerWidth) res.fallas.push('scroll horizontal en la página');
  res.ok = res.fallas.length === 0;
  return res;
})()
