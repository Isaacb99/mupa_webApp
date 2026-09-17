import { obra, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'

const PENDIENTE = ui.pendiente

const CELDAS = [
  'aspect-[16/10] md:aspect-square lg:col-span-7 lg:aspect-[16/10]',
  'aspect-[3/4] md:aspect-square lg:col-span-5 lg:row-span-2 lg:aspect-auto',
  'aspect-square lg:col-span-4',
  'aspect-square lg:col-span-3 lg:aspect-auto',
]

function Foto({ src, alt }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
  }
  return <Placeholder alt={alt || PENDIENTE} className="h-full w-full" />
}

export default function ObraHistorica() {
  return (
    <section id="obra" aria-labelledby="obra-titulo" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="lg:col-span-5">
            <h2
              id="obra-titulo"
              className={`font-display text-[1.625rem] font-medium tracking-tight md:text-[2.75rem] lg:text-5xl ${obra.titulo ? '' : 'text-muted'}`}
            >
              {obra.titulo || PENDIENTE}
            </h2>
            <p className={obra.parrafo ? 'mt-6 text-base leading-relaxed text-paper/80 md:text-lg' : 'mt-6 text-muted'}>
              {obra.parrafo || PENDIENTE}
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            {obra.hitos.length > 0 ? (
              <ol role="list" className="md:pl-28">
                {obra.hitos.map((hito, i) => (
                  <li
                    key={`${hito.anio}-${i}`}
                    className="relative border-l border-line pl-6 pb-8 last:pb-0 md:pl-8"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-3 -left-px h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper md:top-3.5"
                    />
                    <span className="mb-1 block font-display text-base leading-6 whitespace-nowrap text-muted md:absolute md:top-0 md:right-full md:mr-4 md:mb-0 md:text-lg md:leading-7">
                      {hito.anio}
                    </span>
                    <p className={`text-base font-light leading-6 md:text-lg md:leading-7 ${hito.texto ? '' : 'text-muted'}`}>
                      {hito.texto || PENDIENTE}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted">{PENDIENTE}</p>
            )}
          </div>
        </div>

        <ul
          role="list"
          className="mt-16 grid grid-cols-1 gap-3 md:mt-20 md:grid-cols-2 md:gap-4 lg:grid-cols-12"
        >
          {obra.fotos.map((foto, i) => (
            <li key={i} className={`overflow-hidden ${CELDAS[i] ?? 'aspect-square lg:col-span-4'}`}>
              <Foto src={foto.src} alt={foto.alt} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
