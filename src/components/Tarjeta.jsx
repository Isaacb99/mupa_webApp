import Foto from './Foto.jsx'
import {
  DETALLE_TARJETA,
  ENLACE_TARJETA,
  FOTO_TARJETA,
  RESUMEN_TARJETA,
  ROTULO_TARJETA,
  TAMANO_TARJETA_TABLERO,
  TITULO_TARJETA,
} from './tablero.js'

// La tarjeta de una muestra (Exposiciones) o de una novedad (Novedades), con el lenguaje de la tarjeta del carrusel de
// Novedades de la Home (tablero "Web" de la diseñadora; decisión R4 del desarrollador, 04/11/2026: las clases están en
// tablero.js) y con todo lo que mostraba antes: la portada, la etiqueta (la situación de la muestra), el título con el
// enlace, la fecha o el período y el resumen. Todo llega como texto del servidor (server/paginas.js).
// - Medidas a 1440 (en la grilla de 400 de Seccion.jsx): la portada de 400x293 (la proporción de 485x355 del tablero)
//   con esquinas de 12; 24 debajo, la etiqueta (Roboto Mono Medium 12/16 en mayúsculas, como el rótulo de una tarjeta
//   del tablero) y 8 debajo el título (Roboto Mono Medium 24/32 en mayúsculas); 8 debajo la fecha o el período (Regular
//   16/26 en gris) y 8 debajo el resumen (16,5/27). Sin portada, lo de abajo sube y arranca arriba.
// - El enlace es el título, y se estira sobre la tarjeta entera (after:absolute): toda la tarjeta lleva a la página sin
//   repetir el enlace para el lector de pantalla ni meter la foto dentro de él. Paso del puntero: el título subrayado
//   (group-hover, como el carrusel); foco: el contorno blanco.
// - En el código la etiqueta y el título van antes que la foto (el lector los encuentra primero) y la foto se ve arriba
//   (order: la foto primero y después cada cosa en el orden del código).
// - prioridad: la foto no va lazy y va con prioridad alta. Desde el hero de las listas (R1) no la usa nadie (la foto del
//   primer pantallazo es la del hero); queda por si una lista vuelve a ser lo primero de una página.
// - Lo que carga el museo (el título, el resumen) se parte si una palabra no entra: PAG-01 de la verificación de E4.

/**
 * @param {{ titulo: string, url: string, resumen?: string | null, portada?: object | null, etiqueta?: string | null,
 *   detalle?: string | null, fechaIso?: string | null, nivel?: 'h2' | 'h3', prioridad?: boolean }} props
 *   detalle: la fecha o el período ya como texto; fechaIso: su valor para <time dateTime>; prioridad: la foto no va lazy
 */
export default function Tarjeta({
  titulo,
  url,
  resumen,
  portada,
  etiqueta,
  detalle,
  fechaIso,
  nivel: Titulo = 'h3',
  prioridad = false,
}) {
  // El aire de arriba de lo primero que va debajo de la foto (24), si hay foto.
  const arriba = portada ? 'mt-6' : ''
  return (
    <article className="group relative flex flex-col">
      {etiqueta ? <p className={[ROTULO_TARJETA, 'order-2', arriba].filter(Boolean).join(' ')}>{etiqueta}</p> : null}
      <Titulo className={[TITULO_TARJETA, 'order-3', etiqueta ? 'mt-2' : arriba].filter(Boolean).join(' ')}>
        <a href={url} className={ENLACE_TARJETA}>
          {titulo}
        </a>
      </Titulo>
      {detalle ? (
        <p className={`${DETALLE_TARJETA} order-4 mt-2`}>
          {fechaIso ? <time dateTime={fechaIso}>{detalle}</time> : detalle}
        </p>
      ) : null}
      {resumen ? <p className={`${RESUMEN_TARJETA} order-5 mt-2`}>{resumen}</p> : null}
      {portada ? (
        <Foto foto={portada} sizes={TAMANO_TARJETA_TABLERO} prioridad={prioridad} className={`${FOTO_TARJETA} order-1`} />
      ) : null}
    </article>
  )
}
