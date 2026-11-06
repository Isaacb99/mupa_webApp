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

// /el-museo: la página del tablero "Web" de la diseñadora (Figma 2823:10228, 06/11/2026; decisiones IN1 a IN10 del
// desarrollador). Solo escritorio (D2): fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá;
// debajo de lg, en una columna y sin pulir. Va dentro de Layout (el header absolute encima de la foto, el <main>, el
// pie): acá, la página COMPLETA, como el tablero (IN1), con el relleno marcado en src/content.js (elMuseo, "RELLENO DEL
// TABLERO:", IN4). De arriba abajo:
// - El hero (HeroPagina.jsx, sin bajada): el h1 "Acerca del MuPa" (el menú dice "El Museo") sobre las torres del frente
//   contra el cielo (la foto del tablero es la de Contacto: IN6).
// - "El MuPa": los dos párrafos y la foto del patio en 5:3 (la grilla de "Museo accesible" de Visitas), con las
//   piedritas de "El MuPa en imágenes" de la Home (patron-galeria.svg), que suben 96 px sobre la foto del hero, como en
//   el tablero.
// - "Cómo nos organizamos": las dos partes de la cogestión (una lista; cada una con su rótulo en h3, el logo de la
//   institución, la introducción en gris y la lista), en columnas de 502 y 738 a 1440, con las piedritas del cierre de
//   Identidad de la landing (patron-b.svg con su desvanecido), que bajan 256 px dentro de "Misión y visión".
// - "Misión y visión": Misión y Visión (h3, el rótulo del tablero) en dos columnas y "Valores" (h3) con siete píldoras:
//   una lista, no controles (IN2).
// - "Haciendo el MuPa": tres documentales en una fila (a 1440 entran los tres: sin las flechas ni el "1/3" del tablero,
//   que no harían nada, IN2); el "play" es un decorado (aria-hidden). Con url en la fila, el título es el enlace,
//   estirado sobre la tarjeta (ENLACE_TARJETA, como las de Novedades).
// - "El MuPa en números": el h2 centrado (escrita a mano, como "El MuPa en imágenes": Seccion no lo centra) y un <dl>
//   de cuatro columnas con una línea entre ellas; la cifra arriba (order-first: en el HTML va después de su etiqueta,
//   así el lector dice "Piezas fósiles, …"), con la letra del h1 de los hero sin la sombra.
// - "Autoridades" y "Nuestro equipo": las personas sin retrato (IN5: el recuadro de 120 en bg-caja, aria-hidden); con
//   foto en la fila, el <img> con su nombre de alt.
// Las secciones llevan 120 arriba y abajo (el tablero de esta página; las demás, 80: SECCION_TABLERO) y 16 entre el
// rótulo y el h2 (Seccion con cerca), salvo "El MuPa" (24). Encabezados: el h1 del hero, un h2 por sección y h3 en las
// partes de la cogestión, Misión, Visión, Valores, los documentales y las autoridades. Todas las fotos, menos la del
// hero (el LCP), lazy y con prioridad baja. No lee la base (server/paginas.js, cargarFija): sale igual con la base caída.
// La analítica: solo page_view (y clic_entradas desde el menú: D14, IN8).

/** El aire de las secciones de esta página: 120 arriba y abajo a 1440 (debajo de lg, el de las demás). */
const SECCION = 'py-16 lg:py-30'
/** Las secciones con piedritas: posicionadas (las piedritas cuelgan de ellas) y sin scroll horizontal (clip, no hidden). */
const SECCION_CON_PIEDRITAS = 'relative overflow-x-clip py-16 lg:py-30'
/** El envoltorio de las piedritas: a lo ancho de la página, sin alto, solo desde lg (debajo no hay diseño: D2). */
const PIEDRITAS = 'pointer-events-none absolute inset-x-0 top-0 hidden h-0 lg:block'
/** Dos columnas de 600 con 80 entre sí a 1440 (las de "Museo accesible" de Visitas). */
const DOS_COLUMNAS = 'mt-12 grid gap-8 lg:grid-cols-2 lg:gap-x-20'
const COLUMNA_TEXTO = 'flex min-w-0 flex-col gap-6'
const FOTO_PATIO = 'block aspect-[5/3] h-auto w-full rounded-2xl object-cover'
/** La lista de las partes de la cogestión: la de BloqueTextoFoto.jsx (cada ítem 16/24 con la viñeta de 6 px). */
const LISTA = `${CLASES_TEXTO_TABLERO.ul} flex flex-col gap-3 text-base leading-6 font-normal text-paper`
/** Una parte de la cogestión: 40 de padding (como las tarjetas de información de Visitas; 24 a los costados hasta xl). */
const PARTE = 'flex min-w-0 flex-col gap-6 lg:px-6 lg:py-10 xl:px-10'
const LOGO = 'block h-auto max-w-full'
const COLUMNA_MISION = 'flex min-w-0 flex-col gap-6 lg:py-10'
/** Una píldora de Valores: borde crema de 1 px, 44 de alto, Roboto Mono 14/20. No es un control (IN2). */
const PILDORA =
  'rounded-full border border-paper px-[1.4375rem] py-[0.6875rem] font-mono text-sm leading-5 font-normal text-paper'
const BAJADA_SECCION = `${BAJADA} mt-4`
const FOTO_DOCUMENTAL = 'block aspect-[405/280] h-auto w-full rounded-xl object-cover'
/** El círculo del play: 64, negro al 60 %, centrado sobre la foto (decorado). */
const CIRCULO_PLAY =
  'absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ' +
  'bg-[rgb(0_0_0/0.6)] text-paper'
const TITULO_DOCUMENTAL = 'text-xl leading-7 font-medium text-paper wrap-break-word'
const SUBTITULO_DOCUMENTAL = 'text-sm leading-[1.375rem] font-normal text-muted'
const TITULO_CENTRADO = `${TITULO_SECCION} text-center`
/** Cada cifra: 40 arriba y abajo y 24 a los costados desde lg, con la línea de 1 px a la derecha salvo en la última. */
const COLUMNA_CIFRA = 'flex min-w-0 flex-col gap-2 px-2 py-6 text-center lg:px-6 lg:py-10 lg:not-last:border-r lg:border-line'
const ETIQUETA_CIFRA = 'font-mono text-sm leading-5 font-medium text-muted uppercase'
/** La cifra: la letra del h1 de los hero (755 con el ancho en 130 %), 64/72 desde 32rem y 36 debajo, sin sombra. */
const CIFRA =
  'order-first font-hero text-[2.25rem] leading-[1.125] font-[weight:755] [font-stretch:130%] text-paper ' +
  'wrap-break-word min-[32rem]:text-[4rem]'
const FICHA_AUTORIDAD = 'flex min-w-0 flex-col gap-8 lg:py-10'
const NOMBRE_AUTORIDAD = 'mt-2 text-[1.75rem] leading-9 font-medium text-paper wrap-break-word'
const BIO = `${TEXTO_TARJETA} text-pretty`
/** El lugar del retrato (IN5): 120x120 con esquinas de 20; sin foto, el recuadro neutro en el color de la caja. */
const RECUADRO = 'block size-30 shrink-0 rounded-[1.25rem] bg-caja'
const RETRATO = 'block size-30 shrink-0 rounded-[1.25rem] object-cover'
const PARRAFO_EQUIPO = `${PARRAFO_SECUNDARIO} mt-4 max-w-[43.75rem]`
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

export default function ElMuseo() {
  return (
    <>
      <HeroPagina id="el-museo-titulo" titulo={hero.titulo} imagen={hero.imagen} />

      <Seccion
        id="el-museo-presentacion"
        rotulo={presentacion.rotulo}
        titulo={presentacion.titulo}
        className={SECCION_CON_PIEDRITAS}
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
          <FotoLazy imagen={presentacion.imagen} className={FOTO_PATIO} />
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
            "Comunicación y difusión provincial" (medido con los trazos contra los renglones). */}
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
        <ul className="mt-12 grid gap-10 lg:grid-cols-[502fr_738fr]">
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
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-x-20">
          {mision.items.map((item) => (
            <div key={item.rotulo} className={COLUMNA_MISION}>
              <h3 className={ROTULO_SECCION}>{item.rotulo}</h3>
              <p className={PARRAFO_GRANDE}>{item.texto}</p>
            </div>
          ))}
        </div>
        <div className="mt-16">
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

      <Seccion
        id="el-museo-documentales"
        rotulo={documentales.rotulo}
        titulo={documentales.titulo}
        cerca
        className={SECCION}
      >
        <p className={BAJADA_SECCION}>{documentales.bajada}</p>
        <ul className="mt-12 grid gap-8 lg:grid-cols-3">
          {documentales.lista.map((doc, i) => (
            <li key={doc.titulo} className="group relative min-w-0">
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
      </Seccion>

      <section aria-labelledby="el-museo-numeros" className={SECCION}>
        <div className={CONTENEDOR_TABLERO}>
          <h2 id="el-museo-numeros" className={TITULO_CENTRADO}>
            {numeros.titulo}
          </h2>
          <dl className="mt-16 grid grid-cols-2 lg:grid-cols-4">
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
        <ul className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-x-20">
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

      <Seccion id="el-museo-equipo" rotulo={equipo.rotulo} titulo={equipo.titulo} cerca className={SECCION}>
        <p className={PARRAFO_EQUIPO}>{equipo.parrafo}</p>
        <ul className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
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
      </Seccion>
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
ElMuseo.sobreFoto = true
