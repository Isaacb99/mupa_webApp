(async () => {
  // Expresión para measure.mjs: lo que parallax-check no puede ver porque depende del DOM (la compuerta de gesto y el
  // detector de saltos de useParallaxPalabra). Mide en un iframe recién cargado, así "antes de 1 s desde load" no
  // depende de cuándo evalúa measure.mjs. Devuelve ok: true si las cuatro reglas se cumplen.
  // Uso: node tools/measure.mjs 1366 657 "$(cat tools/parallax-compuerta.js)" [--url ...]
  const f = document.createElement('iframe');
  f.style.cssText = `position:fixed;inset:0;width:${innerWidth}px;height:${innerHeight}px;border:0;z-index:99999`;
  document.body.append(f);
  await new Promise((r) => { f.onload = r; f.src = location.href });
  const w = f.contentWindow, d = f.contentDocument;
  const cargado = performance.now();
  for (let i = 0; i < 100 && !d.querySelector('h1 [aria-hidden]'); i++) await new Promise((r) => setTimeout(r, 10));
  // Que se asiente la carga (primer aviso del IntersectionObserver, fuentes), sin llegar al segundo del temporizador.
  await new Promise((r) => setTimeout(r, 300));
  const raf = () => new Promise((r) => w.requestAnimationFrame(r));
  const b = d.querySelector('h1 [aria-hidden]'); const s = [...b.children]; const pal = s[3];
  const vh = w.innerHeight; const r0 = b.getBoundingClientRect(); const T0 = r0.top + w.scrollY;
  const inicio = Math.min(0.8 * vh, T0); let fin = Math.max(inicio - Math.max(0.6 * vh, 480), 0.15 * vh);
  if (w.matchMedia('(width < 64rem)').matches) fin = inicio - (inicio - fin) * 1.1; // debajo de lg, recorrido +10 %
  const T = (inicio - fin) / 2;
  const Y = (x) => Math.max(0, Math.round(T0 - inicio + x * T));
  const paso = Math.round((s[2].getBoundingClientRect().top - s[0].getBoundingClientRect().top) / 2);
  const dy = () => Math.round(pal.getBoundingClientRect().top - s[0].getBoundingClientRect().top);
  const aLaVista = (y) => T0 - y < vh && T0 - y + r0.height > 0;
  const ir = async (y) => { w.scrollTo({ top: y, behavior: 'instant' }); await raf(); await raf(); return pal.getAnimations().length };
  const asentar = async () => { await Promise.all(pal.getAnimations().map((a) => a.finished.catch(() => {}))); await raf(); await raf() };
  const res = { paso };
  // 1) Sin gesto, recién cargada: cruzar una fila va directo (es lo que hace la restauración de scroll del navegador).
  await ir(Y(0.2)); res.sinGesto = { viajes: await ir(Y(0.9)), dy: dy(), esperado: paso, msDesdeLoad: Math.round(performance.now() - cargado) };
  // 2) Primer gesto: la misma fila viaja y termina en píxel exacto.
  w.dispatchEvent(new w.WheelEvent('wheel', { deltaY: 0 }));
  await ir(Y(0.2)); await asentar();
  res.conGesto = { viajes: await ir(Y(0.9)) }; await asentar(); res.conGesto.dy = dy(); res.conGesto.esperado = paso;
  // 3) Salto desde lejos (entre medio alto y un alto, con el titular fuera de vista antes): directo, sin viaje. Se busca
  //    ese rango porque ahí es donde un umbral de salto mal puesto (un alto entero) todavía animaría.
  const desde = Math.round(T0 + r0.height + 1);
  const x = [0.8, 0.2].find((v) => desde - Y(v) > vh / 2 && desde - Y(v) < vh) ?? 0.2;
  await ir(desde); await asentar();
  res.saltoDesdeLejos = { delta: desde - Y(x), medioAlto: vh / 2, fueraDeVista: !aLaVista(desde), viajes: await ir(Y(x)), dy: dy(), esperado: x > 0.5 ? paso : 0 };
  await asentar();
  // 4) Salto de más de medio alto con el titular a la vista antes y después (como una traba del hilo principal que
  //    acumuló el scroll): la persona vio la fila vieja, así que viaja.
  const hasta = Y(0.2) + Math.ceil(vh / 2) + 10;
  const aplica = aLaVista(Y(0.2)) && aLaVista(hasta) && Math.abs(hasta - Y(0.2)) > vh / 2;
  res.saltoALaVista = { aplica, delta: hasta - Y(0.2), viajes: await ir(hasta) };
  await asentar(); res.saltoALaVista.dy = dy();
  f.remove();
  res.ok = res.sinGesto.msDesdeLoad < 1000 && res.sinGesto.viajes === 0 && res.sinGesto.dy === paso &&
    res.conGesto.viajes === 1 && res.conGesto.dy === paso &&
    res.saltoDesdeLejos.fueraDeVista && res.saltoDesdeLejos.viajes === 0 && res.saltoDesdeLejos.dy === res.saltoDesdeLejos.esperado &&
    (!aplica || res.saltoALaVista.viajes === 1);
  return res;
})()
