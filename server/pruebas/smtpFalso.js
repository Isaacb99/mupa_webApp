// Un servidor SMTP falso, escrito a mano con node:net, para probar server/correo.js de punta a punta sin mandar ningún
// mail de verdad (contacto.test.js). No es un archivo de pruebas (npm test corre solo *.test.js).
// Escucha solo en 127.0.0.1, en un puerto libre, y habla lo mínimo del protocolo que usa nodemailer: el saludo, EHLO
// (sin STARTTLS: la conexión queda en texto plano, solo local), AUTH PLAIN o LOGIN, MAIL FROM, RCPT TO, DATA (con el
// punto final y sin los puntos duplicados), RSET, NOOP y QUIT. Según `modo`:
// - 'acepta': todo bien; cada mensaje queda en `mensajes` ({ de, para, datos }, datos: el mail crudo);
// - 'rechaza': la autenticación da 535 (como una contraseña equivocada: nodemailer tira EAUTH);
// - 'corta': cierra la conexión apenas se abre (como un servidor caído a mitad: ECONNECTION).
// El modo se puede cambiar entre pruebas (servidor.modo = 'rechaza').
import { createServer } from 'node:net'

/** @param {{ modo?: 'acepta' | 'rechaza' | 'corta' }} [opciones] */
export async function smtpFalso({ modo = 'acepta' } = {}) {
  const mensajes = []
  const sockets = new Set()
  const estado = { modo }

  const servidor = createServer((socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', () => {})
    if (estado.modo === 'corta') {
      socket.destroy()
      return
    }
    socket.setEncoding('utf8')
    const escribir = (linea) => socket.write(`${linea}\r\n`)
    let pendiente = ''
    let enDatos = false
    let datos = []
    let auth = null // 'plain' | 'login-usuario' | 'login-clave' mientras espera la respuesta de un 334
    let actual = { de: null, para: [] }

    const autenticar = () => escribir(estado.modo === 'rechaza' ? '535 5.7.8 Error: authentication failed' : '235 2.7.0 Authentication successful')

    function linea(texto) {
      if (enDatos) {
        if (texto === '.') {
          enDatos = false
          mensajes.push({ ...actual, datos: datos.join('\r\n') })
          actual = { de: null, para: [] }
          datos = []
          escribir('250 2.0.0 Ok: queued')
        } else {
          datos.push(texto.startsWith('..') ? texto.slice(1) : texto)
        }
        return
      }
      if (auth) {
        const paso = auth
        if (paso === 'login-usuario') {
          auth = 'login-clave'
          escribir('334 UGFzc3dvcmQ6')
          return
        }
        auth = null
        autenticar()
        return
      }
      const [comando, ...resto] = texto.split(' ')
      const verbo = comando.toUpperCase()
      if (verbo === 'EHLO') {
        escribir('250-falso.localhost')
        escribir('250-AUTH PLAIN LOGIN')
        escribir('250 8BITMIME')
      } else if (verbo === 'HELO') {
        escribir('250 falso.localhost')
      } else if (verbo === 'AUTH') {
        const tipo = (resto[0] ?? '').toUpperCase()
        if (tipo === 'PLAIN' && resto[1]) autenticar()
        else if (tipo === 'PLAIN') {
          auth = 'plain'
          escribir('334 ')
        } else if (tipo === 'LOGIN') {
          auth = 'login-usuario'
          escribir('334 VXNlcm5hbWU6')
        } else escribir('504 5.5.4 Unrecognized authentication type')
      } else if (verbo === 'MAIL') {
        actual.de = /<([^>]*)>/.exec(texto)?.[1] ?? null
        escribir('250 2.1.0 Ok')
      } else if (verbo === 'RCPT') {
        actual.para.push(/<([^>]*)>/.exec(texto)?.[1] ?? null)
        escribir('250 2.1.5 Ok')
      } else if (verbo === 'DATA') {
        enDatos = true
        escribir('354 End data with <CR><LF>.<CR><LF>')
      } else if (verbo === 'RSET') {
        actual = { de: null, para: [] }
        escribir('250 2.0.0 Ok')
      } else if (verbo === 'NOOP') {
        escribir('250 2.0.0 Ok')
      } else if (verbo === 'QUIT') {
        escribir('221 2.0.0 Bye')
        socket.end()
      } else {
        escribir('502 5.5.2 Error: command not recognized')
      }
    }

    socket.on('data', (trozo) => {
      pendiente += trozo
      let i
      while ((i = pendiente.indexOf('\r\n')) >= 0) {
        const texto = pendiente.slice(0, i)
        pendiente = pendiente.slice(i + 2)
        linea(texto)
      }
    })
    escribir('220 falso.localhost ESMTP')
  })

  await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver))
  return {
    puerto: servidor.address().port,
    mensajes,
    get modo() {
      return estado.modo
    },
    set modo(valor) {
      estado.modo = valor
    },
    cerrar: () =>
      new Promise((resolver) => {
        for (const s of sockets) s.destroy()
        servidor.close(() => resolver())
      }),
  }
}
