import { esEnlacePermitido } from '../../compartido/enlaces.js'
import { contacto as t } from '../content.js'
import { correoPublico, enlaceTelefono, redesConocidas, renglonesDireccion } from './datosMuseo.js'
import { ENLACE_SUELTO, ROTULO, SUBTITULO } from './estilos.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// Los datos de contacto del museo en /contacto (E4.5, plan 6.1): dirección, teléfono (tel: si es un solo número),
// correo público (mailto:), redes (con su nombre como texto del enlace) y el mapa: el <iframe> de "Insertar mapa" de
// Google Maps (con title y loading="lazy"; la CSP pública deja www.google.com en frame-src y nada más) y "Abrir en
// Google Maps". Todo sale de estado.museo (server/museo.js, lo que carga el museo en Datos del museo) y se vuelve a
// mirar acá (datosMuseo.js). Lo que no está cargado no se dibuja, ni su rótulo; sin nada, la sección entera no se
// dibuja (plan 6.1). Lenis le saca el puntero al mapa mientras la página se desliza (lenis.css): la rueda sobre el mapa
// sigue moviendo la página.

// El src del mapa: solo el de "Insertar mapa" de Google Maps (lo mismo que acepta la base, museo_mapa_embed_google).
const MAPA = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>\\`]*$/

/** Lo que dibuja la sección, ya mirado (vacío: nada cargado). */
export function datosDeContacto(museo) {
  const mapa = typeof museo?.mapaEmbedUrl === 'string' && MAPA.test(museo.mapaEmbedUrl) ? museo.mapaEmbedUrl : null
  const abrirMapa =
    typeof museo?.mapaUrl === 'string' && museo.mapaUrl.startsWith('https://') && esEnlacePermitido(museo.mapaUrl)
      ? museo.mapaUrl
      : null
  return {
    direccion: renglonesDireccion(museo),
    telefono: enlaceTelefono(museo?.telefono),
    correo: correoPublico(museo?.emailPublico),
    redes: redesConocidas(museo?.redes),
    mapa,
    abrirMapa,
  }
}

/** ¿Hay algo para dibujar? */
export const hayDatosDeContacto = (d) =>
  d.direccion.length > 0 || Boolean(d.telefono || d.correo || d.mapa || d.abrirMapa) || d.redes.length > 0

// Los enlaces miden 44 px de alto (A11Y-01 de la verificación de E4) y lo largo se parte (PAG-01).
function Dato({ titulo, children }) {
  return (
    <div className="min-w-0">
      <dt className={ROTULO}>{titulo}</dt>
      <dd className="mt-2 text-lg leading-relaxed font-light wrap-anywhere">{children}</dd>
    </div>
  )
}

/** @param {{ datos: ReturnType<typeof datosDeContacto> }} props */
export default function DatosDeContacto({ datos: d }) {
  if (!hayDatosDeContacto(d)) return null
  const hayLista = d.direccion.length > 0 || d.telefono || d.correo || d.redes.length > 0
  return (
    <section aria-labelledby="datos-contacto" className="min-w-0">
      <h2 id="datos-contacto" className={SUBTITULO}>
        {t.datos}
      </h2>
      {hayLista ? (
        <dl className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
          {d.direccion.length > 0 ? (
            <Dato titulo={t.direccion}>
              <address className="not-italic">
                {d.direccion.map((renglon, i) => (
                  <span key={i} className="block">
                    {renglon}
                  </span>
                ))}
              </address>
            </Dato>
          ) : null}
          {d.telefono ? (
            <Dato titulo={t.telefono}>
              {d.telefono.href ? (
                <a href={d.telefono.href} className={ENLACE_SUELTO}>
                  {d.telefono.texto}
                </a>
              ) : (
                d.telefono.texto
              )}
            </Dato>
          ) : null}
          {d.correo ? (
            <Dato titulo={t.correo}>
              <a href={`mailto:${d.correo}`} className={ENLACE_SUELTO}>
                {d.correo}
              </a>
            </Dato>
          ) : null}
          {d.redes.length > 0 ? (
            <Dato titulo={t.redes}>
              <ul className="flex flex-wrap gap-x-5">
                {d.redes.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} className={ENLACE_SUELTO}>
                      {r.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </Dato>
          ) : null}
        </dl>
      ) : null}
      {d.mapa ? (
        <iframe
          src={d.mapa}
          title={t.mapa}
          loading="lazy"
          className="mt-10 block aspect-[4/3] w-full rounded-md border-0 bg-ink-soft"
        />
      ) : null}
      {d.abrirMapa ? (
        <p className="mt-3 text-lg font-light">
          <a href={d.abrirMapa} className={ENLACE_SUELTO}>
            {t.abrirMapa}
          </a>
        </p>
      ) : null}
    </section>
  )
}
