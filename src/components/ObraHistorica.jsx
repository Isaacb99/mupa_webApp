import { Fragment, useRef } from 'react'
import { obra, ui } from '../content.js'
import useHitoActivo from '../hooks/useHitoActivo.js'
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

  return (
    <section id="obra" aria-labelledby="obra-titulo" className="pt-16 md:pt-24 lg:pt-[8.5rem]">
      <div className="mx-auto w-full max-w-sitio px-6 md:px-10">
        {/* Figma: el título (52/60, 571 px) y el párrafo (400 px, 20/32) debajo (92 px en el Figma; 48 acá, el desarrollador
            lo pidió más junto el 21/09/2026); la línea de tiempo arranca en el 46,6 % del ancho del contenido (678 px a 1440)
            y mide 610 (año 60 + 32 + texto 518: con ese ancho los hitos cortan las líneas como el Figma). En el Figma el
            título cruza las dos columnas; acá va en la columna izquierda con el párrafo, para engancharse con él (pedido del
            desarrollador): entra en los 576 px de la columna. Debajo de lg no es grilla sino un bloque (flow-root): así el
            título enganchado tiene como bloque contenedor toda la sección de hitos y no solo su fila. */}
        <div className="flow-root lg:grid lg:grid-cols-[46.6%_minmax(0,38.125rem)]">
          {/* En lg, título y párrafo se enganchan junto con la lista, a la misma altura (useHitoActivo le pone el mismo top
              al envoltorio): el título queda a la altura del primer hito y el trío queda quieto mientras el scroll recorre
              los hitos. Antes de engancharse, el título viene 80 px más arriba y baja, y el párrafo viene 120 px más abajo
              y sube, hasta encontrarse justo en el enganche (también useHitoActivo). self-start: si se estirara al alto de
              la fila no tendría recorrido.
              Lo que queda parejo es el borde de arriba de las letras (pedido del desarrollador, 22/09/2026: con las cajas a
              la misma altura, las mayúsculas del título arrancaban ~4 px más abajo que las cifras de "2013"). Geologica:
              mayúsculas y cifras de 0,71875 em, ascendente 0,975 y descendente 0,275; la tinta arranca a 0,20625 em del
              borde de la caja en el título (interlineado 1,15) y a 0,4140625 rem en el hito (20/28), así que el título
              sube la diferencia.
              Debajo de lg (pedidos del desarrollador del 22/09/2026: primero que el título se quedara con la lista y
              después también el párrafo) useHitoActivo mide qué entra en la pantalla y lo marca con data-obra en la
              sección: "trio" si entran título, párrafo y lista (el envoltorio se engancha entero, con el top que pone el
              hook, y la lista debajo); "titulo" si entran solo título y lista (el envoltorio no existe, contents, y el
              título se engancha solo: el párrafo pasa por debajo del título, que tiene fondo, se desvanece en los 24 px de
              abajo, after, y tapa hacia arriba los 128 px vacíos entre Identidad y esta sección, before, por donde el
              párrafo sale de la pantalla); sin data-obra, nada (hitos-libres). En celular, título, párrafo y espacios más
              chicos para que el trío entre (~680 px a 375 de ancho). Al imprimir, sin los translate ni el alto mínimo que
              pone el hook (con !important le ganan al estilo en línea). */}
          <div
            ref={alineadoHitos}
            className="self-start obra-titulo:max-lg:contents obra-trio:max-lg:sticky lg:sticky hitos-libres:static print:static print:min-h-0!"
          >
            <h2
              ref={tituloHitos}
              id="obra-titulo"
              className={`mb-4 font-display text-[1.625rem] leading-[1.15] obra-titulo:max-lg:sticky obra-titulo:max-lg:z-10 obra-titulo:max-lg:bg-ink obra-titulo:max-lg:before:absolute obra-titulo:max-lg:before:inset-x-0 obra-titulo:max-lg:before:bottom-full obra-titulo:max-lg:before:h-32 obra-titulo:max-lg:before:bg-ink obra-titulo:max-lg:after:absolute obra-titulo:max-lg:after:inset-x-0 obra-titulo:max-lg:after:top-full obra-titulo:max-lg:after:h-6 obra-titulo:max-lg:after:bg-linear-to-b obra-titulo:max-lg:after:from-ink obra-titulo:max-lg:after:to-transparent md:mb-8 md:text-[2.75rem] lg:mt-[calc(0.4140625rem-0.20625em)] lg:mb-12 lg:max-w-[35.6875rem] lg:text-[length:min(3.25rem,3.6vw)] print:static print:translate-none! print:before:hidden print:after:hidden ${obra.titulo ? '' : 'text-muted'}`}
            >
              {obra.titulo || PENDIENTE}
            </h2>
            <p
              ref={parrafoHitos}
              className={
                obra.parrafo
                  ? 'text-sm leading-[1.5] md:text-lg md:leading-relaxed lg:max-w-[25rem] lg:text-xl lg:leading-8 print:translate-none!'
                  : 'text-muted'
              }
            >
              {obra.parrafo || PENDIENTE}
            </p>
          </div>

          {obra.hitos.length > 0 ? (
            /* El hito actual va en blanco y los demás en gris, como el primero y los demás en el Figma. La lista se engancha
               en la pantalla (centrada en el alto, mínimo 2 rem del borde: useHitoActivo le pone el top) y cada hito ocupa
               un tramo de scroll: 11 rem (176 px) con el dedo y 12 rem (192 px, ~2 muescas de rueda) en lg. Sin enganche
               los hitos pasaban demasiado rápido: con un flick en celular y de a dos por muesca en escritorio (pedidos del
               desarrollador, 21/09/2026); en celular eran 10 rem, el 22/09/2026 pasaron a 12,5 (+25 %, pedido suyo) y el
               mismo día a 11 (+10 %: un usuario de prueba lo sintió trabado). Con reduced-motion, al imprimir o si lo enganchado no
               entra en la pantalla (variante hitos-libres) no se engancha: el hito actual es el que pasa por la línea de
               lectura, al 55 % de la pantalla. En celular los hitos van a 14/20 (antes 16/24) para que título y lista
               entren juntos en la pantalla con las barras del navegador a la vista (~660 px de alto: medido, 608-668 px
               de 360 a 430 de ancho). Debajo de lg, --cola (lo pone useHitoActivo mientras está enganchado: el alto de la
               lista, más el espacio hasta ella con el trío) corre hacia arriba el final del bloque para que título (o
               título y párrafo) y lista se suelten en el mismo scroll, y el mosaico lo devuelve. Fundido
               suave (también pedido suyo): se enciende en 300 ms y se apaga en 450, con ease-out; cada hito queda
               encendido al menos 300 ms, así llega al blanco pleno antes de pasar al siguiente. */
            <div
              ref={bloqueHitos}
              className="relative mt-6 max-lg:mb-[calc(-1*var(--cola,0px))] md:mt-12 lg:mt-0"
              style={{ '--hitos': obra.hitos.length }}
            >
              <div ref={fijoHitos} className="sticky hitos-libres:static">
                <ol ref={lista} role="list" className="mt-4 flex w-full flex-col gap-3 lg:mt-0">
                  {obra.hitos.map((hito, i) => (
                    <li
                      key={`${hito.anio}-${i}`}
                      className={`flex gap-[1.25em] text-sm leading-5 transition-colors ease-out md:text-lg md:leading-7 lg:gap-[1.6em] lg:text-xl ${i === activo ? 'text-paper duration-300' : 'text-muted duration-[450ms]'}`}
                    >
                      <span className="w-[3em] shrink-0">
                        <Anio texto={hito.anio} />
                      </span>
                      <p className="min-w-0">{hito.texto || PENDIENTE}</p>
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

      {/* Mosaico: 290 px debajo de la línea de tiempo; en pantallas de más de 1440, centrado con ese ancho. */}
      <ul
        role="list"
        className="relative mx-auto mt-[calc(4rem+var(--cola,0px))] aspect-[1440/1230] w-full max-w-[90rem] md:mt-[calc(6rem+var(--cola,0px))] lg:mt-[18.125rem]"
      >
        {obra.fotos.map((foto, i) => (
          <li key={foto.src ?? i} className={`absolute overflow-hidden ${CELDAS[i] ?? CELDAS[0]}`}>
            {foto.src ? (
              <img
                src={foto.src}
                srcSet={foto.srcSet}
                sizes={`(min-width: 1440px) ${Math.round((ANCHOS[i] ?? 40) * 14.4)}px, ${ANCHOS[i] ?? 40}vw`}
                alt={foto.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <Placeholder alt={foto.alt || PENDIENTE} className="h-full w-full" />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
