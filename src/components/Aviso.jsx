// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
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
