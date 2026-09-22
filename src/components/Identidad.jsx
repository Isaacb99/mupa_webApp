import { useMemo, useRef } from 'react'
import { identidad, ui } from '../content.js'
import { medirEnganche, progresoEnganche } from '../hooks/enganche.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'
import Collage from './Collage.jsx'
import Placeholder from './Placeholder.jsx'
import TextoDestacado from './TextoDestacado.jsx'

const PENDIENTE = ui.pendiente

// Los ejes (Eje narrativo, Visión, Misión) se muestran de a uno. Al llegar a la sección, la pantalla se engancha
// (sticky) y con el scroll pasan de uno al otro con el mismo motor que la palabra del titular (useScrollPorPasos con
// `aplicar`): cada eje se lee quieto y el paso dura siempre lo mismo. El paso es un carrusel en un marco fijo (pedido
// del desarrollador el 21/09/2026, en vez del deslizamiento de paneles enteros que había): el marco de la foto no se
// mueve (a la derecha en escritorio, arriba en celular) y por adentro la foto nueva entra desde la derecha mientras la
// anterior sale por la izquierda; el texto y la palabra grande se renuevan en el lugar, con un fundido y un
// desplazamiento corto. En escritorio la palabra grande queda apoyada en el borde de abajo de la foto (también pedido
// suyo). Después del último eje, la sección se suelta y la página sigue. Variante apilado (index.css: reduced-motion o
// pantalla de menos de 30rem de alto): no se engancha y los tres ejes van uno debajo del otro, con su foto.

// ms que tarda el paso de un eje al otro (el titular usa 360 para una fila de ~68 px).
const DURACION_PANEL = 560
// px que se desplaza el texto al renovarse: entra desde la derecha y sale hacia la izquierda, como la foto pero poco.
const CORRIMIENTO_TEXTO = 24
const CURVA = 'cubic-bezier(0.33, 0, 0.67, 1)'

// paso 0 cuando no está enganchado (apilado): así el motor pinta directo al pasar de un modo al otro.
function medir({ fijo, cola }) {
  const enganche = medirEnganche(fijo)
  return { paso: enganche.enganchado ? 1 : 0, ...enganche, cola: enganche.enganchado ? cola.offsetHeight : 0 }
}

// Progreso de los ejes: 0 al engancharse y 1 al llegar al último, que queda quieto durante la cola (el final del bloque,
// data-cola) antes de soltarse. Sin cola, el mismo gesto que mostraba el último eje sacaba de la sección y no se llegaba
// a leer (pedido del desarrollador el 22/09/2026, en escritorio y en celular). Los cambios de eje quedan en el mismo
// scroll que antes: al 30 % y al 80 % del recorrido sin la cola.
function progreso(rect, alto, medida) {
  const p = progresoEnganche(rect, alto, medida)
  if (!medida.enganchado) return p
  const recorrido = rect.height - medida.altoFijo
  const util = recorrido - medida.cola
  return util > 0 ? Math.min((p * recorrido) / util, 1) : p
}

// Paso de un nodo a un estado en línea (las propiedades de `destino`), animando desde el estado calculado actual. Sin
// estado propio: el destino vigente queda en data-destino, y un cambio a mitad de viaje arranca desde donde está.
// `tiempo`: duración y demora de la animación (con demora, el nodo se queda en el estado de partida hasta que arranca).
// En dos tiempos para no intercalar lecturas y escrituras (cada getComputedStyle después de escribir estilos forzaba otro
// recálculo: 6 por cambio de eje, medido): `preparar` solo lee y `ejecutar` solo escribe; aplicar prepara todos los
// nodos y después los ejecuta.
// visibility no va en la animación (con ella el navegador no la puede pasar al compositor y, en un celular de gama baja,
// el cuadro del cambio llegaba a 92 ms; medido el 22/09/2026): el que entra se ve apenas arranca y el que sale queda
// visible hasta que termina, y recién ahí pasa a hidden (si mientras tanto no cambió de destino).
function preparar(nodo, destino, animar, tiempo = { duration: DURACION_PANEL }) {
  const clave = Object.values(destino).join('|')
  if (nodo.dataset.destino === clave) return { nodo, destino, animar, igual: true }
  const actual = getComputedStyle(nodo)
  const desde = {}
  for (const k of Object.keys(destino)) {
    if (k !== 'visibility') desde[k] = k === 'translate' && actual.translate === 'none' ? '0px 0px' : actual[k]
  }
  return { nodo, destino, animar, tiempo, clave, desde }
}

function ejecutar({ nodo, destino, animar, tiempo, clave, desde, igual }) {
  const oculto = destino.visibility === 'hidden'
  if (igual) {
    // Directo con el mismo destino: se corta lo que estuviera animando y queda el estado final en línea.
    if (!animar) {
      nodo.getAnimations().forEach((a) => a.cancel())
      if ('visibility' in destino) nodo.style.visibility = destino.visibility
    }
    return
  }
  nodo.getAnimations().forEach((a) => a.cancel())
  for (const [k, v] of Object.entries(destino)) nodo.style[k] = k === 'visibility' && animar && oculto ? '' : v
  nodo.dataset.destino = clave
  if (!animar) return
  const hasta = { ...destino }
  delete hasta.visibility
  const animacion = nodo.animate([desde, hasta], { ...tiempo, easing: CURVA, fill: 'backwards' })
  if (oculto) {
    animacion.onfinish = () => {
      if (nodo.dataset.destino === clave) nodo.style.visibility = 'hidden'
    }
  }
}

function reponer(nodo) {
  nodo.getAnimations().forEach((a) => a.cancel())
  nodo.style.translate = ''
  nodo.style.opacity = ''
  nodo.style.visibility = ''
  delete nodo.dataset.destino
}

// Parada `fila` = eje activo. Las fotos del marco se corren (i - fila) anchos del marco a lo largo de todo el paso; el
// texto y la palabra del eje activo se ven en su lugar y los demás quedan transparentes, corridos hacia donde se
// fueron (los anteriores a la izquierda, los siguientes a la derecha) y ocultos para el puntero y el lector. El texto
// que sale se va en la primera mitad del paso y el que entra llega en la segunda: si se cruzaran, las dos palabras
// grandes se leerían superpuestas.
function aplicar({ marco, textos, palabras }, fila, animar) {
  const fotos = [...marco.children]
  const grupos = [[...textos.children], [...palabras.children]]
  if (fila < 0) {
    ;[...fotos, ...grupos.flat()].forEach(reponer)
    return
  }
  const mitad = DURACION_PANEL / 2
  // Las fotos fuera del marco quedan además con visibility hidden: recortadas por el marco seguían en el árbol de
  // accesibilidad y el lector de pantalla anunciaba las tres seguidas (hallazgo de la revisión adversarial, 21/09/2026).
  const pasos = fotos.map((foto, i) =>
    preparar(foto, { translate: `${(i - fila) * 100}% 0px`, visibility: i === fila ? '' : 'hidden' }, animar),
  )
  for (const grupo of grupos) {
    grupo.forEach((nodo, i) => {
      const activo = i === fila
      pasos.push(preparar(
        nodo,
        {
          translate: activo ? '0px 0px' : `${(i < fila ? -1 : 1) * CORRIMIENTO_TEXTO}px 0px`,
          opacity: activo ? '1' : '0',
          visibility: activo ? '' : 'hidden',
        },
        animar,
        activo ? { duration: mitad, delay: mitad } : { duration: mitad },
      ))
    })
  }
  pasos.forEach(ejecutar)
}

// lazy: las fotos del carrusel que arrancan fuera del marco no pueden ser lazy: recortadas por el marco nunca "entran"
// en pantalla, así que la descarga arrancaba recién al empezar el paso y la foto entraba en negro (hallazgo de la
// revisión adversarial, 21/09/2026). Las copias de la versión apilada sí son lazy (misma URL: salen de caché).
function Foto({ src, srcSet, alt, encuadre, lazy = true }) {
  if (!src) return <Placeholder alt={alt || PENDIENTE} className="h-full w-full" />
  return (
    <>
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? '(min-width: 1024px) 50vw, 100vw' : undefined}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        fetchPriority={lazy ? undefined : 'low'}
        className={`h-full w-full object-cover ${encuadre ?? ''}`}
      />
      {/* Sombreado (pedido del desarrollador, 18/09/2026; el Figma lo tiene abajo): en lg la foto se oscurece hacia su
          borde derecho, el de la pantalla, así el lado que mira al texto queda con todo su brillo y la foto se distingue;
          en pantallas chicas, donde va arriba, se oscurece hacia abajo. Misma intensidad que el Figma: brillo 100 % hasta
          el 13 %, ~35 % en el borde. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent from-13% to-black/65 lg:bg-linear-to-r"
      />
    </>
  )
}

// Estilos del texto y de la palabra grande, compartidos por el carrusel y la versión apilada.
const ETIQUETA = 'font-mono text-base font-bold uppercase md:text-xl'
const TEXTO = 'mt-3 text-[0.9375rem] leading-[1.4rem] md:mt-5 md:text-base md:leading-6'
// Palabra grande del eje: fina y blanca pareja (120 px a 1440). El Figma la tiene con un degradé a gris abajo; el
// desarrollador pidió sacarlo el 22/09/2026, primero en escritorio ("la sombra de abajo") y después también en celular.
const PALABRA =
  'font-display text-[length:clamp(3.25rem,min(8.4vw,15svh),7.5rem)] leading-none font-thin tracking-[-0.03em] text-paper'

// Estado inicial de los textos y palabras (antes de que el motor pinte): solo el primero a la vista.
const inicial = (i) =>
  i === 0 ? undefined : { translate: `${CORRIMIENTO_TEXTO}px 0px`, opacity: 0, visibility: 'hidden' }

// El carrusel: un marco fijo con las tres fotos y, al lado (o abajo), el texto y la palabra del eje activo.
function Carrusel({ ejes, marco, textos, palabras }) {
  return (
    <div className="@container relative flex h-full w-full flex-col lg:block">
      {/* Marco de la foto. En pantallas chicas va arriba y usa el alto que deja el texto (entre 18 % y 38 % de la pantalla),
          así entra también en celulares bajos. En lg va a la derecha, al ras del borde, alineado con la etiqueta. Las
          fotos van adentro una al lado de la otra, corridas un ancho cada una; el marco recorta. */}
      <div
        ref={marco}
        data-marco
        className="relative max-h-[38svh] min-h-[18svh] w-full flex-1 overflow-hidden lg:absolute lg:top-0 lg:right-0 lg:aspect-[710/476] lg:max-h-[calc(100%-2.5rem)] lg:min-h-0 lg:w-[49.3%]"
      >
        {ejes.map((eje, i) => (
          <div
            key={eje.etiqueta}
            className="absolute inset-0"
            style={{ translate: `${i * 100}% 0px`, visibility: i === 0 ? undefined : 'hidden' }}
          >
            <Foto {...eje.foto} lazy={i === 0} />
          </div>
        ))}
      </div>
      {/* Columna de texto. En lg mide lo mismo que la foto (49,3 % del ancho por 476/710 = 33,05 cqw del contenedor, con
          el mismo tope de alto), así la palabra grande, que va abajo, queda apoyada en el borde inferior de la foto: su
          baseline sobre ese borde (leading-none deja la baseline 0,15 em por encima del borde de su caja). */}
      <div className="mx-auto flex w-full max-w-sitio flex-1 flex-col px-6 pt-5 md:px-10 lg:h-[min(33.05cqw,100%-2.5rem)] lg:flex-none lg:pt-0">
        <div ref={textos} data-textos className="grid max-w-[25rem] lg:w-[46%]">
          {ejes.map((eje, i) => (
            <article key={eje.etiqueta} aria-labelledby={`eje-${i}`} className="col-start-1 row-start-1" style={inicial(i)}>
              <h3 id={`eje-${i}`} className={ETIQUETA}>
                {eje.etiqueta}
              </h3>
              <p className={TEXTO}>{eje.texto || PENDIENTE}</p>
            </article>
          ))}
        </div>
        {/* En celular la palabra queda 64 px por encima del borde de abajo de la pantalla (eran 20: pedido del
            desarrollador el 22/09/2026, se chocaba con los botones del teléfono), más el área segura si la hay. */}
        <div
          ref={palabras}
          data-palabras
          className="mt-auto grid pt-4 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-6 md:pb-10 lg:pb-0"
        >
          {ejes.map((eje, i) => (
            <p key={eje.etiqueta} className={`col-start-1 row-start-1 lg:-mb-[0.15em] ${PALABRA}`} style={inicial(i)}>
              {eje.palabra}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// Un eje entero, para la versión apilada: foto arriba en pantallas chicas y flotando a la derecha de su texto en lg.
function Eje({ eje, id }) {
  return (
    <article aria-labelledby={id} className="relative flow-root">
      <div className="relative aspect-[710/476] w-full overflow-hidden lg:float-right lg:ml-8 lg:w-[49.3%]">
        <Foto {...eje.foto} />
      </div>
      <div className="mx-auto w-full max-w-sitio px-6 pt-5 md:px-10 lg:pt-0">
        <div className="max-w-[25rem] lg:w-[46%]">
          <h3 id={id} className={ETIQUETA}>
            {eje.etiqueta}
          </h3>
          <p className={TEXTO}>{eje.texto || PENDIENTE}</p>
        </div>
        <p className={`mt-6 pt-4 pb-5 md:pt-6 md:pb-10 ${PALABRA}`}>{eje.palabra}</p>
      </div>
    </article>
  )
}

export default function Identidad() {
  const { titulo, ejes = [], collage = [], parrafo, instituciones } = identidad
  const bloque = useRef(null)
  const fijo = useRef(null)
  const marco = useRef(null)
  const textos = useRef(null)
  const palabras = useRef(null)
  const cola = useRef(null)
  const refs = useMemo(() => ({ bloque, fijo, marco, textos, palabras, cola }), [])
  const activo = ejes.length > 1

  useScrollPorPasos(refs, { pasos: ejes.length, medir, progreso, aplicar, duracion: DURACION_PANEL, activo })

  return (
    <section id="identidad" aria-labelledby="identidad-titulo">
      {/* Alto del bloque = pantalla fija + el scroll para recorrer los ejes: 1 pantalla en lg (~450 px por eje a 900 de
          alto, ~4,5 muescas de rueda) y 1,1 con el dedo (~447 px por eje a 375x812). En lg eran 1,5 pantallas hasta el
          21/09/2026: el desarrollador las sintió largas. Con el dedo era 1 pantalla; el 22/09/2026 pidió un poco más de
          recorrido por paso en celular (+25 %) y ese mismo día, porque un usuario de prueba lo sintió trabado, un punto
          medio (+10 %). Más la cola, con el último eje quieto antes de soltarse (ver progreso): 30 % de pantalla en lg y 45 %
          con el dedo (el desarrollador la pidió más larga en celular el 22/09/2026). */}
      <div ref={bloque} className={activo ? 'relative h-[255svh] lg:h-[230svh] apilado:h-auto' : 'relative'}>
        <div
          ref={fijo}
          className={activo ? 'sticky top-0 flex h-svh flex-col overflow-clip apilado:static apilado:h-auto' : 'flex flex-col'}
        >
          <div className="mx-auto w-full max-w-sitio px-6 pt-6 pb-4 md:px-10 md:pt-12 md:pb-10">
            <h2
              id="identidad-titulo"
              className={`font-display text-[1.625rem] leading-[1.15] md:text-[2.75rem] lg:text-[length:min(3.25rem,3.6vw)] ${titulo ? '' : 'text-muted'}`}
            >
              {titulo || PENDIENTE}
            </h2>
          </div>
          {/* Carrusel (enganchado) o, en la variante apilado, los ejes uno debajo del otro: los dos están en el DOM y la
              variante muestra uno solo (display: none no carga las fotos lazy del otro). */}
          <div className="relative min-h-0 flex-1 apilado:hidden">
            <Carrusel ejes={ejes} marco={marco} textos={textos} palabras={palabras} />
          </div>
          <div className="hidden apilado:flex apilado:flex-col apilado:gap-16">
            {ejes.map((eje, i) => (
              <Eje key={eje.etiqueta} eje={eje} id={`eje-apilado-${i}`} />
            ))}
          </div>
        </div>
        {/* Cola: el último tramo del bloque, en el que el último eje queda quieto antes de soltarse (lo mide `medir`). */}
        {activo && (
          <div ref={cola} data-cola aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[45svh] lg:h-[30svh] apilado:hidden" />
        )}
      </div>

      {/* El collage trae su propio bloque enganchado (queda centrado en la pantalla mientras el scroll saca las fotos): el
          espacio de arriba lo da ese centrado (136 px a 1440x900) y el de abajo lo descuenta él mismo (collage-cola), así
          el cierre sigue a 48 px de la caja. */}
      <div className="lg:mt-12">
        <Collage fotos={collage} />
      </div>

      {/* Cierre del Figma: párrafo de 567 px (20/32) y, 198 px a su derecha, los logos en columna (73 px entre sí). */}
      <div className="mx-auto w-full max-w-sitio px-6 pt-12 pb-16 md:px-10 md:pb-24 lg:flex lg:items-center lg:gap-12 xl:gap-[12.375rem]">
        <p
          className={
            parrafo
              ? 'text-base leading-relaxed md:text-lg lg:max-w-[35.4375rem] lg:shrink lg:text-xl lg:leading-8'
              : 'text-muted'
          }
        >
          {parrafo ? <TextoDestacado texto={parrafo} /> : PENDIENTE}
        </p>

        <ul
          aria-label={ui.instituciones}
          className="mt-12 flex flex-col items-start gap-10 lg:mt-0 lg:shrink-0 lg:gap-[4.5625rem]"
        >
          {instituciones.map(({ nombre, logo, ancho, alto }) => (
            <li key={nombre}>
              {logo ? (
                /* Ancho del Figma a 1440 (--ancho); por debajo de lg, al 70 %. width/height reservan la proporción antes
                   de que cargue el SVG, así no empuja la página. */
                <img
                  src={logo}
                  alt={nombre}
                  width={ancho}
                  height={alto}
                  loading="lazy"
                  style={{ '--ancho': `${(ancho ?? 200) / 16}rem` }}
                  className="w-[calc(var(--ancho)*0.7)] lg:w-(--ancho)"
                />
              ) : (
                <span className="inline-flex items-center border border-line px-4 py-3 text-xs uppercase tracking-wider text-muted">
                  {nombre}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
