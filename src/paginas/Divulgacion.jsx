import BloqueTextoFoto from '../components/BloqueTextoFoto.jsx'
import CarruselNovedades from '../components/CarruselNovedades.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { Descarga, Enlace, FlechaDerecha24, Video } from '../components/IconosRecursos.jsx'
import { seccionDe } from '../components/navegacion.js'
import {
  BAJADA,
  CONTENEDOR_TABLERO,
  ICONO_TARJETA,
  ROTULO_TARJETA,
  SECCION_TABLERO,
  TEXTO_TARJETA,
  TITULO_SECCION,
} from '../components/tablero.js'
import { divulgacion, home } from '../content.js'

// /divulgacion: la página del tablero "Web" de la diseñadora (Figma 2857:5439, 06/11/2026; decisiones DV1 a DV10 del
// desarrollador). Solo escritorio (D2): fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá;
// debajo de lg, en una columna y sin pulir. Va dentro de Layout (el header absolute encima de la foto, el <main>, el
// pie): acá, la página COMPLETA, como el tablero (DV1), con los textos y las fotos del tablero aunque varios sean
// relleno o borrador (marcados en src/content.js con "RELLENO DEL TABLERO:", DV10):
// - El hero (HeroPagina.jsx con bajada, DV4): la foto del restaurador entre los huesos (DV6), el h1 "Investigación y /
//   divulgación científica" y la bajada.
// - "Últimas noticias" (CarruselNovedades.jsx, el de la Home, sin cambios): las mismas 6 últimas novedades publicadas
//   (estado.datos.novedades, server/paginas.js: cargarDivulgacion, DV2). Sin novedades, o si la base no respondió, la
//   sección no se dibuja y la página sale igual (nunca la 503, como la Home: DV3). Lleva el id de la Home,
//   novedades-titulo (los id son por página: así tools/carrusel-check.js anda también acá).
// - Los cuatro bloques de texto y foto (BloqueTextoFoto.jsx): Infraestructura científica, Laboratorio Abierto MuPa,
//   Investigaciones recientes del equipo MuPa - UNSJ y Contenido multimedial.
// - "NEWSLETTER" (Figma 2857:5575): el h2 Thin 64 sin rótulo, 16 abajo la bajada (Regular 18/28 en gris, BAJADA, en un
//   renglón de ~885 px a 1440 como en el tablero: max-w-none le saca el tope de 42em de los párrafos de index.css) y 48
//   abajo tres tarjetas de recursos, como las de información de Visitas: tres columnas de 400 con 40 entre sí y 40 de
//   padding (entre lg y xl, 24 a los costados), sin fondo propio (el del tablero es el de la página). Cada una: el ícono
//   de 24 en naranja en su cuadrado de 48 (ICONO_TARJETA, que lo pone en crema: acá el ícono lleva el naranja, como en
//   el tablero), 24 abajo el rótulo (ROTULO_TARJETA, un h3) y 8 abajo el texto (TEXTO_TARJETA), y 24 abajo el
//   "enlace" (Roboto Mono 14/20 crema con la flecha de 24 a 8). Sin campo ni botón para suscribirse (no hay ninguno en el
//   tablero: no se inventa, DV9), y los "enlaces" no tienen destino: van como texto, sin <a> ni foco (DV9).
// - Las fotos de los bloques, lazy y con prioridad baja; la del hero es el LCP.
// - Encabezados: el h1 del hero, un h2 por sección y un h3 por tarjeta (las de las noticias y las del newsletter).
// - La analítica: solo page_view (y clic_entradas desde el menú: D14, DV8).

const { hero, noticias, bloques, newsletter } = divulgacion

// Los íconos de las tarjetas del newsletter, por la clave de content.js.
const ICONOS = { descarga: Descarga, video: Video, enlace: Enlace }

const ACCION_TARJETA = 'flex items-center gap-2 font-mono text-sm leading-5 font-normal text-paper'

/** @param {{ estado: { datos?: { novedades?: object[] } } }} props */
export default function Divulgacion({ estado }) {
  const novedades = Array.isArray(estado?.datos?.novedades) ? estado.datos.novedades : []
  const todas = seccionDe('novedades')
  return (
    <>
      <HeroPagina id="divulgacion-titulo" titulo={hero.titulo} bajada={hero.bajada} imagen={hero.imagen} />

      {novedades.length > 0 ? (
        <CarruselNovedades
          id="novedades-titulo"
          titulo={noticias.titulo}
          bajada={home.novedades.bajada}
          verTodas={todas ? { texto: home.novedades.verTodas, url: todas.ruta } : null}
          tarjetas={novedades}
        />
      ) : null}

      {bloques.map(({ enlace, ...bloque }) => (
        <BloqueTextoFoto
          key={bloque.id}
          {...bloque}
          enlace={enlace ? { texto: enlace.texto, url: seccionDe(enlace.pagina)?.ruta ?? null } : null}
        />
      ))}

      <section aria-labelledby="divulgacion-newsletter" className={SECCION_TABLERO}>
        <div className={CONTENEDOR_TABLERO}>
          <h2 id="divulgacion-newsletter" className={TITULO_SECCION}>
            {newsletter.titulo}
          </h2>
          <p className={`${BAJADA} mt-4 max-w-none`}>{newsletter.bajada}</p>
          <ul className="mt-12 grid gap-10 lg:grid-cols-3">
            {newsletter.tarjetas.map((tarjeta) => {
              const Icono = ICONOS[tarjeta.icono]
              return (
                <li key={tarjeta.titulo} className="flex min-w-0 flex-col gap-6 lg:px-6 lg:py-10 xl:px-10">
                  <span className={ICONO_TARJETA}>
                    <Icono className="size-6 text-naranja" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className={ROTULO_TARJETA}>{tarjeta.titulo}</h3>
                    <p className={TEXTO_TARJETA}>{tarjeta.texto}</p>
                  </div>
                  <p className={ACCION_TARJETA}>
                    {tarjeta.accion}
                    <FlechaDerecha24 />
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Divulgacion.sobreFoto = true
