import BloqueTextoFoto from '../components/BloqueTextoFoto.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { seccionDe } from '../components/navegacion.js'
import { circuitos } from '../content.js'

// /circuitos: la página del tablero "Web" de la diseñadora (Figma 2860:5827, 06/11/2026; decisiones IN1 a IN10 del
// desarrollador). Solo escritorio (D2): fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá;
// debajo de lg, en una columna y sin pulir. Va dentro de Layout (el header absolute encima de la foto, el <main>, el
// pie): acá, la página COMPLETA, como el tablero (IN1), con el relleno marcado en src/content.js ("RELLENO DEL
// TABLERO:", IN4):
// - El hero (HeroPagina.jsx con la bajada en dos renglones de 32/40, bajadaJusta): el h1 "Circuitos / paleontológicos"
//   sobre el esqueleto del carnívoro con los técnicos (la foto del tablero, de campo, no alcanza: R-D).
// - Un BloqueTextoFoto por circuito (circuitos.destinos de src/content.js: filas, IN3), con el rótulo "Circuitos
//   paleontológicos", el h2 con el nombre, el párrafo, la lista (Valle de la Luna), "Coordinar visita" (a Contacto: IN2)
//   y, en Valle de la Luna, "Conexión MuPa" (el apartado: un h3 y su párrafo, después del enlace). El id de cada h2,
//   circuito-<slug>, es también el ancla (/circuitos#circuito-valle-de-la-luna): el header es absolute, no hace falta
//   scroll-mt.
// - Las fotos de los circuitos, lazy y con prioridad baja; la del hero es el LCP.
// - Encabezados: el h1 del hero, un h2 por circuito y el h3 de "Conexión MuPa".
// - No lee la base (server/paginas.js, cargarFija): sale igual con la base caída. La analítica: solo page_view (y
//   clic_entradas desde el menú: D14, IN8).

const { hero, rotulo, destinos } = circuitos

export default function Circuitos() {
  return (
    <>
      <HeroPagina id="circuitos-titulo" titulo={hero.titulo} bajada={hero.bajada} bajadaJusta imagen={hero.imagen} />
      {destinos.map(({ slug, nombre, enlace, ...destino }) => (
        <BloqueTextoFoto
          key={slug}
          id={'circuito-' + slug}
          rotulo={rotulo}
          titulo={nombre}
          {...destino}
          enlace={enlace ? { texto: enlace.texto, url: seccionDe(enlace.pagina)?.ruta ?? null } : null}
        />
      ))}
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Circuitos.sobreFoto = true
