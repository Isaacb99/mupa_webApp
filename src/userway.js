// UserWay (E4.7, plan 6.6): el widget de accesibilidad que pidió el museo. Se carga solo si el servidor manda el ID de la
// cuenta (estado.userway, la variable USERWAY_ID de Render; vacía, no se carga nada ni entra a la CSP) y solo en las
// páginas públicas (el panel es otro bundle y nunca lo carga, plan 9).
// Es el snippet de UserWay (https://cdn.userway.org/widget.js con data-account), agregado con la página ya cargada y el
// navegador en reposo, como la analítica: el script no compite con la foto del hero ni con el arranque de los efectos.
// Sus dominios en la CSP (server/seguridad.js) y que no tape el indicador de scroll ni el menú ni corra la página
// (CLS 0 con tools/vitals.mjs) quedan A CONFIRMAR AL INTEGRARLO, con el ID del museo (plan 6.6). En las pruebas, el
// script se bloquea (nunca se carga el de verdad).

/** El script del widget. */
export const URL_USERWAY = 'https://cdn.userway.org/widget.js'
// Lo mismo que acepta config.js para USERWAY_ID.
const ID = /^[A-Za-z0-9_-]{1,64}$/

/** Agrega el script de UserWay (una sola vez) si el estado trae el ID. */
export default function iniciarUserWay(estado) {
  const id = estado?.userway
  if (typeof id !== 'string' || !ID.test(id)) return
  const cargar = () => {
    if (document.querySelector(`script[src="${URL_USERWAY}"]`)) return
    const script = document.createElement('script')
    script.src = URL_USERWAY
    script.async = true
    script.dataset.account = id
    document.body.append(script)
  }
  const enReposo = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(cargar, { timeout: 4000 })
    else setTimeout(cargar, 1500)
  }
  if (document.readyState === 'complete') enReposo()
  else window.addEventListener('load', enReposo, { once: true })
}
