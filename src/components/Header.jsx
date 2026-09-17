import { site, ui } from '../content.js'

const PENDIENTE = ui.pendiente

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {ui.irAlContenido}
      </a>

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6 md:px-10">
        <a
          href="/"
          className="inline-flex min-h-11 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
        >
          <span
            className={`font-display text-2xl font-bold leading-none tracking-tight md:text-3xl ${site.nombre ? 'text-paper' : 'text-muted'}`}
          >
            {site.nombre || PENDIENTE}
          </span>
          <span className="flex flex-col border-l border-line pl-3 text-xs leading-tight text-muted md:text-sm">
            <span>{site.nombreCompleto || PENDIENTE}</span>
            <span>{site.lugar || PENDIENTE}</span>
          </span>
        </a>
      </div>
    </header>
  )
}
