// Contenido de la landing, centralizado para que los componentes no tengan texto suelto.
//
// FUENTE: texto extraído del archivo de diseño "Landing Page - V01.ai" (15/09/2026).
// Educación, Espectáculo y Forma Lab no tienen texto en el mockup: quedan vacíos hasta que el museo los defina.
// Las claves "verificar" marcan lo único que no se pudo confirmar contra el archivo.
//
// FOTOS: selección del Drive del museo ("Seleccion Fotográfica"), convertidas a WebP al tamaño en que se muestran.
// Los originales (JPEG de 3 a 11 MB) no se versionan; ver la nota en src/assets/README.md.

import fachada1920 from './assets/fachada-mupa-1920.webp'
import fachada1280 from './assets/fachada-mupa-1280.webp'
import fachada768 from './assets/fachada-mupa-768.webp'
import hallCentral from './assets/hall-central-render.webp'
import cupula from './assets/cupula-render.webp'
import craneo from './assets/craneo-dinosaurio.webp'
import cartel from './assets/cartel-fachada.webp'
import montaje from './assets/montaje-sala.webp'
import restauracion from './assets/restauracion-detalle.webp'
import dinoTecnicos from './assets/dinosaurio-tecnicos.webp'
import esqueletoSala from './assets/esqueleto-sala.webp'
import preparacion from './assets/preparacion-fosil.webp'
import restauradora from './assets/restauradora.webp'

export const site = {
  nombre: 'MuPa',
  nombreCompleto: 'Museo Paleontológico',
  lugar: 'San Juan · Argentina',
}

export const ui = {
  pendiente: 'Contenido pendiente',
  irAlContenido: 'Ir al contenido',
  instituciones: 'Instituciones',
  portada: 'Portada',
}

export const hero = {
  imagen: {
    src: fachada1920,
    srcSet: `${fachada768} 768w, ${fachada1280} 1280w, ${fachada1920} 1920w`,
    sizes: '100vw',
    alt: 'Fachada del edificio del Museo Paleontológico de San Juan',
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
    'A través de una narrativa inmersiva y tecnológica, nos proponemos inspirar vocaciones en nuestras infancias, ' +
    'conectar a la comunidad con sus orígenes biológicos y geológicos, y posicionar a San Juan como el faro ' +
    'paleontológico más importante de la región de Cuyo y un referente internacional indiscutido, preparado para ' +
    'insertarse en circuitos científicos globales y ser el orgulloso anfitrión de eventos de máxima jerarquía.',
  // El mockup deja abierto si este bloque es imagen o video. Por ahora, imagen.
  destacado: { src: hallCentral, alt: 'Render del hall central del museo, con un esqueleto montado bajo la cúpula' },
}

export const identidad = {
  titulo: 'Identidad Institucional',
  // Tres columnas del mockup. La relación etiqueta -> texto se infirió por sentido y por la palabra grande de cada columna.
  ejesVerificar: true,
  ejes: [
    {
      etiqueta: 'Eje narrativo',
      palabra: 'Inspirar',
      texto:
        'Inspirar vocaciones científicas, técnicas, artísticas y ocupacionales en las infancias y juventudes de San Juan, ' +
        'promoviendo la curiosidad, el pensamiento crítico y el deseo de comprender el pasado para transformar el futuro, ' +
        'desde una mirada socio-ambiental e inclusiva.',
    },
    {
      etiqueta: 'Visión',
      palabra: 'Referente',
      texto:
        'Consolidarse como el museo paleontológico más importante de Cuyo y un referente imprescindible en todo el ' +
        'territorio nacional e internacional.',
    },
    {
      etiqueta: 'Misión',
      palabra: 'Patrimonio',
      texto:
        'La institución está dedicada en exclusividad a la divulgación, educación y preservación del patrimonio del ' +
        'Período Triásico, principalmente proveniente del Parque Provincial Ischigualasto (Patrimonio de la Humanidad por la UNESCO).',
    },
  ],
  parrafo:
    'El MuPa nace como una institución moderna, fruto de la co-gestión y coparticipación estratégica entre el ' +
    'Gobierno de la Provincia de San Juan, la Universidad Nacional de San Juan (UNSJ) y Fiduciaria San Juan. ' +
    'Esta alianza estratégica no solo garantiza la validación científica y académica de nuestro patrimonio, sino que ' +
    'también consolida un modelo de gestión pública transparente, eficiente y profundamente comprometido con el futuro regional.',
  fotos: [
    { src: cupula, alt: 'Render de la cúpula del hall central, con un dinosaurio de gran porte visto desde abajo' },
    { src: craneo, alt: 'Cráneo de un dinosaurio carnívoro montado en una sala del museo' },
    { src: cartel, alt: 'Cartel "Museo Paleontológico" sobre la fachada curva del edificio' },
  ],
  instituciones: [
    { nombre: 'Gobierno de San Juan', logo: null },
    { nombre: 'Universidad Nacional de San Juan', logo: null },
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
  fotos: [
    { src: montaje, alt: 'Equipo de montaje trabajando en una sala, con un esqueleto de dinosaurio detrás' },
    { src: restauracion, alt: 'Restaurador trabajando entre los huesos de un esqueleto montado' },
    { src: dinoTecnicos, alt: 'Esqueleto de dinosaurio carnívoro en montaje, con técnicos detrás' },
    { src: esqueletoSala, alt: 'Esqueleto de dinosaurio sobre su base, en una sala con ventanales' },
  ],
}

export const areas = {
  parrafo:
    'El MuPa no funciona como una sola pieza, sino como un sistema de cuatro áreas que se retroalimentan. ' +
    'Pensar al museo en estos cuatro ejes permite entenderlo como una institución que produce conocimiento ' +
    '(Ciencia), lo lleva a las aulas de toda la provincia (Educación), lo convierte en experiencia cultural y ' +
    'artística (Espectáculos) y cuenta con un equipo propio capaz de sostener y proyectar todo esto en el tiempo (Forma Lab).',
  titulo: 'Cuatro formas distintas de hacer una misma cosa:',
  items: [
    {
      id: 'ciencia',
      nombre: 'Ciencia',
      color: 'ciencia',
      parrafos: [
        'MuPa Ciencia es el corazón vivo de la institución: el área que sostiene, actualiza y proyecta el contenido ' +
          'del museo en el tiempo. Si el edificio es la casa, MuPa Ciencia es lo que la mantiene habitada, investigación ' +
          'permanente, actualización de los guiones curatoriales y vínculo activo con la comunidad científica que estudia ' +
          'el patrimonio de la provincia.',
        'Ciencia como sustento institucional: este pilar es también el que le da continuidad al proyecto. Cada nuevo ' +
          'hallazgo, cada línea de investigación que se suma, es contenido fresco para el museo y motivo para que el ' +
          'público vuelva.',
      ],
      lema: 'Apostar a la ciencia como motor de la educación y la cultura',
      foto: { src: preparacion, alt: 'Paleontólogo limpiando un fósil con pincel en el laboratorio' },
    },
    // Texto pendiente en el mockup; la foto se asignó por afinidad con "inspirar vocaciones". Sacarla si no corresponde.
    {
      id: 'educacion',
      nombre: 'Educación',
      color: 'educacion',
      parrafos: [],
      lema: '',
      foto: { src: restauradora, alt: 'Restauradora sonriendo mientras trabaja sobre un fósil, con un esqueleto de fondo' },
    },
    { id: 'espectaculo', nombre: 'Espectáculo', color: 'espectaculo', parrafos: [], lema: '', foto: { src: null, alt: '' } },
    { id: 'formalab', nombre: 'Forma Lab', color: 'formalab', parrafos: [], lema: '', foto: { src: null, alt: '' } },
  ],
}

export const footer = {
  instituciones: identidad.instituciones,
  legal: '© Museo Paleontológico de San Juan',
}
