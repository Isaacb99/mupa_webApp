// Los datos de una foto ya subida (plan 5.5): descripción (texto alternativo), "Foto decorativa", epígrafe y crédito,
// con su botón "Guardar los datos de la foto" (PATCH /administracion/api/fotos/:id: se guardan en el momento, porque
// son de la foto y no de la ficha). Lo usan Portada.jsx (sin "decorativa": la portada no la admite) y Galeria.jsx.
// También Miniatura, la foto chica (480.webp) con sus medidas reales.
//
// <DatosFoto
//   id="p-portada-datos"          prefijo de los ids de los campos (único en la pantalla)
//   foto={foto}                   la foto como la devuelve la API ({ id, clave, ancho, alto, alt, decorativa, epigrafe, credito })
//   conDecorativa={true}          false en la portada
//   alGuardar={(foto) => …}       la foto guardada (lo que devolvió el PATCH)
//   alCancelar={() => …}          opcional: muestra "Cancelar" (vuelve a como estaba, sin guardar)
//   alCambiarSucio={(clave, sucio) => …}   opcional: hay cambios sin guardar (clave = id), para la pregunta al irse
//   describedby="portadaId-error"  opcional: un error de quien lo usa, en la descripción del primer control (adonde
//                                  lleva el resumen de errores de la ficha)
// />
// Si cambia la foto (otro id), conviene montarlo de nuevo con key={foto.id}.
// No es un <form>: va adentro del formulario de una ficha (E3.3, E3.4), y un <form> adentro de otro no es válido (el
// submit le llegaría también a la ficha). Enter en un campo guarda los datos de la foto, no la ficha (guardarConEnter).
import { useEffect, useRef, useState } from 'react'
import { AYUDA_ALT, AYUDA_DECORATIVA, urlFoto } from '../../../compartido/fotos.js'
import {
  ALT_MAX,
  CREDITO_MAX,
  EPIGRAFE_MAX,
  esquemaDatosFoto,
  esquemaDatosPortada,
} from '../../../compartido/esquemas/fotos.js'
import { api } from '../api.js'
import { aTexto, iguales, validarCon } from '../formato.js'
import { Aviso } from './Aviso.jsx'
import { Boton } from './Boton.jsx'
import { Campo } from './Campo.jsx'
import { Casilla } from './Casilla.jsx'
import { ResumenErrores, useEnvio } from './formulario.jsx'

const CAMPOS = ['alt', 'decorativa', 'epigrafe', 'credito']
const ETIQUETAS = { alt: 'Descripción', decorativa: 'Foto decorativa', epigrafe: 'Epígrafe', credito: 'Crédito' }

/**
 * La foto chica (480 px), con width y height reales (no corre la página al cargar). alt vacío: quien la usa muestra
 * la descripción como texto al lado.
 * @param {{ foto: { clave: string, ancho: number, alto: number }, className?: string }} props
 */
export function Miniatura({ foto, className = '' }) {
  const ancho = Math.min(480, foto.ancho)
  const alto = Math.max(1, Math.round((foto.alto * ancho) / foto.ancho))
  return (
    <img
      src={urlFoto(foto.clave, '480.webp')}
      width={ancho}
      height={alto}
      alt=""
      loading="lazy"
      decoding="async"
      className={`rounded-md border-2 border-suave bg-fondo-2 object-contain ${className}`}
    />
  )
}

const datosDe = (foto) => ({
  alt: aTexto(foto.alt),
  decorativa: Boolean(foto.decorativa),
  epigrafe: aTexto(foto.epigrafe),
  credito: aTexto(foto.credito),
})

/**
 * Enter en un campo de texto hace lo de este grupo (guardar) y no envía el formulario de afuera (la ficha).
 * @param {() => void} accion
 */
export const guardarConEnter = (accion) => (e) => {
  if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
  e.preventDefault()
  accion()
}

/**
 * @param {{ id: string, foto: object, conDecorativa?: boolean, alGuardar: (foto: object) => void,
 *   alCancelar?: () => void, alCambiarSucio?: (clave: string, sucio: boolean) => void, describedby?: string }} props
 */
export function DatosFoto({ id, foto, conDecorativa = true, alGuardar, alCancelar, alCambiarSucio, describedby }) {
  const [inicial, setInicial] = useState(() => datosDe(foto))
  const [v, setV] = useState(inicial)
  const [ok, setOk] = useState(null)
  const envio = useEnvio(CAMPOS)
  const sucio = !iguales(v, inicial)
  // En una ref: una función nueva en cada dibujo de quien lo usa no vuelve a correr los efectos.
  const avisarSucio = useRef(alCambiarSucio)
  avisarSucio.current = alCambiarSucio
  useEffect(() => {
    avisarSucio.current?.(id, sucio)
  }, [id, sucio])
  useEffect(() => () => avisarSucio.current?.(id, false), [id])
  // "Guardado." se va con el primer cambio.
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])
  const poner = (campo, valor) => setV((x) => ({ ...x, [campo]: valor }))
  const prefijo = `${id}-`

  async function guardar() {
    const esquema = conDecorativa ? esquemaDatosFoto : esquemaDatosPortada
    const r0 = validarCon(esquema, conDecorativa ? v : { ...v, decorativa: false })
    if (!r0.ok) {
      envio.mostrar(r0.errores, r0.general)
      return
    }
    const r = await envio.enviar(() => api.patch(`/fotos/${foto.id}`, r0.datos))
    if (!r.ok) return
    const guardados = datosDe(r.datos)
    setInicial(guardados)
    setV(guardados)
    setOk('Se guardaron los datos de la foto.')
    alGuardar(r.datos)
  }

  const conEnter = guardarConEnter(guardar)
  return (
    <div className="grid gap-4">
      <ResumenErrores envio={envio} prefijo={prefijo} etiquetas={ETIQUETAS} />
      {conDecorativa ? (
        <Casilla
          id={`${prefijo}decorativa`}
          etiqueta="Foto decorativa"
          ayuda={AYUDA_DECORATIVA}
          checked={v.decorativa}
          onChange={(e) => poner('decorativa', e.target.checked)}
          error={envio.errores.decorativa}
          describedby={describedby}
        />
      ) : null}
      {v.decorativa ? null : (
        <Campo
          id={`${prefijo}alt`}
          etiqueta="Descripción (texto alternativo)"
          obligatorio
          ayuda={AYUDA_ALT}
          maxLength={ALT_MAX}
          autoComplete="off"
          value={v.alt}
          onChange={(e) => poner('alt', e.target.value)}
          onKeyDown={conEnter}
          error={envio.errores.alt}
          aria-describedby={conDecorativa ? undefined : describedby}
          aria-invalid={!conDecorativa && describedby ? true : undefined}
        />
      )}
      <Campo
        id={`${prefijo}epigrafe`}
        etiqueta="Epígrafe"
        ayuda="Opcional: se muestra debajo de la foto."
        maxLength={EPIGRAFE_MAX}
        autoComplete="off"
        value={v.epigrafe}
        onChange={(e) => poner('epigrafe', e.target.value)}
        onKeyDown={conEnter}
        error={envio.errores.epigrafe}
      />
      <Campo
        id={`${prefijo}credito`}
        etiqueta="Crédito"
        ayuda="Opcional: quién sacó la foto, por ejemplo «Foto: Archivo MuPa»."
        maxLength={CREDITO_MAX}
        autoComplete="off"
        value={v.credito}
        onChange={(e) => poner('credito', e.target.value)}
        onKeyDown={conEnter}
        error={envio.errores.credito}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Boton variante="secundario" ocupado={envio.enviando} onClick={guardar}>
          {envio.enviando ? 'Guardando…' : 'Guardar los datos de la foto'}
        </Boton>
        {alCancelar ? (
          <Boton variante="enlace" onClick={alCancelar}>
            Cancelar
          </Boton>
        ) : null}
      </div>
      <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
    </div>
  )
}
