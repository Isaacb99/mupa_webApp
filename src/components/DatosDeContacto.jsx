import { contacto as t } from '../content.js'
import {
  correoPublico,
  enlaceDelMapa,
  enlaceTelefono,
  mapaInsertado,
  redesConocidas,
  renglonesDireccion,
} from './datosMuseo.js'
import { FlechaDiagonal } from './Iconos.jsx'
import { Correo, Redes, Telefono } from './IconosContacto.jsx'
import { Brujula } from './IconosTarjetas.jsx'
import TextoCorreo from './TextoCorreo.jsx'
import {
  CONTENEDOR_TABLERO,
  DATO_TARJETA,
  ENLACE_DATO,
  ENLACE_FLECHA,
  ICONO_TARJETA,
  ROTULO_SECCION,
  ROTULO_TARJETA,
  SECCION_TABLERO,
  TITULO_SECCION,
} from './tablero.js'

// Los datos de contacto del museo en /contacto (E4.5, plan 6.1): dirección, teléfono (tel: si es un solo número),
// correo público (mailto:), redes (con su nombre como texto del enlace) y el mapa: el <iframe> de "Insertar mapa" de
// Google Maps (con title y loading="lazy"; la CSP pública deja www.google.com en frame-src) y "Abrir en Google
// Maps". Todo sale de estado.museo (server/museo.js, lo que carga el museo en Datos del museo) y se vuelve a mirar acá
// (datosMuseo.js). Lo que no está cargado no se dibuja, ni su rótulo; sin nada, la sección entera no se dibuja (plan
// 6.1). Lenis le saca el puntero al mapa mientras la página se desliza (lenis.css): la rueda sobre el mapa sigue
// moviendo la página.
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R1 a R7 del desarrollador; el tablero no dibuja esta
// página), como "Información práctica" de Visitas (src/paginas/Visitas.jsx):
// - La sección: 80 de aire arriba y abajo y 1280 de contenido a 1440; el rótulo (el título de la página, "Contacto",
//   como Exposiciones y Novedades: ningún texto nuevo) y, 24 abajo, el h2 Thin "Datos de contacto".
// - 48 abajo, cada dato como una tarjeta de información de Visitas: el ícono de 24 en su cuadrado de 48 (Brujula de
//   IconosTarjetas.jsx; Telefono, Correo y Redes de IconosContacto.jsx), 16 a su derecha el rótulo (Roboto Mono 12) y
//   20 abajo el texto Regular 18/28 en gris. Sigue siendo una lista de definiciones (<dl>: el rótulo en <dt>, el dato
//   en <dd>), como antes. Son cuatro (Visitas tiene tres): van en dos columnas de 620 con 40 entre sí desde lg (la
//   grilla de las tarjetas de Cogestión y de Misión y Visión de El Museo), dos y dos, con el padding de las de
//   Visitas (40 arriba y abajo, así quedan 80 entre una fila y otra, y 40 a los costados; 24 entre lg y xl): a 1440 el
//   texto mide 540, y una dirección de correo de 32 caracteres (306 px) entra en un renglón desde lg. Debajo de lg, en
//   una columna, sin padding (alineadas con el título). Con menos datos, en las primeras columnas. Hasta la corrección
//   del rediseño (EST-01 de su verificación, 05/11/2026) iban en cuatro columnas de 296 (la grilla de "Museo
//   accesible"): el texto medía 192 a 1280 y 232 a 1440, y el correo se partía a la mitad. Desvío a confirmar con la
//   diseñadora (el tablero no tiene esta página ni los íconos de teléfono, correo y redes).
// - Los enlaces (el teléfono, el correo y las redes) son los de las tarjetas de Visitas (ENLACE_DATO: subrayados y de
//   44 de alto, el texto de 28): si el dato empieza con un enlace, sube 8 px (-mt-2), así su primer renglón queda a la
//   altura del de las otras tarjetas. Las redes, una al lado de la otra y en varios renglones si no entran.
// - 48 abajo, el mapa como en Visitas: 1280x400 con esquinas de 16 y, 16 abajo, "Abrir en Google Maps" como enlace con
//   flecha (ENLACE_FLECHA y la flecha en diagonal); solo el enlace si no hay mapa. Hasta el rediseño el mapa iba en una
//   columna, en 4:3.
// - Lo que carga el museo se parte si una palabra no entra (una dirección web, un correo: wrap-anywhere de
//   DATO_TARJETA).

/**
 * Lo que dibuja la sección, ya mirado (vacío: nada cargado). El mapa, solo el de "Insertar mapa" de Google Maps
 * (mapaInsertado y enlaceDelMapa de datosMuseo.js, que usa también Visitas desde el 03/11/2026).
 */
export function datosDeContacto(museo) {
  return {
    direccion: renglonesDireccion(museo),
    telefono: enlaceTelefono(museo?.telefono),
    correo: correoPublico(museo?.emailPublico),
    redes: redesConocidas(museo?.redes),
    mapa: mapaInsertado(museo),
    abrirMapa: enlaceDelMapa(museo),
  }
}

/** ¿Hay algo para dibujar? */
export const hayDatosDeContacto = (d) =>
  d.direccion.length > 0 || Boolean(d.telefono || d.correo || d.mapa || d.abrirMapa) || d.redes.length > 0

/**
 * Un dato, como una tarjeta de información: el ícono y el rótulo en una fila (el <dt>) y 20 abajo el texto (el <dd>).
 * @param {{ Icono: (props: { className?: string }) => import('react').ReactNode, titulo: string, enlace?: boolean,
 *   children: import('react').ReactNode }} props  enlace: el dato empieza con un enlace (sube 8 px)
 */
function Dato({ Icono, titulo, enlace = false, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-5 lg:px-6 lg:py-10 xl:px-10">
      <dt className="flex items-center gap-4">
        <span className={ICONO_TARJETA}>
          <Icono />
        </span>
        <span className={ROTULO_TARJETA}>{titulo}</span>
      </dt>
      <dd className={enlace ? `${DATO_TARJETA} -mt-2` : DATO_TARJETA}>{children}</dd>
    </div>
  )
}

/** @param {{ datos: ReturnType<typeof datosDeContacto> }} props */
export default function DatosDeContacto({ datos: d }) {
  if (!hayDatosDeContacto(d)) return null
  const hayLista = d.direccion.length > 0 || d.telefono || d.correo || d.redes.length > 0
  return (
    <section aria-labelledby="datos-contacto" className={SECCION_TABLERO}>
      <div className={CONTENEDOR_TABLERO}>
        <p className={ROTULO_SECCION}>{t.titulo}</p>
        <h2 id="datos-contacto" className={`${TITULO_SECCION} mt-6`}>
          {t.datos}
        </h2>
        {hayLista ? (
          <dl className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0">
            {d.direccion.length > 0 ? (
              <Dato Icono={Brujula} titulo={t.direccion}>
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
              <Dato Icono={Telefono} titulo={t.telefono} enlace={Boolean(d.telefono.href)}>
                {d.telefono.href ? (
                  <a href={d.telefono.href} className={ENLACE_DATO}>
                    {d.telefono.texto}
                  </a>
                ) : (
                  d.telefono.texto
                )}
              </Dato>
            ) : null}
            {d.correo ? (
              <Dato Icono={Correo} titulo={t.correo} enlace>
                <a href={`mailto:${d.correo}`} aria-label={d.correo} className={ENLACE_DATO}>
                  <TextoCorreo correo={d.correo} />
                </a>
              </Dato>
            ) : null}
            {d.redes.length > 0 ? (
              <Dato Icono={Redes} titulo={t.redes} enlace>
                <ul className="flex flex-wrap gap-x-5">
                  {d.redes.map((r, i) => (
                    <li key={i} className="min-w-0">
                      <a href={r.url} className={ENLACE_DATO}>
                        {r.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              </Dato>
            ) : null}
          </dl>
        ) : null}
        {d.mapa || d.abrirMapa ? (
          <div className="mt-12">
            {d.mapa ? (
              <iframe
                src={d.mapa}
                title={t.mapa}
                loading="lazy"
                className="block h-[25rem] w-full rounded-2xl border-0 bg-ink-soft"
              />
            ) : null}
            {d.abrirMapa ? (
              <p className={d.mapa ? 'mt-4' : undefined}>
                <a href={d.abrirMapa} className={ENLACE_FLECHA}>
                  {t.abrirMapa}
                  <FlechaDiagonal />
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
