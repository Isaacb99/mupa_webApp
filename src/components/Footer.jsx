import { site, footer, ui } from '../content.js'

const PENDIENTE = ui.pendiente

function Institucion({ nombre, logo, ancho, alto }) {
  if (logo) {
    return <img src={logo} alt={nombre} width={ancho} height={alto} loading="lazy" className="h-8 w-auto" />
  }
  return (
    <span className="inline-flex h-8 items-center border border-line px-3 text-xs uppercase tracking-wider text-muted">
      {nombre || PENDIENTE}
    </span>
  )
}

export default function Footer() {
  const instituciones = footer.instituciones ?? []

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-sitio px-6 py-10 md:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={`font-display text-2xl tracking-tight ${site.nombre ? 'text-paper' : 'text-muted'}`}>
              {site.nombre || PENDIENTE}
            </p>
            <p className="mt-1 text-sm text-muted">
              <span className="block">{site.nombreCompleto || PENDIENTE}</span>
              <span className="block">{site.lugar || PENDIENTE}</span>
            </p>
          </div>

          {instituciones.length > 0 ? (
            <ul aria-label={ui.instituciones} className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {instituciones.map((inst) => (
                <li key={inst.nombre}>
                  <Institucion {...inst} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{PENDIENTE}</p>
          )}
        </div>

        <p className="mt-10 text-xs text-muted">{footer.legal || PENDIENTE}</p>
      </div>
    </footer>
  )
}
