// El esqueleto del servicio (E0.3 y E0.4) sin base y sin el build real: un build falso en una carpeta temporal (la
// plantilla con sus marcas, un asset, los .htaccess y el archivo de Search Console) y un render que no es React.
// Comprueba lo de los planes 2.4, 6.4, 6.5 y 9 que no necesita tablas: hosts, redirecciones, cabeceras, CSP, noindex
// por host, estáticos, robots, sitemap, errores sin stack y el armado del HTML. Lo que necesita la base (sesiones,
// contenido) se suma con E1 en ssr.test.js, auth.test.js y permisos.test.js.
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { crearApp, estaticosDelBuild } from '../app.js'
import { leerConfig } from '../config.js'
import { crearMuseoPublico } from '../museo.js'
import { cargarBuild, crearSsr, partir } from '../ssr.js'
import { CSP_PANEL } from '../seguridad.js'

const PLANTILLA = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <!--head-->
    <script type="module" crossorigin src="/assets/app-abc123.js"></script>
  </head>
  <body>
    <div id="root"><!--app--></div>
    <!--estado-->
  </body>
</html>
`
// Un render que deja en el HTML lo que haría una página: texto con $' $& $$ (que .replace() tomaría como patrones) y
// un dato del estado.
const ENTRADA = `export function render(estado) {
  return '<main data-pagina="' + estado.pagina + '"><p>' + "$' $& $$" + '</p></main>'
}
`

let carpeta
before(() => {
  carpeta = mkdtempSync(join(tmpdir(), 'mupa-esqueleto-'))
  mkdirSync(join(carpeta, 'client', 'assets'), { recursive: true })
  mkdirSync(join(carpeta, 'server'))
  writeFileSync(join(carpeta, 'client', 'index.html'), PLANTILLA)
  writeFileSync(join(carpeta, 'client', 'assets', 'app-abc123.js'), 'console.log(1)\n')
  writeFileSync(join(carpeta, 'client', 'assets', '.htaccess'), 'secreto\n')
  writeFileSync(join(carpeta, 'client', '.htaccess'), 'secreto\n')
  writeFileSync(join(carpeta, 'client', 'google19017c966a32aec2.html'), 'google-site-verification: x\n')
  writeFileSync(join(carpeta, 'server', 'entry-server.js'), ENTRADA)
  mkdirSync(join(carpeta, 'panel', 'assets'), { recursive: true })
  writeFileSync(join(carpeta, 'panel', 'assets', 'panel-abc123.js'), 'console.log(2)\n')
})
after(() => rmSync(carpeta, { recursive: true, force: true }))

// Producción con URL_PUBLICA en mupa.ar, que no acepta SIN_BASE: una DATABASE_URL que nunca se usa (crearApp no
// recibe sequelize, así /salud/base da 503, y el museo es el vacío de E0).
const BASE_QUE_NO_SE_USA = 'postgres://nadie:nada@127.0.0.1:1/no_se_usa'

/** Levanta la app en un puerto libre. */
async function levantar(env = {}, { museoPublico } = {}) {
  const config = leerConfig({
    NODE_ENV: 'production',
    URL_PUBLICA: 'https://mupa.ar/',
    RENDER_EXTERNAL_URL: 'https://mupa-web.onrender.com',
    DATABASE_URL: BASE_QUE_NO_SE_USA,
    DIR_BUILD: carpeta,
    ...env,
  })
  const build = await cargarBuild(config.DIR_BUILD)
  const ssr = crearSsr({ config, obtener: build.obtener, museoPublico: museoPublico ?? crearMuseoPublico(config) })
  const app = crearApp({ config, ssr, estaticos: estaticosDelBuild(config.DIR_BUILD), fechaHome: build.fecha })
  const servidor = app.listen(0, '127.0.0.1')
  await new Promise((r) => servidor.once('listening', r))
  return { puerto: servidor.address().port, cerrar: () => new Promise((r) => servidor.close(r)) }
}

/** Pedido HTTP con el Host y la ruta crudos (fetch no deja poner el Host). */
function pedir(puerto, ruta, { host = 'mupa.ar', metodo = 'GET', cabeceras = {} } = {}) {
  return new Promise((resolver, rechazar) => {
    const pedido = request(
      { host: '127.0.0.1', port: puerto, path: ruta, method: metodo, headers: { host, ...cabeceras } },
      (res) => {
        let cuerpo = ''
        res.setEncoding('utf8')
        res.on('data', (parte) => (cuerpo += parte))
        res.on('end', () => resolver({ status: res.statusCode, h: res.headers, cuerpo }))
      },
    )
    pedido.on('error', rechazar)
    pedido.end()
  })
}

const estadoDe = (html) => JSON.parse(html.match(/<script id="estado" type="application\/json">(.*?)<\/script>/s)[1])

describe('con CANONICO=0 (antes del corte)', () => {
  let s
  before(async () => (s = await levantar()))
  after(() => s.cerrar())

  test('/salud responde con cualquier host, sin base', async () => {
    const r = await pedir(s.puerto, '/salud', { host: 'cualquiera.example' })
    assert.equal(r.status, 200)
    assert.equal(r.h['cache-control'], 'no-store')
    assert.equal((await pedir(s.puerto, '/salud/base')).status, 503)
  })

  test('el host público: Home indexable, con GA4, canonical y CSP pública, sin cookies', async () => {
    const r = await pedir(s.puerto, '/')
    assert.equal(r.status, 200)
    assert.equal(r.h['x-robots-tag'], undefined)
    assert.equal(r.h['set-cookie'], undefined)
    assert.equal(r.h['cache-control'], 'no-cache')
    assert.ok(r.h.etag)
    assert.equal(r.h['x-powered-by'], undefined)
    assert.match(r.h['content-security-policy'], /script-src 'self' https:\/\/\*\.googletagmanager\.com/)
    assert.notEqual(r.h['content-security-policy'], CSP_PANEL)
    assert.doesNotMatch(r.h['content-security-policy'], /unsafe-inline' https:\/\/\*\.googletag|userway/)
    assert.match(r.h['strict-transport-security'], /^max-age=86400$/)
    assert.equal(r.h['referrer-policy'], 'strict-origin-when-cross-origin')
    assert.equal(r.h['x-content-type-options'], 'nosniff')
    assert.match(r.cuerpo, /<link rel="canonical" href="https:\/\/mupa\.ar\/" \/>/)
    assert.match(r.cuerpo, /<meta property="og:image" content="https:\/\/mupa\.ar\/og\.jpg" \/>/)
    assert.doesNotMatch(r.cuerpo, /name="robots"/)
    const ld = JSON.parse(r.cuerpo.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
    assert.equal(ld['@graph'][1]['@id'], 'https://mupa.ar/#museo')
    const estado = estadoDe(r.cuerpo)
    assert.equal(estado.pagina, 'home')
    assert.equal(estado.medir, true)
    assert.match(estado.hoy, /^\d{4}-\d{2}-\d{2}$/)
    // Concatenado, no .replace(): los $ del contenido quedan tal cual.
    assert.ok(r.cuerpo.includes(`<div id="root"><main data-pagina="home"><p>$' $& $$</p></main></div>`))
    assert.ok(!r.cuerpo.includes('<!--head-->') && !r.cuerpo.includes('<!--app-->') && !r.cuerpo.includes('<!--estado-->'))
  })

  test('otro host aceptado (Render, localhost): noindex en cabecera y meta, sin GA4, canonical igual', async () => {
    for (const host of ['mupa-web.onrender.com', 'localhost:5173', '127.0.0.1:5190']) {
      const r = await pedir(s.puerto, '/', { host })
      assert.equal(r.status, 200, host)
      assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', host)
      assert.match(r.cuerpo, /<meta name="robots" content="noindex, nofollow" \/>/)
      assert.match(r.cuerpo, /<link rel="canonical" href="https:\/\/mupa\.ar\/" \/>/)
      assert.equal(estadoDe(r.cuerpo).medir, false)
    }
  })

  test('un host ajeno o mal formado: 400', async () => {
    assert.equal((await pedir(s.puerto, '/', { host: 'evil.example' })).status, 400)
    assert.equal((await pedir(s.puerto, '/administracion/', { host: 'evil.example' })).status, 400)
    for (const host of ['127.0.0.1:5190@evil.example', 'localhost:80/x', 'localhost:abc', 'evil.example:5190']) {
      assert.equal((await pedir(s.puerto, '/', { host })).status, 400, host)
    }
  })

  test('el panel: su CSP, noindex también en mupa.ar, no-store y nada de la CSP pública', async () => {
    for (const ruta of ['/administracion', '/administracion/', '/administracion/usuarios/3', '/ADMINISTRACION']) {
      const r = await pedir(s.puerto, ruta)
      assert.equal(r.status, 200, ruta)
      assert.equal(r.h['content-security-policy'], CSP_PANEL, ruta)
      assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', ruta)
      assert.equal(r.h['cache-control'], 'no-store', ruta)
      assert.equal(r.h['x-frame-options'], 'DENY', ruta)
      assert.equal(r.h['set-cookie'], undefined, ruta)
      assert.doesNotMatch(r.cuerpo, /googletagmanager|userway|\/assets\//)
    }
    const api = await pedir(s.puerto, '/administracion/api/usuarios')
    assert.equal(api.status, 404)
    assert.match(api.h['content-type'], /application\/json/)
    assert.equal(api.h['content-security-policy'], CSP_PANEL)
    assert.deepEqual(Object.keys(JSON.parse(api.cuerpo)), ['error'])
    const asset = await pedir(s.puerto, '/administracion/assets/no-existe.js')
    assert.equal(asset.status, 404)
    assert.equal(asset.h['content-security-policy'], CSP_PANEL)
    assert.equal((await pedir(s.puerto, '/administracion/', { metodo: 'POST' })).status, 404)
  })

  test('los assets del panel: un año e immutable (no el no-store del resto del panel)', async () => {
    const r = await pedir(s.puerto, '/administracion/assets/panel-abc123.js')
    assert.equal(r.status, 200)
    assert.equal(r.h['cache-control'], 'public, max-age=31536000, immutable')
    assert.equal(r.h['content-security-policy'], CSP_PANEL)
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow')
  })

  test('el panel normaliza las barras: nada esquiva el router de la API', async () => {
    const casos = {
      '/administracion//api/x': '/administracion/api/x',
      '/administracion/\\api/x?a=1': '/administracion/api/x?a=1',
      '/administracion///usuarios//3/': '/administracion/usuarios/3/',
    }
    for (const [ruta, destino] of Object.entries(casos)) {
      const r = await pedir(s.puerto, ruta)
      assert.equal(r.status, 301, ruta)
      assert.equal(r.h.location, destino, ruta)
      assert.equal(r.h['content-security-policy'], CSP_PANEL, ruta)
    }
    const post = await pedir(s.puerto, '/administracion//api/sesion', { metodo: 'POST' })
    assert.equal(post.status, 404)
    assert.match(post.h['content-type'], /application\/json/)
  })

  test('redirecciones públicas: nunca un Location que empiece con //', async () => {
    const casos = {
      '/index.html': '/',
      '/index.html?a=1': '/?a=1',
      '/INDEX.HTML': '/',
      '/%69ndex.html': '/',
      '/preview': '/',
      '/preview/': '/',
      '/preview/algo/mas?x=1': '/',
      '//evil.com/': '/evil.com',
      '///evil.com': '/evil.com',
      '/\\evil.com/': '/evil.com',
      '/\\/evil.com': '/evil.com',
      '/a//b/': '/a/b',
      '/novedades/': '/novedades',
    }
    for (const [ruta, destino] of Object.entries(casos)) {
      const r = await pedir(s.puerto, ruta)
      assert.equal(r.status, 301, ruta)
      assert.equal(r.h.location, destino, ruta)
      assert.doesNotMatch(r.h.location, /^\/\/|^\/\\/, ruta)
    }
  })

  test('estáticos: assets un año, el archivo de Search Console 200, sin .htaccess ni la plantilla', async () => {
    const js = await pedir(s.puerto, '/assets/app-abc123.js')
    assert.equal(js.status, 200)
    assert.equal(js.h['cache-control'], 'public, max-age=31536000, immutable')
    const google = await pedir(s.puerto, '/google19017c966a32aec2.html')
    assert.equal(google.status, 200)
    assert.equal(google.h['cache-control'], 'no-cache')
    const falta = await pedir(s.puerto, '/assets/no-existe.js')
    assert.equal(falta.status, 404)
    assert.match(falta.h['content-type'], /text\/plain/)
    for (const ruta of ['/.htaccess', '/assets/.htaccess', '/assets']) {
      const r = await pedir(s.puerto, ruta)
      assert.equal(r.status, 404, ruta)
      assert.doesNotMatch(r.cuerpo, /secreto/, ruta)
    }
    // La plantilla nunca sale cruda, tampoco por rutas con segmentos de punto que serve-static resolvería.
    const conPuntos = ['/./index.html', '/%2e/index.html', '/x/../index.html', '/.%2findex.html', '/%2E%2E/index.html']
    const deWindows = ['/index.html::$DATA', '/INDEX~1.HTM', '/index.html.', '/index.html%20']
    for (const ruta of [...conPuntos, ...deWindows, '/assets/../index.html', '/assets/%2e%2e/index.html']) {
      const r = await pedir(s.puerto, ruta)
      assert.notEqual(r.status, 200, ruta)
      assert.ok(!r.cuerpo.includes('<!--head-->') && !r.cuerpo.includes('<!--app-->'), ruta)
    }
  })

  test('404 real con la página NoEncontrada, también /api fuera del panel', async () => {
    for (const ruta of ['/no-existe', '/api/usuarios', '/exposiciones']) {
      const r = await pedir(s.puerto, ruta)
      assert.equal(r.status, 404, ruta)
      assert.equal(estadoDe(r.cuerpo).pagina, 'no-encontrada', ruta)
      assert.match(r.cuerpo, /<meta name="robots" content="noindex, nofollow" \/>/)
      assert.doesNotMatch(r.cuerpo, /rel="canonical"/)
    }
  })

  test('HEAD de la Home sin cuerpo y 304 con el ETag', async () => {
    const head = await pedir(s.puerto, '/', { metodo: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(head.cuerpo, '')
    const r = await pedir(s.puerto, '/', { cabeceras: { 'if-none-match': head.h.etag } })
    assert.equal(r.status, 304)
  })

  test('robots.txt y sitemap.xml con la URL pública, sin /administracion', async () => {
    const robots = await pedir(s.puerto, '/robots.txt')
    assert.equal(robots.cuerpo, 'User-agent: *\nAllow: /\n\nSitemap: https://mupa.ar/sitemap.xml\n')
    const sitemap = await pedir(s.puerto, '/sitemap.xml')
    assert.match(sitemap.h['content-type'], /application\/xml/)
    assert.match(sitemap.cuerpo, /<loc>https:\/\/mupa\.ar\/<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    assert.doesNotMatch(sitemap.cuerpo, /administracion/)
  })
})

describe('con CANONICO=1 (desde el corte)', () => {
  let s
  before(async () => (s = await levantar({ CANONICO: '1' })))
  after(() => s.cerrar())

  test('otro host: 301 a https://mupa.ar con la misma ruta, también el panel', async () => {
    // En un solo salto: la misma normalización que las redirecciones públicas y las del panel.
    const casos = {
      '/': 'https://mupa.ar/',
      '/administracion/': 'https://mupa.ar/administracion/',
      '/administracion//api/x': 'https://mupa.ar/administracion/api/x',
      '/novedades?pagina=2': 'https://mupa.ar/novedades?pagina=2',
      '//evil.com/': 'https://mupa.ar/evil.com',
      '/\\evil.com': 'https://mupa.ar/evil.com',
      '/a//b/?q=1': 'https://mupa.ar/a/b?q=1',
      '/index.html?a=1': 'https://mupa.ar/?a=1',
      '/preview/x?y=1': 'https://mupa.ar/',
    }
    for (const host of ['mupa-web.onrender.com', 'www.mupa.ar', 'localhost:5173']) {
      for (const [ruta, destino] of Object.entries(casos)) {
        const r = await pedir(s.puerto, ruta, { host })
        assert.equal(r.status, 301, `${host}${ruta}`)
        assert.equal(r.h.location, destino, `${host}${ruta}`)
      }
    }
    assert.equal((await pedir(s.puerto, '/salud', { host: 'mupa-web.onrender.com' })).status, 200)
    assert.equal((await pedir(s.puerto, '/')).status, 200)
  })

  test('un Host mal formado: 400, no el 301', async () => {
    for (const host of ['127.0.0.1:5194@evil.com', 'localhost:80/x', 'localhost:abc', 'mupa.ar@evil.com', 'a_b.example']) {
      const r = await pedir(s.puerto, '/', { host })
      assert.equal(r.status, 400, host)
      assert.equal(r.h.location, undefined, host)
    }
    // El punto final del DNS es un host bien formado: va al canónico.
    const r = await pedir(s.puerto, '/a', { host: 'mupa.ar.' })
    assert.equal(r.status, 301)
    assert.equal(r.h.location, 'https://mupa.ar/a')
  })
})

describe('salida segura', () => {
  test('el estado y el JSON-LD escapan </script> y los separadores de línea', async () => {
    const malo = `</script><script>alert(1)</script> ${String.fromCharCode(0x2028)} <!-- $' $&`
    const s = await levantar({}, { museoPublico: async () => ({ direccion: malo }) })
    try {
      const r = await pedir(s.puerto, '/')
      assert.ok(!r.cuerpo.includes('<script>alert(1)'))
      assert.ok(!r.cuerpo.includes(String.fromCharCode(0x2028)))
      assert.equal(estadoDe(r.cuerpo).museo.direccion, malo)
    } finally {
      await s.cerrar()
    }
  })

  test('un error en el render da una página 500 simple, sin stack ni mensaje', async () => {
    const config = leerConfig({
      NODE_ENV: 'production',
      URL_PUBLICA: 'https://mupa.ar/',
      DATABASE_URL: BASE_QUE_NO_SE_USA,
      DIR_BUILD: carpeta,
    })
    const ssr = crearSsr({
      config,
      obtener: async () => ({ partes: partir(PLANTILLA), render: () => { throw new Error('detalle-interno en /ruta/secreta.js') } }),
      museoPublico: async () => ({}),
    })
    const app = crearApp({ config, ssr, estaticos: () => {} })
    const servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    const errorOriginal = console.error
    console.error = () => {}
    try {
      const r = await pedir(servidor.address().port, '/')
      assert.equal(r.status, 500)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.doesNotMatch(r.cuerpo, /detalle-interno|secreta|at |Error/)
      assert.doesNotMatch(r.cuerpo, /<script/)
    } finally {
      console.error = errorOriginal
      await new Promise((r) => servidor.close(r))
    }
  })
})

describe('plantilla', () => {
  test('partir exige las tres marcas, una vez cada una y en orden', () => {
    assert.equal(partir('a<!--head-->b<!--app-->c<!--estado-->d').join('|'), 'a|b|c|d')
    assert.equal(partir('<!--head--><!--app--><!--estado-->').join('|'), '|||')
    assert.throws(() => partir('a<!--head-->b<!--app-->c'), /<!--estado-->/)
    assert.throws(() => partir('<!--app--><!--head--><!--app--><!--estado-->'), /<!--app-->/)
    assert.throws(() => partir('<!--head--><!--app--><!--estado--><!--head-->'), /<!--head-->/)
  })
})

describe('configuración', () => {
  test('en producción exige URL_PUBLICA, base y CORREO_MODO=smtp, sin mostrar valores', () => {
    assert.throws(() => leerConfig({ NODE_ENV: 'production', SIN_BASE: '1' }), /URL_PUBLICA/)
    assert.throws(() => leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/' }), /DATABASE_URL/)
    // La prueba de producción en local (.env.example): con CORREO_MODO=consola no arranca, con smtp (o sin definir) sí.
    const local = { NODE_ENV: 'production', URL_PUBLICA: 'http://127.0.0.1:5190/', SIN_BASE: '1' }
    assert.throws(() => leerConfig({ ...local, CORREO_MODO: 'consola' }), /CORREO_MODO/)
    assert.equal(leerConfig({ ...local, CORREO_MODO: 'smtp' }).correoModo, 'smtp')
    assert.equal(leerConfig(local).correoModo, 'smtp')
    assert.throws(() => leerConfig({ URL_PUBLICA: 'https://mupa.ar' }), /barra final/)
    assert.throws(() => leerConfig({ URL_PUBLICA: 'https://mupa.ar/x/' }), /barra final/)
    assert.throws(() => leerConfig({ TRUST_PROXY: 'true' }), /TRUST_PROXY/)
    assert.throws(() => leerConfig({ URL_PUBLICA: 'https://alguien@mupa.ar/' }), /URL_PUBLICA/)
    assert.throws(() => leerConfig({ URL_PUBLICA: 'https://a:b@mupa.ar/' }), /URL_PUBLICA/)
    // En Render: nunca el museo de ejemplo ni http. En esta PC, la prueba de producción con SIN_BASE sigue andando.
    const render = { NODE_ENV: 'production', RENDER: 'true', DATABASE_URL: 'postgres://u:p@h/b' }
    assert.throws(() => leerConfig({ ...render, URL_PUBLICA: 'https://mupa.ar/', SIN_BASE: '1' }), /SIN_BASE/)
    assert.throws(
      () => leerConfig({ ...render, URL_PUBLICA: 'https://mupa-web.onrender.com/', SIN_BASE: 'vacio' }),
      /SIN_BASE: .*nunca en Render/,
    )
    // Con URL_PUBLICA en mupa.ar (o un subdominio), tampoco, aunque no esté RENDER y en cualquier entorno.
    for (const URL_PUBLICA of ['https://mupa.ar/', 'https://www.mupa.ar/', 'https://MUPA.AR/', 'https://mupa.ar./']) {
      assert.throws(
        () => leerConfig({ NODE_ENV: 'production', URL_PUBLICA, SIN_BASE: '1' }),
        /SIN_BASE: .*nunca con URL_PUBLICA en mupa\.ar/,
        URL_PUBLICA,
      )
      assert.throws(() => leerConfig({ URL_PUBLICA, SIN_BASE: 'vacio' }), /SIN_BASE/, URL_PUBLICA)
    }
    assert.doesNotThrow(() => leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://nomupa.ar/', SIN_BASE: '1' }))
    assert.throws(() => leerConfig({ ...render, URL_PUBLICA: 'http://mupa.ar/' }), /https/)
    assert.doesNotThrow(() => leerConfig({ ...render, URL_PUBLICA: 'https://mupa.ar/' }))
    assert.doesNotThrow(() => leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'http://127.0.0.1:5190/', SIN_BASE: '1' }))
    try {
      leerConfig({ DATABASE_URL: 'mysql://usuario:clave-secreta@host/base' })
      assert.fail('tenía que negarse')
    } catch (err) {
      assert.match(err.message, /DATABASE_URL/)
      assert.doesNotMatch(err.message, /clave-secreta/)
    }
  })

  test('en desarrollo arranca sin nada: localhost, sin base, correo por consola', () => {
    const c = leerConfig({})
    assert.equal(c.urlPublica, 'http://localhost:5300/')
    assert.equal(c.hostPublico, 'localhost:5300')
    assert.equal(c.hayBase, false)
    assert.equal(c.correoModo, 'consola')
    assert.equal(c.host, '127.0.0.1')
    assert.equal(c.TRUST_PROXY, 0)
    assert.equal(leerConfig({ RENDER: 'true' }).host, '0.0.0.0')
    assert.equal(leerConfig({ USERWAY_ID: '' }).USERWAY_ID, undefined)
  })
})
