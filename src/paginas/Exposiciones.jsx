import Foto from '../components/Foto.jsx'
import Seccion, { SeccionDeTarjetas } from '../components/Seccion.jsx'
import TextoRico from '../components/TextoRico.jsx'
import { CLASES_TEXTO, CONTENEDOR, ENLACE_SUELTO, PARRAFO, ROTULO, TEXTO, TITULO_PAGINA } from '../components/estilos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// /exposiciones (E4.2, plan 6.1): las muestras publicadas que se pueden ver o están por llegar (actuales, próximas y
// permanentes), en el orden del panel, cada una con su situación ("Actual", "Próxima", "Permanente") y su período; y
// las salas publicadas, en su orden, cada una como sección con el ancla #sala-<slug> (la dirección pública de una sala:
// compartido/contenidos.js, urlPublica), con su resumen, su descripción, su portada y las muestras que tiene. Las
// finalizadas no se listan (su página sigue). Una sección sin contenido no se dibuja. Los datos, de server/paginas.js.
const t = paginas.exposiciones

/** Una sala: su sección con el ancla, el texto a la izquierda y la portada a la derecha desde lg. */
function Sala({ sala: s }) {
  return (
    <section
      id={s.ancla}
      aria-labelledby={`${s.ancla}-titulo`}
      className="mt-10 grid gap-8 border-t border-line pt-10 lg:grid-cols-2 lg:gap-16"
    >
      <div className="min-w-0">
        <h3
          id={`${s.ancla}-titulo`}
          className="font-display text-[length:clamp(1.5rem,2.2vw,2rem)] leading-snug font-light wrap-anywhere"
        >
          {s.nombre}
        </h3>
        {s.resumen ? <p className={`${PARRAFO} mt-4`}>{s.resumen}</p> : null}
        {s.descripcion ? (
          <div className={`${TEXTO} mt-6`}>
            <TextoRico texto={s.descripcion} nivelSubtitulo={4} clases={CLASES_TEXTO} />
          </div>
        ) : null}
        {s.muestras.length > 0 ? (
          <>
            <h4 className={`${ROTULO} mt-10`}>{t.enLaSala}</h4>
            <ul className="mt-2 text-lg font-light">
              {s.muestras.map((m) => (
                <li key={m.url} className="wrap-anywhere">
                  <a href={m.url} className={ENLACE_SUELTO}>
                    {m.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {s.portada ? (
        <Foto foto={s.portada} conPie sizes="(min-width: 64rem) 45vw, 100vw" className="h-auto w-full rounded-[0.625rem]" />
      ) : null}
    </section>
  )
}

/** @param {{ estado: { datos: { muestras?: object[], salas?: object[] } } }} props */
export default function Exposiciones({ estado }) {
  const { muestras = [], salas = [] } = estado.datos ?? {}
  return (
    <div className={CONTENEDOR}>
      <h1 className={TITULO_PAGINA}>{t.titulo}</h1>
      {muestras.length > 0 ? <SeccionDeTarjetas id="muestras" titulo={t.muestras} tarjetas={muestras} primera /> : null}
      {salas.length > 0 ? (
        <Seccion id="salas" titulo={t.salas} className="mt-20 md:mt-28">
          {salas.map((s) => (
            <Sala key={s.ancla} sala={s} />
          ))}
        </Seccion>
      ) : null}
    </div>
  )
}
