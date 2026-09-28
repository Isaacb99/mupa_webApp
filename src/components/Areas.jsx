import { useMemo, useRef } from 'react'
import patronC from '../assets/patron-c.svg'
import { areas, site, ui } from '../content.js'
import useAcordeonScroll from '../hooks/useAcordeonScroll.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'
import { PIEDRAS, VIEWBOX } from './marcaPatron.js'
import Placeholder from './Placeholder.jsx'
import TextoDestacado from './TextoDestacado.jsx'

// Colores de cada banda: los del mockup V02 llevados a la paleta del Figma. Fondo de la banda, nombre y marca en el color
// par. El V02 ponía el color de fondo también como borde del panel abierto; el desarrollador lo sacó el 22/09/2026.
// El V04 (28/09/2026) trae otra paleta (azul #3560AA, bordó #6F1627, naranja #EA5D1D, verde #84AE28), que el
// desarrollador decidió no aplicar todavía: se sigue con esta.
const BANDA = {
  ciencia: {
    fondo: 'bg-celeste',
    // Azul de la paleta (#252A5A), pedido del desarrollador el 23/09/2026 (antes negro). Ojo: sobre el celeste da 2,04
    // de contraste; el mínimo de WCAG para texto grande es 3 (el negro daba 3,15).
    texto: 'text-azul',
    boton: 'hover:bg-ink/10 focus-visible:outline-azul',
    // Borde de la etiqueta de arriba (V04): el color de la banda. `encendida`: la etiqueta iluminada por el scroll se
    // rellena con el par de colores de su banda (data-activa; con reduced-motion y al imprimir, siempre).
    borde: 'border-celeste',
    encendida: 'data-activa:bg-celeste data-activa:text-azul motion-reduce:bg-celeste motion-reduce:text-azul print:bg-celeste print:text-azul',
  },
  educacion: {
    fondo: 'bg-bordo',
    texto: 'text-naranja',
    boton: 'hover:bg-paper/10 focus-visible:outline-naranja',
    borde: 'border-bordo',
    encendida: 'data-activa:bg-bordo data-activa:text-naranja motion-reduce:bg-bordo motion-reduce:text-naranja print:bg-bordo print:text-naranja',
  },
  produccion: {
    fondo: 'bg-naranja',
    texto: 'text-bordo',
    boton: 'hover:bg-ink/10 focus-visible:outline-bordo',
    borde: 'border-naranja',
    encendida: 'data-activa:bg-naranja data-activa:text-bordo motion-reduce:bg-naranja motion-reduce:text-bordo print:bg-naranja print:text-bordo',
  },
  formalab: {
    fondo: 'bg-verde-claro',
    texto: 'text-verde-oscuro',
    boton: 'hover:bg-ink/10 focus-visible:outline-verde-oscuro',
    borde: 'border-verde-claro',
    encendida: 'data-activa:bg-verde-claro data-activa:text-verde-oscuro motion-reduce:bg-verde-claro motion-reduce:text-verde-oscuro print:bg-verde-claro print:text-verde-oscuro',
  },
}

const BANDA_DEFAULT = {
  fondo: 'bg-ink-soft',
  texto: 'text-paper',
  boton: 'hover:bg-paper/10 focus-visible:outline-paper',
  borde: 'border-line',
  encendida: 'data-activa:bg-ink-soft motion-reduce:bg-ink-soft print:bg-ink-soft',
}

const PENDIENTE = ui.pendiente

// Las etiquetas de arriba se encienden con el scroll, de a una y en orden (Ciencia, Educación, Producción, Forma Lab),
// y con cada una se enciende (de gris a crema) la piedra correspondiente de la marca MuPa del patrón (M, u, P, a): al
// final la marca queda entera encendida; al subir se apagan en el orden inverso (idea del desarrollador, 28/09/2026).
// Mismo motor por pasos que el mosaico de Obra (useScrollPorPasos con `aplicar`, sin enganche): el scroll elige
// cuántas están encendidas, con histéresis, compuerta de gestos y saltos directos, y el cambio es un fundido de CSS
// (350 ms al encender, 500 al apagar; sin transición cuando el motor pinta directo: data-directo). Estado en el DOM
// (data-activa en cada etiqueta y en cada piedra), sin estado de React. Con reduced-motion y al imprimir, todas
// encendidas (CSS).
function medirEtiquetas({ bloque }) {
  return { paso: 1, lista: bloque.offsetHeight }
}

// 0 cuando el borde de arriba de la lista pasa el 75 % de la pantalla (era el 90 %: la primera se encendía casi en el
// borde de abajo y el desarrollador pidió que arranque "un poco después", 28/09/2026); 1 tras recorrer el 55 % de la
// pantalla (o 1,2 veces el alto de la lista si es más), así las cuatro se encienden mientras la lista sigue entera a la
// vista (a 900 de alto, la primera con la lista a 613 px del borde de arriba y la última a 241).
function progresoEtiquetas({ top }, alto, { lista }) {
  const inicio = alto * 0.75
  const recorrido = Math.max(alto * 0.55, lista * 1.2)
  return Math.min(Math.max((inicio - top) / recorrido, 0), 1)
}

// Parada `fila` = cuántas etiquetas están encendidas, desde la primera; -1: sin efecto (reduced-motion, desmontaje).
function aplicarEtiquetas({ bloque, marca }, fila, animar) {
  const etiquetas = [...bloque.querySelectorAll('li')]
  const piedras = marca ? [...marca.querySelectorAll('path')] : []
  const nodos = [...etiquetas, ...piedras]
  if (fila < 0) {
    for (const nodo of nodos) delete nodo.dataset.activa
    return
  }
  // Sin animar (primer pintado, saltos, reentrada en vista): las transiciones se apagan durante la escritura y vuelven
  // en el frame siguiente, ya con el estado nuevo aplicado.
  if (!animar) bloque.dataset.directo = ''
  etiquetas.forEach((li, i) => {
    if (i < fila) li.dataset.activa = ''
    else delete li.dataset.activa
  })
  piedras.forEach((p, i) => {
    if (i < fila) p.dataset.activa = ''
    else delete p.dataset.activa
  })
  if (!animar) {
    // Forzar el recálculo con las transiciones apagadas antes de volver a habilitarlas.
    void bloque.offsetWidth
    requestAnimationFrame(() => delete bloque.dataset.directo)
  }
}

// Las cuatro piedras rellenas de la marca del patrón c, superpuestas al SVG del patrón (misma caja y viewBox; el SVG
// del patrón ya no las trae). Apagadas van en gris (el gris de los textos secundarios al 40 %) y encendidas en crema,
// sin los colores de las bandas (pedido del desarrollador el 28/09/2026: "grises pero con la misma función de
// encendido"; primero se pintaban del color de cada área).
function MarcaPatron({ referencia, className }) {
  return (
    <svg ref={referencia} viewBox={VIEWBOX} aria-hidden="true" className={className}>
      {PIEDRAS.map((d, i) => (
        <path
          key={i}
          d={d}
          className="fill-muted opacity-40 transition-[fill,opacity] duration-500 ease-out data-activa:fill-paper data-activa:opacity-100 data-activa:duration-[350ms] motion-reduce:fill-paper motion-reduce:opacity-100 print:fill-paper print:opacity-100"
        />
      ))}
    </svg>
  )
}

// Marca MuPa (el SVG blanco del header) en el color del texto: el SVG se usa como máscara sobre bg-current, así toma el
// color de cada banda sin tocar el archivo.
function Marca({ className = '' }) {
  const url = `url("${site.logo.marca}")`
  const mascara = { maskImage: url, maskSize: 'contain', maskRepeat: 'no-repeat' }
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`}
      style={{ ...mascara, WebkitMaskImage: url, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat' }}
    />
  )
}

// Foto del panel: casi cuadrada y con las esquinas redondeadas, como en el V02 (569x566 a 1440). Con el panel cerrado
// (alto 0) una foto lazy no se pediría hasta abrirse y entraría en negro: se pide en cuanto la lista se acerca a la
// pantalla (cargar). Los paneles del V04 no traen fotos, pero el desarrollador pidió mantenerlas (28/09/2026) con las
// dos nuevas de la selección ("Acordeon - Ciencia" y "Acordeon - Produccion").
// srcSet: dos tamaños (570 y 1140 px); en lg la foto mide 569 px, y en celular el ancho del contenido.
function Foto({ src, srcSet, alt, cargar, className = '' }) {
  const marco = `aspect-[569/566] w-full overflow-hidden rounded-[0.625rem] lg:max-w-[35.5625rem] lg:justify-self-end ${className}`
  if (src) {
    return (
      <div className={marco}>
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? '(min-width: 1024px) 36rem, (min-width: 768px) calc(100vw - 5rem), calc(100vw - 3rem)' : undefined}
          alt={alt}
          loading={cargar ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  return <Placeholder alt={alt || PENDIENTE} className={marco} />
}

function Banda({ item, abierto, onToggle, cargar }) {
  const tabId = `tab-${item.id}`
  const panelId = `panel-${item.id}`
  const estilo = BANDA[item.color] ?? BANDA_DEFAULT

  return (
    <li>
      {/* Banda: 102 px de alto a 1440 (V02 y V04), nombre a 48,75 px (V04; el V02 lo tenía a 52) y la marca MuPa a la
          derecha. */}
      <h3
        data-cabecera
        className={`${estilo.fondo} ${estilo.texto} font-display text-2xl leading-[1.15] md:text-[2.75rem] lg:text-[length:min(3.046875rem,3.386vw)]`}
      >
        <button
          type="button"
          id={tabId}
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={onToggle}
          className={`flex min-h-11 w-full items-center text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${estilo.boton}`}
        >
          <span className="mx-auto flex w-full max-w-sitio items-center justify-between gap-6 px-6 py-4 md:px-10 md:py-5 lg:py-[1.3125rem]">
            <span>{item.nombre}</span>
            <Marca className="h-6 w-[4.53rem] lg:h-9 lg:w-[6.8rem]" />
          </span>
        </button>
      </h3>

      {/* Panel: fondo de la página con el texto crema (V04; sin borde: el del color de la banda lo sacó el desarrollador
          el 22/09/2026). En lg, texto a la izquierda (580 px) y foto a la derecha; el lema queda abajo, alineado con el
          final de la foto. Se abre y se cierra animando el alto (fila de grilla de 0fr a 1fr, con el contenido
          recortado): 700 ms al abrir y 500 al cerrar en escritorio, y 1 s / 700 ms con el dedo, con una curva pareja
          (el desarrollador pidió el 22/09/2026 que en el celular fuera más sutil: el panel mide ~1000 px y la curva de
          antes arrancaba de golpe); cerrado queda invisible (fuera del orden de tabulación y del lector de pantalla).
          Al abrir, el texto sube 32 px y aparece, y la foto sube 48 px un poco después y más lento: la diferencia da la
          profundidad, como el párrafo de la intro. Al imprimir, abierto siempre. */}
      <div
        id={panelId}
        data-panel
        role="region"
        aria-labelledby={tabId}
        className={`grid transition-[grid-template-rows,visibility] ease-[cubic-bezier(0.4,0,0.2,1)] print:visible print:grid-rows-[1fr] ${
          abierto
            ? 'visible grid-rows-[1fr] duration-[1000ms] lg:duration-700'
            : 'invisible grid-rows-[0fr] duration-700 lg:duration-500'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mx-auto grid w-full max-w-sitio gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,36.25rem)_minmax(0,35.5625rem)] lg:justify-between lg:py-32">
            <div
              className={`flex flex-col transition ease-out print:translate-y-0 print:opacity-100 ${
                abierto
                  ? 'translate-y-0 opacity-100 delay-200 duration-[900ms] lg:delay-150 lg:duration-700'
                  : 'translate-y-8 opacity-0 duration-300'
              }`}
            >
              {item.logo && (
                /* Logo FormaLAB (V04): 314x52,5 px a 1440, 105 px debajo de la banda (23 menos que el texto de los
                   otros paneles) y el texto 81 px más abajo. */
                <img
                  src={item.logo.src}
                  alt={item.logo.alt}
                  width={item.logo.ancho}
                  height={item.logo.alto}
                  className="mb-8 w-[13rem] lg:-mt-[1.4375rem] lg:mb-[5rem] lg:w-[19.625rem]"
                />
              )}
              {item.parrafos?.length ? (
                <div className="space-y-4 text-base leading-relaxed md:text-lg lg:text-xl lg:leading-8">
                  {item.parrafos.map((parrafo, i) => (
                    <p key={i}>
                      <TextoDestacado texto={parrafo} />
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted italic">{PENDIENTE}</p>
              )}
              {item.lema && (
                /* Lema en Roboto Mono, mayúsculas, 32ch de ancho como el V02. Pesos del V04: Regular a 17,25/30 en
                   Ciencia (lemaPeso 'regular') y Medium a 19,5 en Forma Lab. */
                <p
                  className={`mt-10 max-w-[32ch] font-mono text-sm uppercase md:text-base lg:mt-auto lg:pt-10 ${
                    item.lemaPeso === 'regular'
                      ? 'font-normal lg:text-[1.078125rem] lg:leading-[1.875rem]'
                      : 'font-medium lg:text-[1.21875rem] lg:leading-8'
                  }`}
                >
                  {item.lema}
                </p>
              )}
            </div>
            <Foto
              src={item.foto.src}
              srcSet={item.foto.srcSet}
              alt={item.foto.alt}
              cargar={cargar}
              className={`transition ease-out print:translate-y-0 print:opacity-100 ${
                abierto
                  ? 'translate-y-0 opacity-100 delay-[350ms] duration-[1100ms] lg:delay-[250ms] lg:duration-[900ms]'
                  : 'translate-y-12 opacity-0 duration-300'
              }`}
            />
          </div>
        </div>
      </div>
    </li>
  )
}

export default function Areas() {
  const bandas = useRef(null)
  const { abiertos, alternar, cerca } = useAcordeonScroll(bandas, areas.items.length)
  const etiquetas = areas.etiquetas ?? []
  const lista = useRef(null)
  const marca = useRef(null)
  const refsEtiquetas = useMemo(() => ({ bloque: lista, marca }), [])
  const estilos = etiquetas.map((_, i) => BANDA[areas.items[i]?.color] ?? BANDA_DEFAULT)

  // Una parada más que etiquetas: de ninguna encendida a todas.
  useScrollPorPasos(refsEtiquetas, {
    pasos: etiquetas.length + 1,
    medir: medirEtiquetas,
    progreso: progresoEtiquetas,
    aplicar: aplicarEtiquetas,
    activo: etiquetas.length > 1,
  })

  return (
    /* Padding de arriba: el aire entre el mosaico de Obra y el título. 560 px en lg (el V04 tiene 464 y hasta el
       28/09/2026 eran 290; ese día el desarrollador pidió más aire arriba y abajo del mosaico, primero a 464 y después
       "un poco más"), 128 en celular y 160 en tablet (eran 64 y 96). */
    <section id="areas" aria-labelledby="areas-titulo" className="pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-[35rem]">
      {/* Cabecera del V04 (28/09/2026; hasta entonces el mockup V02, con dos párrafos, título centrado y el remate "que
          el MuPa nunca deje de moverse", que la diseñadora sacó): título en dos líneas a la izquierda (48,75 px,
          interlineado 1,38, la segunda línea en negrita) y, 112 px más abajo, a la derecha (desde el 54,8 % del contenido)
          las cuatro etiquetas de las áreas en recuadros con el borde de su color, y debajo el párrafo. A la izquierda de
          las etiquetas, el patrón c de piedritas con la marca MuPa rellena. overflow-x-clip: el patrón sale por el borde. */}
      <div className="overflow-x-clip">
        <div className="mx-auto w-full max-w-sitio px-6 md:px-10">
          <h2
            id="areas-titulo"
            className={`font-display text-[1.625rem] leading-[1.3] font-light whitespace-pre-line md:text-[2.75rem] lg:text-[length:min(3.046875rem,3.386vw)] lg:leading-[1.38] ${areas.titulo ? '' : 'text-muted'}`}
          >
            {areas.titulo ? <TextoDestacado texto={areas.titulo} /> : PENDIENTE}
          </h2>

          <div className="mt-10 md:mt-16 lg:mt-[7rem] lg:grid lg:grid-cols-[minmax(0,1fr)_34.34375rem]">
            <div className="lg:col-start-2">
              {/* Las etiquetas no son botones (el desarrollador lo confirmó el 28/09/2026): una lista. Recuadros de
                  549,5x56,4 px a 1440, borde de 2,25 px, esquinas de 3,7, 40 px entre sí, Roboto Mono Regular 24 crema
                  a 21,5 px del borde. Se encienden con el scroll (ver aplicarEtiquetas): la encendida se rellena con
                  el par de colores de su banda. data-directo apaga las transiciones cuando el motor pinta directo. */}
              <ul ref={lista} role="list" className="relative flex flex-col gap-6 lg:gap-10 [&[data-directo]_*]:!transition-none">
                {/* Patrón c (V04), colgado de la lista para quedar centrado con ella: caja de 1756x415 px a 1440 cuyo
                    borde izquierdo arranca 1148 px a la izquierda de las etiquetas (370 fuera de la pantalla a 1440); la
                    máscara (index.css: patron-c) lo deja opaco en el borde de la pantalla y transparente antes de llegar
                    a las etiquetas. Encima, con la misma caja, las cuatro piedras de la marca, grises y sin máscara,
                    que se encienden en crema (MarcaPatron). Solo en lg. */}
                <img
                  src={patronC}
                  alt=""
                  aria-hidden="true"
                  className="patron-c pointer-events-none absolute top-1/2 -left-[71.75rem] hidden w-[109.74rem] max-w-none -translate-y-1/2 lg:block"
                />
                <MarcaPatron
                  referencia={marca}
                  className="pointer-events-none absolute top-1/2 -left-[71.75rem] hidden h-auto w-[109.74rem] max-w-none -translate-y-1/2 lg:block"
                />
                {etiquetas.map((etiqueta, i) => {
                  const estilo = estilos[i]
                  return (
                    <li
                      key={etiqueta}
                      className={`relative flex h-12 items-center rounded-[0.25rem] border-2 px-4 font-mono text-base transition-[background-color,color] duration-500 ease-out data-activa:duration-[350ms] md:h-[3.525rem] md:px-[1.34375rem] md:text-2xl lg:border-[2.25px] ${estilo.borde} ${estilo.encendida}`}
                    >
                      {etiqueta}
                    </li>
                  )
                })}
              </ul>
              {/* Párrafo del V04: 452 px, 22,5/36, peso 400 (como en el archivo; los demás párrafos van en 300). */}
              <p className="mt-10 text-base leading-relaxed md:text-lg lg:mt-[5.6rem] lg:max-w-[28.25rem] lg:text-[1.40625rem] lg:leading-9">
                {areas.parrafo || PENDIENTE}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bandas pegadas una a la otra (el V02 y el V04 las separan 2 px; el desarrollador pidió sacar esa línea el
          22/09/2026 y lo mantuvo el 28/09). Con el scroll queda abierta solo la que se está recorriendo: se abre cuando
          su cabecera llega al 60 % de la pantalla y la de arriba se cierra cuando ya quedó fuera de la pantalla (pedidos
          del desarrollador del 22/09/2026); el clic abre y cierra cualquiera en cualquier momento (useAcordeonScroll).
          data-directo, en la lista o en una banda: el hook pinta sin animar (carga, saltos desde lejos, bandas que se
          cierran fuera de la pantalla). */}
      <ul
        ref={bandas}
        className="mt-12 flex w-full flex-col md:mt-16 lg:mt-[12.875rem] [&_[data-directo]_*]:!transition-none [&[data-directo]_*]:!transition-none"
      >
        {areas.items.map((item, i) => (
          <Banda key={item.id} item={item} abierto={abiertos[i]} onToggle={() => alternar(i)} cargar={cerca} />
        ))}
      </ul>
    </section>
  )
}
