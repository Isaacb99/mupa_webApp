// "Hay una versión nueva del panel" (plan 5.1). Después de un deploy, los archivos del panel cambian de nombre (llevan
// hash) y los viejos dejan de existir: una pestaña que quedó abierta falla al cargar una parte que todavía no había
// pedido (Vite avisa con el evento vite:preloadError). No se recarga sola, porque se perdería lo que se estaba
// escribiendo: se avisa arriba de todo, con un botón para recargar cuando la persona termine de guardar.
// Va fuera del router (main.jsx). avisarVersionNueva() también la usa la pantalla de error cuando falla un import.
import { useSyncExternalStore } from 'react'
import { Boton } from './Boton.jsx'

let hayVersionNueva = false
const oyentes = new Set()

export function avisarVersionNueva() {
  if (hayVersionNueva) return
  hayVersionNueva = true
  oyentes.forEach((o) => o())
}

const suscribir = (o) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}

/** ¿El error es un archivo del panel que ya no está (un import que falló después de un deploy)? */
export function esVersionVieja(error) {
  const texto = String(error?.message ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload/i.test(texto)
}

export function AvisoVersionNueva() {
  const hay = useSyncExternalStore(suscribir, () => hayVersionNueva)
  return (
    <div role="alert">
      {hay ? (
        <div className="border-b-4 border-atencion bg-atencion-fondo px-4 py-3 text-atencion">
          <div className="mx-auto flex max-w-panel flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">Hay una versión nueva del panel: guardá lo que estés haciendo y recargá la página.</p>
            <Boton variante="secundario" onClick={() => window.location.reload()}>
              Recargar
            </Boton>
          </div>
        </div>
      ) : null}
    </div>
  )
}
