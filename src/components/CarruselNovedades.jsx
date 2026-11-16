import { home } from '../content.js'
import useCarrusel from '../hooks/useCarrusel.js'
import ControlesCarrusel from './ControlesCarrusel.jsx'
import Foto from './Foto.jsx'
import { FlechaDiagonal } from './Iconos.jsx'
import { CONTENEDOR_TABLERO, ENLACE_FLECHA, TITULO_SECCION } from './tablero.js'

// El carrusel de Novedades de la Home (tablero "Web" de la diseñadora, Figma 2627:1775, 02/11/2026; decisión D12 del
// desarrollador). Lo usan la Home y, desde el 06/11/2026, Divulgación ("Últimas noticias", Figma 2859:5766: las mismas
// medidas; DV2), con las mismas novedades y el mismo id de la sección (los textos llegan por props). «Novedades» de la
// Home del tablero cambió después del 02/11 (arranca a 120, tarjetas de 462, la fila hasta el borde de la página) y ya
// no es igual a este componente; «Últimas noticias» de Divulgación sí: es la pregunta 6 a la diseñadora. Medidas a 1440:
// - La sección: 48 arriba y 40 abajo. Arriba, el h2 (Thin 64) y la bajada (Regular 16,5/27, crema) en una columna de
//   540, y a la derecha "Ver todas las novedades" con la flecha en diagonal, alineado abajo con la bajada.
// - 24 más abajo, las tarjetas de 485 con 48 entre sí, en una fila que se corta en el borde del contenido (1360): se ven
//   dos y media. Cada una: la portada de 485x355 con esquinas de 12 (su alt y el srcset real de las fotos del panel:
//   Foto.jsx), 24 debajo el título en Roboto Mono Medium 24/32 en mayúsculas, 8 debajo el resumen (16,5/27) y 8 debajo
//   "leer más" (Roboto Mono Medium 16/32), todo en crema y en una columna de texto de 419 (el 86,4 % de la tarjeta).
//   Entre lg y 1440 la tarjeta y el espacio se achican con el contenido (37,89 % y 3,75 % de su ancho): se siguen
//   viendo dos y media, como en el tablero (a 1280, con 485 fijos, la tercera era una tira de 54 px). Una novedad sin
//   portada va sin foto. El tablero no muestra la fecha ni el tipo.
// - 24 más abajo, a la derecha: ← "1/6" → (Roboto Mono Medium 24 blanco y flechas de 20, 8 entre cada uno).
//
// Accesibilidad:
// - Scroll horizontal nativo con snap (con JavaScript, la tarjeta enfocada con Tab queda entera a la vista, también en
//   el celular, donde el snap la devolvía a la anterior). Sin barra de scroll, como en el tablero. El snap (obligatorio)
//   va recién cuando la página hidrató (estado.listo).
//   Sin JavaScript (scripting: none) no hay carrusel: las tarjetas van en renglones, todas a la vista, como al imprimir
//   (A11Y-06 de la verificación, 02/11/2026). En una fila con scroll, Chrome no la mueve al enfocar una tarjeta que se
//   ve en parte (con 32 px a la vista la da por visible): el título enfocado quedaba cortado, con el contorno del foco
//   a medias, sin botones ni barra de scroll para llegar al resto (solo Mayús + rueda).
// - Cada tarjeta es un enlace: el del título, estirado sobre toda la tarjeta (como Tarjeta.jsx); "leer más" es parte de
//   él a la vista y no se repite para el lector (aria-hidden), así no hay seis "leer más" iguales.
// - Anterior y Siguiente son botones con su nombre (las flechas son solo dibujo), de 44x44 sin mover las flechas de su
//   lugar; llevan a la tarjeta anterior o siguiente (sin animar con reduced-motion). En el principio o en el final
//   quedan con aria-disabled (no disabled: el foco no se pierde) y más tenues.
// - El contador "n/total" (n: la primera tarjeta que se ve entera desde la izquierda) es dibujo; para el lector va
//   "Novedad n de total" en una región que avisa los cambios (aria-live polite), que se escribe solo después de
//   Anterior o Siguiente, cuando la fila quedó quieta (scrollend, o 150 ms sin scroll: en Chrome el scrollend de un
//   elemento no siempre llega, medido en Chrome 156 sin ventana; el de la página sí): antes cambiaba
//   con cada scroll de la fila y avisaba de más (los valores intermedios del scroll suave, "2, 3, 4, 3" con un
//   deslizamiento del trackpad) y no la tarjeta del foco (A11Y-03 de la verificación, 02/11/2026). Con el foco en una
//   tarjeta no avisa nada: el enlace ya dice cuál es. Cada botón vacía la región y el aviso se escribe después, así
//   suena aunque repita el anterior; si la fila se mueve por otra causa, la región se vacía (avisoCarrusel.js; R1-01 de
//   la re-verificación).
// - Los botones y el contador solo andan con JavaScript: hasta que la página hidrata, y si todas las tarjetas entran
//   sin scroll, la fila queda invisible (ocupa su lugar: nada se corre al aparecer); sin JavaScript no va (las
//   tarjetas están en renglones). El estado inicial es el mismo en el servidor y en el navegador (sin diferencias de
//   hidratación): lo demás se mide después, en un efecto.
// - Lenis (el scroll suave de la página, useScrollSuave) no toma los gestos horizontales sobre la fila
//   (data-lenis-prevent-horizontal): esos van nativos a la fila; los verticales siguen moviendo la página.
// - Foco: contorno blanco (el tablero no lo dibuja). La fila tiene 8 px de margen por dentro a la izquierda, arriba y
//   abajo (y los mismos afuera, en negativo) para que el contorno del foco no quede cortado en sus bordes.
// - Al imprimir, las tarjetas van todas (en renglones) y sin los botones.
// La lógica de la fila (el estado, el foco con Tab, la región viva, Anterior y Siguiente) está en
// src/hooks/useCarrusel.js y los controles, en ControlesCarrusel.jsx: desde el 10/11/2026 los comparte con los
// documentales de El Museo (src/paginas/ElMuseo.jsx), sin cambios en el HTML de esta sección.
//
// Debajo de lg, la tarjeta del cuadro de celular (Figma "Web Mobile", 3106:17432, 10/11/2026; la reciben la Home y
// Divulgación): una por pantalla, del ancho del contenido (354 a 402 px) y de 384 como mucho (desde 432 px de ancho
// asoma la siguiente; a 768, una entera y parte de la segunda), con la portada en 354x300, el título en 24/32 y el
// título y el resumen a todo el ancho de la tarjeta; 24 entre "Ver todas las novedades" y la tarjeta, y entre tarjetas
// (el cuadro tiene 48, que con una por pantalla solo se vería al deslizar). El contador llega a "6/6". Lo demás (el
// snap, los botones, la región viva, sin JavaScript) no cambia.

/**
 * El tamaño de la portada en la fila, para el srcset de Foto.jsx: 485 px a 1440 y más; entre lg y 1440, el 37,89 % del
 * contenido (100vw menos los 80 de cada lado), como la tarjeta. Debajo de lg, el ancho del contenido con un tope de
 * 320 px, un poco menos de lo que mide (354 a 402 px, 384 como mucho): así un teléfono de densidad 3 pide la variante
 * de 960 (2,7 píxeles por punto) y no la de 1600, que pesa el doble.
 */
const TAMANO =
  '(min-width: 90rem) 485px, (min-width: 64rem) calc((100vw - 10rem) * 0.3789), min(calc(100vw - 3rem), 20rem)'

/**
 * @param {{ titulo: string, url: string, resumen?: string | null, portada?: object | null, leerMas: string }} props
 */
function TarjetaNovedad({ titulo, url, resumen, portada, leerMas }) {
  return (
    <article className="group relative flex flex-col">
      {/* 24/32 en todos los anchos (el cuadro de celular también: con el zoom al 200 % un escritorio ya es el diseño
          de debajo de lg y el título se ve al doble, como los de tablero.js). La columna de texto del 86,4 %, desde
          lg: debajo, el título y el resumen van a todo el ancho de la tarjeta. */}
      <h3
        className={[
          'order-2 font-mono text-2xl leading-8 font-medium text-paper uppercase wrap-break-word lg:max-w-[86.4%]',
          portada ? 'mt-6' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <a
          href={url}
          className="rounded-sm decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco"
        >
          {titulo}
        </a>
      </h3>
      {resumen ? (
        <p className="order-3 mt-2 text-[1.03125rem] leading-[1.6875rem] font-normal text-paper wrap-break-word text-pretty lg:max-w-[86.4%]">
          {resumen}
        </p>
      ) : null}
      <p
        aria-hidden="true"
        className="order-4 mt-2 font-mono text-base leading-8 font-medium text-paper decoration-1 underline-offset-4 group-hover:underline"
      >
        {leerMas}
      </p>
      {portada ? (
        <Foto foto={portada} sizes={TAMANO} className="order-1 aspect-[354/300] w-full rounded-xl object-cover lg:aspect-[485/355]" />
      ) : null}
    </article>
  )
}

/**
 * @param {{ id: string, titulo: string, bajada?: string | null, verTodas?: { texto: string, url: string } | null,
 *   tarjetas: { titulo: string, url: string, resumen?: string | null, portada?: object | null }[] }} props
 *   id: el del h2 (aria-labelledby de la sección); tarjetas: las novedades, en su orden (server/paginas.js, cargarHome)
 */
export default function CarruselNovedades({ id, titulo, bajada = null, verTodas = null, tarjetas }) {
  const textos = home.novedades
  const total = tarjetas.length
  // La fila, el estado, la región viva, Anterior y Siguiente (src/hooks/useCarrusel.js).
  const carrusel = useCarrusel({ total, contador: textos.contador })
  const { fila, idFila, estado } = carrusel

  return (
    <section aria-labelledby={id} className="pt-12 pb-10">
      <div className={CONTENEDOR_TABLERO}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="lg:max-w-[33.75rem]">
            <h2 id={id} className={TITULO_SECCION}>
              {titulo}
            </h2>
            {bajada ? (
              <p className="mt-4 text-[1.03125rem] leading-[1.6875rem] font-normal text-paper">{bajada}</p>
            ) : null}
          </div>
          {verTodas ? (
            // 44 px de alto (ENLACE_FLECHA) con el texto alineado abajo con la bajada, como en el tablero.
            <a href={verTodas.url} className={`${ENLACE_FLECHA} shrink-0 self-start lg:-mb-[0.475rem] lg:self-end`}>
              {verTodas.texto}
              <FlechaDiagonal />
            </a>
          ) : null}
        </div>

        {/* 24 px debajo del encabezado: el margen de arriba (16 desde lg; debajo de lg, 8, porque el enlace "Ver todas
            las novedades" mide 44 de alto y deja 8 de aire propio) más los 8 del margen por dentro de arriba; los
            márgenes negativos de abajo y de la izquierda devuelven los de adentro. A la derecha no lleva margen: la
            fila se corta en el borde del contenido, como en el tablero (el foco de una tarjeta es su título, que queda
            a la izquierda). Las clases van en una lista, como las de abajo: la que esconde la barra en Safari iba
            pegada a la interpolación y Tailwind no la encontraba (R2-02, 03/11/2026; lo controla
            server/pruebas/clases.test.js). */}
        <ul
          ref={fila}
          id={idFila}
          aria-label={textos.lista}
          data-lenis-prevent-horizontal=""
          className={[
            'relative mt-2 -mb-2 -ml-2 flex scroll-pl-2 gap-6 overflow-x-auto overscroll-x-contain py-2 pl-2 [scrollbar-width:none] lg:mt-4 lg:gap-[min(3rem,calc((100vw-10rem)*0.0375))] noscript:flex-wrap noscript:gap-y-10 noscript:overflow-visible print:flex-wrap print:overflow-visible [&::-webkit-scrollbar]:hidden',
            estado.listo ? 'snap-x snap-mandatory' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {tarjetas.map((t) => (
            <li key={t.url} className="w-[min(100%,24rem)] shrink-0 snap-start lg:w-[min(30.3125rem,calc((100vw-10rem)*0.3789))]">
              <TarjetaNovedad {...t} leerMas={textos.leerMas} />
            </li>
          ))}
        </ul>

        <ControlesCarrusel
          carrusel={carrusel}
          total={total}
          textos={textos}
          className="mt-6 flex items-center justify-end gap-2 noscript:hidden print:hidden"
        />
      </div>
    </section>
  )
}
