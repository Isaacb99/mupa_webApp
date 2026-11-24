import { useMemo, useRef } from 'react'
import { medirEnganche, progresoEnganche } from '../hooks/enganche.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'

// Desde la Home del tablero "Web" de la diseñadora (02/11/2026; decisión D9 del desarrollador) es "El MuPa en imágenes"
// (GaleriaHome.jsx, con el título y las piedritas): las mismas cinco fotos con la composición del tablero (Figma
// 2628:2246: una caja de 1006x628 a 1440, centrada, con las fotos en otras alturas) y el mismo efecto de scroll de
// siempre, que el tablero (estático) no dibuja. Debajo de md, el acomodo del cuadro de celular (Figma "Web Mobile",
// 3108:17510, 10/11/2026; decisión O4: conserva el efecto): una pila de 354x472 a 402 px, las cinco fotos enteras
// (3:2, del ancho de la caja), cada una un octavo de la caja más abajo que la anterior, con la del dremel adelante.
// Lo que sigue es la historia del efecto.
//
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

// Posición de cada capa en % de la caja, en el mismo orden que las fotos de content.js (lamas, dremel, restaurador,
// pincel, patio).
// - Desde md, la caja del tablero "Web" (1006x628 a 1440, Figma 2628:2246; hasta el 02/11/2026 era la del V04,
//   1006,6x713, con las mismas x y otras alturas): la primera al fondo (las lamas, la que queda) y la última adelante
//   (el patio, la primera en salir), en el orden del HTML. Dos tamaños: 667x445 (dremel y pincel) y 542x362 (las otras
//   tres).
// - Debajo de md, la pila del cuadro de celular (cada foto, la mitad del alto de la caja y todo su ancho): de atrás
//   hacia adelante, lamas, restaurador, pincel, patio y dremel. Es otro orden que el del HTML (la del dremel pasa de
//   segunda a última): lo da el z-index de cada capa, y aplicar() saca las fotos en ese orden (enOrdenDePila).
const CAPAS = [
  'top-0 z-[1] md:left-[7.626%] md:top-[0.03%] md:z-auto md:w-[53.79%] md:h-[57.44%]',
  'top-1/2 z-[5] md:left-[33.72%] md:top-[29.17%] md:z-auto md:w-[66.31%] md:h-[70.82%]',
  'top-[12.5%] z-[2] md:left-[41.05%] md:top-[8.98%] md:z-auto md:w-[53.96%] md:h-[57.6%]',
  'top-1/4 z-[3] md:left-[-0.028%] md:top-[22.73%] md:z-auto md:w-[66.34%] md:h-[70.85%]',
  'top-[37.5%] z-[4] md:left-[23.56%] md:top-[29.67%] md:z-auto md:w-[53.92%] md:h-[57.6%]',
]

// Las fotos de la caja en el orden de la pila que se ve, de atrás hacia adelante: por z-index (el acomodo de celular)
// y, a igual z-index (ninguna lo tiene desde md), en el orden del HTML. Lo decide el CSS: acá solo se lee.
function enOrdenDePila(caja) {
  return [...caja.children]
    .map((el, i) => ({ el, i, z: Number(getComputedStyle(el).zIndex) || 0 }))
    .sort((a, b) => a.z - b.z || a.i - b.i)
    .map((x) => x.el)
}

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

// Parada `fila` = cuántas fotos están fuera, contando desde la de adelante de la pila que se ve (enOrdenDePila: en el
// celular, la primera en salir es la del dremel; desde md, la del patio). Sin estado propio: el estado de cada foto es
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
  // El orden de la pila es una lectura: va antes de escribir nada.
  const fotos = fila < 0 ? [...caja.children] : enOrdenDePila(caja)
  // El efecto ya maneja las fotos: se apaga collage-espera (index.css), que hasta acá dejaba ver solo la del fondo.
  caja.dataset.efecto = ''
  if (fila < 0) {
    for (const foto of fotos) {
      foto.getAnimations().forEach((a) => a.cancel())
      foto.style.translate = ''
      foto.style.visibility = ''
      delete foto.dataset.fuera
    }
    return
  }
  // Lecturas. caja.offsetTop: la caja dentro del bloque fijo (su offsetParent), centrada desde md y a 7,5rem del
  // borde en celular; no depende del scroll.
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
      {/* Alto del bloque = pantalla fija + el scroll de cada foto que sale (4 con 5 fotos) + la cola con la última foto
          quieta antes de soltarse (ver progreso). Desde el 16/11/2026, un solo recorrido para todos los anchos, el que
          tenía escritorio: 16 rem por foto (256 px, ~2,5 muescas de rueda) y una cola del 30 % de la pantalla. El
          desarrollador revisó la galería en el celular y la encontró muy larga («hay que deslizar demasiado para
          pasarla»): con la pila clavada había 1848 px de scroll en un iPhone de 664 px de alto (2,8 pantallas) y ahora
          hay 1223 (1,8); vale también para las tablets, de md a lg. Hasta ese día, debajo de lg eran 24,2 rem por foto
          (387 px) y una cola del 45 %: con el dedo habían sido 22 rem (los mismos que en lg, donde se sentían largos y
          el 21/09/2026 bajaron a 16, pedido del desarrollador), el 22/09/2026 pasaron a 27,5 (+25 %, pedido suyo) y
          el mismo día a 24,2 (+10 %: un usuario de prueba lo sintió trabado), y la cola del 45 % con el dedo era la
          de los ejes de Identidad (28/09/2026). Este cambio deja sin efecto, solo acá, en la galería de master, el
          recorrido más largo con el dedo (los 24,2 rem del 22/09/2026 y también los 22 del principio: con el dedo
          nunca había habido 16) y la cola del 45 %: los demás efectos por pasos son de la landing y no se tocan. Desde
          lg no cambió nada (el alto y la cola calculados son los de antes). El 17/11/2026 el desarrollador lo probó en
          su teléfono y lo confirmó así, con 16 rem (la variante de 12 rem por foto, que acortaba también el
          escritorio, se descartó).
          collage-cola (index.css) además sube el bloque para que, antes de engancharse, la caja quede 80 px debajo del
          título de la sección (GaleriaHome.jsx), como en el tablero (debajo de md, 24: el cuadro de celular). Apilado
          (sin efecto: reduced-motion, impresión, sin JavaScript o pantalla baja) va como el tablero, quieto: 80 px de
          aire arriba de la caja (24 debajo de md) y nada abajo (lo pone la sección).
          El id es el de siempre: lo busca tools/collage-check.js. */}
      <div
        ref={bloque}
        id="identidad-collage"
        className={
          activo
            ? 'collage-cola relative h-[calc(130svh+(var(--fotos)-1)*16rem)] apilado:h-auto apilado:mt-0 apilado:mb-0 apilado:pt-6 apilado:md:pt-20 apilado:pb-0'
            : 'relative pt-6 md:pt-20'
        }
        style={{ '--fotos': fotos.length }}
      >
      {/* En celular la caja va arriba en vez de centrada (centrada quedaba con ~270 px vacíos encima y el
          desarrollador lo vio raro en el teléfono, 28/09/2026): a 7,5rem (120 px) del borde, que son el aire de la
          sección (48), el título en un renglón (48) y 24. Así, en el momento de engancharse, la pantalla se ve como el
          cuadro de celular (el título a 48 y la pila a 120); después el título se va con el scroll. Hasta el
          10/11/2026 iba al 10 % del alto de la pantalla. Desde md, centrada. */}
      <div
        ref={fijo}
        className={activo ? 'sticky top-0 flex h-svh items-start pt-[7.5rem] md:items-center md:pt-0 apilado:static apilado:h-auto apilado:pt-0' : 'flex'}
      >
        {/* La caja del tablero "Web" (1006x628 a 1440, 69,86 % del ancho, centrada; hasta el 02/11/2026 era la del V04,
            1006,6x713 y corrida 25 px a la derecha); mientras está enganchada nunca es más alta que la pantalla menos
            6 rem (también en celular apaisado), así entra entera con aire para la foto que sube. Esquinas de 16,4 px
            (V04, tablero y cuadro de celular).
            Debajo de md, la pila del cuadro de celular: 354x472 a 402 px (el ancho del contenido, con 24 a los costados),
            de 480 de ancho como mucho y nunca más alta que la pantalla menos 9 rem (los 7,5 de arriba y 24 px abajo),
            contra el margen izquierdo, como el título de la sección y el plano del Mapa (de 480 a 767 px, centrada,
            quedaba corrida del título: VHOM-03 de la verificación, 11/11/2026):
            con las barras de Safari a la vista entra entera (a 390x664 mide 342x456 y termina en 576; a 375x635,
            327x436 y termina en 556). Los z-index de las fotos quedan adentro de la caja (apilada, el bloque fijo ya no
            es sticky y no los contendría). Apilado: sin tope de alto, no hace falta.
            collage-espera (index.css): hasta que el efecto arranca (la página todavía no hidrató o el JavaScript no
            llegó) se ve solo la foto del fondo, como cuando ya salieron las otras cuatro; si no, las cinco quedaban en
            la caja enganchada y tapaban el título "Mapa del Museo", que sube por debajo de ella (A11Y-07 de la
            verificación, 02/11/2026). aplicar() lo apaga con data-efecto. Las clases van en una lista: la última
            iba pegada a la interpolación, Tailwind no la encontraba y en apilado la caja salía un 35 % más grande (R2-01,
            03/11/2026; lo controla server/pruebas/clases.test.js). */}
        <div className="mx-auto w-full max-w-[90rem] px-6 md:px-0">
          <div
            ref={caja}
            data-caja
            className={[
              'relative mx-auto aspect-[354/472] w-[min(100%,30rem,calc((100svh-9rem)*0.75))] max-md:isolate max-md:ml-0 md:aspect-[1006/628] md:w-[min(calc(100%-5rem),calc((100svh-6rem)*1.6019))] lg:w-[min(69.86%,calc((100svh-6rem)*1.6019))] apilado:w-[min(100%,30rem)] apilado:md:w-[calc(100%-5rem)] apilado:lg:w-[69.86%]',
              activo ? 'collage-espera' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {fotos.map((foto, i) => (
              <div key={foto.src} className={`pointer-events-auto absolute left-0 h-1/2 w-full overflow-hidden rounded-[1.025rem] ${CAPAS[i] ?? CAPAS[0]}`}>
                <img
                  src={foto.src}
                  srcSet={foto.srcSet}
                  sizes="(min-width: 1440px) 667px, (min-width: 1024px) 46vw, (min-width: 768px) 66vw, min(calc(100vw - 3rem), 350px)"
                  alt={foto.alt}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Cola: el último tramo del bloque, en el que la última foto queda quieta antes de soltarse (lo mide `medir`):
          el 30 % de la pantalla en todos los anchos (hasta el 16/11/2026, el 45 % debajo de lg). */}
      {activo && (
        <div ref={cola} data-cola aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[30svh] apilado:hidden" />
      )}
      </div>
    </div>
  )
}
