// Un formulario chico de Visitas que guarda campos del museo (PUT /museo, parcial: solo los suyos): la nota de las
// tarifas, el aviso general y la compra externa. Valida con el mismo esquema del servidor, guarda, muestra "Guardado"
// (role="status") y avisa a la pantalla si tiene cambios sin guardar (la pantalla tiene una sola pregunta para todos
// sus formularios). Lo de adentro lo dibuja quien lo usa (children como función), con los ids prefijo + campo, que
// son los que enlaza ResumenErrores. "Guardado." se ve hasta el primer cambio después de guardar (si no, parecía que lo
// último ya estaba guardado); si se vuelve a lo guardado, no reaparece (se anunciaba sin haber guardado nada).
// direcciones: los campos que son una dirección (la de la compra): si se pegó sin https://, se lo agrega antes de
// guardar (al salir del campo lo hace quien dibuja el campo).
import { useEffect, useState } from 'react'
import { completarHttps } from '../../../../compartido/esquemas/campos.js'
import { esquemaCambioMuseo } from '../../../../compartido/esquemas/museo.js'
import { api } from '../../api.js'
import { Aviso } from '../../componentes/Aviso.jsx'
import { Boton } from '../../componentes/Boton.jsx'
import { ResumenErrores, useEnvio } from '../../componentes/formulario.jsx'
import { aTexto, iguales, validarCon } from '../../formato.js'

/** Los valores de la pantalla a partir del museo de la API: los textos null pasan a "", los sí/no quedan. */
const valoresDe = (campos, museo) =>
  Object.fromEntries(campos.map((c) => [c, typeof museo[c] === 'boolean' ? museo[c] : aTexto(museo[c])]))

/**
 * @param {{
 *   prefijo: string, campos: string[], museo: object, etiquetas: Record<string, string>, textoBoton: string,
 *   alCambiarSucio: (clave: string, sucio: boolean) => void, direcciones?: string[],
 *   children: (f: { valores: Record<string, any>, poner: (campo: string, valor: any) => void,
 *     errores: Record<string, string>, guardado: Record<string, any>,
 *     guardar: (valores: Record<string, any>, ok?: string) => Promise<void>, enviando: boolean }) => import('react').ReactNode,
 * }} props
 *   guardar(valores): guarda otros valores (p. ej. "Quitar el aviso": todo vacío) sin pasar por el botón
 */
export function FormularioMuseo({
  prefijo,
  campos,
  museo,
  etiquetas,
  textoBoton,
  alCambiarSucio,
  direcciones = [],
  children,
}) {
  const [guardado, setGuardado] = useState(() => valoresDe(campos, museo))
  const [valores, setValores] = useState(guardado)
  const [ok, setOk] = useState(null)
  const envio = useEnvio(null)
  const sucio = !iguales(valores, guardado)
  useEffect(() => {
    alCambiarSucio(prefijo, sucio)
  }, [prefijo, sucio, alCambiarSucio])
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])

  async function guardar(estos, mensajeOk = 'Guardado.') {
    setOk(null)
    const completos = { ...estos }
    for (const campo of direcciones) if (campo in completos) completos[campo] = completarHttps(completos[campo])
    const v = validarCon(esquemaCambioMuseo, completos)
    if (!v.ok) {
      envio.mostrar(v.errores, v.general)
      return
    }
    const r = await envio.enviar(() => api.put('/museo', v.datos))
    if (!r.ok) return
    const nuevos = valoresDe(campos, r.datos)
    setGuardado(nuevos)
    setValores(nuevos)
    setOk(mensajeOk)
  }

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        guardar(valores)
      }}
    >
      <ResumenErrores envio={envio} prefijo={prefijo} etiquetas={etiquetas} />
      {children({
        valores,
        poner: (campo, valor) => setValores((v) => ({ ...v, [campo]: valor })),
        errores: envio.errores,
        guardado,
        guardar,
        enviando: envio.enviando,
      })}
      <div>
        <Boton type="submit" ocupado={envio.enviando}>
          {envio.enviando ? 'Guardando…' : textoBoton}
        </Boton>
      </div>
      <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
    </form>
  )
}
