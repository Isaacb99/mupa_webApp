import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { RUTA_PANEL } from './compartido/panel.js'

// Panel de administración (plan 2.2, 2.3 y 5.1): una SPA aparte, con su raíz en panel/ y publicada en /administracion.
// - npm run build la deja en dist/panel (index.html y assets/ con hash; las URL empiezan con /administracion/), que
//   sirve Express (server/panel.js). El build del sitio (dist/client) no la toca ni la incluye.
// - npm run dev la levanta adentro de Express, en middlewareMode (server/dev.js): http://localhost:5300/administracion/.
// - Su propia caché de dependencias (node_modules/.vite-panel): con la de siempre (node_modules/.vite), los dos Vite
//   de npm run dev se pisaban el pre-empaquetado.
// - Tailwind escanea solo panel/src (panel/src/panel.css, source(".")); el panel no usa el estilo del sitio.
// - Puede importar código puro de compartido/ (RUTA_PANEL, los esquemas): Vite deja servir lo que está dentro de la
//   carpeta del proyecto.
const aca = (ruta) => fileURLToPath(new URL(ruta, import.meta.url))

export default defineConfig({
  root: aca('./panel'),
  base: `${RUTA_PANEL}/`,
  publicDir: aca('./panel/public'),
  cacheDir: aca('./node_modules/.vite-panel'),
  plugins: [react(), tailwindcss()],
  build: {
    outDir: aca('./dist/panel'),
    // Está fuera de la raíz (panel/): sin esto Vite no la vacía.
    emptyOutDir: true,
  },
})
