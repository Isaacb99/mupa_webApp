import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vista previa para el museo (npm run build:preview -> dist-preview/): igual al build normal, pero con noindex para que
// los buscadores no la muestren. El build de producción (npm run build -> dist/) no lo lleva.
const noIndexar = () => ({
  name: 'no-indexar',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }],
})

// base './' = rutas relativas: funciona en la raiz del dominio y en una subcarpeta (preview en Hostinger)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), mode === 'vista-previa' && noIndexar()],
  base: './',
}))
