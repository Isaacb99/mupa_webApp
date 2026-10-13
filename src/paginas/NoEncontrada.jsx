import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { noEncontrada } from '../content.js'

// Página 404 (estado 404 real, la arma server/ssr.js para toda ruta que no está en la tabla). Mínima hasta E4.1, que
// la pone dentro de Layout con el menú y enlaces a las secciones. Sin Lenis ni efectos: es corta.
export default function NoEncontrada() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-sitio px-6 pt-48 pb-32 md:px-10 md:pt-56 lg:pt-72">
        <h1 className="font-display text-[length:clamp(2rem,5vw,4rem)] font-thin leading-tight">{noEncontrada.titulo}</h1>
        <p className="mt-6 text-lg font-light text-muted">{noEncontrada.texto}</p>
        <p className="mt-10">
          <a
            href="/"
            className="text-lg underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            {noEncontrada.volver}
          </a>
        </p>
      </main>
      <Footer />
    </>
  )
}
