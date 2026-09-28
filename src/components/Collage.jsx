import { useMemo, useRef } from 'react'
import { medirEnganche, progresoEnganche } from '../hooks/enganche.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'

// Carrusel de fotos superpuestas entre la intro e Identidad (V04 de la diseñadora, 28/09/2026: cinco fotos nuevas en
// abanico; hasta entonces era el collage del Figma, con otras cinco fotos, después de los ejes de Identidad). Al llegar,
// el bloque se engancha en el centro de la pantalla y cada tramo de scroll saca una foto del montón, de adelante hacia
// atrás: la foto sube hasta salir por arriba de la pantalla (sin fundido: el desarrollador probó una versión que se
// desvanecía y pidió que "siga hacia arriba") y va apareciendo la que tenía debajo; con el scroll para arriba baja igual
// a su lugar. Después de la cuarta, la página sigue (la última, la del fondo, queda). Mismo motor que el titular y los
// paneles (useScrollPorPasos): el scroll elige cuántas fotos sacar y cada cambio dura siempre lo mismo. Con la variante
// apilado (reduced-motion o pantalla baja) no se engancha y se ven las cinco fotos quietas, como en el archivo. El
// efecto lo decidió el desarrollador el 21/09/2026 y lo mantuvo para las fotos del V04 el 28/09/2026.

// ms que tarda una foto en salir por arriba (o en volver).
const DURACION_FOTO = 600
// px de más que sube la foto una vez fuera de la pantalla.
const MARGEN_SALIDA = 16

// Posición de cada capa en % de la caja (1006,6x713 a 1440, medida sobre los recortes del PDF V04), en el mismo orden
// que las fotos de content.js: la primera al fondo (las lamas, la que queda) y la última adelante (el patio, la primera
// en salir). Dos tamaños: 667x445 (dremel y pincel) y 542x362 (las otras tres).
const CAPAS = [
  'left-[7.65%] top-[5.89%] w-[53.76%] h-[50.6%]',
  'left-[33.73%] top-0 w-[66.27%] h-[62.38%]',
  'left-[41.05%] top-[49.26%] w-[53.93%] h-[50.74%]',
  'left-0 top-[32.34%] w-[66.3%] h-[62.41%]',
  'left-[23.57%] top-[24.42%] w-[53.89%] h-[50.74%]',
]

// paso 0 cuando no está enganchado: así el motor pinta directo (sin fundidos) al pasar de apilado a enganchado o al revés.
function medir({ fijo, cola }) {
  const enganche = medirEnganche(fijo)
  return { paso: enganche.enganchado ? 1 : 0, ...enganche, cola: enganche.enganchado ? cola.offsetHeight : 0 }
}

// Progreso de las fotos: 0 al engancharse y 1 cuando salió la cuarta, que es antes del final del bloque: lo que queda
// es la cola (data-cola), en la que la última foto se queda quieta antes de que la página siga. Sin cola, el mismo
// gesto que sacaba la cuarta foto soltaba el bloque y la última casi no se veía (pedido del desarrollador el
// 28/09/2026, igual que en los ejes de Identidad). Las salidas de las fotos quedan en el mismo scroll que antes.
function progreso(rect, alto, medida) {
  const p = progresoEnganche(rect, alto, medida)
  if (!medida.enganchado) return p
  const recorrido = rect.height - medida.altoFijo
  const util = recorrido - medida.cola
  return util > 0 ? Math.min((p * recorrido) / util, 1) : p
}

// Parada `fila` = cuántas fotos están fuera, contando desde la de adelante. Sin estado propio: el estado de cada foto es
// data-fuera, y un cambio a mitad de viaje arranca desde donde la dejó la animación anterior. Una foto "fuera" está
// trasladada hasta que su borde de abajo pasa el borde de arriba de la pantalla, más MARGEN_SALIDA, y queda con
// visibility hidden: si no, seguiría en el hit test (clic derecho, arrastre o toque sobre la foto visible iban a la de
// adelante) y en el árbol de accesibilidad. visibility no va en la animación (con ella el navegador no la pasa al
// compositor y en un celular de gama baja se frenaba; medido el 22/09/2026): la foto que sube queda visible hasta que
// termina y recién ahí pasa a hidden, y la que baja se ve apenas arranca. Primero todas las lecturas y después todas las
// escrituras, para no forzar un recálculo de estilo por foto. La distancia se calcula con la geometría del enganche (top
// del sticky más la caja centrada en él), no con la posición viva de la caja: el motor también aplica paradas con el
// bloque suelto (tecla Fin, que Chrome suaviza en pocos frames grandes; clic en el riel; Ctrl+F), y con la caja ya arriba
// de la pantalla la distancia salía corta o negativa y la foto reaparecía sin bajar (hallazgo de la revisión
// adversarial, 21/09/2026).
function aplicar({ caja, fijo }, fila, animar) {
  const fotos = [...caja.children]
  if (fila < 0) {
    for (const foto of fotos) {
      foto.getAnimations().forEach((a) => a.cancel())
      foto.style.translate = ''
      foto.style.visibility = ''
      delete foto.dataset.fuera
    }
    return
  }
  // Lecturas. caja.offsetTop: la caja dentro del bloque fijo (su offsetParent), centrada desde md y a 10svh del borde
  // en celular; no depende del scroll.
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0
  const cajaTop = topFijo + caja.offsetTop
  const cambios = fotos.map((foto, i) => {
    const oculta = i >= fotos.length - fila
    if (oculta === (foto.dataset.fuera === '1')) return { foto, oculta, igual: true }
    const actual = getComputedStyle(foto).translate
    const salida = Math.max(0, Math.ceil(cajaTop + foto.offsetTop + foto.offsetHeight + MARGEN_SALIDA))
    return { foto, oculta, desde: actual === 'none' ? '0px 0px' : actual, salida }
  })
  // Escrituras.
  for (const { foto, oculta, igual, desde, salida } of cambios) {
    if (igual) {
      // Directo con el mismo destino: se corta lo que estuviera animando y queda el estado final en línea.
      if (!animar) {
        foto.getAnimations().forEach((a) => a.cancel())
        foto.style.visibility = oculta ? 'hidden' : ''
      }
      continue
    }
    foto.getAnimations().forEach((a) => a.cancel())
    foto.style.translate = oculta ? `0px ${-salida}px` : '0px 0px'
    foto.style.visibility = oculta && !animar ? 'hidden' : ''
    if (oculta) foto.dataset.fuera = '1'
    else delete foto.dataset.fuera
    if (!animar) continue
    const animacion = foto.animate([{ translate: desde }, { translate: foto.style.translate }], {
      duration: DURACION_FOTO,
      easing: 'cubic-bezier(0.33, 0, 0.67, 1)',
    })
    if (oculta) {
      animacion.onfinish = () => {
        if (foto.dataset.fuera === '1') foto.style.visibility = 'hidden'
      }
    }
  }
}

export default function Collage({ fotos = [] }) {
  const bloque = useRef(null)
  const fijo = useRef(null)
  const caja = useRef(null)
  const cola = useRef(null)
  const refs = useMemo(() => ({ bloque, fijo, caja, cola }), [])
  const activo = fotos.length > 1

  useScrollPorPasos(refs, { pasos: fotos.length, medir, progreso, aplicar, activo })

  if (!fotos.length) return null

  return (
    // @container: el envoltorio es el contenedor de consultas cuyo ancho (cqw) usa collage-cola (index.css) para calcular
    // el alto de la caja y descontar, con un margen negativo, la mitad de pantalla que queda debajo de ella al soltarse
    // y la parte de la caja que queda vacía cuando salieron las fotos de adelante.
    // pointer-events-none: el bloque, su hijo fijo (100svh, transparente) y la caja se extienden por debajo de la última
    // foto, sobre la sección siguiente que sube con ese margen, y como elementos posicionados le robaban el puntero (el
    // texto no se podía seleccionar; hallazgo de la revisión adversarial, 21/09/2026). Solo las fotos vuelven a recibirlo.
    <div className="@container pointer-events-none">
      {/* Alto del bloque = pantalla fija + el scroll de cada foto que sale (4 con 5 fotos): 24,2 rem (387 px) con el dedo
          y 16 rem (256 px, ~2,5 muescas de rueda) en lg, donde 22 se sentían largos (pedido del desarrollador, 21/09/2026).
          Con el dedo eran 22 rem; el 22/09/2026 pasaron a 27,5 (+25 %, pedido suyo) y el mismo día a 24,2 (+10 %: un
          usuario de prueba lo sintió trabado). Más la cola con la última foto quieta antes de soltarse (ver progreso):
          30 % de pantalla en lg y 45 % con el dedo, como en los ejes de Identidad (pedido del desarrollador, 28/09/2026). */}
      <div
        ref={bloque}
        id="identidad-collage"
        className={
          activo
            ? 'collage-cola relative h-[calc(145svh+(var(--fotos)-1)*24.2rem)] lg:h-[calc(130svh+(var(--fotos)-1)*16rem)] apilado:h-auto apilado:py-16 apilado:mb-0'
            : 'relative py-16'
        }
        style={{ '--fotos': fotos.length }}
      >
      {/* En celular la caja va arriba, a 10 % de la pantalla del borde, en vez de centrada: centrada quedaba con
          ~270 px vacíos encima y el desarrollador lo vio raro en el teléfono (28/09/2026). Desde md, centrada. */}
      <div
        ref={fijo}
        className={activo ? 'sticky top-0 flex h-svh items-start pt-[10svh] md:items-center md:pt-0 apilado:static apilado:h-auto apilado:pt-0' : 'flex'}
      >
        {/* La caja del V04 (1006,6x713 a 1440, 69,9 % del ancho) centrada y corrida 25 px a la derecha, como en el
            archivo (2,48 % de su ancho); mientras está enganchada nunca es más alta que la pantalla menos 6 rem (también
            en celular apaisado), así entra entera con aire para la foto que sube. En celular, de borde a borde.
            Apilado: sin tope de alto, no hace falta. Esquinas de 16,4 px (V04). */}
        <div className="mx-auto w-full max-w-[90rem]">
          <div
            ref={caja}
            data-caja
            className="relative mx-auto aspect-[1006.6/713] w-[min(100%,calc((100svh-6rem)*1.4118))] md:w-[min(calc(100%-5rem),calc((100svh-6rem)*1.4118))] lg:w-[min(69.9%,calc((100svh-6rem)*1.4118))] lg:translate-x-[2.48%] apilado:w-full apilado:md:w-[calc(100%-5rem)] apilado:lg:w-[69.9%]"
          >
            {fotos.map((foto, i) => (
              <div key={foto.src} className={`pointer-events-auto absolute overflow-hidden rounded-[1.025rem] ${CAPAS[i] ?? CAPAS[0]}`}>
                <img
                  src={foto.src}
                  srcSet={foto.srcSet}
                  sizes="(min-width: 1440px) 667px, (min-width: 1024px) 46vw, 66vw"
                  alt={foto.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Cola: el último tramo del bloque, en el que la última foto queda quieta antes de soltarse (lo mide `medir`). */}
      {activo && (
        <div ref={cola} data-cola aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[45svh] lg:h-[30svh] apilado:hidden" />
      )}
      </div>
    </div>
  )
}
