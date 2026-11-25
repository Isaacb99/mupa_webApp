// tools/audioguia-guiones.mjs, el corte del guion de la audioguía en las transcripciones de cada estación
// (especificación de las audioguías, versión 2, 1.2, 12 y 12.1; desde el 25/11/2026), sin base ni navegador: cortarGuion
// con un guion de juguete escrito acá (con BOM y CRLF, «Audioguía 2:» sin cero, un encabezado que empieza por el número,
// el FOLEY antes y después de la marca de la voz, corchetes, espacios dobles, un párrafo que termina con una cita y otro
// que empieza con una cifra; una raya con algo después y un renglón todo en mayúsculas, con su aviso) y lo que tiene
// que dar error (una estación sin la marca de la voz, un número repetido, uno
// que falta, uno de más, una transcripción vacía o más larga que TRANSCRIPCION_MAX); y el comando: nunca escribe en
// audioguias/ (tampoco por una junction, con otra caja ni en DIR_AUDIOGUIAS), con un error no escribe ninguna
// transcripción, y con el manifiesto real corta las 35. Si está el guion del museo (no versionado, en
// tools/salida/audioguias/guion/), se corta sin errores.
// Las carpetas de salida van a una temporal que se borra al terminar.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  carpetaProhibida,
  cortarGuion,
  DIR_DEL_REPO,
  encabezadoDeEstacion,
  esEncabezadoDeEspacio,
  estaDentro,
  informe,
  leerArgumentos,
  palabrasDichas,
  segundosDe,
  textoDelArchivo,
  todoEnMayusculas,
} from '../../tools/audioguia-guiones.mjs'
import { parrafosDe, TRANSCRIPCION_MAX } from '../audioguia/pistas.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const HERRAMIENTA = join(RAIZ, 'tools', 'audioguia-guiones.mjs')
const BOM = String.fromCharCode(0xfeff)
const NBSP = String.fromCharCode(0xa0)

const temporales = []
const temporal = () => {
  const dir = mkdtempSync(join(tmpdir(), 'audioguia-guiones-'))
  temporales.push(dir)
  return dir
}
after(() => {
  for (const dir of temporales) rmSync(dir, { recursive: true, force: true })
})

/** Un manifiesto de juguete: 5 estaciones en 4 grupos, con Recepción al principio y al final. */
const MANIFIESTO = Object.freeze({
  version: 1,
  recorrido: [
    { espacio: 'recepcion', nombre: 'Recepción', nombreGuion: 'RECEPCIÓN', estaciones: [{ numero: 1, titulo: 'Bienvenida al MUPA' }] },
    {
      espacio: 'sala-1',
      nombre: 'Sala 1',
      nombreGuion: 'SALA 1',
      titulo: 'EL CICLO DE LA VIDA',
      lema: 'Empecemos desde cero',
      estaciones: [
        { numero: 2, titulo: 'Empecemos desde cero' },
        { numero: 3, titulo: 'Geología: una historia escrita en las rocas' },
      ],
    },
    {
      espacio: 'sala-5',
      nombre: 'Sala 5',
      nombreGuion: 'SALA 5',
      titulo: 'GEOLOGÍA',
      lema: 'La historia escrita en rocas',
      estaciones: [{ numero: 4, titulo: 'Ciclo de las rocas' }],
    },
    { espacio: 'recepcion', nombre: 'Recepción', nombreGuion: 'RECEPCIÓN', estaciones: [{ numero: 5, titulo: 'Despedida MUPA' }] },
  ],
})

/** Los renglones del guion de juguete, con la forma del documento del museo («EXPERIENCIA MUPA 2026»). */
const RENGLONES = [
  'EXPERIENCIA DE PRUEBA',
  'Duración de cada pista: entre 60-90 segundos ',
  '',
  'DESGLOSE DE PISTAS - LISTA DE REPRODUCCIÓN',
  'RECEPCIÓN',
  '* AUDIOGUÍA 01: Bienvenida al MUPA',
  'SALA 1 “EL CICLO DE LA VIDA. Empecemos desde cero”.',
  '* AUDIOGUÍA 02: Empecemos desde cero (Referencial  de sala)',
  '* AUDIOGUÍA 03: Geología: una historia escrita en las rocas ',
  'SALA 5 “GEOLOGÍA. La historia escrita en rocas”',
  '* AUDIOGUÍA 04: Ciclo de las rocas',
  'RECEPCIÓN',
  '* AUDIOGUÍA 05: Despedida MUPA',
  '________________',
  '',
  'TEXTOS DE AUDIOGUÍAS ',
  '\tRECEPCIÓN',
  'AUDIOGUÍA 01: Bienvenida al MUPA',
  'DURACIÓN ESTIMADA: 00:00:55',
  'FOLEY: Viento de prueba, que no entra en la transcripción.',
  '🎧 VOZ EN OFF LOCUTOR/A',
  ` ¡Bienvenidas  y   bienvenidos${NBSP} al MuPa!\t`,
  '',
  '',
  'Un segundo párrafo con [Suena una tormenta] entre corchetes.',
  '',
  'SALA 1 “EL CICLO DE LA VIDA. Empecemos desde cero”',
  'Audioguía 2: Empecemos desde cero (Referencial de sala)',
  'DURACIÓN ESTIMADA: 00:01:50',
  'FOLEY: Agua lenta, que no entra.',
  'VOZ EN OFF',
  'Este es el texto de la 2.',
  'FOLEY: un ambiente en el medio, que tampoco entra.',
  '10 metros de largo, y no es un encabezado.',
  '03 Geología: una historia escrita en las rocas',
  'LOCUTOR/A',
  'A este reciclaje lo llamamos “ciclo de las rocas”.',
  '',
  'SALA 5 “GEOLOGÍA. La historia escrita en rocas”        ',
  'AUDIOGUIA 04: Ciclo de las rocas',
  'DURACIÓN ESTIMADA: 1:10',
  '🎧 VOZ EN OFF LOCUTOR/A',
  'Texto de la 4.',
  '________________',
  '',
  'RECEPCIÓN',
  'AUDIOGUÍA 05: Despedida MUPA.',
  'DURACIÓN ESTIMADA: 00:01:00',
  '🎧 VOZ EN OFF LOCUTOR/A',
  '¡Gracias por tu visita!',
]
const guionDe = (renglones) => BOM + renglones.join('\r\n')
const GUION = guionDe(RENGLONES)

/** Lo que tiene que quedar en cada transcripción. */
const ESPERADAS = {
  1: '¡Bienvenidas y bienvenidos al MuPa!\n\nUn segundo párrafo con [Suena una tormenta] entre corchetes.\n',
  2: 'Este es el texto de la 2.\n\n10 metros de largo, y no es un encabezado.\n',
  3: 'A este reciclaje lo llamamos “ciclo de las rocas”.\n',
  4: 'Texto de la 4.\n',
  5: '¡Gracias por tu visita!\n',
}

/** El guion de juguete con un renglón (el primero igual a `buscar`) reemplazado por los de `reemplazo` (o sacado). */
const cambiado = (buscar, reemplazo) => {
  const i = RENGLONES.indexOf(buscar)
  assert.ok(i >= 0, `el guion de juguete no tiene ${buscar}`)
  return guionDe([...RENGLONES.slice(0, i), ...reemplazo, ...RENGLONES.slice(i + 1)])
}

describe('cortarGuion: el guion de juguete', () => {
  test('las cinco, con solo el texto de la voz: sin encabezados, DURACIÓN ni FOLEY; los corchetes, tal cual; los espacios, juntados', () => {
    const r = cortarGuion(GUION, MANIFIESTO)
    assert.deepEqual(r.errores, [])
    assert.equal(r.seccion, 16)
    assert.deepEqual(r.estaciones.map((e) => e.archivo), ['01.txt', '02.txt', '03.txt', '04.txt', '05.txt'])
    for (const e of r.estaciones) {
      assert.equal(e.texto, ESPERADAS[e.numero], `la ${e.numero}`)
      assert.ok(!e.texto.includes('\r') && !e.texto.includes(BOM), `la ${e.numero}: sin \\r ni BOM`)
      assert.doesNotMatch(e.texto, /FOLEY|DURACI|VOZ EN OFF|LOCUTOR|AUDIOGU|RECEPCIÓN|SALA \d/, `la ${e.numero}`)
      // Lo que va a leer el servidor (server/audioguia/pistas.js): los mismos párrafos.
      assert.deepEqual(parrafosDe(e.texto), e.parrafos, `la ${e.numero}: parrafosDe`)
    }
    // El encabezado de cada una: con la anotación sacada, y el renglón del documento (desde 1).
    assert.deepEqual(
      r.estaciones.map((e) => [e.numero, e.tituloDocumento, e.renglon]),
      [[1, 'Bienvenida al MUPA', 18], [2, 'Empecemos desde cero', 28], [3, 'Geología: una historia escrita en las rocas', 35], [4, 'Ciclo de las rocas', 40], [5, 'Despedida MUPA.', 47]],
    )
    assert.deepEqual(r.estaciones.map((e) => e.duracionGuionS), [55, 110, null, 70, 60])
    // Los avisos: el título de la 5 (con un punto de más) y el FOLEY de después de la marca de la 2.
    assert.equal(r.avisos.length, 2, r.avisos.join('\n'))
    assert.match(r.avisos.join('\n'), /la 05: el título del documento, «Despedida MUPA\.», no es el del manifiesto, «Despedida MUPA»/)
    assert.match(r.avisos.join('\n'), /la 02: después de la marca de la voz hay un renglón de FOLEY/)
  })

  test('con LF, sin BOM, da lo mismo; con --ad, los archivos -ad', () => {
    const conCrlf = cortarGuion(GUION, MANIFIESTO)
    const conLf = cortarGuion(RENGLONES.join('\n'), MANIFIESTO)
    assert.deepEqual(conLf.estaciones.map((e) => e.texto), conCrlf.estaciones.map((e) => e.texto))
    const ad = cortarGuion(GUION, MANIFIESTO, { ad: true })
    assert.deepEqual(ad.estaciones.map((e) => e.archivo), ['01-ad.txt', '02-ad.txt', '03-ad.txt', '04-ad.txt', '05-ad.txt'])
    assert.equal(ad.ad, true)
  })

  test('una estación sin la marca de la voz es un error para esa estación (no se adivina)', () => {
    const r = cortarGuion(cambiado('LOCUTOR/A', []), MANIFIESTO)
    assert.equal(r.errores.length, 1, r.errores.join('\n'))
    assert.match(r.errores[0], /^la 03 \(renglón 35\) no trae la marca de la voz/)
    assert.equal(r.estaciones.find((e) => e.numero === 3).texto, '')
    // Las demás se cortan igual (el comando, con un error, no escribe ninguna).
    assert.equal(r.estaciones.find((e) => e.numero === 4).texto, ESPERADAS[4])
  })

  test('un número repetido, uno que falta y uno que el manifiesto no tiene son errores de estructura', () => {
    const repetido = cortarGuion(guionDe([...RENGLONES, 'AUDIOGUÍA 04: Otra vez', '🎧 VOZ EN OFF LOCUTOR/A', 'Algo.']), MANIFIESTO)
    assert.deepEqual(repetido.errores, ['la 04 está dos veces (renglones 40 y 51)'])
    // El texto de la 5 termina donde empieza la 04 repetida.
    assert.equal(repetido.estaciones.find((e) => e.numero === 5).texto, ESPERADAS[5])

    const i = RENGLONES.indexOf('AUDIOGUÍA 05: Despedida MUPA.')
    const falta = cortarGuion(guionDe(RENGLONES.slice(0, i)), MANIFIESTO)
    assert.deepEqual(falta.errores, ['falta la 05 («Despedida MUPA»)'])

    const deMas = cortarGuion(guionDe([...RENGLONES, '', 'AUDIOGUÍA 6: De más', '🎧 VOZ EN OFF LOCUTOR/A', 'Algo.']), MANIFIESTO)
    assert.deepEqual(deMas.errores, ['la 06 (renglón 52) no está en el manifiesto'])
  })

  test('sin texto después de la marca, o con más de TRANSCRIPCION_MAX caracteres, es un error', () => {
    const vacia = cortarGuion(cambiado('Texto de la 4.', []), MANIFIESTO)
    assert.deepEqual(vacia.errores, ['la 04 (renglón 40) no tiene texto después de la marca de la voz'])
    const larga = cortarGuion(cambiado('Texto de la 4.', ['a'.repeat(TRANSCRIPCION_MAX)]), MANIFIESTO)
    assert.deepEqual(larga.errores, [`la 04: la transcripción tiene ${TRANSCRIPCION_MAX + 1} caracteres (el tope es ${TRANSCRIPCION_MAX})`])
    const justa = cortarGuion(cambiado('Texto de la 4.', ['a'.repeat(TRANSCRIPCION_MAX - 1)]), MANIFIESTO)
    assert.deepEqual(justa.errores, [])
  })

  test('sin «TEXTOS DE AUDIOGUÍAS», el documento entero (la lista con viñetas no cuenta), con un aviso; con dos, un error', () => {
    const sinSeccion = cortarGuion(cambiado('TEXTOS DE AUDIOGUÍAS ', []), MANIFIESTO)
    assert.deepEqual(sinSeccion.errores, [])
    assert.equal(sinSeccion.seccion, null)
    assert.match(sinSeccion.avisos.join('\n'), /no tiene el renglón «TEXTOS DE AUDIOGUÍAS»/)
    assert.deepEqual(sinSeccion.estaciones.map((e) => e.texto), Object.values(ESPERADAS))

    const dos = cortarGuion(cambiado('RECEPCIÓN', ['TEXTOS DE AUDIOGUÍAS']), MANIFIESTO)
    assert.match(dos.errores.join('\n'), /«TEXTOS DE AUDIOGUÍAS» está 2 veces/)
  })

  test('un renglón suelto antes de la marca (que no es la duración ni el FOLEY) se avisa y no entra; una segunda marca, también', () => {
    const r = cortarGuion(cambiado('DURACIÓN ESTIMADA: 1:10', ['DURACIÓN ESTIMADA: 1:10', 'Nota para el estudio.']), MANIFIESTO)
    assert.deepEqual(r.errores, [])
    assert.match(r.avisos.join('\n'), /la 04: antes de la marca de la voz hay un renglón que no se graba .*«Nota para el estudio\.»/)
    assert.equal(r.estaciones.find((e) => e.numero === 4).texto, ESPERADAS[4])
    const dosMarcas = cortarGuion(cambiado('Texto de la 4.', ['Texto de la 4.', 'VOZ EN OFF LOCUTOR/A', 'Sigue.']), MANIFIESTO)
    assert.equal(dosMarcas.estaciones.find((e) => e.numero === 4).texto, 'Texto de la 4.\n\nSigue.\n')
    assert.match(dosMarcas.avisos.join('\n'), /la 04: la marca de la voz está otra vez en el texto/)
  })

  test('una raya corta el texto de la voz: lo de después (unos créditos, una nota para el estudio) no entra, con un aviso', () => {
    const RAYA = '________________'
    // Después de la última estación, una raya y unos créditos (GV-01 de la verificación del corte: entraban en la 05).
    const creditos = cortarGuion(guionDe([...RENGLONES, '', RAYA, '', 'CRÉDITOS', 'Guion: equipo de Comunicación del MuPa.', 'Revisión: 24/11/2026.']), MANIFIESTO)
    assert.deepEqual(creditos.errores, [])
    assert.deepEqual(creditos.estaciones.map((e) => e.texto), Object.values(ESPERADAS))
    assert.equal(creditos.avisos.length, 3, creditos.avisos.join('\n'))
    assert.match(creditos.avisos.join('\n'), /la 05: después de una raya hay 3 renglones que no entraron en el texto \(el primero: «CRÉDITOS»\): la raya corta/)
    // Entre dos estaciones, después del encabezado del espacio: una raya y una nota (entraba en la 03). El encabezado
    // del espacio, que queda antes de la raya, sigue sin entrar y sin aviso.
    const nota = cortarGuion(
      cambiado('AUDIOGUIA 04: Ciclo de las rocas', [RAYA, 'NOTA PARA EL ESTUDIO: grabar la 4 con la otra voz.', 'AUDIOGUIA 04: Ciclo de las rocas']),
      MANIFIESTO,
    )
    assert.deepEqual(nota.errores, [])
    assert.deepEqual(nota.estaciones.map((e) => e.texto), Object.values(ESPERADAS))
    assert.equal(nota.avisos.length, 3, nota.avisos.join('\n'))
    assert.match(nota.avisos.join('\n'), /la 03: después de una raya hay 1 renglón que no entró en el texto \(el primero: «NOTA PARA EL ESTUDIO: grabar la 4 con la otra voz\.»\)/)
    // En el medio del texto: lo de después no entra, aunque después venga la raya del final y el espacio siguiente.
    const medio = cortarGuion(cambiado('Texto de la 4.', ['Texto de la 4.', RAYA, 'Esto no se graba.']), MANIFIESTO)
    assert.equal(medio.estaciones.find((e) => e.numero === 4).texto, ESPERADAS[4])
    assert.match(medio.avisos.join('\n'), /la 04: después de una raya hay 1 renglón que no entró en el texto \(el primero: «Esto no se graba\.»\)/)
    // La raya de siempre, entre un espacio y el siguiente (la 04 del juguete: raya, renglón vacío y «RECEPCIÓN»), no
    // da aviso.
    assert.ok(!cortarGuion(GUION, MANIFIESTO).avisos.some((a) => /raya/.test(a)))
  })

  test('un renglón todo en mayúsculas en el texto de la voz queda, con un aviso (también una nota sin raya después de la última)', () => {
    const r = cortarGuion(guionDe([...RENGLONES, 'CRÉDITOS', 'Guion: equipo de Comunicación del MuPa.']), MANIFIESTO)
    assert.deepEqual(r.errores, [])
    // Los renglones que lo siguen quedan en el texto: el aviso es para que se vea en la revisión contra el documento.
    assert.equal(r.estaciones.find((e) => e.numero === 5).texto, '¡Gracias por tu visita!\n\nCRÉDITOS\n\nGuion: equipo de Comunicación del MuPa.\n')
    assert.equal(r.avisos.length, 3, r.avisos.join('\n'))
    assert.match(r.avisos.join('\n'), /la 05: en el texto de la voz hay un renglón todo en mayúsculas \(«CRÉDITOS»\): quedó en el texto/)
    // Un sonido entre corchetes en mayúsculas no es una nota; el encabezado de un espacio en el medio, su propio aviso.
    const sonido = cortarGuion(cambiado('Texto de la 4.', ['[SUENA UN TRUENO]', 'Texto de la 4.']), MANIFIESTO)
    assert.equal(sonido.estaciones.find((e) => e.numero === 4).texto, '[SUENA UN TRUENO]\n\nTexto de la 4.\n')
    assert.equal(sonido.avisos.length, 2, sonido.avisos.join('\n'))
    const espacio = cortarGuion(cambiado('Texto de la 4.', ['Texto de la 4.', 'RECEPCIÓN', 'Sigue.']), MANIFIESTO)
    assert.equal(espacio.avisos.filter((a) => /^la 04:/.test(a)).length, 1, espacio.avisos.join('\n'))
    assert.match(espacio.avisos.join('\n'), /la 04: en el medio del texto hay un renglón que parece el encabezado de un espacio/)
  })

  test('un manifiesto que no pasa el esquema es un error', () => {
    const r = cortarGuion(GUION, { version: 1, recorrido: [] })
    assert.equal(r.estaciones.length, 0)
    assert.match(r.errores[0], /^el manifiesto no pasa el esquema/)
  })

  test('el informe: los dos títulos, la duración del guion marcada si pasa de 90 s, las palabras y la lectura', () => {
    const r = cortarGuion(GUION, MANIFIESTO)
    const md = informe(r, { guion: 'juguete.txt', manifiesto: 'pistas.json' })
    assert.match(md, /\| 02 \| 02\.txt \| Empecemos desde cero \| \(igual\) \| \*\*1:50 \(más de 90 s\)\*\* \| 16 \| 0:06 \|/)
    assert.match(md, /\| 05 \| 05\.txt \| Despedida MUPA\. \| \*\*Despedida MUPA\*\* \| 1:00 \|/)
    assert.match(md, /1 pasa de 90 s .*: 02 \(1:50\)\./)
    assert.match(md, /- Errores: 0\. Avisos: 2\./)
    const conError = informe(cortarGuion(cambiado('LOCUTOR/A', []), MANIFIESTO), { guion: 'juguete.txt', manifiesto: 'pistas.json' })
    assert.match(conError, /\*\*No se escribió ninguna transcripción\*\*/)
    assert.match(conError, /## Errores \(1\)\n\n- la 03/)
  })
})

describe('las piezas del corte', () => {
  test('encabezadoDeEstacion: «AUDIOGUÍA NN:», sin tilde, sin cero o con el número adelante; un párrafo con una cifra no', () => {
    const casos = [
      ['AUDIOGUÍA 01: Bienvenida al MUPA', [1, 'Bienvenida al MUPA']],
      ['Audioguía 6: Ischigualasto', [6, 'Ischigualasto']],
      ['AUDIOGUÍA 06:  Ischigualasto: Ecos de un mundo diverso (Referencial de sala)', [6, 'Ischigualasto: Ecos de un mundo diverso']],
      ['audioguia 24 - El fin de un mundo, el inicio de otro (Referencia de sala)', [24, 'El fin de un mundo, el inicio de otro']],
      ['AUDIOGUÍA 16: La historia escrita en rocas  (Referencial  de sala)', [16, 'La historia escrita en rocas']],
      ['07 El origen de los dinosaurios', [7, 'El origen de los dinosaurios']],
      ['07. El origen', [7, 'El origen']],
      ['07 - ¿El origen?', [7, '¿El origen?']],
      ['07', [7, '']],
      ['AUDIOGUÍA 07', [7, '']],
    ]
    for (const [renglon, [numero, titulo]] of casos) assert.deepEqual(encabezadoDeEstacion(renglon), { numero, titulo }, renglon)
    for (const renglon of [
      '10 metros de largo',
      '230 millones de años',
      '00:00:55',
      '12:30 abre el museo',
      '* AUDIOGUÍA 01: Bienvenida al MUPA',
      '- 07 El origen',
      'AUDIOGUÍAS',
      'GUIÓN VISITA AUTOGUIADA - AUDIOGUÍAS',
      'AUDIOGUÍA 00: Nada',
      '7 El origen',
    ]) {
      assert.equal(encabezadoDeEstacion(renglon), null, renglon)
    }
  })

  test('esEncabezadoDeEspacio: el rótulo de un espacio, solo o con su frase entre comillas; una cita al final de un párrafo no', () => {
    const rotulos = ['SALA GIGANTISMO', 'JARDÍN TRIÁSICO', 'RECEPCIÓN', 'SALA 3', 'SALA 1']
    for (const renglon of [
      'SALA 3 “EL LABORATORIO. Donde los fósiles se transforman en conocimiento”.',
      'RECEPCIÓN',
      'SALA GIGANTISMO “GIGANTISMO. La grandeza del pasado”',
      'JARDÍN TRIÁSICO: “Paisaje vivo”',
    ]) {
      assert.equal(esEncabezadoDeEspacio(renglon, rotulos), true, renglon)
    }
    for (const renglon of [
      'A este reciclaje planetario, que no se detiene nunca y lleva millones de años, lo llamamos “ciclo de las rocas”.',
      'SALA 10 “Otra”',
      'Esta es la Sala 3.',
      'SALA 1: bienvenidos',
    ]) {
      assert.equal(esEncabezadoDeEspacio(renglon, rotulos), false, renglon)
    }
  })

  test('todoEnMayusculas: al menos dos letras, todas mayúsculas, sin contar lo que va entre corchetes', () => {
    for (const renglon of ['CRÉDITOS', 'NOTA PARA EL ESTUDIO: GRABAR LA 22.', '¡NO!', 'ÑANDÚ', '[Truenos] FIN']) {
      assert.equal(todoEnMayusculas(renglon), true, renglon)
    }
    for (const renglon of [
      'Bienvenida al MUPA',
      'NOTA PARA EL ESTUDIO: grabar la 22 con la otra voz.',
      '[SUENA UN TRUENO]',
      'A',
      '10:30',
      '',
      'MuPa',
      '¡Bienvenidas y bienvenidos al MuPa!',
    ]) {
      assert.equal(todoEnMayusculas(renglon), false, renglon)
    }
  })

  test('segundosDe y palabrasDichas', () => {
    assert.equal(segundosDe('00:01:50'), 110)
    assert.equal(segundosDe('1:10'), 70)
    assert.equal(segundosDe(' 00:00:55 '), 55)
    assert.equal(segundosDe('un minuto'), null)
    assert.equal(segundosDe('1:75'), null)
    // Lo que va entre corchetes no lo dice la voz; una raya suelta no es una palabra.
    assert.equal(palabrasDichas(['Hola [Suena una tormenta] mundo — sí.', 'Otro']), 4)
  })

  test('textoDelArchivo: UTF-8 estricto, con o sin BOM; un .docx o un Windows-1252, un error', () => {
    assert.deepEqual(textoDelArchivo(Buffer.from(`${BOM}Hola`, 'utf8')).ok, true)
    assert.equal(cortarGuion(textoDelArchivo(Buffer.from(GUION, 'utf8')).texto, MANIFIESTO).errores.length, 0)
    assert.match(textoDelArchivo(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14])).error, /\.docx/)
    assert.match(textoDelArchivo(Buffer.from([0x47, 0x75, 0xed, 0x61])).error, /no es UTF-8/)
  })

  test('leerArgumentos: --guion y --salida obligatorias, --ad, --dir; una opción que no conoce, un error', () => {
    assert.equal(leerArgumentos(['--guion', 'a.txt', '--salida', 'x']).ok, true)
    assert.equal(leerArgumentos(['--guion', 'a.txt', '--salida', 'x', '--ad']).ad, true)
    assert.match(leerArgumentos(['--salida', 'x']).error, /falta --guion/)
    assert.match(leerArgumentos(['--guion', 'a.txt']).error, /falta --salida/)
    assert.match(leerArgumentos(['--guion', 'a.txt', '--salida', 'x', '—ad']).error, /no conozco la opción —ad/)
    assert.match(leerArgumentos(['--guion', '--salida', 'x']).error, /--guion lleva un valor/)
  })

  test('la carpeta de la audioguía, prohibida: la del repo, adentro, con otra caja, por una junction y DIR_AUDIOGUIAS', (t) => {
    const otra = temporal()
    assert.ok(carpetaProhibida(DIR_DEL_REPO, otra))
    assert.ok(carpetaProhibida(join(DIR_DEL_REPO, 'sub', 'mas'), otra))
    assert.equal(carpetaProhibida(join(RAIZ, 'tools', 'salida', 'audioguias', 'guiones'), otra), null)
    assert.equal(carpetaProhibida(`${DIR_DEL_REPO}-otra`, otra), null)
    // La del manifiesto de --dir.
    assert.ok(carpetaProhibida(join(otra, 'x'), otra))
    if (process.platform === 'win32') assert.ok(carpetaProhibida(DIR_DEL_REPO.toUpperCase(), otra))
    // Por una junction (en Windows no pide permisos de administrador; en otro sistema, un enlace simbólico) a la carpeta
    // del manifiesto: a una temporal, NUNCA a la audioguias/ del repo (un borrado recursivo que siguiera el enlace la
    // vaciaría). El enlace se saca con rmdir, que no toca la carpeta de destino.
    const enlace = join(temporal(), 'enlace')
    try {
      symlinkSync(otra, enlace, 'junction')
    } catch (err) {
      t.diagnostic(`sin la junction (${err.code}): no se prueba ese camino`)
      return
    }
    try {
      assert.ok(estaDentro(otra, join(enlace, 'sub')))
      assert.ok(carpetaProhibida(join(enlace, 'sub'), otra))
      assert.equal(carpetaProhibida(join(enlace, 'sub'), temporal()), null)
    } finally {
      rmdirSync(enlace)
    }
  })
})

/** Corre la herramienta con node, con el entorno dado (sin DIR_AUDIOGUIAS, salvo que se lo pase). */
function correr(args, env = {}) {
  const base = { ...process.env }
  delete base.DIR_AUDIOGUIAS
  return spawnSync(process.execPath, [HERRAMIENTA, ...args], { cwd: RAIZ, encoding: 'utf8', env: { ...base, ...env } })
}

/** Una carpeta con el manifiesto de juguete y el guion de juguete. */
function carpetaDeJuguete(guion = GUION) {
  const dir = temporal()
  writeFileSync(join(dir, 'pistas.json'), JSON.stringify(MANIFIESTO))
  writeFileSync(join(dir, 'guion.txt'), guion)
  return dir
}

describe('el comando', () => {
  test('nunca escribe en audioguias/ (ni adentro, ni en DIR_AUDIOGUIAS, ni en la de --dir): se niega con 1 y lo explica, sin crear nada', () => {
    const dir = carpetaDeJuguete()
    // Contra la carpeta real, con un guion que no existe: la guarda va antes de leer nada, así que dice «No escribo…»;
    // si algún día se rompe, el comando falla al leer el guion, antes de escribir, y la prueba falla sin ensuciarla.
    const antes = readdirSync(DIR_DEL_REPO)
    for (const salida of [DIR_DEL_REPO, join(DIR_DEL_REPO, 'guiones')]) {
      const r = correr(['--guion', join(dir, 'no-esta.txt'), '--dir', dir, '--salida', salida])
      assert.equal(r.status, 1, salida)
      assert.match(r.stderr, /No escribo en .*audioguias.*sin grabar.*tools\/salida\/audioguias\/guiones/s)
      assert.equal(r.stdout, '')
    }
    assert.deepEqual(readdirSync(DIR_DEL_REPO), antes)
    assert.equal(existsSync(join(DIR_DEL_REPO, 'guiones')), false)

    // Con un guion que sí se corta, contra carpetas temporales: DIR_AUDIOGUIAS y la carpeta del manifiesto de --dir.
    const ajena = temporal()
    const conEntorno = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', join(ajena, 'sub')], { DIR_AUDIOGUIAS: ajena })
    assert.equal(conEntorno.status, 1)
    assert.match(conEntorno.stderr, /No escribo en/)
    assert.deepEqual(readdirSync(ajena), [])
    const enLaDelManifiesto = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', join(dir, 'salida')])
    assert.equal(enLaDelManifiesto.status, 1)
    assert.match(enLaDelManifiesto.stderr, /No escribo en/)
    assert.deepEqual(readdirSync(dir).sort(), ['guion.txt', 'pistas.json'])
  })

  test('escribe NN.txt (UTF-8 sin BOM, con LF) y informe.md; con --ad, NN-ad.txt e informe-ad.md, en la misma carpeta', () => {
    const dir = carpetaDeJuguete()
    const salida = join(temporal(), 'salida')
    const r = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', salida])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /^5 transcripciones en .* \(01\.txt a 05\.txt\) y informe\.md\. 2 avisos; 1 estación pasa de 90 s según el guion\./)
    assert.match(r.stderr, /aviso: la 05: el título del documento/)
    for (const [n, texto] of Object.entries(ESPERADAS)) {
      const bytes = readFileSync(join(salida, `0${n}.txt`))
      assert.notDeepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], `0${n}.txt: sin BOM`)
      assert.equal(bytes.toString('utf8'), texto, `0${n}.txt`)
    }
    const ad = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', salida, '--ad'])
    assert.equal(ad.status, 0, ad.stderr)
    assert.deepEqual(readdirSync(salida).sort(), [
      ...['01', '02', '03', '04', '05'].flatMap((n) => [`${n}-ad.txt`, `${n}.txt`]),
      'informe-ad.md',
      'informe.md',
    ].sort())
    assert.match(readFileSync(join(salida, 'informe-ad.md'), 'utf8'), /^# Las transcripciones de la audioguía, con audiodescripción/)
  })

  test('con una raya y unos créditos después de la última: la 05 sin ellos, con el aviso en la terminal y en el informe', () => {
    const dir = carpetaDeJuguete(guionDe([...RENGLONES, '', '________________', 'CRÉDITOS', 'Guion: equipo de Comunicación del MuPa.']))
    const salida = join(temporal(), 'salida')
    const r = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', salida])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, / 3 avisos;/)
    assert.match(r.stderr, /aviso: la 05: después de una raya hay 2 renglones que no entraron en el texto \(el primero: «CRÉDITOS»\)/)
    assert.equal(readFileSync(join(salida, '05.txt'), 'utf8'), ESPERADAS[5])
    assert.match(readFileSync(join(salida, 'informe.md'), 'utf8'), /## Avisos \(3\)[\s\S]*- la 05: después de una raya/)
  })

  test('con un error de estructura sale con 1, lo dice y no escribe ninguna transcripción (solo el informe)', () => {
    const dir = carpetaDeJuguete(cambiado('LOCUTOR/A', []))
    const salida = join(temporal(), 'salida')
    const r = correr(['--guion', join(dir, 'guion.txt'), '--dir', dir, '--salida', salida])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /error: la 03 \(renglón 35\) no trae la marca de la voz/)
    assert.match(r.stderr, /1 error de estructura: no escribí ninguna transcripción/)
    assert.deepEqual(readdirSync(salida), ['informe.md'])
  })

  test('sin el guion, con un .docx o con una opción que no conoce: 1, y lo dice', () => {
    const dir = carpetaDeJuguete()
    const sin = correr(['--guion', join(dir, 'no-esta.txt'), '--dir', dir, '--salida', join(temporal(), 's')])
    assert.equal(sin.status, 1)
    assert.match(sin.stderr, /No puedo leer el guion .*no existe/)
    writeFileSync(join(dir, 'guion.docx'), Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]))
    const docx = correr(['--guion', join(dir, 'guion.docx'), '--dir', dir, '--salida', join(temporal(), 's')])
    assert.equal(docx.status, 1)
    assert.match(docx.stderr, /es un \.docx/)
    const rara = correr(['--guion', join(dir, 'guion.txt'), '--salida', join(dir, 's'), '--kbps', '80'])
    assert.equal(rara.status, 1)
    assert.match(rara.stderr, /no conozco la opción --kbps/)
  })

  test('con el manifiesto real (sin --dir): un guion con sus 35 estaciones da las 35 transcripciones', () => {
    const crudo = readFileSync(join(DIR_DEL_REPO, 'pistas.json'), 'utf8')
    const manifiesto = JSON.parse(crudo.startsWith(BOM) ? crudo.slice(1) : crudo)
    const estaciones = manifiesto.recorrido.flatMap((g) => g.estaciones)
    const guion = ['TEXTOS DE AUDIOGUÍAS', ...estaciones.flatMap((e) => [
      `AUDIOGUÍA ${String(e.numero).padStart(2, '0')}: ${e.titulo}`,
      'DURACIÓN ESTIMADA: 00:01:00',
      'FOLEY: nada.',
      '🎧 VOZ EN OFF LOCUTOR/A',
      `El texto de la ${e.numero}.`,
    ])].join('\r\n')
    const dir = temporal()
    writeFileSync(join(dir, 'guion.txt'), guion)
    const r = correr(['--guion', join(dir, 'guion.txt'), '--salida', join(dir, 's')])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, new RegExp(`^${estaciones.length} transcripciones .*0 avisos`))
    assert.equal(r.stderr, '')
    for (const e of estaciones) {
      assert.equal(readFileSync(join(dir, 's', `${String(e.numero).padStart(2, '0')}.txt`), 'utf8'), `El texto de la ${e.numero}.\n`)
    }
  })

  test('TRANSCRIPCION_MAX y el manifiesto vienen de server/audioguia/pistas.js (no copiados), y no abre nada con child_process', () => {
    const codigo = readFileSync(HERRAMIENTA, 'utf8')
    assert.match(codigo, /^import \{ MANIFIESTO, TRANSCRIPCION_MAX \} from '\.\.\/server\/audioguia\/pistas\.js'$/m)
    assert.doesNotMatch(codigo, /20[_.]?000/)
    assert.doesNotMatch(codigo, /from ['"](?:node:)?child_process['"]|require\(['"](?:node:)?child_process['"]\)/)
  })
})

describe('el guion del museo (no versionado)', () => {
  const RUTA = join(RAIZ, 'tools', 'salida', 'audioguias', 'guion', 'EXPERIENCIA-MUPA-2026.txt')
  test('«EXPERIENCIA MUPA 2026», si está, se corta sin errores con el manifiesto real: las 35, cada una con su texto', (t) => {
    if (!existsSync(RUTA)) {
      t.diagnostic('sin tools/salida/audioguias/guion/EXPERIENCIA-MUPA-2026.txt (no se versiona): no se prueba')
      return
    }
    const leido = textoDelArchivo(readFileSync(RUTA))
    assert.ok(leido.ok, leido.error)
    const manifiesto = JSON.parse(readFileSync(join(DIR_DEL_REPO, 'pistas.json'), 'utf8'))
    const r = cortarGuion(leido.texto, manifiesto)
    assert.deepEqual(r.errores, [])
    assert.equal(r.estaciones.length, 35)
    for (const e of r.estaciones) assert.ok(e.texto && e.parrafos.length, `la ${e.numero}`)
    t.diagnostic(`guion del museo: 35 estaciones, ${r.avisos.length} avisos${r.avisos.length ? `: ${r.avisos.join(' | ')}` : ''}`)
  })
})
