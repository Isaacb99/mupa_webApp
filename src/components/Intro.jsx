import { useRef } from 'react'
import patronA from '../assets/patron-a.svg'
import { intro, ui } from '../content.js'
import useAparecer from '../hooks/useAparecer.js'
import TextoDestacado from './TextoDestacado.jsx'
import TituloParallax from './TituloParallax.jsx'

const PENDIENTE = ui.pendiente

export default function Intro() {
  const { parrafo } = intro
  const parrafoRef = useRef(null)
  const parrafoVisible = useAparecer(parrafoRef, { reversible: true, linea: 1 })

  return (
    /* Titular a 144 px del hero en lg: el V03 y el V04 lo ponen a 304 y el Figma V02 a 99 (lo que hubo hasta el
       28/09/2026); con los 304 el desarrollador lo vio "muy por debajo del hero" y pidió subirlo, dos veces
       (28/09/2026: primero a 200 y después "un poco más").
       El video que el Figma ponía debajo del párrafo se descartó (decisión del museo, 21/09/2026). Debajo viene el
       carrusel de fotos del V04 (Collage.jsx, en App.jsx), cuya caja se centra en la pantalla al engancharse: con 248 px
       de padding y los 93,5 del centrado (1440x900) queda a 341 px del párrafo, como en el archivo. overflow-x-clip: el
       patrón de piedritas sale por el borde izquierdo. */
    <section aria-labelledby="intro-titulo" className="overflow-x-clip py-16 md:py-24 lg:pt-[9rem] lg:pb-[15.5rem]">
      <div className="mx-auto w-full max-w-sitio px-6 md:px-10">
        {/* En lg, como en el Figma: la palabra móvil y el párrafo arrancan justo en el MEDIO de la página (elección del desarrollador el 25/09/2026, "anclado al centro": el V03 los pone en el 50,7 % y el bloque se sentía corrido; antes iba centrado como bloque y después pegado a la derecha). La primera columna mide medio contenido menos el gap, así que la segunda arranca en el 50 % exacto; como el contenido va centrado en la página, ese 50 % es también el centro de la ventana. Primera columna = las líneas fijas (su
            ancho), segunda = la palabra móvil y el párrafo (593 px como máximo, el ancho del V03); el titular las comparte con subgrid, así
            el párrafo arranca justo donde arranca la palabra. El gap horizontal es el 0,375 em del titular (24 px a 64). */}
        <div className="grid gap-y-10 lg:grid-cols-[calc(50%_-_0.375*min(4rem,4.445vw))_minmax(0,37.0625rem)] lg:gap-x-[calc(0.375*min(4rem,4.445vw))] lg:gap-y-[4.5rem]">
          {/* Tamaño del Figma: 64 px con interlineado 72 a 1440 (4,445vw, tope 4rem). Por debajo de md, lo justo para que
              "un museo de sanjuaninos" entre en una fila en el ancho del contenido (100vw - 3rem) con aire de sobra: la
              fila mide 13,75 em ("un museo de" 5,8 + el gap 0,375 + "sanjuaninos" 7,575, ya con el ancho 130 del V03) y se
              divide por 14,6, o sea ~19 px libres a 375. Con 12,4 la palabra no entraba y wrap-anywhere la partía
              ("sanjuanino / s"), que es lo que el desarrollador vio en el teléfono el 25/09/2026. */}
          <TituloParallax
            id="intro-titulo"
            className="font-display text-[length:min(calc((100vw-3rem)/14.6),2.25rem)] leading-[1.2] md:text-[length:min(3rem,6.25vw)] lg:col-span-2 lg:text-[length:min(4rem,4.445vw)]"
          />

          {/* Patrón a (V04): piedritas del logo en contorno, a la izquierda del párrafo y saliendo por el borde de la
              pantalla. Va en la celda vacía de la fila del párrafo, sin alto (absoluto), con la caja del archivo llevada
              a 1440: 617x697 px, el borde izquierdo 272,5 px a la izquierda del margen del contenido y el de arriba 107
              px por encima de la caja del párrafo (o sea 38 px por debajo de la base de "hecho por"). La máscara que lo
              desvanece hacia el borde está en index.css (patron-a). Solo en lg: el archivo no lo define para celular. */}
          <div aria-hidden="true" className="relative hidden lg:col-start-1 lg:row-start-2 lg:block">
            <img
              src={patronA}
              alt=""
              className="patron-a pointer-events-none absolute -top-[6.6875rem] -left-[17.03rem] w-[38.58rem] max-w-none"
            />
          </div>

          {/* El párrafo aparece subiendo (pedido del desarrollador, 21/09/2026): arranca 64 px más abajo y transparente, y
              cuando entra en pantalla sube a su lugar en 900 ms con ease-out (era al 80 % del alto: el 25/09/2026 lo pidió
              antes, para que ya esté arriba cuando la palabra del titular llega a "hecho por"); si el scroll lo vuelve a
              bajar de esa línea, se va otra vez (en 500 ms) y reaparece al subir (useAparecer reversible). En celular
              entra en la primera pantalla: sube al cargar. Con reduced-motion (y al imprimir) queda fijo y visible.
              El observador mira el envoltorio, que no se traslada: midiendo el párrafo corrido 64 px hacia abajo la
              línea del 80 % quedaba 64 px más tarde, y en celulares bajos cargaba escondido. */}
          <div ref={parrafoRef} className="lg:col-start-2">
            <p
              className={`text-base font-light transition ease-out md:text-lg lg:text-[1.40625rem] lg:leading-9 motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 ${
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
