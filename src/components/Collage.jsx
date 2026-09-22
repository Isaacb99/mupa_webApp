import { useMemo, useRef } from 'react'
import { medirEnganche, progresoEnganche } from '../hooks/enganche.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'

// Collage de fotos superpuestas después de los paneles de Identidad (Figma, capas "01" a "05"). Al llegar, el collage
// se engancha en el centro de la pantalla y cada tramo de scroll saca una foto del montón, de adelante hacia atrás: la
// foto sube hasta salir por arriba de la pantalla (sin fundido: el desarrollador probó una versión que se desvanecía y
// pidió que "siga hacia arriba") y va apareciendo la que tenía debajo; con el scroll para arriba baja igual a su lugar.
// Después de la cuarta, la página sigue (la última, la del fondo, queda). Mismo motor que el titular y los paneles
// (useScrollPorPasos): el scroll elige cuántas fotos sacar y cada cambio dura siempre lo mismo. Con la variante apilado
// (reduced-motion o pantalla baja) no se engancha y se ven las cinco fotos quietas, como en el Figma. Decidido por el
// desarrollador el 21/09/2026.

// ms que tarda una foto en salir por arriba (o en volver).
const DURACION_FOTO = 600
// px de más que sube la foto una vez fuera de la pantalla.
const MARGEN_SALIDA = 16

// Posición de cada capa en % de la caja del collage (1046x628 a 1440, del Figma), en el mismo orden que las fotos de
// content.js: la primera al fondo y la última adelante (la primera en salir).
const CAPAS = [
  'left-[48.37%] top-[5.41%] w-[51.63%] h-[57.17%]',
  'left-0 top-[22.29%] w-[63.77%] h-[71.02%]',
  'left-[43.31%] top-[42.52%] w-[51.91%] h-[57.48%]',
  'left-[9.85%] top-0 w-[52.1%] h-[57.96%]',
  'left-[19.02%] top-[13.85%] w-[63.48%] h-[70.38%]',
]

// paso 0 cuando no está enganchado: así el motor pinta directo (sin fundidos) al pasar de apilado a enganchado o al revés.
function medir({ fijo }) {
  const enganche = medirEnganche(fijo)
  return { paso: enganche.enganchado ? 1 : 0, ...enganche }
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
  // Lecturas.
  const topFijo = parseFloat(getComputedStyle(fijo).top) || 0
  const cajaTop = topFijo + (fijo.offsetHeight - caja.offsetHeight) / 2
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
  const refs = useMemo(() => ({ bloque, fijo, caja }), [])
  const activo = fotos.length > 1

  useScrollPorPasos(refs, { pasos: fotos.length, medir, progreso: progresoEnganche, aplicar, activo })

  if (!fotos.length) return null

  return (
    // @container: el envoltorio es el contenedor de consultas cuyo ancho (cqw) usa collage-cola (index.css) para calcular
    // el alto de la caja y descontar, con un margen negativo, la mitad de pantalla que queda debajo de ella al soltarse.
    // pointer-events-none: el bloque y su hijo fijo (100svh, transparente) se extienden por debajo de la caja, sobre el
    // cierre que sube con ese margen, y como elementos posicionados le robaban el puntero (el párrafo no se podía
    // seleccionar; hallazgo de la revisión adversarial, 21/09/2026). Solo la caja de fotos vuelve a recibirlo.
    <div className="@container pointer-events-none">
      {/* Alto del bloque = pantalla fija + el scroll de cada foto que sale (4 con 5 fotos): 24,2 rem (387 px) con el dedo
          y 16 rem (256 px, ~2,5 muescas de rueda) en lg, donde 22 se sentían largos (pedido del desarrollador, 21/09/2026).
          Con el dedo eran 22 rem; el 22/09/2026 pasaron a 27,5 (+25 %, pedido suyo) y el mismo día a 24,2 (+10 %: un
          usuario de prueba lo sintió trabado). */}
      <div
        ref={bloque}
        id="identidad-collage"
        className={
          activo
            ? 'collage-cola relative h-[calc(100svh+(var(--fotos)-1)*24.2rem)] lg:h-[calc(100svh+(var(--fotos)-1)*16rem)] apilado:h-auto apilado:py-16 apilado:mb-0'
            : 'relative py-16'
        }
        style={{ '--fotos': fotos.length }}
      >
      <div
        ref={fijo}
        className={activo ? 'sticky top-0 flex h-svh items-center apilado:static apilado:h-auto' : 'flex'}
      >
        {/* La caja del Figma (1046x628 a 1440, 72,64 % del ancho) centrada; mientras está enganchada nunca es más alta que
            la pantalla menos 6 rem (también en celular apaisado), así entra entera con aire para la foto que sube. En
            celular, de borde a borde. Apilado: sin tope de alto, no hace falta. */}
        <div className="mx-auto w-full max-w-[90rem]">
          <div
            ref={caja}
            data-caja
            className="pointer-events-auto relative mx-auto aspect-[1046/628] w-[min(100%,calc((100svh-6rem)*1.6656))] md:w-[min(calc(100%-5rem),calc((100svh-6rem)*1.6656))] lg:w-[min(72.64%,calc((100svh-6rem)*1.6656))] apilado:w-full apilado:md:w-[calc(100%-5rem)] apilado:lg:w-[72.64%]"
          >
            {fotos.map((foto, i) => (
              <div key={foto.src} className={`absolute ${CAPAS[i] ?? CAPAS[0]}`}>
                <img
                  src={foto.src}
                  srcSet={foto.srcSet}
                  sizes="(min-width: 1440px) 667px, (min-width: 1024px) 47vw, 64vw"
                  alt={foto.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
