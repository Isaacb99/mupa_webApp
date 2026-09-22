import { useRef } from 'react'
import { areas, site, ui } from '../content.js'
import useAcordeonScroll from '../hooks/useAcordeonScroll.js'
import useAparecer from '../hooks/useAparecer.js'
import Placeholder from './Placeholder.jsx'
import TextoDestacado from './TextoDestacado.jsx'

// Colores de cada banda: los del mockup V02 llevados a la paleta del Figma. Fondo de la banda, nombre y marca en el color
// par. El V02 ponía el color de fondo también como borde del panel abierto; el desarrollador lo sacó el 22/09/2026.
const BANDA = {
  ciencia: {
    fondo: 'bg-celeste',
    texto: 'text-ink',
    boton: 'hover:bg-ink/10 focus-visible:outline-ink',
  },
  educacion: {
    fondo: 'bg-bordo',
    texto: 'text-naranja',
    boton: 'hover:bg-paper/10 focus-visible:outline-naranja',
  },
  produccion: {
    fondo: 'bg-naranja',
    texto: 'text-bordo',
    boton: 'hover:bg-ink/10 focus-visible:outline-bordo',
  },
  formalab: {
    fondo: 'bg-verde-claro',
    texto: 'text-verde-oscuro',
    boton: 'hover:bg-ink/10 focus-visible:outline-verde-oscuro',
  },
}

const BANDA_DEFAULT = {
  fondo: 'bg-ink-soft',
  texto: 'text-paper',
  boton: 'hover:bg-paper/10 focus-visible:outline-paper',
}

const PENDIENTE = ui.pendiente

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
// pantalla (cargar).
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
      {/* Banda del V02: 102 px de alto a 1440, nombre a 52 px (como los títulos) y la marca MuPa a la derecha. */}
      <h3
        data-cabecera
        className={`${estilo.fondo} ${estilo.texto} font-display text-2xl leading-[1.15] md:text-[2.75rem] lg:text-[length:min(3.25rem,3.6vw)]`}
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

      {/* Panel: fondo de la página, sin borde (el del color de la banda lo sacó el desarrollador el 22/09/2026). En lg,
          texto a la izquierda (580 px) y foto a la derecha; el lema queda abajo, alineado con el final de la foto. Se abre
          y se cierra animando el alto (fila de grilla de 0fr a 1fr, con el contenido recortado): 700 ms al abrir y 500 al
          cerrar en escritorio, y 1 s / 700 ms con el dedo, con una curva pareja (el desarrollador pidió el 22/09/2026 que
          en el celular fuera más sutil: el panel mide ~1000 px y la curva de antes arrancaba de golpe); cerrado queda
          invisible
          (fuera del orden de tabulación y del lector de pantalla). Al abrir, el texto sube 32 px y aparece, y la foto
          sube 48 px un poco después y más lento: la diferencia da la profundidad, como el párrafo de la intro. Al
          imprimir, abierto siempre. */}
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
                /* Lema: Roboto Mono Bold 20 px en mayúsculas, 32ch de ancho como el V02 (Ciencia y Forma Lab). */
                <p className="mt-10 max-w-[32ch] font-mono text-sm font-bold uppercase md:text-base lg:mt-auto lg:pt-10 lg:text-xl lg:leading-8">
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
  const remate = useRef(null)
  const remateVisible = useAparecer(remate)
  const parrafos = areas.parrafos ?? []

  return (
    <section id="areas" aria-labelledby="areas-titulo" className="pt-16 pb-16 md:pt-24 md:pb-24 lg:pt-[18.125rem]">
      <div className="mx-auto flex w-full max-w-sitio flex-col px-6 md:px-10">
        {/* Título centrado, 290 px debajo de los párrafos (V02). El remate ("que el MuPa nunca deje de moverse") es parte
            de la oración: aparece una vez, con un fundido y un desplazamiento corto, cuando llega al 80 % de la
            pantalla (nota del diseñador en el V02). Con reduced-motion está siempre visible. */}
        <h2
          id="areas-titulo"
          className={`order-last mt-16 text-center font-display text-[1.625rem] leading-[1.15] whitespace-pre-line md:mt-24 md:text-[2.75rem] lg:mt-[18.5rem] lg:text-[length:min(3.25rem,3.6vw)] ${areas.titulo ? '' : 'text-muted'}`}
        >
          {areas.titulo || PENDIENTE}
          {areas.remate && (
            <>
              {' '}
              {/* El observador mira el envoltorio, que no se traslada (el strong arranca 24 px más abajo). Al imprimir
                  se ve siempre. */}
              <span ref={remate} className="mt-7 block">
                <strong
                  className={`block transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 ${
                    remateVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`}
                >
                  {areas.remate}
                </strong>
              </span>
            </>
          )}
        </h2>
        {/* Párrafos del V02: 567 px, 20/32 (como el cierre de Identidad). */}
        <div className="order-first space-y-4 lg:max-w-[35.4375rem]">
          {parrafos.length ? (
            parrafos.map((parrafo, i) => (
              <p key={i} className="text-base leading-relaxed md:text-lg lg:text-xl lg:leading-8">
                <TextoDestacado texto={parrafo} />
              </p>
            ))
          ) : (
            <p className="text-muted">{PENDIENTE}</p>
          )}
        </div>
      </div>

      {/* Bandas 206 px debajo del remate, pegadas una a la otra (el V02 las separaba 2 px; el desarrollador pidió sacar esa
          línea el 22/09/2026). Con el scroll queda abierta solo
          la que se está recorriendo: se abre cuando su cabecera llega al 60 % de la pantalla y la de arriba se cierra
          cuando ya quedó fuera de la pantalla (pedidos del desarrollador del 22/09/2026); el clic abre y cierra
          cualquiera en cualquier momento (useAcordeonScroll). data-directo, en la lista o en una banda: el hook pinta sin
          animar (carga, saltos desde lejos, bandas que se cierran fuera de la pantalla). */}
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
