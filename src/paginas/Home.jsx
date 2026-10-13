import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Intro from '../components/Intro.jsx'
import Collage from '../components/Collage.jsx'
import Identidad from '../components/Identidad.jsx'
import ObraHistorica from '../components/ObraHistorica.jsx'
import Areas from '../components/Areas.jsx'
import Footer from '../components/Footer.jsx'
import { identidad } from '../content.js'
import useScrollSuave from '../hooks/useScrollSuave.js'

// La Home (hasta E0.4, src/App.jsx). Recibe el estado de la página (src/Raiz.jsx) pero todavía no usa nada de él:
// sus textos están en src/content.js. Con E4.1 pasa a ir dentro de Layout, que se lleva el header, el pie y Lenis.
export default function Home() {
  useScrollSuave()

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Intro />
        {/* Carrusel de fotos del V04 (28/09/2026): entre la intro e Identidad (hasta entonces el collage iba dentro de
            Identidad, después de los ejes). Trae su propio bloque enganchado. */}
        <Collage fotos={identidad.collage} />
        <Identidad />
        <ObraHistorica />
        <Areas />
      </main>
      <Footer />
    </>
  )
}
