// Contenido de la landing, centralizado para que los componentes no tengan texto suelto.
//
// FUENTE: texto extraído del archivo de diseño "Landing Page - V01.ai" (15/09/2026); los destacados en negrita, del
// mockup V02 (Figma, 21/09/2026). El texto de las cuatro bandas de Áreas es el contenido oficial que mandó el museo el
// 22/09/2026 ("Los 4 MuPa"), cargado tal cual salvo lo que decidió el desarrollador (ver areas.items). Las claves
// "verificar" marcan lo único que no se pudo confirmar contra el archivo.
// Destacados: lo que va entre **dobles asteriscos** sale en negrita (componente TextoDestacado).
//
// FOTOS: las del Figma del diseñador (hero, collage de Identidad, mosaico de Obra, render del primer eje) y, donde el
// diseño todavía no tiene, la selección del Drive del museo ("Seleccion Fotográfica"). Todas en WebP; los originales no
// se versionan. Ver src/assets/README.md.

import logoMarca from './assets/logo-mupa-marca.svg'
import logoTexto from './assets/logo-mupa-texto.svg'
import hero768 from './assets/hero-fachada-768.webp'
import hero1280 from './assets/hero-fachada-1280.webp'
import hero1920 from './assets/hero-fachada-1920.webp'
import hero2560 from './assets/hero-fachada-2560.webp'
import renderCupula800 from './assets/render-cupula-esqueletos-800.webp'
import renderCupula1400 from './assets/render-cupula-esqueletos-1400.webp'
import ejeMision500 from './assets/eje-mision-500.webp'
import ejeMision1000 from './assets/eje-mision-1000.webp'
import cartel from './assets/cartel-fachada.webp'
import preparacion from './assets/preparacion-fosil.webp'
import areaEducacion570 from './assets/area-educacion-570.webp'
import areaEducacion1140 from './assets/area-educacion-1140.webp'
import areaProduccion570 from './assets/area-produccion-570.webp'
import areaProduccion1140 from './assets/area-produccion-1140.webp'
import areaFormalab570 from './assets/area-formalab-570.webp'
import areaFormalab1140 from './assets/area-formalab-1140.webp'
import collageEsqueleto500 from './assets/collage-esqueleto-hall-500.webp'
import collageEsqueleto1000 from './assets/collage-esqueleto-hall-1000.webp'
import collageRestaurador500 from './assets/collage-restaurador-500.webp'
import collageRestaurador1000 from './assets/collage-restaurador-1000.webp'
import collageFachada500 from './assets/collage-fachada-cartel-500.webp'
import collageFachada1000 from './assets/collage-fachada-cartel-1000.webp'
import collageRender500 from './assets/collage-render-hall-500.webp'
import collageRender1000 from './assets/collage-render-hall-1000.webp'
import collageExterior500 from './assets/collage-exterior-cupula-500.webp'
import collageExterior1000 from './assets/collage-exterior-cupula-1000.webp'
import obraRestauracion500 from './assets/obra-restauracion-500.webp'
import obraRestauracion1000 from './assets/obra-restauracion-1000.webp'
import obraCarnivoro600 from './assets/obra-carnivoro-hall-600.webp'
import obraCarnivoro1200 from './assets/obra-carnivoro-hall-1200.webp'
import obraFachada500 from './assets/obra-fachada-500.webp'
import obraFachada1000 from './assets/obra-fachada-1000.webp'
import obraMontaje500 from './assets/obra-montaje-sala-500.webp'
import obraMontaje1000 from './assets/obra-montaje-sala-1000.webp'
import obraPreparacion352 from './assets/obra-preparacion-352.webp'
import obraPreparacion704 from './assets/obra-preparacion-704.webp'
import logoGobierno from './assets/logo-gobierno-san-juan.svg'
import logoUnsj from './assets/logo-unsj.svg'

// srcSet de las fotos con versión de 500 y de 1000 px.
const doble = (chica, grande) => `${chica} 500w, ${grande} 1000w`

export const site = {
  nombre: 'MuPa',
  nombreCompleto: 'Museo Paleontológico',
  lugar: 'San Juan · Argentina',
  // Logo del Figma en dos SVG blancos: la marca MuPa y el texto "Museo Paleontológico / San Juan · Argentina".
  logo: { marca: logoMarca, texto: logoTexto, textoAlt: 'Museo Paleontológico, San Juan, Argentina' },
}

export const ui = {
  pendiente: 'Contenido pendiente',
  irAlContenido: 'Ir al contenido',
  instituciones: 'Instituciones',
  portada: 'Portada',
}

export const hero = {
  // La foto del Figma (IMG_1524), con su mismo recorte.
  imagen: {
    src: hero1920,
    srcSet: `${hero768} 768w, ${hero1280} 1280w, ${hero1920} 1920w, ${hero2560} 2560w`,
    sizes: '100vw',
    alt: 'Fachada del Museo Paleontológico de San Juan, con el cartel "MuPa Museo Paleontológico" sobre la entrada',
  },
}

export const intro = {
  // Respaldo si faltara 'titular': la frase completa, no el estado estático del mockup.
  titulo: 'un museo de sanjuaninos, hecho por sanjuaninos y para sanjuaninos',
  // Titular con parallax: las líneas fijas van en la columna izquierda y la palabra móvil baja de fila en fila con el scroll.
  // 'lectura' es lo que oyen los lectores de pantalla.
  titular: {
    fijas: ['un museo de', 'hecho por', 'y para'],
    movil: 'sanjuaninos',
    lectura: 'un museo de sanjuaninos, hecho por sanjuaninos y para sanjuaninos',
  },
  parrafo:
    'A través de una narrativa inmersiva y tecnológica, nos proponemos **inspirar vocaciones** en nuestras infancias, ' +
    '**conectar a la comunidad** con sus orígenes biológicos y geológicos, **y posicionar a San Juan** como el faro ' +
    'paleontológico más importante de la región de Cuyo y un referente internacional indiscutido, preparado para ' +
    'insertarse en circuitos científicos globales y ser el orgulloso anfitrión de eventos de máxima jerarquía.',
  // El bloque destacado (imagen en el .ai, video en el Figma) se descartó: el museo decidió no usar esa sección (21/09/2026).
}

export const identidad = {
  titulo: 'Identidad Institucional',
  // Un panel por eje, que se desliza con el scroll (Figma 18/09/2026, frame "Institucional": solo está diseñado el
  // primero). La relación etiqueta -> texto se infirió por sentido y por la palabra grande de cada columna del mockup;
  // ojo: el panel del Figma pone "Eje narrativo" junto al texto de Misión y "Patrimonio" (¿texto de relleno?).
  ejesVerificar: true,
  ejes: [
    {
      etiqueta: 'Eje narrativo',
      palabra: 'Inspirar',
      texto:
        'Inspirar vocaciones científicas, técnicas, artísticas y ocupacionales en las infancias y juventudes de San Juan, ' +
        'promoviendo la curiosidad, el pensamiento crítico y el deseo de comprender el pasado para transformar el futuro, ' +
        'desde una mirada socio-ambiental e inclusiva.',
      // La foto del panel diseñado (render nuevo), con el recorte del Figma: se ve la parte derecha.
      foto: {
        src: renderCupula1400,
        srcSet: `${renderCupula800} 800w, ${renderCupula1400} 1400w`,
        alt: 'Render del hall central bajo la cúpula, con el esqueleto de un dinosaurio de cuello largo y el de un carnívoro',
        encuadre: 'object-right',
      },
    },
    {
      etiqueta: 'Visión',
      palabra: 'Referente',
      texto:
        'Consolidarse como el museo paleontológico más importante de Cuyo y un referente imprescindible en todo el ' +
        'territorio nacional e internacional.',
      // Sin diseño todavía: foto de la selección del museo, a confirmar.
      foto: { src: cartel, alt: 'Cartel "Museo Paleontológico" sobre la fachada curva del edificio', encuadre: 'object-center' },
    },
    {
      etiqueta: 'Misión',
      palabra: 'Patrimonio',
      texto:
        'La institución está dedicada en exclusividad a la divulgación, educación y preservación del patrimonio del ' +
        'Período Triásico, principalmente proveniente del Parque Provincial Ischigualasto (Patrimonio de la Humanidad por la UNESCO).',
      // Foto que mandó el museo el 22/09/2026 (el panel de Misión todavía no tiene diseño).
      foto: {
        src: ejeMision1000,
        srcSet: `${ejeMision500} 500w, ${ejeMision1000} 1000w`,
        alt: 'Técnico del museo trabajando con una herramienta sobre un fósil, visto entre los huesos de un esqueleto',
        encuadre: 'object-center',
      },
    },
  ],
  // Collage del Figma después de los paneles, en orden de capas: la primera va al fondo y la última adelante.
  collage: [
    {
      src: collageExterior1000,
      srcSet: doble(collageExterior500, collageExterior1000),
      alt: 'Patio exterior del museo, con el edificio de la cúpula vidriada',
    },
    {
      src: collageRender1000,
      srcSet: doble(collageRender500, collageRender1000),
      alt: 'Render del hall circular del museo, con un gran esqueleto suspendido en el centro',
    },
    {
      src: collageRestaurador1000,
      srcSet: doble(collageRestaurador500, collageRestaurador1000),
      alt: 'Restaurador trabajando con pincel sobre un esqueleto fósil',
    },
    {
      src: collageFachada1000,
      srcSet: doble(collageFachada500, collageFachada1000),
      alt: 'Fachada del museo con el cartel "MuPa Museo Paleontológico" contra el cielo',
    },
    {
      src: collageEsqueleto1000,
      srcSet: doble(collageEsqueleto500, collageEsqueleto1000),
      alt: 'Esqueleto montado de un animal del Triásico de pico grande en el hall del museo, con el de un dinosaurio detrás',
    },
  ],
  parrafo:
    'El MuPa nace como una institución moderna, fruto de la co-gestión y coparticipación estratégica entre el ' +
    'Gobierno de la Provincia de San Juan, la Universidad Nacional de San Juan (UNSJ) y Fiduciaria San Juan. ' +
    'Esta alianza estratégica no solo garantiza la validación científica y académica de nuestro patrimonio, sino que ' +
    'también **consolida un modelo de gestión pública transparente, eficiente y profundamente comprometido con el futuro regional.**',
  // Logos del Figma (SVG blancos): ancho y alto con que van en el diseño a 1440 (el alto reserva su lugar al cargar).
  // Primero la Universidad y después Gobierno (pedido del desarrollador el 22/09/2026; el Figma los tiene al revés). El
  // footer usa la misma lista.
  instituciones: [
    { nombre: 'Universidad Nacional de San Juan', logo: logoUnsj, ancho: 212, alto: 96.8 },
    { nombre: 'Gobierno de San Juan', logo: logoGobierno, ancho: 287, alto: 82.71 },
  ],
}

export const obra = {
  titulo: 'Gestión de una obra histórica',
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
  // Mosaico del Figma (capas "06" a "10"), en ese orden.
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
      src: obraPreparacion704,
      srcSet: `${obraPreparacion352} 352w, ${obraPreparacion704} 704w`,
      alt: 'Manos de un preparador limpiando un fósil con un pincel fino',
    },
  ],
}

export const areas = {
  // Dos párrafos, como en el mockup V02.
  parrafos: [
    'El MuPa no funciona como una sola pieza, sino como **un sistema de cuatro áreas que se retroalimentan.**',
    'Pensar al museo en estos cuatro ejes permite entenderlo como una institución que produce conocimiento ' +
      '(Ciencia), lo lleva a las aulas de toda la provincia (Educación), lo convierte en experiencia cultural y ' +
      'artística (Producción) y cuenta con un equipo propio capaz de sostener y proyectar todo esto en el tiempo (Forma Lab).',
  ],
  // El título sigue en 'remate', la parte de la oración que aparece al llegar con el scroll (nota del diseño en el V02).
  // \n = corte de línea del diseño.
  titulo: 'Cuatro formas distintas\nde hacer una misma cosa:',
  remate: 'que el MuPa nunca\ndeje de moverse',
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
      // El V02 trae otra foto (un paleontólogo en el campo), solo en baja resolución: pendiente pedir el original.
      foto: { src: preparacion, alt: 'Paleontólogo limpiando un fósil con pincel en el laboratorio' },
    },
    {
      id: 'educacion',
      nombre: 'Educación',
      color: 'educacion',
      parrafos: [
        'Si MuPa Ciencia genera conocimiento, MuPa Educación lo transforma en experiencia pedagógica y lo lleva a cada ' +
          'rincón de la provincia. Es el puente entre el museo y la escuela, la instancia que garantiza que ninguna ' +
          'infancia y adolescencia sanjuanina se quede afuera, sin importar cuán lejos esté su colegio de la ciudad de ' +
          'San Juan.',
        '**Integración curricular:** el objetivo es que la visita al MuPa deje de ser un paseo aislado y pase a formar ' +
          'parte de la currícula escolar, en todos los niveles, con los estudiantes de cuarto grado como público ' +
          'prioritario.',
        '**Pre y post MuPa:** el programa se completa con talleres, material didáctico y capacitaciones para docentes, ' +
          'que se convierten en multiplicadores del contenido científico del museo durante todo el año.',
      ],
      lema: '',
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
        'Es la unidad productiva del MuPa. Su función es transformar ideas y contenidos en proyectos posibles, ' +
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
      lema: '',
      foto: {
        src: areaProduccion1140,
        srcSet: `${areaProduccion570} 570w, ${areaProduccion1140} 1140w`,
        alt: 'Integrante del equipo del museo trabajando sobre la réplica de un dinosaurio en el taller, con andamios de fondo',
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
        'Esto garantiza la sostenibilidad del museo, la generación de empleo especializado y enriquece la matriz ' +
          'productiva de San Juan en la integración de ciencia y creatividad con tecnología única en el país.',
      ],
      lema: 'El corazón productivo',
      foto: {
        src: areaFormalab1140,
        srcSet: `${areaFormalab570} 570w, ${areaFormalab1140} 1140w`,
        alt: 'Taller de Forma Lab: dos técnicos junto a una fresadora CNC que talla un bloque de telgopor',
      },
    },
  ],
}

export const footer = {
  instituciones: identidad.instituciones,
  legal: '© Museo Paleontológico de San Juan',
}
