import { useMemo, useRef } from 'react'
import { identidad, ui } from '../content.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'
import Placeholder from './Placeholder.jsx'

const PENDIENTE = ui.pendiente

// Los ejes (Eje narrativo, Visión, Misión) van en paneles uno al lado del otro. Al llegar a la sección, la pantalla
// se engancha (sticky) y con el scroll los paneles se deslizan de a uno hacia la izquierda, con el mismo motor que la
// palabra del titular: cada panel se lee quieto y el deslizamiento dura siempre lo mismo. Después del último, la
// sección se suelta y la página sigue. Variante apilado (index.css: reduced-motion o pantalla de menos de 30rem de
// alto): no se engancha y los paneles van uno debajo del otro.

// ms que tarda en deslizarse un panel (el titular usa 360 para una fila de ~68 px).
const DURACION_PANEL = 560

// Paso = ancho de la ventana de los paneles (se desliza a la izquierda, por eso negativo). Se mide también dónde se
// engancha el bloque fijo (su top de CSS) y cuánto mide, para el progreso. Si no está enganchado (apilado), no hay
// recorrido: paso 0.
function medir({ ventana, fijo }) {
  const estilo = getComputedStyle(fijo)
  if (estilo.position !== 'sticky') return { paso: 0, enganchado: false }
  return { paso: -ventana.clientWidth, enganchado: true, topFijo: parseFloat(estilo.top) || 0, altoFijo: fijo.offsetHeight }
}

// Progreso 0..1 mientras el bloque fijo está enganchado: 0 cuando se engancha, 1 cuando se suelta.
function progreso({ top, height }, alto, { enganchado, topFijo, altoFijo }) {
  const recorrido = height - altoFijo
  if (!enganchado || recorrido <= 0) return 0
  return Math.min(Math.max((topFijo - top) / recorrido, 0), 1)
}

function Foto({ src, srcSet, alt, encuadre }) {
  if (!src) return <Placeholder alt={alt || PENDIENTE} className="h-full w-full" />
  return (
    <>
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? '(min-width: 1024px) 50vw, 100vw' : undefined}
        alt={alt}
        loading="lazy"
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

function Eje({ eje, id }) {
  return (
    <article
      aria-labelledby={id}
      className="relative flex h-full w-full shrink-0 flex-col lg:block apilado:h-auto apilado:lg:flow-root"
    >
      {/* Foto. En pantallas chicas va arriba y usa el alto que deja el texto (entre 18 % y 38 % de la pantalla), así el
          panel entra también en celulares bajos. En lg va a la derecha, al ras del borde, alineada con la etiqueta.
          Apilado: con su proporción, arriba en pantallas chicas y flotando a la derecha de su texto en lg. */}
      <div className="relative max-h-[38svh] min-h-[18svh] w-full flex-1 overflow-hidden lg:absolute lg:top-0 lg:right-0 lg:aspect-[710/476] lg:max-h-[calc(100%-2.5rem)] lg:min-h-0 lg:w-[49.3%] apilado:aspect-[710/476] apilado:max-h-none apilado:min-h-0 apilado:flex-none apilado:lg:relative apilado:lg:float-right apilado:lg:ml-8">
        <Foto {...eje.foto} />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pt-5 md:px-10 lg:h-full lg:pt-0 apilado:flex-none apilado:lg:block">
        <div className="max-w-[25rem] lg:w-[46%]">
          <h3 id={id} className="font-mono text-base font-bold uppercase md:text-xl">
            {eje.etiqueta}
          </h3>
          <p className="mt-3 text-[0.9375rem] leading-[1.4rem] md:mt-5 md:text-base md:leading-6">{eje.texto || PENDIENTE}</p>
        </div>
        {/* Palabra grande del eje: fina y con degradé a gris, como en el Figma (120 px a 1440). */}
        <p className="mt-auto bg-linear-to-b from-paper from-15% to-[#4c4c4c] bg-clip-text pt-4 pb-5 font-display text-[length:clamp(3.25rem,min(8.4vw,15svh),7.5rem)] leading-none font-extralight tracking-[-0.03em] text-transparent md:pt-6 md:pb-10 apilado:mt-6">
          {eje.palabra}
        </p>
      </div>
    </article>
  )
}

export default function Identidad() {
  const { titulo, ejes = [], parrafo, instituciones } = identidad
  const bloque = useRef(null)
  const fijo = useRef(null)
  const ventana = useRef(null)
  const pista = useRef(null)
  const refs = useMemo(() => ({ elemento: pista, bloque, fijo, ventana }), [])
  const activo = ejes.length > 1

  useScrollPorPasos(refs, { pasos: ejes.length, medir, progreso, eje: 'x', duracion: DURACION_PANEL, activo })

  return (
    <section id="identidad" aria-labelledby="identidad-titulo" className="scroll-mt-16">
      {/* Alto del bloque = pantalla fija + el scroll para recorrer los paneles: 1,5 pantallas en lg (con rueda, ~5 muescas
          por panel) y 1 pantalla en pantallas chicas, donde el dedo avanza más por gesto (~400 px por panel a 375x812). */}
      <div
        ref={bloque}
        className={activo ? 'relative h-[calc(200svh-4rem)] lg:h-[calc(250svh-4rem)] apilado:h-auto' : 'relative'}
      >
        <div
          ref={fijo}
          className={
            activo
              ? 'sticky top-16 flex h-[calc(100svh-4rem)] flex-col overflow-clip apilado:static apilado:h-auto'
              : 'flex flex-col'
          }
        >
          <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-4 md:px-10 md:pt-12 md:pb-10">
            <h2
              id="identidad-titulo"
              className={`font-display text-[1.625rem] font-medium tracking-tight md:text-[2.75rem] lg:text-[length:min(3.25rem,3.6vw)] ${titulo ? '' : 'text-muted'}`}
            >
              {titulo || PENDIENTE}
            </h2>
          </div>
          <div ref={ventana} className="relative min-h-0 flex-1 overflow-clip apilado:overflow-visible">
            <div ref={pista} className="flex h-full apilado:flex-col apilado:gap-16">
              {ejes.map((eje, i) => (
                <Eje key={eje.etiqueta} eje={eje} id={`eje-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-24 lg:flex lg:items-end lg:justify-between lg:gap-12">
        <p className={parrafo ? 'text-base leading-relaxed text-paper/80 md:text-lg' : 'text-muted'}>
          {parrafo || PENDIENTE}
        </p>

        <ul
          aria-label={ui.instituciones}
          className="mt-8 flex flex-wrap items-center gap-3 lg:mt-0 lg:shrink-0 lg:justify-end"
        >
          {instituciones.map(({ nombre, logo }) => (
            <li key={nombre}>
              {logo ? (
                <img src={logo} alt={nombre} loading="lazy" className="h-10 w-auto" />
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
