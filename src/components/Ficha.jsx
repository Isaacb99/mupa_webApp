import Foto from './Foto.jsx'
import GaleriaFotos from './GaleriaFotos.jsx'
import Seccion from './Seccion.jsx'
import TextoRico from './TextoRico.jsx'
import { CLASES_TEXTO, CONTENEDOR, ENLACE_SUELTO, PARRAFO, ROTULO, TEXTO, TITULO_PAGINA } from './estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las fichas (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// La página de un contenido (una muestra, una novedad): el enlace a su sección, la etiqueta ("Actual", "Realizada"),
// el título (el único h1), los datos propios de cada una (children: las fechas y la sala, o cuándo, dónde y la
// inscripción), el resumen, la portada (la única foto que no es lazy: la más probable del primer pantallazo), el texto
// con formato (sus subtítulos en h2, debajo del h1) y la galería. Lo que no está no se dibuja.
// La portada no pasa de ALTO_PORTADA (75 % de la pantalla): su sizes lo tiene en cuenta (tamanoPortada), así una
// portada vertical no baja el archivo de 1600 para dibujarse en 340 px (PAG-03 de la verificación de E4).

/** El alto máximo de la portada, en % del alto de la pantalla. */
const ALTO_PORTADA = 75

/**
 * El sizes de la portada: el ancho de la columna (72rem desde 80rem de pantalla; si no, la pantalla) o, si es menos,
 * el que le deja el tope de alto con su proporción. En vh y no en svh (el vh es el mayor: si acaso pide un archivo un
 * poco más grande). Un navegador que no entienda min() en sizes usa 100vw, como antes.
 * @param {{ ancho: number, alto: number }} foto
 */
export function tamanoPortada({ ancho, alto }) {
  if (!(ancho > 0 && alto > 0)) return '(min-width: 80rem) 72rem, 100vw'
  const porAlto = `${Math.round((ALTO_PORTADA * ancho * 100) / alto) / 100}vh`
  return `(min-width: 80rem) min(72rem, ${porAlto}), min(100vw, ${porAlto})`
}

/**
 * @param {{ volver: { url: string, texto: string }, etiqueta?: string | null, titulo: string,
 *   resumen?: string | null, portada?: object | null, texto?: object | null, galeria?: object[],
 *   children?: import('react').ReactNode }} props
 */
export default function Ficha({ volver, etiqueta, titulo, resumen, portada, texto, galeria, children }) {
  return (
    <article className={CONTENEDOR}>
      <p>
        <a href={volver.url} className={`${ROTULO} ${ENLACE_SUELTO}`}>
          {volver.texto}
        </a>
      </p>
      <header className="mt-10">
        {etiqueta ? <p className={ROTULO}>{etiqueta}</p> : null}
        <h1 className={`${TITULO_PAGINA} ${etiqueta ? 'mt-3' : ''}`}>{titulo}</h1>
        {children}
      </header>
      {resumen ? <p className={`${PARRAFO} mt-8`}>{resumen}</p> : null}
      {portada ? (
        <div className="mt-10">
          <Foto
            foto={portada}
            prioridad
            conPie
            sizes={tamanoPortada(portada)}
            altoMaximo={`${ALTO_PORTADA}svh`}
            className="h-auto rounded-[0.625rem]"
          />
        </div>
      ) : null}
      {texto ? (
        <div className={`${TEXTO} mt-10`}>
          <TextoRico texto={texto} nivelSubtitulo={2} clases={CLASES_TEXTO} />
        </div>
      ) : null}
      {galeria?.length > 0 ? (
        <Seccion id="fotos" titulo={paginas.fotos} className="mt-16">
          <GaleriaFotos fotos={galeria} />
        </Seccion>
      ) : null}
    </article>
  )
}
