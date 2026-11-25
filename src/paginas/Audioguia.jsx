import { useEffect, useRef } from 'react'
import { FlechaDerecha } from '../components/Iconos.jsx'
import { seccionDe } from '../components/navegacion.js'
import {
  CONTENEDOR_SIN_FOTO,
  DATO_TARJETA,
  ENLACE_DATO,
  ENLACE_FLECHA,
  PARRAFO_SECUNDARIO,
  PARRAFO_TABLERO,
  ROTULO_ACTUAL,
  TEXTO_TABLERO,
  TITULO_SIN_FOTO,
  TITULO_SUBSECCION,
} from '../components/tablero.js'
import { audioguia as textos } from '../content.js'

// La audioguía del museo (especificación de las audioguías, versión 2, secciones 5 y 6). La arma el router propio de
// server/audioguia/rutas.js, fuera de la tabla de rutas del sitio, del sitemap y del menú (no está en navegacion de
// src/content.js: no sale en el menú, en el pie ni en la 404). Sin sobreFoto: el título arriba, como las fichas.
//
// Los datos (estado.datos, 5.1) los arma el servidor, que decide todo: si hay permiso (la cookie de día del QR), en qué
// versión (la común o la de audiodescripción: ?v= o la cookie de preferencia, A10) y en qué espacio se está. Solo
// viaja la versión elegida. Sin acceso (o con datos {}, la prueba de la tabla de páginas), el motivo: ni una dirección
// de audio ni una transcripción. Los títulos de los espacios y de las estaciones son del guion del museo, tal cual
// (D13): nada los transforma al dibujarlos.
//
// Un solo HTML, como todo el sitio: nada decide por el ancho ni por el navegador al renderizar (la versión llega en el
// estado). La estructura, la de 5.2:
// - el h1, que dice siempre la versión («Audioguía» o «Audioguía con audiodescripción»: el <title> no, 6);
// - el bloque de versión (#audioguia-version, enfocable con tabIndex -1): la frase del estado y un solo enlace a la
//   otra versión (5.3: un enlace y no dos radios; sin aria-current ni <nav>). El enlace vuelve a cargar la página y el
//   fragmento deja a la persona donde tocó, con la frase nueva primero. El foco no se mueve con JavaScript;
// - con espacio actual, «Ir a SALA 2, el espacio en el que estás», al h2 de ese espacio;
// - el índice de espacios (<nav> con su nombre y <ul role="list">), con enlaces de 44 px al h2 de cada uno;
// - un párrafo con la bajada, y un role="status" vacío, el único anuncio de la página (el error de un audio);
// - el recorrido (<ol role="list">): un <li> por espacio, con su h2 (el destino de las anclas: enfocable sin
//   JavaScript, con el margen de ANCLA de SeccionRecursos.jsx), el título y el lema del guion y un <ol role="list"> con
//   sus estaciones. El espacio actual lleva el borde naranja, el rótulo «Estás en este espacio» (aria-hidden) y, adentro
//   del h2, «, estás en este espacio» para el lector; la segunda Recepción, «, al final del recorrido» a la vista. Así
//   los 13 h2 dicen cosas distintas. La marca la pone el servidor: sin target: ni has-[:target], no se mueve al tocar el
//   índice;
// - cada estación: el h3 con el número a la vista (aria-hidden) y «Estación 7: » para el lector, la duración, el <audio>
//   nativo (preload="none": sin él, 35 pedidos de metadatos al cargar; nodownload; con el nombre del h3), un
//   <p data-aviso> vacío sin aria-live (el efecto escribe ahí el error, al lado del audio que falló) y la transcripción
//   en un <details>, con el título en el summary para el lector (35 «Leer la transcripción» iguales no se distinguen);
// - al final, la nota de los navegadores de las apps, en un <details>.
// Los dos <details> llevan suppressHydrationWarning (AGP-NAV-02): si la persona abre uno antes de que la página
// hidrate, el HTML tiene open y React no; así no avisa una diferencia (vale solo para los atributos de ese elemento: lo
// de adentro se sigue comparando) y el <details> queda abierto, como lo dejó la persona.
//
// El efecto (5.5), con el estado inicial fijo y todo lo demás en useEffect: una sola pista a la vez (un oyente play en
// captura sobre el recorrido pausa las demás), la dirección sin r, motivo ni v (conservando el fragmento), el error de
// un audio con un HEAD (403: el permiso venció; si no, la señal), volver a cargar si la página vuelve del bfcache (el
// permiso pudo vencer) y la metadata de Media Session en cada play. Al terminar una estación no arranca la siguiente.
//
// Cómo queda un audio que falló sin la señal (AGP-NAV-01 de la verificación, 24/11/2026). En error, el control nativo no
// hace nada al tocarlo (play() lo rechaza) y el «probá de nuevo» no andaría. Volver a cargarlo con load() no sirve: en
// Chrome un load() explícito pide el audio aunque tenga preload="none", así que un load() en cada error era un bucle sin
// fin (sin señal, unos 500 errores por segundo; con un audio que no se decodifica, un HEAD tras otro, que gastaba el
// límite de la IP en medio minuto y dejaba sin audio a todo el museo). Lo que se hace es sacarle el src y volver a
// ponerlo: el algoritmo de carga corre sin pedir nada (respeta el preload="none"), el audio queda como al cargar la
// página, sin error, y el próximo toque de la persona lo pide de nuevo. Un error y un HEAD por cada toque, y nada solo.

/** Las claves de la consulta que saca la página después de cargar (5.5): r y v ya hicieron lo suyo, motivo también. */
const CLAVES_DE_UNA_VEZ = ['r', 'motivo', 'v']
/** ms entre vaciar el role="status" y escribirlo otra vez, así el lector anuncia aunque repita el texto. */
const ESPERA_AVISO_MS = 100
/** El margen de scroll del h2 de cada espacio y del bloque de versión: los 36 del rótulo y el aire (ANCLA). */
const ANCLA = 'scroll-mt-25 lg:scroll-mt-29 focus:outline-none'

// El h1 de las fichas y la 404 (TITULO_SIN_FOTO) con un tope propio debajo de 32rem: con la letra del navegador
// agrandada, 1,75rem crece (42 px con la letra en 24) y «Audioguía» o «descripción» no entraban en la columna de un
// teléfono, así que wrap-anywhere las partía a mitad de palabra (AGP-SPE-01 y AGP-NAV-03; spec 5.2 y 10: solo por el
// espacio o por el guion blando). Con 9,3vw el h1 deja de crecer más allá de lo que entra en la pantalla; con la letra
// normal, min() da los mismos 28/32 de siempre desde 302 px de ancho (con el tope, el interlineado guarda la proporción
// 32/28). No se toca TITULO_SIN_FOTO: las fichas y la 404 no cambian. Decidido por el desarrollador el 25/11/2026;
// medido de 320 a 430 px y a 1440 con la letra en 16, 20 y 24, en las tres formas (tools/salida/audioguias/arreglos/).
const TITULO = [
  TITULO_SIN_FOTO,
  'max-[32rem]:text-[length:min(1.75rem,9.3vw)] max-[32rem]:leading-[min(2rem,10.6286vw)]',
].join(' ')

export default function Audioguia({ estado }) {
  const datos = estado?.datos ?? {}

  // r (el 303 del QR), motivo (el del código inválido) y v (la versión, que ya quedó en la cookie de preferencia) se van
  // de la dirección: si la persona recarga o comparte, vuelve al mismo h2 sin repetirlos.
  useEffect(() => {
    const consulta = new URLSearchParams(window.location.search)
    if (CLAVES_DE_UNA_VEZ.some((clave) => consulta.has(clave))) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  }, [])

  if (datos.acceso !== true) return <SinAcceso motivo={datos.motivo} />
  return <ConAcceso datos={datos} />
}

/** Sin permiso: el h1, el motivo y el enlace a Visitas (con el texto del menú: ningún texto nuevo). */
function SinAcceso({ motivo }) {
  const texto = Object.hasOwn(textos.motivos, motivo ?? '') ? textos.motivos[motivo] : textos.motivos['sin-codigo']
  const visitas = seccionDe('visitas')
  return (
    <div className={CONTENEDOR_SIN_FOTO}>
      <h1 className={TITULO}>{textos.titulo}</h1>
      <p className={`${PARRAFO_TABLERO} mt-6`}>{texto}</p>
      {visitas && (
        <p className="mt-10">
          <a href={visitas.ruta} className={ENLACE_FLECHA}>
            {visitas.texto}
            <FlechaDerecha />
          </a>
        </p>
      )}
    </div>
  )
}

/** El nombre del espacio en el índice y en su h2: el del guion y, en la segunda Recepción, «al final del recorrido». */
const nombreDelEspacio = (grupo) => (grupo.alFinal ? `${grupo.nombreGuion}${textos.alFinal}` : grupo.nombreGuion)

/** El título y el lema del guion, juntos («ISCHIGUALASTO · El origen de los dinosaurios»), o el que haya. */
const tituloYLema = (grupo) => [grupo.titulo, grupo.lema].filter(Boolean).join(' · ')

function ConAcceso({ datos }) {
  const recorrido = useRef(null)
  const anuncio = useRef(null)
  const ad = datos.version === 'ad'
  const actual = datos.grupos.find((g) => g.actual) ?? null

  useEffect(() => {
    const lista = recorrido.current
    if (!lista) return undefined
    // De cada estación (por el id de su <li>), lo que dice Media Session.
    const porEstacion = new Map()
    for (const grupo of datos.grupos) {
      for (const e of grupo.estaciones) porEstacion.set(`estacion-${e.id}`, { estacion: e, grupo })
    }
    const deLaEstacion = (audio) => porEstacion.get(audio.closest('li[id^="estacion-"]')?.id)
    const avisoDe = (audio) => audio.closest('li[id^="estacion-"]')?.querySelector('[data-aviso]')
    let temporizador = null

    // Una sola pista a la vez; y, si la que arranca había fallado, se borra su aviso.
    const alReproducir = (evento) => {
      const audio = evento.target
      if (!(audio instanceof HTMLMediaElement)) return
      for (const otro of lista.querySelectorAll('audio')) if (otro !== audio && !otro.paused) otro.pause()
      const aviso = avisoDe(audio)
      if (aviso) aviso.textContent = ''
      const datosDeLaEstacion = deLaEstacion(audio)
      if (datosDeLaEstacion && 'mediaSession' in navigator && typeof window.MediaMetadata === 'function') {
        const { estacion, grupo } = datosDeLaEstacion
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: `${textos.estacion} ${estacion.numero}: ${estacion.titulo}`,
          artist: textos.artista,
          album: grupo.nombreGuion,
          artwork: [{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
        })
      }
    }

    // El error (no burbujea: en captura). Con un HEAD se sabe si es el permiso (403) o la señal; el mismo texto va en el
    // role="status" (el anuncio, vaciado antes así suena aunque repita) y al lado del audio que falló, sin aria-live.
    const alFallar = async (evento) => {
      const audio = evento.target
      if (!(audio instanceof HTMLMediaElement)) return
      const src = audio.currentSrc || audio.getAttribute('src')
      let mensaje = textos.sinConexion
      try {
        const respuesta = await fetch(src, { method: 'HEAD', cache: 'no-store' })
        if (respuesta.status === 403) mensaje = textos.motivos.vencido
      } catch {
        // Sin red: el de la señal.
      }
      const aviso = avisoDe(audio)
      if (aviso) aviso.textContent = mensaje
      const region = anuncio.current
      if (region) {
        region.textContent = ''
        clearTimeout(temporizador)
        temporizador = setTimeout(() => {
          region.textContent = mensaje
        }, ESPERA_AVISO_MS)
      }
      // Sin la señal, que el próximo toque lo vuelva a pedir: el src otra vez, sin load() (ver arriba, AGP-NAV-01).
      if (mensaje === textos.sinConexion && audio.error) {
        const srcDelAudio = audio.getAttribute('src')
        audio.removeAttribute('src')
        if (srcDelAudio) audio.setAttribute('src', srcDelAudio)
      }
    }

    // Si la página vuelve del bfcache (Atrás), el permiso pudo vencer: se pide de nuevo.
    const alVolver = (evento) => {
      if (evento.persisted) window.location.reload()
    }

    lista.addEventListener('play', alReproducir, true)
    lista.addEventListener('error', alFallar, true)
    window.addEventListener('pageshow', alVolver)
    return () => {
      lista.removeEventListener('play', alReproducir, true)
      lista.removeEventListener('error', alFallar, true)
      window.removeEventListener('pageshow', alVolver)
      clearTimeout(temporizador)
    }
  }, [datos])

  return (
    <div className={CONTENEDOR_SIN_FOTO}>
      <h1 className={TITULO}>{ad ? textos.tituloAd : textos.titulo}</h1>

      <div id="audioguia-version" tabIndex={-1} className={`${ANCLA} mt-10`}>
        <p className={PARRAFO_TABLERO}>{ad ? textos.version.actualAd : textos.version.actualComun}</p>
        <p className="mt-2">
          <a href={datos.enlaceVersion} className={ENLACE_FLECHA}>
            {ad ? textos.version.cambiarAComun : textos.version.cambiarAAd}
            <FlechaDerecha />
          </a>
        </p>
      </div>

      {actual && (
        <p className="mt-4">
          <a href={`#${actual.ancla}`} className={ENLACE_FLECHA}>
            {`${textos.irA} ${actual.nombreGuion}${textos.irAlEspacio}`}
            <FlechaDerecha />
          </a>
        </p>
      )}

      <nav aria-label={textos.etiquetaIndice} className="mt-10">
        <ul role="list" className="flex flex-wrap gap-x-8 text-paper">
          {datos.grupos.map((grupo) => (
            <li key={grupo.ancla}>
              <a href={`#${grupo.ancla}`} className={ENLACE_DATO}>
                {nombreDelEspacio(grupo)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className={`${PARRAFO_TABLERO} mt-10`}>{textos.bajada}</p>
      <p ref={anuncio} role="status" className="sr-only"></p>

      <ol ref={recorrido} role="list" aria-label={textos.etiquetaRecorrido} className="mt-16 flex flex-col gap-y-20">
        {datos.grupos.map((grupo) => (
          <Espacio key={grupo.ancla} grupo={grupo} />
        ))}
      </ol>

      <details className="mt-20" suppressHydrationWarning>
        <summary className={RESUMEN}>{textos.navegadorAppPregunta}</summary>
        <p className={`${PARRAFO_TABLERO} mt-4`}>{textos.navegadorApp}</p>
      </details>
    </div>
  )
}

/** El summary de un <details>: 44 px de alto (24 de renglón y 10 arriba y abajo), como un enlace del tablero. */
const RESUMEN =
  'min-h-11 cursor-pointer py-2.5 font-mono text-base leading-6 text-blanco decoration-1 underline-offset-4 ' +
  'hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco'

/** El espacio actual, con el borde naranja a la izquierda (lo decide el servidor); los demás, sin clase. */
const ESPACIO_ACTUAL = 'border-l-2 border-naranja pl-4 lg:pl-6'

function Espacio({ grupo }) {
  const subtitulo = tituloYLema(grupo)
  return (
    <li className={grupo.actual ? ESPACIO_ACTUAL : undefined} aria-current={grupo.actual ? 'location' : undefined}>
      {grupo.actual && (
        <p aria-hidden="true" className={ROTULO_ACTUAL}>
          {textos.estasAca}
        </p>
      )}
      <h2 id={grupo.ancla} tabIndex={-1} className={[TITULO_SUBSECCION, ANCLA, grupo.actual && 'mt-4'].filter(Boolean).join(' ')}>
        {nombreDelEspacio(grupo)}
        {grupo.actual && <span className="sr-only">{textos.estasAcaLector}</span>}
      </h2>
      {subtitulo && <p className={`${PARRAFO_SECUNDARIO} mt-2`}>{subtitulo}</p>}
      <ol role="list" className="mt-8 flex flex-col gap-y-12">
        {grupo.estaciones.map((estacion) => (
          <Estacion key={estacion.id} estacion={estacion} />
        ))}
      </ol>
    </li>
  )
}

function Estacion({ estacion }) {
  const idTitulo = `estacion-${estacion.id}-titulo`
  return (
    <li id={`estacion-${estacion.id}`}>
      <h3 id={idTitulo} className="text-xl leading-8 font-medium text-paper wrap-break-word text-pretty">
        <span aria-hidden="true" className="mr-3 font-mono text-naranja">
          {estacion.id}
        </span>
        <span className="sr-only">{`${textos.estacion} ${estacion.numero}: `}</span>
        {estacion.titulo}
      </h3>
      <p className={`${DATO_TARJETA} mt-1`}>
        <span aria-hidden="true">{estacion.duracion}</span>
        <span className="sr-only">{`${textos.duracion} ${estacion.duracionLarga}`}</span>
      </p>
      <audio
        controls
        controlsList="nodownload"
        preload="none"
        src={estacion.src}
        aria-labelledby={idTitulo}
        className="mt-4 w-full"
      >
        {textos.sinSoporte}
      </audio>
      <p data-aviso="" className="mt-2 text-base leading-6 text-naranja empty:hidden"></p>
      <details className="mt-2" suppressHydrationWarning>
        <summary className={RESUMEN}>
          {textos.transcripcion}
          <span className="sr-only">{`: ${estacion.titulo}`}</span>
        </summary>
        <div className={`${TEXTO_TABLERO} mt-4`}>
          {estacion.parrafos.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      </details>
    </li>
  )
}
