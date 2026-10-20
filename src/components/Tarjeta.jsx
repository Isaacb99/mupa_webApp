import Foto from './Foto.jsx'
import { ROTULO, TAMANO_TARJETA } from './estilos.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// La tarjeta de una muestra (Exposiciones) o de una novedad (Novedades): la portada, la etiqueta (la situación de la
// muestra), el título con el enlace, la fecha o el período y el resumen. Todo llega como texto del servidor.
// - El enlace es el título, y se estira sobre la tarjeta entera (after:absolute): toda la tarjeta lleva a la página
//   sin repetir el enlace para el lector de pantalla ni meter la foto dentro de él.
// - En el código el título va antes que la foto (el lector lo encuentra primero) y la foto se ve arriba (order-first).
// - prioridad: la primera tarjeta de la página (Seccion.jsx), la que se ve en el primer pantallazo del celular: su foto
//   no va lazy y va con prioridad alta, como la portada de una ficha (era la imagen del LCP de /novedades y
//   /exposiciones y llegaba 2 s después del primer pintado: PAG-02 de la verificación de E4). Las demás, lazy.
// - El título y el resumen se parten si una palabra no entra (una dirección, un correo): PAG-01.

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
  return (
    <article className="relative flex flex-col">
      {etiqueta ? <p className={`${ROTULO} mt-5`}>{etiqueta}</p> : null}
      <Titulo className={`font-display text-2xl leading-snug font-light wrap-anywhere ${etiqueta ? 'mt-2' : 'mt-5'}`}>
        <a
          href={url}
          className="rounded-sm underline-offset-4 decoration-1 after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
        >
          {titulo}
        </a>
      </Titulo>
      {detalle ? (
        <p className="mt-2 text-[0.9375rem] text-muted">
          {fechaIso ? <time dateTime={fechaIso}>{detalle}</time> : detalle}
        </p>
      ) : null}
      {resumen ? <p className="mt-3 leading-relaxed font-light wrap-anywhere">{resumen}</p> : null}
      {portada ? (
        <Foto
          foto={portada}
          sizes={TAMANO_TARJETA}
          prioridad={prioridad}
          className="order-first aspect-[3/2] w-full rounded-[0.625rem] object-cover"
        />
      ) : null}
    </article>
  )
}
