// Contenido del sitio, centralizado para que los componentes no tengan texto suelto. Desde el 02/11/2026 la Home es la
// del tablero "Web" de la diseñadora (`home`, más abajo); lo de la landing (intro, identidad, obra, areas) queda para
// sus componentes, que la Home ya no importa (identidad.collage e identidad.instituciones siguen en uso: "El MuPa en
// imágenes" y el pie).
//
// FUENTE: texto extraído del archivo de diseño "Landing Page - V01.ai" (15/09/2026); los destacados en negrita, del
// mockup V02 (Figma, 21/09/2026). El texto de las cuatro bandas de Áreas es el contenido oficial que mandó el museo el
// 22/09/2026 ("Los 4 MuPa"), cargado tal cual salvo lo que decidió el desarrollador (ver areas.items). Las claves
// "verificar" marcan lo único que no se pudo confirmar contra el archivo.
// Destacados: lo que va entre **dobles asteriscos** sale en negrita (componente TextoDestacado). Están tomados del
// archivo .ai del V03 (25/09/2026), donde cada peso de la variable se embebe como un subconjunto distinto y la clave de
// fuente cambia justo donde arranca y termina la negrita: así se comprobaron uno por uno.
//
// FOTOS: las de la "Seleccion Fotográfica" del V04 de la diseñadora (28/09/2026: hero, carrusel, Visión, foto Mid, el
// soldador del mosaico y los paneles de Ciencia y Producción), las del Figma donde el V04 no cambió nada (mosaico de
// Obra) y las del museo para los otros paneles. Todas en WebP; los originales no se versionan. Ver src/assets/README.md.

import logoMarca from './assets/logo-mupa-marca.svg'
import isotipoUnsj from './assets/isotipo-unsj.svg'
import isotipoGobierno from './assets/isotipo-gobierno-san-juan.svg'
import logoFormalab from './assets/logo-formalab.svg'
import hero768 from './assets/hero-fachada-768.webp'
import hero1280 from './assets/hero-fachada-1280.webp'
import hero1920 from './assets/hero-fachada-1920.webp'
import hero2560 from './assets/hero-fachada-2560.webp'
import ejeMision800 from './assets/eje-mision-800.webp'
import ejeMision1400 from './assets/eje-mision-1400.webp'
import ejeVision800 from './assets/eje-vision-800.webp'
import ejeVision1400 from './assets/eje-vision-1400.webp'
import ejeNarrativo800 from './assets/eje-narrativo-800.webp'
import ejeNarrativo1400 from './assets/eje-narrativo-1400.webp'
import areaCiencia570 from './assets/area-ciencia-570.webp'
import areaEducacion570 from './assets/area-educacion-570.webp'
import areaEducacion1140 from './assets/area-educacion-1140.webp'
import areaProduccion570 from './assets/area-produccion-570.webp'
import areaProduccion1140 from './assets/area-produccion-1140.webp'
import areaFormalab570 from './assets/area-formalab-570.webp'
import areaFormalab1140 from './assets/area-formalab-1140.webp'
import carruselLamas700 from './assets/carrusel-lamas-700.webp'
import carruselLamas1400 from './assets/carrusel-lamas-1400.webp'
import carruselDremel700 from './assets/carrusel-dremel-700.webp'
import carruselDremel1400 from './assets/carrusel-dremel-1400.webp'
import carruselRestaurador700 from './assets/carrusel-restaurador-700.webp'
import carruselRestaurador1400 from './assets/carrusel-restaurador-1400.webp'
import carruselPincel700 from './assets/carrusel-pincel-700.webp'
import carruselPincel1400 from './assets/carrusel-pincel-1400.webp'
import carruselPatio700 from './assets/carrusel-patio-700.webp'
import carruselPatio1400 from './assets/carrusel-patio-1400.webp'
import midFachada1300 from './assets/mid-fachada-piedra-1300.webp'
import midFachada2000 from './assets/mid-fachada-piedra-2000.webp'
import obraRestauracion500 from './assets/obra-restauracion-500.webp'
import obraRestauracion1000 from './assets/obra-restauracion-1000.webp'
import obraCarnivoro600 from './assets/obra-carnivoro-hall-600.webp'
import obraCarnivoro1200 from './assets/obra-carnivoro-hall-1200.webp'
import obraFachada500 from './assets/obra-fachada-500.webp'
import obraFachada1000 from './assets/obra-fachada-1000.webp'
import obraMontaje500 from './assets/obra-montaje-sala-500.webp'
import obraMontaje1000 from './assets/obra-montaje-sala-1000.webp'
import obraSoldador390 from './assets/obra-soldador-390.webp'
import obraSoldador780 from './assets/obra-soldador-780.webp'
import logoGobierno from './assets/logo-gobierno-san-juan.svg'
import logoUnsj from './assets/logo-unsj.svg'
import heroEsqueletos800 from './assets/hero-esqueletos-800.webp'
import heroEsqueletos1280 from './assets/hero-esqueletos-1280.webp'
import heroEsqueletos1440 from './assets/hero-esqueletos-1440.webp'
import heroEsqueletos1920 from './assets/hero-esqueletos-1920.webp'
import heroEsqueletos2394 from './assets/hero-esqueletos-2394.webp'
import mapaMuseo from './assets/mapa-museo.svg'
import patronGaleria from './assets/patron-galeria.svg'
import heroVisitas960 from './assets/hero-visitas-960.webp'
import heroVisitas1440 from './assets/hero-visitas-1440.webp'
import heroVisitas1920 from './assets/hero-visitas-1920.webp'
import heroVisitas2880 from './assets/hero-visitas-2880.webp'
import visitasAccesibilidad600 from './assets/visitas-accesibilidad-600.webp'
import visitasAccesibilidad900 from './assets/visitas-accesibilidad-900.webp'
import visitasAccesibilidad1200 from './assets/visitas-accesibilidad-1200.webp'
import heroExposiciones960 from './assets/hero-exposiciones-960.webp'
import heroExposiciones1440 from './assets/hero-exposiciones-1440.webp'
import heroExposiciones1920 from './assets/hero-exposiciones-1920.webp'
import heroExposiciones2880 from './assets/hero-exposiciones-2880.webp'
import heroNovedades960 from './assets/hero-novedades-960.webp'
import heroNovedades1440 from './assets/hero-novedades-1440.webp'
import heroNovedades1920 from './assets/hero-novedades-1920.webp'
import heroNovedades2880 from './assets/hero-novedades-2880.webp'
import heroContacto960 from './assets/hero-contacto-960.webp'
import heroContacto1440 from './assets/hero-contacto-1440.webp'
import heroContacto1920 from './assets/hero-contacto-1920.webp'
import heroContacto2880 from './assets/hero-contacto-2880.webp'
import heroDivulgacion960 from './assets/hero-divulgacion-960.webp'
import heroDivulgacion1440 from './assets/hero-divulgacion-1440.webp'
import heroDivulgacion1920 from './assets/hero-divulgacion-1920.webp'
import heroDivulgacion2880 from './assets/hero-divulgacion-2880.webp'

// srcSet de las fotos del carrusel, con versión de 700 y de 1400 px.
const doble = (chica, grande) => `${chica} 700w, ${grande} 1400w`

// La foto del hero de una página interna sin hero en el tablero (Exposiciones, Novedades y Contacto: HeroPagina.jsx,
// decisión R1 del desarrollador, 04/11/2026), como la de Visitas: 3:1, de la "Seleccion Fotográfica" con
// tools/convertir-fotos.mjs, en sus cuatro anchos (960, 1440, 1920 y 2880). sizes: desde lg el hero mide 480 de alto y la
// foto lo cubre, así que nunca es más angosta que 1440 px; debajo, el hero mide 20rem (320) como mínimo: 960 o más.
// posicion: su punto de interés (object-position, HeroPagina.jsx). El alt es nuestro: a validar con el museo.
const fotoDeHero = ([f960, f1440, f1920, f2880], posicion, alt) => ({
  src: f1440,
  srcSet: `${f960} 960w, ${f1440} 1440w, ${f1920} 1920w, ${f2880} 2880w`,
  sizes: '(min-width: 64rem) max(100vw, 1440px), max(100vw, 960px)',
  ancho: 2880,
  alto: 960,
  posicion,
  alt,
})

export const site = {
  nombre: 'MuPa',
  nombreCompleto: 'Museo Paleontológico',
  lugar: 'San Juan · Argentina',
  // El logo del header (tablero "Web" de la diseñadora, 02/11/2026): la marca MuPa (SVG blanco del Figma) y, separados
  // por una línea, los isotipos de la UNSJ (el sello) y de Gobierno de San Juan (la flor), también blancos y de 40x40,
  // sacados del header del tablero (src/assets/README.md). La marca lleva al inicio: su alt es el nombre del sitio.
  logo: {
    marca: logoMarca,
    alt: 'MuPa - Museo Paleontológico de San Juan',
    isotipos: [
      { nombre: 'Universidad Nacional de San Juan', src: isotipoUnsj },
      { nombre: 'Gobierno de San Juan', src: isotipoGobierno },
    ],
  },
}

export const ui = {
  pendiente: 'Contenido pendiente',
  irAlContenido: 'Ir al contenido',
  instituciones: 'Instituciones',
  portada: 'Portada',
}

// Menú del sitio (plan 6.7; desde el 02/11/2026, el del tablero "Web" de la diseñadora): textos de interfaz, no del
// museo. Cada sección nombra su página (la clave de src/tablaDePaginas.js) y su dirección: el menú, el menú del celular,
// el pie y la 404 dibujan solo las secciones cuya página existe (src/components/navegacion.js), así El Museo,
// Divulgación, Educación y Circuitos aparecen solos el día que se construya su página (la dirección de cada una tiene
// que ser la de su ruta en server/rutas-publicas.js: lo comprueba layout.test.js).
// - menu: las del header, en el orden del tablero. El tercer ítem dice "Divulgación" (el tablero dice "Producción" en
//   cuatro páginas y "Divulgación" en dos: a confirmar con la diseñadora). Sin el selector de idioma "Es (Arg)" del
//   tablero (fuera del alcance: un control que no hace nada no puede quedar).
// - otras: las páginas que existen y el tablero no pone en el menú; van en el pie y en la 404.
// - entradas: el botón naranja del header (la compra externa que carga el panel, solo si está activa). Texto fijo y
//   corto (el tablero dice "Tikets": errata). comprar: el texto de "Comprar entradas" de BotonCompra.jsx si el museo
//   no cargó uno; desde la Visitas del tablero (03/11/2026, V1) ninguna página dibuja ese botón (se decide al cierre).
export const navegacion = {
  etiqueta: 'Principal',
  menu: [
    { pagina: 'el-museo', ruta: '/el-museo', texto: 'El Museo' },
    { pagina: 'visitas', ruta: '/visitas', texto: 'Visitas' },
    { pagina: 'divulgacion', ruta: '/divulgacion', texto: 'Divulgación' },
    { pagina: 'educacion', ruta: '/educacion', texto: 'Educación' },
    { pagina: 'circuitos', ruta: '/circuitos', texto: 'Circuitos' },
  ],
  otras: [
    { pagina: 'exposiciones', ruta: '/exposiciones', texto: 'Exposiciones' },
    { pagina: 'novedades', ruta: '/novedades', texto: 'Novedades' },
    { pagina: 'contacto', ruta: '/contacto', texto: 'Contacto' },
  ],
  entradas: 'Tickets',
  comprar: 'Comprar entradas',
  abrir: 'Menú',
  cerrar: 'Cerrar',
}

// Página 404 (src/paginas/NoEncontrada.jsx): textos de interfaz, no del museo. Debajo, el inicio y las secciones del
// menú (plan 6.5).
export const noEncontrada = {
  titulo: 'No encontramos esta página',
  texto: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
  volver: 'Volver al inicio',
  secciones: 'Secciones del sitio',
}

// Páginas internas (E4.2 a E4.4: Exposiciones, una muestra, Visitas, Novedades y una novedad): solo textos de interfaz
// (títulos de sección, rótulos, botones), neutros y mínimos. Todo lo demás es lo que carga el museo en el panel y llega
// en estado.datos; lo que no está cargado no se dibuja, ni su título (plan 6.1). Las fechas ("Del 1 de octubre al 30 de
// noviembre de 2026") y las situaciones ("Actual", "Finalizó el …") ya vienen como texto del servidor
// (server/paginas.js, plan 6.2). Los títulos de las páginas son los del menú; el servidor repite los mismos en el
// <title> (server/seo.js).
// Desde el rediseño con el lenguaje del tablero (04/11/2026, R1 a R7): Exposiciones y Novedades llevan el hero de las
// páginas internas (HeroPagina.jsx) con su foto (imagen); el título de la página es el h1 del hero y también el rótulo
// de cada una de sus secciones (como "Circuitos paleontológicos" en el tablero), así no hace falta ningún texto nuevo.
// - Exposiciones: el cráneo y la columna del carnívoro del hall; posicion: el cráneo, que queda en su lugar más allá
//   de 1440 (la foto se recorta arriba y abajo) y en el celular (a los costados).
// - Novedades: el taller grande con el equipo trabajando; posicion: la gente, abajo.
export const paginas = {
  exposiciones: {
    titulo: 'Exposiciones',
    muestras: 'Muestras',
    salas: 'Salas',
    enLaSala: 'En esta sala',
    imagen: fotoDeHero(
      [heroExposiciones960, heroExposiciones1440, heroExposiciones1920, heroExposiciones2880],
      '40% 45%',
      'Cráneo de fauces abiertas y columna de un esqueleto de dinosaurio carnívoro montado en una sala del museo',
    ),
  },
  muestra: { sala: 'Sala' },
  // Los de la página Visitas de E4. Desde la Visitas del tablero "Web" (03/11/2026, `visitas`, más abajo) la página ya
  // no los usa: los leen TablaHorarios.jsx y ListaTarifas.jsx, que quedan sin usar hasta que se decida al cierre (D1).
  visitas: {
    titulo: 'Visitas',
    horario: 'Horario',
    dia: 'Día',
    horas: 'Horario',
    cerrado: 'Cerrado',
    tarifas: 'Tarifas',
    gratis: 'Gratis',
    comoLlegar: 'Cómo llegar',
    normas: 'Normas del museo',
    accesibilidad: 'Accesibilidad',
  },
  novedades: {
    titulo: 'Novedades',
    proximas: 'Próximas actividades',
    noticias: 'Noticias',
    paginas: 'Páginas de novedades',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    pagina: (n, total) => `Página ${n} de ${total}`,
    imagen: fotoDeHero(
      [heroNovedades960, heroNovedades1440, heroNovedades1920, heroNovedades2880],
      '50% 70%',
      'El taller grande del museo, con el equipo trabajando en sus mesas',
    ),
  },
  novedad: {
    realizada: 'Realizada',
    cuando: 'Cuándo',
    lugar: 'Lugar',
    costo: 'Costo',
    inscripcion: 'Inscribirse',
  },
  // La galería de una muestra o de una novedad.
  fotos: 'Fotos',
  // Delante del crédito de una foto ("Foto: Ana Pérez").
  credito: 'Foto:',
}

// Contacto (E4.5, src/paginas/Contacto.jsx): solo textos de interfaz, neutros y mínimos. Los datos (dirección, teléfono,
// correo público, redes y el mapa) son los que carga el museo en el panel (estado.museo) y lo que no está cargado no se
// dibuja. El formulario sale solo si hay casilla de envío y dirección de destino (server/contacto.js). Los errores
// llegan del servidor como códigos (compartido/contacto.js) y acá están sus textos: los de cada campo y los de todo el
// formulario, que terminan con "o escribinos a <correo público>" si el museo cargó uno.
// Desde el rediseño con el lenguaje del tablero (05/11/2026, R1 a R7): el título es el h1 del hero y también el rótulo
// de sus dos secciones ("Datos de contacto" y "Escribinos"), como en Exposiciones y Novedades: ningún texto nuevo.
export const contacto = {
  titulo: 'Contacto',
  // La foto del hero (HeroPagina.jsx, decisión R1 del desarrollador, 04/11/2026): la fachada con el cartel "Museo
  // Paleontológico" (el h1 queda sobre el cielo y las torres, y el cartel entero debajo: tools/convertir-fotos.mjs);
  // posicion: el cartel (sus letras van del 72 al 93 % del alto de la foto), que así queda entero más allá de 1440, con
  // el h1 encima: a 1920 y a 2560 (medido) el borde de abajo no corta el «co» del final y el h1 no pisa las letras. Hasta
  // la corrección del rediseño (EST-03 de su verificación, 05/11/2026) el recorte cortaba el «co» en todos los anchos y,
  // con '50% 80%', a 2560 se leía «Museo Paleont…».
  imagen: fotoDeHero(
    [heroContacto960, heroContacto1440, heroContacto1920, heroContacto2880],
    '50% 88%',
    'Fachada del museo con el cartel «Museo Paleontológico» bajo el cielo azul',
  ),
  datos: 'Datos de contacto',
  direccion: 'Dirección',
  telefono: 'Teléfono',
  correo: 'Correo',
  redes: 'Redes',
  // El title del <iframe> del mapa (lo anuncia el lector de pantalla).
  mapa: 'Mapa con la ubicación del museo',
  abrirMapa: 'Abrir en Google Maps',
  formulario: {
    titulo: 'Escribinos',
    obligatorios: 'Todos los campos son obligatorios.',
    nombre: 'Nombre',
    email: 'Correo electrónico',
    mensaje: 'Mensaje',
    enviar: 'Enviar',
    // Mientras sale (después del primer clic: el segundo no manda otra vez).
    enviando: 'Enviando…',
    // El campo trampa (oculto: lo llenan solo los robots). Por si alguien lo ve sin los estilos.
    trampa: 'No completes este campo',
    enviado: 'Recibimos tu mensaje. Gracias por escribirnos.',
    revisar: 'Revisá estos datos',
    errores: {
      nombre: {
        falta: 'Escribí tu nombre.',
        largo: 'El nombre puede tener hasta 100 caracteres.',
        una_linea: 'El nombre tiene que ir en una sola línea.',
        ilegible: 'El nombre tiene caracteres que no se pudieron leer. Escribilo de nuevo.',
      },
      email: {
        falta: 'Escribí tu correo electrónico.',
        largo: 'El correo electrónico es demasiado largo.',
        invalido: 'Escribí un correo electrónico válido, por ejemplo nombre@dominio.com.',
      },
      mensaje: {
        falta: 'Escribí tu mensaje.',
        corto: 'El mensaje tiene que tener al menos 10 caracteres.',
        largo: 'El mensaje puede tener hasta 5.000 caracteres.',
        enlaces: 'El mensaje puede tener hasta 3 enlaces.',
        ilegible: 'El mensaje tiene caracteres que no se pudieron leer. Escribilo de nuevo.',
      },
    },
    // Los de todo el formulario (sin el punto final: se agrega "o escribinos a <correo>" si hay).
    generales: {
      limite_ip: 'Mandaste varios mensajes en la última hora. Probá más tarde',
      limite_dia: 'El formulario recibió muchos mensajes hoy. Probá mañana',
      no_enviado: 'No pudimos enviar tu mensaje. Probá más tarde',
      no_disponible: 'El formulario no está disponible en este momento. Probá más tarde',
    },
    oEscribinos: 'o escribinos a',
    // Si el formulario se apagó mientras la persona escribía: lo que escribió, para copiarlo y mandarlo por correo.
    escrito: 'Tu mensaje',
  },
  // Texto de privacidad debajo del formulario (plan 8: que el mensaje se guarda 180 días). Lo escribe el museo y todavía
  // no lo mandó: vacío, no se dibuja. No inventarlo.
  privacidad: '',
}

// La Home (src/paginas/Home.jsx): la portada del tablero "Web" de la diseñadora (Figma, nodo 2627:1165, 02/11/2026), que
// en master reemplaza a la landing (decisión D1 del desarrollador; la landing publicada sigue en la rama landing). Los
// textos son los del tablero, tal cual (decisión D13: solo se corrigen las erratas evidentes; no hay ninguna en estos).
// Lo que no es texto del tablero son textos de interfaz para el lector de pantalla (las etiquetas de la franja y del
// carrusel, el contador, el alt de las fotos y del plano), neutros y mínimos.
export const home = {
  hero: {
    // \n: el corte de línea del tablero (whitespace-pre-line). Así el título va en dos renglones también con la fuente
    // de respaldo, antes de que cargue Google Sans Flex: si no, entraba en uno y al cargar la fuente pasaba a dos y la
    // bajada bajaba 72 px (corrimiento de 0,01 a 1440, medido el 02/11/2026).
    titulo: 'Un viaje a nuestros\norígenes',
    bajada: 'Explorá el Triásico desde una de las regiones paleontológicas más importantes de Argentina',
    // La foto del tablero (nodo 2627:1169): el original que tiene el archivo, 2394x1346 (no está en la "Seleccion
    // Fotográfica" del V04: pedir el original al museo). Va entera, sin recorte: el encuadre del tablero lo hace el CSS
    // (HeroHome.jsx). sizes: desde lg el hero mide 655 de alto y la foto lo cubre, así que nunca es más angosta que
    // 1165 px (655 × 1,7786); debajo de lg (sin diseño) el hero es más bajo pero la foto lo sigue cubriendo.
    imagen: {
      src: heroEsqueletos1440,
      srcSet:
        `${heroEsqueletos800} 800w, ${heroEsqueletos1280} 1280w, ${heroEsqueletos1440} 1440w, ` +
        `${heroEsqueletos1920} 1920w, ${heroEsqueletos2394} 2394w`,
      sizes: '(min-width: 64rem) max(100vw, 1165px), max(100vw, 50rem)',
      ancho: 2394,
      alto: 1346,
      alt: 'Esqueleto montado de un dinosaurio carnívoro en una sala del museo, con el cráneo de fauces abiertas en primer plano',
    },
  },
  // La franja de accesos debajo del título (decisión D11): "Planificá tu visita" lleva a Visitas; "Tickets", a la compra
  // externa que carga el panel (sin la compra activa no se dibuja; su texto es el del botón del header,
  // navegacion.entradas); "Recursos educativos" va a Educación y se dibuja recién cuando exista esa página. La "Tienda
  // virtual" del tablero no va (fuera del alcance: "a futuro" en la nota de la diseñadora).
  accesos: {
    etiqueta: 'Accesos directos',
    visita: 'Planificá tu visita',
    recursos: 'Recursos educativos',
  },
  // El carrusel de Novedades (decisión D12): las últimas novedades publicadas que carga el panel (server/paginas.js,
  // cargarHome). El título, la bajada, "Ver todas las novedades" y "leer más" son del tablero; lo demás, para el lector.
  novedades: {
    titulo: 'Novedades',
    bajada: 'Enterate de los últimos hallazgos, talleres y novedades de la comunidad',
    verTodas: 'Ver todas las novedades',
    leerMas: 'leer más',
    lista: 'Últimas novedades',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    contador: (n, total) => `Novedad ${n} de ${total}`,
  },
  // "El MuPa en imágenes" (decisión D9): el carrusel de fotos de la landing (identidad.collage, Collage.jsx) con el
  // título y las piedritas del tablero (el mismo trazado a los dos lados, el de abajo girado; exportado del Figma).
  galeria: {
    titulo: 'El MuPa en imágenes',
    patron: patronGaleria,
  },
  // "Mapa del Museo" (decisión D10): la versión bordó con los nombres del tablero (el grupo "Group 4", exportado en SVG),
  // como imagen fija. Los nombres del dibujo son trazados: van además como texto para el lector de pantalla, en el
  // orden en que se recorre el plano (de arriba a la izquierda hacia abajo y a la derecha). Sin interacción: el plano
  // interactivo es el módulo opcional del plano.
  mapa: {
    titulo: 'Mapa del Museo',
    // El SVG mide 882,765x811,848 (los atributos width y height de la imagen van en enteros).
    imagen: { src: mapaMuseo, ancho: 883, alto: 812, alt: 'Plano de la planta del museo, con sus salas y espacios' },
    etiqueta: 'Espacios del plano',
    espacios: [
      'Confitería',
      'Sala Inmersiva',
      'Tienda',
      'Sala 8',
      'Microcine',
      'Sala 1',
      'Sala Educativa',
      'Sala 2',
      'Sala 3',
      'Sala 4',
      'Sala 5',
      'Jardín Triásico',
      'Sala 6',
      'Sala 7',
    ],
  },
}

// Visitas (src/paginas/Visitas.jsx): la página del tablero "Web" de la diseñadora (Figma, nodo 2846:997; decisiones V1 a
// V9 del desarrollador, 03/11/2026). Los textos son los del tablero, tal cual (D13). El título dice "Visitá el MuPa": así
// está hoy en el tablero (el relevamiento del 02/11 decía "al"). Lo demás son textos de interfaz, neutros y mínimos, o
// el alt de las fotos (nuestros, a validar con el museo). Los datos de las tarjetas (dirección, horario, teléfono,
// correo y el mapa) son los que carga el museo en el panel (estado.museo); los párrafos de "Museo accesible", el texto
// "Accesibilidad" del panel, y si está vacío, los dos del tablero (parrafos).
export const visitas = {
  // Las fotos van sin deformar (el tablero estira la del hero un tercio a lo ancho) y con el encuadre del tablero
  // (tools/convertir-fotos.mjs, desde los originales de la "Seleccion Fotográfica"). sizes del hero: desde lg mide 480
  // de alto (HeroPagina.jsx) y la foto, 3:1, lo cubre, así que nunca es más angosta que 1440 px; debajo, el hero mide
  // 20rem (320) como mínimo: 960 px o más.
  // posicion: el punto de interés (HeroPagina.jsx): la punta del pincel sobre el fósil está al 80 % del alto de la
  // foto (a 1440, a 385 de los 480); con "50% 80%" queda ahí también a 1920 y a 2560, donde la foto se recorta arriba
  // y abajo (centrada, a 1920 quedaba contra el borde de abajo y a 2560 afuera: FID-01 de la verificación, 03/11/2026).
  hero: {
    titulo: 'Visitá el MuPa',
    imagen: {
      src: heroVisitas1440,
      srcSet:
        `${heroVisitas960} 960w, ${heroVisitas1440} 1440w, ${heroVisitas1920} 1920w, ${heroVisitas2880} 2880w`,
      sizes: '(min-width: 64rem) max(100vw, 1440px), max(100vw, 960px)',
      ancho: 2880,
      alto: 960,
      posicion: '50% 80%',
      alt: 'Manos de un restaurador pasando un pincel sobre un fósil',
    },
  },
  // "Información práctica": las tarjetas Dirección, Horarios y Contacto (cada una solo con sus datos) y el mapa de
  // "Insertar mapa" (el title del <iframe> y "Abrir en Google Maps" son los de Contacto: contacto.mapa y
  // contacto.abrirMapa). cerrado: el horario de los días que no abre ("Lunes: cerrado"). irAContacto: el enlace de la
  // tarjeta Contacto a /contacto (el tablero no lo trae: desvío a confirmar con la diseñadora).
  practica: {
    rotulo: 'Información práctica',
    titulo: 'Cómo llegar y cuándo',
    direccion: 'Dirección',
    horarios: 'Horarios',
    contacto: 'Contacto',
    cerrado: 'cerrado',
    irAContacto: 'Ir a Contacto',
  },
  // "Museo accesible". parrafos: los del tablero, para cuando el museo no cargó el texto "Accesibilidad" (el segundo va
  // en gris, como en el tablero). tarjetas: las cuatro del tablero, con un ícono que corresponde a cada tema (los del
  // tablero son de relleno: IconosTarjetas.jsx; desvío a confirmar con la diseñadora).
  accesible: {
    rotulo: 'Museo accesible',
    titulo: 'Un museo para descubrir todos los días',
    parrafos: [
      {
        texto:
          'El MuPa cuenta con recursos de accesibilidad autónoma disponibles a diario: rampas y ascensores para sillas ' +
          'de ruedas, kits táctiles para visitantes con discapacidad visual, mochilas sensoriales para personas ' +
          'neurodivergentes o con sobrecarga sensorial, y códigos QR con audiodescripciones y videos en Lengua de Señas ' +
          'Argentina (LSA).',
        secundario: false,
      },
      {
        texto:
          'El sistema de accesibilidad del MuPa ha sido co-creado por un equipo multidisciplinario integrado por ' +
          'especialistas en materia de discapacidad.',
        secundario: true,
      },
    ],
    // 600x360 a 1440 (5:3); sizes: la mitad del contenido desde lg (600 a 1440 y más), todo el ancho debajo.
    imagen: {
      src: visitasAccesibilidad600,
      srcSet: `${visitasAccesibilidad600} 600w, ${visitasAccesibilidad900} 900w, ${visitasAccesibilidad1200} 1200w`,
      sizes: '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)',
      ancho: 1200,
      alto: 720,
      alt: 'Manos de un técnico puliendo con una herramienta rotativa la réplica de una garra de dinosaurio',
    },
    tarjetas: [
      {
        icono: 'fisica',
        titulo: 'Accesibilidad física',
        texto: 'Rampas, ascensor y sanitarios accesibles en todo el recorrido del museo.',
      },
      {
        icono: 'visual',
        titulo: 'Accesibilidad visual',
        texto: 'Planos hápticos, maquetas táctiles y audiodescripciones de las piezas principales.',
      },
      {
        icono: 'auditiva',
        titulo: 'Accesibilidad auditiva',
        texto: 'Videos y guías digitales interpretados en Lengua de Señas Argentina (LSA).',
      },
      {
        icono: 'neurodivergencia',
        titulo: 'Neurodivergencia',
        texto: 'Mochilas con elementos intuitivos y sábados distendidos, disponibles de forma permanente.',
      },
    ],
  },
}

// La foto de los cuatro bloques de Divulgación: la que les puso la diseñadora en el tablero, la paleontóloga con la
// cuadrícula de hilos (area-ciencia-570 de la landing, del V04 "Acordeon - Ciencia", 920x633). Va en 600x420 (10:7) con
// object-cover (BloqueTextoFoto.jsx); con 570 px no llega ni a los 600 de la caja (se estira un 5 %) ni a los 1200 de
// una pantalla de densidad 2: pedir el original o fotos propias de cada bloque (pregunta 14 al museo).
// RELLENO DEL TABLERO: la misma foto en los cuatro bloques (y en la tarjeta 1 de las noticias del tablero), de la banda
// Ciencia de la landing; la destraba la pregunta 14 de tools/salida/e6-divulgacion/prep/preguntas-museo.md (fotos del
// laboratorio, del campo y de los investigadores). sizes: el de "Museo accesible" (la mitad del contenido desde lg).
const fotoDeBloque = {
  src: areaCiencia570,
  srcSet: `${areaCiencia570} 570w`,
  sizes: '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)',
  ancho: 570,
  alto: 567,
  alt: 'Paleontóloga registrando un hallazgo en el campo con una cuadrícula de hilos sobre el fósil',
}

// El párrafo del laboratorio (de la nota de contenido del tablero, Figma 2857:5751), con las erratas evidentes
// corregidas ("manipulado" -> "manipulando", "si" -> "su" y el punto final que le faltaba). El final, "…y estudios para
// cosas", queda como está: está sin terminar y no se completa (DV1).
// RELLENO DEL TABLERO: borrador de la nota; lo destraba la pregunta 8 (preguntas-museo.md: el museo cierra la frase o
// aprueba la versión que le propusimos). En el tablero va también, copiado, en "Investigaciones recientes" (pregunta 10).
const parrafoDelLaboratorio =
  'El MuPa cuenta con un laboratorio de preparación y estudio de fósiles observable desde el espacio de exhibición. ' +
  'Los visitantes podrán ver en tiempo real a científicos de la UNSJ manipulando fósiles para su correcta conservación ' +
  'y estudios para cosas.'

// RELLENO DEL TABLERO: la nota gris de "Visitas escolares" de Educación (Figma 2846:1561), copiada en Infraestructura y
// en el Laboratorio; no está en la nota de Divulgación. La destraban las preguntas 7 y 9 (preguntas-museo.md).
const notaDeEducacion = 'Contactanos para coordinar fecha, horario y requerimientos esenciales.'

// Divulgación (src/paginas/Divulgacion.jsx): la página del tablero "Web" (Figma 2857:5439; decisiones DV1 a DV10 del
// desarrollador, 06/11/2026). Va COMPLETA, como el tablero (DV1): el hero, "Últimas noticias", los cuatro bloques de
// texto y foto y "NEWSLETTER" con sus tres tarjetas, con los textos y las fotos del tablero aunque varios sean relleno
// (copiado de Educación) o borrador. Es una excepción a D13 y al plan 6.1 SOLO para esta página, hasta que el museo
// mande lo suyo (DV10: cada texto o foto de relleno o en borrador lleva al lado un comentario que empieza con
// "RELLENO DEL TABLERO:", con de dónde viene y qué pregunta de tools/salida/e6-divulgacion/prep/preguntas-museo.md lo
// destraba; antes del corte del dominio, se reemplaza o se saca). Lo que es de la nota de contenido de la página
// (Figma 2857:5751) es texto del museo: el título y la bajada, "Últimas noticias", los títulos de los bloques, los
// rótulos de Investigaciones y Contenido multimedial, las cuatro actividades del laboratorio, el texto de Contenido
// multimedial y el del newsletter. Las erratas evidentes, corregidas: la bajada empezaba con un espacio, el h2 decía
// "Ultimas Noticias" (la nota: "Últimas noticias"), "Laboratorio Abierto MuPA" ("MuPa") y las del párrafo del
// laboratorio (más arriba). La bajada del carrusel, "Ver todas las novedades" y "leer más" son los de la Home
// (home.novedades). Ningún control sin destino (DV9): "Coordinar visita" lleva a Contacto (enlace.pagina; si esa página
// no existiera, iría como texto) y las actividades del laboratorio y los "enlaces" de las tarjetas van como texto.
export const divulgacion = {
  // La foto (DV6): la del tablero (de campo, 1000x993, la misma de Circuitos) no alcanza para el hero y no está en la
  // Selección; va el restaurador entre los huesos (Mosaico - IMG_7822, la foto 1 del mosaico de Obra de la landing, ya
  // publicada en mupa.ar), 3:1 con las filas del 20 al 70 % (tools/convertir-fotos.mjs). posicion: el ojo del
  // restaurador (al 79 % del ancho y el 44 % del alto del recorte); con '50% 42%' queda a la derecha del primer renglón
  // del h1 (con '79%', a 1024 quedaba debajo de la «y»). El alt es el de la landing (a validar con el museo, preguntas 14
  // y 38: el original de la foto del tablero y el permiso de la persona).
  hero: {
    titulo: 'Investigación y\ndivulgación científica', // "\n": el corte del tablero, como en la Home
    bajada: 'Del MuPa y la Universidad Nacional de San Juan',
    imagen: fotoDeHero(
      [heroDivulgacion960, heroDivulgacion1440, heroDivulgacion1920, heroDivulgacion2880],
      '50% 42%',
      'Persona del equipo de restauración trabajando con un pincel entre los huesos de un esqueleto',
    ),
  },
  // "Últimas noticias" (DV2): las mismas 6 últimas novedades publicadas de la Home (server/paginas.js,
  // cargarDivulgacion). La pregunta 6 (preguntas-museo.md): ¿todas, o solo las de ciencia?
  noticias: { titulo: 'Últimas noticias' },
  // Los cuatro bloques de texto y foto (BloqueTextoFoto.jsx), en el orden del tablero.
  bloques: [
    {
      id: 'divulgacion-infraestructura',
      rotulo: 'Divulgación científica', // del tablero (no está en la nota); las mayúsculas, por CSS
      titulo: 'Infraestructura científica', // de la nota
      // RELLENO DEL TABLERO: el cuerpo entero (el párrafo, la nota gris, la lista y "Coordinar visita") es una copia
      // palabra por palabra de "Visitas escolares" de Educación (Figma 2846:1561); lo destraba la pregunta 7
      // (preguntas-museo.md: el texto de "Infraestructura científica").
      parrafos: [
        {
          texto:
            'Traé a tu escuela al MuPa y viajá con tus estudiantes al Triásico. Nuestros guías especializados adaptan ' +
            'el recorrido al nivel de cada grupo, inicial, primaria, secundaria y nivel superior.',
        },
        { texto: notaDeEducacion, secundario: true },
      ],
      lista: ['Nivel inicial', 'Primaria', 'Secundaria', 'Nivel superior'],
      // A Contacto (DV9): en el tablero no tiene destino.
      enlace: { texto: 'Coordinar visita', pagina: 'contacto' },
      imagen: fotoDeBloque,
    },
    {
      id: 'divulgacion-laboratorio',
      rotulo: 'Divulgación científica', // del tablero (no está en la nota)
      titulo: 'Laboratorio Abierto MuPa', // de la nota ("MuPA" en el tablero: errata)
      parrafos: [{ texto: parrafoDelLaboratorio }, { texto: notaDeEducacion, secundario: true }],
      // De la nota ("Botones"), sin destino en el archivo: van como texto, con la flecha (DV9), hasta que el museo diga
      // adónde llevan (pregunta 9 de preguntas-museo.md). En el tablero el cuarto lleva otra flecha: un descuido.
      acciones: [
        'Preparación de fósiles',
        'Documentación científica',
        'Visitas guiadas al laboratorio',
        'Redacción de papers científicos',
      ],
      imagen: fotoDeBloque,
    },
    {
      id: 'divulgacion-investigaciones',
      rotulo: 'Publicaciones científicas', // de la nota ("PUBLICACIONES CIENTÍFICAS"); las mayúsculas, por CSS
      titulo: 'Investigaciones recientes\ndel equipo MuPa - UNSJ', // de la nota; "\n": el corte del tablero
      // RELLENO DEL TABLERO: el párrafo es el del laboratorio, copiado (y en borrador); lo destraba la pregunta 10
      // (preguntas-museo.md: ¿un texto o una lista de publicaciones?).
      parrafos: [{ texto: parrafoDelLaboratorio }],
      imagen: fotoDeBloque,
    },
    {
      id: 'divulgacion-multimedial',
      rotulo: 'Canal digital', // de la nota ("CANAL DIGITAL")
      titulo: 'Contenido multimedial', // de la nota
      // De la nota, pero anuncia entrevistas que no están: ni video, ni enlace (pregunta 11 de preguntas-museo.md: si
      // existen y dónde). "\n": el corte del tablero; sin el espacio que tenía al final.
      parrafos: [
        { texto: 'Entrevistas con científicos:\nConocé quiénes son los científicos detrás del laboratorio triásico.' },
      ],
      imagen: fotoDeBloque,
    },
  ],
  // "NEWSLETTER" (Figma 2857:5575): el h2 sin rótulo, la bajada en gris y tres tarjetas de recursos con el ícono en
  // naranja. El newsletter no tiene campo ni botón en el tablero y no se inventa ninguno (DV9): el sitio no tiene listas
  // de correo y la suscripción está fuera del alcance (pregunta 13 de preguntas-museo.md: si el museo usa un servicio,
  // alcanza con un enlace). "Entérate" va como en la nota y el tablero, de tú (el sitio usa el vos: a confirmar con el
  // museo).
  newsletter: {
    titulo: 'NEWSLETTER',
    bajada:
      'Entérate de las últimas noticias, descubrimientos, actividades del museo directamente en tu casilla de correo.',
    // RELLENO DEL TABLERO: las tres tarjetas son las de "Recursos educativos" de Educación (Figma 2846:1561), copiadas;
    // no están en la nota de Divulgación. Sus "enlaces" no tienen destino: van como texto (DV9). Las destraban las
    // preguntas 13 (el newsletter) y 28 (los recursos educativos) de preguntas-museo.md.
    tarjetas: [
      {
        icono: 'descarga',
        titulo: 'Guías didácticas',
        texto: 'Material educativo descargable para docentes: nivel inicial, primaria, secundaria y universidad.',
        accion: 'Ver guías',
      },
      {
        icono: 'video',
        titulo: 'Videos educativos',
        texto: 'Contenido audiovisual sobre paleontología y geología del Triásico: conferencias y documentales.',
        accion: 'Ver videos',
      },
      {
        icono: 'enlace',
        titulo: 'Biblioteca digital',
        texto: 'Acceso a publicaciones científicas del MuPa: artículos, libros y tesis.',
        accion: 'Explorar',
      },
    ],
  },
}

export const hero = {
  // La foto del V04 (IMG_1526 v2, 28/09/2026), con el recorte del diseño: 1440x1195,5 a 1440. Hasta entonces, la
  // IMG_1524 del Figma a 1440x852.
  imagen: {
    src: hero1920,
    srcSet: `${hero768} 768w, ${hero1280} 1280w, ${hero1920} 1920w, ${hero2560} 2560w`,
    sizes: '100vw',
    alt: 'Fachada del Museo Paleontológico de San Juan, con el cartel "MuPa Museo Paleontológico" sobre la entrada',
  },
}

export const intro = {
  // Respaldo si faltara 'titular': la frase completa, no el estado estático del mockup.
  titulo: 'un museo de sanjuaninos, hecho por sanjuaninos',
  // Titular con parallax: las líneas fijas van en la columna izquierda y la palabra móvil baja de fila en fila con el scroll.
  // 'lectura' es lo que oyen los lectores de pantalla.
  // El V03 de la diseñadora (25/09/2026) sacó la tercera frase ("y para"): quedan dos filas y un solo viaje de la palabra.
  titular: {
    fijas: ['un museo de', 'hecho por'],
    movil: 'sanjuaninos',
    lectura: 'un museo de sanjuaninos, hecho por sanjuaninos',
  },
  parrafo:
    'A través de una narrativa inmersiva y tecnológica, nos proponemos **inspirar vocaciones** en nuestras infancias, ' +
    '**conectar a la comunidad** con sus orígenes biológicos y geológicos, **y posicionar a San Juan** como el faro ' +
    'paleontológico más importante de la región de Cuyo y un referente internacional indiscutido, preparado para ' +
    'insertarse en circuitos científicos globales y ser el orgulloso anfitrión de eventos de máxima jerarquía.',
  // El bloque destacado (imagen en el .ai, video en el Figma) se descartó: el museo decidió no usar esa sección (21/09/2026).
}

export const identidad = {
  // Dos líneas, como en el V04 (whitespace-pre-line): el título va en la columna izquierda, arriba de la etiqueta.
  titulo: 'Identidad\nInstitucional',
  // Un eje por vez, en el carrusel (V03 de la diseñadora, 25/09/2026): ese PDF define por fin qué texto va con cada
  // etiqueta y en qué orden (Misión, Visión, Eje narrativo), y saca las palabras grandes que tenía el mockup anterior
  // ("Inspirar", "Referente", "Patrimonio"). Fotos del V03; la de Visión cambió en el V04 (28/09/2026): el cartel de
  // la fachada en lugar de la cúpula desde abajo.
  ejes: [
    {
      etiqueta: 'Misión',
      texto:
        'Inspirar vocaciones científicas, técnicas, artísticas y ocupacionales en las infancias y juventudes de San Juan, ' +
        'promoviendo la curiosidad, el pensamiento crítico y el deseo de comprender el pasado para transformar el futuro, ' +
        'desde una mirada socio-ambiental e inclusiva.',
      foto: {
        src: ejeMision1400,
        srcSet: `${ejeMision800} 800w, ${ejeMision1400} 1400w`,
        alt: 'Restauradora del museo trabajando con una herramienta sobre un fósil en el taller',
        encuadre: 'object-center',
      },
    },
    {
      etiqueta: 'Visión',
      texto:
        'Consolidarse como el museo paleontológico más importante de Cuyo y un referente imprescindible en todo el ' +
        'territorio nacional e internacional.',
      foto: {
        src: ejeVision1400,
        srcSet: `${ejeVision800} 800w, ${ejeVision1400} 1400w`,
        alt: 'Cartel "Museo Paleontológico" con la marca MuPa sobre la entrada del edificio, contra el cielo',
        encuadre: 'object-center',
      },
    },
    {
      etiqueta: 'Eje narrativo',
      texto:
        'La institución está dedicada en exclusividad a la divulgación, educación y preservación del patrimonio del ' +
        'Período Triásico, principalmente proveniente del Parque Provincial Ischigualasto (Patrimonio de la Humanidad por la UNESCO).',
      foto: {
        src: ejeNarrativo1400,
        srcSet: `${ejeNarrativo800} 800w, ${ejeNarrativo1400} 1400w`,
        alt: 'Esqueleto de un dinosaurio carnívoro montado en una sala del museo, con las fauces abiertas',
        encuadre: 'object-center',
      },
    },
  ],
  // Carrusel del V04 (28/09/2026; en el Figma era un collage de otras cinco fotos, después de los ejes): cinco fotos
  // apiladas entre el párrafo de la intro y esta sección, en orden de capas: la primera va al fondo (y es la que queda)
  // y la última adelante (la primera en salir con el scroll). Las mide Collage.jsx.
  collage: [
    {
      src: carruselLamas1400,
      srcSet: doble(carruselLamas700, carruselLamas1400),
      alt: 'Lamas metálicas curvas de la fachada del museo, vistas desde abajo contra el cielo',
    },
    {
      src: carruselDremel1400,
      srcSet: doble(carruselDremel700, carruselDremel1400),
      alt: 'Manos de un técnico puliendo con una herramienta rotativa la réplica de una garra de dinosaurio',
    },
    {
      src: carruselRestaurador1400,
      srcSet: doble(carruselRestaurador700, carruselRestaurador1400),
      alt: 'Restaurador con guantes revisando de cerca las vértebras de un esqueleto montado en el hall',
    },
    {
      src: carruselPincel1400,
      srcSet: doble(carruselPincel700, carruselPincel1400),
      alt: 'Manos de un restaurador pasando un pincel sobre un fósil',
    },
    {
      src: carruselPatio1400,
      srcSet: doble(carruselPatio700, carruselPatio1400),
      alt: 'Patio del museo con el edificio de la cúpula y las lamas de la fachada',
    },
  ],
  // Foto "Mid" del V04: sola, a todo el ancho del contenido, entre los ejes y el párrafo del cierre.
  foto: {
    src: midFachada1300,
    srcSet: `${midFachada1300} 1300w, ${midFachada2000} 2000w`,
    alt: 'Entrada del museo de día, con el muro de piedra y la cúpula vidriada',
  },
  parrafo:
    'El MuPa nace como una institución moderna, fruto de la co-gestión y coparticipación estratégica entre el ' +
    'Gobierno de la Provincia de San Juan, la Universidad Nacional de San Juan (UNSJ) y Fiduciaria San Juan. ' +
    'Esta alianza estratégica no solo garantiza la validación científica y académica de nuestro patrimonio, sino que ' +
    'también **consolida un modelo de gestión pública transparente, eficiente y profundamente comprometido con el futuro regional.**',
  // Logos del Figma (SVG blancos): ancho y alto con que van en el diseño a 1440 (el alto reserva su lugar al cargar).
  // Primero la Universidad y después Gobierno (pedido del desarrollador el 22/09/2026; el Figma los tiene al revés). El
  // footer usa la misma lista.
  // Anchos del V04 a 1440 (205 y 253,5; en el Figma eran 212 y 287), con el alto proporcional de cada SVG. El de la
  // UNSJ es el oficial (PDF de la universidad, 28/09/2026: mismo dibujo que el del Figma, proporción 2,17).
  // circulo: centro del emblema redondo de cada logo, en px desde su borde izquierdo a ese ancho (medido sobre el SVG):
  // los dos se alinean por ese eje (pedido del desarrollador el 28/09/2026).
  instituciones: [
    { nombre: 'Universidad Nacional de San Juan', logo: logoUnsj, ancho: 205, alto: 94.4, circulo: 47.3 },
    { nombre: 'Gobierno de San Juan', logo: logoGobierno, ancho: 253.5, alto: 73.06, circulo: 36.6 },
  ],
}

export const obra = {
  // El corte de línea es el del diseño (V03): dos líneas, pase lo que pase con el ancho (whitespace-pre-line).
  titulo: 'Gestión de una\nobra histórica',
  parrafo:
    'Este proyecto representa la culminación exitosa de un anhelo provincial de larga data, superando ' +
    'contingencias históricas gracias a la continuidad y decisión política de la gestión:',
  hitos: [
    { anio: '2013', texto: 'Inicio de la construcción edilicia original.' },
    { anio: '2015', texto: 'Paralización total de las obras debido a complejidades estructurales e institucionales.' },
    {
      anio: '2018/2024',
      texto:
        'Reactivación mediante nuevos procesos licitatorios, con la infraestructura constructiva prácticamente ' +
        'concluida hacia fines de 2024.',
    },
    {
      anio: '2024',
      texto:
        'El gobernador Marcelo Orrego decide aprobar en su totalidad el guion museológico presentado, dando luz verde ' +
        'a la etapa final del proyecto: el contenido y la museografía interna.',
    },
    { anio: '2025', texto: 'Creación del Fideicomiso, comienzo de la ejecución del proyecto museo.' },
    {
      anio: '2025/2026',
      texto: 'Etapa estratégica de desarrollo de contenidos, diseño de experiencias inmersivas y montaje técnico de salas.',
    },
    { anio: '2026', texto: 'Inauguración oficial.' },
  ],
  // Mosaico del Figma (capas "06" a "10"), en ese orden; el V04 (28/09/2026) cambió solo la quinta, la vertical.
  fotos: [
    {
      src: obraRestauracion1000,
      srcSet: `${obraRestauracion500} 500w, ${obraRestauracion1000} 1000w`,
      alt: 'Persona del equipo de restauración trabajando con un pincel entre los huesos de un esqueleto',
    },
    {
      src: obraCarnivoro1200,
      srcSet: `${obraCarnivoro600} 600w, ${obraCarnivoro1200} 1200w`,
      alt: 'Esqueleto de un dinosaurio carnívoro en montaje en el hall, con técnicos trabajando alrededor',
    },
    {
      src: obraFachada1000,
      srcSet: `${obraFachada500} 500w, ${obraFachada1000} 1000w`,
      alt: 'Frente curvo del museo con el cartel "MuPa Museo Paleontológico"',
    },
    {
      src: obraMontaje1000,
      srcSet: `${obraMontaje500} 500w, ${obraMontaje1000} 1000w`,
      alt: 'Esqueleto de dinosaurio sobre su base en una sala, con técnicos del montaje trabajando',
    },
    {
      src: obraSoldador390,
      srcSet: `${obraSoldador390} 390w, ${obraSoldador780} 780w`,
      alt: 'Soldador con máscara trabajando sobre la estructura metálica de un montaje, entre chispas',
    },
  ],
}

export const areas = {
  // V04 de la diseñadora (28/09/2026): título en dos líneas (\n = corte del diseño), la segunda en negrita; se fueron
  // el título viejo del V02 ("Cuatro formas distintas de hacer una misma cosa"), el remate ("que el MuPa nunca deje de
  // moverse") y los dos párrafos.
  titulo: 'El MuPa es una unidad integral conformada por\n**cuatro áreas que se complementan entre sí**',
  // Las cuatro etiquetas en recuadros de color, a la derecha (no son botones: el desarrollador lo confirmó el
  // 28/09/2026), y el párrafo que va debajo (peso 400 en el archivo, no 300 como los demás: se respeta).
  etiquetas: ['MuPa CIENCIA', 'MuPa EDUCACIÓN', 'MuPa PRODUCCIÓN', 'MuPa FORMA LAB'],
  parrafo:
    'Esta articulación amplía la capacidad productiva del MuPa y genera recursos que contribuyen a su ' +
    'sustentabilidad económica.',
  // Contenido oficial del museo ("Los 4 MuPa", 22/09/2026), cargado tal cual. Decisiones del desarrollador ese día: la
  // tercera banda sigue llamándose "Producción" (el texto dice "MuPa Producciones"); negrita en las frases que abren
  // tema (las de Ciencia ya venían del Figma, y con el mismo criterio "Integración curricular:", "Pre y post MuPa:" y "Es
  // el nexo entre el conocimiento y la realización:"); la frase final de Ciencia y el subtítulo de Forma Lab ("el corazón
  // productivo") van como lema (mayúsculas, mono), sin el punto final; y en Producción "…desarrollar una idea. Logrando
  // generar recursos…" se unió con coma. La división en párrafos sigue las frases que abren tema (el texto llegó sin
  // saltos de línea).
  items: [
    {
      id: 'ciencia',
      nombre: 'Ciencia',
      color: 'ciencia',
      parrafos: [
        'MuPa Ciencia es el corazón vivo de la institución: **el área que sostiene, actualiza y proyecta el contenido ' +
          'del museo en el tiempo.** Si el edificio es la casa, MuPa Ciencia es lo que la mantiene habitada, investigación ' +
          'permanente, actualización de los guiones curatoriales y vínculo activo con la comunidad científica que estudia ' +
          'el patrimonio de la provincia.',
        '**Ciencia como sustento institucional:** este pilar es también el que le da continuidad al proyecto. Cada nuevo ' +
          'hallazgo, cada línea de investigación que se suma, es contenido fresco para el museo y motivo para que el ' +
          'público vuelva.',
      ],
      lema:
        'Apostar a la ciencia como motor de la educación y la cultura es, en definitiva, lo que distingue a un museo ' +
        'vivo de uno estático',
      // En el V04 el lema de Ciencia va en Roboto Mono Regular (el de Forma Lab, en Medium).
      lemaPeso: 'regular',
      // Foto "Acordeon - Ciencia" de la selección del V04 (28/09/2026): viene en 920x633, así que no hay versión de
      // 1140 px (pedir el original al museo).
      foto: { src: areaCiencia570, alt: 'Paleontóloga registrando un hallazgo en el campo con una cuadrícula de hilos sobre el fósil' },
    },
    {
      id: 'educacion',
      nombre: 'Educación',
      color: 'educacion',
      parrafos: [
        'Si MuPa Ciencia genera conocimiento, **MuPa Educación lo transforma en experiencia pedagógica** y lo lleva a cada ' +
          'rincón de la provincia. Es el puente entre el museo y la escuela, la instancia que garantiza que ninguna ' +
          'infancia y adolescencia sanjuanina se quede afuera, sin importar cuán lejos esté su colegio de la ciudad de ' +
          'San Juan.',
        '**Integración curricular:** el objetivo es que la visita al MuPa deje de ser un paseo aislado y pase a formar ' +
          'parte de la currícula escolar, en todos los niveles, con los estudiantes de cuarto grado como público ' +
          'prioritario.',
        '**Pre y post MuPa:** el programa se completa con talleres, material didáctico y capacitaciones para docentes, ' +
          'que se convierten en multiplicadores del contenido científico del museo durante todo el año.',
      ],
      // Lema tomado del propio texto del museo ("Es el puente entre el museo y la escuela"), para que el panel cierre
      // como los de Ciencia y Forma Lab (pedido del desarrollador, 28/09/2026). A validar con el museo.
      lema: 'El puente entre el museo y la escuela',
      // Fotos de Educación, Producción y Forma Lab: las que mandó el museo el 22/09/2026, recortadas casi cuadradas.
      foto: {
        src: areaEducacion1140,
        srcSet: `${areaEducacion570} 570w, ${areaEducacion1140} 1140w`,
        alt: 'Chicos de guardapolvo blanco asomados a la baranda de vidrio del hall del museo',
      },
    },
    // Era "Espectáculo" en el mockup; el museo lo renombró "Producción" (22/09/2026), también en el párrafo de arriba.
    {
      id: 'produccion',
      nombre: 'Producción',
      color: 'produccion',
      parrafos: [
        'Es la unidad productiva del MuPa. Su función es **transformar ideas y contenidos en proyectos posibles,** ' +
          'articulando los recursos humanos, técnicos y materiales necesarios para llevarlos adelante.',
        'Desarrolla y gestiona proyectos de distinta naturaleza: espectáculos, muestras, audiovisuales, experiencias ' +
          'inmersivas, eventos institucionales y corporativos, entre otros formatos, ampliando las posibilidades de ' +
          'producción del museo más allá de su actividad expositiva.',
        '**Es el nexo entre el conocimiento y la realización:** recibe los contenidos y las ideas desarrolladas desde ' +
          'MuPa Ciencia, identifica las necesidades de cada proyecto y articula los recursos necesarios trabajando junto ' +
          'a Forma Lab en su realización.',
        'MuPa Producciones no se limita a los proyectos propios del museo. Su estructura y capacidad productiva pueden ' +
          'ponerse al servicio de instituciones, empresas, organizaciones y proyectos externos que necesiten desarrollar ' +
          'una idea, logrando generar recursos que contribuyen a la sostenibilidad y al crecimiento del MuPa.',
      ],
      // Lema tomado del propio texto del museo ("Es el nexo entre el conocimiento y la realización"), como el de
      // Educación (28/09/2026). A validar con el museo.
      lema: 'El nexo entre el conocimiento y la realización',
      // Foto "Acordeon - Produccion" de la selección del V04 (28/09/2026); hasta entonces, la del taller que mandó el
      // museo el 22/09.
      foto: {
        src: areaProduccion1140,
        srcSet: `${areaProduccion570} 570w, ${areaProduccion1140} 1140w`,
        alt: 'Público sentado en el césped frente al museo, de noche, mirando una proyección de un dinosaurio en la fachada',
      },
    },
    {
      id: 'formalab',
      nombre: 'Forma Lab',
      color: 'formalab',
      parrafos: [
        'Representa el motor creativo, técnico y productivo del MuPa. Es el núcleo que hace posible el museo y, al ' +
          'mismo tiempo, se proyecta como una plataforma al servicio de proyectos comerciales, iniciativas ' +
          'institucionales, desarrollo de exhibiciones, producción de contenidos e innovación cultural.',
        'Esto garantiza la sostenibilidad del museo, la generación de **empleo especializado y enriquece la matriz ' +
          'productiva de San Juan** en la integración de ciencia y creatividad con tecnología única en el país.',
      ],
      lema: 'El corazón productivo',
      // Logo FormaLAB del V04 (vectorial en el .ai: letras crema y el punto en rojo), arriba del texto del panel.
      logo: { src: logoFormalab, alt: 'FormaLAB', ancho: 314, alto: 52.5 },
      foto: {
        src: areaFormalab1140,
        srcSet: `${areaFormalab570} 570w, ${areaFormalab1140} 1140w`,
        alt: 'Taller de Forma Lab: dos técnicos junto a una fresadora CNC que talla un bloque de telgopor',
      },
    },
  ],
}

// Pie de todas las páginas (src/components/Pie.jsx; desde el 02/11/2026, el del tablero "Web" de la diseñadora). Las
// redes no están acá: salen de estado.museo, lo que se carga en el panel, y si no hay ninguna no se dibujan. La
// dirección, el horario, el teléfono y el correo ya no van en el pie: los muestran Visitas y Contacto.
export const pie = {
  instituciones: identidad.instituciones,
  // El © como en el tablero ("© 2026 MUPA - Museo Paleontológico de San Juan"): el año lo pone el servidor en el
  // estado (estado.anio); sin año (npm run dev:vite), sin año.
  legal: 'MUPA - Museo Paleontológico de San Juan',
  // Las secciones del sitio también en el pie: andan sin JavaScript y antes de que cargue (el botón Menú del celular
  // necesita JavaScript), y en la 404 (A11Y-03 de la verificación de E4). El nombre de su navegación es distinto del
  // de la del header ("Principal") y del de la 404 ("Secciones del sitio"), así en la lista de regiones de un lector de
  // pantalla no hay dos iguales (A11Y-07).
  secciones: 'Secciones del sitio (pie de página)',
  // Línea de privacidad (plan 6.7 y 9, Ley 25.326: la medición de visitas y los mensajes del formulario). La escribe
  // el museo y todavía no la mandó: vacía, no se dibuja. No inventarla.
  privacidad: '',
  redes: 'Redes',
}
