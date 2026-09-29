import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { obra, ui } from '../content.js'
import useHitoActivo from '../hooks/useHitoActivo.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'
import Placeholder from './Placeholder.jsx'

const PENDIENTE = ui.pendiente

// Mosaico del Figma (capas "06" a "10"): posición de cada foto en % de su caja de 1440x1230, que en 1440 va de borde a
// borde de la pantalla (la 07 toca el borde izquierdo y la 08 el derecho).
const CELDAS = [
  'left-[7.78%] top-0 w-[41.25%] h-[21.95%]',
  'left-0 top-[24.07%] w-[63.54%] h-[41.87%]',
  'left-[65.21%] top-[24.07%] w-[34.79%] h-[29.59%]',
  'left-[20.35%] top-[67.72%] w-[43.19%] h-[32.28%]',
  'left-[65.21%] top-[55.2%] w-[26.94%] h-[44.8%]',
]
// Ancho de cada foto en % de la caja (para sizes: hasta 1440 px la caja es la pantalla entera).
const ANCHOS = [41.25, 63.54, 34.79, 43.19, 26.94]

// Mosaico: las fotos van apareciendo de a una con el scroll, al revés del collage de Identidad (pedido del desarrollador
// el 23/09/2026). Mismo motor por pasos (useScrollPorPasos con `aplicar`): el scroll elige cuántas se ven, con
// histéresis, compuerta de gestos y saltos directos, y cada cambio dura siempre lo mismo. Cada foto entra desde abajo
// (ENTRADA px) mientras aparece, como el párrafo de la intro. Sin enganche: el mosaico queda del tamaño de siempre
// (1440x1230, más alto que la pantalla) y las fotos se reparten a lo largo de su paso por la pantalla.
const ENTRADA_FOTO = 40
const DURACION_FOTO = 600
const CURVA_FOTO = 'cubic-bezier(0.33, 0, 0.67, 1)'

function medirMosaico({ bloque }) {
  return { paso: 1, mosaico: bloque.offsetHeight }
}

// 0 cuando el borde de arriba del mosaico entra por el 90 % de la pantalla; 1 tras recorrer su alto (o 0,75 de pantalla
// si es más chico, para que en celular no pasen todas juntas).
function progresoMosaico({ top }, alto, { mosaico }) {
  const inicio = alto * 0.9
  const recorrido = Math.max(mosaico, alto * 0.75)
  return Math.min(Math.max((inicio - top) / recorrido, 0), 1)
}

// Parada `fila` = cuántas fotos se ven, desde la primera. Sin estado propio: el estado de cada foto es data-visible, y un
// cambio a mitad de viaje arranca desde donde está. visibility no va en la animación (así corre en el compositor): la que
// entra se ve apenas arranca y la que sale queda visible hasta terminar. Primero las lecturas y después las escrituras.
function aplicarMosaico({ bloque }, fila, animar) {
  const fotos = [...bloque.children]
  if (fila < 0) {
    for (const foto of fotos) {
      foto.getAnimations().forEach((a) => a.cancel())
      foto.style.translate = ''
      foto.style.opacity = ''
      foto.style.visibility = ''
      delete foto.dataset.visible
    }
    return
  }
  const cambios = fotos.map((foto, i) => {
    const visible = i < fila
    // Solo es "igual" si ya está marcada con ese estado: sin la marca (primer pintado) hay que escribirlo entero, porque
    // en el HTML las fotos arrancan visibles y sin estilos. Con la comparación vieja, el primer pintado solo les ponía
    // visibility: hidden y al aparecer animaban de opacidad 1 a 1, o sea nada (lo reportó el desarrollador el
    // 23/09/2026: "la primera vez simplemente aparecen").
    if (foto.dataset.visible === (visible ? '1' : '0')) return { foto, visible, igual: true }
    const actual = getComputedStyle(foto)
    return {
      foto,
      visible,
      desde: {
        translate: actual.translate === 'none' ? '0px 0px' : actual.translate,
        opacity: actual.opacity,
      },
    }
  })
  for (const { foto, visible, igual, desde } of cambios) {
    if (igual) {
      // Directo con el mismo destino: se corta lo que estuviera animando y queda el estado final en línea.
      if (!animar) {
        foto.getAnimations().forEach((a) => a.cancel())
        foto.style.translate = visible ? '0px 0px' : `0px ${ENTRADA_FOTO}px`
        foto.style.opacity = visible ? '1' : '0'
        foto.style.visibility = visible ? '' : 'hidden'
      }
      continue
    }
    foto.getAnimations().forEach((a) => a.cancel())
    foto.style.translate = visible ? '0px 0px' : `0px ${ENTRADA_FOTO}px`
    foto.style.opacity = visible ? '1' : '0'
    foto.style.visibility = visible || animar ? '' : 'hidden'
    foto.dataset.visible = visible ? '1' : '0'
    if (!animar) continue
    const animacion = foto.animate([desde, { translate: foto.style.translate, opacity: foto.style.opacity }], {
      duration: DURACION_FOTO,
      easing: CURVA_FOTO,
      fill: 'backwards',
    })
    if (!visible) {
      animacion.onfinish = () => {
        if (foto.dataset.visible === '0') foto.style.visibility = 'hidden'
      }
    }
  }
}

// "2018/2024" puede cortar después de la barra, como en el Figma (el año va en una columna de 3 em, 60 px a 20).
function Anio({ texto }) {
  const partes = texto.split('/')
  return partes.map((parte, i) => (
    <Fragment key={i}>
      {parte}
      {i < partes.length - 1 && (
        <>
          /<wbr />
        </>
      )}
    </Fragment>
  ))
}

export default function ObraHistorica() {
  const lista = useRef(null)
  const mosaico = useRef(null)
  const refsMosaico = useMemo(() => ({ bloque: mosaico }), [])
  const mosaicoCerca = useCerca(mosaico)
  const bloqueHitos = useRef(null)
  const fijoHitos = useRef(null)
  const alineadoHitos = useRef(null)
  const tituloHitos = useRef(null)
  const parrafoHitos = useRef(null)
  const activo = useHitoActivo(lista, {
    bloque: bloqueHitos,
    fijo: fijoHitos,
    alineado: alineadoHitos,
    titulo: tituloHitos,
    parrafo: parrafoHitos,
  })

  // Una parada más que fotos: de ninguna a todas.
  useScrollPorPasos(refsMosaico, {
    pasos: obra.fotos.length + 1,
    medir: medirMosaico,
    progreso: progresoMosaico,
    aplicar: aplicarMosaico,
    activo: obra.fotos.length > 0,
  })

  return (
    /* Padding de arriba en lg: en el V04 la tinta del título queda 478 px debajo del párrafo del cierre de Identidad
       (el patrón b de piedritas baja por ese hueco hasta la altura del título); el cierre pone 96 y acá van los 462
       restantes (menos los ~12 px de aire de la tipografía). Hasta el 28/09/2026 eran 136. */
    <section id="obra" aria-labelledby="obra-titulo" className="pt-16 md:pt-24 lg:pt-[28.875rem]">
      <div className="mx-auto w-full max-w-sitio px-6 md:px-10">
        {/* La línea de tiempo arranca en el 42,35 % del ancho del contenido y mide 43,8rem, para que el centro del
            punto caiga en 637,5 y el texto de los hitos vaya de 736 a 1327,5 a 1440: es donde los pone el V03 (punto en
            637,5, texto de 731 al margen). Hasta el 25/09/2026 eran 44,8 % y 42,625rem (30 px a la derecha del diseño) y
            antes 46,6 % y 610 px, del Figma V02. Debajo de lg no es grilla sino un bloque (flow-root). */}
        <div className="flow-root lg:grid lg:grid-cols-[42.35%_minmax(0,43.8rem)]">
          {/* En lg, título y párrafo se enganchan junto con la lista, a la misma altura (useHitoActivo le pone el mismo
              top al envoltorio) y con un alto mínimo igual al de la lista mientras es sticky: su bloque contenedor es su
              área de la grilla (lista más recorrido), así que sin eso seguiría enganchado (alto lista - alto párrafo) px
              de más. self-start: si se estirara al alto de la fila no tendría recorrido. Antes de engancharse, el título
              viene 80 px más arriba y baja y el párrafo 120 px más abajo y sube, hasta encontrarse justo cuando la lista
              llega a su top (también useHitoActivo): pedido del desarrollador el 21/09/2026 y otra vez el 25/09.
              Lo que queda parejo es el borde de arriba de las mayúsculas del título con el de las cifras de "2013"
              (pedido del 22/09/2026 y confirmado el 25/09 al elegir esta composición sobre la del V03, donde el título
              cruza las dos columnas y no entra en los 553,7 px de la columna; el V04 del 28/09/2026 adoptó el título en
              la columna, a 61,5 px con interlineado 1,16, y lo deja 11 px más arriba que las cifras: se mantiene la
              alineación por tinta). Google Sans Flex: mayúsculas de 0,7188 em,
              ascendente 0,966 y descendente 0,286; con interlineado 1,16 la tinta del título arranca a 0,2012 em del
              borde de su caja. En el hito la línea mide 33 px con el texto en 21, así que la base está a 23,64 px del
              borde, y el año va en Roboto Mono a 0,8 em (16,8 px, cifras de 0,7109 em): su tinta arranca a 11,70 px =
              0,73125 rem. El título sube la diferencia.
              Al imprimir, sin los translate ni el alto mínimo que pone el hook (con !important le ganan al estilo en línea). */}
          <div
            ref={alineadoHitos}
            className="self-start obra-trio:max-lg:sticky lg:sticky hitos-libres:static print:static print:min-h-0!"
          >
            <h2
              ref={tituloHitos}
              id="obra-titulo"
              className={`mb-4 font-display text-[length:clamp(2rem,4.27vw,3.84375rem)] leading-[1.16] font-thin whitespace-pre-line md:mb-8 lg:mt-[calc(0.73125rem-0.2012em)] lg:mb-12 print:static! print:translate-none! ${obra.titulo ? '' : 'text-muted'}`}
            >
              {obra.titulo || PENDIENTE}
            </h2>
            <p
              ref={parrafoHitos}
              className={
                obra.parrafo
                  ? 'font-light text-sm leading-[1.5] md:text-lg md:leading-relaxed lg:max-w-[26.1875rem] lg:text-[1.40625rem] lg:leading-9 print:translate-none!'
                  : 'text-muted'
              }
            >
              {obra.parrafo || PENDIENTE}
            </p>
          </div>

          {obra.hitos.length > 0 ? (
            /* El hito actual va en verde claro y en negrita y los demás en gris (V03 de la diseñadora, 25/09/2026; antes
               el activo iba en blanco), con un punto por hito del mismo color y una línea vertical que los une: el punto
               del activo es el doble de grande. Los años van en Roboto Mono, más chicos que el texto (22 contra 28 px de
               1920 en el V03). La lista se engancha
               en la pantalla (centrada en el alto, mínimo 2 rem del borde: useHitoActivo le pone el top) y cada hito ocupa
               un tramo de scroll: 11 rem (176 px) con el dedo y 12 rem (192 px, ~2 muescas de rueda) en lg. Sin enganche
               los hitos pasaban demasiado rápido: con un flick en celular y de a dos por muesca en escritorio (pedidos del
               desarrollador, 21/09/2026); en celular eran 10 rem, el 22/09/2026 pasaron a 12,5 (+25 %, pedido suyo) y el
               mismo día a 11 (+10 %: un usuario de prueba lo sintió trabado). Con reduced-motion, al imprimir o si lo enganchado no
               entra en la pantalla (variante hitos-libres) no se engancha: el hito actual es el que pasa por la línea de
               lectura, al 55 % de la pantalla. En celular los hitos van a 14/20 (antes 16/24) para que título y lista
               entren juntos en la pantalla con las barras del navegador a la vista (~660 px de alto: medido, 608-668 px
               de 360 a 430 de ancho). Fundido
               suave (también pedido suyo): se enciende en 350 ms y se apaga en 500 (el desarrollador los pidió más
               sutiles el 25/09/2026, junto con el peso animado); cada hito queda
               encendido al menos 300 ms, así llega al blanco pleno antes de pasar al siguiente. */
            <div
              ref={bloqueHitos}
              className="relative mt-10 max-lg:mb-[calc(-1*var(--cola,0px))] md:mt-12 lg:mt-0"
              style={{ '--hitos': obra.hitos.length }}
            >
              <div ref={fijoHitos} className="sticky hitos-libres:static">
                <ol ref={lista} role="list" className="mt-4 flex w-full flex-col gap-[0.9375rem] lg:mt-0">
                  {obra.hitos.map((hito, i) => (
                    <li
                      key={`${hito.anio}-${i}`}
                      className={`flex gap-[1.15em] text-sm leading-5 md:text-lg md:leading-7 lg:text-[1.3125rem] lg:leading-[2.0625rem] ${i === activo ? 'text-verde-claro' : 'text-muted'}`}
                    >
                      {/* Punto del hito y línea que lo une con el siguiente: el punto toma el color del hito (bg-current) y
                          queda centrado en la primera línea del texto (0,5lh: media línea, sea cual sea el interlineado). */}
                      <span aria-hidden="true" className="relative w-[1em] shrink-0">
                        {i < obra.hitos.length - 1 && (
                          <span className="absolute top-[0.5lh] bottom-[calc(-0.9375rem-0.5lh)] left-1/2 w-px -translate-x-1/2 bg-muted/40" />
                        )}
                        {/* El punto activo es el doble de grande, pero no cambia de tamano sino de escala: con
                            transition-all sobre size el navegador rehacia el layout en cada frame de la transicion. */}
                        <span
                          className={`absolute top-[0.5lh] left-1/2 size-[0.85em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-[background-color,scale] ease-out ${i === activo ? 'scale-100 duration-[350ms]' : 'scale-[0.53] duration-500'}`}
                        />
                      </span>
                      {/* El año va en monoespaciada: el peso puede animarse sin mover nada (todos los anchos son iguales). */}
                      <span
                        className={`w-[2.4em] shrink-0 text-right font-mono text-[0.8em] transition-[color,font-variation-settings] ease-out ${i === activo ? "[font-variation-settings:'wght'_700] duration-[350ms]" : "[font-variation-settings:'wght'_400] duration-500"}`}
                      >
                        <Anio texto={hito.anio} />
                      </span>
                      {/* El hito activo se engrosa con dos sombras a ±0,02 em en vez de cambiar de peso: animar el eje
                          wght rearma la línea (cada peso tiene otros anchos) y el desarrollador vio "las palabras
                          moverse" al activarse (25/09/2026). La sombra no toca las métricas, así que no se mueve nada, y
                          se interpola sola porque las dos sombras van de 0 a ±0,02 em. */}
                      <p
                        className={`min-w-0 transition-[color,text-shadow] ease-out ${i === activo ? '[text-shadow:0.02em_0_0_currentColor,-0.02em_0_0_currentColor] duration-[350ms]' : '[text-shadow:0_0_0_currentColor,0_0_0_currentColor] duration-500'}`}
                      >
                        {hito.texto || PENDIENTE}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              {/* Recorrido: lo que se desplaza la página con la lista enganchada, un tramo por cambio de hito. */}
              <div
                aria-hidden="true"
                className="h-[calc((var(--hitos)-1)*11rem)] lg:h-[calc((var(--hitos)-1)*12rem)] hitos-libres:h-0"
              />
            </div>
          ) : (
            <p className="text-muted">{PENDIENTE}</p>
          )}
        </div>
      </div>

      {/* Mosaico: 480 px debajo de la línea de tiempo en lg (el V04 tiene 386 y hasta el 28/09/2026 eran 290; ese día el
          desarrollador pidió más aire arriba y abajo del mosaico, "para que no queden tan cargadas las fotos con los
          textos", primero a 384 y después "un poco más"; en celular 128 y en tablet 160, eran 64 y 96); en pantallas
          de más de 1440, centrado con ese ancho. Las
          fotos aparecen de a una con el scroll (ver aplicarMosaico); al imprimir y con reduced-motion se ven todas.
          Esquinas de 14,3 px (V04; eran 10). Sin el degradé negro que el V04 pone sobre la mitad de abajo del mosaico:
          se aplicó el 28/09/2026 y el desarrollador lo sacó ese mismo día, primero en celular y después también en
          escritorio, porque las fotos de abajo "se cortan cuando suben" al aparecer bajo la sombra. */}
      <div className="relative mx-auto w-full max-w-[90rem] mt-[calc(8rem+var(--cola,0px))] md:mt-[calc(10rem+var(--cola,0px))] lg:mt-[30rem]">
        <ul ref={mosaico} data-mosaico role="list" className="relative aspect-[1440/1230] w-full">
        {obra.fotos.map((foto, i) => (
          <li
            key={foto.src ?? i}
            className={`absolute overflow-hidden rounded-[0.9rem] print:visible! print:translate-none! print:opacity-100! ${CELDAS[i] ?? CELDAS[0]}`}
          >
            {foto.src ? (
              <img
                src={foto.src}
                srcSet={foto.srcSet}
                sizes={`(min-width: 1440px) ${Math.round((ANCHOS[i] ?? 40) * 14.4)}px, ${ANCHOS[i] ?? 40}vw`}
                alt={foto.alt}
                loading={mosaicoCerca ? 'eager' : 'lazy'}
                fetchPriority="low"
                className="h-full w-full object-cover"
              />
            ) : (
              <Placeholder alt={foto.alt || PENDIENTE} className="h-full w-full" />
            )}
          </li>
        ))}
        </ul>
      </div>
    </section>
  )
}

// true cuando el elemento se acerca a la pantalla (dos pantallas antes). Las fotos del mosaico se piden ahí: con lazy,
// la primera vez la descarga arrancaba recién cuando les tocaba aparecer y se veían llegar de golpe, sin la animación
// (la segunda vez, ya en caché, se veía bien); lo reportó el desarrollador el 23/09/2026 probando en el celular.
function useCerca(ref) {
  const [cerca, setCerca] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || cerca) return
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas[entradas.length - 1].isIntersecting) {
          setCerca(true)
          io.disconnect()
        }
      },
      { rootMargin: '200% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, cerca])
  return cerca
}
