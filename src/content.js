// Contenido de la landing, centralizado para que los componentes no tengan texto suelto.
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
import logoTexto from './assets/logo-mupa-texto.svg'
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

// srcSet de las fotos del carrusel, con versión de 700 y de 1400 px.
const doble = (chica, grande) => `${chica} 700w, ${grande} 1400w`

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

// Página 404 (src/paginas/NoEncontrada.jsx, E0.4): textos de interfaz, no del museo. Con E4.1 suma los enlaces a las
// secciones del menú.
export const noEncontrada = {
  titulo: 'No encontramos esta página',
  texto: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
  volver: 'Volver al inicio',
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

export const footer = {
  instituciones: identidad.instituciones,
  legal: '© Museo Paleontológico de San Juan',
}
