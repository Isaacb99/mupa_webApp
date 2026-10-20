import Hero from '../components/Hero.jsx'
import Intro from '../components/Intro.jsx'
import Collage from '../components/Collage.jsx'
import Identidad from '../components/Identidad.jsx'
import ObraHistorica from '../components/ObraHistorica.jsx'
import Areas from '../components/Areas.jsx'
import { identidad } from '../content.js'

// La Home (hasta E0.4, src/App.jsx). Va dentro de Layout (src/Raiz.jsx), que desde E4.1 se lleva el header, el
// <main id="main">, el pie y Lenis: acá quedan solo las secciones, iguales que antes. Recibe el estado de la página pero
// no usa nada de él: sus textos están en src/content.js.
export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      {/* Carrusel de fotos del V04 (28/09/2026): entre la intro e Identidad (hasta entonces el collage iba dentro de
          Identidad, después de los ejes). Trae su propio bloque enganchado. */}
      <Collage fotos={identidad.collage} />
      <Identidad />
      <ObraHistorica />
      <Areas />
    </>
  )
}
