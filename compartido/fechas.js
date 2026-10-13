// Fechas del sitio (plan 6.2). Código puro: sin APIs de Node ni del DOM.
// "Hoy" se calcula SOLO en el servidor y viaja en el estado de la página: si el navegador lo calculara al renderizar,
// cerca de la medianoche (o con otra zona horaria) dibujaría otra cosa que el HTML del servidor y la hidratación
// fallaría. Los formatos para mostrar (meses y días propios, sin toLocaleDateString) se suman con las páginas de E4.

const ZONA = 'America/Argentina/San_Juan'
// en-CA da AAAA-MM-DD, el formato de las columnas DATEONLY.
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })

/** Día de hoy en San Juan como "AAAA-MM-DD". */
export function hoyEnSanJuan(fecha = new Date()) {
  return formatoDia.format(fecha)
}
