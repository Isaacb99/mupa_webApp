import { intro, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'
import TituloParallax from './TituloParallax.jsx'

const PENDIENTE = ui.pendiente

export default function Intro() {
  const { parrafo, destacado } = intro

  return (
    <section aria-labelledby="intro-titulo" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Dos columnas que parten al centro en lg, como en el mockup: el titular las abarca y el párrafo va en la segunda, alineado con la palabra móvil. */}
        <div className="grid gap-x-3 gap-y-10 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-16">
          {/* Tamaño según el mockup (titular 83,6 px a 1920, apenas mayor que los h2 de 76,6 px): 56 px en lg = 83,6 × 0,667.
              Interlineado 1,2 del mockup: por debajo de lg lo dan leading-[1.1] + el gap-y-1 del bloque interno de TituloParallax
              (paso 1,18-1,27); en lg, leading-none + lg:gap-y-3 (68/56 = 1,21). */}
          <TituloParallax
            id="intro-titulo"
            className="font-display text-[length:clamp(1.5rem,7.4vw,2.25rem)] leading-[1.1] font-medium tracking-tight md:text-5xl lg:col-span-2 lg:text-[3.5rem] lg:leading-none"
          />

          <p
            className={`text-base md:text-lg lg:col-start-2 ${
              parrafo ? 'text-paper/80' : 'text-muted'
            }`}
          >
            {parrafo || PENDIENTE}
          </p>
        </div>

        <figure className="mt-12 aspect-video w-full overflow-hidden md:mt-16">
          {destacado?.src ? (
            <img
              src={destacado.src}
              alt={destacado.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Placeholder alt={destacado?.alt || PENDIENTE} className="h-full w-full" />
          )}
        </figure>
      </div>
    </section>
  )
}
