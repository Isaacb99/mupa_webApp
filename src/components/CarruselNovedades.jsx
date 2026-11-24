import { home } from '../content.js'
import useCarrusel from '../hooks/useCarrusel.js'
import ControlesCarrusel from './ControlesCarrusel.jsx'
import FlechasCarrusel, { AvisoCarrusel } from './FlechasCarrusel.jsx'
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
//   Foto.jsx), 24 debajo el título en Roboto Mono Medium 24/32 en mayúsculas (desde el 19/11/2026, tres renglones
//   como mucho, con «…»: RF-01, ver TarjetaNovedad), 8 debajo el resumen (16,5/27) y 8 debajo
//   "leer más" (Roboto Mono Medium 16/32), todo en crema y en una columna de texto de 419 (el 86,4 % de la tarjeta).
//   Entre lg y 1440 la tarjeta y el espacio se achican con el contenido (37,89 % y 3,75 % de su ancho): se siguen
//   viendo dos y media, como en el tablero (a 1280, con 485 fijos, la tercera era una tira de 54 px). Una novedad sin
//   portada va sin foto. El tablero no muestra la fecha ni el tipo.
// - 24 más abajo, a la derecha: ← "1/6" → (Roboto Mono Medium 24 blanco y flechas de 20, 8 entre cada uno). Así lo
//   dibuja el tablero; desde el 16/11/2026 las flechas van a los costados de la fila, sobre las fotos, y desde el
//   17/11/2026 abajo no queda nada, tampoco el "1/6" (ver «Las flechas a los costados», más abajo).
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
// - Anterior y Siguiente son botones con su nombre (las flechas son solo dibujo), de 44x44; llevan a la tarjeta
//   anterior o siguiente (sin animar con reduced-motion). En el principio o en el final quedan con aria-disabled (no
//   disabled: el foco no se pierde): desde el 16/11/2026, a los costados, el que no tiene adónde ir se oculta, salvo
//   que tenga el foco del teclado (queda a la vista, tenue, hasta que lo pierde); abajo (una tarjeta sin foto), más
//   tenues, como siempre.
// - Para el lector va "Novedad n de total" (n: la primera tarjeta que se ve entera desde la izquierda; el contador
//   "n/total" de dibujo lo llevan solo los controles de abajo, desde el 17/11/2026) en una región que avisa los cambios
//   (aria-live polite), que se escribe solo después de Anterior o Siguiente, cuando la fila quedó quieta (scrollend, o
//   150 ms sin scroll: en Chrome el scrollend de un elemento no siempre llega, medido en Chrome 156 sin ventana; el de
//   la página sí): antes cambiaba con cada scroll de la fila y avisaba de más (los valores intermedios del scroll
//   suave, "2, 3, 4, 3" con un deslizamiento del trackpad) y no la tarjeta del foco (A11Y-03 de la verificación,
//   02/11/2026). Con el foco en una tarjeta no avisa nada: el enlace ya dice cuál es. Cada botón vacía la región y el
//   aviso se escribe después, así suena aunque repita el anterior; si la fila se mueve por otra causa, la región se
//   vacía (avisoCarrusel.js; R1-01 de la re-verificación).
// - Los botones solo andan con JavaScript: hasta que la página hidrata, y si todas las tarjetas entran sin scroll, no
//   se ven (los de los costados van sobre la fila; los de abajo, en una fila invisible que ocupa su lugar: nada se corre
//   al aparecer); sin JavaScript no van (las tarjetas están en renglones). El estado inicial es el mismo en el servidor
//   y en el navegador (sin diferencias de hidratación): lo demás se mide después, en un efecto.
// - Lenis (el scroll suave de la página, useScrollSuave) no toma los gestos horizontales sobre la fila
//   (data-lenis-prevent-horizontal): esos van nativos a la fila; los verticales siguen moviendo la página.
// - Foco: contorno blanco (el tablero no lo dibuja). La fila tiene 8 px de margen por dentro a la izquierda, arriba y
//   abajo (y los mismos afuera, en negativo) para que el contorno del foco no quede cortado en sus bordes (y, debajo de
//   lg, con el foco del teclado en un título, también a la derecha: RF-01).
// - Al imprimir, las tarjetas van todas (en renglones) y sin los botones.
// La lógica de la fila (el estado, el foco con Tab, la región viva, Anterior y Siguiente) está en
// src/hooks/useCarrusel.js, que desde el 10/11/2026 comparte con los documentales de El Museo
// (src/paginas/ElMuseo.jsx); los controles, en FlechasCarrusel.jsx (los de esta sección desde el 16/11/2026) y en
// ControlesCarrusel.jsx (los de abajo: los de los documentales y, acá, solo si una tarjeta no tiene foto).
//
// Las flechas a los costados (16/11/2026; pedido del desarrollador para el celular y el escritorio; un desvío del
// tablero y del cuadro de celular, que dibujan ← "1/6" → abajo). En la Home y en Divulgación, en todos los anchos:
// «Anterior» y «Siguiente» son dos botones redondos sobre la fila, contra los bordes de su zona visible y centrados en
// el alto de la foto de la tarjeta, cada uno a la vista solo si hay más tarjetas para su lado (al principio, solo
// «Siguiente»; al final, solo «Anterior»; antes de hidratar, sin JavaScript, al imprimir o si entran todas, ninguno),
// y abajo no queda nada: el carrusel termina donde termina la fila. El 16/11/2026 quedaba abajo el contador "n/total"
// solo, a la derecha, en una fila de 28,8 px a 24 de la de tarjetas; el 17/11/2026 el desarrollador la sacó, después
// de probarlo en su teléfono, porque dejaba demasiado espacio hasta la sección siguiente (decisión Q): lo que sigue en
// la página subió 52,8 px. La región viva se quedó, la misma, dentro del envoltorio de la fila y sin ocupar lugar
// (AvisoCarrusel, en FlechasCarrusel.jsx). El orden en el HTML y en el Tab es el de siempre: la lista, «Anterior» y
// «Siguiente» (después, la región viva, que no toma el foco). El detalle (el fundido, el foco que no se pierde, el
// aspecto, los colores forzados), en FlechasCarrusel.jsx. Para eso la fila va dentro de un envoltorio `relative`, que
// lleva sus márgenes de arriba y de abajo y mide lo que ella: la capa de las flechas se posiciona contra él.
// Si alguna tarjeta no tiene foto, las flechas taparían su texto: ahí el carrusel va con los controles de siempre
// abajo (← "n/total" →, ControlesCarrusel.jsx). Se decide al renderizar, con los datos (igual en el servidor y en el
// navegador). Por el panel no pasa: una novedad no se publica sin portada (compartido/esquemas/contenido.js); la base
// sola no lo impide.
//
// Debajo de lg, la tarjeta del cuadro de celular (Figma "Web Mobile", 3106:17432, 10/11/2026; la reciben la Home y
// Divulgación): una por pantalla, del ancho del contenido (354 a 402 px) y de 384 como mucho (desde 432 px de ancho
// asoma la siguiente; a 768, una entera y parte de la segunda), con la portada en 354x300, el título en 24/32 y el
// título y el resumen a todo el ancho de la tarjeta; 24 entre "Ver todas las novedades" y la tarjeta, y entre tarjetas
// (el cuadro tiene 48, que con una por pantalla solo se vería al deslizar). La región viva llega a "Novedad 6 de 6"
// (el contador de los controles de abajo, a "6/6"). Lo demás (el snap, los botones, la región viva, sin JavaScript) no
// cambia.

/**
 * El tamaño de la portada en la fila, para el srcset de Foto.jsx: 485 px a 1440 y más; entre lg y 1440, el 37,89 % del
 * contenido (100vw menos los 80 de cada lado), como la tarjeta. Debajo de lg, el ancho del contenido con un tope de
 * 320 px, un poco menos de lo que mide (354 a 402 px, 384 como mucho): así un teléfono de densidad 3 pide la variante
 * de 960 (2,7 píxeles por punto) y no la de 1600, que pesa el doble.
 */
const TAMANO =
  '(min-width: 90rem) 485px, (min-width: 64rem) calc((100vw - 10rem) * 0.3789), min(calc(100vw - 3rem), 20rem)'

/**
 * La guía de las flechas de los costados (FlechasCarrusel.jsx): el ancho de la tarjeta (el del <li>) y la proporción
 * de su foto (la de Foto, en TarjetaNovedad), las MISMAS clases, así la guía mide lo que la foto y las flechas quedan
 * centradas en su alto. Si cambia la tarjeta, cambia acá (lo compara server/pruebas/layout.test.js).
 */
const GUIA_FOTO =
  'aspect-[354/300] w-[min(100%,24rem)] lg:aspect-[485/355] lg:w-[min(30.3125rem,calc((100vw-10rem)*0.3789))]'

/**
 * @param {{ titulo: string, url: string, resumen?: string | null, portada?: object | null, leerMas: string }} props
 */
function TarjetaNovedad({ titulo, url, resumen, portada, leerMas }) {
  return (
    <article className="group relative flex flex-col">
      {/* 24/32 en todos los anchos (el cuadro de celular también: con el zoom al 200 % un escritorio ya es el diseño
          de debajo de lg y el título se ve al doble, como los de tablero.js). La columna de texto del 86,4 %, desde
          lg: debajo, el título y el resumen van a todo el ancho de la tarjeta.
          Desde el 19/11/2026 (RF-01, decisión del desarrollador), el título ocupa 3 renglones como mucho, en todos
          los anchos: si no entra, termina en «…» al final del tercero (las tarjetas miden lo que la más alta: con un
          título de 160 caracteres, el máximo del panel, quedaba mucho aire debajo de las otras). El recorte
          (line-clamp-3) va en el ENLACE y no en el h3 ni en un span de adentro, por el anillo del foco (medido a
          densidad 2, 19/11/2026): en el h3, su overflow cortaba el anillo del enlace por los cuatro lados; en un span
          de adentro, el enlace se quedaba sin anillo; en el enlace, el anillo es el de su caja, entero (el recorte no
          corta el contorno del propio elemento; debajo de lg, con el lugar que le da la fila: ver la fila, abajo). Con
          w-fit, un título de un renglón tiene el anillo de siempre, ceñido al texto (igual píxel por píxel); con dos o
          tres renglones, el anillo es el rectángulo de la columna del título y no la forma escalonada de los renglones
          (es lo único que cambia de un título que entra: el texto, el subrayado y la tarjeta quedan iguales).
          max-w-full: con w-fit, una palabra larguísima sin espacios estiraría el enlace (wrap-break-word no achica el
          ancho mínimo); con el tope, se parte y se recorta como cualquier título. overflow-clip con 1 px de margen
          ([overflow-clip-margin:1px]) en vez del overflow: hidden de line-clamp-3: con hidden, el borde suavizado de
          la primera letra y del principio del subrayado (medio píxel) quedaba cortado a la izquierda y el subrayado de
          un título que entra cambiaba de 3 a 10 píxeles de pantalla (a 1024 y 1440, densidad 2); con 1 px de margen
          queda igual, y del cuarto renglón no asoma nada (medido con «PALEONTOLOGÍA»: el acento de la Í empieza a unos
          3,7 px del borde de arriba de su renglón). Un navegador sin overflow: clip (Safari anterior a la 16) se queda
          con el hidden, y uno sin overflow-clip-margin corta ese medio píxel, como con hidden. El nombre del enlace
          para el lector de pantalla sigue siendo el título entero, y el after estirado sigue cubriendo toda la tarjeta
          (su bloque contenedor es el <article>, que el recorte del enlace no corta). Al imprimir, el título va entero
          (print:line-clamp-none: en el papel no se puede seguir el enlace); sin JavaScript, recortado como siempre. */}
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
          className="line-clamp-3 w-fit max-w-full overflow-clip [overflow-clip-margin:1px] rounded-sm decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco print:line-clamp-none"
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
  // Las flechas a los costados, sobre las fotos: solo si todas las tarjetas tienen la suya (sobre una tarjeta sin foto
  // taparían el título). Si no, los controles de siempre, abajo. Sale de los datos: igual en el servidor y en el
  // navegador.
  const flechasALosCostados = tarjetas.every((t) => t.portada)

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
            las novedades" mide 44 de alto y deja 8 de aire propio) más los 8 del margen por dentro de arriba de la
            fila; los márgenes negativos de abajo y de la izquierda devuelven los de adentro. Los de arriba y de abajo
            los lleva el envoltorio (desde el 16/11/2026; hasta entonces, la fila): así mide justo lo que la fila y la
            capa de las flechas (FlechasCarrusel.jsx), que se posiciona contra él, queda a la altura de las fotos. A la
            derecha la fila no lleva margen: se corta en el borde del contenido, como en el tablero (el foco de una
            tarjeta es su título, que queda a la izquierda). Salvo con el foco del teclado en un título, debajo de lg
            (desde el 19/11/2026, RF-01): con dos o tres renglones, el anillo del título recortado es el rectángulo de
            la columna, que debajo de lg es toda la tarjeta, y la tarjeta llega al borde de la fila (en el celular,
            siempre; desde 432 px, la última): el anillo quedaba cortado a la derecha. Con el foco, la fila gana 8 px a
            la derecha (-mr-2 y pr-2: el ancho por dentro, las tarjetas, el scroll y sus topes no cambian; en el
            celular, de esos 8 px de margen no se ve nada más; desde 432 px se ve 8 px más de la tarjeta que asoma
            mientras dura el foco). Antes, con el anillo escalonado, ya quedaba cortado en los anchos en que un renglón
            llenaba la columna (a 412 px, con 25 letras). Las clases van en una lista, como las de abajo: la que
            esconde la barra en Safari iba pegada a la interpolación y Tailwind no la encontraba (R2-02, 03/11/2026;
            lo controla server/pruebas/clases.test.js). */}
        <div className="relative mt-2 -mb-2 lg:mt-4">
          <ul
            ref={fila}
            id={idFila}
            aria-label={textos.lista}
            data-lenis-prevent-horizontal=""
            className={[
              'relative -ml-2 flex scroll-pl-2 gap-6 overflow-x-auto overscroll-x-contain py-2 pl-2 [scrollbar-width:none] lg:gap-[min(3rem,calc((100vw-10rem)*0.0375))] noscript:flex-wrap noscript:gap-y-10 noscript:overflow-visible print:flex-wrap print:overflow-visible [&::-webkit-scrollbar]:hidden max-lg:has-[a:focus-visible]:-mr-2 max-lg:has-[a:focus-visible]:pr-2',
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
          {/* «Anterior» y «Siguiente», sobre las fotos (después de la lista en el HTML y en el Tab, como siempre), y la
              región viva, que no ocupa lugar ni toma el foco: abajo de la fila no queda nada (desde el 17/11/2026). */}
          {flechasALosCostados ? (
            <>
              <FlechasCarrusel carrusel={carrusel} total={total} textos={textos} guia={GUIA_FOTO} />
              <AvisoCarrusel carrusel={carrusel} total={total} />
            </>
          ) : null}
        </div>

        {/* Si una tarjeta no tiene foto: abajo, a 24 de la fila, los controles de siempre (← "n/total" → y la región
            viva). */}
        {flechasALosCostados ? null : (
          <ControlesCarrusel
            carrusel={carrusel}
            total={total}
            textos={textos}
            className="mt-6 flex items-center justify-end gap-2 noscript:hidden print:hidden"
          />
        )}
      </div>
    </section>
  )
}
