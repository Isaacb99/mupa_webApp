// Lo que muestra el formulario de una ficha y lo que se manda (E3.3 y E3.4). Código sin React ni DOM (lo prueba
// server/pruebas/panel-api.test.js).
// - valoresDe(tipo, ficha): lo que devolvió la API, para los campos (null pasa a ""; el texto con formato, su JSON).
// - cuerpoDe(tipo, valores, portada): el cuerpo del PUT /<tipo>/:id (el esquema completo), con lo que no corresponde
//   al tipo vacío (como lo guarda el servidor), las direcciones completadas (completarHttps, completarEnlaces) y la
//   dirección web vacía en null (el servidor la arma con el título).
// - comparable(tipo, cuerpo): lo que se compara para saber si hay cambios sin guardar: lo que guardaría el servidor
//   (el esquema: textos recortados, vacíos en null, el texto con formato en su forma canónica), o el cuerpo tal cual
//   si todavía no es válido. Así un espacio de más, el párrafo vacío que agrega el editor o las claves del jsonb en
//   otro orden no cuentan como cambios.
// - fusionarGuardado(tipo, actuales, enviados, ficha): los valores del formulario después de guardar. Lo que devolvió la
//   API va solo en los campos que no cambiaron desde que salió el pedido; lo que se escribió mientras se guardaba queda
//   (y sigue como cambio sin guardar). Antes se reemplazaba todo y lo escrito en el texto durante el guardado se perdía
//   sin aviso (corrección de E3, 16/10/2026).
import { completarHttps } from '../../../../compartido/esquemas/campos.js'
import { ESQUEMAS_CONTENIDO } from '../../../../compartido/esquemas/contenido.js'
import { completarEnlaces } from '../../../../compartido/esquemas/textoRico.js'
import { CONTENIDOS } from '../../contenidos.js'
import { aTexto } from '../../formato.js'

/** Los campos de la API de cada tipo (ResumenErrores y repartirError); "fotos" es la galería. */
export const CAMPOS_FICHA = Object.freeze({
  novedades: [
    'tipo',
    'titulo',
    'resumen',
    'eventoInicio',
    'eventoFin',
    'lugar',
    'costo',
    'enlaceInscripcion',
    'portadaId',
    'cuerpo',
    'fotos',
    'slug',
  ],
  muestras: ['tipo', 'titulo', 'fechaInicio', 'fechaFin', 'salaId', 'resumen', 'portadaId', 'descripcion', 'fotos', 'slug'],
  salas: ['nombre', 'resumen', 'portadaId', 'descripcion', 'slug'],
})

/** Cómo se llama cada campo en el resumen de errores. */
export const ETIQUETAS_FICHA = Object.freeze({
  tipo: 'Tipo',
  titulo: 'Título',
  nombre: 'Nombre',
  resumen: 'Resumen',
  eventoInicio: 'Empieza',
  eventoFin: 'Termina',
  lugar: 'Lugar',
  costo: 'Costo',
  enlaceInscripcion: 'Enlace de inscripción',
  fechaInicio: 'Fecha de inicio',
  fechaFin: 'Fecha de fin',
  salaId: 'Sala',
  portadaId: 'Portada',
  cuerpo: 'Texto de la novedad',
  descripcion: 'Descripción',
  fotos: 'Galería',
  slug: 'Dirección web',
})

/**
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {Record<string, any>} ficha  como la devuelve la API
 */
export function valoresDe(tipo, ficha) {
  const c = CONTENIDOS[tipo]
  const valores = {
    [c.campoTitulo]: aTexto(ficha[c.campoTitulo]),
    resumen: aTexto(ficha.resumen),
    slug: aTexto(ficha.slug),
    texto: ficha[c.campoTexto] ?? null,
  }
  if (tipo === 'novedades') {
    Object.assign(valores, {
      tipo: ficha.tipo,
      eventoInicio: aTexto(ficha.eventoInicio),
      eventoFin: aTexto(ficha.eventoFin),
      lugar: aTexto(ficha.lugar),
      costo: aTexto(ficha.costo),
      enlaceInscripcion: aTexto(ficha.enlaceInscripcion),
    })
  }
  if (tipo === 'muestras') {
    Object.assign(valores, {
      tipo: ficha.tipo,
      fechaInicio: aTexto(ficha.fechaInicio),
      fechaFin: aTexto(ficha.fechaFin),
      salaId: ficha.salaId == null ? '' : String(ficha.salaId),
    })
  }
  return valores
}

const oNull = (texto) => (texto === '' ? null : texto)

/**
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {Record<string, any>} v  los valores del formulario
 * @param {{ id: number } | null} portada
 */
export function cuerpoDe(tipo, v, portada) {
  const c = CONTENIDOS[tipo]
  const comun = {
    slug: oNull(v.slug.trim()),
    resumen: v.resumen,
    portadaId: portada?.id ?? null,
    [c.campoTexto]: completarEnlaces(v.texto ?? null),
  }
  if (tipo === 'novedades') {
    const actividad = v.tipo === 'actividad'
    return {
      tipo: v.tipo,
      titulo: v.titulo,
      ...comun,
      eventoInicio: actividad ? oNull(v.eventoInicio) : null,
      eventoFin: actividad ? oNull(v.eventoFin) : null,
      lugar: actividad ? v.lugar : null,
      costo: actividad ? v.costo : null,
      enlaceInscripcion: actividad ? completarHttps(v.enlaceInscripcion) : null,
    }
  }
  if (tipo === 'muestras') {
    const temporal = v.tipo === 'temporal'
    return {
      tipo: v.tipo,
      titulo: v.titulo,
      ...comun,
      fechaInicio: temporal ? oNull(v.fechaInicio) : null,
      fechaFin: temporal ? oNull(v.fechaFin) : null,
      salaId: v.salaId === '' ? null : Number(v.salaId),
    }
  }
  return { nombre: v.nombre, ...comun }
}

/**
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {Record<string, unknown>} cuerpo  el de cuerpoDe
 */
export function comparable(tipo, cuerpo) {
  const r = ESQUEMAS_CONTENIDO[tipo].cambio.safeParse(cuerpo)
  return r.success ? r.data : cuerpo
}

/**
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {Record<string, any>} actuales  los valores del formulario ahora
 * @param {Record<string, any>} enviados  los valores cuando salió el pedido
 * @param {Record<string, any>} ficha  lo que devolvió la API
 * @returns {Record<string, any>}  los valores nuevos (el mismo objeto si no cambia nada)
 */
export function fusionarGuardado(tipo, actuales, enviados, ficha) {
  const delServidor = valoresDe(tipo, ficha)
  let cambio = false
  const valores = { ...actuales }
  for (const [campo, valor] of Object.entries(delServidor)) {
    // El texto con formato es un objeto: si es el mismo que se mandó, no se tocó.
    if (actuales[campo] !== enviados[campo] || actuales[campo] === valor) continue
    valores[campo] = valor
    cambio = true
  }
  return cambio ? valores : actuales
}
