import { useMemo, useRef } from 'react'
import patronB from '../assets/patron-b.svg'
import { identidad, ui } from '../content.js'
import { medirEnganche, progresoEnganche } from '../hooks/enganche.js'
import useAparecer from '../hooks/useAparecer.js'
import useScrollPorPasos from '../hooks/useScrollPorPasos.js'
import Placeholder from './Placeholder.jsx'
import TextoDestacado from './TextoDestacado.jsx'

const PENDIENTE = ui.pendiente

// Los ejes (Eje narrativo, Visión, Misión) se muestran de a uno. Al llegar a la sección, la pantalla se engancha
// (sticky) y con el scroll pasan de uno al otro con el mismo motor que la palabra del titular (useScrollPorPasos con
// `aplicar`): cada eje se lee quieto y el paso dura siempre lo mismo. El paso es un carrusel en un marco fijo (pedido
// del desarrollador el 21/09/2026, en vez del deslizamiento de paneles enteros que había): el marco de la foto no se
// mueve (a la derecha en escritorio, arriba en celular) y por adentro la foto nueva entra desde la derecha mientras la
// anterior sale por la izquierda; el texto se renueva en el lugar, con un fundido y un desplazamiento corto.
// Después del último eje, la sección se suelta y la página sigue. Variante apilado (index.css: reduced-motion o
// pantalla de menos de 30rem de alto): no se engancha y los tres ejes van uno debajo del otro, con su foto.
// El V03 de la diseñadora (25/09/2026) sacó las palabras grandes que acompañaban a cada eje ("Inspirar", "Referente",
// "Patrimonio") y puso la etiqueta dentro de un recuadro naranja que se superpone al borde izquierdo de la foto.
// El V04 (28/09/2026) pasó el título a dos líneas dentro de la columna de texto, arriba de la etiqueta, con la foto
// alineada a su tinta (el título queda fijo mientras cambian los ejes); sacó el collage de acá (ahora es el carrusel
// de fotos entre la intro y esta sección, Collage.jsx) y puso en su lugar una foto sola a todo el ancho ("Mid").

// ms que tarda el paso de un eje al otro (el titular usa 360 para una fila de ~68 px).
const DURACION_PANEL = 560
// px que se desplaza el texto al renovarse: entra desde la derecha y sale hacia la izquierda, como la foto pero poco.
const CORRIMIENTO_TEXTO = 24
const CURVA = 'cubic-bezier(0.33, 0, 0.67, 1)'

// paso 0 cuando no está enganchado (apilado): así el motor pinta directo al pasar de un modo al otro.
function medir({ fijo, cola }) {
  const enganche = medirEnganche(fijo)
  return { paso: enganche.enganchado ? 1 : 0, ...enganche, cola: enganche.enganchado ? cola.offsetHeight : 0 }
}

// Progreso de los ejes: 0 al engancharse y 1 al llegar al último, que queda quieto durante la cola (el final del bloque,
// data-cola) antes de soltarse. Sin cola, el mismo gesto que mostraba el último eje sacaba de la sección y no se llegaba
// a leer (pedido del desarrollador el 22/09/2026, en escritorio y en celular). Los cambios de eje quedan en el mismo
// scroll que antes: al 30 % y al 80 % del recorrido sin la cola.
function progreso(rect, alto, medida) {
  const p = progresoEnganche(rect, alto, medida)
  if (!medida.enganchado) return p
  const recorrido = rect.height - medida.altoFijo
  const util = recorrido - medida.cola
  return util > 0 ? Math.min((p * recorrido) / util, 1) : p
}

// Paso de un nodo a un estado en línea (las propiedades de `destino`), animando desde el estado calculado actual. Sin
// estado propio: el destino vigente queda en data-destino, y un cambio a mitad de viaje arranca desde donde está.
// `tiempo`: duración y demora de la animación (con demora, el nodo se queda en el estado de partida hasta que arranca).
// En dos tiempos para no intercalar lecturas y escrituras (cada getComputedStyle después de escribir estilos forzaba otro
// recálculo: 6 por cambio de eje, medido): `preparar` solo lee y `ejecutar` solo escribe; aplicar prepara todos los
// nodos y después los ejecuta.
// visibility no va en la animación (con ella el navegador no la puede pasar al compositor y, en un celular de gama baja,
// el cuadro del cambio llegaba a 92 ms; medido el 22/09/2026): el que entra se ve apenas arranca y el que sale queda
// visible hasta que termina, y recién ahí pasa a hidden (si mientras tanto no cambió de destino).
function preparar(nodo, destino, animar, tiempo = { duration: DURACION_PANEL }) {
  const clave = Object.values(destino).join('|')
  if (nodo.dataset.destino === clave) return { nodo, destino, animar, igual: true }
  const actual = getComputedStyle(nodo)
  const desde = {}
  for (const k of Object.keys(destino)) {
    if (k !== 'visibility') desde[k] = k === 'translate' && actual.translate === 'none' ? '0px 0px' : actual[k]
  }
  return { nodo, destino, animar, tiempo, clave, desde }
}

function ejecutar({ nodo, destino, animar, tiempo, clave, desde, igual }) {
  const oculto = destino.visibility === 'hidden'
  if (igual) {
    // Directo con el mismo destino: se corta lo que estuviera animando y queda el estado final en línea.
    if (!animar) {
      nodo.getAnimations().forEach((a) => a.cancel())
      if ('visibility' in destino) nodo.style.visibility = destino.visibility
    }
    return
  }
  nodo.getAnimations().forEach((a) => a.cancel())
  for (const [k, v] of Object.entries(destino)) nodo.style[k] = k === 'visibility' && animar && oculto ? '' : v
  nodo.dataset.destino = clave
  if (!animar) return
  const hasta = { ...destino }
  delete hasta.visibility
  const animacion = nodo.animate([desde, hasta], { ...tiempo, easing: CURVA, fill: 'backwards' })
  if (oculto) {
    animacion.onfinish = () => {
      if (nodo.dataset.destino === clave) nodo.style.visibility = 'hidden'
    }
  }
}

function reponer(nodo) {
  nodo.getAnimations().forEach((a) => a.cancel())
  nodo.style.translate = ''
  nodo.style.opacity = ''
  nodo.style.visibility = ''
  delete nodo.dataset.destino
}

// Parada `fila` = eje activo. Las fotos del marco se corren (i - fila) anchos del marco a lo largo de todo el paso; el
// texto del eje activo se ve en su lugar y los demás quedan transparentes, corridos hacia donde se fueron (los
// anteriores a la izquierda, los siguientes a la derecha) y ocultos para el puntero y el lector. El texto que sale se
// va en la primera mitad del paso y el que entra llega en la segunda: si se cruzaran, se leerían superpuestos.
function aplicar({ marco, textos }, fila, animar) {
  const fotos = [...marco.children]
  // Solo los artículos: el marco naranja también vive ahí adentro y no se anima nunca.
  const bloques = [...textos.children].filter((n) => n.tagName === 'ARTICLE')
  if (fila < 0) {
    ;[...fotos, ...bloques].forEach(reponer)
    return
  }
  const mitad = DURACION_PANEL / 2
  // Las fotos fuera del marco quedan además con visibility hidden: recortadas por el marco seguían en el árbol de
  // accesibilidad y el lector de pantalla anunciaba las tres seguidas (hallazgo de la revisión adversarial, 21/09/2026).
  const pasos = fotos.map((foto, i) =>
    preparar(foto, { translate: `${(i - fila) * 100}% 0px`, visibility: i === fila ? '' : 'hidden' }, animar),
  )
  bloques.forEach((nodo, i) => {
    const activo = i === fila
    pasos.push(preparar(
      nodo,
      {
        translate: activo ? '0px 0px' : `${(i < fila ? -1 : 1) * CORRIMIENTO_TEXTO}px 0px`,
        opacity: activo ? '1' : '0',
        visibility: activo ? '' : 'hidden',
      },
      animar,
      activo ? { duration: mitad, delay: mitad } : { duration: mitad },
    ))
  })
  pasos.forEach(ejecutar)
}

// lazy: las fotos del carrusel que arrancan fuera del marco no pueden ser lazy: recortadas por el marco nunca "entran"
// en pantalla, así que la descarga arrancaba recién al empezar el paso y la foto entraba en negro (hallazgo de la
// revisión adversarial, 21/09/2026). Las copias de la versión apilada sí son lazy (misma URL: salen de caché).
function Foto({ src, srcSet, alt, encuadre, lazy = true }) {
  if (!src) return <Placeholder alt={alt || PENDIENTE} className="h-full w-full" />
  return (
    <>
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? '(min-width: 1024px) 50vw, 100vw' : undefined}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        fetchPriority={lazy ? undefined : 'low'}
        className={`h-full w-full object-cover ${encuadre ?? ''}`}
      />
      {/* Sombreado (pedido del desarrollador, 18/09/2026; el Figma lo tiene abajo): en lg la foto se oscurece hacia su
          borde derecho, el de la pantalla, así el lado que mira al texto queda con todo su brillo y la foto se distingue;
          en pantallas chicas, donde va arriba, se oscurece hacia abajo. Misma intensidad que el Figma: brillo 100 % hasta
          el 13 %, ~35 % en el borde. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent from-13% to-black/65 lg:bg-linear-to-r"
      />
    </>
  )
}

// Estilos del texto, compartidos por el carrusel y la versión apilada. La etiqueta va dentro de un recuadro de borde
// naranja (V03 y V04: 967x75 px de 1920, o sea 58,8 % del ancho del contenido por 56,5 px de alto a 1440) con la mono
// en Medium a 24 px; el texto del eje arranca 44 px debajo del recuadro.
const ETIQUETA = 'flex h-12 items-center px-4 font-mono text-base font-medium uppercase md:h-[3.625rem] md:px-[1.375rem] md:text-2xl'
// El marco naranja: en el carrusel es un elemento aparte, detras de las etiquetas, que NO se anima (pedido del
// desarrollador el 25/09/2026: con la animacion del carrusel y la mascara, el borde de abajo aparecia y desaparecia).
const MARCO = 'pointer-events-none rounded-md border-[1.5px] border-naranja'
// El marco del carrusel se pasa del ancho de la columna de texto y se superpone al borde izquierdo de la foto, como en
// el V03 y el V04 (utilidad etiqueta-ancha en index.css, que ademas lo desvanece antes de la foto: en el archivo el
// recuadro sigue entero sobre la foto, pero el desarrollador pidio el desvanecido el 25/09/2026 y lo mantuvo).
const MARCO_CARRUSEL = `${MARCO} absolute inset-x-0 top-0 h-12 md:h-[3.625rem] lg:etiqueta-ancha`
const TEXTO = 'mt-6 text-[0.9375rem] leading-[1.4rem] md:mt-11 md:text-[1.03125rem] md:leading-[1.6875rem]'

// Estado inicial de los textos (antes de que el motor pinte): solo el primero a la vista.
const inicial = (i) =>
  i === 0 ? undefined : { translate: `${CORRIMIENTO_TEXTO}px 0px`, opacity: 0, visibility: 'hidden' }

// El carrusel: un marco fijo con las tres fotos y, al lado (o abajo), el texto del eje activo.
function Carrusel({ ejes, marco, textos }) {
  return (
    /* En lg el marco de la foto se posiciona contra el bloque enganchado (fijo), no contra este envoltorio: por eso
       este y el de arriba pasan a static en lg. Así la foto arranca a 58 px del borde de arriba del bloque, donde
       empieza la tinta del título (V04: la foto alineada con el título), y no debajo de él. */
    <div className="relative flex h-full w-full flex-col lg:static lg:block">
      {/* Marco de la foto. En pantallas chicas va arriba y usa el alto que deja el texto (entre 18 % y 46 % de la pantalla;
          eran 38 hasta que el V03 sacó la palabra grande, que ocupaba el fondo de la pantalla), así entra también en
          celulares bajos. En lg va a la derecha, al ras del borde, con el borde de arriba en la tinta del título (48 px
          del padding más los ~10 px de aire que deja la tipografía sobre las mayúsculas a 78,75 px); su bloque
          contenedor es el envoltorio que sube al aparecer, que mide lo mismo que el bloque fijo. Las fotos van
          adentro una al lado de la otra, corridas un ancho cada una; el marco recorta. */}
      <div
        ref={marco}
        data-marco
        className="relative max-h-[46svh] min-h-[18svh] w-full flex-1 overflow-hidden lg:absolute lg:top-[3.625rem] lg:right-0 lg:aspect-[710/476] lg:max-h-[calc(100%-6.125rem)] lg:min-h-0 lg:w-[49.3%]"
      >
        {ejes.map((eje, i) => (
          <div
            key={eje.etiqueta}
            className="absolute inset-0"
            style={{ translate: `${i * 100}% 0px`, visibility: i === 0 ? undefined : 'hidden' }}
          >
            <Foto {...eje.foto} lazy={i === 0} />
          </div>
        ))}
      </div>
      {/* Columna de texto: en lg, el 46 % del contenido a la izquierda de la foto (el marco de la etiqueta se pasa de
          ese ancho y se superpone a la foto, como en el V03). En lg arranca 44 px debajo del título: así el recuadro
          queda a 233 px de la tinta del título, como en el V04. */}
      <div className="relative mx-auto w-full max-w-sitio px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-10 md:pb-10 lg:pt-11 lg:pb-0">
        {/* grid-cols-[minmax(0,1fr)]: la columna mide lo que el contenedor (419 px), no lo que el marco de la etiqueta,
            que se pasa a propósito; si no, el texto del eje se estiraba hasta el ancho del marco. */}
        <div ref={textos} data-textos className="relative grid grid-cols-[minmax(0,1fr)] max-w-[26.1875rem] lg:w-[46%]">
          {/* El marco, quieto: las etiquetas se renuevan adentro con el carrusel, pero el borde no se anima nunca. */}
          <div aria-hidden="true" className={MARCO_CARRUSEL} />
          {ejes.map((eje, i) => (
            <article key={eje.etiqueta} aria-labelledby={`eje-${i}`} className="col-start-1 row-start-1" style={inicial(i)}>
              <h3 id={`eje-${i}`} className={ETIQUETA}>
                {eje.etiqueta}
              </h3>
              <p className={TEXTO}>{eje.texto || PENDIENTE}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

// Un eje entero, para la versión apilada: foto arriba en pantallas chicas y flotando a la derecha de su texto en lg.
function Eje({ eje, id }) {
  return (
    <article aria-labelledby={id} className="relative flow-root">
      <div className="relative aspect-[710/476] w-full overflow-hidden lg:float-right lg:ml-8 lg:w-[49.3%]">
        <Foto {...eje.foto} />
      </div>
      <div className="mx-auto w-full max-w-sitio px-6 pt-5 pb-5 md:px-10 md:pb-10 lg:pt-0">
        <div className="max-w-[26.1875rem] lg:w-[46%]">
          <h3 id={id} className={`${MARCO} ${ETIQUETA}`}>
            {eje.etiqueta}
          </h3>
          <p className={TEXTO}>{eje.texto || PENDIENTE}</p>
        </div>
      </div>
    </article>
  )
}

// Foto "Mid" del V04: sola, al ancho del contenido, 3:2, esquinas de 36 px, entre los ejes y el cierre. Aparece con
// una subida suave (64 px y fundido, como el párrafo de la intro; elección del desarrollador el 28/09/2026), una sola
// vez, cuando llega al 80 % de la pantalla; el observador mira el envoltorio, que no se traslada. En el archivo mide
// 1240 px, 12 px más que el contenido de cada lado: se lleva al ancho del contenido. Con reduced-motion y al imprimir,
// fija y visible.
function FotoMid({ foto }) {
  const envoltorio = useRef(null)
  const visible = useAparecer(envoltorio)
  if (!foto?.src) return null
  return (
    <figure ref={envoltorio} className="mx-auto w-full max-w-sitio px-6 md:px-10">
      <div
        className={`aspect-[3/2] w-full overflow-hidden rounded-[1.25rem] transition ease-out md:rounded-[2.25rem] motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 ${
          visible ? 'translate-y-0 opacity-100 duration-[900ms]' : 'translate-y-16 opacity-0 duration-500'
        }`}
      >
        <img
          src={foto.src}
          srcSet={foto.srcSet}
          sizes="(min-width: 1440px) 1215px, (min-width: 768px) calc(100vw - 5rem), calc(100vw - 3rem)"
          alt={foto.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    </figure>
  )
}

export default function Identidad() {
  const { titulo, ejes = [], foto, parrafo, instituciones } = identidad
  const bloque = useRef(null)
  const fijo = useRef(null)
  const marco = useRef(null)
  const textos = useRef(null)
  const cola = useRef(null)
  const refs = useMemo(() => ({ bloque, fijo, marco, textos, cola }), [])
  const activo = ejes.length > 1
  // La sección entra subiendo (pedido del desarrollador el 28/09/2026: después del carrusel de fotos quedaba una
  // porción de pantalla en negro hasta que llegaba el título): el contenido del bloque fijo arranca 64 px más abajo y
  // transparente y sube a su lugar en 900 ms en cuanto el bloque fijo entra por el borde de abajo de la pantalla (linea
  // 1), una sola vez. El observador es el bloque fijo, que no se traslada. Con la línea en el 85 % el disparo llegaba
  // después de que el carrusel se soltaba en 1366x768 y 1280x720 (el bloque fijo está 226 px más abajo que la sección
  // y el título otros 112: la línea del 85 % sobre el bloque era el borde de la pantalla para el título) y el negro
  // seguía ahí; con 1 el título entra opaco por debajo de la última foto con el carrusel todavía enganchado (66 px
  // visibles al soltarse a 1366x768, 130 a 1440x900; revisión adversarial del 28/09/2026).
  const visible = useAparecer(fijo, { linea: 1 })

  useScrollPorPasos(refs, { pasos: ejes.length, medir, progreso, aplicar, duracion: DURACION_PANEL, activo })

  return (
    /* Padding de arriba en lg: el carrusel de fotos que viene antes (Collage.jsx) termina justo en su última foto, y el
       V04 pone la tinta del título 284 px más abajo (226 acá + 48 del bloque + ~10 de la tipografía). Debajo de lg la
       sección sigue el ritmo de las demás (64/96 px): el título queda a 88 px de la foto en celular y a 144 en tablet. */
    <section id="identidad" aria-labelledby="identidad-titulo" className="pt-16 md:pt-24 lg:pt-[14.125rem]">
      {/* Alto del bloque = pantalla fija + el scroll para recorrer los ejes: 1 pantalla en lg (~450 px por eje a 900 de
          alto, ~4,5 muescas de rueda) y 1,1 con el dedo (~447 px por eje a 375x812). En lg eran 1,5 pantallas hasta el
          21/09/2026: el desarrollador las sintió largas. Con el dedo era 1 pantalla; el 22/09/2026 pidió un poco más de
          recorrido por paso en celular (+25 %) y ese mismo día, porque un usuario de prueba lo sintió trabado, un punto
          medio (+10 %). Más la cola, con el último eje quieto antes de soltarse (ver progreso): 30 % de pantalla en lg y 33 %
          con el dedo (el desarrollador la pidió más larga en celular el 22/09/2026, 45 %, y el 25/09 la acortó porque
          "la última foto necesita mucho scroll para salir"; el bloque quedó en 255svh hasta el 28/09/2026, cuando la
          revisión adversarial notó que el recorrido por eje había crecido un 11 %: ahora 243 = 100 + 110 + 33). */}
      <div ref={bloque} className={activo ? 'relative h-[243svh] lg:h-[230svh] apilado:h-auto' : 'relative'}>
        <div
          ref={fijo}
          className={activo ? 'sticky top-0 flex h-svh flex-col overflow-clip apilado:static apilado:h-auto' : 'flex flex-col'}
        >
          {/* Envoltorio que sube al aparecer (ver `visible`). Ocupa todo el bloque fijo, así que en lg el marco de la
              foto, que se posiciona contra él (un translate lo vuelve bloque contenedor), queda donde estaría contra el
              bloque fijo. Con reduced-motion y al imprimir, fijo y visible. */}
          <div
            className={`flex min-h-0 flex-1 flex-col transition ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 ${
              visible ? 'translate-y-0 opacity-100 duration-[900ms]' : 'translate-y-16 opacity-0 duration-500'
            }`}
          >
            {/* Título en dos líneas (V04, 28/09/2026: 78,75 px a 1440 con interlineado 1,01, en la columna izquierda;
                hasta entonces una línea a 100,8 px cruzando el ancho). Sigue siendo compartido por el carrusel y la
                variante apilada. */}
            <div className="mx-auto w-full max-w-sitio px-6 pt-6 pb-4 md:px-10 md:pt-12 md:pb-10">
              <h2
                id="identidad-titulo"
                className={`font-display text-[length:clamp(2rem,5.47vw,4.921875rem)] leading-[1.01] font-thin whitespace-pre-line ${titulo ? '' : 'text-muted'}`}
              >
                {titulo || PENDIENTE}
              </h2>
            </div>
            {/* Carrusel (enganchado) o, en la variante apilado, los ejes uno debajo del otro: los dos están en el DOM y la
                variante muestra uno solo (display: none no carga las fotos lazy del otro). */}
            <div className="relative min-h-0 flex-1 apilado:hidden lg:static">
              <Carrusel ejes={ejes} marco={marco} textos={textos} />
            </div>
            <div className="hidden apilado:flex apilado:flex-col apilado:gap-16">
              {ejes.map((eje, i) => (
                <Eje key={eje.etiqueta} eje={eje} id={`eje-apilado-${i}`} />
              ))}
            </div>
          </div>
        </div>
        {/* Cola: el último tramo del bloque, en el que el último eje queda quieto antes de soltarse (lo mide `medir`). */}
        {activo && (
          <div ref={cola} data-cola aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[33svh] lg:h-[30svh] apilado:hidden" />
        )}
      </div>

      {/* Foto Mid (V04): en lg viene pegada al final del bloque enganchado (a 1440x900, la foto del eje termina 365 px
          antes, cerca de los 339 del archivo). */}
      <div className="mt-16 lg:mt-0">
        <FotoMid foto={foto} />
      </div>

      {/* Cierre: párrafo a la izquierda y los logos en columna (64,5 px entre sí en el V04; eran 73) anclados a la
          derecha, alineados entre sí por el eje de sus emblemas redondos (el sello de la UNSJ y la flor de Gobierno:
          el V04 los alinea por el borde izquierdo y el desarrollador los vio "desfasados", 28/09/2026; cada logo trae en
          content.js el centro de su círculo y el que lo tiene más a la izquierda se corre la diferencia), y con el
          más ancho (Gobierno, 253,5 px) terminando a 148,5 px del margen del contenido, donde lo pone el V04 (en el
          V03, con logos más anchos, el bloque terminaba a 110 del margen). En lg arranca a 375 px de la foto Mid, como
          en el archivo. overflow-x-clip: el patrón b sale por el borde derecho. */}
      <div className="overflow-x-clip">
        <div className="mx-auto w-full max-w-sitio px-6 pt-12 pb-16 md:px-10 md:pb-24 lg:flex lg:items-center lg:gap-12 lg:pt-[23rem]">
          <p
            className={
              parrafo
                ? 'font-light text-base leading-relaxed md:text-lg lg:max-w-[36.875rem] lg:shrink lg:text-[1.40625rem] lg:leading-9'
                : 'text-muted'
            }
          >
            {parrafo ? <TextoDestacado texto={parrafo} /> : PENDIENTE}
          </p>

          <ul
            aria-label={ui.instituciones}
            className="relative mt-12 flex w-fit flex-col items-start gap-10 lg:mt-0 lg:ml-auto lg:mr-[9.28125rem] lg:shrink-0 lg:gap-[4.03rem]"
          >
            {instituciones.map(({ nombre, logo, ancho, alto, circulo = 0 }, i) => (
              /* --desfase: lo que se corre este logo a la derecha para que su emblema quede en el eje del que lo tiene
                 más a la derecha (a 1440; por debajo de lg, al 70 % como los logos). */
              <li
                key={nombre}
                className="relative ml-[calc(var(--desfase)*0.7)] lg:ml-(--desfase)"
                style={{ '--desfase': `${(Math.max(...instituciones.map((inst) => inst.circulo ?? 0)) - circulo) / 16}rem` }}
              >
                {logo ? (
                  /* Ancho del diseño a 1440 (--ancho); por debajo de lg, al 70 %. width/height reservan la proporción antes
                     de que cargue el SVG, así no empuja la página. */
                  <img
                    src={logo}
                    alt={nombre}
                    width={ancho}
                    height={alto}
                    loading="lazy"
                    style={{ '--ancho': `${(ancho ?? 200) / 16}rem` }}
                    className="w-[calc(var(--ancho)*0.7)] lg:w-(--ancho)"
                  />
                ) : (
                  <span className="inline-flex items-center border border-line px-4 py-3 text-xs uppercase tracking-wider text-muted">
                    {nombre}
                  </span>
                )}
                {/* Patrón b (V04): piedritas en contorno a la derecha de los logos, saliendo por el borde de la pantalla
                    y bajando hasta la tinta del título de Obra (por eso Obra lleva tanto padding arriba en lg). Cuelga
                    del segundo logo (Gobierno): su caja arranca 12 px por encima de él y 219,8 px a su derecha (230,5
                    menos los 10,7 que ese logo se corre para alinear los emblemas; 617x606 px a 1440, el archivo la
                    pone en 1156..1773 x 5577..6183 de la página); la máscara que lo desvanece hacia el borde está en
                    index.css (patron-b). Solo en lg. */}
                {i === instituciones.length - 1 && (
                  <img
                    src={patronB}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="patron-b pointer-events-none absolute -top-3 left-[13.7375rem] hidden w-[38.58rem] max-w-none lg:block"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
