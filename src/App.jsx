import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Intro from './components/Intro.jsx'
import Identidad from './components/Identidad.jsx'
import ObraHistorica from './components/ObraHistorica.jsx'
import Areas from './components/Areas.jsx'
import Footer from './components/Footer.jsx'
import useScrollSuave from './hooks/useScrollSuave.js'

export default function App() {
  useScrollSuave()

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Intro />
        <Identidad />
        <ObraHistorica />
        <Areas />
      </main>
      <Footer />
    </>
  )
}
