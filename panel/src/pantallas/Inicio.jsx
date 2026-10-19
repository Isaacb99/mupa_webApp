// Inicio (plan 5.2 y 8): avisos, "Para completar" y accesos directos, con lo que devuelve GET /administracion/api/estado
// (server/api/estado.js: códigos, no textos; los textos y los enlaces están acá). Desde E3.1, el aviso de espacio: las
// fotos van en la base y, desde el 80 % del espacio contratado (ESPACIO_BASE_MB), el Inicio lo dice.
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { api } from '../api.js'
import { Aviso, AvisoDeLlegada } from '../componentes/Aviso.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { borrarAviso, leerAviso, useSesion } from '../sesion.jsx'

/** El loader (rutas.jsx lo envuelve con la sesión). */
export const cargarInicio = ({ request }) => api.get('/estado', { signal: request.signal })

const PARA_COMPLETAR = {
  direccion: { texto: 'La dirección del museo', a: '/museo', donde: 'Datos del museo' },
  telefono: { texto: 'El teléfono', a: '/museo', donde: 'Datos del museo' },
  emailPublico: { texto: 'El correo público (el que se muestra en el sitio)', a: '/museo', donde: 'Datos del museo' },
  emailDestinoContacto: {
    texto: 'El correo al que llegan los mensajes del formulario de contacto',
    a: '/museo',
    donde: 'Datos del museo',
  },
  horario: { texto: 'El horario de visita: todavía no hay ningún día abierto', a: '/visitas', donde: 'Visitas' },
  tarifas: { texto: 'Las tarifas: todavía no hay ninguna visible', a: '/visitas', donde: 'Visitas' },
}

// Las tareas diarias (server/tareas.js, NOMBRES).
const TAREAS = {
  sesiones_vencidas: 'Borrar las sesiones vencidas',
  fotos_huerfanas: 'Borrar las fotos subidas que no se usan',
}

/** Desde qué parte del espacio de la base avisa el Inicio (las fotos van en la base). */
const AVISO_ESPACIO = 0.8

/** El porcentaje ocupado (entero) si pasa el aviso, o null. */
function espacioPorLlenarse(espacio) {
  if (!espacio?.totalMb) return null
  const parte = espacio.usadoMb / espacio.totalMb
  return parte >= AVISO_ESPACIO ? Math.round(parte * 100) : null
}

const fecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Argentina/San_Juan',
})

const ACCESOS = [
  { a: '/novedades', titulo: 'Novedades', texto: 'Noticias y actividades: talleres, charlas, visitas especiales.' },
  { a: '/exposiciones', titulo: 'Exposiciones', texto: 'Las muestras y las salas del museo, y su orden.' },
  { a: '/visitas', titulo: 'Visitas', texto: 'Horarios, tarifas, avisos de cierre y compra de entradas.' },
  { a: '/museo', titulo: 'Datos del museo', texto: 'Dirección, teléfono, correos, mapa y redes.' },
  { a: '/usuarios', titulo: 'Usuarios', texto: 'Cuentas del panel, roles y contraseñas temporales.', rol: 'admin' },
  { a: '/cuenta', titulo: 'Mi cuenta', texto: 'Tu nombre y tu contraseña.' },
]

export default function Inicio() {
  const estado = useLoaderData()
  const sesion = useSesion()
  const esAdmin = sesion?.usuario.rol === 'admin'
  const [aviso] = useState(leerAviso)
  useEffect(() => borrarAviso(), [])
  const faltan = estado.paraCompletar.filter((codigo) => PARA_COMPLETAR[codigo])
  const lleno = espacioPorLlenarse(estado.espacio)

  return (
    <>
      <Encabezado titulo="Inicio" />
      <AvisoDeLlegada texto={aviso} className="mb-6" />
      <p className="mb-8 text-lg">Hola, {sesion?.usuario.nombre}.</p>

      <div className="grid gap-4">
        {lleno != null ? (
          <Aviso
            tipo="atencion"
            titulo={lleno >= 100 ? 'La base de datos está llena' : 'La base de datos se está llenando'}
          >
            <p>
              Ocupa {estado.espacio.usadoMb} MB de {estado.espacio.totalMb} MB ({lleno} %). Las fotos son lo que más
              ocupa. Si se llena, no se van a poder subir fotos ni guardar cambios: avisale a quien mantiene el sitio
              para que amplíe el espacio.
            </p>
          </Aviso>
        ) : null}
        {estado.tareasFallidas.map((t) => (
          <Aviso key={t.tarea} tipo="atencion" titulo="Una tarea automática del sitio está fallando">
            <p>
              La tarea diaria «{TAREAS[t.tarea] ?? t.tarea}» viene fallando desde el {fecha.format(new Date(t.desde))}
              {t.codigo ? ` (código ${t.codigo})` : ''}. El sitio sigue andando; si el aviso sigue mañana, avisale a
              quien mantiene el sitio.
            </p>
          </Aviso>
        ))}
        {estado.unSoloAdmin ? (
          <Aviso tipo="atencion" titulo="Hay un solo administrador">
            {esAdmin ? (
              <p>
                Si esa cuenta no puede entrar, nadie puede dar de alta usuarios ni dar contraseñas temporales. Lo
                recomendable son dos: <Link to="/usuarios">hacé administradora a otra persona en Usuarios</Link>.
              </p>
            ) : (
              <p>
                Lo recomendable son dos, por si esa persona no puede entrar. Si hace falta, pedile al administrador
                que sume a alguien más.
              </p>
            )}
          </Aviso>
        ) : null}
      </div>

      <section aria-labelledby="para-completar" className="mt-10">
        <h2 id="para-completar" className="text-2xl font-bold">
          Para completar
        </h2>
        {faltan.length ? (
          <>
            <p className="mt-2 text-tenue">El sitio todavía no tiene estos datos:</p>
            <ul className="mt-3 grid gap-2">
              {faltan.map((codigo) => {
                const item = PARA_COMPLETAR[codigo]
                return (
                  <li
                    key={codigo}
                    className="flex flex-wrap items-center justify-between gap-x-4 rounded-md border-2 border-suave px-4 py-1"
                  >
                    <p className="py-2">{item.texto}.</p>
                    <Link to={item.a} className="inline-flex min-h-11 items-center">
                      Completar en {item.donde}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="mt-2">Están cargados los datos básicos del museo, el horario y las tarifas.</p>
        )}
      </section>

      <section aria-labelledby="formulario-contacto" className="mt-10">
        <h2 id="formulario-contacto" className="text-2xl font-bold">
          Formulario de contacto
        </h2>
        {estado.correo.estado === 'sin_configurar' ? (
          <p className="mt-2">
            El envío por correo de los mensajes del formulario de contacto todavía no está configurado. Lo configura
            quien mantiene el sitio: vos no tenés que hacer nada.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="accesos" className="mt-10">
        <h2 id="accesos" className="text-2xl font-bold">
          Accesos directos
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCESOS.filter((a) => !a.rol || esAdmin).map((a) => (
            <li key={a.a} className="rounded-md border-2 border-suave p-4">
              <Link to={a.a} className="inline-flex min-h-11 items-center text-lg font-bold">
                {a.titulo}
              </Link>
              <p className="mt-1 text-tenue">{a.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
