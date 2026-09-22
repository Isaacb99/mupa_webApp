import { useRef } from 'react'
import { intro, ui } from '../content.js'
import useAparecer from '../hooks/useAparecer.js'
import TextoDestacado from './TextoDestacado.jsx'
import TituloParallax from './TituloParallax.jsx'

const PENDIENTE = ui.pendiente

export default function Intro() {
  const { parrafo } = intro
  const parrafoRef = useRef(null)
  const parrafoVisible = useAparecer(parrafoRef, { reversible: true })

  return (
    /* Figma: titular a 99 px del hero. El video que el Figma ponía debajo del párrafo se descartó (decisión del museo,
       21/09/2026): el título de Identidad queda a ~270 px del párrafo en lg (219 acá + 48 de Identidad). */
    <section aria-labelledby="intro-titulo" className="py-16 md:py-24 lg:pt-[6.1875rem] lg:pb-[13.6875rem]">
      <div className="mx-auto w-full max-w-sitio px-6 md:px-10">
        {/* En lg, como en el Figma: el bloque del titular va centrado en la página. Primera columna = las líneas fijas (su
            ancho), segunda = la palabra móvil y el párrafo (540 px como máximo); el titular las comparte con subgrid, así
            el párrafo arranca justo donde arranca la palabra. El gap horizontal es el 0,375 em del titular (24 px a 64). */}
        <div className="grid gap-y-10 lg:grid-cols-[auto_minmax(0,33.75rem)] lg:justify-center lg:gap-x-[calc(0.375*min(4rem,4.445vw))] lg:gap-y-[6.75rem]">
          {/* Tamaño del Figma: 64 px con interlineado 72 a 1440 (4,445vw, tope 4rem). Por debajo de md, lo justo para que
              "un museo de sanjuaninos" (12,2 em con el gap) entre en una fila en el ancho del contenido (100vw - 3rem). */}
          <TituloParallax
            id="intro-titulo"
            className="font-display text-[length:min(calc((100vw-3rem)/12.4),2.25rem)] leading-[1.125] md:text-[length:min(3rem,6.25vw)] lg:col-span-2 lg:text-[length:min(4rem,4.445vw)]"
          />

          {/* El párrafo aparece subiendo (pedido del desarrollador, 21/09/2026): arranca 64 px más abajo y transparente, y
              cuando entra por el 80 % de la pantalla sube a su lugar en 900 ms con ease-out; si el scroll lo vuelve a
              bajar de esa línea, se va otra vez (en 500 ms) y reaparece al subir (useAparecer reversible). En celular
              entra en la primera pantalla: sube al cargar. Con reduced-motion (y al imprimir) queda fijo y visible.
              El observador mira el envoltorio, que no se traslada: midiendo el párrafo corrido 64 px hacia abajo la
              línea del 80 % quedaba 64 px más tarde, y en celulares bajos cargaba escondido. */}
          <div ref={parrafoRef} className="lg:col-start-2">
            <p
              className={`text-base transition ease-out md:text-lg lg:text-xl lg:leading-7 motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 ${
                parrafoVisible ? 'translate-y-0 opacity-100 duration-[900ms]' : 'translate-y-16 opacity-0 duration-500'
              } ${parrafo ? '' : 'text-muted'}`}
            >
              {parrafo ? <TextoDestacado texto={parrafo} /> : PENDIENTE}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
