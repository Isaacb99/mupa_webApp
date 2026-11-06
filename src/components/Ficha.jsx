import Foto from './Foto.jsx'
import GaleriaFotos from './GaleriaFotos.jsx'
import { FlechaIzquierda } from './Iconos.jsx'
import Seccion from './Seccion.jsx'
import TextoRico from './TextoRico.jsx'
import {
  CLASES_TEXTO_TABLERO,
  CONTENEDOR_SIN_FOTO,
  DATO_TARJETA,
  ENLACE_FLECHA,
  PARRAFO_GRANDE,
  ROTULO_SECCION,
  ROTULO_TARJETA,
  TEXTO_TABLERO,
  TITULO_SIN_FOTO,
} from './tablero.js'
import { paginas } from '../content.js'

// La página de un contenido (una muestra, una novedad), con el lenguaje del tablero "Web" de la diseñadora (decisiones
// R2 a R4 del desarrollador, 04/11/2026; el tablero no dibuja estas páginas): sin hero con foto. En el ancho del
// contenido del tablero (1280 a 1440, CONTENEDOR_SIN_FOTO, que deja arriba el lugar del header: la página no se
// declara sobreFoto):
// - el enlace a su sección ("← Exposiciones", con la flecha: ENLACE_FLECHA);
// - 40 debajo, la etiqueta ("Actual", "Realizada": el rótulo del tablero, ROTULO_SECCION) y 24 debajo el título (el
//   único h1: TITULO_SIN_FOTO, el del hero alineado a la izquierda y sin sombra);
// - los datos propios de cada una (children: las fechas, o cuándo, dónde y la inscripción; los que tienen rótulo, la
//   sala de una muestra y los de una actividad, con DatoFicha y, los de una actividad, en DatosFicha, más abajo);
// - el resumen (Regular 20/32: PARRAFO_GRANDE);
// - la portada ENTERA, en su proporción, con esquinas de 16 (la única foto que no es lazy: la más probable del primer
//   pantallazo, la del LCP), con su epígrafe y su crédito (Foto.jsx);
// - el texto con formato (CLASES_TEXTO_TABLERO, en una columna de 42 em: los párrafos del sitio no pasan de ahí; sus
//   subtítulos en h2, debajo del h1);
// - y la galería, en su sección (el rótulo de la sección del sitio y el h2 "Fotos", como en las listas: Seccion.jsx).
// Lo que no está no se dibuja.
// La portada no pasa de ALTO_PORTADA (75 % de la pantalla): su sizes lo tiene en cuenta (tamanoPortada), así una
// portada vertical no baja el archivo de 1600 para dibujarse en 340 px (PAG-03 de la verificación de E4).

/** El alto máximo de la portada, en % del alto de la pantalla. */
const ALTO_PORTADA = 75

/**
 * El sizes de la portada: el ancho del contenido (80rem, 1280, desde 90rem de pantalla; si no, la pantalla: un poco más
 * que el contenido, que en lg deja 80 de cada lado) o, si es menos, el que le deja el tope de alto con su proporción. En
 * vh y no en svh (el vh es el mayor: si acaso pide un archivo un poco más grande). Un navegador que no entienda min()
 * en sizes usa 100vw. Hasta el rediseño (04/11/2026) el contenido medía 72rem desde 80rem de pantalla.
 * @param {{ ancho: number, alto: number }} foto
 */
export function tamanoPortada({ ancho, alto }) {
  if (!(ancho > 0 && alto > 0)) return '(min-width: 90rem) 80rem, 100vw'
  const porAlto = `${Math.round((ALTO_PORTADA * ancho * 100) / alto) / 100}vh`
  return `(min-width: 90rem) min(80rem, ${porAlto}), min(100vw, ${porAlto})`
}

/**
 * Los datos con rótulo de una actividad (cuándo, lugar y costo), en un <dl>: 32 debajo de lo de arriba, en tres
 * columnas desde md (40 entre sí) y en una en el celular (24 entre sí). La sala de una muestra, un dato solo, va con
 * DatoFicha en su <dl> a lo ancho (Muestra.jsx; hasta la corrección del rediseño, EST-06 de su verificación del
 * 05/11/2026, iba en línea, "Sala: …").
 * @param {{ children: import('react').ReactNode }} props
 */
export function DatosFicha({ children }) {
  return <dl className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-3 md:gap-10">{children}</dl>
}

/**
 * Un dato de una ficha, como los de las tarjetas de información de Visitas: el rótulo (el de una tarjeta del tablero,
 * ROTULO_TARJETA) y, 8 debajo, el valor (Regular 18/28 en gris, DATO_TARJETA). min-w-0 y el valor que se parte: un
 * lugar que es una dirección web no ensancha la página (PAG-01 de la verificación de E4). enlace: el valor es un enlace
 * de 44 de alto con el texto de 28 (ENLACE_DATO): sube 8 px, así su texto queda 8 debajo del rótulo, como uno sin enlace
 * (en un renglón; uno de varios renglones mide lo que su texto y queda 8 más arriba, como en las tarjetas de Visitas).
 * @param {{ rotulo: string, enlace?: boolean, children: import('react').ReactNode }} props
 */
export function DatoFicha({ rotulo, enlace = false, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className={ROTULO_TARJETA}>{rotulo}</dt>
      <dd className={enlace ? `${DATO_TARJETA} -mt-2` : DATO_TARJETA}>{children}</dd>
    </div>
  )
}

/**
 * @param {{ volver: { url: string, texto: string }, etiqueta?: string | null, titulo: string,
 *   resumen?: string | null, portada?: object | null, texto?: object | null, galeria?: object[],
 *   children?: import('react').ReactNode }} props
 */
export default function Ficha({ volver, etiqueta, titulo, resumen, portada, texto, galeria, children }) {
  return (
    <article className={CONTENEDOR_SIN_FOTO}>
      <p>
        <a href={volver.url} className={ENLACE_FLECHA}>
          <FlechaIzquierda />
          {volver.texto}
        </a>
      </p>
      <header className="mt-10">
        {etiqueta ? <p className={ROTULO_SECCION}>{etiqueta}</p> : null}
        <h1 className={etiqueta ? `${TITULO_SIN_FOTO} mt-6` : TITULO_SIN_FOTO}>{titulo}</h1>
        {children}
      </header>
      {resumen ? <p className={`${PARRAFO_GRANDE} mt-8`}>{resumen}</p> : null}
      {portada ? (
        <div className="mt-12">
          <Foto
            foto={portada}
            prioridad
            conPie
            sizes={tamanoPortada(portada)}
            altoMaximo={`${ALTO_PORTADA}svh`}
            className="h-auto rounded-2xl"
          />
        </div>
      ) : null}
      {texto ? (
        <div className={`${TEXTO_TABLERO} mt-12 max-w-[42em]`}>
          <TextoRico texto={texto} nivelSubtitulo={2} clases={CLASES_TEXTO_TABLERO} />
        </div>
      ) : null}
      {galeria?.length > 0 ? (
        <Seccion id="fotos" rotulo={volver.texto} titulo={paginas.fotos} contenedor={false} className="mt-16 lg:mt-20">
          <GaleriaFotos fotos={galeria} />
        </Seccion>
      ) : null}
    </article>
  )
}
