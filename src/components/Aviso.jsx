// Sin uso desde la Visitas del tablero "Web" de la diseñadora (03/11/2026, decisión V1: el tablero no trae el aviso):
// queda sin borrar (C1 del desarrollador, 09/11/2026).
//
// El aviso general de Visitas (un cierre, un feriado): el texto que carga el museo, en el recuadro naranja del sitio.
// Solo llega si está vigente (server/museo.js). No es una alerta que interrumpa: es parte de la página.

/** @param {{ texto: string, className?: string }} props */
export default function Aviso({ texto, className = '' }) {
  return (
    <div className={`max-w-3xl rounded-md border-[1.5px] border-naranja px-5 py-4 ${className}`}>
      {/* Varios renglones (los saltos que escribe el museo) y una palabra que no entra se parte (PAG-01 y PAG-04). */}
      <p className="text-lg whitespace-pre-line wrap-anywhere">{texto}</p>
    </div>
  )
}
