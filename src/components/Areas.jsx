import { useState } from 'react'
import { areas, site, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'

const TEXTO_CLARO = {
  texto: 'text-paper',
  boton: 'hover:bg-paper/10 focus-visible:outline-paper',
}

const TEXTO_OSCURO = {
  texto: 'text-ink',
  boton: 'hover:bg-ink/10 focus-visible:outline-ink',
}

const BANDA = {
  ciencia: { fondo: 'bg-ciencia', ...TEXTO_CLARO },
  educacion: { fondo: 'bg-educacion', ...TEXTO_CLARO },
  espectaculo: { fondo: 'bg-espectaculo', ...TEXTO_OSCURO },
  formalab: { fondo: 'bg-formalab', ...TEXTO_OSCURO },
}

const BANDA_DEFAULT = { fondo: 'bg-ink-soft', ...TEXTO_CLARO }

const PENDIENTE = ui.pendiente

function Foto({ src, alt }) {
  const marco = 'aspect-[4/3] w-full overflow-hidden'
  if (src) {
    return (
      <div className={marco}>
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    )
  }
  return <Placeholder alt={alt || PENDIENTE} className={marco} />
}

function Banda({ item, abierto, onToggle }) {
  const tabId = `tab-${item.id}`
  const panelId = `panel-${item.id}`
  const estilo = BANDA[item.color] ?? BANDA_DEFAULT

  return (
    <li className={`${estilo.fondo} ${estilo.texto}`}>
      {/* Nombre de banda: 65 px en el mockup (0,85× del h2), 44 px con interlineado 1 desde md. */}
      <h3 className="font-display text-2xl md:text-[2.75rem] md:leading-none">
        <button
          type="button"
          id={tabId}
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={onToggle}
          className={`flex min-h-11 w-full items-center justify-between text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${estilo.boton}`}
        >
          <span className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10 md:py-6">
            <span className="font-light">{item.nombre}</span>
            <span className="font-bold" aria-hidden="true">
              {site.nombre}
            </span>
          </span>
        </button>
      </h3>

      <div id={panelId} role="region" aria-labelledby={tabId} hidden={!abierto}>
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 pt-2 pb-10 md:px-10 md:pb-14 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            {item.parrafos?.length ? (
              <div className="space-y-4 text-base leading-relaxed md:text-lg">
                {item.parrafos.map((parrafo, i) => (
                  <p key={i}>{parrafo}</p>
                ))}
              </div>
            ) : (
              <p className="italic">{PENDIENTE}</p>
            )}
            {item.lema && (
              /* Lema: Roboto Mono Bold 26 px en el mockup, un escalón por debajo del párrafo (26/30) y sin tracking. */
              <p className="mt-6 max-w-[32ch] font-mono text-sm font-bold uppercase md:text-base">{item.lema}</p>
            )}
          </div>
          <Foto src={item.foto.src} alt={item.foto.alt} />
        </div>
      </div>
    </li>
  )
}

export default function Areas() {
  const [abiertoId, setAbiertoId] = useState(areas.items[0]?.id ?? null)

  const alternar = (id) => setAbiertoId((actual) => (actual === id ? null : id))

  return (
    <section id="areas" aria-labelledby="areas-titulo" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 md:px-10">
        <h2
          id="areas-titulo"
          className={`order-last mt-10 text-center font-display text-[1.625rem] tracking-tight md:mt-14 md:text-[2.75rem] lg:text-5xl ${areas.titulo ? '' : 'text-muted'}`}
        >
          {areas.titulo || PENDIENTE}
        </h2>
        <p
          className={
            areas.parrafo
              ? 'order-first text-lg leading-relaxed text-paper/80 md:text-xl'
              : 'order-first text-muted'
          }
        >
          {areas.parrafo || PENDIENTE}
        </p>
      </div>

      <ul className="mt-10 w-full md:mt-14">
        {areas.items.map((item) => (
          <Banda
            key={item.id}
            item={item}
            abierto={abiertoId === item.id}
            onToggle={() => alternar(item.id)}
          />
        ))}
      </ul>
    </section>
  )
}
