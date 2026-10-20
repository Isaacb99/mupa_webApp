// Datos del museo (E2.3; plan 3.2, 4.3, 5.3 y 6.2): el esquema del PUT, la API GET y PUT /museo y el museo público
// que va en el estado de las páginas (server/museo.js, leerMuseo), que nunca lleva el correo de destino.
// Sin base: el esquema, cómo se arma el museo público y el "último museo bueno". Con base: la API y la Home.
// Que /museo pide sesión, el 403 del editor con el correo de destino y el 200 del admin están en permisos.test.js.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { completarHttps, MENSAJE_HTTPS } from '../../compartido/esquemas/campos.js'
import { esquemaCambioMuseo, problemasDeMuseo, srcDelMapa } from '../../compartido/esquemas/museo.js'
import {
  armarMuseoPublico,
  crearMuseoPublico,
  leerMuseo,
  MUSEO_MAXIMO,
  MUSEO_VACIO,
  vecesQueSeValidaronLosTextos,
} from '../museo.js'
import { cerrarBase, escucharLogs, levantar, prepararBase, salteoVisible, sql } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

/** Los problemas de un cuerpo para el PUT ({ campo: mensaje }), o los datos si es válido. */
function validar(cuerpo) {
  const r = esquemaCambioMuseo.safeParse(cuerpo)
  if (r.success) return { datos: r.data }
  const campos = {}
  for (const i of r.error.issues) campos[i.path.join('.') || '_'] ??= i.message
  return { campos }
}

const EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3400!2d-68.5!3d-31.5'

describe('el esquema de PUT /museo (sin base)', () => {
  test('textos: "" y solo espacios pasan a null, se recortan y respetan el largo de la tabla', () => {
    assert.deepEqual(validar({ direccion: '   ', localidad: '', telefono: '  +54 264 000-0000 ' }).datos, {
      direccion: null,
      localidad: null,
      telefono: '+54 264 000-0000',
    })
    assert.deepEqual(validar({ direccion: null }).datos, { direccion: null })
    assert.ok(validar({ direccion: 'x'.repeat(200) }).datos)
    for (const [campo, max] of [
      ['direccion', 200],
      ['localidad', 100],
      ['provincia', 60],
      ['codigoPostal', 10],
      ['telefono', 40],
      ['compraTexto', 40],
      ['avisoTexto', 200],
      ['notaHorarios', 300],
      ['notaTarifas', 300],
    ]) {
      assert.match(
        validar({ [campo]: 'x'.repeat(max + 1) }).campos[campo],
        new RegExp(`hasta ${max} caracteres`),
        campo,
      )
    }
    // Una sola línea, salvo las notas (que unifican los saltos de línea).
    assert.ok(validar({ telefono: 'uno\ndos' }).campos.telefono)
    assert.deepEqual(validar({ notaHorarios: 'Uno\r\ndos\rtres' }).datos, { notaHorarios: 'Uno\ndos\ntres' })
    assert.ok(validar({ direccion: 'Calle � 1' }).campos.direccion)
  })

  test('correos: en minúsculas; uno inválido, 400 en su campo', () => {
    assert.deepEqual(
      validar({ emailPublico: ' Museo@Example.COM ', emailDestinoContacto: 'Alguien@Gmail.com' }).datos,
      {
        emailPublico: 'museo@example.com',
        emailDestinoContacto: 'alguien@gmail.com',
      },
    )
    assert.ok(validar({ emailPublico: 'no es un correo' }).campos.emailPublico)
  })

  test('URL: solo https://, completas y sin comillas ni espacios', () => {
    for (const malo of [
      'http://example.com/x',
      'javascript:alert(1)',
      'https://museo',
      'example.com',
      'https://a.com/x y',
      'https://a.com/"x',
      'https://u:p@a.com/',
    ]) {
      assert.equal(validar({ mapaUrl: malo }).campos?.mapaUrl, MENSAJE_HTTPS, malo)
      assert.ok(validar({ compraUrl: malo }).campos?.compraUrl, malo)
      assert.ok(validar({ redes: [{ red: 'instagram', url: malo }] }).campos?.['redes.0.url'], malo)
    }
    assert.deepEqual(validar({ mapaUrl: 'https://maps.app.goo.gl/abc123' }).datos, {
      mapaUrl: 'https://maps.app.goo.gl/abc123',
    })
  })

  test('URL: el mensaje dice cómo tiene que ser, con un ejemplo', () => {
    assert.match(MENSAJE_HTTPS, /empiece con https:\/\//)
    assert.match(MENSAJE_HTTPS, /por ejemplo https:\/\/www\.instagram\.com\/museo/)
  })

  test('completarHttps (el panel, al salir del campo y al guardar): https:// adelante solo si parece un dominio', () => {
    const casos = {
      'www.instagram.com/museo': 'https://www.instagram.com/museo',
      'instagram.com/museo': 'https://instagram.com/museo',
      '  facebook.com/MuseoPaleo?ref=1 ': 'https://facebook.com/MuseoPaleo?ref=1',
      'www.tiktok.com/@mupa': 'https://www.tiktok.com/@mupa',
      'maps.app.goo.gl/abc123': 'https://maps.app.goo.gl/abc123',
      'museo.gob.ar': 'https://museo.gob.ar',
      'ñandú.com.ar/x': 'https://ñandú.com.ar/x',
    }
    for (const [pegada, completa] of Object.entries(casos)) {
      assert.equal(completarHttps(pegada), completa, pegada)
      // Y lo que queda es una dirección que el esquema acepta.
      assert.deepEqual(validar({ mapaUrl: completarHttps(pegada) }).datos, { mapaUrl: completa }, pegada)
    }
    // Lo demás queda como estaba (y el esquema dice qué falta).
    for (const igual of [
      'https://instagram.com/x',
      'HTTPS://instagram.com/x',
      'http://instagram.com/x',
      'museo',
      'nombre@dominio.com',
      'instagram.com/museo y más',
      'javascript:alert(1)',
      '//instagram.com/x',
      '1.2.3.4',
      '',
      '   ',
    ]) {
      assert.equal(completarHttps(igual), igual, igual)
    }
    assert.equal(completarHttps(null), null)
    // La API no lo hace: sin https:// sigue siendo un error.
    assert.equal(validar({ mapaUrl: 'instagram.com/museo' }).campos?.mapaUrl, MENSAJE_HTTPS)
  })

  test('URL: el esquema en mayúsculas se guarda en minúsculas (los CHECK de la tabla distinguen mayúsculas)', () => {
    for (const pegada of ['HTTPS://example.com/x', 'Https://example.com/x', ' hTTps://example.com/x ']) {
      assert.deepEqual(
        validar({ mapaUrl: pegada, compraUrl: pegada, redes: [{ red: 'instagram', url: pegada }] }).datos,
        {
          mapaUrl: 'https://example.com/x',
          compraUrl: 'https://example.com/x',
          redes: [{ red: 'instagram', url: 'https://example.com/x' }],
        },
        pegada,
      )
    }
    // Solo el esquema: el resto de la dirección queda como vino.
    assert.equal(validar({ mapaUrl: 'HTTPS://Example.com/Ruta?Q=A' }).datos.mapaUrl, 'https://Example.com/Ruta?Q=A')
    assert.equal(validar({ mapaEmbedUrl: EMBED.replace('https', 'HTTPS') }).datos.mapaEmbedUrl, EMBED)
  })

  test('URL: sin caracteres invisibles ni de control (NUL, espacio de ancho cero, surrogates), con su mensaje', () => {
    // NUL, otro de control, el espacio de ancho cero, la marca de izquierda a derecha, un surrogate suelto, U+FFFD y
    // el separador de línea.
    for (const invisible of ['\u0000', '\u0001', '​', '‎', '\uD800', '�', ' ']) {
      // En el medio: en las puntas, el recorte (trim) ya saca los que son espacios (U+2028).
      for (const malo of [`https://example.com/a${invisible}b`, `https://exa${invisible}mple.com/`]) {
        const r = validar({ mapaUrl: malo, compraUrl: malo, redes: [{ red: 'instagram', url: malo }] }).campos
        for (const campo of ['mapaUrl', 'compraUrl', 'redes.0.url']) {
          assert.match(r?.[campo] ?? '', /carácter invisible/, `${campo} ${JSON.stringify(malo)}`)
        }
      }
      assert.match(
        validar({ mapaEmbedUrl: `${EMBED}${invisible}x` }).campos?.mapaEmbedUrl ?? '',
        /carácter invisible/,
        JSON.stringify(invisible),
      )
    }
  })

  test('el mapa para insertar: solo el de Google Maps; el código <iframe> entero sirve y queda solo su src', () => {
    assert.deepEqual(validar({ mapaEmbedUrl: EMBED }).datos, { mapaEmbedUrl: EMBED })
    const iframe = `<iframe src="${EMBED.replace('!1m12', '!1m12&amp;x=1')}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    assert.deepEqual(validar({ mapaEmbedUrl: iframe }).datos, { mapaEmbedUrl: EMBED.replace('!1m12', '!1m12&x=1') })
    assert.equal(srcDelMapa('sin iframe'), 'sin iframe')
    for (const malo of [
      'https://evil.example/maps/embed?pb=1',
      'https://www.google.com.evil.example/maps/embed?pb=1',
      'https://www.google.com/maps/place/Museo',
      'http://www.google.com/maps/embed?pb=1',
      '<iframe src="https://evil.example/maps/embed?pb=1"></iframe>',
      'https://www.google.com/maps/embed?pb="><script>',
    ]) {
      assert.match(validar({ mapaEmbedUrl: malo }).campos?.mapaEmbedUrl ?? '', /Insertar un mapa/, malo)
    }
  })

  test('redes: red conocida + URL https, hasta 8', () => {
    const ig = { red: 'instagram', url: 'https://www.instagram.com/mupa' }
    assert.deepEqual(validar({ redes: [ig] }).datos, { redes: [ig] })
    assert.deepEqual(validar({ redes: [] }).datos, { redes: [] })
    assert.ok(validar({ redes: [{ red: 'myspace', url: ig.url }] }).campos['redes.0.red'])
    assert.ok(validar({ redes: Array(9).fill(ig) }).campos.redes)
    assert.ok(validar({ redes: 'instagram' }).campos.redes)
  })

  test('reglas de dos campos: compra activa sin dirección, "Mostrar hasta" sin aviso', () => {
    assert.ok(validar({ compraActiva: true, compraUrl: '' }).campos.compraUrl)
    assert.deepEqual(validar({ compraActiva: true, compraUrl: 'https://entradas.example.com/' }).datos, {
      compraActiva: true,
      compraUrl: 'https://entradas.example.com/',
    })
    assert.ok(validar({ avisoTexto: '', avisoHasta: '2026-10-20' }).campos.avisoTexto)
    assert.ok(validar({ avisoHasta: '2026-02-30' }).campos.avisoHasta)
    assert.ok(validar({ avisoHasta: '20/10/2026' }).campos.avisoHasta)
    // Sobre la fila entera, solo las reglas de los campos que cambian.
    assert.deepEqual(problemasDeMuseo({ compraActiva: true, compraUrl: null }, ['direccion']), {})
    assert.ok(problemasDeMuseo({ compraActiva: true, compraUrl: null }, ['compraActiva']).compraUrl)
  })

  test('vacío o solo con claves que no son del esquema (las columnas en snake_case, la base): nada para cambiar', () => {
    for (const cuerpo of [{}, { como_llegar: { type: 'doc' } }, { actualizadoPor: 1, updatedAt: '2020-01-01', id: 2 }]) {
      assert.deepEqual(validar(cuerpo).campos, { _: 'No hay nada para cambiar.' }, JSON.stringify(cuerpo))
    }
    assert.deepEqual(validar({ direccion: 'Calle 1', como_llegar: { type: 'doc' }, actualizadoPor: 9 }).datos, {
      direccion: 'Calle 1',
    })
  })

  test('los textos de Visitas (E3.2): el JSON del editor, validado por textoRico.js; vacío, null', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rampa' }] }] }
    assert.deepEqual(validar({ comoLlegar: doc, normas: { type: 'doc' }, accesibilidad: null }).datos, {
      comoLlegar: doc,
      normas: null,
      accesibilidad: null,
    })
    assert.ok(validar({ normas: { type: 'doc', content: [{ type: 'image' }] } }).campos.normas)
    assert.ok(validar({ comoLlegar: '<p>hola</p>' }).campos.comoLlegar)
  })
})

describe('el museo público (sin base)', () => {
  const fila = {
    direccion: 'Calle 1',
    emailPublico: 'museo@example.com',
    emailDestinoContacto: 'secreto@example.com',
    redes: [
      { red: 'instagram', url: 'https://instagram.com/mupa' },
      { red: 'instagram', url: 'http://inseguro.example.com' },
      { red: 'desconocida', url: 'https://example.com' },
      { red: 'facebook', url: 'javascript:alert(1)' },
    ],
    mapaEmbedUrl: 'https://evil.example/maps/embed?x',
    mapaUrl: 'https://maps.app.goo.gl/abc',
    compraActiva: false,
    compraUrl: 'https://entradas.example.com',
    avisoTexto: 'Cerrado el lunes',
    avisoHasta: '2026-10-13',
  }
  const horarios = [
    {
      dia: 1,
      abierto: true,
      franjas: [
        { abre: '09:00', cierra: '13:00' },
        { abre: 'x', cierra: '1' },
      ],
      nota: '',
    },
  ]

  test('lo guardado con un carácter invisible no se publica (el sitio usa el mismo esUrlHttps)', () => {
    const m = armarMuseoPublico(
      {
        museo: {
          redes: [
            { red: 'instagram', url: 'https://exa​mple.com/mupa' },
            { red: 'facebook', url: 'https://facebook.com/mupa' },
          ],
          mapaUrl: 'https://maps.example.com/\u0001',
        },
      },
      '2026-10-14',
    )
    assert.deepEqual(m.redes, [{ red: 'facebook', url: 'https://facebook.com/mupa' }])
    assert.equal(m.mapaUrl, null)
  })

  test('nunca el correo de destino; solo redes conocidas con https; el mapa solo si es de Google', () => {
    const m = armarMuseoPublico({ museo: fila, horarios, tarifas: [] }, '2026-10-14')
    assert.ok(!JSON.stringify(m).includes('secreto'))
    assert.deepEqual(Object.keys(m).sort(), Object.keys(MUSEO_VACIO).sort())
    assert.deepEqual(m.redes, [{ red: 'instagram', url: 'https://instagram.com/mupa' }])
    assert.equal(m.mapaEmbedUrl, null)
    assert.equal(m.mapaUrl, 'https://maps.app.goo.gl/abc')
    assert.deepEqual(m.horarios, [{ dia: 1, abierto: true, franjas: [{ abre: '09:00', cierra: '13:00' }], nota: null }])
  })

  test('el aviso, solo vigente (sin fecha, o hasta hoy inclusive); la compra, solo activa', () => {
    assert.equal(armarMuseoPublico({ museo: fila }, '2026-10-14').aviso, null)
    assert.deepEqual(armarMuseoPublico({ museo: fila }, '2026-10-13').aviso, {
      texto: 'Cerrado el lunes',
      hasta: '2026-10-13',
    })
    assert.deepEqual(armarMuseoPublico({ museo: { ...fila, avisoHasta: null } }, '2030-01-01').aviso, {
      texto: 'Cerrado el lunes',
      hasta: null,
    })
    assert.equal(armarMuseoPublico({ museo: fila }, '2026-10-13').compra, null)
    assert.deepEqual(armarMuseoPublico({ museo: { ...fila, compraActiva: true } }, '2026-10-13').compra, {
      url: 'https://entradas.example.com',
      texto: null,
    })
  })

  test('sin fila (o con todo vacío): la forma de MUSEO_VACIO; el de ejemplo tiene la misma forma', () => {
    assert.deepEqual(armarMuseoPublico({ museo: null, horarios: [], tarifas: [] }, '2026-10-14'), MUSEO_VACIO)
    assert.deepEqual(Object.keys(MUSEO_MAXIMO).sort(), Object.keys(MUSEO_VACIO).sort())
  })

  test('museoPublico(): el último bueno si la base falla; el vacío si nunca respondió; el de ejemplo con SIN_BASE', async () => {
    const logs = escucharLogs()
    try {
      let falla = false
      const leer = async () => {
        if (falla) throw Object.assign(new Error('se cayó'), { code: 'ECONNREFUSED' })
        return { direccion: 'La buena' }
      }
      const museoPublico = crearMuseoPublico({ sinBase: false }, { leer })
      assert.deepEqual(await museoPublico(), { direccion: 'La buena' })
      falla = true
      assert.deepEqual(await museoPublico(), { direccion: 'La buena' })
      const nunca = crearMuseoPublico({ sinBase: false }, { leer })
      assert.equal(await nunca(), MUSEO_VACIO)
      assert.equal(await crearMuseoPublico({ sinBase: false })(), MUSEO_VACIO)
      assert.equal(await crearMuseoPublico({ sinBase: 'maximo' })(), MUSEO_MAXIMO)
      assert.equal(await crearMuseoPublico({ sinBase: 'vacio' })(), MUSEO_VACIO)
    } finally {
      logs.detener()
    }
    assert.equal(logs.eventos().filter((e) => e.evento === 'museo_sin_base').length, 2)
  })

  test('museoPublico(): si la base no contesta a tiempo, la página no espera (sale con el último bueno)', async () => {
    const logs = escucharLogs()
    let colgada = false
    let soltar
    try {
      const leer = () => (colgada ? new Promise((r) => (soltar = r)) : Promise.resolve({ direccion: 'La buena' }))
      const museoPublico = crearMuseoPublico({ sinBase: false }, { leer, tope: 50 })
      assert.deepEqual(await museoPublico(), { direccion: 'La buena' })
      colgada = true
      const inicio = performance.now()
      assert.deepEqual(await museoPublico(), { direccion: 'La buena' })
      assert.ok(performance.now() - inicio < 1_000)
      // Cuando la consulta colgada por fin termina, queda como el último bueno.
      soltar({ direccion: 'La que llegó tarde' })
      await new Promise((r) => setTimeout(r, 0))
      assert.deepEqual(await museoPublico(), { direccion: 'La que llegó tarde' })
    } finally {
      logs.detener()
    }
    assert.deepEqual(
      logs
        .eventos()
        .filter((e) => e.evento === 'museo_sin_base')
        .map((e) => e.codigo),
      ['TOPE', 'TOPE'],
    )
  })
})

/** El estado de la página (el JSON de <script id="estado">). */
function estadoDe(html) {
  const m = /<script id="estado" type="application\/json">(.*?)<\/script>/s.exec(html)
  assert.ok(m, 'la página trae el estado')
  return JSON.parse(m[1])
}

describe('GET y PUT /museo, y el museo en las páginas', { skip: base.motivo ?? false }, () => {
  let s
  let admin
  let editor
  before(async () => {
    s = await levantar()
    admin = await s.cookiePara('admin', { nombre: 'Ana Admin' })
    editor = await s.cookiePara('editor', { nombre: 'Edu Editor' })
  })
  after(() => s?.cerrar())

  const put = (quien, cuerpo) => s.pedir('PUT', 'api:/museo', { cookie: quien.cookie, cuerpo })
  const fila = async () => (await sql('SELECT * FROM museo WHERE id = 1'))[0]

  test('recién migrado: todo vacío y sin última edición', async () => {
    const r = await s.pedir('GET', 'api:/museo', { cookie: admin.cookie })
    assert.equal(r.status, 200)
    assert.deepEqual(r.json.data, {
      direccion: null,
      localidad: null,
      provincia: null,
      codigoPostal: null,
      telefono: null,
      emailPublico: null,
      emailDestinoContacto: null,
      redes: [],
      mapaEmbedUrl: null,
      mapaUrl: null,
      comoLlegar: null,
      normas: null,
      accesibilidad: null,
      notaHorarios: null,
      notaTarifas: null,
      compraActiva: false,
      compraUrl: null,
      compraTexto: null,
      avisoTexto: null,
      avisoHasta: null,
      ultimaEdicion: null,
    })
  })

  test('guardar: lo que llega validado, quién (de la sesión) y cuándo; la respuesta es como el GET', async () => {
    const antes = await fila()
    const logs = escucharLogs()
    let r
    try {
      r = await put(admin, {
        direccion: ' Avenida de prueba 1234 ',
        localidad: 'San Juan',
        provincia: 'San Juan',
        codigoPostal: '5400',
        telefono: '+54 264 000-0000',
        emailPublico: 'Museo@Example.com',
        emailDestinoContacto: 'Destino.Secreto@Gmail.com',
        redes: [{ red: 'instagram', url: 'https://www.instagram.com/mupa' }],
        mapaEmbedUrl: `<iframe src="${EMBED}" width="600"></iframe>`,
        mapaUrl: 'https://maps.app.goo.gl/abc123',
        // No se pueden mandar: se descartan (también la columna de un texto, con su nombre de la base).
        actualizadoPor: 999,
        updatedAt: '2000-01-01T00:00:00Z',
        como_llegar: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] },
      })
    } finally {
      logs.detener()
    }
    assert.equal(r.status, 200, r.texto)
    const d = r.json.data
    assert.equal(d.direccion, 'Avenida de prueba 1234')
    assert.equal(d.emailPublico, 'museo@example.com')
    assert.equal(d.emailDestinoContacto, 'destino.secreto@gmail.com')
    assert.equal(d.mapaEmbedUrl, EMBED)
    assert.equal(d.ultimaEdicion.nombre, 'Ana Admin')
    const despues = await fila()
    assert.equal(despues.actualizado_por, admin.usuario.id)
    assert.ok(despues.updated_at > antes.updated_at, 'updated_at avanzó')
    assert.equal(despues.como_llegar, null)
    assert.equal(new Date(d.ultimaEdicion.fecha).getTime(), despues.updated_at.getTime())
    // En el log, los nombres de los campos y nunca los valores.
    const linea = logs.lineas.join('\n')
    assert.ok(!/secreto|example\.com|Avenida/i.test(linea), linea)
    assert.ok(logs.eventos().some((e) => e.evento === 'museo_actualizado' && e.por === admin.usuario.id))
  })

  test('es parcial: cambia solo lo que trae, sin pisar lo demás (tampoco los textos con formato)', async () => {
    await sql(`UPDATE museo SET como_llegar = '{"type":"doc","content":[]}' WHERE id = 1`)
    const r = await put(editor, { notaHorarios: 'Feriados: horario de domingo.', como_llegar: null })
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.json.data.direccion, 'Avenida de prueba 1234')
    assert.equal(r.json.data.notaHorarios, 'Feriados: horario de domingo.')
    assert.equal(r.json.data.ultimaEdicion.nombre, 'Edu Editor')
    const f = await fila()
    assert.deepEqual(f.como_llegar, { type: 'doc', content: [] })
    assert.equal(f.email_destino_contacto, 'destino.secreto@gmail.com')
    assert.equal(f.actualizado_por, editor.usuario.id)
    // Vaciar un campo: "" pasa a null.
    const vaciar = await put(editor, { notaHorarios: '' })
    assert.equal(vaciar.json.data.notaHorarios, null)
  })

  test('URL con el esquema en mayúsculas: se guarda en minúsculas (nunca un 500 por los CHECK de la tabla)', async () => {
    const r = await put(admin, {
      mapaUrl: 'HTTPS://maps.app.goo.gl/Mayus',
      compraUrl: 'Https://entradas.example.com/mayus',
      redes: [{ red: 'youtube', url: 'HTTPS://www.youtube.com/@mupa' }],
    })
    assert.equal(r.status, 200, r.texto)
    const f = await fila()
    assert.equal(f.mapa_url, 'https://maps.app.goo.gl/Mayus')
    assert.equal(f.compra_url, 'https://entradas.example.com/mayus')
    assert.deepEqual(f.redes, [{ red: 'youtube', url: 'https://www.youtube.com/@mupa' }])
  })

  test('URL con NUL o un surrogate suelto (también en las redes, que son jsonb): 400, nunca un 500', async () => {
    const antes = await fila()
    for (const malo of ['https://example.com/\u0000', 'https://example.com/\uD800', 'https://exa​mple.com/']) {
      for (const [cuerpo, campo] of [
        [{ redes: [{ red: 'instagram', url: malo }] }, 'redes.0.url'],
        [{ compraUrl: malo }, 'compraUrl'],
        [{ mapaUrl: malo }, 'mapaUrl'],
      ]) {
        const r = await put(admin, cuerpo)
        assert.equal(r.status, 400, `${campo} ${JSON.stringify(malo)}: ${r.texto}`)
        assert.match(r.json.campos[campo], /carácter invisible/)
      }
    }
    assert.deepEqual(await fila(), antes)
  })

  test('400 con el campo: URL que no es https, mapa de otro dominio, red con http; y no cambia nada', async () => {
    const antes = await fila()
    for (const [cuerpo, campo] of [
      [{ mapaUrl: 'http://maps.example.com/x' }, 'mapaUrl'],
      [{ mapaEmbedUrl: 'https://evil.example/maps/embed?pb=1' }, 'mapaEmbedUrl'],
      [{ redes: [{ red: 'facebook', url: 'http://facebook.com/mupa' }] }, 'redes.0.url'],
      [{ compraUrl: 'ftp://entradas.example.com' }, 'compraUrl'],
      [{ direccion: 'Otra', emailPublico: 'sin arroba' }, 'emailPublico'],
    ]) {
      const r = await put(admin, cuerpo)
      assert.equal(r.status, 400, JSON.stringify(cuerpo))
      assert.equal(r.json.error, 'Revisá los datos.')
      assert.ok(r.json.campos[campo], `${campo}: ${JSON.stringify(r.json.campos)}`)
    }
    assert.deepEqual(await fila(), antes)
  })

  test('las reglas de dos campos se miran sobre la fila como quedaría', async () => {
    assert.equal((await put(editor, { compraUrl: 'https://entradas.example.com/mupa' })).status, 200)
    // Activa sola: la dirección ya está guardada.
    const activa = await put(editor, { compraActiva: true, compraTexto: 'Comprá tu entrada' })
    assert.equal(activa.status, 200, activa.texto)
    // Borrar la dirección con la compra activa: 400 en compraUrl, y queda como estaba.
    const sinUrl = await put(editor, { compraUrl: '' })
    assert.equal(sinUrl.status, 400)
    assert.ok(sinUrl.json.campos.compraUrl)
    assert.equal((await fila()).compra_url, 'https://entradas.example.com/mupa')
    // "Mostrar hasta" sin aviso guardado: 400 en avisoTexto.
    const hasta = await put(editor, { avisoHasta: '2026-12-31' })
    assert.equal(hasta.status, 400)
    assert.ok(hasta.json.campos.avisoTexto)
    // Un cambio que no toca esas reglas pasa aunque la fila tenga algo raro escrito a mano.
    await sql(`UPDATE museo SET aviso_hasta = '2026-12-31', aviso_texto = NULL WHERE id = 1`)
    assert.equal((await put(editor, { telefono: '+54 264 000-0002' })).status, 200)
    await sql(`UPDATE museo SET aviso_hasta = NULL WHERE id = 1`)
  })

  test('la Home lleva el museo público en el estado, nunca el correo de destino (aunque esté cargado)', async () => {
    assert.equal((await fila()).email_destino_contacto, 'destino.secreto@gmail.com')
    await put(admin, { avisoTexto: 'Cerrado por feriado', avisoHasta: '2000-01-01' })
    await s.pedir('PUT', 'api:/horarios', {
      cookie: editor.cookie,
      cuerpo: {
        dias: [1, 2, 3, 4, 5, 6, 7].map((dia) => ({
          dia,
          abierto: dia === 3,
          franjas: dia === 3 ? [{ abre: '10:00', cierra: '18:00' }] : [],
          nota: null,
        })),
      },
    })
    for (const tarifa of [
      { nombre: 'General', precio: 3000 },
      { nombre: 'Oculta', precio: 1, visible: false },
      { nombre: 'Menores', gratuita: true },
    ]) {
      assert.equal((await s.pedir('POST', 'api:/tarifas', { cookie: editor.cookie, cuerpo: tarifa })).status, 201)
    }
    const r = await s.pedir('GET', '/')
    assert.equal(r.status, 200)
    assert.ok(!/destino\.secreto/i.test(r.texto), 'el HTML no tiene el correo de destino')
    assert.equal(r.h['set-cookie'], undefined)
    const { museo } = estadoDe(r.texto)
    assert.equal(museo.direccion, 'Avenida de prueba 1234')
    assert.equal(museo.emailPublico, 'museo@example.com')
    assert.ok(!('emailDestinoContacto' in museo))
    assert.equal(museo.mapaEmbedUrl, EMBED)
    assert.deepEqual(museo.compra, { url: 'https://entradas.example.com/mupa', texto: 'Comprá tu entrada' })
    // Vencido (hasta el 01/01/2000): no sale.
    assert.equal(museo.aviso, null)
    assert.equal(museo.horarios.length, 7)
    assert.deepEqual(museo.horarios[2], {
      dia: 3,
      abierto: true,
      franjas: [{ abre: '10:00', cierra: '18:00' }],
      nota: null,
    })
    assert.deepEqual(
      museo.tarifas.map((t) => [t.nombre, t.precio]),
      [
        ['General', 3000],
        ['Menores', null],
      ],
    )
    // La 404 lleva lo mismo.
    const noEsta = await s.pedir('GET', '/no-existe')
    assert.equal(noEsta.status, 404)
    assert.ok(!/destino\.secreto/i.test(noEsta.texto))
    assert.equal(estadoDe(noEsta.texto).museo.direccion, 'Avenida de prueba 1234')
    // Lo que se guarda se ve en el pedido siguiente (sin caché).
    await put(editor, { avisoHasta: null })
    assert.deepEqual(estadoDe((await s.pedir('GET', '/')).texto).museo.aviso, {
      texto: 'Cerrado por feriado',
      hasta: null,
    })
  })
  // Los textos de Visitas (E3.2): lo que da el editor (editor.getJSON()), con lo que TipTap agrega y el servidor saca.
  const TEXTO_EDITOR = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'En colectivo' }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Las líneas ' },
          { type: 'text', marks: [{ type: 'bold' }], text: '1 y 2' },
          { type: 'text', text: ' paran en la puerta. ' },
          {
            type: 'text',
            marks: [
              {
                type: 'link',
                attrs: { href: 'https://example.com/recorridos', target: '_blank', rel: 'noopener noreferrer nofollow', class: null },
              },
            ],
            text: 'Recorridos',
          },
        ],
      },
      {
        type: 'orderedList',
        attrs: { start: 1, type: null },
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bajar en la plaza' }] }] }],
      },
      { type: 'paragraph' },
    ],
  }
  const TEXTO_CANONICO = {
    type: 'doc',
    content: [
      TEXTO_EDITOR.content[0],
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Las líneas ' },
          { type: 'text', text: '1 y 2', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' paran en la puerta. ' },
          { type: 'text', text: 'Recorridos', marks: [{ type: 'link', attrs: { href: 'https://example.com/recorridos' } }] },
        ],
      },
      {
        type: 'orderedList',
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bajar en la plaza' }] }] }],
      },
    ],
  }
  const unParrafo = (text) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

  test('los textos de Visitas: un editor los guarda (en la forma canónica) y el GET los devuelve; el log no tiene el texto', async () => {
    const logs = escucharLogs()
    let r
    try {
      r = await put(editor, {
        comoLlegar: TEXTO_EDITOR,
        normas: unParrafo('No se come en las salas.'),
        accesibilidad: { type: 'doc', content: [{ type: 'paragraph' }] },
      })
    } finally {
      logs.detener()
    }
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(r.json.data.comoLlegar, TEXTO_CANONICO)
    assert.deepEqual(r.json.data.normas, unParrafo('No se come en las salas.'))
    assert.equal(r.json.data.accesibilidad, null)
    assert.equal(r.json.data.ultimaEdicion.nombre, 'Edu Editor')
    const f = await fila()
    assert.deepEqual(f.como_llegar, TEXTO_CANONICO)
    assert.equal(f.accesibilidad, null)
    assert.equal(f.actualizado_por, editor.usuario.id)
    const g = await s.pedir('GET', 'api:/museo', { cookie: editor.cookie })
    assert.deepEqual(g.json.data.comoLlegar, TEXTO_CANONICO)
    assert.deepEqual(g.json.data.normas, unParrafo('No se come en las salas.'))
    // En el log, los nombres de los campos y nunca el texto.
    const linea = logs.lineas.join('\n')
    assert.ok(!/colectivo|salas|recorridos/i.test(linea), linea)
    assert.ok(logs.eventos().some((e) => e.evento === 'museo_actualizado' && e.campos.includes('comoLlegar')))
  })

  test('los textos: 400 en su campo con un nodo prohibido, un enlace javascript: o 301 párrafos; no cambia nada', async () => {
    const antes = await fila()
    const parrafos = Array.from({ length: 301 }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: `p${i}` }] }))
    for (const [campo, valor, mensaje] of [
      ['normas', { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com/x.png' } }] }, /formato/],
      [
        'comoLlegar',
        {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'clic', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }],
        },
        /Un enlace tiene que llevar/,
      ],
      ['accesibilidad', { type: 'doc', content: parrafos }, /hasta 300 párrafos/],
      ['comoLlegar', '<p>HTML</p>', /formato/],
    ]) {
      const r = await put(editor, { [campo]: valor, notaTarifas: 'No debería guardarse.' })
      assert.equal(r.status, 400, `${campo}: ${r.texto}`)
      assert.match(r.json.campos[campo], mensaje)
      assert.deepEqual(Object.keys(r.json.campos), [campo])
    }
    assert.deepEqual(await fila(), antes)
  })

  test('los textos: uno largo (casi 20.000 caracteres con acentos, en 300 párrafos) entra en un pedido; vaciarlo, null', async () => {
    const largo = {
      type: 'doc',
      content: Array.from({ length: 300 }, (_, i) => ({
        type: 'paragraph',
        content: [
          { type: 'text', text: `${'á'.repeat(60)} `, marks: [{ type: 'bold' }] },
          { type: 'text', text: String(i).padStart(5, '0') },
        ],
      })),
    }
    const r = await put(editor, { accesibilidad: largo })
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.json.data.accesibilidad.content.length, 300)
    const vaciar = await put(editor, { accesibilidad: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '  ' }] }] } })
    assert.equal(vaciar.status, 200)
    assert.equal(vaciar.json.data.accesibilidad, null)
    assert.equal((await fila()).accesibilidad, null)
  })

  test('los textos van solo en los datos de /visitas, no en el museo común (COD-04); con </script> el HTML sigue entero', async () => {
    const malicioso = '</script><script>alert(1)</script><!--'
    assert.equal((await put(editor, { accesibilidad: unParrafo(malicioso) })).status, 200)
    // La Home (y cualquier otra página) no los lleva.
    const home = await s.pedir('GET', '/')
    assert.equal(home.status, 200)
    for (const campo of ['comoLlegar', 'normas', 'accesibilidad']) assert.ok(!(campo in estadoDe(home.texto).museo), campo)
    assert.ok(!home.texto.includes('No se come en las salas'))
    // /visitas sí, en sus datos.
    const r = await s.pedir('GET', '/visitas')
    assert.equal(r.status, 200)
    assert.ok(!r.texto.includes('<script>alert(1)'), 'el texto no sale como HTML')
    const { datos, museo } = estadoDe(r.texto)
    assert.ok(!('comoLlegar' in museo))
    assert.deepEqual(datos.comoLlegar, TEXTO_CANONICO)
    assert.deepEqual(datos.normas, unParrafo('No se come en las salas.'))
    assert.deepEqual(datos.accesibilidad, unParrafo(malicioso))
    // Lo que alguien escribió a mano en la base y el esquema no admite no se publica.
    await sql(
      `UPDATE museo SET normas = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}' WHERE id = 1`,
    )
    assert.equal(estadoDe((await s.pedir('GET', '/visitas')).texto).datos.normas, null)
    await sql('UPDATE museo SET normas = NULL, accesibilidad = NULL WHERE id = 1')
  })

  test('los textos se validan una vez mientras no cambian (cada página no paga zod); un cambio a mano se ve igual (COD-04)', async () => {
    assert.equal((await put(editor, { comoLlegar: unParrafo('Primera versión.') })).status, 200)
    const primera = await leerMuseo(base.sequelize)
    const antes = vecesQueSeValidaronLosTextos()
    for (let i = 0; i < 3; i++) assert.deepEqual((await leerMuseo(base.sequelize)).comoLlegar, primera.comoLlegar)
    assert.equal(vecesQueSeValidaronLosTextos(), antes, 'los mismos textos: no se vuelven a validar')
    // Cambiado a mano (sin tocar updated_at): se nota por el contenido y se valida de nuevo.
    await sql(`UPDATE museo SET como_llegar = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Segunda."}]}]}' WHERE id = 1`)
    assert.deepEqual((await leerMuseo(base.sequelize)).comoLlegar, unParrafo('Segunda.'))
    assert.equal(vecesQueSeValidaronLosTextos(), antes + 1)
    // Uno nulo y otro con texto no se confunden con el revés (la huella marca cada uno).
    await sql(`UPDATE museo SET normas = como_llegar, como_llegar = NULL WHERE id = 1`)
    const cambiados = await leerMuseo(base.sequelize)
    assert.deepEqual([cambiados.comoLlegar, cambiados.normas], [null, unParrafo('Segunda.')])
    await sql('UPDATE museo SET normas = NULL WHERE id = 1')
  })

  test('si alguien borró la fila del museo: el GET la muestra vacía y el PUT la vuelve a crear', async () => {
    await sql('DELETE FROM museo')
    const vacio = await s.pedir('GET', 'api:/museo', { cookie: admin.cookie })
    assert.equal(vacio.status, 200)
    assert.equal(vacio.json.data.direccion, null)
    assert.deepEqual(vacio.json.data.redes, [])
    assert.equal(estadoDe((await s.pedir('GET', '/')).texto).museo.direccion, null)
    const r = await put(editor, { direccion: 'Calle nueva 1' })
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.json.data.direccion, 'Calle nueva 1')
    const [f] = await sql('SELECT id, direccion, actualizado_por, updated_at FROM museo')
    assert.equal(f.id, 1)
    assert.equal(f.actualizado_por, editor.usuario.id)
    assert.ok(f.updated_at instanceof Date)
  })
})
