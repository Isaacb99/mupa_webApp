import { identidad, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'

const PENDIENTE = ui.pendiente

const COLUMNA = ['lg:col-start-1', 'lg:col-start-2', 'lg:col-start-3']

const CELDAS = [
  'aspect-[4/3] md:col-span-2 lg:col-span-7',
  'aspect-[3/4] md:aspect-square lg:col-span-5 lg:row-span-2 lg:aspect-auto lg:translate-y-12',
  'aspect-[4/3] md:aspect-square lg:col-span-4 lg:aspect-[4/3]',
]

function Foto({ src, alt }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
  }
  return <Placeholder alt={alt || PENDIENTE} className="h-full w-full" />
}

export default function Identidad() {
  const { titulo, ejes = [], parrafo, fotos, instituciones } = identidad

  return (
    <section id="identidad" aria-labelledby="identidad-titulo" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <h2
          id="identidad-titulo"
          className={`font-display text-[1.625rem] font-medium tracking-tight md:text-[2.75rem] lg:text-5xl ${titulo ? '' : 'text-muted'}`}
        >
          {titulo || PENDIENTE}
        </h2>

        {ejes.length > 0 && (
          <div className="mt-10 grid gap-x-8 gap-y-6 md:mt-14 lg:grid-cols-3 lg:gap-y-12">
            {ejes.map((eje, i) => (
              <div key={eje.etiqueta} className="contents">
                <div className={`${COLUMNA[i] ?? ''} lg:row-start-1`}>
                  <h3 className="font-mono text-base font-bold uppercase text-muted md:text-xl">{eje.etiqueta}</h3>
                  <p className="mt-3 text-base leading-relaxed text-paper/80">{eje.texto}</p>
                </div>
                {/* Palabra grande: tamaño fluido en lg para que "Patrimonio" entre en su columna (tope 80 px desde ~1334 px) */}
                <p
                  className={`${COLUMNA[i] ?? ''} font-display text-5xl font-extralight leading-none tracking-tight md:text-6xl lg:row-start-2 lg:text-[length:clamp(3.75rem,6vw,5rem)]`}
                >
                  {eje.palabra}
                </p>
              </div>
            ))}
          </div>
        )}

        <ul className="mt-14 grid grid-cols-1 gap-4 md:mt-20 md:grid-cols-2 md:gap-6 lg:mb-12 lg:grid-cols-12">
          {fotos.map((foto, i) => (
            <li key={foto.alt || i} className={`overflow-hidden rounded-none ${CELDAS[i] ?? ''}`}>
              <Foto src={foto.src} alt={foto.alt} />
            </li>
          ))}
        </ul>

        <div className="mt-10 md:mt-14 lg:flex lg:items-end lg:justify-between lg:gap-12">
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
      </div>
    </section>
  )
}
