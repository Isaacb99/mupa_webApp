// Lo que los dos Vite de npm run dev (server/dev.js) nunca sirven: la lista que Vite trae por defecto (8.3.7; dar
// `server.fs.deny` la reemplaza, así que va entera) más los MP3 y el manifiesto de la audioguía, que en producción salen
// solo con el permiso del QR (server/audioguia/rutas.js; especificación de las audioguías, 2.2). Va en su propio archivo
// para que audioguia.test.js la compare con la que trae la versión de Vite instalada sin levantar dev.js: si Vite suma
// algo a su lista, la prueba falla. La de la audioguía va con **/ adelante: Vite compara los patrones con barra contra
// la ruta absoluta del archivo, y «audioguias/**» solo no la tapaba (lo mostró la prueba).
export const DENEGADOS_EN_DESARROLLO = [
  '.env',
  '.env.*',
  '*.{crt,pem,key,p12,pfx,cer,der}',
  '.npmrc',
  '.yarnrc.yml',
  '**/.git/**',
  '**/audioguias/**',
]
