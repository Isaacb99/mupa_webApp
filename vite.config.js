import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Sitio público (plan 2.2 y 2.3). npm run build hace dos builds con esta configuración:
// - el del navegador, en dist/client: la plantilla index.html (con las marcas que llena server/ssr.js), assets/ con
//   hash y lo de public/;
// - el del servidor (--ssr src/entry-server.jsx), en dist/server/entry-server.js, que Express importa al arrancar.
// Con base '/' los dos generan las mismas URL (/assets/nombre-hash.ext) para lo que importa el código, así lo que
// renderiza el servidor coincide con lo que hidrata el navegador. Por eso ya no hacen falta renderBuiltUrl (la base
// relativa './' era para servir la landing estática desde una subcarpeta de Hostinger), ni urlDelSitio, ni
// paraBuscadores, ni noIndexar: el canonical, las etiquetas OG, el JSON-LD, robots.txt, sitemap.xml y el noindex los
// pone el servidor según el host (server/seo.js y server/seguridad.js). La landing estática sigue en la rama landing.
// El panel tiene su propia configuración (vite.panel.config.js, base '/administracion/', raíz panel/, build en
// dist/panel): nada del panel entra en este bundle.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  base: '/',
  // public/ (favicon, og.jpg, el archivo de Search Console) va solo al build del navegador.
  build: { copyPublicDir: !isSsrBuild },
  // Solo en desarrollo: el pre-empaquetado de dependencias arranca de la entrada del sitio. Si no, Vite recorre todos
  // los .html de la carpeta, también panel/index.html (y las copias de tools/salida), y empaqueta lo del panel acá.
  optimizeDeps: { entries: ['index.html'] },
}))
