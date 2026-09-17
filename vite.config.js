import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' = rutas relativas: funciona en la raiz del dominio y en una subcarpeta (preview en Hostinger)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
