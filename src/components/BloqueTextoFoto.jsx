import { FlechaCirculo } from './IconosRecursos.jsx'
import {
  CLASES_TEXTO_TABLERO,
  CONTENEDOR_TABLERO,
  ENLACE_FLECHA,
  PARRAFO_SECUNDARIO,
  PARRAFO_TABLERO,
  ROTULO_SECCION,
  SECCION_TABLERO,
  TITULO_SECCION,
  TITULO_SUBSECCION,
} from './tablero.js'

// El bloque de texto y foto del tablero "Web" de la diseñadora: los cuatro de Divulgación (Figma 2857:5549, 3010:6869,
// 3010:6912 y 3010:6938, 06/11/2026; decisión DV1 del desarrollador), "Visitas Escolares" de Educación (Figma 2851:77,
// desde el mismo día: el bloque de Divulgación se copió de esta sección) y cada circuito de Circuitos (Figma 2860:5982 y
// 2996:5345, desde el mismo día; los dos nodos se llaman "Visitas Escolares Section": son copias del de Educación).
// Medidas a 1440 (el relevamiento de Divulgación, tools/salida/e6-divulgacion/prep/figma.md, y el anexo de su spec.md):
// - La sección: 80 arriba y abajo y 1280 de contenido (SECCION_TABLERO y CONTENEDOR_TABLERO: quedan 160 entre un bloque
//   y el siguiente). El rótulo en Roboto Mono Medium 14/20 en mayúsculas (ROTULO_SECCION) y, 24 abajo, el h2 Thin 64
//   (TITULO_SECCION), con su corte en el texto ("\n": "Investigaciones recientes\ndel equipo MuPa - UNSJ"). Es lo mismo
//   que dibuja Seccion.jsx, con el corte de renglón: va escrito acá para no tocar Seccion.jsx.
// - 48 abajo, dos columnas de 600 con 80 entre sí (como "Museo accesible" de Visitas; entre lg y 1440, la mitad del
//   contenido menos 40 cada una):
//   - a la izquierda, el texto, con 24 entre sus partes: los párrafos (Regular 18/30, PARRAFO_TABLERO; la nota en gris,
//     PARRAFO_SECUNDARIO; un "\n" del texto es un corte de renglón), la lista (cada ítem Regular 16/24 con la viñeta de
//     6 px de CLASES_TEXTO_TABLERO, 12 entre ítems), las acciones y el enlace;
//   - las acciones (los cuatro "botones" del laboratorio): Roboto Mono Regular 16/28,8 en blanco con el
//     arrow-right-circle de 24 a 8, con 24 entre sí. No tienen destino en el archivo: van con el mismo aspecto, pero
//     como texto (una lista, sin <a>, sin foco ni cursor de mano, con el ícono aria-hidden) hasta que el museo diga
//     adónde llevan (DV9: ningún control sin destino);
//   - el enlace ("Coordinar visita"): el mismo aspecto, con su destino (ENLACE_FLECHA: 44 de alto para el dedo, con
//     -my-2 para que ocupe en el renglón lo que el tablero, 29). Sin destino, como texto (DV9);
//   - el apartado (opcional, prop apartado; "Conexión MuPa" de Valle de la Luna en Circuitos, Figma 2996:5342 y
//     2996:5344), después del enlace: un h3 Thin 40/52 (TITULO_SUBSECCION) y, 24 abajo, su párrafo (PARRAFO_TABLERO).
//     Sin apartado, el HTML es el de antes (Divulgación y Educación);
//   - a la derecha, la foto de 600x420 (10:7) con esquinas de 16, object-cover, lazy y con prioridad baja (no es del
//     primer pantallazo); sizes, el de "Museo accesible".
// - Debajo de lg no hay diseño (D2): una columna, el texto y después la foto.
// Lo que no viene (sin lista, sin acciones, sin enlace, sin apartado) no se dibuja. Encabezados: el h2 del bloque,
// debajo del h1 del hero de la página, y el h3 del apartado. La foto no se estira al alto de la columna de texto si
// esta es más alta (Valle de la Luna): es un <img> con su proporción, y en la grilla queda arriba.

const TITULO = `${TITULO_SECCION} mt-6 whitespace-pre-line`
const COLUMNA_TEXTO = 'flex min-w-0 flex-col gap-6 whitespace-pre-line'
const LISTA = `${CLASES_TEXTO_TABLERO.ul} flex flex-col gap-3 text-base leading-6 font-normal text-paper text-pretty`
const ACCIONES = 'flex flex-col gap-6'
const ACCION = 'flex items-center gap-2 font-mono text-base leading-[1.8] text-blanco'
const ENLACE = `${ENLACE_FLECHA} -my-2 self-start`
const FOTO = 'block aspect-[10/7] h-auto w-full rounded-2xl object-cover'

/**
 * @param {{ id: string, rotulo?: string | null, titulo: string,
 *   parrafos?: { texto: string, secundario?: boolean }[], lista?: string[], acciones?: string[],
 *   enlace?: { texto: string, url?: string | null } | null,
 *   apartado?: { titulo: string, parrafos: { texto: string }[] } | null,
 *   imagen: { src: string, srcSet?: string, sizes?: string, ancho: number, alto: number, alt: string } }} props
 *   id: el del h2 (lo nombra la sección con aria-labelledby); acciones: textos con la flecha, sin destino (DV9);
 *   enlace.url: sin ella, el enlace va como texto; apartado: un h3 con sus párrafos, después del enlace
 */
export default function BloqueTextoFoto({
  id,
  rotulo = null,
  titulo,
  parrafos = [],
  lista = [],
  acciones = [],
  enlace = null,
  apartado = null,
  imagen,
}) {
  return (
    <section aria-labelledby={id} className={SECCION_TABLERO}>
      <div className={CONTENEDOR_TABLERO}>
        {rotulo ? <p className={ROTULO_SECCION}>{rotulo}</p> : null}
        <h2 id={id} className={rotulo ? TITULO : TITULO_SECCION}>
          {titulo}
        </h2>
        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-x-20">
          <div className={COLUMNA_TEXTO}>
            {parrafos.map((parrafo, i) => (
              <p key={i} className={parrafo.secundario ? PARRAFO_SECUNDARIO : PARRAFO_TABLERO}>
                {parrafo.texto}
              </p>
            ))}
            {lista.length > 0 ? (
              <ul className={LISTA}>
                {lista.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {acciones.length > 0 ? (
              <ul className={ACCIONES}>
                {acciones.map((accion) => (
                  <li key={accion} className={ACCION}>
                    {accion}
                    <FlechaCirculo />
                  </li>
                ))}
              </ul>
            ) : null}
            {enlace ? (
              enlace.url ? (
                <a href={enlace.url} className={ENLACE}>
                  {enlace.texto}
                  <FlechaCirculo />
                </a>
              ) : (
                <p className={ACCION}>
                  {enlace.texto}
                  <FlechaCirculo />
                </p>
              )
            ) : null}
            {apartado ? (
              <>
                <h3 className={TITULO_SUBSECCION}>{apartado.titulo}</h3>
                {apartado.parrafos.map((parrafo, i) => (
                  <p key={i} className={PARRAFO_TABLERO}>
                    {parrafo.texto}
                  </p>
                ))}
              </>
            ) : null}
          </div>
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
            className={FOTO}
          />
        </div>
      </div>
    </section>
  )
}
