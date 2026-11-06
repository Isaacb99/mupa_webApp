import BloqueTextoFoto from '../components/BloqueTextoFoto.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { seccionDe } from '../components/navegacion.js'
import SeccionRecursos from '../components/SeccionRecursos.jsx'
import { educacion } from '../content.js'

// /educacion: la página del tablero "Web" de la diseñadora (Figma 2846:1561, 06/11/2026; decisiones IN1 a IN10 del
// desarrollador). Solo escritorio (D2): fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá;
// debajo de lg, en una columna y sin pulir. Va dentro de Layout (el header absolute encima de la foto, el <main>, el
// pie): acá, la página COMPLETA, como el tablero (IN1), con el relleno marcado en src/content.js ("RELLENO DEL
// TABLERO:", IN4):
// - El hero (HeroPagina.jsx, sin bajada: la nota de contenido la deja vacía): el h1 "Educación" sobre la foto de la
//   restauradora (la del tablero, los chicos, no alcanza: va en "Visitas Escolares").
// - "Visitas Escolares" (BloqueTextoFoto.jsx, Figma 2851:77: el bloque de Divulgación salió de esta sección): el rótulo,
//   el h2, los dos párrafos (el segundo en gris), la lista de niveles, "Coordinar visita" (a Contacto: IN2) y la foto de
//   los chicos de guardapolvo.
// - "Recursos educativos" (SeccionRecursos.jsx, Figma 2851:104: el newsletter de Divulgación con rótulo y el ícono en
//   crema): tres tarjetas con su acción como texto, sin destino (IN2), hasta que el museo pase los enlaces (url, IN3).
// - La foto de la sección, lazy y con prioridad baja; la del hero es el LCP.
// - Encabezados: el h1 del hero, un h2 por sección y un h3 por tarjeta.
// - No lee la base (server/paginas.js, cargarFija): sale igual con la base caída. La analítica: solo page_view (y
//   clic_entradas desde el menú: D14, IN8).

const { hero, escolares, recursos } = educacion

export default function Educacion() {
  const { enlace, ...bloque } = escolares
  return (
    <>
      <HeroPagina id="educacion-titulo" titulo={hero.titulo} imagen={hero.imagen} />
      <BloqueTextoFoto
        {...bloque}
        enlace={enlace ? { texto: enlace.texto, url: seccionDe(enlace.pagina)?.ruta ?? null } : null}
      />
      <SeccionRecursos {...recursos} />
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Educacion.sobreFoto = true
