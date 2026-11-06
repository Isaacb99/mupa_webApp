import Foto from '../components/Foto.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { FlechaDerecha } from '../components/Iconos.jsx'
import Seccion, { SeccionDeTarjetas } from '../components/Seccion.jsx'
import TextoRico from '../components/TextoRico.jsx'
import {
  CLASES_TEXTO_TABLERO,
  ENLACE_FLECHA,
  PARRAFO_TABLERO,
  ROTULO_TARJETA,
  TEXTO_TABLERO,
  TITULO_SUBSECCION,
} from '../components/tablero.js'
import { paginas } from '../content.js'

// /exposiciones (E4.2, plan 6.1): las muestras publicadas que se pueden ver o están por llegar (actuales, próximas y
// permanentes), en el orden del panel, cada una con su situación ("Actual", "Próxima", "Permanente") y su período; y
// las salas publicadas, en su orden, cada una como sección con el ancla #sala-<slug> (la dirección pública de una sala:
// compartido/contenidos.js, urlPublica; la usa "Ver en el sitio" del panel), con su resumen, su descripción, su
// portada y las muestras que tiene. Las finalizadas no se listan (su página sigue). Una sección sin contenido no se
// dibuja. Los datos, de server/paginas.js.
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R1 a R7 del desarrollador, 04/11/2026; el tablero no
// dibuja esta página), como Visitas:
// - El hero de las páginas internas (HeroPagina.jsx) con su foto (paginas.exposiciones.imagen de content.js) y el h1;
//   la página se declara sobreFoto.
// - "Muestras": el rótulo (el título de la página) y el h2, y la grilla de tarjetas (Seccion.jsx y Tarjeta.jsx).
// - "Salas": el rótulo y el h2, y cada sala como el bloque de texto y foto del tablero (dos columnas de 600 con 80
//   entre sí a 1440; una debajo de lg), con 80 entre una sala y otra: a la izquierda el nombre (h3, Thin 40/52:
//   TITULO_SUBSECCION), el resumen (Regular 18/30), la descripción (CLASES_TEXTO_TABLERO, con sus subtítulos en h4, un
//   nivel más chicos: CLASES_DESCRIPCION) y "En esta sala" (h4 con el rótulo de una tarjeta) con las muestras como
//   enlaces con flecha (la flecha pegada al final del título: EnlaceMuestra); a la derecha la portada entera, en su
//   proporción, con esquinas de 16 y su epígrafe y su crédito, y con el tope de alto de la de una ficha (75 % de la
//   pantalla: una vertical no pasa de una pantalla). Sin portada, el texto queda en su columna. El bloque del tablero
//   recorta la foto a 600x420: acá va entera (es la que eligió el museo; desvío a confirmar con la diseñadora).
// - El ancla de cada sala deja arriba el aire de una sección (scroll-mt: 64, y 80 desde lg), así al llegar desde "Ver
//   en el sitio" del panel o desde "Sala" de una muestra su nombre no queda pegado al borde de la pantalla (PAN-01 de
//   la verificación del rediseño, 05/11/2026; el header no es fijo).
const t = paginas.exposiciones

/** El alto máximo de la portada de una sala, en % del alto de la pantalla: el de la portada de una ficha (Ficha.jsx). */
const ALTO_SALA = 75

/**
 * El sizes de la portada de una sala, para el srcset: el ancho de su columna (la mitad del contenido desde lg, 600 a
 * 1440; todo el contenido debajo) o, si es menos, el que le deja el tope de alto con su proporción (como tamanoPortada
 * de Ficha.jsx: en vh y no en svh, el vh es el mayor). Hasta la corrección del rediseño (EST-02 de su verificación,
 * 05/11/2026) la portada no tenía tope: una vertical de 1680x4000 medía 600x1429 a 1440x900.
 * @param {{ ancho: number, alto: number }} foto
 */
export function tamanoSala({ ancho, alto }) {
  if (!(ancho > 0 && alto > 0)) {
    return (
      '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), (min-width: 48rem) calc(100vw - 5rem), ' +
      'calc(100vw - 3rem)'
    )
  }
  const porAlto = `${Math.round((ALTO_SALA * ancho * 100) / alto) / 100}vh`
  return (
    `(min-width: 90rem) min(600px, ${porAlto}), (min-width: 64rem) min(calc((100vw - 15rem) / 2), ${porAlto}), ` +
    `(min-width: 48rem) min(calc(100vw - 5rem), ${porAlto}), min(calc(100vw - 3rem), ${porAlto})`
  )
}

/**
 * El texto con formato de la descripción de una sala: el del tablero (CLASES_TEXTO_TABLERO) con los subtítulos un
 * nivel más chicos, Medium 20/28 (el título de una tarjeta de los documentales del tablero): el nombre de la sala ya es
 * el subtítulo Thin 40/52 del tablero (h3) y los de su descripción van debajo (h4). Desvío a confirmar con la
 * diseñadora.
 */
const CLASES_DESCRIPCION = { ...CLASES_TEXTO_TABLERO, h: 'pt-2 text-xl leading-7 font-medium' }

/** Lo más largo que puede ser la última palabra de un título para ir entera pegada a la flecha (sin cortarse). */
const PEGADA_MAX = 24
/** De una última palabra más larga, solo sus últimas letras van pegadas a la flecha. */
const COLA = 10

/**
 * Una muestra de "En esta sala": un enlace con flecha (ENLACE_FLECHA, 44 de alto) con la flecha al final del texto,
 * pegada a la última palabra (whitespace-nowrap), y no al costado del bloque: como un elemento más del flex, con un
 * título de varios renglones quedaba a la derecha del renglón más largo y en el medio del alto (PAN-02 de la
 * verificación del rediseño, 05/11/2026). De una última palabra de más de PEGADA_MAX caracteres (sin cortes no entraría
 * en el celular) se pegan a la flecha solo sus últimas COLA letras: el resto se parte si no entra, como siempre. El
 * texto del enlace es el título, igual: la última palabra va en dos trozos de texto seguidos, sin espacio entre ellos.
 * 7,6 arriba y abajo (py): de un renglón mide 44, como siempre, y con varios renglones queda el mismo aire (15) entre
 * una muestra y la siguiente (sin él, el título de varios renglones quedaba pegado al de abajo).
 * @param {{ titulo: string, url: string }} props
 */
function EnlaceMuestra({ titulo, url }) {
  const ultima = titulo.slice(titulo.lastIndexOf(' ') + 1)
  const pegada = ultima.length <= PEGADA_MAX ? ultima : ultima.slice(-COLA)
  // La flecha en el renglón: inline-block (el preflight de Tailwind pone los svg en block), 8 a la izquierda (el gap de
  // ENLACE_FLECHA) y bajada 0,25 em, así queda centrada en el renglón de 28,8 como en el resto de los enlaces con flecha.
  return (
    <a href={url} className={`${ENLACE_FLECHA} max-w-full py-[0.475rem]`}>
      <span className="min-w-0 wrap-anywhere">
        {titulo.slice(0, titulo.length - pegada.length)}
        <span className="whitespace-nowrap">
          {pegada}
          <FlechaDerecha className="ml-2 inline-block size-5 align-[-0.25em]" />
        </span>
      </span>
    </a>
  )
}

/** Una sala: su sección con el ancla, el texto a la izquierda y la portada a la derecha desde lg. */
function Sala({ sala: s }) {
  return (
    <section
      id={s.ancla}
      aria-labelledby={`${s.ancla}-titulo`}
      className="grid scroll-mt-16 gap-8 lg:scroll-mt-20 lg:grid-cols-2 lg:gap-x-20"
    >
      <div className="min-w-0">
        <h3 id={`${s.ancla}-titulo`} className={TITULO_SUBSECCION}>
          {s.nombre}
        </h3>
        {s.resumen ? <p className={`${PARRAFO_TABLERO} mt-6`}>{s.resumen}</p> : null}
        {s.descripcion ? (
          <div className={`${TEXTO_TABLERO} mt-6`}>
            <TextoRico texto={s.descripcion} nivelSubtitulo={4} clases={CLASES_DESCRIPCION} />
          </div>
        ) : null}
        {s.muestras.length > 0 ? (
          <>
            <h4 className={`${ROTULO_TARJETA} mt-10`}>{t.enLaSala}</h4>
            <ul className="mt-3 flex flex-col">
              {s.muestras.map((m) => (
                <li key={m.url} className="min-w-0">
                  <EnlaceMuestra titulo={m.titulo} url={m.url} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {s.portada ? (
        <Foto
          foto={s.portada}
          conPie
          sizes={tamanoSala(s.portada)}
          altoMaximo={`${ALTO_SALA}svh`}
          className="h-auto rounded-2xl"
        />
      ) : null}
    </section>
  )
}

/** @param {{ estado: { datos: { muestras?: object[], salas?: object[] } } }} props */
export default function Exposiciones({ estado }) {
  const { muestras = [], salas = [] } = estado.datos ?? {}
  return (
    <>
      <HeroPagina id="exposiciones-titulo" titulo={t.titulo} imagen={t.imagen} />
      {muestras.length > 0 ? <SeccionDeTarjetas id="muestras" rotulo={t.titulo} titulo={t.muestras} tarjetas={muestras} /> : null}
      {salas.length > 0 ? (
        <Seccion id="salas" rotulo={t.titulo} titulo={t.salas}>
          <div className="mt-12 flex flex-col gap-20">
            {salas.map((s) => (
              <Sala key={s.ancla} sala={s} />
            ))}
          </div>
        </Seccion>
      ) : null}
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Exposiciones.sobreFoto = true
