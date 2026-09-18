// Comprueba sin navegador la matemática del titular (src/hooks/useParallaxPalabra.js): los umbrales con histéresis de
// filaDestino, la curva del easing y la duración y el arranque de cada viaje. Un error de un dígito ahí no rompe nada
// visible con rueda (cada viaje termina igual en su fila) y solo aparece como un tirón al interrumpir un viaje con
// trackpad o touch, que nadie vuelve a probar a mano.
// Uso: node tools/parallax-check.mjs   (sale con código 1 si algo falla)
import { curva, easing, filaDestino, parametrosViaje, pendiente } from '../src/hooks/useParallaxPalabra.js';

const fallas = [];
const check = (ok, mensaje) => { if (!ok) fallas.push(mensaje); };
const cerca = (a, b, tolerancia) => Math.abs(a - b) <= tolerancia;

// Umbrales con tramos = 2 (p = f / 2): bajando cambia en f = 0,6 y 1,6; subiendo, en 1,4 y 0,4; sin fila previa redondea.
const casos = [
  [0.29, 0, 0], [0.31, 0, 1], [0.79, 1, 1], [0.81, 1, 2], // bajando
  [0.71, 2, 2], [0.69, 2, 1], [0.21, 1, 1], [0.19, 1, 0], // subiendo
  [0.3, -1, 1], [0.24, -1, 0], [0.76, -1, 2], // sin fila previa
  [-0.5, 0, 0], [1.5, 2, 2], // p fuera de 0..1 se recorta
];
for (const [p, actual, esperada] of casos) {
  const fila = filaDestino(p, 2, actual);
  check(fila === esperada, `filaDestino(${p}, 2, ${actual}) = ${fila}, esperaba ${esperada}`);
}
// Temblor dentro de la banda de histéresis: no cambia de fila.
for (let k = 20; k <= 30; k++) check(filaDestino(k / 100, 2, 0) === 0, `titileo en p = ${k / 100}`);

const N = 1000;
for (let i = 0; i <= N; i++) {
  const t = i / N;
  // Con x1 = 1/3 y x2 = 2/3 el tiempo es lineal en el parámetro de la Bézier: x(t) = t (por eso curva/pendiente
  // pueden evaluarse directo, sin invertir x).
  const x = 3 * (1 - t) * (1 - t) * t * (1 / 3) + 3 * (1 - t) * t * t * (2 / 3) + t * t * t;
  check(cerca(x, t, 1e-12), `x(${t}) = ${x}, no es lineal`);
  check(cerca(curva(0, t), 3 * t * t - 2 * t * t * t, 1e-12), `curva(0, ${t}) no es smoothstep`);
  for (let k = 0; k <= 20; k++) {
    const a = k / 20;
    const y = curva(a, t);
    check(y >= -1e-12 && y <= 1 + 1e-12, `curva(${a}, ${t}) = ${y}, fuera de [0, 1]`);
    check(pendiente(a, t) >= -1e-9, `curva(${a}, ${t}) retrocede`);
    const h = 1e-5, t0 = Math.max(t - h, 0), t1 = Math.min(t + h, 1);
    const derivada = (curva(a, t1) - curva(a, t0)) / (t1 - t0);
    check(cerca(pendiente(a, t), derivada, 1e-4), `pendiente(${a}, ${t}) = ${pendiente(a, t)}, derivada numérica ${derivada}`);
  }
}
for (let k = 0; k <= 20; k++) {
  const a = k / 20;
  check(cerca(curva(a, 0), 0, 1e-12) && cerca(curva(a, 1), 1, 1e-12), `curva(${a}) no va de 0 a 1`);
}

// El easing que recibe el navegador tiene que ser la misma Bézier que curva/pendiente: x1 = 1/3, x2 = 2/3, y2 = 1.
const [x1, y1, x2, y2] = /cubic-bezier\(([^)]*)\)/.exec(easing(0.5))?.[1].split(',').map(Number) ?? [];
check(cerca(x1, 1 / 3, 1e-9) && cerca(x2, 2 / 3, 1e-9) && y1 === 0.5 && y2 === 1, `easing(0.5) = ${easing(0.5)}`);

// Duración: una fila es la base; dos filas, raíz de 2; los viajes muy cortos o muy largos quedan en 0,4 y 1,5.
const paso = 68;
const base = parametrosViaje(paso, 0, paso).dur;
check(cerca(parametrosViaje(2 * paso, 0, paso).dur / base, Math.SQRT2, 1e-9), 'dos filas no tardan raíz de 2');
check(cerca(parametrosViaje(-paso, 0, paso).dur, base, 1e-9), 'subir no tarda lo mismo que bajar');
check(cerca(parametrosViaje(5, 0, paso).dur / base, 0.4, 1e-9), 'viaje de 5 px sin piso 0,4');
check(cerca(parametrosViaje(10 * paso, 0, paso).dur / base, 1.5, 1e-9), 'viaje largo sin techo 1,5');
// Arranque: a = vel·dur / (3·d), así la velocidad inicial de la curva (3·a·d/dur) es la que traía la palabra.
for (const d of [paso, -paso, 2 * paso]) {
  const { dur } = parametrosViaje(d, 0, paso);
  const vel = (0.5 * 3 * d) / dur;
  check(parametrosViaje(d, vel, paso).a === 0.5, `a no empalma la velocidad (d = ${d})`);
}
// Nunca fuera de [0, 1]: si viene en contra, arranca de cero; si viene más rápido, no se pasa de la fila.
check(parametrosViaje(paso, -0.3, paso).a === 0 && parametrosViaje(-paso, 0.3, paso).a === 0, 'a < 0 al invertir');
check(parametrosViaje(paso, 5, paso).a === 1 && parametrosViaje(-paso, -5, paso).a === 1, 'a > 1 con velocidad alta');

if (fallas.length) {
  console.error(`parallax-check: ${fallas.length} fallas\n${fallas.slice(0, 10).join('\n')}`);
  process.exit(1);
}
console.log('parallax-check: OK');
