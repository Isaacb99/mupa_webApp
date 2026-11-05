import CarruselNovedades from '../components/CarruselNovedades.jsx'
import GaleriaHome from '../components/GaleriaHome.jsx'
import HeroHome from '../components/HeroHome.jsx'
import MapaMuseo from '../components/MapaMuseo.jsx'
import { home } from '../content.js'
import { seccionDe } from '../components/navegacion.js'

// La Home: desde el 02/11/2026, la portada del tablero "Web" de la diseñadora (Figma 2627:1165; decisión D1 del
// desarrollador: reemplaza a la landing en master, y la landing publicada sigue en la rama landing). Solo escritorio
// (D2): fiel a 1440, fluida entre lg y 1440 y centrada más allá; debajo de lg, en una columna y sin pulir.
// Va dentro de Layout (src/Raiz.jsx: el header, el <main id="main">, el pie y Lenis); acá, sus secciones:
// - HeroHome: la foto, el h1 (el único de la página), la bajada y la franja de accesos (Visitas, la compra externa).
// - CarruselNovedades: las últimas novedades publicadas (estado.datos.novedades, server/paginas.js: cargarHome). Sin
//   novedades, o si la base no respondió, la sección no se dibuja (la Home sale igual: nunca la 503).
// - GaleriaHome: "El MuPa en imágenes" (el carrusel de fotos de siempre, Collage.jsx, con el título y las piedritas;
//   sin Novedades va pegada al hero y la piedrita de arriba no sube por encima de su sección).
// - MapaMuseo: el plano.
// Las secciones de la landing (Intro, Identidad, ObraHistorica, Areas y sus hooks) quedan en src/components sin
// importarse: se decide al cierre si se borran.

/** @param {{ estado: { museo?: { compra?: object | null } | null, datos?: { novedades?: object[] } } }} props */
export default function Home({ estado }) {
  const compra = estado?.museo?.compra ?? null
  const novedades = Array.isArray(estado?.datos?.novedades) ? estado.datos.novedades : []
  const todas = seccionDe('novedades')
  const { titulo, bajada, verTodas } = home.novedades
  return (
    <>
      <HeroHome compra={compra} />
      {novedades.length > 0 ? (
        <CarruselNovedades
          id="novedades-titulo"
          titulo={titulo}
          bajada={bajada}
          verTodas={todas ? { texto: verTodas, url: todas.ruta } : null}
          tarjetas={novedades}
        />
      ) : null}
      <GaleriaHome pegadaAlHero={novedades.length === 0} />
      <MapaMuseo />
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Home.sobreFoto = true
