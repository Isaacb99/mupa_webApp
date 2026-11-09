import { resumirHorario } from '../../compartido/horarios.js'
import HeroPagina from '../components/HeroPagina.jsx'
import { FlechaDerecha, FlechaDiagonal } from '../components/Iconos.jsx'
import { Accesibilidad, Brujula, Cerebro, Info, Ojo, Oreja, Reloj } from '../components/IconosTarjetas.jsx'
import TextoCorreo from '../components/TextoCorreo.jsx'
import TextoRico from '../components/TextoRico.jsx'
import {
  correoPublico,
  enlaceDelMapa,
  enlaceTelefono,
  mapaInsertado,
  renglonesDireccion,
} from '../components/datosMuseo.js'
import { seccionDe } from '../components/navegacion.js'
import {
  CLASES_TEXTO_TABLERO,
  CONTENEDOR_TABLERO,
  DATO_TARJETA,
  ENLACE_DATO,
  ENLACE_FLECHA,
  ICONO_TARJETA,
  ROTULO_SECCION,
  ROTULO_TARJETA,
  SECCION_TABLERO,
  TEXTO_TABLERO,
  TEXTO_TARJETA,
  TITULO_SECCION,
} from '../components/tablero.js'
import { contacto, visitas } from '../content.js'

// /visitas: la página del tablero "Web" de la diseñadora (Figma, nodo 2846:997, 03/11/2026; decisiones V1 a V9 del
// desarrollador). Solo escritorio (D2): fiel a 1440, con los tamaños del tablero entre lg y 1440 y centrada más allá;
// debajo de lg, en una columna y sin pulir. Va dentro de Layout (el header absolute encima de la foto, el <main>, el
// pie): acá, sus tres partes.
// - El hero (HeroPagina.jsx, el común de las páginas internas): la foto del pincel y el h1 "Visitá el MuPa".
// - "Información práctica / Cómo llegar y cuándo" (80 de aire arriba y abajo, 1280 de contenido): el rótulo, 24 abajo
//   el h2 y 48 abajo las tarjetas Dirección, Horarios y Contacto (tres columnas de 400 con 40 entre sí y 40 de padding;
//   el ícono de 24 en su cuadrado de 48, 16 a su derecha el rótulo, 20 abajo el texto Regular 18/28 en gris) y 48 abajo
//   el mapa de 1280x400 con esquinas de 16.
//   - Los datos son los que carga el museo en el panel y ya vienen en estado.museo (datosMuseo.js): la dirección en
//     renglones; el horario resumido (compartido/horarios.js: los días con las mismas franjas juntos, los cerrados al
//     final) sin sus notas, sin la tabla de la semana ni "Hoy" (V3); el teléfono (tel: si es un solo número) y el correo
//     público (mailto:). Una tarjeta sin datos no se dibuja; con una o dos, van en las primeras columnas (V6).
//   - Contacto lleva además "Ir a Contacto" (/contacto, si la página existe): el tablero no tiene enlaces en el cuerpo
//     (desvío a confirmar con la diseñadora; con el teclado y el lector, es el camino al formulario). Los enlaces miden
//     44 de alto (el texto, 28): si el primero es un enlace, el bloque sube 8 px (-mt-2), así el primer renglón queda a
//     la altura del de las otras tarjetas, como en el tablero.
//   - El mapa es el <iframe> de "Insertar mapa" de Datos del museo, como en /contacto (la misma CSP: frame-src deja
//     www.google.com), con su title y lazy (V5); el tablero trae una captura fija. Debajo, "Abrir en Google Maps" si el
//     museo cargó esa dirección (desvío: el tablero no lo trae; sirve para el teclado y el lector, que no usan el mapa).
//     Lenis le saca el puntero al mapa mientras la página se desliza (lenis.css): la rueda sigue moviendo la página.
//   - Sin ninguna tarjeta, ni mapa, ni "Abrir en Google Maps", la sección entera no se dibuja (plan 6.1: lo que el
//     museo no cargó no se dibuja, ni su rótulo). Con solo "Abrir en Google Maps", sale con ese enlace solo (desvío
//     de V6, anotado en CLAUDE.md).
// - "Museo accesible / Un museo para descubrir todos los días" (siempre: sus textos son del tablero): el rótulo y el
//   h2; 48 abajo, en dos columnas de 600 con 80 entre sí, el texto y la foto de 600x360 con esquinas de 16; 48 abajo, las
//   cuatro tarjetas de recursos (cuatro columnas de 296 con 32 entre sí y 32 de padding; el ícono en su cuadrado, 20
//   abajo el rótulo y 8 abajo el texto Regular 16/26 en gris).
//   - El texto es el texto con formato "Accesibilidad" del panel (estado.datos.accesibilidad, server/paginas.js:
//     cargarVisitas), con el párrafo del tablero (Regular 18/30 en crema); si el museo no lo cargó, los dos párrafos del
//     tablero (content.js), el segundo en gris como en el tablero (V4). El del panel va todo en crema: el editor no
//     tiene "texto secundario" (desvío a confirmar con la diseñadora).
//   - Las tarjetas son fijas (content.js) con íconos que corresponden a cada tema (los del tablero son de relleno: V4,
//     IconosTarjetas.jsx; desvío a confirmar con la diseñadora).
// - Lo que el tablero no trae ya no se muestra (V1): el aviso general, "Comprar entradas", las tarifas y su nota, la
//   tabla de la semana con "Hoy", la nota de horarios, "Cómo llegar" y las normas. La compra externa sigue en el header
//   ("Tickets") y en la franja de la Home. Aviso.jsx, BotonCompra.jsx, ListaTarifas.jsx y TablaHorarios.jsx quedan sin
//   usar y sin borrar (C1 del desarrollador, 09/11/2026).
// - Las tarjetas no tienen fondo propio: el del tablero es el de la página (#010101) y no se ve; su padding sí (corre el
//   texto 40 y 32 px respecto del título, como en el tablero). Debajo de lg van en una columna (los recursos, en dos
//   desde sm) y sin padding, alineadas con el título. Entre lg y xl (1024 a 1279): las de información, con 24 de padding
//   a los costados (40 desde xl), y los recursos, en dos columnas (cuatro desde xl): con las medidas del tablero, a 1024
//   el texto de los recursos medía 128 px y partía "audiodescripciones" por la mitad.
// - Las fotos que no son del primer pantallazo (la de accesibilidad) van lazy; la del hero es el LCP.
// - Encabezados: el h1 del hero, un h2 por sección y un h3 por tarjeta (el rótulo de la tarjeta). Los subtítulos del
//   texto del panel van en h3 (nivelSubtitulo), debajo del h2 de su sección.

const p = visitas.practica
const a = visitas.accesible

// Los íconos de las tarjetas de "Museo accesible", por la clave de content.js.
const ICONOS = { fisica: Accesibilidad, visual: Ojo, auditiva: Oreja, neurodivergencia: Cerebro }

// "9:00 a 13:00" no se parte en dos renglones (sí entre una franja y otra).
const sinCortes = (horas) => horas.replace(/(\d+:\d\d) a (\d+:\d\d)/g, '$1\u00a0a\u00a0$2')

/**
 * Una tarjeta de información: el ícono y el rótulo en una fila, y 20 abajo el texto.
 * @param {{ Icono: (props: { className?: string }) => import('react').ReactNode, titulo: string, extra?: string,
 *   children: import('react').ReactNode }} props  extra: clases del texto (Contacto lo pone en una columna)
 */
function TarjetaInfo({ Icono, titulo, extra = '', children }) {
  return (
    <li className="flex min-w-0 flex-col gap-5 lg:px-6 lg:py-10 xl:px-10">
      <div className="flex items-center gap-4">
        <span className={ICONO_TARJETA}>
          <Icono />
        </span>
        <h3 className={ROTULO_TARJETA}>{titulo}</h3>
      </div>
      <div className={extra ? `${DATO_TARJETA} ${extra}` : DATO_TARJETA}>{children}</div>
    </li>
  )
}

/** @param {{ estado: { museo?: object | null, datos?: { accesibilidad?: object | null } } }} props */
export default function Visitas({ estado }) {
  const museo = estado?.museo ?? null
  const direccion = renglonesDireccion(museo)
  const horario = resumirHorario(museo?.horarios).lineas
  const telefono = enlaceTelefono(museo?.telefono)
  const correo = correoPublico(museo?.emailPublico)
  const mapa = mapaInsertado(museo)
  const abrirMapa = enlaceDelMapa(museo)
  const paginaDeContacto = seccionDe('contacto')
  const hayContacto = Boolean(telefono || correo)
  const hayTarjetas = direccion.length > 0 || horario.length > 0 || hayContacto
  const accesibilidad = estado?.datos?.accesibilidad ?? null

  return (
    <>
      <HeroPagina id="visitas-titulo" titulo={visitas.hero.titulo} imagen={visitas.hero.imagen} />

      {hayTarjetas || mapa || abrirMapa ? (
        <section aria-labelledby="visitas-practica" className={SECCION_TABLERO}>
          <div className={CONTENEDOR_TABLERO}>
            <p className={ROTULO_SECCION}>{p.rotulo}</p>
            <h2 id="visitas-practica" className={`${TITULO_SECCION} mt-6`}>
              {p.titulo}
            </h2>

            {hayTarjetas ? (
              <ul className="mt-12 grid gap-10 lg:grid-cols-3">
                {direccion.length > 0 ? (
                  <TarjetaInfo Icono={Brujula} titulo={p.direccion}>
                    <address className="not-italic">
                      {direccion.map((renglon, i) => (
                        <span key={i} className="block">
                          {renglon}
                        </span>
                      ))}
                    </address>
                  </TarjetaInfo>
                ) : null}
                {horario.length > 0 ? (
                  <TarjetaInfo Icono={Reloj} titulo={p.horarios}>
                    <ul>
                      {horario.map((l, i) => (
                        <li key={i}>{`${l.dias}: ${l.horas ? sinCortes(l.horas) : p.cerrado}`}</li>
                      ))}
                    </ul>
                  </TarjetaInfo>
                ) : null}
                {hayContacto ? (
                  <TarjetaInfo
                    Icono={Info}
                    titulo={p.contacto}
                    extra={(telefono ? telefono.href : correo) ? '-mt-2 flex flex-col items-start' : 'flex flex-col items-start'}
                  >
                    {telefono ? (
                      telefono.href ? (
                        <a href={telefono.href} className={ENLACE_DATO}>
                          {telefono.texto}
                        </a>
                      ) : (
                        <p>{telefono.texto}</p>
                      )
                    ) : null}
                    {correo ? (
                      <a href={`mailto:${correo}`} aria-label={correo} className={ENLACE_DATO}>
                        <TextoCorreo correo={correo} />
                      </a>
                    ) : null}
                    {paginaDeContacto ? (
                      <a href={paginaDeContacto.ruta} className={`${ENLACE_FLECHA} mt-2`}>
                        {p.irAContacto}
                        <FlechaDerecha />
                      </a>
                    ) : null}
                  </TarjetaInfo>
                ) : null}
              </ul>
            ) : null}

            {mapa || abrirMapa ? (
              <div className="mt-12">
                {mapa ? (
                  <iframe
                    src={mapa}
                    title={contacto.mapa}
                    loading="lazy"
                    className="block h-[25rem] w-full rounded-2xl border-0 bg-ink-soft"
                  />
                ) : null}
                {abrirMapa ? (
                  <p className={mapa ? 'mt-4' : undefined}>
                    <a href={abrirMapa} className={ENLACE_FLECHA}>
                      {contacto.abrirMapa}
                      <FlechaDiagonal />
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="visitas-accesible" className={SECCION_TABLERO}>
        <div className={CONTENEDOR_TABLERO}>
          <p className={ROTULO_SECCION}>{a.rotulo}</p>
          <h2 id="visitas-accesible" className={`${TITULO_SECCION} mt-6`}>
            {a.titulo}
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-x-20">
            <div className={`${TEXTO_TABLERO} min-w-0`}>
              {accesibilidad ? (
                <TextoRico texto={accesibilidad} nivelSubtitulo={3} clases={CLASES_TEXTO_TABLERO} />
              ) : (
                a.parrafos.map((parrafo, i) => (
                  <p key={i} className={parrafo.secundario ? 'text-muted' : undefined}>
                    {parrafo.texto}
                  </p>
                ))
              )}
            </div>
            <img
              src={a.imagen.src}
              srcSet={a.imagen.srcSet}
              sizes={a.imagen.sizes}
              width={a.imagen.ancho}
              height={a.imagen.alto}
              alt={a.imagen.alt}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="block aspect-[5/3] h-auto w-full rounded-2xl object-cover"
            />
          </div>

          <ul className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {a.tarjetas.map((tarjeta) => {
              const Icono = ICONOS[tarjeta.icono]
              return (
                <li key={tarjeta.titulo} className="flex min-w-0 flex-col gap-5 lg:p-8">
                  <span className={ICONO_TARJETA}>
                    <Icono />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className={ROTULO_TARJETA}>{tarjeta.titulo}</h3>
                    <p className={TEXTO_TARJETA}>{tarjeta.texto}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Visitas.sobreFoto = true
