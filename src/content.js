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
import mapaMuseoHover from './assets/mapa-museo-hover.svg'
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
import heroEducacion960 from './assets/hero-educacion-960.webp'
import heroEducacion1440 from './assets/hero-educacion-1440.webp'
import heroEducacion1920 from './assets/hero-educacion-1920.webp'
import heroEducacion2880 from './assets/hero-educacion-2880.webp'
import educacionEscolares600 from './assets/educacion-escolares-600.webp'
import educacionEscolares1140 from './assets/educacion-escolares-1140.webp'
import heroCircuitos960 from './assets/hero-circuitos-960.webp'
import heroCircuitos1440 from './assets/hero-circuitos-1440.webp'
import heroCircuitos1920 from './assets/hero-circuitos-1920.webp'
import heroCircuitos2880 from './assets/hero-circuitos-2880.webp'
import bloqueCiencia600 from './assets/bloque-ciencia-600.webp'
import bloqueCiencia880 from './assets/bloque-ciencia-880.webp'
import bloqueDivulgacion600 from './assets/bloque-divulgacion-600.webp'
import heroElMuseo960 from './assets/hero-el-museo-960.webp'
import heroElMuseo1440 from './assets/hero-el-museo-1440.webp'
import heroElMuseo1920 from './assets/hero-el-museo-1920.webp'
import heroElMuseo2880 from './assets/hero-el-museo-2880.webp'
import patronB from './assets/patron-b.svg'

// srcSet de las fotos del carrusel, con versión de 700 y de 1400 px.
const doble = (chica, grande) => `${chica} 700w, ${grande} 1400w`

// Las fotos de "El MuPa en imágenes" de la Home (Collage.jsx, con identidad.collage, más abajo), que también usa El
// Museo (elMuseo: el patio en "El MuPa" y tres en los documentales): las del carrusel del V04, enteras (3:2), en 700 y
// 1400. Van acá arriba (elMuseo está antes que identidad en el archivo) y identidad.collage arma su lista con los mismos
// objetos: el HTML de la Home no cambia.
const FOTOS_CARRUSEL = {
  lamas: {
    src: carruselLamas1400,
    srcSet: doble(carruselLamas700, carruselLamas1400),
    alt: 'Lamas metálicas curvas de la fachada del museo, vistas desde abajo contra el cielo',
  },
  dremel: {
    src: carruselDremel1400,
    srcSet: doble(carruselDremel700, carruselDremel1400),
    alt: 'Manos de un técnico puliendo con una herramienta rotativa la réplica de una garra de dinosaurio',
  },
  restaurador: {
    src: carruselRestaurador1400,
    srcSet: doble(carruselRestaurador700, carruselRestaurador1400),
    alt: 'Restaurador con guantes revisando de cerca las vértebras de un esqueleto montado en el hall',
  },
  pincel: {
    src: carruselPincel1400,
    srcSet: doble(carruselPincel700, carruselPincel1400),
    alt: 'Manos de un restaurador pasando un pincel sobre un fósil',
  },
  patio: {
    src: carruselPatio1400,
    srcSet: doble(carruselPatio700, carruselPatio1400),
    alt: 'Patio del museo con el edificio de la cúpula y las lamas de la fachada',
  },
}

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
// el pie y la 404 dibujan solo las secciones cuya página existe (src/components/navegacion.js; desde el 06/11/2026
// existen todas: si se sacara una, su sección se va sola; la dirección de cada una tiene que ser la de su ruta en
// server/rutas-publicas.js: lo comprueba layout.test.js).
// - menu: las del header, en el orden del tablero. El tercer ítem dice "Divulgación" (el tablero dice "Producción" en
//   cuatro páginas y "Divulgación" en dos: a confirmar con la diseñadora). Sin el selector de idioma "Es (Arg)" del
//   tablero (fuera del alcance: un control que no hace nada no puede quedar).
// - otras: las páginas que existen y el tablero no pone en el menú; van en el pie y en la 404.
// - entradas: el botón naranja del header (la compra externa que carga el panel, solo si está activa). Texto fijo y
//   corto (el tablero dice "Tikets": errata). comprar: el texto de "Comprar entradas" de BotonCompra.jsx si el museo
//   no cargó uno; desde la Visitas del tablero (03/11/2026, V1) ninguna página dibuja ese botón (queda sin usar, sin
//   borrar: C1 del cierre, 09/11/2026).
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
  // no los usa: los leen TablaHorarios.jsx y ListaTarifas.jsx, que quedan sin usar, sin borrar (C1, 09/11/2026).
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
  // navegacion.entradas); "Recursos educativos" va a Educación (se dibuja porque la página existe, desde el
  // 06/11/2026). La "Tienda virtual" del tablero no va (fuera del alcance: "a futuro" en la nota de la diseñadora).
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
  // "Mapa del Museo" (decisión D15, 09/11/2026; reemplaza a D10): en reposo, la versión naranja del tablero ("Group 3",
  // exportada en SVG) con los nombres en #010101; con el mouse sobre una sala, esa sala como la versión bordó con los
  // nombres en blanco ("Group 4", hover). Los nombres del dibujo son trazados: van además como texto para el lector de
  // pantalla, en el orden en que se recorre el plano (de arriba a la izquierda hacia abajo y a la derecha), que es
  // también el de las salas de src/components/mapaSalas.js. El hover es solo visual: el plano interactivo es el módulo
  // opcional del plano.
  mapa: {
    titulo: 'Mapa del Museo',
    // Los dos SVG miden 882,765x811,848 (los atributos width y height de la imagen van en enteros).
    imagen: {
      src: mapaMuseo,
      hover: mapaMuseoHover,
      ancho: 883,
      alto: 812,
      alt: 'Plano de la planta del museo, con sus salas y espacios',
    },
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
// cuadrícula de hilos (del V04 "Acordeon - Ciencia", 920x633), con el encuadre del tablero. Va en 600x420 (10:7) con
// object-cover (BloqueTextoFoto.jsx). Hasta el cierre de E6.3 (DIV-FOTO-01, 09/11/2026) era area-ciencia-570 de la
// landing (570x567), que se estiraba un 5 % para llenar los 600 de la caja; ahora sale del original con el mismo
// recorte que se veía (bloque-divulgacion-600, tools/convertir-fotos.mjs), sin agrandar. Para una pantalla de densidad
// 2 hace falta el original del museo (pregunta 14). El alt no nombra a nadie (IN5); repetido en cada bloque (R-I).
// RELLENO DEL TABLERO: la misma foto en los cuatro bloques (y en la tarjeta 1 de las noticias del tablero), de la banda
// Ciencia de la landing; la destraba la pregunta 14 de tools/salida/e6-divulgacion/prep/preguntas-museo.md (fotos del
// laboratorio, del campo y de los investigadores). sizes: el de "Museo accesible" (la mitad del contenido desde lg).
const fotoDeBloque = {
  src: bloqueDivulgacion600,
  srcSet: `${bloqueDivulgacion600} 600w`,
  sizes: '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)',
  ancho: 600,
  alto: 420,
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

// La foto de "Visitas Escolares" de Educación (decisión R-B del orquestador, 06/11/2026): los chicos de guardapolvo en
// la baranda del hall, la foto real de una visita escolar que mandó el museo el 22/09/2026 (la banda Educación de la
// landing, ya publicada en mupa.ar con este alt). El tablero la pone en el hero, donde no alcanza (1.140 px), y en esta
// sección pone la paleontóloga del campo (relleno); acá va al revés. 10:7 en 600 y 1140 (tools/convertir-fotos.mjs,
// desde area-educacion-1140: el original no está en esta PC). sizes: el de "Museo accesible" (la mitad del contenido
// desde lg). A validar con el museo: el permiso de los chicos (pregunta 3 de la lista de Divulgación) y EDU-6.
const fotoDeVisitasEscolares = {
  src: educacionEscolares600,
  srcSet: `${educacionEscolares600} 600w, ${educacionEscolares1140} 1140w`,
  sizes: '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)',
  ancho: 1140,
  alto: 798,
  alt: 'Chicos de guardapolvo blanco asomados a la baranda de vidrio del hall del museo',
}

// Educación (src/paginas/Educacion.jsx): la página del tablero "Web" (Figma 2846:1561; decisiones IN1 a IN10 del
// desarrollador, 06/11/2026). Va COMPLETA, como el tablero (IN1): el hero, "Visitas Escolares" (BloqueTextoFoto.jsx) y
// "Recursos educativos" (SeccionRecursos.jsx). Es la misma excepción a D13 y al plan 6.1 que Divulgación (DV1), hasta
// que el museo mande lo suyo. El texto es el de la nota de contenido de la página (Figma 2846:1871), que es del museo
// (a validar, pregunta 1 de tools/salida/e6-divulgacion/prep/preguntas-museo.md): el título, el rótulo, el h2 y los
// dos párrafos de Visitas Escolares, y el h2, la bajada y los títulos y textos de las tres tarjetas de Recursos. Del
// tablero y no de la nota: la lista de niveles, "Coordinar visita", el rótulo "Recursos" y los "enlaces" de las
// tarjetas. Las erratas evidentes, corregidas: la nota dice "Videos Educativos" y "triásico" (van como en el tablero).
// Lo de relleno lleva al lado "RELLENO DEL TABLERO:", con de dónde viene y qué pregunta lo destraba (de
// tools/salida/e6-internas/prep/educacion/preguntas-museo.md, EDU-n, o de la de Divulgación, por número); antes del
// corte del dominio, se reemplaza o se saca (IN4). Ningún control sin destino (IN2): "Coordinar visita" lleva a
// Contacto (enlace.pagina; si esa página no existiera, iría como texto) y los "enlaces" de las tarjetas van como texto
// (url: null) hasta que el museo diga dónde están los recursos.
export const educacion = {
  hero: {
    titulo: 'Educación', // de la nota ("EDUCACIÓN"); sin bajada: la nota la deja vacía
    // RELLENO DEL TABLERO: la foto del tablero (los chicos de guardapolvo en la baranda, 2846:1563) es
    // area-educacion-1140 de la landing: 1.140 px, no alcanza para el hero (va en "Visitas Escolares"). Va la
    // restauradora con el pincel sobre un fósil en el hall ("Id. Mision - IMG_7735" de la selección, el eje Misión de la
    // landing; decisión R-A del orquestador), 3:1 sin el 15 % de la derecha del original (así la cara queda en el 62-70 %
    // del ancho), filas del 9,5 al 52 %: el h1 sobre la pared y el pelo, y la cara debajo. Desde 1440 la foto ocupa todo
    // el ancho y se recorta arriba y abajo: posicion '50% 90%' deja la boca entera hasta 3440, y de ~1640 en adelante los
    // ojos quedan a la derecha del h1 (hasta ahí, debajo). Medido de 1024 a 3440: el h1 no tapa los ojos ni la boca en
    // ningún ancho. El alt es nuestro (a validar con el museo, pregunta 38 de la lista de Divulgación). La destraban
    // EDU-1 (el original de los chicos en alta resolución) y la pregunta 30 de la lista de Divulgación (fotos de visitas
    // escolares).
    imagen: fotoDeHero(
      [heroEducacion960, heroEducacion1440, heroEducacion1920, heroEducacion2880],
      '50% 90%',
      'Restauradora del museo sonriendo mientras trabaja con un pincel, en el hall',
    ),
  },
  // "Visitas Escolares" (BloqueTextoFoto.jsx, Figma 2851:77).
  escolares: {
    id: 'educacion-visitas',
    rotulo: 'Experiencia MuPa', // de la nota (Volanta); las mayúsculas, por CSS
    titulo: 'Visitas Escolares', // de la nota y del tablero, con la E mayúscula (¿el nombre del programa?: EDU-2)
    parrafos: [
      {
        // De la nota (a validar: pregunta 25 de la lista de Divulgación).
        texto:
          'Traé a tu escuela al MuPa y viajá con tus estudiantes al Triásico. Nuestros guías especializados adaptan ' +
          'el recorrido al nivel de cada grupo, inicial, primaria, secundaria y nivel superior.',
      },
      // De la nota; "esenciales" queda como está (¿"especiales"?: pregunta 25).
      { texto: 'Contactanos para coordinar fecha, horario y requerimientos esenciales.', secundario: true },
    ],
    // Del tablero (no está en la nota): repite los niveles del párrafo (EDU-3).
    lista: ['Nivel inicial', 'Primaria', 'Secundaria', 'Nivel superior'],
    // Del tablero, sin destino en el archivo: a Contacto (IN2; adónde lleva de verdad, pregunta 27).
    enlace: { texto: 'Coordinar visita', pagina: 'contacto' },
    imagen: fotoDeVisitasEscolares,
  },
  // "Recursos educativos" (SeccionRecursos.jsx, Figma 2851:104): el rótulo, el h2, la bajada y tres tarjetas con el
  // ícono en crema. Cada tarjeta, con la forma de una fila (IN3): icono (la clave de SeccionRecursos.jsx: descarga,
  // video o enlace), titulo, texto, accion y url (null: la acción va como texto; con url, como enlace).
  recursos: {
    id: 'educacion-recursos',
    rotulo: 'Recursos', // del tablero (no está en la nota); las mayúsculas, por CSS
    titulo: 'Recursos educativos', // de la nota
    bajada: 'Material gratuito para educadores y estudiantes', // de la nota (Subtítulo)
    // Los títulos y los textos, de la nota (como los escribe el tablero: "Videos educativos", "Triásico"; los puntos
    // finales, del tablero).
    // RELLENO DEL TABLERO: las acciones ("Ver guías", "Ver videos", "Explorar") son del tablero y no tienen destino:
    // van como texto (url: null, IN2). No sabemos si las guías, los videos y la biblioteca existen ni dónde están: los
    // destraban la pregunta 28 de la lista de Divulgación y EDU-4. Antes del corte: el enlace de cada una, o sacarla.
    tarjetas: [
      {
        icono: 'descarga',
        titulo: 'Guías didácticas',
        texto: 'Material educativo descargable para docentes: nivel inicial, primaria, secundaria y universidad.',
        accion: 'Ver guías',
        url: null,
      },
      {
        icono: 'video',
        titulo: 'Videos educativos',
        texto: 'Contenido audiovisual sobre paleontología y geología del Triásico: conferencias y documentales.',
        accion: 'Ver videos',
        url: null,
      },
      {
        icono: 'enlace',
        titulo: 'Biblioteca digital',
        texto: 'Acceso a publicaciones científicas del MuPa: artículos, libros y tesis.',
        accion: 'Explorar',
        url: null,
      },
    ],
  },
}

// La foto de los dos circuitos de Circuitos (BloqueTextoFoto.jsx, 600x420 a 1440, 10:7): la que les puso la diseñadora
// en el tablero, la paleontóloga con la cuadrícula de hilos (la misma de los bloques de Divulgación), pero desde su
// original ("Acordeon - Ciencia" de la Selección, 920x633; decisión R-C del orquestador) y no desde area-ciencia-570: sin
// el marco del escaneo y un poco más abierta, en 600 y 880 (1,47x a 600; para 2x hace falta el original del museo).
// Divulgación va con el encuadre del tablero (fotoDeBloque, más arriba: el mismo original, desde el cierre de E6.3). El
// alt, el de Divulgación (no nombra a nadie: IN5); repetido en los dos circuitos, como en Divulgación (R-I: vaciarlo en
// la repetida queda a decidir, para las dos páginas). sizes: el de "Museo accesible" (la mitad del contenido desde lg).
// RELLENO DEL TABLERO: la misma foto en los dos circuitos (y en los bloques de Divulgación); no es de Ischigualasto ni
// del Parque las Huellas que se sepa. La destraba la pregunta 35 de tools/salida/e6-divulgacion/prep/preguntas-museo.md
// (fotos de los dos lugares, con permiso y crédito).
const fotoDeCircuito = {
  src: bloqueCiencia600,
  srcSet: `${bloqueCiencia600} 600w, ${bloqueCiencia880} 880w`,
  sizes: '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)',
  ancho: 880,
  alto: 616,
  alt: 'Paleontóloga registrando un hallazgo en el campo con una cuadrícula de hilos sobre el fósil',
}

// Circuitos (src/paginas/Circuitos.jsx): la página del tablero "Web" (Figma 2860:5827; decisiones IN1 a IN10 del
// desarrollador, 06/11/2026). Va COMPLETA, como el tablero (IN1): el hero con su bajada y los dos circuitos, Valle de la
// Luna con "Conexión MuPa". Es la misma excepción a D13 y al plan 6.1 que Divulgación (DV1), hasta que el museo mande lo
// suyo: lo de relleno o en borrador lleva al lado "RELLENO DEL TABLERO:", con de dónde viene y qué pregunta lo destraba
// (de tools/salida/e6-divulgacion/prep/preguntas-museo.md, por número, o de
// tools/salida/e6-internas/prep/circuitos/preguntas-museo.md, Cn); antes del corte del dominio, se reemplaza o se saca
// (IN4). El texto es el del tablero; la nota de contenido de la página (Figma 2860:6184) dice lo mismo salvo dos cosas:
// en Valle de la Luna, los tres dinosaurios van entre rayas ("conocidos — Eoraptor, …, Herrerasaurus — y escenario") y
// el tablero los puso después de dos puntos; en Parque las Huellas, la nota trae aparte la línea "Descubrimiento 2024 —
// Iglesia, San Juan" y el tablero la metió en el párrafo ("en el departamento de Iglesia, San Juan,"). Va el del tablero
// (pregunta C1). Las erratas evidentes, corregidas: "Palentológicos" en el h1 (y en minúscula, como los demás h1 del
// tablero: decisión R-G del orquestador) y el espacio final de la bajada. Los circuitos son filas (IN3: slug, nombre,
// parrafos, lista, enlace, apartado, imagen): el día que los cargue el museo, son un tipo del panel con estos campos.
// Ningún control sin destino (IN2): "Coordinar visita" lleva a Contacto (enlace.pagina; si esa página no existiera, iría
// como texto).
export const circuitos = {
  hero: {
    titulo: 'Circuitos\npaleontológicos', // "\n": el corte del tablero ("Circuitos" / "Palentológicos")
    // RELLENO DEL TABLERO: borrador de la nota: anuncia destinos "urbanos" que la página no tiene; lo destraba la
    // pregunta 31 (tools/salida/e6-divulgacion/prep/preguntas-museo.md).
    bajada: 'Extendé tu visita al MuPa con otros destinos paleontológicos y urbanos de San Juan.',
    // RELLENO DEL TABLERO: la foto del tablero (de campo, 1000x993, la misma del tablero de Divulgación) no alcanza y no
    // está en la Selección (IN6); va el soldador con la máscara entre los caños celestes (Mosaico - IMG_1085 de la
    // Selección, la foto 5 del mosaico de Obra de la landing, ya publicada en mupa.ar), 3:1 con las filas del 40 al 90 %
    // (decisión R-D del orquestador: con el esqueleto de IMG_8110, la primera propuesta, la bajada quedaba sobre una pared
    // blanca, con el 1,5-2 % del borde de sus letras bajo 3:1; con esta, como mucho el 0,2 %, medido de 1024 a 3440).
    // posicion: la máscara (al 62 % del ancho y el 40 % del alto del recorte), así queda a la misma altura más allá de
    // 1440. No tiene que ver con los circuitos: la destraba la pregunta 35 (fotos de los dos lugares). El alt, el de la
    // landing (no se le ve la cara: la máscara la tapa).
    imagen: fotoDeHero(
      [heroCircuitos960, heroCircuitos1440, heroCircuitos1920, heroCircuitos2880],
      '62% 40%',
      'Soldador con máscara trabajando sobre la estructura metálica de un montaje, entre chispas',
    ),
  },
  // El rótulo de cada circuito (del tablero y de la nota, "CIRCUITOS PALEONTOLÓGICOS"; las mayúsculas, por CSS). Si
  // algún día hay circuitos urbanos, pasa a ser un campo de cada fila.
  rotulo: 'Circuitos paleontológicos',
  // Cada circuito, un BloqueTextoFoto (el id del h2, y el ancla, circuito-<slug>: Circuitos.jsx).
  destinos: [
    {
      slug: 'valle-de-la-luna',
      nombre: 'Valle de la Luna', // del tablero y de la nota (pregunta 32: ¿o "Ischigualasto", o los dos?)
      parrafos: [
        {
          // Del tablero; "Herrerasaurus, y escenario" (la coma que dejó el cambio de las rayas de la nota por dos
          // puntos) queda como está: no es una errata evidente (pregunta 32).
          texto:
            'El yacimiento paleontológico más importante del Triásico en el mundo. Hogar de los primeros dinosaurios ' +
            'conocidos: Eoraptor, Eodromaeus, Herrerasaurus, y escenario de décadas de investigación del equipo del ' +
            'MuPa. Patrimonio de la Humanidad UNESCO desde 2000.',
        },
      ],
      // RELLENO DEL TABLERO: borrador de la nota a validar: "Triásico Inferior" (Ischigualasto es del Triásico
      // Superior) y "Recorrido guiado en vehículo" (¿sigue así?); lo destraba la pregunta 32.
      lista: ['Dinosaurios del Triásico Inferior', 'Recorrido guiado en vehículo', 'Paisaje lunar'],
      // Sin destino en el tablero: a Contacto (IN2; adónde lleva de verdad, pregunta 34).
      enlace: { texto: 'Coordinar visita', pagina: 'contacto' },
      apartado: {
        titulo: 'Conexión MuPa', // del tablero y de la nota
        // RELLENO DEL TABLERO: borrador de la nota: "más de 40 especies" en Ischigualasto (en El Museo, "40 especies"
        // en total) y el cargo abreviado, "Dir. Científico". Lo destraban las preguntas 32 y C3.
        parrafos: [
          {
            texto:
              'Muchas de las especies exhibidas en el MuPa provienen de Ischigualasto. El Dir. Científico Ricardo ' +
              'Martínez descubrió aquí más de 40 especies.',
          },
        ],
      },
      imagen: fotoDeCircuito,
    },
    {
      slug: 'parque-las-huellas',
      nombre: 'Parque las Huellas', // del tablero y de la nota (pregunta 33: en El Museo, "Parque de las Huellas")
      parrafos: [
        {
          // RELLENO DEL TABLERO: borrador: es la versión del tablero, que mete en el párrafo la línea de la nota
          // "Descubrimiento 2024 — Iglesia, San Juan", y dice a la vez Iglesia y "en las cercanías de la capital
          // sanjuanina"; el cargo, abreviado ("Dir."). Lo destraban la pregunta 33, C1 y C3.
          texto:
            'Descubierto en 2024 en el departamento de Iglesia, San Juan, por el Dir. Oscar Alcober, este yacimiento ' +
            'conserva huellas fósiles extraordinarias de dinosaurios del Triásico en las cercanías de la capital ' +
            'sanjuanina. El hallazgo más reciente del equipo del MuPa.',
        },
      ],
      lista: [],
      // Sin destino en el tablero: a Contacto (IN2; pregunta 34).
      enlace: { texto: 'Coordinar visita', pagina: 'contacto' },
      apartado: null, // ¿tiene su "Conexión MuPa"? (pregunta C4)
      imagen: fotoDeCircuito,
    },
  ],
}

// El tamaño de las fotos de El Museo (src/paginas/ElMuseo.jsx), para el srcset: la del patio, la mitad del contenido
// desde lg (como "Museo accesible" de Visitas); las de los documentales, un tercio (tres columnas con 32 entre sí).
const SIZES_MITAD = '(min-width: 90rem) 600px, (min-width: 64rem) calc((100vw - 15rem) / 2), calc(100vw - 3rem)'
const SIZES_TERCIO = '(min-width: 90rem) 405px, (min-width: 64rem) calc((100vw - 14rem) / 3), calc(100vw - 3rem)'

// El Museo (src/paginas/ElMuseo.jsx): la página del tablero "Web" (Figma 2823:10228; decisiones IN1 a IN10 del
// desarrollador, 06/11/2026). Va COMPLETA, como el tablero (IN1): el hero, El MuPa, Cómo nos organizamos, Misión y visión
// con Valores, Haciendo el MuPa, El MuPa en números, Autoridades y Nuestro equipo. Es la misma excepción a D13 y al plan
// 6.1 que Divulgación (DV1), hasta que el museo mande lo suyo: lo de relleno lleva al lado "RELLENO DEL TABLERO:", con de
// dónde viene y qué pregunta lo destraba (de tools/salida/e6-internas/prep/el-museo/preguntas-museo.md, Mn, o de
// tools/salida/e6-divulgacion/prep/preguntas-museo.md, por número: las de El Museo son la 15 a la 24); antes del corte
// del dominio, se reemplaza o se saca (IN4). Lo que está en la nota de contenido de la página (Figma 2823:11012:
// tools/salida/e6-internas/prep/el-museo/figma/nota-contenido.md) es texto del museo (a validar, pregunta 1 de la lista
// de Divulgación); los rótulos "El Museo Paleontológico", "Liderazgo" y "El equipo" son del tablero (no están en la
// nota). Las erratas evidentes, corregidas: "Áreas de extensión" -> "Área de extensión" y "Director Científico" ->
// "Director científico" (como la nota). Como están (no son erratas evidentes; M2 y M3): "Co-gestión" y "Cogestión",
// "socio-ambiental" y "socioambiental", los nombres científicos sin cursiva y "3500". Lo que algún día podría cargar el
// museo en el panel va como filas (IN3): las partes de la cogestión, los valores, los documentales, las cifras, las
// autoridades y el equipo. La página no tiene enlaces ni botones propios (IN2): el "play" de los documentales es un
// decorado y las píldoras de Valores, una lista.
export const elMuseo = {
  hero: {
    titulo: 'Acerca del MuPa', // el de la nota y el tablero (el menú dice "El Museo": pregunta 15); sin bajada
    // RELLENO DEL TABLERO: la foto del tablero es la fachada con el cartel (Header - IMG_1526 v2), que ya es el hero de
    // Contacto (IN6); va la más cercana de la Selección que no repite un hero (decisión R-E del orquestador): el mismo
    // frente, de cerca y contra el cielo (Id. Vision - IMG_1676, el eje Visión de la landing), 3:1 de la franja x del 5
    // al 95 % y las filas del 0 al 45 %, con el h1 sobre el cielo y las torres blancas debajo (el cartel queda afuera).
    // posicion: más allá de 1440 la foto se recorta arriba y abajo; con el 60 % el h1 sigue sobre el cielo y abajo se ven
    // las torres. El alt es nuestro (a validar, pregunta 38 de la lista de Divulgación). La destraba la M1.
    imagen: fotoDeHero(
      [heroElMuseo960, heroElMuseo1440, heroElMuseo1920, heroElMuseo2880],
      '50% 60%',
      'Las torres curvas y blancas del frente del museo contra el cielo azul',
    ),
  },
  // "El MuPa" (Figma 2825:123).
  presentacion: {
    rotulo: 'El Museo Paleontológico', // del tablero; las mayúsculas, por CSS
    titulo: 'El MuPa',
    // De la nota (a validar: pregunta 17 de la lista de Divulgación).
    parrafos: [
      'El Museo Paleontológico de San Juan (MuPa) es una institución dedicada a la divulgación científica y ' +
        'educativa, así como a la preservación del patrimonio paleontológico y cultural de la provincia.',
      'El MuPa es administrado por el Ministerio de Turismo, Cultura y Deporte del Gobierno de San Juan en ' +
        'coparticipación con la Universidad Nacional de San Juan (UNSJ).',
    ],
    // La foto del tablero (museo-imagen): el patio con la cúpula (Carrusel - IMG_1605), la del Collage de la Home, en
    // 5:3 por CSS. La de la sección es la del tablero; a validar con el museo (M4).
    imagen: { ...FOTOS_CARRUSEL.patio, sizes: SIZES_MITAD, ancho: 1400, alto: 933 },
    piedritas: patronGaleria, // el mismo dibujo del tablero (2826:322), el de "El MuPa en imágenes" de la Home
  },
  // "Cómo nos organizamos" (Figma 2825:133): cada parte de la cogestión, una fila (IN3).
  cogestion: {
    rotulo: 'Cogestión', // de la nota ("COGESTIÓN"); las mayúsculas, por CSS
    titulo: 'Cómo nos organizamos',
    piedritas: patronB, // las del cierre de Identidad de la landing (3123:18997), con su desvanecido (patron-b)
    // De la nota (a validar: la 18 de la lista de Divulgación; "Co-gestión" y "Cogestión", M2). Los logos, los del pie
    // y del cierre de Identidad (identidad.instituciones), al tamaño del tablero.
    partes: [
      {
        rotulo: 'Co-gestión académica',
        institucion: { nombre: 'Universidad Nacional de San Juan', logo: logoUnsj, ancho: 205, alto: 94.4 },
        intro: 'La UNSJ aporta el respaldo científico del museo:',
        items: [
          'Investigación científica',
          'Expediciones',
          'Preparación de fósiles en laboratorio',
          'Formación en geología y paleontología',
          'Publicaciones y divulgación',
        ],
      },
      {
        rotulo: 'Gestión provincial',
        institucion: { nombre: 'Gobierno de San Juan', logo: logoGobierno, ancho: 253.5, alto: 73.06 },
        intro: 'El Ministerio de Turismo, Cultura y Deporte del Gobierno de la provincia garantiza:',
        // En la nota, en minúscula; el tablero, con mayúscula inicial.
        items: [
          'Infraestructura y mantenimiento del edificio',
          'Acceso público, programas y talleres de gratuidad',
          'Interacción con circuitos turísticos',
          'Comunicación y difusión provincial',
        ],
      },
    ],
  },
  // "Misión y visión" con "Valores" (Figma 2825:177). Los textos de la nota, distintos de los del V03 que publica la
  // landing (identidad.ejes): cuál es el oficial lo pregunta la 16 de la lista de Divulgación ("socio-ambiental": M2).
  mision: {
    titulo: 'Misión y visión',
    items: [
      {
        rotulo: 'Misión',
        texto:
          'Inspirar vocaciones científicas y técnicas en las infancias y juventudes de San Juan, promoviendo el ' +
          'pensamiento crítico y el deseo de comprender el pasado para planificar el futuro, desde una mirada ' +
          'socio-ambiental e inclusiva.',
      },
      {
        rotulo: 'Visión',
        texto: 'Consolidarnos como un referente a nivel nacional e internacional en materia científica y tecnológica.',
      },
    ],
    // Los valores, como píldoras: una lista, no controles (IN2). De la nota (la 19 de la lista de Divulgación).
    valores: {
      titulo: 'Valores',
      lista: [
        'Preservación de la memoria',
        'Veracidad científica',
        'Innovación',
        'Vocación comunitaria',
        'Accesibilidad',
        'Compromiso socioambiental',
        'Vocación pedagógica',
      ],
    },
  },
  // "Haciendo el MuPa" (Figma 2825:203): cada documental, una fila (IN3).
  documentales: {
    rotulo: 'Documentales', // la "Volanta" de la nota
    titulo: 'Haciendo el MuPa',
    bajada: 'Conocé quiénes forman parte del MuPa', // de la nota (rara para documentales: la 20 de Divulgación)
    etiqueta: 'Documental', // "Documental · 1": del tablero (el número, el orden en la lista)
    // RELLENO DEL TABLERO: los tres títulos, "[Título pendiente]" y las fotos (las del Collage de la Home, no cuadros de
    // los documentales); la nota dice solo "*Carrusel de documentales*". Sin enlace (url: null): no se reproducen ni
    // llevan a ningún lado (IN2); con url, el título de la tarjeta pasa a ser el enlace (ElMuseo.jsx). Los destraban la
    // 20 de la lista de Divulgación (si existen, sus títulos y su enlace) y, las fotos, la M4.
    lista: [
      {
        titulo: 'El MuPa por dentro',
        subtitulo: '[Título pendiente]',
        url: null,
        imagen: { ...FOTOS_CARRUSEL.restaurador, sizes: SIZES_TERCIO, ancho: 1400, alto: 933 },
      },
      {
        titulo: 'Detrás de la ciencia',
        subtitulo: '[Título pendiente]',
        url: null,
        imagen: { ...FOTOS_CARRUSEL.dremel, sizes: SIZES_TERCIO, ancho: 1400, alto: 933 },
      },
      {
        titulo: 'Fósiles y personas',
        subtitulo: '[Título pendiente]',
        url: null,
        imagen: { ...FOTOS_CARRUSEL.pincel, sizes: SIZES_TERCIO, ancho: 1400, alto: 933 },
      },
    ],
  },
  // "El MuPa en números" (Figma 2825:242): cada cifra, una fila (IN3).
  numeros: {
    titulo: 'El MuPa en números',
    // Las etiquetas son las de la nota ("Áreas de extensión" en el tablero: errata, la nota dice "Área de extensión";
    // "Dispositivos Interactivos" en la nota, en minúscula como el tablero).
    // RELLENO DEL TABLERO: las cifras. El tablero dice "200" en las cuatro; va "[—]" (decisiones IN1 y R-F: un número de
    // ejemplo se leería como un dato del museo). Las destraba la 21 de la lista de Divulgación.
    cifras: [
      { cifra: '[—]', rotulo: 'Área de extensión' },
      { cifra: '[—]', rotulo: 'Piezas fósiles' },
      { cifra: '[—]', rotulo: 'Dispositivos interactivos' },
      { cifra: '[—]', rotulo: 'Científicos e investigadores' },
    ],
  },
  // "Autoridades" (Figma 2825:257): cada persona, una fila (IN3).
  autoridades: {
    rotulo: 'Liderazgo', // del tablero
    titulo: 'Autoridades',
    // Los nombres, los cargos y las biografías son los de la nota (a validar: la 22 de la lista de Divulgación; los
    // nombres científicos sin cursiva, M3).
    // RELLENO DEL TABLERO: los retratos (foto: null, IN5): el del tablero de Alcober es el mismo archivo que los cuatro
    // del equipo y el de Martínez no se sabe que sea él; va el recuadro neutro (bg-caja) hasta que lleguen las fotos
    // oficiales, con permiso (la 22).
    personas: [
      {
        cargo: 'Director',
        nombre: 'Oscar Alcober',
        bio:
          'Paleontólogo. Lideró decenas de expediciones a Ischigualasto. Taytalura alcoberi, el ancestro común de ' +
          'todos los lagartos actuales, lleva su nombre en homenaje a él. Realizó una extensa investigación sobre la ' +
          'historia de Ischigualasto. En 2024, descubrió el yacimiento paleontológico Parque de las Huellas, ubicado ' +
          'en el departamento de Iglesia, San Juan.',
        foto: null,
      },
      {
        cargo: 'Director científico', // "Director Científico" en el tablero; la nota, así
        nombre: 'Ricardo Martínez',
        // La del tablero (la nota dice "Además, Martínez ha descubierto…").
        bio:
          'Paleontólogo. Descubrió 3500 fósiles y 40 especies. Entre ellas, varios de los dinosaurios más primitivos, ' +
          'como Eoraptor, Eodromaeus, Panphagia, Sanjuansaurus, Adeopapposaurus, Lucianovenator. Además, ha ' +
          'descubierto y publicado una extensa lista de nuevas especies de distintos grupos de paleovertebrados.',
        foto: null,
      },
    ],
  },
  // "Nuestro equipo" (Figma 2825:274): cada integrante, una fila (IN3).
  equipo: {
    rotulo: 'El equipo', // del tablero
    titulo: 'Nuestro equipo',
    // De la nota (a validar: la 23 de la lista de Divulgación).
    parrafo:
      'El MuPa cuenta con un equipo multidisciplinario dedicado a construir y mantener técnica, científica y ' +
      'conceptualmente el museo.',
    // RELLENO DEL TABLERO: los cuatro integrantes ("[Nombre del integrante]", "[Rol]"; la nota dice "F F F F") y sin
    // foto (IN5: el tablero repite el mismo retrato en los cuatro). Los destraba la 23 de la lista de Divulgación
    // (quiénes son, su rol y su foto con permiso).
    personas: [
      { nombre: '[Nombre del integrante]', rol: '[Rol]', foto: null },
      { nombre: '[Nombre del integrante]', rol: '[Rol]', foto: null },
      { nombre: '[Nombre del integrante]', rol: '[Rol]', foto: null },
      { nombre: '[Nombre del integrante]', rol: '[Rol]', foto: null },
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
  // Desde El Museo (06/11/2026) los objetos están en FOTOS_CARRUSEL, más arriba (los usa también esa página).
  collage: [
    FOTOS_CARRUSEL.lamas,
    FOTOS_CARRUSEL.dremel,
    FOTOS_CARRUSEL.restaurador,
    FOTOS_CARRUSEL.pincel,
    FOTOS_CARRUSEL.patio,
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
