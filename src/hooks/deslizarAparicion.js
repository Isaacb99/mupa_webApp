// Aparición en el iPhone (camino de Safari, ver useAcordeonScroll): al abrirse una banda por scroll, el panel toma su alto
// de una vez (así el documento no crece durante el flick y no rebota contra el final). Hasta el 30/09/2026 a la tarde lo
// que estaba debajo de la cabecera (las bandas siguientes y el pie) desaparecía de golpe, y el desarrollador lo vio "tan
// rápido que parece un glitch". Ahora lo que estaba a la vista baja deslizándose hasta salir por el borde de abajo de la
// pantalla, siguiendo punto por punto el movimiento que tenía cuando el panel crecía (1 s con el dedo,
// cubic-bezier(0.4, 0, 0.2, 1)), y recién ahí queda en su lugar final, que ya está fuera de la pantalla. Se anima solo
// transform y opacidad (en el compositor) y dura lo que tardaba en salir (200-350 ms), así que no pesa en el hilo
// principal. En la segunda mitad además se desvanece: si la persona sigue scrolleando mientras tanto, lo que baja puede
// seguir a la vista al terminar, y sin el fundido se lo vería saltar a su lugar final (con flicks fuertes, hasta 620 px,
// medido); desvanecido, llega invisible. Con un flick rápido (data-aparicion="rapida", ver useAcordeonScroll) no se
// desliza: la aparición es directa, porque a esa velocidad no se nota y así no queda nada corrido de su lugar mientras
// se abre la banda siguiente. El hueco que queda mientras tanto donde lo de abajo va a terminar (debajo del panel) solo
// se vería si un flick recorriera un panel entero en ese tiempo. El pie y el aire de la sección no tienen fondo propio:
// mientras bajan llevan el del sitio, para que el texto del panel no se vea a través de ellos.
const DURACION = 1000
const PASOS = 12
// Tope: lo que tarda en salir lo de más arriba (con una banda cerca del final puede ser más).
const MAXIMO = 350

// cubic-bezier(0.4, 0, 0.2, 1): de la fracción del tiempo a la fracción del recorrido.
function curva(x) {
  const bx = (t) => 3 * (1 - t) ** 2 * t * 0.4 + 3 * (1 - t) * t * t * 0.2 + t ** 3
  let a = 0
  let b = 1
  for (let k = 0; k < 40; k++) {
    const t = (a + b) / 2
    if (bx(t) < x) a = t
    else b = t
  }
  const t = (a + b) / 2
  return 3 * (1 - t) * t * t + t ** 3
}

// Fracción del tiempo en que el recorrido llega a la fracción `f`.
function tiempoPara(f) {
  if (f >= 1) return 1
  let a = 0
  let b = 1
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2
    if (curva(m) < f) a = m
    else b = m
  }
  return (a + b) / 2
}

const enCurso = new Map()

// true mientras algo se está deslizando: useAcordeonScroll lee entonces la posición final de las bandas (sin el
// transform), que es con la que decide.
export function hayDeslizamientos() {
  return enCurso.size > 0
}

export function detenerDeslizamiento(li) {
  const d = enCurso.get(li)
  if (!d) return
  enCurso.delete(li)
  for (const animacion of d.animaciones) animacion.cancel()
  d.restaurar()
}

// `li` es la banda que se acaba de abrir y `panel` su [data-panel], ya con el alto final.
export function deslizarAparicion(li, panel) {
  if (typeof li.animate !== 'function') return
  // Cualquier otro deslizamiento en curso se termina antes (así lo que se mide es la posición real).
  for (const otra of [...enCurso.keys()]) detenerDeslizamiento(otra)
  if (li.getAttribute('data-aparicion') === 'rapida') {
    window.__acordeonDiag?.('desliza', { elementos: 0, motivo: 'flick rápido' })
    return
  }
  const alto = panel.getBoundingClientRect().height
  if (alto < 1) return
  const pantalla = window.innerHeight
  const debajo = []
  for (let el = li.nextElementSibling; el; el = el.nextElementSibling) debajo.push(el)
  const pie = document.querySelector('footer')
  if (pie) debajo.push(pie)
  // Lo que estaba a la vista antes de abrir (su posición de antes es la final menos el alto del panel).
  const visibles = debajo.filter((el) => {
    const r = el.getBoundingClientRect()
    return r.top - alto < pantalla && r.bottom - alto > 0
  })
  if (!visibles.length) return
  // Todo baja junto hasta que lo de más arriba sale por el borde de abajo, en el tiempo que tardaba el crecimiento.
  const arriba = visibles[0].getBoundingClientRect().top - alto
  const recorrido = Math.min(alto, Math.max(0, pantalla - arriba) + 8)
  const fraccion = Math.min(tiempoPara(recorrido / alto), MAXIMO / DURACION)
  const duracion = Math.max(16, fraccion * DURACION)
  // Opacidad: entera la primera mitad y a 0 al final.
  const fotogramas = Array.from({ length: PASOS + 1 }, (_, k) => ({
    transform: `translateY(${-alto + alto * curva((fraccion * k) / PASOS)}px)`,
    opacity: k <= PASOS / 2 ? 1 : 1 - (k - PASOS / 2) / (PASOS / 2),
    offset: k / PASOS,
  }))
  // Fondo del sitio para el pie y para el aire entre la última banda y el pie (sombra del pie hacia arriba).
  let restaurar = () => {}
  if (pie && visibles.includes(pie)) {
    const fondo = getComputedStyle(document.body).backgroundColor
    const ultima = debajo[debajo.length - 2]
    const aire = ultima && ultima !== pie ? Math.max(0, pie.getBoundingClientRect().top - ultima.getBoundingClientRect().bottom) : 0
    const antes = { fondo: pie.style.backgroundColor, sombra: pie.style.boxShadow }
    pie.style.backgroundColor = fondo
    pie.style.boxShadow = aire ? `0 ${-aire}px 0 0 ${fondo}` : ''
    restaurar = () => {
      pie.style.backgroundColor = antes.fondo
      pie.style.boxShadow = antes.sombra
    }
  }
  const animaciones = visibles.map((el) => el.animate(fotogramas, { duration: duracion, easing: 'linear' }))
  const registro = { animaciones, restaurar }
  enCurso.set(li, registro)
  animaciones[0].onfinish = () => {
    if (enCurso.get(li) !== registro) return
    enCurso.delete(li)
    restaurar()
  }
  window.__acordeonDiag?.('desliza', { elementos: visibles.length, ms: Math.round(duracion) })
}
