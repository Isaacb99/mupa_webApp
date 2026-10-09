import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vista previa para el museo (npm run build:preview -> dist-preview/): igual al build normal, pero con noindex para que
// los buscadores no la muestren. El build de producción (npm run build -> dist/) no lo lleva.
const noIndexar = () => ({
  name: 'no-indexar',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }],
})

// URL pública del sitio según el build, para el canonical, las etiquetas OG y los datos estructurados del index.html
// (necesitan URL absolutas): producción en la raíz del dominio y la vista previa en su subcarpeta. En desarrollo queda
// la de producción.
const URL_SITIO = { 'vista-previa': 'https://mupa.ar/preview/' }
const URL_PRODUCCION = 'https://mupa.ar/'
const urlDelSitio = (mode) => ({
  name: 'url-del-sitio',
  transformIndexHtml: (html) => html.replaceAll('__SITIO_URL__', URL_SITIO[mode] ?? URL_PRODUCCION),
})

// robots.txt y sitemap.xml, solo en el build de producción (los buscadores los leen en la raíz del dominio: en la
// carpeta de la vista previa no harían nada). robots.txt deja pasar todo, también /preview/: esa página se excluye con
// su noindex, y para leerlo el buscador tiene que poder entrar (bloqueada en robots.txt podría aparecer igual, sin
// descripción). El sitemap lleva la fecha del build como última modificación.
const paraBuscadores = (mode) => {
  let prerender = false
  return {
    name: 'para-buscadores',
    apply: 'build',
    configResolved: (config) => {
      prerender = Boolean(config.build.ssr)
    },
    generateBundle() {
      if (mode !== 'production' || prerender) return
      const hoy = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${URL_PRODUCCION}sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <url>\n    <loc>${URL_PRODUCCION}</loc>\n    <lastmod>${hoy}</lastmod>\n  </url>\n` +
          '</urlset>\n',
      })
    },
  }
}

// base './' = rutas relativas: funciona en la raiz del dominio y en una subcarpeta (preview en Hostinger)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), urlDelSitio(mode), paraBuscadores(mode), mode === 'vista-previa' && noIndexar()],
  base: './',
  experimental: {
    // Las fotos y los SVG que importa el código salen como "./assets/nombre-hash.ext", relativas a la página, tanto en
    // el build del navegador como en el del prerender (tools/prerender.mjs). Sin esto Vite las resolvía distinto en cada
    // uno: en el navegador, absolutas a partir del archivo JS (new URL(..., import.meta.url)), y en el prerender,
    // "/assets/...", que en la vista previa (mupa.ar/preview/) apunta a la raíz del dominio. Con la misma cadena en
    // los dos, React adopta el HTML sin diferencias. Dentro del CSS y del HTML siguen relativas a cada archivo.
    renderBuiltUrl: (archivo, { hostType }) => (hostType === 'js' ? `./${archivo}` : { relative: true }),
  },
}))
