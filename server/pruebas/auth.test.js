// Autenticación del panel con la base de prueba (plan 13.1, auth.test.js): inicio y cierre de sesión, cookie,
// límites, vencimientos, contraseñas temporales, cambio de clave, último admin y la llave de emergencia.
// Sin base (sin DATABASE_URL_TEST, o si no responde) se saltean con un aviso.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { after, describe, mock, test } from 'node:test'
import argon2 from 'argon2'
import { RUTAS } from '../api/indice.js'
import { hashClave, hashDeRelleno, verificarClave } from '../auth/claves.js'
import { crearAdmin, restablecerAdmin } from '../scripts/admin.js'
import { CSP_PANEL } from '../seguridad.js'
import { programarTareas } from '../tareas.js'
import { cerrarBase, claveAlAzar, cookieDe, escucharLogs, levantar, prepararBase, salteoVisible, sql } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

const TEMPORAL = /^[a-km-np-z2-9]{4}(-[a-km-np-z2-9]{4}){3}$/
const INCORRECTOS = 'Correo o contraseña incorrectos.'
const VENCIDA = 'La contraseña temporal venció. Pedile otra a un administrador.'
const sha256 = (texto) => createHash('sha256').update(texto).digest('hex')
const tokenDe = (cookie) => cookie.split('=')[1]
const sesionesDe = async (usuarioId) =>
  Number((await sql('SELECT count(*) AS n FROM sesiones WHERE usuario_id = :usuarioId', { usuarioId }))[0].n)

/** Las cabeceras que lleva toda respuesta de la API, también un 429. */
function cabecerasDelPanel(r, quien) {
  assert.match(r.h['content-type'], /application\/json/, quien)
  assert.equal(r.h['content-security-policy'], CSP_PANEL, quien)
  assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', quien)
  assert.equal(r.h['cache-control'], 'no-store', quien)
}

/**
 * Abre una transacción que tiene bloqueada (FOR UPDATE) la fila de un usuario hasta soltar(): así un pedido queda
 * esperando justo antes de escribir y la prueba puede cambiar la fila en ese momento (las carreras, sin azar).
 */
async function bloquearUsuario(id) {
  const t = await base.sequelize.transaction()
  await base.sequelize.query('SELECT id FROM usuarios WHERE id = :id FOR UPDATE', { replacements: { id }, transaction: t })
  return {
    sql: (texto, replacements) => base.sequelize.query(texto, { replacements, transaction: t }),
    soltar: () => t.commit(),
  }
}

/** Espera (hasta 5 s) a que algún pedido quede esperando un bloqueo de fila en la base. */
async function esperarBloqueo() {
  for (let i = 0; i < 100; i++) {
    const [{ n }] = await sql(
      `SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`,
    )
    if (Number(n) > 0) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('ningún pedido quedó esperando el bloqueo')
}

/**
 * Manda el pedido, espera a que quede trabado en la fila bloqueada, corre cambiar(sql de la transacción) y suelta.
 * Devuelve la respuesta.
 */
async function cruzar(usuarioId, mandar, cambiar) {
  const bloqueo = await bloquearUsuario(usuarioId)
  let pedido
  try {
    pedido = mandar()
    await esperarBloqueo()
    await cambiar(bloqueo.sql)
  } finally {
    await bloqueo.soltar()
  }
  return pedido
}

// n letras con dos tildes separadas (NFD: ệ, ậ, ộ como letra + punto abajo + circunflejo), con un espacio cada 5:
// 3 unidades por letra tal como llegan, 1 carácter después de NFKC.
const letraNfd = (i) => ['e', 'a', 'o'][i % 3] + String.fromCodePoint(0x0323, 0x0302)
const fraseNfd = (n) => Array.from({ length: n }, (_, i) => letraNfd(i) + (i % 5 === 4 ? ' ' : '')).join('')

describe('autenticación', { skip: base.motivo ?? false }, () => {
  test('inicio correcto y fallido con el mismo mensaje; la cookie con sus flags; en la base, el hash del token', async () => {
    const s = await levantar()
    try {
      const { usuario, clave, email } = await s.crearUsuario('editor')
      const r = await s.pedir('POST', 'api:/sesion', { cuerpo: { email: `  ${email.toUpperCase()} `, clave } })
      assert.equal(r.status, 200, r.texto)
      assert.deepEqual(r.json, {
        data: { usuario: { id: usuario.id, nombre: usuario.nombre, email, rol: 'editor' }, debeCambiarClave: false },
      })
      // __Secure-mupa_sesion=<43>; Max-Age=43200; Path=/administracion; Expires=…; HttpOnly; Secure; SameSite=Strict
      const cookies = r.h['set-cookie']
      assert.equal(cookies.length, 1)
      const partes = cookies[0].split('; ')
      assert.match(partes[0], /^__Secure-mupa_sesion=[A-Za-z0-9_-]{43}$/)
      for (const flag of ['Max-Age=43200', 'Path=/administracion', 'HttpOnly', 'Secure', 'SameSite=Strict']) {
        assert.ok(partes.includes(flag), `${flag} en ${cookies[0]}`)
      }
      assert.ok(!/domain=/i.test(cookies[0]), 'sin Domain')
      assert.equal(r.h['content-security-policy'].includes("frame-ancestors 'none'"), true)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.equal(r.h['x-robots-tag'], 'noindex, nofollow')

      const token = tokenDe(partes[0])
      const [fila] = await sql(
        `SELECT token_hash, extract(epoch FROM expira_en - creada_en) AS vida, user_agent FROM sesiones WHERE usuario_id = :id`,
        { id: usuario.id },
      )
      assert.equal(fila.token_hash, sha256(token))
      assert.equal(Number(fila.vida), 12 * 3600)
      const [{ ultimo_acceso: acceso }] = await sql('SELECT ultimo_acceso FROM usuarios WHERE id = :id', { id: usuario.id })
      assert.ok(acceso && Date.now() - new Date(acceso) < 60_000)

      const conCookie = await s.pedir('GET', 'api:/sesion', { cookie: partes[0] })
      assert.equal(conCookie.status, 200)
      assert.equal(conCookie.json.data.usuario.id, usuario.id)

      // Clave equivocada, correo que no existe y cuenta inactiva: lo mismo, sin cookie.
      const inactivo = await s.crearUsuario('admin', { activo: false })
      for (const cuerpo of [
        { email, clave: `${clave}x` },
        { email: 'nadie@example.com', clave },
        { email: inactivo.email, clave: inactivo.clave },
      ]) {
        const malo = await s.pedir('POST', 'api:/sesion', { cuerpo })
        assert.equal(malo.status, 401)
        assert.deepEqual(malo.json, { error: INCORRECTOS })
        assert.equal(malo.h['set-cookie'], undefined)
      }
    } finally {
      await s.cerrar()
    }
  })

  test('con URL_PUBLICA en http: mupa_sesion, sin Secure; la cookie __Secure- no cuenta', async () => {
    const s = await levantar({ URL_PUBLICA: 'http://127.0.0.1:5190/', RENDER_EXTERNAL_URL: undefined })
    try {
      const { clave, email } = await s.crearUsuario('editor')
      const r = await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave } })
      assert.equal(r.status, 200)
      const [cookie] = r.h['set-cookie']
      assert.match(cookie, /^mupa_sesion=[A-Za-z0-9_-]{43}; /)
      assert.ok(!cookie.split('; ').includes('Secure'), cookie)
      assert.ok(cookie.includes('Path=/administracion') && cookie.includes('HttpOnly') && cookie.includes('SameSite=Strict'))
      const token = tokenDe(cookie.split(';')[0])
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: `mupa_sesion=${token}` })).status, 200)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: `__Secure-mupa_sesion=${token}` })).status, 401)
    } finally {
      await s.cerrar()
    }
  })

  test('5 fallidos desde una IP dan 429 (también con la clave correcta); desde otra IP, el titular entra', async () => {
    const s = await levantar()
    try {
      const titular = await s.crearUsuario('editor')
      const otro = await s.crearUsuario('editor')
      const A = '203.0.113.7'
      for (let i = 0; i < 5; i++) {
        const r = await s.pedir('POST', 'api:/sesion', { ip: A, cuerpo: { email: titular.email, clave: 'no es esta' } })
        assert.equal(r.status, 401, `intento ${i + 1}`)
      }
      const bloqueado = await s.pedir('POST', 'api:/sesion', { ip: A, cuerpo: { email: titular.email, clave: titular.clave } })
      assert.equal(bloqueado.status, 429)
      assert.deepEqual(bloqueado.json, { error: 'Demasiados intentos. Esperá 15 minutos.' })
      assert.equal(bloqueado.h['set-cookie'], undefined)
      // El correo en mayúsculas es el mismo correo: sigue bloqueado.
      const mayus = await s.pedir('POST', 'api:/sesion', { ip: A, cuerpo: { email: titular.email.toUpperCase(), clave: titular.clave } })
      assert.equal(mayus.status, 429)
      // Desde otra IP, el titular entra; desde la misma IP, otra cuenta también (la clave es correo + IP).
      const B = '203.0.113.8'
      assert.equal((await s.pedir('POST', 'api:/sesion', { ip: B, cuerpo: { email: titular.email, clave: titular.clave } })).status, 200)
      assert.equal((await s.pedir('POST', 'api:/sesion', { ip: A, cuerpo: { email: otro.email, clave: otro.clave } })).status, 200)
    } finally {
      await s.cerrar()
    }
  })

  test('10 intentos por IP cada 15 minutos, con cualquier correo; un ingreso correcto pone en cero los fallidos', async () => {
    const s = await levantar()
    try {
      const { email, clave } = await s.crearUsuario('editor')
      const C = '203.0.113.20'
      // 4 fallidos y 1 correcto, dos veces: 10 intentos, ninguno 429 (el correcto pone en cero los fallidos).
      for (let vuelta = 0; vuelta < 2; vuelta++) {
        for (let i = 0; i < 4; i++) {
          assert.equal((await s.pedir('POST', 'api:/sesion', { ip: C, cuerpo: { email, clave: 'mal' } })).status, 401)
        }
        assert.equal((await s.pedir('POST', 'api:/sesion', { ip: C, cuerpo: { email, clave } })).status, 200)
      }
      // El 11.º desde esa IP: 429, aunque sea correcto.
      assert.equal((await s.pedir('POST', 'api:/sesion', { ip: C, cuerpo: { email, clave } })).status, 429)
      assert.equal((await s.pedir('POST', 'api:/sesion', { ip: '203.0.113.21', cuerpo: { email, clave } })).status, 200)
    } finally {
      await s.cerrar()
    }
  })

  test('vencimiento por inactividad (2 h) y por máximo (12 h); ultimo_uso se renueva como mucho cada 5 minutos', async () => {
    const s = await levantar()
    try {
      const inactiva = await s.cookiePara('editor')
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: inactiva.cookie })).status, 200)
      await sql(`UPDATE sesiones SET ultimo_uso = now() - interval '2 hours 1 minute' WHERE token_hash = :h`, { h: sha256(inactiva.token) })
      const r = await s.pedir('GET', 'api:/sesion', { cookie: inactiva.cookie })
      assert.equal(r.status, 401)
      assert.deepEqual(r.json, { error: 'Tenés que iniciar sesión.' })
      // Y la cookie se borra.
      assert.match(r.h['set-cookie'][0], /^__Secure-mupa_sesion=; .*Expires=Thu, 01 Jan 1970/)

      const vieja = await s.cookiePara('editor')
      await sql(`UPDATE sesiones SET expira_en = now() - interval '1 second' WHERE token_hash = :h`, { h: sha256(vieja.token) })
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: vieja.cookie })).status, 401)

      const usada = await s.cookiePara('editor')
      const h = sha256(usada.token)
      const ultimoUso = async () => new Date((await sql('SELECT ultimo_uso FROM sesiones WHERE token_hash = :h', { h }))[0].ultimo_uso)
      await sql(`UPDATE sesiones SET ultimo_uso = now() - interval '4 minutes' WHERE token_hash = :h`, { h })
      const antes = await ultimoUso()
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: usada.cookie })).status, 200)
      assert.equal((await ultimoUso()).getTime(), antes.getTime(), 'a los 4 minutos no se renueva')
      await sql(`UPDATE sesiones SET ultimo_uso = now() - interval '1 hour 59 minutes' WHERE token_hash = :h`, { h })
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: usada.cookie })).status, 200)
      assert.ok(Date.now() - (await ultimoUso()) < 60_000, 'pasados 5 minutos, se renueva')
    } finally {
      await s.cerrar()
    }
  })

  test('un desactivado pierde la sesión en el pedido siguiente; un cambio de rol vale desde el pedido siguiente', async () => {
    const s = await levantar()
    try {
      const admin = await s.cookiePara('admin')
      const editor = await s.cookiePara('editor')
      const otraDelEditor = await s.otraSesion(editor.usuario.id)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: editor.cookie })).status, 200)
      const r = await s.pedir('PATCH', `api:/usuarios/${editor.usuario.id}`, { cookie: admin.cookie, cuerpo: { activo: false } })
      assert.equal(r.status, 200, r.texto)
      assert.equal(r.json.data.usuario.activo, false)
      assert.equal(await sesionesDe(editor.usuario.id), 0)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: editor.cookie })).status, 401)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: otraDelEditor.cookie })).status, 401)
      // Desactivado directo en la base, con la sesión todavía en la tabla: igual 401 (la sesión mira usuario.activo).
      const otro = await s.cookiePara('editor')
      await sql('UPDATE usuarios SET activo = false WHERE id = :id', { id: otro.usuario.id })
      assert.equal(await sesionesDe(otro.usuario.id), 1)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: otro.cookie })).status, 401)
      // El rol se lee en cada pedido: bajado en la base, la próxima ruta de admin da 403.
      const admin2 = await s.cookiePara('admin')
      assert.equal((await s.pedir('GET', 'api:/usuarios', { cookie: admin2.cookie })).status, 200)
      await sql(`UPDATE usuarios SET rol = 'editor' WHERE id = :id`, { id: admin2.usuario.id })
      assert.equal((await s.pedir('GET', 'api:/usuarios', { cookie: admin2.cookie })).status, 403)
      // Bajado de rol desde el panel: además se cierran sus sesiones.
      const admin3 = await s.cookiePara('admin')
      const baja = await s.pedir('PATCH', `api:/usuarios/${admin3.usuario.id}`, { cookie: admin.cookie, cuerpo: { rol: 'editor' } })
      assert.equal(baja.status, 200)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: admin3.cookie })).status, 401)
    } finally {
      await s.cerrar()
    }
  })

  test('la temporal sale una sola vez: ni en GET /usuarios ni en los logs; en la base, solo su hash argon2id', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    let temporal
    let email
    try {
      const admin = await s.cookiePara('admin')
      email = `nueva-${Date.now()}@example.com`
      const alta = await s.pedir('POST', 'api:/usuarios', {
        cookie: admin.cookie,
        ip: '203.0.113.99',
        cuerpo: { nombre: '  Persona Nueva ', email: email.toUpperCase(), rol: 'editor', passwordHash: 'x', activo: false },
      })
      assert.equal(alta.status, 201, alta.texto)
      temporal = alta.json.data.claveTemporal
      assert.match(temporal, TEMPORAL)
      const u = alta.json.data.usuario
      assert.equal(u.email, email)
      assert.equal(u.nombre, 'Persona Nueva')
      assert.equal(u.activo, true, 'activo no se asigna desde el alta')
      assert.equal(u.debeCambiarClave, true)
      const horas = (new Date(u.claveTemporalVence) - Date.now()) / 3_600_000
      assert.ok(horas > 71.9 && horas <= 72, `vence en ${horas} h`)
      assert.ok(!('passwordHash' in u))

      const lista = await s.pedir('GET', 'api:/usuarios', { cookie: admin.cookie })
      assert.equal(lista.status, 200)
      assert.ok(lista.json.data.some((x) => x.email === email))
      assert.ok(!lista.texto.includes(temporal))
      assert.ok(!/passwordHash|password_hash|\$argon2/.test(lista.texto))

      const [{ password_hash: hash }] = await sql('SELECT password_hash FROM usuarios WHERE email = :email', { email })
      assert.match(hash, /^\$argon2id\$v=19\$m=19456,p=1,t=2\$/)
      assert.ok(!hash.includes(temporal))

      // Repetido: 409 con el campo, sin repetir el valor.
      const repetido = await s.pedir('POST', 'api:/usuarios', { cookie: admin.cookie, cuerpo: { nombre: 'Otra', email, rol: 'admin' } })
      assert.equal(repetido.status, 409)
      assert.deepEqual(repetido.json, { error: 'Ya hay una cuenta con ese correo.', campos: { email: 'Ya hay una cuenta con ese correo.' } })

      const ingreso = await s.pedir('POST', 'api:/sesion', { ip: '203.0.113.99', cuerpo: { email, clave: temporal } })
      assert.equal(ingreso.status, 200)
      assert.equal(ingreso.json.data.debeCambiarClave, true)
      const fallido = await s.pedir('POST', 'api:/sesion', { ip: '203.0.113.99', cuerpo: { email, clave: 'otra cosa' } })
      assert.equal(fallido.status, 401)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    const todo = logs.lineas.join('\n')
    assert.ok(!todo.includes(temporal), 'la temporal no está en el log')
    assert.ok(!todo.toLowerCase().includes(email), 'el correo no está en el log')
    assert.ok(!todo.includes('203.0.113.99'), 'la IP no está en el log')
    const eventos = logs.eventos().map((e) => e.evento)
    for (const evento of ['usuario_creado', 'ingreso', 'ingreso_fallido']) assert.ok(eventos.includes(evento), evento)
    const fallidos = logs.eventos().filter((e) => e.evento === 'ingreso_fallido')
    for (const e of fallidos) assert.deepEqual(Object.keys(e).sort(), ['evento', 'nivel', 't'])
  })

  test('con la temporal sin cambiar, todo menos la sesión y cuenta/clave da 403; después de cambiarla, todo anda', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    let nueva
    try {
      const admin = await s.cookiePara('admin')
      const alta = await s.pedir('POST', 'api:/usuarios', {
        cookie: admin.cookie,
        cuerpo: { nombre: 'Admin con temporal', email: `temporal-${Date.now()}@example.com`, rol: 'admin' },
      })
      const { claveTemporal, usuario } = alta.json.data
      const ingreso = await s.pedir('POST', 'api:/sesion', { cuerpo: { email: usuario.email, clave: claveTemporal } })
      const cookie = cookieDe(ingreso, s.nombreCookie)
      const permitidas = new Set(['GET /sesion', 'DELETE /sesion', 'PUT /cuenta/clave', 'POST /sesion'])
      for (const { metodo, ruta } of RUTAS) {
        if (permitidas.has(`${metodo} ${ruta}`)) continue
        const r = await s.pedir(metodo, `api:${ruta.replace(':id', String(admin.usuario.id))}`, {
          cookie,
          ...(metodo === 'GET' ? {} : { cuerpo: {} }),
        })
        assert.equal(r.status, 403, `${metodo} ${ruta}`)
        assert.deepEqual(r.json, { error: 'Tenés que cambiar la contraseña temporal antes de seguir.', debeCambiarClave: true })
      }
      const sesion = await s.pedir('GET', 'api:/sesion', { cookie })
      assert.equal(sesion.status, 200)
      assert.equal(sesion.json.data.debeCambiarClave, true)

      // La misma temporal o una actual equivocada: 400 con el campo.
      const misma = await s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual: claveTemporal, nueva: claveTemporal } })
      assert.equal(misma.status, 400)
      assert.equal(misma.json.campos.nueva, 'Tiene que ser distinta de la actual.')
      nueva = 'una frase tranquila para entrar al panel'
      const mal = await s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual: 'no-es-esta', nueva } })
      assert.equal(mal.status, 400)
      // Con la temporal pendiente, el campo es "Contraseña temporal": el mensaje habla de la temporal.
      assert.deepEqual(mal.json.campos, { actual: 'La contraseña temporal no es correcta. Revisala con quien te la dio.' })

      const cambio = await s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual: claveTemporal, nueva } })
      assert.equal(cambio.status, 200, cambio.texto)
      assert.equal(cambio.json.data.debeCambiarClave, false)
      const nuevaCookie = cookieDe(cambio, s.nombreCookie)
      assert.ok(nuevaCookie && nuevaCookie !== cookie, 'token nuevo')
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie })).status, 401, 'la sesión de la temporal se cerró')
      assert.equal((await s.pedir('GET', 'api:/usuarios', { cookie: nuevaCookie })).status, 200)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: nuevaCookie })).json.data.debeCambiarClave, false)
      const [fila] = await sql('SELECT debe_cambiar_clave, clave_temporal_vence FROM usuarios WHERE id = :id', { id: usuario.id })
      assert.deepEqual(fila, { debe_cambiar_clave: false, clave_temporal_vence: null })
      // Después de cambiarla, todo anda: ninguna ruta de la tabla da el 403 de la temporal (las que cierran la propia
      // sesión, al final). Contra otra cuenta, para no tocar la propia.
      const otra = await s.crearUsuario('editor')
      const alFinal = (r) => Number(r.metodo === 'DELETE' && !r.ruta.includes(':id'))
      for (const { metodo, ruta } of [...RUTAS].sort((a, b) => alFinal(a) - alFinal(b))) {
        if (metodo === 'POST' && ruta === '/sesion') continue
        const r = await s.pedir(metodo, `api:${ruta.replace(':id', String(otra.usuario.id))}`, {
          cookie: nuevaCookie,
          ...(metodo === 'GET' ? {} : { cuerpo: {} }),
        })
        assert.ok(!(r.status === 403 && r.json?.debeCambiarClave), `${metodo} ${ruta}`)
        assert.ok(r.status < 500, `${metodo} ${ruta}: ${r.status}`)
      }
      // La temporal ya no sirve; la nueva sí.
      assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo: { email: usuario.email, clave: claveTemporal } })).status, 401)
      assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo: { email: usuario.email, clave: nueva } })).status, 200)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    assert.ok(logs.eventos().some((e) => e.evento === 'clave_cambiada' && typeof e.usuario_id === 'number'))
    assert.ok(!logs.lineas.join('\n').includes(nueva))
  })

  test('temporal vencida: 401 con su mensaje, y solo con la clave correcta', async () => {
    const s = await levantar()
    try {
      const { email, clave, usuario } = await s.crearUsuario('editor', { temporal: true })
      await sql(`UPDATE usuarios SET clave_temporal_vence = now() - interval '1 minute' WHERE id = :id`, { id: usuario.id })
      const r = await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave } })
      assert.equal(r.status, 401)
      assert.deepEqual(r.json, { error: VENCIDA })
      assert.equal(r.h['set-cookie'], undefined)
      const mal = await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave: `${clave}!` } })
      assert.deepEqual(mal.json, { error: INCORRECTOS })
    } finally {
      await s.cerrar()
    }
  })

  test('dar una temporal cierra las sesiones de esa persona; no sobre la propia cuenta; la temporal no va al log', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    let temporal
    try {
      const admin = await s.cookiePara('admin')
      const editor = await s.cookiePara('editor')
      const otra = await s.otraSesion(editor.usuario.id)
      const r = await s.pedir('POST', `api:/usuarios/${editor.usuario.id}/clave-temporal`, { cookie: admin.cookie, cuerpo: {} })
      assert.equal(r.status, 200, r.texto)
      temporal = r.json.data.claveTemporal
      assert.match(temporal, TEMPORAL)
      assert.deepEqual(Object.keys(r.json.data), ['claveTemporal'])
      assert.equal(await sesionesDe(editor.usuario.id), 0)
      for (const c of [editor.cookie, otra.cookie]) assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: c })).status, 401)
      // La clave vieja ya no sirve; con la temporal entra y tiene que cambiarla.
      assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo: { email: editor.email, clave: editor.clave } })).status, 401)
      const ingreso = await s.pedir('POST', 'api:/sesion', { cuerpo: { email: editor.email, clave: r.json.data.claveTemporal } })
      assert.equal(ingreso.json.data.debeCambiarClave, true)

      const propia = await s.pedir('POST', `api:/usuarios/${admin.usuario.id}/clave-temporal`, { cookie: admin.cookie, cuerpo: {} })
      assert.equal(propia.status, 400)
      assert.match(propia.json.error, /Mi cuenta/)
      assert.equal((await s.pedir('POST', 'api:/usuarios/2147483647/clave-temporal', { cookie: admin.cookie, cuerpo: {} })).status, 404)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    assert.ok(!logs.lineas.join('\n').includes(temporal), 'la temporal no está en el log')
    assert.ok(logs.eventos().some((e) => e.evento === 'clave_temporal_dada' && typeof e.usuario_id === 'number'))
  })

  test('a una cuenta desactivada no se le da una temporal (409, no cambia nada); activada, sí, y con ella entra', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    try {
      const admin = await s.cookiePara('admin')
      const inactiva = await s.crearUsuario('editor', { activo: false })
      const [antes] = await sql('SELECT password_hash, debe_cambiar_clave, clave_temporal_vence FROM usuarios WHERE id = :id', {
        id: inactiva.usuario.id,
      })
      const r = await s.pedir('POST', `api:/usuarios/${inactiva.usuario.id}/clave-temporal`, { cookie: admin.cookie, cuerpo: {} })
      assert.equal(r.status, 409, r.texto)
      assert.deepEqual(r.json, {
        error: 'La cuenta está desactivada: activala primero y después dale una contraseña temporal.',
      })
      const [despues] = await sql('SELECT password_hash, debe_cambiar_clave, clave_temporal_vence FROM usuarios WHERE id = :id', {
        id: inactiva.usuario.id,
      })
      assert.deepEqual(despues, antes, 'la contraseña no cambió')
      assert.ok(!logs.eventos().some((e) => e.evento === 'clave_temporal_dada'))
      // Primero se activa; después la temporal sí sirve para entrar.
      const activar = await s.pedir('PATCH', `api:/usuarios/${inactiva.usuario.id}`, { cookie: admin.cookie, cuerpo: { activo: true } })
      assert.equal(activar.status, 200, activar.texto)
      const dada = await s.pedir('POST', `api:/usuarios/${inactiva.usuario.id}/clave-temporal`, { cookie: admin.cookie, cuerpo: {} })
      assert.equal(dada.status, 200, dada.texto)
      const ingreso = await s.pedir('POST', 'api:/sesion', { cuerpo: { email: inactiva.email, clave: dada.json.data.claveTemporal } })
      assert.equal(ingreso.status, 200, ingreso.texto)
      assert.equal(ingreso.json.data.debeCambiarClave, true)
    } finally {
      logs.detener()
      await s.cerrar()
    }
  })

  test('cambiar la clave invalida las otras sesiones; las reglas de la contraseña nueva', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('editor', { email: `lucia.prueba.${Date.now()}@example.com` })
      const otra = await s.otraSesion(yo.usuario.id)
      const casos = {
        'corta pero no': /al menos 15/,
        ['x'.repeat(20)]: /mismo carácter/,
        'mi frase larga del MuPa querido': /"mupa"/,
        'el PALEONTOLÓGICO es un lugar lindo': /"paleontológico"/,
        'visitar el museo los domingos': /"museo"/,
        [`frase con ${yo.email.split('@')[0]} adentro`]: /tu correo/,
        ['ñ'.repeat(64) + 'á'.repeat(65)]: /hasta 128/,
      }
      for (const [nueva, mensaje] of Object.entries(casos)) {
        const r = await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva } })
        assert.equal(r.status, 400, nueva)
        assert.match(r.json.campos.nueva, mensaje, nueva)
      }
      // 15 caracteres con tildes (contados después de NFKC) sí sirven; y el cambio deja una sola sesión, la nueva.
      const nueva = 'canción de cuna'
      const cambio = await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva } })
      assert.equal(cambio.status, 200, cambio.texto)
      assert.equal(await sesionesDe(yo.usuario.id), 1)
      for (const c of [yo.cookie, otra.cookie]) assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: c })).status, 401)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: cookieDe(cambio, s.nombreCookie) })).status, 200)
      // Escrita con la tilde descompuesta (NFD), es la misma contraseña.
      const ingreso = await s.pedir('POST', 'api:/sesion', { cuerpo: { email: yo.email, clave: nueva.normalize('NFD') } })
      assert.equal(ingreso.status, 200)
    } finally {
      await s.cerrar()
    }
  })

  test('el último admin activo no se puede desactivar ni bajar de rol (409), tampoco con dos cambios a la vez', async () => {
    const s = await levantar()
    try {
      // Que en la base no quede ningún otro admin activo (las pruebas anteriores crearon varios).
      await sql(`UPDATE usuarios SET activo = false WHERE rol = 'admin'`)
      const a = await s.cookiePara('admin')
      const ruta = `api:/usuarios/${a.usuario.id}`
      for (const cuerpo of [{ rol: 'editor' }, { activo: false }, { rol: 'editor', activo: false }]) {
        const r = await s.pedir('PATCH', ruta, { cookie: a.cookie, cuerpo })
        assert.equal(r.status, 409, JSON.stringify(cuerpo))
        assert.match(r.json.error, /único administrador activo/)
      }
      assert.equal((await s.pedir('PATCH', ruta, { cookie: a.cookie, cuerpo: { nombre: 'Sigue siendo admin' } })).status, 200)
      assert.equal((await s.pedir('PATCH', ruta, { cookie: a.cookie, cuerpo: { rol: 'admin', activo: true } })).status, 200)

      // Dos admins, y uno manda a la vez "desactivá al otro" y "bajame a editor": nunca quedan cero.
      for (let vuelta = 0; vuelta < 5; vuelta++) {
        await sql(`UPDATE usuarios SET activo = false WHERE rol = 'admin'`)
        const x = await s.cookiePara('admin')
        const y = await s.crearUsuario('admin')
        const [r1, r2] = await Promise.all([
          s.pedir('PATCH', `api:/usuarios/${y.usuario.id}`, { cookie: x.cookie, cuerpo: { activo: false } }),
          s.pedir('PATCH', `api:/usuarios/${x.usuario.id}`, { cookie: x.cookie, cuerpo: { rol: 'editor' } }),
        ])
        const estados = [r1.status, r2.status].sort()
        assert.equal(estados.filter((e) => e === 200).length, 1, `vuelta ${vuelta}: ${estados}`)
        // El que pierde: 409 (quedaría sin admins), 401 (ya le cerraron la sesión) o 403 (cuando le tocó el turno
        // ya no era admin: bloquearAdmins lo vuelve a mirar dentro de la transacción).
        assert.ok([401, 403, 409].includes(estados.find((e) => e !== 200)), `vuelta ${vuelta}: ${estados}`)
        const [{ n }] = await sql(`SELECT count(*) AS n FROM usuarios WHERE rol = 'admin' AND activo`)
        assert.equal(Number(n), 1, `vuelta ${vuelta}`)
      }
    } finally {
      await s.cerrar()
    }
  })

  test('salir borra la fila y la cookie; cerrar en todos lados cierra todas', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('editor')
      const r = await s.pedir('DELETE', 'api:/sesion', { cookie: yo.cookie })
      assert.equal(r.status, 200)
      assert.deepEqual(r.json, { data: null })
      assert.match(r.h['set-cookie'][0], /^__Secure-mupa_sesion=; Path=\/administracion; Expires=Thu, 01 Jan 1970/)
      assert.equal(await sesionesDe(yo.usuario.id), 0)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })).status, 401)
      // Sin cookie, salir también responde bien.
      assert.equal((await s.pedir('DELETE', 'api:/sesion')).status, 200)

      const dos = await s.otraSesion(yo.usuario.id)
      const tres = await s.otraSesion(yo.usuario.id)
      const todas = await s.pedir('DELETE', 'api:/cuenta/sesiones', { cookie: dos.cookie })
      assert.equal(todas.status, 200)
      assert.deepEqual(todas.json, { data: { cerradas: 2 } })
      for (const c of [dos.cookie, tres.cookie]) assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: c })).status, 401)

      // Un admin cierra las sesiones de otra persona.
      const admin = await s.cookiePara('admin')
      const otra = await s.cookiePara('editor')
      const cerradas = await s.pedir('DELETE', `api:/usuarios/${otra.usuario.id}/sesiones`, { cookie: admin.cookie })
      assert.deepEqual(cerradas.json, { data: { cerradas: 1 } })
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: otra.cookie })).status, 401)
      // Volver a entrar desde un navegador que ya tenía sesión: la anterior se borra (token nuevo).
      const yoDeNuevo = await s.cookiePara('editor')
      const reingreso = await s.pedir('POST', 'api:/sesion', {
        cookie: yoDeNuevo.cookie,
        cuerpo: { email: yoDeNuevo.email, clave: yoDeNuevo.clave },
      })
      assert.equal(reingreso.status, 200)
      assert.notEqual(cookieDe(reingreso, s.nombreCookie), yoDeNuevo.cookie)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: yoDeNuevo.cookie })).status, 401)
      assert.equal(await sesionesDe(yoDeNuevo.usuario.id), 1)
    } finally {
      await s.cerrar()
    }
  })

  test('ninguna respuesta pública lleva Set-Cookie, aunque el pedido traiga la cookie de sesión', async () => {
    const s = await levantar()
    try {
      const { cookie } = await s.cookiePara('admin')
      for (const ruta of ['/', '/salud', '/robots.txt', '/sitemap.xml', '/no-existe', '/favicon.svg', '/assets/app-abc123.js', '/assets/falta.js', '/index.html', '/administracion/']) {
        const r = await s.pedir('GET', ruta, { cookie })
        assert.ok(r.status < 500, `${ruta}: ${r.status}`)
        assert.equal(r.h['set-cookie'], undefined, ruta)
      }
      const post = await s.pedir('POST', '/', { cookie, cuerpo: {} })
      assert.equal(post.h['set-cookie'], undefined)
    } finally {
      await s.cerrar()
    }
  })

  test('la tarea diaria borra las sesiones vencidas por máximo y por inactividad', async () => {
    const s = await levantar()
    try {
      const vigente = await s.cookiePara('editor')
      const vencida = await s.cookiePara('editor')
      const inactiva = await s.cookiePara('editor')
      await sql(`UPDATE sesiones SET expira_en = now() - interval '1 minute' WHERE token_hash = :h`, { h: sha256(vencida.token) })
      await sql(`UPDATE sesiones SET ultimo_uso = now() - interval '3 hours' WHERE token_hash = :h`, { h: sha256(inactiva.token) })
      const logs = escucharLogs()
      const tareas = programarTareas({ sequelize: base.sequelize })
      try {
        await tareas.listas
      } finally {
        tareas.detener()
        logs.detener()
      }
      assert.ok(logs.eventos().some((e) => e.evento === 'sesiones_vencidas' && e.borradas >= 2))
      assert.equal(await sesionesDe(vigente.usuario.id), 1)
      assert.equal(await sesionesDe(vencida.usuario.id), 0)
      assert.equal(await sesionesDe(inactiva.usuario.id), 0)
    } finally {
      await s.cerrar()
    }
  })

  test('crearAdmin() y restablecerAdmin() de la llave de emergencia; sus temporales no van al log', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    const temporales = []
    try {
      const email = `emergencia-${Date.now()}@example.com`
      const { usuario, claveTemporal } = await crearAdmin(base.sequelize, { email: ` ${email.toUpperCase()} `, nombre: ' Soporte ' })
      assert.equal(usuario.email, email)
      assert.equal(usuario.nombre, 'Soporte')
      assert.equal(usuario.rol, 'admin')
      assert.equal(usuario.debeCambiarClave, true)
      assert.match(claveTemporal, TEMPORAL)
      temporales.push(claveTemporal)
      assert.ok(await verificarClave(usuario.passwordHash, claveTemporal))
      const ingreso = await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave: claveTemporal } })
      assert.equal(ingreso.json.data.debeCambiarClave, true)
      await assert.rejects(crearAdmin(base.sequelize, { email, nombre: 'Otra vez' }), /restablecer-admin/)
      await assert.rejects(crearAdmin(base.sequelize, { email: 'no es un correo', nombre: 'X' }))

      // Desactivado, editor y con una sesión abierta: restablecer lo deja activo, admin, con otra temporal y sin sesiones.
      await sql(`UPDATE usuarios SET activo = false, rol = 'editor' WHERE id = :id`, { id: usuario.id })
      await s.otraSesion(usuario.id)
      const r = await restablecerAdmin(base.sequelize, { email })
      temporales.push(r.claveTemporal)
      assert.notEqual(r.claveTemporal, claveTemporal)
      assert.match(r.claveTemporal, TEMPORAL)
      const [fila] = await sql('SELECT activo, rol, debe_cambiar_clave FROM usuarios WHERE id = :id', { id: usuario.id })
      assert.deepEqual(fila, { activo: true, rol: 'admin', debe_cambiar_clave: true })
      assert.equal(await sesionesDe(usuario.id), 0)
      assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave: claveTemporal } })).status, 401)
      assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave: r.claveTemporal } })).status, 200)
      await assert.rejects(restablecerAdmin(base.sequelize, { email: 'nadie@example.com' }), /crear-admin/)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    const todo = logs.lineas.join('\n')
    assert.equal(temporales.length, 2)
    for (const t of temporales) assert.ok(!todo.includes(t), 'la temporal no está en el log')
  })

  test('las contraseñas de las pruebas no se repiten (claveAlAzar)', () => {
    assert.notEqual(claveAlAzar(), claveAlAzar())
  })

  test('un correo que no existe o una cuenta inactiva pasan igual por argon2, contra el hash de relleno', async () => {
    const s = await levantar()
    const relleno = await hashDeRelleno()
    const inactiva = await s.crearUsuario('editor', { activo: false })
    const activa = await s.crearUsuario('editor')
    const espia = mock.method(argon2, 'verify')
    try {
      for (const cuerpo of [
        { email: 'nadie@example.com', clave: 'lo que sea' },
        { email: inactiva.email, clave: inactiva.clave },
        { email: activa.email, clave: 'no es esta' },
      ]) {
        assert.equal((await s.pedir('POST', 'api:/sesion', { cuerpo })).status, 401)
      }
    } finally {
      espia.mock.restore()
      await s.cerrar()
    }
    assert.deepEqual(
      espia.mock.calls.map((c) => c.arguments[0] === relleno),
      [true, true, false],
      'una verificación por intento: las dos primeras contra el relleno, la tercera contra el hash de la cuenta',
    )
  })

  test('el límite por usuario: 300 pedidos por minuto, después 429 con las cabeceras del panel; a otra cuenta no la toca', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('editor')
      const otra = await s.cookiePara('editor')
      const estados = []
      for (let tanda = 0; tanda < 15; tanda++) {
        const respuestas = await Promise.all(Array.from({ length: 20 }, () => s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })))
        estados.push(...respuestas.map((r) => r.status))
      }
      assert.equal(estados.filter((e) => e === 200).length, 300)
      const logs = escucharLogs()
      try {
        for (let i = 0; i < 3; i++) {
          const pasado = await s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })
          assert.equal(pasado.status, 429)
          assert.deepEqual(pasado.json, { error: 'Demasiados pedidos. Esperá un minuto.' })
          cabecerasDelPanel(pasado, 'límite por usuario')
        }
      } finally {
        logs.detener()
      }
      // Una sola línea en el log, aunque se bloquearon 3.
      assert.deepEqual(logs.eventos().map((e) => e.evento), ['limite_usuario'])
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: otra.cookie })).status, 200)
    } finally {
      await s.cerrar()
    }
  })

  test('la contraseña actual equivocada: 5 cada 15 minutos y después 429; una nueva que no cumple las reglas no cuenta; el cambio correcto pone en cero', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    const cambiar = (cookie, actual, nueva) => s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual, nueva } })
    let yo
    try {
      yo = await s.cookiePara('editor')
      // Con la actual correcta pero una nueva que no sirve: 400 en "nueva", y no cuentan.
      for (let i = 0; i < 3; i++) {
        const r = await cambiar(yo.cookie, yo.clave, 'corta')
        assert.equal(r.status, 400)
        assert.ok(r.json.campos.nueva)
      }
      for (let i = 0; i < 5; i++) {
        const r = await cambiar(yo.cookie, `no es la actual ${i}`, 'una frase nueva cualquiera')
        assert.equal(r.status, 400, `intento ${i + 1}`)
        assert.deepEqual(r.json.campos, { actual: 'La contraseña actual no es correcta.' })
      }
      // El sexto, aunque traiga la actual correcta: 429. La sesión sigue.
      const bloqueado = await cambiar(yo.cookie, yo.clave, 'una frase nueva cualquiera')
      assert.equal(bloqueado.status, 429)
      assert.deepEqual(bloqueado.json, { error: 'Demasiados intentos. Esperá 15 minutos.' })
      cabecerasDelPanel(bloqueado, 'límite de la actual')
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })).status, 200)

      // Otra cuenta no está afectada; 4 equivocadas y la correcta ponen en cero: después entran 5 más antes del 429.
      const otra = await s.cookiePara('editor')
      for (let i = 0; i < 4; i++) assert.equal((await cambiar(otra.cookie, 'mal', 'una frase nueva cualquiera')).status, 400)
      const bien = await cambiar(otra.cookie, otra.clave, 'otra frase nueva cualquiera')
      assert.equal(bien.status, 200, bien.texto)
      const cookie = cookieDe(bien, s.nombreCookie)
      for (let i = 0; i < 5; i++) assert.equal((await cambiar(cookie, 'mal', 'una frase más para probar')).status, 400, `después ${i + 1}`)
      assert.equal((await cambiar(cookie, 'otra frase nueva cualquiera', 'una frase más para probar')).status, 429)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    const fallidos = logs.eventos().filter((e) => e.evento === 'cambio_clave_fallido')
    assert.equal(fallidos.length, 14)
    for (const e of fallidos) assert.deepEqual(Object.keys(e).sort(), ['evento', 'nivel', 't', 'usuario_id'])
    assert.ok(fallidos.some((e) => e.usuario_id === yo.usuario.id))
    assert.ok(logs.eventos().some((e) => e.evento === 'limite_clave_actual'))
    assert.ok(!logs.lineas.join('\n').includes(yo.clave))
  })

  test('la temporal se puede escribir en mayúsculas, sin guiones o con espacios; la nueva no puede ser ella misma así', async () => {
    const s = await levantar()
    try {
      const admin = await s.cookiePara('admin')
      const alta = await s.pedir('POST', 'api:/usuarios', {
        cookie: admin.cookie,
        cuerpo: { nombre: 'Con el celular', email: `celular-${Date.now()}@example.com`, rol: 'editor' },
      })
      const { claveTemporal: t, usuario } = alta.json.data
      const entrar = (clave, ip) => s.pedir('POST', 'api:/sesion', { ip, cuerpo: { email: usuario.email, clave } })
      let cookie
      for (const [i, escrita] of [t.toUpperCase(), t.replaceAll('-', ''), ` ${t.replaceAll('-', ' ')} `].entries()) {
        const r = await entrar(escrita, `203.0.113.6${i}`)
        assert.equal(r.status, 200, escrita)
        assert.equal(r.json.data.debeCambiarClave, true)
        cookie = cookieDe(r, s.nombreCookie)
      }
      // Una que no tiene forma de temporal sigue siendo incorrecta.
      assert.equal((await entrar(`${t}x`, '203.0.113.64')).status, 401)
      // Como "actual" también vale así; la nueva no puede ser la temporal en mayúsculas ni sin guiones.
      for (const nueva of [t.toUpperCase(), t.replaceAll('-', '')]) {
        const r = await s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual: t.toUpperCase(), nueva } })
        assert.equal(r.status, 400, nueva)
        assert.equal(r.json.campos.nueva, 'Tiene que ser distinta de la actual.')
      }
      const cambio = await s.pedir('PUT', 'api:/cuenta/clave', { cookie, cuerpo: { actual: t.replaceAll('-', ''), nueva: 'una frase para el celular' } })
      assert.equal(cambio.status, 200, cambio.texto)
      // Sin temporal pendiente no se acomoda nada: ni la vieja ni la nueva en mayúsculas entran.
      assert.equal((await entrar(t, '203.0.113.65')).status, 401)
      assert.equal((await entrar('UNA FRASE PARA EL CELULAR', '203.0.113.66')).status, 401)
      assert.equal((await entrar('una frase para el celular', '203.0.113.67')).status, 200)
    } finally {
      await s.cerrar()
    }
  })

  test('una contraseña escrita con las tildes separadas (NFD): si se acepta al cambiarla, deja entrar y sirve de "actual"', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('editor')
      // 320 unidades tal como llega (120 caracteres después de NFKC): se rechaza, porque el ingreso corta en 256.
      const larga = await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva: fraseNfd(100) } })
      assert.equal(larga.status, 400)
      assert.match(larga.json.campos.nueva, /hasta 128/)
      // 256 unidades: se acepta, y escrita igual (o compuesta, NFC) deja entrar y sirve para volver a cambiarla.
      const nfd = fraseNfd(80)
      assert.equal(nfd.length, 256)
      const cambio = await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva: nfd } })
      assert.equal(cambio.status, 200, cambio.texto)
      for (const [i, escrita] of [nfd, nfd.normalize('NFC')].entries()) {
        const r = await s.pedir('POST', 'api:/sesion', { ip: `203.0.113.7${i}`, cuerpo: { email: yo.email, clave: escrita } })
        assert.equal(r.status, 200, `ingreso ${i}`)
      }
      const otraVez = await s.pedir('PUT', 'api:/cuenta/clave', {
        cookie: cookieDe(cambio, s.nombreCookie),
        cuerpo: { actual: nfd, nueva: 'y después otra frase cualquiera' },
      })
      assert.equal(otraVez.status, 200, otraVez.texto)
    } finally {
      await s.cerrar()
    }
  })

  test('carreras: si la contraseña cambia mientras alguien entra con la vieja, no entra', async () => {
    const s = await levantar()
    try {
      const { usuario, email, clave } = await s.crearUsuario('editor')
      const otroHash = await hashClave(claveAlAzar())
      const r = await cruzar(
        usuario.id,
        () => s.pedir('POST', 'api:/sesion', { cuerpo: { email, clave } }),
        (sqlT) => sqlT('UPDATE usuarios SET password_hash = :h WHERE id = :id', { h: otroHash, id: usuario.id }),
      )
      assert.equal(r.status, 401)
      assert.deepEqual(r.json, { error: INCORRECTOS })
      assert.equal(r.h['set-cookie'], undefined)
      assert.equal(await sesionesDe(usuario.id), 0)
      // Lo mismo si la desactivan en ese momento.
      const otra = await s.crearUsuario('editor')
      const r2 = await cruzar(
        otra.usuario.id,
        () => s.pedir('POST', 'api:/sesion', { cuerpo: { email: otra.email, clave: otra.clave } }),
        (sqlT) => sqlT('UPDATE usuarios SET activo = false WHERE id = :id', { id: otra.usuario.id }),
      )
      assert.equal(r2.status, 401)
      assert.equal(await sesionesDe(otra.usuario.id), 0)
    } finally {
      await s.cerrar()
    }
  })

  test('carreras: si un admin da una temporal mientras la persona cambia su contraseña, el cambio no la pisa (409)', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('editor')
      const hashTemporal = await hashClave('temporal de un admin')
      const r = await cruzar(
        yo.usuario.id,
        () => s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva: 'una frase nueva y tranquila' } }),
        async (sqlT) => {
          await sqlT(
            `UPDATE usuarios SET password_hash = :h, debe_cambiar_clave = true, clave_temporal_vence = now() + interval '72 hours' WHERE id = :id`,
            { h: hashTemporal, id: yo.usuario.id },
          )
          await sqlT('DELETE FROM sesiones WHERE usuario_id = :id', { id: yo.usuario.id })
        },
      )
      assert.equal(r.status, 409, r.texto)
      assert.match(r.json.error, /cambió mientras tanto/)
      assert.equal(r.h['set-cookie'], undefined)
      const [fila] = await sql('SELECT password_hash, debe_cambiar_clave FROM usuarios WHERE id = :id', { id: yo.usuario.id })
      assert.deepEqual(fila, { password_hash: hashTemporal, debe_cambiar_clave: true })
      assert.equal(await sesionesDe(yo.usuario.id), 0)
    } finally {
      await s.cerrar()
    }
  })

  test('carreras: un admin al que bajan de rol en medio de un pedido no lo termina (403), en el alta, los cambios y las temporales', async () => {
    const s = await levantar()
    try {
      await s.crearUsuario('admin') // que quede otro admin activo
      const pedidos = {
        alta: (x) => s.pedir('POST', 'api:/usuarios', { cookie: x.cookie, cuerpo: { nombre: 'Cuenta colada', email: `colada-${Date.now()}@example.com`, rol: 'admin' } }),
        cambio: (x, e) => s.pedir('PATCH', `api:/usuarios/${e.usuario.id}`, { cookie: x.cookie, cuerpo: { rol: 'admin' } }),
        temporal: (x, e) => s.pedir('POST', `api:/usuarios/${e.usuario.id}/clave-temporal`, { cookie: x.cookie, cuerpo: {} }),
      }
      for (const [nombre, mandar] of Object.entries(pedidos)) {
        const x = await s.cookiePara('admin')
        const e = await s.crearUsuario('editor')
        const r = await cruzar(
          x.usuario.id,
          () => mandar(x, e),
          (sqlT) => sqlT(`UPDATE usuarios SET rol = 'editor' WHERE id = :id`, { id: x.usuario.id }),
        )
        assert.equal(r.status, 403, `${nombre}: ${r.texto}`)
        assert.deepEqual(r.json, { error: 'No tenés permiso para esto.' })
        const [fila] = await sql('SELECT rol, debe_cambiar_clave FROM usuarios WHERE id = :id', { id: e.usuario.id })
        assert.deepEqual(fila, { rol: 'editor', debe_cambiar_clave: false }, nombre)
      }
      const [{ n }] = await sql(`SELECT count(*) AS n FROM usuarios WHERE email LIKE 'colada-%'`)
      assert.equal(Number(n), 0)
    } finally {
      await s.cerrar()
    }
  })

  test('una sesión abierta con la temporal se corta cuando la temporal vence: 401 con su mensaje y se borra', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    try {
      const yo = await s.cookiePara('editor', { temporal: true })
      const otra = await s.otraSesion(yo.usuario.id)
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })).status, 200)
      await sql(`UPDATE usuarios SET clave_temporal_vence = now() - interval '1 minute' WHERE id = :id`, { id: yo.usuario.id })
      const r = await s.pedir('GET', 'api:/sesion', { cookie: yo.cookie })
      assert.equal(r.status, 401)
      assert.deepEqual(r.json, { error: VENCIDA })
      assert.match(r.h['set-cookie'][0], /^__Secure-mupa_sesion=; .*Expires=Thu, 01 Jan 1970/)
      assert.equal(await sesionesDe(yo.usuario.id), 1, 'se borró esa sesión')
      // Tampoco sirve para cambiar la contraseña con la temporal vencida (es la ruta que pasa con la temporal).
      const cambio = await s.pedir('PUT', 'api:/cuenta/clave', {
        cookie: otra.cookie,
        cuerpo: { actual: yo.clave, nueva: 'una frase nueva cualquiera' },
      })
      assert.equal(cambio.status, 401)
      assert.deepEqual(cambio.json, { error: VENCIDA })
      assert.equal(await sesionesDe(yo.usuario.id), 0)
      const [fila] = await sql('SELECT debe_cambiar_clave FROM usuarios WHERE id = :id', { id: yo.usuario.id })
      assert.equal(fila.debe_cambiar_clave, true, 'la contraseña no cambió')
      // Una cuenta sin temporal pendiente no se ve afectada (clave_temporal_vence es null).
      const normal = await s.cookiePara('editor')
      assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: normal.cookie })).status, 200)
    } finally {
      logs.detener()
      await s.cerrar()
    }
    const cortes = logs.eventos().filter((e) => e.evento === 'sesion_temporal_vencida')
    assert.equal(cortes.length, 2)
    for (const e of cortes) assert.deepEqual(Object.keys(e).sort(), ['evento', 'nivel', 't', 'usuario_id'])
  })

  test('el nombre: sin caracteres que no se pudieron leer (400); las respuestas traen lo que quedó en la base', async () => {
    const s = await levantar()
    try {
      const yo = await s.cookiePara('admin')
      const otro = await s.crearUsuario('editor')
      const nombreEnLaBase = async (id) => (await sql('SELECT nombre FROM usuarios WHERE id = :id', { id }))[0].nombre
      const ILEGIBLE = { error: 'Revisá los datos.', campos: { nombre: 'El nombre tiene caracteres que no se pudieron leer. Escribilo de nuevo.' } }
      // JSON.parse deja pasar un surrogate suelto escrito como \ud800; bytes que no son UTF-8 llegan como U+FFFD.
      const malos = [
        '{"nombre":"Ana \\ud800"}',
        '{"nombre":"Ana \\udc00 B"}',
        '{"nombre":"Ana \\ufffd"}',
        Buffer.concat([Buffer.from('{"nombre":"Ana '), Buffer.from([0xff, 0xfe]), Buffer.from('"}')]),
      ]
      for (const cuerpo of malos) {
        const propio = await s.pedir('PUT', 'api:/cuenta', { cookie: yo.cookie, cuerpo })
        assert.equal(propio.status, 400, String(cuerpo))
        assert.deepEqual(propio.json, ILEGIBLE)
        const ajeno = await s.pedir('PATCH', `api:/usuarios/${otro.usuario.id}`, { cookie: yo.cookie, cuerpo })
        assert.equal(ajeno.status, 400, String(cuerpo))
        assert.deepEqual(ajeno.json, ILEGIBLE)
      }
      const alta = await s.pedir('POST', 'api:/usuarios', {
        cookie: yo.cookie,
        cuerpo: `{"nombre":"Ana \\ud800","email":"ilegible-${Date.now()}@example.com","rol":"editor"}`,
      })
      assert.equal(alta.status, 400)
      assert.deepEqual(alta.json, ILEGIBLE)
      assert.equal(await nombreEnLaBase(yo.usuario.id), yo.usuario.nombre)
      assert.equal(await nombreEnLaBase(otro.usuario.id), otro.usuario.nombre)

      // Uno válido: la respuesta trae lo que quedó en la base (sin los espacios de los bordes).
      const propio = await s.pedir('PUT', 'api:/cuenta', { cookie: yo.cookie, cuerpo: { nombre: '  Ñandú 🦖 Pérez  ' } })
      assert.equal(propio.status, 200)
      assert.equal(await nombreEnLaBase(yo.usuario.id), 'Ñandú 🦖 Pérez')
      assert.equal(propio.json.data.usuario.nombre, 'Ñandú 🦖 Pérez')
      const ajeno = await s.pedir('PATCH', `api:/usuarios/${otro.usuario.id}`, { cookie: yo.cookie, cuerpo: { nombre: ' Otra Persona ' } })
      assert.equal(ajeno.status, 200)
      assert.equal(await nombreEnLaBase(otro.usuario.id), 'Otra Persona')
      assert.equal(ajeno.json.data.usuario.nombre, 'Otra Persona')
    } finally {
      await s.cerrar()
    }
  })

  test('un límite alcanzado escribe una sola línea de aviso por ventana y clave, sin IP ni correo', async () => {
    const s = await levantar()
    const logs = escucharLogs()
    try {
      const { email } = await s.crearUsuario('editor')
      const ip = '203.0.113.40'
      // 5 fallidos (401), 5 más contra el límite de correo + IP (429) y 3 contra el de la IP (429, a partir del 11.º).
      const estados = []
      for (let i = 0; i < 13; i++) estados.push((await s.pedir('POST', 'api:/sesion', { ip, cuerpo: { email, clave: 'mal' } })).status)
      assert.deepEqual(estados, [...Array(5).fill(401), ...Array(8).fill(429)])
      // La actual equivocada: 5 y después 3 bloqueados.
      const yo = await s.cookiePara('editor')
      for (let i = 0; i < 8; i++) {
        await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: `mal ${i}`, nueva: 'una frase nueva cualquiera' } })
      }
      assert.equal(
        (await s.pedir('PUT', 'api:/cuenta/clave', { cookie: yo.cookie, cuerpo: { actual: yo.clave, nueva: 'una frase nueva cualquiera' } })).status,
        429,
      )
    } finally {
      logs.detener()
      await s.cerrar()
    }
    const avisos = logs.eventos().filter((e) => e.evento.startsWith('limite_'))
    assert.deepEqual(
      avisos.map((e) => e.evento).sort(),
      ['limite_clave_actual', 'limite_ingreso_correo', 'limite_ingreso_ip'],
    )
    for (const e of avisos) assert.deepEqual(Object.keys(e).sort(), ['evento', 'nivel', 't'])
  })
})
