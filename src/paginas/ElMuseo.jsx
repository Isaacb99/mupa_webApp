import ControlesCarrusel from '../components/ControlesCarrusel.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { Reproducir } from '../components/IconosRecursos.jsx'
import Seccion from '../components/Seccion.jsx'
import {
  BAJADA,
  CLASES_TEXTO_TABLERO,
  CONTENEDOR_TABLERO,
  ENLACE_TARJETA,
  PARRAFO_GRANDE,
  PARRAFO_SECUNDARIO,
  PARRAFO_TABLERO,
  ROTULO_SECCION,
  ROTULO_TARJETA,
  TEXTO_TARJETA,
  TITULO_SECCION,
  TITULO_SUBSECCION,
} from '../components/tablero.js'
import { elMuseo } from '../content.js'
import useCarrusel from '../hooks/useCarrusel.js'

// /el-museo: la página del tablero "Web" de la diseñadora (Figma 2823:10228, 06/11/2026; decisiones IN1 a IN10 del
// desarrollador) y, debajo de md, el cuadro de celular (Figma "Web Mobile", 3123:19642, 10/11/2026; O6: las mismas
// decisiones). Fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá; desde lg, como antes del
// celular. Va dentro de Layout (el header absolute encima de la foto, el <main>, el pie): acá, la página COMPLETA, como
// el tablero (IN1), con el relleno marcado en src/content.js (elMuseo, "RELLENO DEL TABLERO:", IN4). De arriba abajo:
// - El hero (HeroPagina.jsx, sin bajada): el h1 "Acerca del MuPa" (el menú dice "El Museo") sobre las torres del frente
//   contra el cielo (la foto del tablero es la de Contacto: IN6).
// - "El MuPa": los dos párrafos y la foto del patio en 5:3 (la grilla de "Museo accesible" de Visitas), con las
//   piedritas de "El MuPa en imágenes" de la Home (patron-galeria.svg), que suben 96 px sobre la foto del hero, como en
//   el tablero. En el celular, la foto con el recorte del cuadro (354x230: el edificio de la cúpula más cerca), por CSS.
// - "Cómo nos organizamos": las dos partes de la cogestión (una lista; cada una con su rótulo en h3, el logo de la
//   institución, la introducción en gris y la lista), en columnas de 502 y 738 a 1440, con las piedritas del cierre de
//   Identidad de la landing (patron-b.svg con su desvanecido), que bajan 256 px dentro de "Misión y visión".
// - "Misión y visión": Misión y Visión (h3, el rótulo del tablero) en dos columnas y "Valores" (h3) con siete píldoras:
//   una lista, no controles (IN2).
// - "Haciendo el MuPa": tres documentales en una fila desde md (a 1440 entran los tres: sin las flechas ni el "1/3" del
//   tablero, que no harían nada, IN2) y, debajo de md, un carrusel de a uno con ← "1/3" → a la izquierda, como el
//   cuadro de celular (Documentales: ahí las flechas hacen algo), con la tarjeta de 24rem (384) como mucho, como la de
//   Novedades: en los teléfonos mide el ancho del contenido; desde 432 px de ventana mide 384 y, desde ~457, asoma la
//   siguiente (T4 de la tanda 1, 16/11/2026). El "play" es un decorado (aria-hidden). Con url en la fila, el título es
//   el enlace, estirado sobre la tarjeta (ENLACE_TARJETA, como las de Novedades).
// - "El MuPa en números": el h2 centrado (escrita a mano, como "El MuPa en imágenes": Seccion no lo centra) y un <dl>
//   de cuatro columnas con una línea entre ellas desde lg (de md a lg, dos; debajo de md, una, a 64 px: CIFRAS); la
//   cifra arriba (order-first: en el HTML va después de su etiqueta, así el lector dice "Piezas fósiles, …"), con la
//   letra del h1 de los hero sin la sombra.
// - "Autoridades" y "Nuestro equipo": las personas sin retrato (IN5: el recuadro de 120 en bg-caja, aria-hidden); con
//   foto en la fila, el <img> con su nombre de alt. El equipo, escrito a mano: debajo de md, el rótulo, el h2 y el
//   párrafo centrados y los integrantes de a uno (el cuadro de celular; el título y el párrafo, los de escritorio: O7).
// Las secciones llevan 120 arriba y abajo desde lg (el tablero de esta página; las demás, 80), 48 de md a lg y, debajo
// de md, 32 (64 entre una y otra, como el cuadro de celular: 48 arriba de la primera y 40 debajo de la última), y 16
// entre el rótulo y el h2 (Seccion con cerca), salvo "El MuPa" (24 desde lg). Del encabezado al contenido, en el
// celular, 24 o 32, como el cuadro. Las piedritas, solo desde lg (el cuadro de celular no tiene). Encabezados: el h1 del
// hero, un h2 por sección y h3 en las partes de la cogestión, Misión, Visión, Valores, los documentales y las
// autoridades. Todas las fotos, menos la del hero (el LCP), lazy y con prioridad baja. No lee la base
// (server/paginas.js, cargarFija): sale igual con la base caída. La analítica: solo page_view (y clic_entradas desde el
// menú: D14, IN8). Las tablets (de md a lg, sin cuadro): las columnas de escritorio, los tres documentales en fila, las
// cifras y el equipo de a dos (D1 del plan del celular, la opción A).

/**
 * El aire de las secciones de esta página: 120 arriba y abajo desde lg (el tablero), 48 de md a lg y 32 debajo de md
 * (64 entre una y otra: el cuadro de celular). La primera, a 48 del hero, y la última, a 40 del pie (el contenedor del
 * cuadro de celular, 3123:19747).
 */
const SECCION = 'py-8 md:py-12 lg:py-30'
/**
 * Las secciones con piedritas: posicionadas (las piedritas cuelgan de ellas) y sin scroll horizontal (clip, no hidden).
 * La primera ("El MuPa"), con los 48 de arriba del cuadro de celular.
 */
const SECCION_PRIMERA = 'relative overflow-x-clip pt-12 pb-8 md:py-12 lg:py-30'
const SECCION_CON_PIEDRITAS = 'relative overflow-x-clip py-8 md:py-12 lg:py-30'
/** La última (el equipo): 40 debajo, hasta el pie, en el celular. */
const SECCION_ULTIMA = 'pt-8 pb-10 md:py-12 lg:py-30'
/** El envoltorio de las piedritas: a lo ancho de la página, sin alto, solo desde lg (el cuadro de celular no tiene). */
const PIEDRITAS = 'pointer-events-none absolute inset-x-0 top-0 hidden h-0 lg:block'
/**
 * Dos columnas de 600 con 80 entre sí a 1440 (las de "Museo accesible" de Visitas) y de md a lg, con 32; debajo de md,
 * una, a 24 del h2 y con 24 entre los párrafos y la foto.
 */
const DOS_COLUMNAS = 'mt-6 grid gap-6 md:grid-cols-2 md:gap-8 lg:mt-12 lg:gap-x-20'
const COLUMNA_TEXTO = 'flex min-w-0 flex-col gap-6'
/**
 * La foto del patio: desde 32rem, entera en 5:3 con esquinas de 16 (la foto misma, como antes del celular: el
 * envoltorio no tiene caja, con display contents, y la foto es la celda de la grilla, o el ancho de la columna de
 * 32rem a md). Debajo de 32rem (los teléfonos), el recorte del cuadro de celular sin un archivo nuevo: el envoltorio de
 * 354x230 recorta y la foto, agrandada 1,515 veces desde abajo y el centro, deja a la vista el 66 % del medio del ancho
 * y el 66 % de abajo (el cuadro, el 64 %). De 32rem a md (tablets chicas y teléfonos acostados, sin cuadro) va entera,
 * como antes: agrandada, el archivo más grande se veía a 0,66 píxeles por píxel en un iPad mini (VMUS-01 de la
 * verificación, 11/11/2026). El envoltorio aísla lo que pinta (con isolation), para que las esquinas recorten la foto
 * agrandada también en Safari.
 */
const MARCO_PATIO =
  'contents max-[32rem]:isolate max-[32rem]:block max-[32rem]:aspect-[354/230] max-[32rem]:overflow-hidden ' +
  'max-[32rem]:rounded-2xl'
const FOTO_PATIO =
  'block aspect-[5/3] h-auto w-full rounded-2xl object-cover max-[32rem]:aspect-auto max-[32rem]:size-full ' +
  'max-[32rem]:rounded-none max-[32rem]:origin-bottom max-[32rem]:scale-[1.515]'
/**
 * Las dos partes de la cogestión: de 502 y 738 con 40 entre sí a 1440, dos iguales con 32 de md a lg y, debajo de md,
 * una debajo de la otra con 48 (el cuadro de celular), a 24 del h2. Posicionada (relative): ver las piedritas.
 */
const PARTES = 'relative mt-6 grid gap-12 md:grid-cols-2 md:gap-8 lg:mt-12 lg:grid-cols-[502fr_738fr] lg:gap-10'
/**
 * La lista de las partes de la cogestión: la de BloqueTextoFoto.jsx (cada ítem 16/24 con la viñeta de 6 px), con
 * text-pretty como los párrafos (a 1024 un ítem terminaba con «paleontología» sola: BDIS-03 del cierre, 09/11/2026).
 */
const LISTA = `${CLASES_TEXTO_TABLERO.ul} flex flex-col gap-3 text-base leading-6 font-normal text-paper text-pretty`
/** Una parte de la cogestión: 40 de padding (como las tarjetas de información de Visitas; 24 a los costados hasta xl). */
const PARTE = 'flex min-w-0 flex-col gap-6 lg:px-6 lg:py-10 xl:px-10'
const LOGO = 'block h-auto max-w-full'
/** Misión y Visión: en dos columnas desde md; debajo, una debajo de la otra, a 32 del h2 y con 32 entre sí. */
const MISION = 'mt-8 grid gap-8 md:grid-cols-2 lg:mt-16 lg:gap-x-20'
const COLUMNA_MISION = 'flex min-w-0 flex-col gap-6 lg:py-10'
/** "Valores": a 32 de Visión en el celular. */
const VALORES = 'mt-8 lg:mt-16'
/** Una píldora de Valores: borde crema de 1 px, 44 de alto, Roboto Mono 14/20. No es un control (IN2). */
const PILDORA =
  'rounded-full border border-paper px-[1.4375rem] py-[0.6875rem] font-mono text-sm leading-5 font-normal text-paper'
const BAJADA_SECCION = `${BAJADA} mt-4`
/**
 * Los documentales. Desde md, la fila de tres de escritorio (32 entre sí desde lg y 24 de md a lg; a 48 de la bajada
 * desde lg y a 32 de md a lg). Debajo de md, la misma lista es un carrusel de a uno, como el cuadro de celular: scroll
 * horizontal nativo, cada tarjeta del ancho del contenido con un tope de 24rem (DOCUMENTAL) y 32 entre tarjetas; el
 * snap obligatorio, recién cuando la página hidrató (como en Novedades), y sin barra. 24 debajo de la bajada: el margen
 * de arriba (16) más los 8 del margen por dentro (para el contorno del foco), que los márgenes negativos devuelven,
 * como en Novedades. Sin JavaScript y al imprimir, las tres una debajo de la otra. Con el foco (ver Documentales), el
 * contorno blanco de la fila: en los teléfonos, a 8 de la tarjeta en los cuatro lados (el margen por dentro va también
 * a la derecha: VMUS-02 de la verificación); con el tope de la tarjeta, a 8 de la primera arriba, abajo y a la
 * izquierda y, a la derecha, en el borde de la fila, por donde asoma la siguiente.
 */
const FILA_DOCUMENTALES =
  'relative mt-4 -mr-2 -mb-2 -ml-2 flex scroll-pl-2 gap-8 overflow-x-auto overscroll-x-contain py-2 pr-2 pl-2 ' +
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden noscript:flex-wrap noscript:overflow-visible ' +
  'print:flex-wrap print:overflow-visible focus-visible:outline-2 focus-visible:outline-blanco md:m-0 md:mt-8 ' +
  'md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:p-0 lg:mt-12 lg:gap-8'
/**
 * Una tarjeta de documental. Debajo de md, la del carrusel: el ancho del contenido con un tope de 24rem (384), el de la
 * tarjeta de Novedades (CarruselNovedades.jsx). En los teléfonos (hasta 431 px de ventana, con la letra normal) el
 * contenido mide menos de 384 y la tarjeta lo ocupa entero, como el cuadro de celular; más allá (las tablets de menos
 * de 768 px: el iPad mini parado, las de 7 pulgadas) mide 384 y, desde ~457 px, asoma la siguiente, como en Novedades.
 * Hasta el 16/11/2026 (T4 de la tanda 1) medía siempre el ancho del contenido: hasta 767 px quedaba una sola tarjeta
 * de hasta 719 px y, para pasar a la siguiente con el dedo lento, había que arrastrarla más de la mitad (376 px a 767);
 * con el tope, de una tarjeta a la otra hay 416 y alcanza con 208. Sin JavaScript y al imprimir (las tres una debajo
 * de la otra), el ancho entero, como antes (y el sizes de las fotos, también: SIZES_TERCIO de content.js). Desde md, la
 * celda de la grilla de tres (auto; con el ancho entero de los modos apilados la celda mide lo mismo).
 */
const DOCUMENTAL =
  'group relative w-[min(100%,24rem)] min-w-0 shrink-0 snap-start noscript:w-full print:w-full md:w-auto'
/** La foto de un documental: 354x280 en el celular (el cuadro; con el tope, 384x304), 405x280 desde md. */
const FOTO_DOCUMENTAL = 'block aspect-[354/280] h-auto w-full rounded-xl object-cover md:aspect-[405/280]'
/**
 * ← "1/3" → debajo de la fila, a la izquierda (como los dibuja el cuadro de celular; en Novedades, desde el 16/11/2026,
 * las flechas van a los costados de la fila y, desde el 17/11/2026, abajo no queda nada, ni el contador), a 24 de la
 * tarjeta; solo debajo de md (desde md entran los tres y no harían nada: IN2), con JavaScript y en la pantalla.
 */
const CONTROLES_DOCUMENTALES = 'mt-6 flex items-center justify-start gap-2 md:hidden noscript:hidden print:hidden'
/** El círculo del play: 64, negro al 60 %, centrado sobre la foto (decorado). */
const CIRCULO_PLAY =
  'absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ' +
  'bg-[rgb(0_0_0/0.6)] text-paper'
const TITULO_DOCUMENTAL = 'text-xl leading-7 font-medium text-paper wrap-break-word'
const SUBTITULO_DOCUMENTAL = 'text-sm leading-[1.375rem] font-normal text-muted'
const TITULO_CENTRADO = `${TITULO_SECCION} text-center`
/**
 * Cada cifra: 40 arriba y abajo, y a los costados 24 desde lg y 8 debajo (el texto va centrado: se ve igual que los 24
 * del cuadro de celular, y con la letra del navegador en 24 a 320 px «[—]» entra en su caja); con la línea de 1 px a la
 * derecha salvo en la última, desde lg (el cuadro de celular la deja en las tres primeras, un resto de las columnas de
 * escritorio: va sin ella).
 */
const COLUMNA_CIFRA = 'flex min-w-0 flex-col gap-2 px-2 py-10 text-center lg:px-6 lg:not-last:border-r lg:border-line'
/**
 * Cuatro columnas desde lg, dos de md a lg y, debajo de md, una, como el cuadro de celular (cada fila de 180). Con una
 * columna, la palabra más larga de los rótulos ("INVESTIGADORES", 7,35rem) entra también con la letra del navegador
 * agrandada (VDIS-01 de la verificación del cierre de E6.3, 09/11/2026); una palabra que igual no entre se parte
 * (wrap-break-word), como la cifra: un rótulo nuevo más largo no saca la página de la pantalla.
 */
const CIFRAS = 'mt-6 grid grid-cols-1 md:grid-cols-2 lg:mt-16 lg:grid-cols-4'
const ETIQUETA_CIFRA = 'font-mono text-sm leading-5 font-medium text-muted uppercase wrap-break-word'
/**
 * La cifra: la letra del h1 de los hero (755 con el ancho en 130 %), 64/72 en todos los anchos (el cuadro de celular
 * también), sin sombra. A 320 px entran unos 6 caracteres por renglón; una más larga se parte.
 */
const CIFRA =
  'order-first font-hero text-[4rem] leading-[1.125] font-[weight:755] [font-stretch:130%] text-paper wrap-break-word'
/** Las dos autoridades: en dos columnas desde md; debajo, una debajo de la otra, a 32 del h2 y con 32 entre sí. */
const AUTORIDADES = 'mt-8 grid gap-8 md:grid-cols-2 lg:mt-16 lg:gap-12 lg:gap-x-20'
const FICHA_AUTORIDAD = 'flex min-w-0 flex-col gap-8 lg:py-10'
const NOMBRE_AUTORIDAD = 'mt-2 text-[1.75rem] leading-9 font-medium text-paper wrap-break-word'
const BIO = TEXTO_TARJETA
/** El lugar del retrato (IN5): 120x120 con esquinas de 20; sin foto, el recuadro neutro en el color de la caja. */
const RECUADRO = 'block size-30 shrink-0 rounded-[1.25rem] bg-caja'
const RETRATO = 'block size-30 shrink-0 rounded-[1.25rem] object-cover'
/** El encabezado del equipo: debajo de md, centrado (el cuadro de celular); desde md, a la izquierda. */
const ROTULO_EQUIPO = `${ROTULO_SECCION} max-md:text-center`
const TITULO_EQUIPO = `${TITULO_SECCION} mt-4 max-md:text-center`
const PARRAFO_EQUIPO = `${PARRAFO_SECUNDARIO} mt-4 max-w-[43.75rem] max-md:mx-auto max-md:text-center`
/**
 * El equipo: cuatro columnas desde lg, dos de md a lg y, debajo de md, una, con 32 entre sí (el cuadro de celular), a
 * 32 del párrafo. Con una columna, los recuadros no se pisan con la letra agrandada (lo que se encontró al corregir
 * VDIS-01 del cierre de E6.3, 09/11/2026, con dos columnas a 320 px).
 */
const EQUIPO = 'mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6'
const INTEGRANTE = 'flex min-w-0 flex-col items-center gap-4 text-center'
const NOMBRE_INTEGRANTE = 'text-base leading-6 font-medium text-paper wrap-break-word'
const ROL_INTEGRANTE = 'mt-1 font-mono text-xs leading-[1.125rem] font-normal text-muted'

/** Una foto lazy y con prioridad baja (las de las secciones: no son del primer pantallazo, o no son el LCP). */
function FotoLazy({ imagen, className }) {
  return (
    <img
      src={imagen.src}
      srcSet={imagen.srcSet}
      sizes={imagen.sizes}
      width={imagen.ancho}
      height={imagen.alto}
      alt={imagen.alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={className}
    />
  )
}

/**
 * El retrato de una persona (IN5): con foto en su fila, la foto con su nombre de alt; sin foto, el recuadro neutro,
 * aria-hidden (sin silueta ni iniciales: nunca una cara con el nombre de otra persona).
 * @param {{ persona: { nombre: string, foto?: { src: string, srcSet?: string } | null } }} props
 */
function Retrato({ persona }) {
  if (!persona.foto) return <span aria-hidden="true" className={RECUADRO} />
  return (
    <img
      src={persona.foto.src}
      srcSet={persona.foto.srcSet}
      sizes={persona.foto.srcSet ? '120px' : undefined}
      width={120}
      height={120}
      alt={persona.nombre}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={RETRATO}
    />
  )
}

const { hero, presentacion, cogestion, mision, documentales, numeros, autoridades, equipo } = elMuseo

/**
 * "Haciendo el MuPa": la lista de los documentales, una sola vez en el HTML (el lector la lee una vez, en el orden de
 * siempre), que es la fila de tres desde md y el carrusel de a uno debajo (FILA_DOCUMENTALES), con los controles de
 * abajo de un carrusel (useCarrusel y ControlesCarrusel, los que tenía Novedades hasta el 16/11/2026): Anterior y
 * Siguiente con su nombre, el "1/3" de dibujo y, para el lector, "Documental 2 de 3" después de un botón. El estado
 * inicial es fijo (el mismo en el servidor y en el navegador): el snap y los controles a la vista llegan en un efecto.
 * Mientras las tarjetas no sean enlaces (url: null), en la fila con scroll no hay nada que tome el foco y con el
 * teclado solo se la podría deslizar con los botones (axe: scrollable-region-focusable): cuando desborda (debajo de md,
 * medido en el efecto), la fila misma entra en el orden del Tab; desde md no desborda (la fila de tres) y no entra. El
 * HTML del servidor no lo lleva. La lista se llama como su sección (aria-labelledby al h2): enfocada, el lector dice
 * cuál es (VREG-01 y VA11-02 de la verificación).
 */
function Documentales() {
  const total = documentales.lista.length
  const carrusel = useCarrusel({ total, contador: documentales.contador })
  const conFoco = carrusel.estado.listo && carrusel.estado.desborda && !documentales.lista.some((doc) => doc.url)
  return (
    <Seccion
      id="el-museo-documentales"
      rotulo={documentales.rotulo}
      titulo={documentales.titulo}
      cerca
      className={SECCION}
    >
      <p className={BAJADA_SECCION}>{documentales.bajada}</p>
      <ul
        ref={carrusel.fila}
        id={carrusel.idFila}
        aria-labelledby="el-museo-documentales"
        tabIndex={conFoco ? 0 : undefined}
        data-lenis-prevent-horizontal=""
        className={[FILA_DOCUMENTALES, carrusel.estado.listo ? 'max-md:snap-x max-md:snap-mandatory' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {documentales.lista.map((doc, i) => (
          <li key={doc.titulo} className={DOCUMENTAL}>
            <div className="relative">
              <FotoLazy imagen={doc.imagen} className={FOTO_DOCUMENTAL} />
              <span aria-hidden="true" className={CIRCULO_PLAY}>
                <Reproducir />
              </span>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <p className={ROTULO_TARJETA}>{`${documentales.etiqueta} · ${i + 1}`}</p>
              <h3 className={TITULO_DOCUMENTAL}>
                {doc.url ? (
                  <a href={doc.url} className={ENLACE_TARJETA}>
                    {doc.titulo}
                  </a>
                ) : (
                  doc.titulo
                )}
              </h3>
              <p className={SUBTITULO_DOCUMENTAL}>{doc.subtitulo}</p>
            </div>
          </li>
        ))}
      </ul>
      <ControlesCarrusel carrusel={carrusel} total={total} textos={documentales} className={CONTROLES_DOCUMENTALES} />
    </Seccion>
  )
}

export default function ElMuseo() {
  return (
    <>
      <HeroPagina id="el-museo-titulo" titulo={hero.titulo} imagen={hero.imagen} />

      <Seccion
        id="el-museo-presentacion"
        rotulo={presentacion.rotulo}
        titulo={presentacion.titulo}
        className={SECCION_PRIMERA}
      >
        {/* Las piedritas del tablero (2826:322: el mismo dibujo de la Home), de 96 px por encima de la sección (sobre la
            foto del hero, que va antes y sin z-index) a 364 por debajo, saliendo 90 px por el borde derecho de la
            página (no del cuadro de 1440: así en cualquier ancho, como en la Home, FID-03). El SVG mide 408x462, el
            trazado más el medio trazo de cada lado: por eso 1 px más. */}
        <div aria-hidden="true" className={PIEDRITAS}>
          <img
            src={presentacion.piedritas}
            alt=""
            width={408}
            height={462}
            loading="lazy"
            fetchPriority="low"
            className="absolute top-[-6.0625rem] right-[-5.6875rem] w-[25.5rem] max-w-none"
          />
        </div>
        <div className={DOS_COLUMNAS}>
          <div className={COLUMNA_TEXTO}>
            {presentacion.parrafos.map((parrafo, i) => (
              <p key={i} className={PARRAFO_TABLERO}>
                {parrafo}
              </p>
            ))}
          </div>
          <div className={MARCO_PATIO}>
            <FotoLazy imagen={presentacion.imagen} className={FOTO_PATIO} />
          </div>
        </div>
      </Seccion>

      <Seccion
        id="el-museo-cogestion"
        rotulo={cogestion.rotulo}
        titulo={cogestion.titulo}
        cerca
        className={SECCION_CON_PIEDRITAS}
      >
        {/* Las piedritas del cierre de Identidad de la landing (3123:18997; patron-b.svg con su desvanecido, la utilidad
            patron-b), de 617x606, de 502 a 1108 px desde el borde de arriba de la sección (bajan 256 dentro de
            "Misión y visión" a 1440, sin pisar texto) y saliendo 280 por el borde derecho de la página. Entre lg y xl salen
            48 px más (328): la columna de Gobierno se angosta y, con 280, de 1024 a ~1050 px una piedra tocaba el final de
            "Comunicación y difusión provincial" (medido con los trazos contra los renglones). La lista de las partes va
            posicionada (relative) y después en el HTML: así, si los renglones se corren (con el espaciado de texto de
            WCAG 1.4.12, de 1024 a 1366, MUS-01 de la verificación de El Museo) y una piedra los cruza, pasa por detrás
            de las letras y no por encima. */}
        <div aria-hidden="true" className={PIEDRITAS}>
          <img
            src={cogestion.piedritas}
            alt=""
            width={617}
            height={606}
            loading="lazy"
            fetchPriority="low"
            className="patron-b absolute top-[31.375rem] right-[-20.5rem] w-[38.58rem] max-w-none xl:right-[-17.5rem]"
          />
        </div>
        <ul className={PARTES}>
          {cogestion.partes.map((parte) => (
            <li key={parte.rotulo} className={PARTE}>
              <div className="flex flex-col gap-4">
                <h3 className={ROTULO_TARJETA}>{parte.rotulo}</h3>
                <img
                  src={parte.institucion.logo}
                  alt={parte.institucion.nombre}
                  width={parte.institucion.ancho}
                  height={parte.institucion.alto}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  data-logo-blanco=""
                  className={LOGO}
                />
              </div>
              <p className={TEXTO_TARJETA}>{parte.intro}</p>
              <ul className={LISTA}>
                {parte.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion id="el-museo-mision" titulo={mision.titulo} className={SECCION}>
        <div className={MISION}>
          {mision.items.map((item) => (
            <div key={item.rotulo} className={COLUMNA_MISION}>
              <h3 className={ROTULO_SECCION}>{item.rotulo}</h3>
              <p className={PARRAFO_GRANDE}>{item.texto}</p>
            </div>
          ))}
        </div>
        <div className={VALORES}>
          <h3 className={TITULO_SUBSECCION}>{mision.valores.titulo}</h3>
          <ul className="mt-8 flex flex-wrap gap-4">
            {mision.valores.lista.map((valor) => (
              <li key={valor} className={PILDORA}>
                {valor}
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      <Documentales />

      <section aria-labelledby="el-museo-numeros" className={SECCION}>
        <div className={CONTENEDOR_TABLERO}>
          <h2 id="el-museo-numeros" className={TITULO_CENTRADO}>
            {numeros.titulo}
          </h2>
          <dl className={CIFRAS}>
            {numeros.cifras.map((c) => (
              <div key={c.rotulo} className={COLUMNA_CIFRA}>
                <dt className={ETIQUETA_CIFRA}>{c.rotulo}</dt>
                <dd className={CIFRA}>{c.cifra}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Seccion
        id="el-museo-autoridades"
        rotulo={autoridades.rotulo}
        titulo={autoridades.titulo}
        cerca
        className={SECCION}
      >
        <ul className={AUTORIDADES}>
          {autoridades.personas.map((persona) => (
            <li key={persona.nombre} className={FICHA_AUTORIDAD}>
              <Retrato persona={persona} />
              <div>
                <p className={ROTULO_TARJETA}>{persona.cargo}</p>
                <h3 className={NOMBRE_AUTORIDAD}>{persona.nombre}</h3>
              </div>
              <p className={BIO}>{persona.bio}</p>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* El equipo, escrito a mano (el mismo HTML que arma Seccion con cerca): Seccion no centra el encabezado. */}
      <section aria-labelledby="el-museo-equipo" className={SECCION_ULTIMA}>
        <div className={CONTENEDOR_TABLERO}>
          <p className={ROTULO_EQUIPO}>{equipo.rotulo}</p>
          <h2 id="el-museo-equipo" className={TITULO_EQUIPO}>
            {equipo.titulo}
          </h2>
          <p className={PARRAFO_EQUIPO}>{equipo.parrafo}</p>
          <ul className={EQUIPO}>
            {equipo.personas.map((persona, i) => (
              <li key={i} className={INTEGRANTE}>
                <Retrato persona={persona} />
                <div>
                  <p className={NOMBRE_INTEGRANTE}>{persona.nombre}</p>
                  <p className={ROL_INTEGRANTE}>{persona.rol}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
ElMuseo.sobreFoto = true
