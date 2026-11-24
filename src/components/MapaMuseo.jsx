import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import mapaTocada from '../assets/mapa-museo-movil-tocada.svg'
import { home } from '../content.js'
import { ALTO_PLANO, ANCHO_PLANO, SALAS_DEL_PLANO, cajaDeSala, salaEnElPunto } from './mapaSalas.js'
import { CONTENEDOR_TABLERO, TITULO_SECCION } from './tablero.js'

// "Mapa del Museo" de la Home (tablero "Web" de la diseñadora, Figma 2629:3654, 02/11/2026): el título centrado
// (Thin 64) y, 40 más abajo, el plano de 882x811 centrado; 64 arriba y 64 abajo.
// - Decisión D15 del desarrollador (09/11/2026, reemplaza el "sin interacción" de D10): en reposo, la versión naranja
//   del tablero ("Group 3", 2996:5992) con los nombres siempre visibles en #010101 (src/assets/mapa-museo.svg); con el
//   mouse sobre una sala, esa sala como la versión bordó ("Group 4", 2999:6555: relleno #8A1812 y nombre blanco,
//   mapa-museo-hover.svg). El plano interactivo cruzado con las salas del panel sigue siendo el módulo opcional.
// - Cómo: encima del plano van 14 copias de la versión bordó, cada una recortada a su sala con un clipPath en
//   objectBoundingBox (los trazados de mapaSalas.js, en la escala de su viewBox) y transparente hasta el hover (solo
//   con puntero que hace hover: la variante hover: de Tailwind ya va en @media (hover: hover)), con un fundido de
//   200 ms que reduced-motion saca. El recorte limita también el área del puntero: fuera de la sala, la capa no lo
//   recibe. Solo CSS, sin JavaScript propio, y las 15 imágenes lazy (el SVG entero en JSX pasaba el tope de 342 kB;
//   un <use> a un sprite no es lazy sin JavaScript; un <iframe> se come la rueda y la CSP no deja un <object>).
// - Es solo visual: sin cursor de mano, sin clic, sin foco y sin rol de control. Las capas son decorativas (alt
//   vacío) y draggable en false; al imprimir no salen.
// - Los nombres del dibujo son trazados: para el lector de pantalla van además como texto, en una lista (oculta a la
//   vista) después del plano, que tiene su alt.
// - Entre lg y 1440, y debajo, el plano se achica con el ancho (nunca más ancho que el contenido); el recorte, en
//   objectBoundingBox, se achica con él.
// - Debajo de md, el cuadro de celular (Figma "Web Mobile", 3108:17522, 10/11/2026; decisión M5 del desarrollador):
//   48 arriba y 40 abajo, el título a la izquierda y, 24 más abajo, el plano sin los nombres de las salas (a ese
//   tamaño medirían 3 px) y con los trazos más gruesos (imagen.movil: src/assets/README.md), sin hover. El plano va en
//   un <picture> que no arma caja: desde md, su <source> pone el de escritorio; las 14 capas del hover no se dibujan
//   debajo de md y, como son lazy, el teléfono no baja su archivo. Los tres SVG miden lo mismo: nada se corre. La
//   lista de los 14 nombres para el lector de pantalla y el alt no cambian. De md a lg, lo de escritorio (los nombres
//   ya se leen: 6,5 px de alto a 768).
// - Decisión M6 del desarrollador (17/11/2026): debajo de md, TOCAR una sala la pinta como el hover de escritorio
//   (bordó #8A1812, con las paredes, los trazos y las rosetas encima) y muestra su nombre; tocar otra la cambia; tocar
//   la misma, el plano fuera de las salas o cualquier otro lado de la página la apaga. Desde md nada cambia (ni el
//   HTML: lo del toque no sale del servidor, lo arma el JavaScript en el navegador). Cómo (useMapaTactil):
//   - El toque es el click (el navegador no lo manda después de deslizar el dedo ni de pellizcar) que llega a menos de
//     medio segundo de apoyar el dedo (un toque largo es el menú de la imagen: Chrome emulado igual manda el click,
//     por eso el tope). La sala, la que contiene el punto o la más cercana a menos de 6 px de su borde (salaEnElPunto,
//     de mapaSalas.js: un dedo no es exacto y entre dos salas hay apenas un hueco de ~1 px).
//   - La sala, con 14 capas del plano de celular "tocado" (mapa-museo-movil-tocada.svg: la receta de
//     mapa-museo-movil.svg aplicada a la versión bordó; solo cambian los 14 rellenos y los 13 contornos), cada una
//     enmascarada por su sala, agrandada RADIO unidades del viewBox (el trazado con un trazo blanco de 2 x RADIO) para
//     que su contorno, que va afuera del relleno y separado por un hueco negro, también pase a bordó: así no queda el
//     hilo naranja del hover de escritorio (medido contra el plano de celular con esa sala en bordó; el Jardín no tiene
//     contorno y sus vecinas están a menos de 3 unidades). Las capas (y con ellas el pedido del archivo, ~8 kB con
//     Brotli) se arman recién cuando el plano está a menos de una pantalla, y solo debajo de md: el teléfono que no
//     llega al mapa no lo baja, el de escritorio nunca. Pedido con el primer toque llegaba, con la red lenta del
//     proyecto, de 170 a 360 ms después del click (mediana 214): por eso antes.
//   - El nombre, en una etiqueta encima de la sala (o debajo, si arriba no entra en el plano o en la pantalla), anclada
//     en proporción a su posición en el ancho del plano (left y translate con el mismo porcentaje), así nunca se sale
//     del plano; posicionada (CLS 0) y con el texto de home.mapa.espacios. Se decide el lado y la etiqueta queda a 8 px
//     de la sala con un porcentaje del alto del plano: si el plano cambia de tamaño con una encendida (girar el
//     teléfono), la sigue, y se vuelve a decidir el lado (RM-02, 17/11/2026).
//   - Como D15, solo visual: las capas y las etiquetas son aria-hidden, sin rol, sin foco y sin cursor de mano; el
//     lector de pantalla sigue con el alt del plano y la lista de los 14 nombres. Fundido de 200 ms, sin él con
//     reduced-motion; al imprimir no salen.

/** El corte de md, el mismo del <source> del plano de escritorio: desde ahí el toque no hace nada. */
const DESDE_MD = '(min-width: 48rem)'
/** Hasta cuántos píxeles fuera de una sala el toque la elige (la más cercana). */
const TOLERANCIA_PX = 6
/** Un toque más largo que esto (de apoyar el dedo al click), en ms, no cuenta: es el toque largo. */
const LARGO_MS = 500
/** El aire entre la etiqueta y la sala, en píxeles. */
const AIRE_PX = 8
/**
 * Cuánto se agranda la máscara de cada sala (en unidades del viewBox) para tomar también su contorno: 3,5 en casi
 * todas; la Confitería, 4,5 (el arco de arriba de su contorno va más lejos), la Sala 8, 4 y el Jardín, 0 (no tiene
 * contorno). Medido con librsvg contra el plano de celular con esa sala en bordó (tools/salida/tanda-1/mapa-tactil).
 */
const RADIO = { confiteria: 4.5, 'sala-8': 4, 'jardin-triasico': 0 }
const RADIO_COMUN = 3.5

const CAPA_TOCADA = 'opacity-0 transition-opacity duration-200 data-activa:opacity-100 motion-reduce:transition-none'
const ETIQUETA =
  'pointer-events-none absolute w-max max-w-full rounded-[0.25rem] border border-transparent bg-bordo px-3 py-2 ' +
  'font-mono text-base leading-6 text-blanco opacity-0 transition-opacity duration-200 data-activa:opacity-100 ' +
  'motion-reduce:transition-none md:hidden print:hidden'

/**
 * El toque en el plano de celular (M6). Devuelve los manejadores del contenedor del plano y lo que hay que dibujar:
 * `capas` (si ya se armaron: con el plano a menos de una pantalla, o con el primer dedo sobre él), `activa` (la sala
 * encendida o null) y `lugar` (de cada sala con la etiqueta ya acomodada: de qué lado de la sala va, 'sobre' o 'bajo',
 * y el alto de la etiqueta en px; lo usa estiloDeEtiqueta).
 */
function useMapaTactil(plano, etiquetas) {
  const [capas, setCapas] = useState(false)
  const [activa, setActiva] = useState(null)
  const [lugar, setLugar] = useState({})
  const apoyo = useRef(-Infinity)
  const desdeMd = () => matchMedia(DESDE_MD).matches

  // La etiqueta de la sala encendida: encima de la sala si entra en el plano y en la pantalla; si no, debajo; si
  // tampoco, del lado con más lugar (y siempre adentro del plano). Se guarda el LADO y no la posición: la etiqueta va
  // anclada a la sala con un porcentaje del alto del plano más el aire en px, así sigue al plano si cambia de tamaño;
  // y, mientras está encendida, si el plano cambia de tamaño (girar el teléfono, plegar un plegable) se vuelve a
  // decidir el lado. Hasta la ronda 3 de la corrección de la tanda 1 (RM-02 de la re-verificación, 17/11/2026) se
  // guardaba la posición como % del alto del plano, con el alto de la etiqueta y el aire en px de ese tamaño, calculada
  // una vez al encenderla: de 740x360 a 360x740 la etiqueta tapaba su sala.
  useLayoutEffect(() => {
    const etiqueta = activa && etiquetas.current.get(activa)
    if (!etiqueta || !plano.current) return
    const decidir = () => {
      const r = plano.current.getBoundingClientRect()
      const k = r.height / ALTO_PLANO
      const [, y0, , y1] = cajaDeSala(activa)
      const alto = etiqueta.offsetHeight
      const sobre = y0 * k - AIRE_PX - alto
      const bajo = y1 * k + AIRE_PX
      const pantalla = document.documentElement.clientHeight
      let lado
      if (sobre >= 0 && r.top + sobre >= 0) lado = 'sobre'
      else if (bajo + alto <= r.height && r.top + bajo + alto <= pantalla) lado = 'bajo'
      else lado = y0 * k > r.height - y1 * k ? 'sobre' : 'bajo'
      setLugar((antes) => (antes[activa]?.lado === lado && antes[activa]?.alto === alto ? antes : { ...antes, [activa]: { lado, alto } }))
    }
    decidir()
    if (typeof ResizeObserver !== 'function') return
    const vigia = new ResizeObserver(decidir)
    vigia.observe(plano.current)
    return () => vigia.disconnect()
  }, [activa, plano, etiquetas])

  // Debajo de md, las capas se arman (y se pide el plano tocado) cuando el plano está a menos de una pantalla.
  useEffect(() => {
    if (capas || !plano.current || typeof IntersectionObserver !== 'function') return
    const cerca = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !desdeMd()) setCapas(true)
      },
      { rootMargin: '100% 0px' },
    )
    cerca.observe(plano.current)
    return () => cerca.disconnect()
  }, [capas, plano])

  // Un toque en cualquier otro lado de la página la apaga (los del plano los atiende tocar).
  useEffect(() => {
    if (!activa) return
    const fuera = (e) => {
      if (!plano.current?.contains(e.target)) setActiva(null)
    }
    document.addEventListener('click', fuera)
    return () => document.removeEventListener('click', fuera)
  }, [activa, plano])

  // El dedo apoya en el plano (si las capas no se armaron todavía, se arman ahora): tocar mide el plano
  // (getBoundingClientRect calcula el estilo de las capas, transparentes) antes de encender una, y así hay fundido.
  const apoyar = (e) => {
    apoyo.current = e.timeStamp
    if (!capas && !desdeMd()) setCapas(true)
  }
  const tocar = (e) => {
    if (desdeMd() || !plano.current || e.timeStamp - apoyo.current > LARGO_MS) return
    const r = plano.current.getBoundingClientRect()
    const k = r.width / ANCHO_PLANO
    const x = (e.clientX - r.left) / k
    const y = ((e.clientY - r.top) * ALTO_PLANO) / r.height
    const sala = salaEnElPunto(x, y, TOLERANCIA_PX / k)
    setCapas(true)
    setActiva(sala === activa ? null : sala)
  }
  return { capas, activa, lugar, apoyar, tocar }
}

/**
 * Dónde va la etiqueta de una sala, en el plano (su bloque contenedor). En el ancho, centrada en proporción a la sala
 * (left y translate con el mismo porcentaje: así nunca se sale del plano). En el alto, si ya se acomodó (`sitio`: el
 * lado y el alto que da useMapaTactil), a AIRE_PX encima de la sala (bottom) o debajo (top), con un porcentaje del
 * alto del plano más el aire en px, y nunca afuera del plano (min con el alto de la etiqueta): así sigue a la sala si
 * el plano cambia de tamaño (RM-02); si no se acomodó todavía, arriba de la sala (está apagada: no se ve).
 */
function estiloDeEtiqueta(id, sitio) {
  const [x0, y0, x1, y1] = cajaDeSala(id)
  const centro = (50 * (x0 + x1)) / ANCHO_PLANO
  const estilo = { left: `${centro}%`, translate: `-${centro}% 0` }
  const arriba = (100 * y0) / ALTO_PLANO
  if (!sitio) estilo.top = `${arriba}%`
  else if (sitio.lado === 'sobre') estilo.bottom = `min(calc(${100 - arriba}% + ${AIRE_PX}px), calc(100% - ${sitio.alto}px))`
  else estilo.top = `min(calc(${(100 * y1) / ALTO_PLANO}% + ${AIRE_PX}px), calc(100% - ${sitio.alto}px))`
  return estilo
}

export default function MapaMuseo() {
  const { titulo, imagen, etiqueta, espacios } = home.mapa
  const plano = useRef(null)
  const etiquetas = useRef(new Map())
  const { capas, activa, lugar, apoyar, tocar } = useMapaTactil(plano, etiquetas)
  return (
    <section aria-labelledby="mapa-titulo" className="pt-12 pb-10 md:py-16">
      <div className={CONTENEDOR_TABLERO}>
        <h2 id="mapa-titulo" className={`${TITULO_SECCION} md:text-center`}>
          {titulo}
        </h2>
        <div
          ref={plano}
          onPointerDown={apoyar}
          onClick={tocar}
          className="relative mx-auto mt-6 w-[min(100%,55.1728rem)] md:mt-10"
        >
          <picture className="contents">
            <source media="(min-width: 48rem)" srcSet={imagen.src} />
            <img
              src={imagen.movil}
              alt={imagen.alt}
              width={imagen.ancho}
              height={imagen.alto}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="block h-auto w-full"
            />
          </picture>
          <svg aria-hidden="true" focusable="false" className="absolute size-0">
            <defs>
              {SALAS_DEL_PLANO.map(({ id, d }) => (
                <clipPath
                  key={id}
                  id={`mapa-${id}`}
                  clipPathUnits="objectBoundingBox"
                  transform="scale(.0011328 .0012318)"
                >
                  <path d={d} />
                </clipPath>
              ))}
            </defs>
          </svg>
          {SALAS_DEL_PLANO.map(({ id }) => (
            <img
              key={id}
              src={imagen.hover}
              alt=""
              width={imagen.ancho}
              height={imagen.alto}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              draggable={false}
              data-sala={id}
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-200 hover:opacity-100 motion-reduce:transition-none max-md:hidden print:hidden"
              style={{ clipPath: `url(#mapa-${id})` }}
            />
          ))}
          {capas && (
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${ANCHO_PLANO} ${ALTO_PLANO}`}
              className="pointer-events-none absolute inset-0 size-full md:hidden print:hidden"
            >
              <defs>
                {SALAS_DEL_PLANO.map(({ id, d }) => {
                  const radio = RADIO[id] ?? RADIO_COMUN
                  return (
                    <mask key={id} id={`mapa-toque-${id}`}>
                      <path
                        d={d}
                        fill="#fff"
                        stroke={radio ? '#fff' : undefined}
                        strokeWidth={radio ? 2 * radio : undefined}
                        strokeLinejoin="round"
                      />
                    </mask>
                  )
                })}
              </defs>
              {SALAS_DEL_PLANO.map(({ id }) => (
                <image
                  key={id}
                  href={mapaTocada}
                  width={ANCHO_PLANO}
                  height={ALTO_PLANO}
                  mask={`url(#mapa-toque-${id})`}
                  data-sala-tocada={id}
                  data-activa={id === activa ? '' : undefined}
                  className={CAPA_TOCADA}
                />
              ))}
            </svg>
          )}
          {capas &&
            SALAS_DEL_PLANO.map(({ id }, i) => (
              <span
                key={id}
                ref={(nodo) => (nodo ? etiquetas.current.set(id, nodo) : etiquetas.current.delete(id))}
                aria-hidden="true"
                data-etiqueta-sala={id}
                data-activa={id === activa ? '' : undefined}
                className={ETIQUETA}
                style={estiloDeEtiqueta(id, lugar[id])}
              >
                {espacios[i]}
              </span>
            ))}
        </div>
        <ul aria-label={etiqueta} className="sr-only">
          {espacios.map((espacio) => (
            <li key={espacio}>{espacio}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
