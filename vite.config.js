import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vista previa para el museo (npm run build:preview -> dist-preview/): igual al build normal, pero con noindex para que
// los buscadores no la muestren. El build de producción (npm run build -> dist/) no lo lleva.
const noIndexar = () => ({
  name: 'no-indexar',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }],
})

// URL pública del sitio según el build, para el canonical y las etiquetas OG del index.html (necesitan URL absolutas):
// producción en la raíz del dominio y la vista previa en su subcarpeta. En desarrollo queda la de producción.
const URL_SITIO = { 'vista-previa': 'https://mupa.ar/preview/' }
const urlDelSitio = (mode) => ({
  name: 'url-del-sitio',
  transformIndexHtml: (html) => html.replaceAll('__SITIO_URL__', URL_SITIO[mode] ?? 'https://mupa.ar/'),
})

// base './' = rutas relativas: funciona en la raiz del dominio y en una subcarpeta (preview en Hostinger)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), urlDelSitio(mode), mode === 'vista-previa' && noIndexar()],
  base: './',
}))
