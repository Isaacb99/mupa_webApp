import { useEffect, useState } from 'react'
import { hero, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'

// Px de scroll a partir de los cuales el indicador ya no hace falta.
const UMBRAL_INDICADOR = 16

export default function Hero() {
  const { src, srcSet, sizes, alt } = hero.imagen
  const arriba = useArriba()

  return (
    <section aria-label={ui.portada} className="relative w-full bg-ink">
      {/* Figma: 1440x852 desde md, nunca más alto que la pantalla; en celular, 4:3. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-[1440/852] md:max-h-svh">
        {src ? (
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        ) : (
          <Placeholder alt={alt} className="h-full w-full" />
        )}
        {/* Degradé del Figma ("image 2"): oscurece la parte de arriba, detrás del logo, y se desvanece al 71 % del alto. */}
        <div aria-hidden="true" className="degrade-hero absolute inset-x-0 top-0 h-[71.2%]" />
        {/* Indicador de scroll (pedido del desarrollador el 22/09/2026, con un video de referencia: dos flechas apiladas
            que se encienden y se apagan en cascada, la de arriba primero, con un brillo suave). Blancas como en la
            referencia; abajo la foto es clara (vereda y escalera), así que un degradé negro desde el borde de abajo (85 %
            en el borde, 35 % a mitad de camino, nada al 30 % del alto) les da fondo y funde la foto con el negro de la
            página (probado contra uno más suave, 60 % en el 24 % de abajo, y contra una mancha radial detrás de las
            flechas: con esos las flechas casi no se leían sobre la escalera). Solo en escritorio (lg): en celular el titular
            ya asoma debajo del hero. Se desvanece apenas empieza el scroll y vuelve arriba del todo; aparece 0,8 s después
            de cargar; con reduced-motion, quietas (la de abajo más tenue). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[30%] bg-linear-to-t from-ink/85 via-ink/35 via-45% to-transparent lg:block print:hidden"
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 transition-opacity duration-500 ease-out lg:block print:hidden ${arriba ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg
            viewBox="0 0 24 30"
            className="block h-[1.875rem] w-6 animate-aparecer text-paper drop-shadow-[0_0_5px_rgb(255_255_255/0.55)] motion-reduce:animate-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 5.5l7 7 7-7" className="animate-flecha motion-reduce:animate-none" />
            <path
              d="M5 15.5l7 7 7-7"
              className="animate-flecha [animation-delay:-1.5s] motion-reduce:animate-none motion-reduce:opacity-45"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

// true mientras la página está arriba del todo (menos de UMBRAL_INDICADOR px de scroll). Solo escucha el scroll en lg,
// donde está el indicador: en el celular era un listener y dos renders de más al empezar cada scroll (medición de
// rendimiento del 22/09/2026).
function useArriba() {
  const [arriba, setArriba] = useState(true)
  useEffect(() => {
    const lg = matchMedia('(width >= 64rem)')
    const medir = () => setArriba(window.scrollY < UMBRAL_INDICADOR)
    const conectar = () => {
      window.removeEventListener('scroll', medir)
      if (!lg.matches) return
      medir()
      window.addEventListener('scroll', medir, { passive: true })
    }
    conectar()
    lg.addEventListener('change', conectar)
    return () => {
      lg.removeEventListener('change', conectar)
      window.removeEventListener('scroll', medir)
    }
  }, [])
  return arriba
}
