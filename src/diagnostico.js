// Diagnóstico en pantalla para probar en un teléfono real (30/09/2026: el acordeón de Áreas se comportaba distinto en
// el iPhone y acá no hay iPhone ni Safari). Solo se carga con ?diag en la dirección (https://mupa.ar/?diag): main.jsx
// lo importa aparte, así que no pesa nada en la visita normal.
// Muestra arriba de todo, en un recuadro chico: el navegador y si tiene anclaje de scroll, los altos de la pantalla y
// del documento y cuánto pasa el scroll del máximo, la banda activa y cuáles están abiertas, los últimos eventos del
// acordeón (abre, cierra y por qué, esperas) y los cuadros lentos de los últimos 2 s. Tocando el recuadro se achica.
// Los eventos llegan por window.__acordeonDiag, que useAcordeonScroll y Areas.jsx llaman solo si existe.
export default function iniciarDiagnostico() {
  const caja = document.createElement('div')
  caja.setAttribute('aria-hidden', 'true')
  Object.assign(caja.style, {
    position: 'fixed',
    top: '4px',
    left: '4px',
    right: '4px',
    zIndex: '99999',
    padding: '6px 8px',
    font: '10px/1.35 ui-monospace, Menlo, monospace',
    color: '#fff',
    background: 'rgb(0 0 0 / 0.78)',
    borderRadius: '6px',
    whiteSpace: 'pre-wrap',
    pointerEvents: 'auto',
    maxHeight: '46vh',
    overflow: 'hidden',
  })
  document.body.append(caja)
  let chica = false
  caja.addEventListener('click', () => {
    chica = !chica
  })

  const eventos = []
  const t0 = performance.now()
  window.__acordeonDiag = (tipo, datos = {}) => {
    const s = ((performance.now() - t0) / 1000).toFixed(1)
    eventos.unshift(`${s}s ${tipo} ${JSON.stringify(datos)}`)
    eventos.length = Math.min(eventos.length, 8)
  }

  const ios = navigator.userAgent.match(/OS (\d+)_(\d+)/)
  const safari = navigator.userAgent.match(/Version\/(\d+(\.\d+)?)/)
  const cabecera =
    `${ios ? `iOS ${ios[1]}.${ios[2]}` : navigator.platform}` +
    `${safari ? ` · Safari ${safari[1]}` : ''}` +
    `${/Instagram|FBAN|FBAV/.test(navigator.userAgent) ? ' · navegador de Instagram/Facebook' : ''}` +
    ` · anclaje ${CSS.supports('overflow-anchor', 'auto') ? 'SÍ' : 'NO'}` +
    ` · iOS ${CSS.supports('-webkit-touch-callout', 'none') ? 'sí' : 'no'}` +
    ` · hover:none ${matchMedia('(hover: none)').matches ? 'sí' : 'no'}` +
    ` · reducir movimiento ${matchMedia('(prefers-reduced-motion: reduce)').matches ? 'SÍ' : 'no'}`

  // Cuadros lentos: intervalos de requestAnimationFrame de más de 25 ms en los últimos 2 s.
  const cuadros = []
  let ultimo = 0
  let dedo = false
  window.addEventListener('touchstart', () => (dedo = true), { passive: true })
  window.addEventListener('touchend', () => (dedo = false), { passive: true })
  window.addEventListener('touchcancel', () => (dedo = false), { passive: true })

  const pintar = (t) => {
    if (ultimo) cuadros.push([t, t - ultimo])
    ultimo = t
    while (cuadros.length && t - cuadros[0][0] > 2000) cuadros.shift()
    const lentos = cuadros.filter(([, d]) => d > 25)
    const max = cuadros.reduce((m, [, d]) => Math.max(m, d), 0)
    const doc = document.documentElement.scrollHeight
    const maxScroll = doc - window.innerHeight
    const lista = document.querySelector('#areas [data-panel]')?.closest('ul')
    const estado = lista
      ? [...lista.children].map((li) => (li.querySelector('button')?.getAttribute('aria-expanded') === 'true' ? 'A' : 'c')).join('')
      : '-'
    const texto = chica
      ? `diag · ${estado} · lentos ${lentos.length}`
      : `${cabecera}\n` +
        `innerHeight ${window.innerHeight} · visualViewport ${Math.round(window.visualViewport?.height ?? 0)} · doc ${doc}\n` +
        `scrollY ${Math.round(window.scrollY)} · máx ${maxScroll} · pasado del máx ${Math.round(window.scrollY - maxScroll)}\n` +
        `bandas ${estado} · dedo ${dedo ? 'apoyado' : 'arriba'} · cuadros lentos (2 s) ${lentos.length}, peor ${Math.round(max)} ms\n` +
        eventos.join('\n')
    if (caja.textContent !== texto) caja.textContent = texto
    requestAnimationFrame(pintar)
  }
  requestAnimationFrame(pintar)
}
