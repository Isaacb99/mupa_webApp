# Plan de implementación: panel de administración y sitio institucional del MuPa

**Fecha:** versión 3, 08/10/2026 (panel en `https://mupa.ar/administracion`; los cambios en hPanel de Hostinger los hace una persona del museo)
**Estado:** plan aprobado por el desarrollador: pendiente.
**Repo:** `C:\Users\badia\OneDrive\Escritorio\isaac\MUPA\SITIO WEB\mupa-web` (`github.com/Isaacb99/mupa_webApp`, rama `master`). Este archivo va en `docs/plan-panel-admin.md`.

## Resumen

1. **Arquitectura:** un solo servicio Node (Express 5 + React 19 con SSR) en Render y un solo host. `mupa.ar` es el sitio público y el panel, con su API, va en `https://mupa.ar/administracion`, sin scripts de terceros. Compartir el origen con UserWay y GA4 deja un riesgo acotado, aceptado por el desarrollador (9).
2. **Páginas públicas:** se renderizan en cada pedido, sin caché de HTML. Lo que se guarda en el panel se ve en el pedido siguiente.
3. **Base de datos:** Render Postgres 17 Basic 256 MB (`0.1c-256mb`), 1 GB, región Virginia, sin acceso externo. Sequelize 6 con migraciones de umzug.
4. **Fotos:** disco persistente, como está decidido. Hay una recomendación marcada **A RECONSIDERAR** para guardarlas en Postgres (16.1), a decidir antes de E3.1 y E5.1.
5. **Acceso:** una cuenta por persona, roles admin/editor, sesiones en Postgres con una cookie `__Secure-` limitada a `/administracion` y contraseñas con argon2id. **El panel no manda mails:** el admin da de alta a cada persona con una contraseña temporal (se muestra una sola vez y se cambia en el primer ingreso) y le da otra si la olvida. Si nadie puede entrar, hay un comando para el Shell de Render.
6. **Correo:** solo el formulario de contacto, en un sentido. Sale por SMTP desde una casilla de Hostinger del sitio (`web@mupa.ar`) hacia la dirección que elige el admin. Cada mensaje queda además guardado y se ve en el panel (Mensajes). No hay servicio de correo nuevo ni registros DNS de correo.
7. **Costo mensual:** USD 13,55 sin impuestos (13,30 con 16.1). Pagando en pesos, con IVA y percepción, son unos USD 20,50.
8. **DNS y hPanel:** la zona sigue en Hostinger y **no se toca hasta el corte**. Hasta entonces el sitio se ve en `https://mupa-web.onrender.com` (con `noindex`) y el panel en `https://mupa-web.onrender.com/administracion`, donde el museo carga su contenido. El desarrollador no tiene acceso a hPanel: lo único que pasa por ahí (crear la casilla de envío y, el día del corte, cambiar el DNS de `mupa.ar`) lo hace una persona del museo, con un instructivo y en una videollamada con el desarrollador (11). El correo no se toca.
9. **Alcance:** solo el núcleo contratado. Papelera, programación, vista previa, registro de actividad, excepciones de horario, control de ediciones simultáneas, punto focal y datos estructurados de eventos pasan a una fase 2 (12.3).
10. **Horas:** 115 h (112 con 16.1): Base 34,5, Sitio institucional 20, Panel 47 (44 con 16.1) y 13,5 de coordinación, revisiones y garantía (12.2).
11. **Plazos:** a 20 h por semana, la entrega es el 20/11/2026 como máximo. La garantía de 60 días arranca en la entrega. El cambio de DNS se hace cuando el museo confirme el contenido.
12. **Bloqueantes para S2:** medio de pago para Render, casilla institucional para las cuentas y la casilla de envío del sitio, que crea una persona del museo con acceso a hPanel. Esa misma persona hace falta el día del corte. Si el medio de pago tarda, plan B en 10.6.

**Qué cubre este plan:**
- La parte de la Base que falta: menú, estructura, SEO multipágina, servidor y puesta en producción.
- El Sitio institucional y el Panel completos.
- La base preparada para el plano (módulo 4) y la venta de entradas (módulo 5), sin implementarlos.

Todavía no hay nada implementado. Todos los archivos que se nombran son a crear o a modificar.

---

## 1. Resumen de decisiones

| Tema | Decisión | Por qué | Descartado |
|---|---|---|---|
| Forma general | **Un solo servicio Node y un solo host.** Reparte por ruta: `/administracion/*` es el panel (SPA y API); el resto es el sitio público (SSR, fotos y formulario) | Se despliega una sola cosa. La Home sigue siendo el mismo código | Dos servicios separados |
| Dirección del panel | **`https://mupa.ar/administracion`** (decisión del desarrollador, 08/10/2026). Antes del corte, `https://mupa-web.onrender.com/administracion` | No depende del DNS ni de hPanel, al que el desarrollador no tiene acceso: funciona desde el primer deploy. Más simple: un dominio, un certificado y una configuración. El riesgo de compartir origen con UserWay y GA4 está acotado y aceptado (9) | `panel.mupa.ar`: aislaba la sesión de los scripts de terceros, pero necesita un registro DNS que solo puede cargar el museo en hPanel |
| Stack | Lo que ya está instalado (React 19.3.0, Vite 8.3.0, Tailwind 4.3.3, Lenis 1.3.26) más Express **5.2.1**, Sequelize **6.37.8**, pg ^8.21.0, PostgreSQL **17** y nodemailer **10** | Es el stack que el desarrollador ya conoce. Express 5 manda los rechazos async al manejador de errores ([migración](https://expressjs.com/en/guide/migrating-5.html), 08/10/2026) | Next.js (decisión del desarrollador) |
| Páginas públicas | SSR en cada pedido con `renderToString`, **sin caché de HTML**. Multipágina con recarga completa, sin router en el cliente | Con el tráfico de un museo alcanza, y "al instante" sale sin invalidar nada. Los buscadores reciben todo y se conserva lo medido de la Home | Caché LRU de HTML (se suma si las métricas lo piden, ver 14), SPA pública, streaming con Suspense |
| Indexación y medición | Se deciden **por host**: `noindex` y GA4 apagado en todo host que no sea `mupa.ar`. Además, `/administracion/*` lleva siempre `noindex` y nunca GA4. Canonical y sitemap siempre con `https://mupa.ar/` | El día del cambio de DNS, `mupa.ar` nunca sale con `noindex` | Variables `INDEXAR` y `MEDIR` |
| Panel | SPA en `/administracion` con entrada propia de Vite (`base: '/administracion/'`), React Router 7 en **modo Data** (`createBrowserRouter` con `basename`) y sin kit de componentes | No toca el bundle público. `useBlocker` solo existe en los modos Data y Framework ([useBlocker](https://reactrouter.com/api/hooks/useBlocker), 08/10/2026) | `<BrowserRouter>` declarativo. CMS (decisión del desarrollador) |
| Base de datos | Render Postgres Basic 256 MB, **1 GB**, PG 17, Virginia, `ipAllowList: []` | Lo decidido. Virginia fue la región de menor latencia medida (172-188 ms contra 246 de Oregon) | Base gratuita (vence a los 30 días) |
| Esquema | Migraciones con **umzug 3.8.3** como `preDeployCommand`. **Nunca `sync()`** | Lleva registro de lo aplicado y aborta el deploy si una falla | `sync()` + ALTER sueltos, como en el dashboard |
| Sesión | Tabla `sesiones` y cookie `__Secure-mupa_sesion` con `Path=/administracion` (HttpOnly, Secure, SameSite=Strict) | Se puede revocar al instante. Ninguna respuesta pública pone ni recibe la cookie | JWT sin estado. Prefijo `__Host-` (exige `Path=/`: la cookie viajaría a todo el sitio) |
| Contraseñas | argon2id (`argon2` 0.45.1), de 15 a 128 caracteres | Sigue a OWASP y NIST SP 800-63B-4 | bcryptjs (corta en 72 bytes) |
| Altas y olvidos | **Contraseña temporal** que genera el servidor cuando un admin da de alta o restablece a alguien: se muestra una sola vez, vence a las 72 h y se cambia en el primer ingreso. Llave de emergencia: `npm run restablecer-admin` en el Shell de Render | Sin mails en el panel: no hace falta servicio de correo ni registros DNS | Invitación y "olvidé mi contraseña" por mail |
| CSRF | `Sec-Fetch-Site: same-origin` y, si falta, `Origin` contra los orígenes del sitio | Lo que recomienda OWASP, sin tokens | `csrf-csrf` |
| Validación | **zod 4.6.5** en el servidor y el panel, nunca en el bundle público | Una sola definición; descarta las claves de más | Validar a mano |
| Ediciones simultáneas | Gana el último guardado | Equipo chico. El aviso con control de versión (409) se suma en la fase 2 con una migración aditiva | Bloqueo optimista desde el inicio |
| Texto con formato | **TipTap 3.31.4** recortado, guardado como JSON (`jsonb`) y dibujado con `TextoRico.jsx` | Sin HTML del usuario: sin XSS y sin diferencias de hidratación | HTML sanitizado, Markdown |
| Fotos | multer 2.4.0 en memoria y sharp 0.35. WebP en 480, 960 y 1600, una maestra de 2400 y `og.jpg`. Guardadas en **disco** (decidido), detrás de `server/fotos/almacen.js` | Lo decidido. Cambiar a Postgres toca un solo módulo | Cloudinary, R2, Hostinger. **A RECONSIDERAR: Postgres (16.1)** |
| Correo | **Solo el formulario de contacto**, por SMTP con nodemailer desde una casilla de Hostinger del sitio (`web@mupa.ar`): From la casilla, Reply-To el visitante, texto plano. Cada mensaje se guarda también en `mensajes_contacto` | El SPF y el DKIM de `mupa.ar` ya autorizan a Hostinger: no se toca el DNS. Si el envío falla, el mensaje no se pierde | Resend (pensado para la ticketera, que no se contrató). From del visitante (falla SPF y DMARC). Respuesta automática |
| CSP | Fija y obligatoria desde el primer deploy, probada una vez antes del corte. Una para las páginas públicas y otra estricta, sin terceros, para `/administracion` (9) | Sin endpoint de reportes ni semana de espera | Report-only con `/api/csp` |
| Hosting | Workspace **Hobby de Render a nombre del museo desde el día 1** (casilla del museo) | Render no traspasa servicios entre workspaces ([FAQ](https://render.com/docs/faq), 08/10/2026) | Vercel y Hostinger Node (decisiones del desarrollador) |
| DNS | Zona en Hostinger, **sin cambios hasta el corte**. Ese día, una persona del museo con acceso a hPanel, con instructivo y en una llamada con el desarrollador: `A @ → 216.24.57.1`, `www` CNAME y se borra el AAAA (11) | El desarrollador no tiene acceso a hPanel. Todo lo demás se prueba antes en `mupa-web.onrender.com` | Mover los nameservers. Subdominios de prueba (`nuevo.mupa.ar`, `panel.mupa.ar`): cada uno es otro cambio en hPanel |
| Entornos | Local y producción. Antes del corte, el sitio público se ve en `mupa-web.onrender.com` con `noindex` y el panel en `mupa-web.onrender.com/administracion` | Un staging permanente cuesta unos USD 13 más por mes | Staging en Render |
| Blueprint | `render.yaml` con `autoDeployTrigger: off`. Las variables que cambian van con `sync: false`. Auto Sync en "No" | Un sync automático pisa lo editado en el dashboard ([IaC](https://render.com/docs/infrastructure-as-code), 08/10/2026) | Auto Sync activado |
| Pruebas | `node --test` contra un Postgres local real, más las recetas de `tools/` y `tools/rutas-check.mjs` después de cada deploy | Sin dependencias nuevas | Jest o Vitest |
| Repo | El mismo `mupa-web`. Se transfiere a una organización de GitHub del museo al entregar | El código se entrega y no hace falta para desplegar | Quedarse en el GitHub personal |
| Textos de la Home | Siguen en `src/content.js` | No están en el alcance y dependen del diseño | Editarlos desde el panel |

---

## 2. Arquitectura

### 2.1 Diagrama

```
Navegador (visitantes)                       Navegador (personal del museo)
   │ https://mupa.ar                              │ https://mupa.ar/administracion
   │ [antes del corte: https://mupa-web.onrender.com y https://mupa-web.onrender.com/administracion]
   ▼                                              ▼
DNS: NIC Argentina → ns1/ns2.dns-parking.com (zona en Hostinger, no se mueve; la edita una persona del museo)
   A @        → 216.24.57.1 (Render)      [hoy 212.85.9.20; cambia el día del corte y se borra el AAAA]
   CNAME www  → mupa-web.onrender.com     [hoy → mupa.ar; cambia el día del corte; Render redirige www → apex]
   MX, TXT (SPF), _dmarc, hostingermail-a._domainkey, autodiscover, autoconfig → Hostinger (NO SE TOCAN)
   │
   ▼
Render, Virginia
 ┌ Borde: TLS, HTTP→HTTPS, www→apex, caché de estáticos ("Common static files")
 ├ Servicio web "mupa-web" (Node 24, 0,5 CPU / 512 MB, UNA instancia), Express 5, un solo host, reparte por ruta:
 │   /salud (vida)  /salud/base (SELECT 1)  /fotos/* (1 año, immutable)
 │   /administracion/*  PANEL: sin scripts de terceros, CSP propia, noindex
 │     /administracion/assets/* (dist/panel)  /administracion/api/*
 │     cualquier otro GET → index.html del panel (no-store)
 │   el resto  SITIO PÚBLICO:
 │     /assets/* (dist/client)  /robots.txt  /sitemap.xml  POST /contacto
 │     SSR en cada pedido: /  /exposiciones  /exposiciones/:slug  /visitas  /novedades  /novedades/:slug  /contacto
 │   desde el corte (CANONICO=1), otro host → 301 a https://mupa.ar/ + la misma ruta
 │   Disco persistente de 1 GB en /var/data (solo si se mantiene el disco; snapshot diario, ≥ 7 días)
 │         │ red interna
 └ Postgres 17 "mupa-db" Basic 256 MB, 1 GB (PITR de 3 días en Hobby)

Servicio ──SMTP (465 SSL o 587 STARTTLS)──▶ smtp.hostinger.com, casilla web@mupa.ar ──▶ dirección de destino (la elige el admin)
Páginas públicas ──▶ GA4 (solo con host mupa.ar), UserWay, Google Maps (iframe en Contacto). El panel no carga nada de terceros
Hostinger: correo (incluida la casilla de envío) + DNS + public_html con la landing actual (respaldo para volver atrás)
```

### 2.2 Estructura del repo

```
mupa-web/
  index.html               plantilla pública: <!--head-->, <div id="root"><!--app--></div>, <!--estado-->
  vite.config.js           público: base '/'; se van renderBuiltUrl, urlDelSitio, paraBuscadores y noIndexar
  vite.panel.config.js     root 'panel', base '/administracion/', outDir '../dist/panel', caché propia
                           (node_modules/.vite-panel); sin proxy: en desarrollo va adentro de npm run dev (E2, 2.6)
  render.yaml              Blueprint (10.1)
  .node-version            24
  .env.example             variables sin valores; en .gitignore agregar "!.env.example" (hoy ".env.*" lo ignora)
  .github/dependabot.yml   alertas y PR de seguridad
  src/                     SITIO PÚBLICO
    main.jsx               lee #estado e hidrata (2.3)
    entry-server.jsx       export function render(estado)
    Raiz.jsx               elige la página por estado.pagina y la envuelve en Layout
    paginas/               Home.jsx (el App.jsx de hoy), Exposiciones.jsx, Muestra.jsx, Visitas.jsx,
                           Novedades.jsx, Novedad.jsx, Contacto.jsx, NoEncontrada.jsx
    components/            los de hoy + Layout, Menu, Foto, TextoRico, TablaHorarios, ListaTarifas, FormularioContacto
    hooks/, content.js, analitica.js (recibe el estado), index.css (@import "tailwindcss" source("."))
  panel/                   PANEL (SPA, solo cliente; se publica en /administracion)
    index.html, public/manual.pdf (sale en /administracion/manual.pdf)
    src/ main.jsx, rutas.jsx (createBrowserRouter, basename '/administracion'), api.js, sesion.jsx, panel.css
         (desde E2 también navegacion.js, reingreso.js y formato.js)
         componentes/ Campo, Listado, EstadoPublicacion, Confirmar, Aviso, EditorTexto (lazy), SubirFoto,
                      SelectorPortada, Galeria, ReingresoDialogo, ClaveTemporal (E2 sumó Marco, Encabezado, Boton,
                      Casilla, Modal, formulario.jsx, FormularioClave, UltimaEdicion y AvisoVersionNueva)
         pantallas/   Ingresar, CambiarClave, Inicio, Novedades, NovedadEditar, Exposiciones, MuestraEditar,
                      SalaEditar, Visitas, Museo, Mensajes, Usuarios, Cuenta
  compartido/              código puro, sin APIs de Node ni del DOM
    esquemas/              museo, horarios, tarifas, salas, muestras, novedades, fotos, usuarios, contacto, textoRico
                           (solo servidor y panel; desde E2, campos.js con los campos que se repiten)
    precios.js             (E2) leer y mostrar un precio en pesos, sin zod: lo usa también el sitio (E4.3)
    fechas.js              hoy en San Juan, formato con meses propios, datetime-local ↔ -03:00
    slug.js, textoRico.js (a texto plano), estados.js, panel.js (RUTA_PANEL = '/administracion')
  server/
    servidor.js            conecta, verifica la casilla de envío, escucha, tareas diarias, apagado ordenado
    app.js                 arma la app (la usan las pruebas)
    config.js              variables validadas con zod; en producción no arranca si CORREO_MODO ≠ smtp
    dev.js                 Express + Vite en middlewareMode
    hosts.js               hosts aceptados y redirección canónica (el panel se reparte por ruta, en app.js)
    ssr.js                 plantilla partida, render por pedido, último `museo` bueno
    rutas-publicas.js      tabla ruta → { pagina, params, cargar }
    seo.js                 <head>, JSON-LD, jsonEnScript(), robots, sitemap
    contacto.js            GET/POST /contacto
    correo.js              nodemailer (SMTP), modos, estado del correo
    seguridad.js           helmet, CSP pública y del panel (por ruta), CSRF, redirecciones normalizadas
    limites.js, errores.js, tareas.js, log.js
    principal.js           "¿me ejecutaron directamente?" de los comandos (import.meta.main, o la ruta real)
    auth/                  sesiones.js, claves.js (argon2 y temporales), middleware.js
    api/                   indice.js (tabla de rutas), sesion.js, cuenta.js, usuarios.js, museo.js, horarios.js,
                           tarifas.js, contenido.js (fábrica), fotos.js, mensajes.js, estado.js
    fotos/                 procesar.js, almacen.js (disco) | almacen-postgres.js (16.1), cola.js, copia.js (solo disco)
    db/                    conexion.js, migrar.js, asociaciones.js, modelos/, migraciones/, semillas/ejemplo.js
    scripts/               admin.js (crear y restablecer), probar-correo.js, restaurar-fotos.js (solo disco)
    pruebas/               ayudas.js, auth, permisos, contenido, fotos, contacto y ssr (*.test.js), archivos/
  public/                  igual que hoy (favicon.*, og.jpg, google19017c966a32aec2.html)
  tools/                   los de hoy + rutas-check.mjs; servir.mjs pasa a proxy con latencia delante de npm start
  docs/                    plan-panel-admin.md, operacion.md, manual-panel.md, migracion.md
```

**Qué se copia del dashboard** (`C:\Users\badia\OneDrive\Escritorio\isaac\MUPA\app\web-project\backend\`), solo archivos puntuales: `middleware/requireRole.js`, `src/utils/parseId.js` y `src/utils/sqlLike.js`, el patrón de transacción con `httpError` de `src/routes/dispositivos.js`, la lectura de clave oculta de `scripts/check-login.js` y, en el panel, los patrones de `AuthContext.jsx` y `ProtectedRoute`. Nada del historial ni de los `.env`.

### 2.3 Construcción y arranque

Scripts de `package.json`:

```json
{
  "dev": "node --env-file-if-exists=.env server/dev.js",
  "dev:panel": "vite --config vite.panel.config.js --port 5301",
  "dev:vite": "vite --port 5302",
  "build": "vite build --outDir dist/client && vite build --ssr src/entry-server.jsx --outDir dist/server && vite build --config vite.panel.config.js",
  "start": "node server/servidor.js",
  "migrar": "node server/db/migrar.js up",
  "migrar:atras": "node server/db/migrar.js down",
  "semilla:ejemplo": "node --env-file-if-exists=.env server/db/semillas/ejemplo.js",
  "crear-admin": "node --env-file-if-exists=.env server/scripts/admin.js crear",
  "restablecer-admin": "node --env-file-if-exists=.env server/scripts/admin.js restablecer",
  "probar-correo": "node --env-file-if-exists=.env server/scripts/probar-correo.js",
  "test": "node --env-file-if-exists=.env --test --test-concurrency=1 server/pruebas/"
}
```

**Desvío de E2 (14/10/2026):** no hay `dev:panel`. El Vite del panel corre adentro de `npm run dev`, como el del sitio (middlewareMode, montado en `/administracion` después de la API, con su websocket de HMR en `/administracion/` y su caché en `node_modules/.vite-panel`), así no hace falta el proxy ni un segundo puerto. En desarrollo, las dos CSP suman `'unsafe-inline'` en scripts y `ws:` (lo que necesita Vite); en producción son las de 9.

**Dependencias nuevas.** Versiones del registro de npm al 08/10/2026; confirmarlas con `npm view <paquete> version` al instalar.

| Paquete | Versión | Tipo |
|---|---|---|
| `express` | 5.2.1 | runtime |
| `sequelize` | 6.37.8 | runtime |
| `pg` | ^8.21.0 | runtime |
| `umzug` | 3.8.3 | runtime |
| `argon2` | 0.45.1 | runtime |
| `helmet` | 8.3.0 | runtime |
| `express-rate-limit` | 8.7.1 | runtime |
| `cookie-parser` | 1.4.7 | runtime |
| `zod` | 4.6.5 | runtime |
| `multer` | 2.4.0 | runtime |
| `nodemailer` | 10.0.16 (pide Node ≥ 20) | runtime |
| `sharp` | pasa de devDependencies a dependencies (0.35.4 instalada) | runtime |
| `compression` | 1.8.2, **solo** si Render no comprime (10.1) | runtime |
| empaquetador ZIP en streaming (p. ej. `archiver`) | a confirmar, **solo con disco** | runtime |
| `react-router` | ^7.14.2 (se instaló ^7.18.4, la última 7.x al 14/10/2026; ya existe la 8) | dev (solo entra en el bundle del panel) |
| `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` | 3.31.4 | dev (ídem) |

- `dotenv` no hace falta: Node 24 trae `--env-file-if-exists`.
- `react`, `react-dom` y `lenis` siguen como dependencias de runtime, porque el bundle SSR las deja externas.

**Qué produce `npm run build`:** `dist/client/` (plantilla, `assets/` con hash y lo de `public/`), `dist/server/entry-server.js` y `dist/panel/` (sus URL empiezan con `/administracion/`). Con `base: '/'`, los dos builds públicos generan las mismas URL `/assets/x-hash.ext`, así que `renderBuiltUrl` ya no hace falta. Se comprueba con la prueba de hidratación sobre el build (13.3).

**Tailwind:**
- `src/index.css` pasa a `@import "tailwindcss" source(".");` para que escanee solo `src/` ([detección de clases](https://tailwindcss.com/docs/detecting-classes-in-source-files), 08/10/2026). Hoy escanearía también `docs/`, `tools/` y `CLAUDE.md`.
- `panel/src/panel.css` hace lo mismo con su carpeta.
- El CSS público tiene que seguir en ~49,6 kB.

**Arranque** (`servidor.js`):
1. Valida la configuración.
2. Conecta Sequelize con pool `max: 5`.
3. Lee una sola vez la plantilla y `entry-server.js` de `DIR_BUILD` (por defecto `dist`).
4. Verifica la casilla de envío (`transporte.verify()`, sin esperar) y deja el resultado para el Inicio del panel (8).
5. Escucha en `PORT` y programa las tareas diarias.
6. Ante `SIGTERM`: `server.close()`, `sequelize.close()` y sale. Render manda SIGKILL a los 30 s.

**SSR** (esquema de `server/ssr.js`):

```js
const [P0, P1, P2, P3] = partir(plantilla, ['<!--head-->', '<!--app-->', '<!--estado-->']) // una vez: sin .replace()

export async function responder(req, res, ruta, params) {
  const host = req.get('host')                     // cruda: req.hostname acepta X-Forwarded-Host
  const [datos, museo] = await Promise.all([ruta.cargar(params, req), museoPublico()])  // DTO planos, textos ya formateados
  if (datos == null) return noEncontrada(req, res) // 404 real
  const estado = { pagina: ruta.pagina, ruta: req.path, datos, museo, hoy: hoyEnSanJuan(),
                   medir: config.produccion && host === HOST_PUBLICO, userway: config.USERWAY_ID ?? null }
  const json = jsonEnScript(estado)                // escapa <, U+2028 y U+2029
  const html = P0 + armarHead(estado, host) + P1 + render(JSON.parse(json)) + P2 +
               `<script id="estado" type="application/json">${json}</script>` + P3
  res.set('Cache-Control', 'no-cache').type('html').send(html)   // Express agrega el ETag: 304 si no cambió
}

let ultimoMuseo = null                             // el último bueno, por si la base no responde
async function museoPublico() {
  try { return (ultimoMuseo = await leerMuseo()) } // museo + horarios, NUNCA email_destino_contacto
  catch (err) { log('aviso', 'museo_sin_base', err); return ultimoMuseo ?? {} }
}
```

Por qué está armado así:
- **Se concatena en vez de usar `.replace()` con texto:** con texto, un `$'` o un `$&` del contenido se toma como patrón. `tools/prerender.mjs` ya lo evita usando una función.
- **Se renderiza `JSON.parse(json)`:** así el servidor dibuja exactamente lo mismo que el cliente hidrata, sin `Date`, `numeric` como texto ni getters de Sequelize.
- **Sin caché de HTML:** cada pedido lee la base. Un guardado del panel se ve en el pedido siguiente sin invalidar nada, y no hay memoria que crezca con los `?fbclid=`.
- **Si la base falla:** la Home (su `cargar` no consulta nada) sale con el último `museo` bueno o con el pie mínimo; las demás rutas dan una página 503 simple, sin el bundle.
- **Si la base tarda** (sumado en E2.3, 14/10/2026): el museo tiene un tope de 2 s (`TOPE_MUSEO_MS` en `server/museo.js`); pasado ese tiempo, la página sale con el último `museo` bueno (o el vacío si nunca respondió) en vez de esperar. `leerMuseo` es una sola consulta con las columnas escritas a mano, y lleva el aviso solo si está vigente y la compra solo si está activa.

**`main.jsx`** conserva sus imports y el `?diag`:

```js
import './index.css'
import 'lenis/dist/lenis.css'
const nodo = document.getElementById('estado')
if (nodo) {
  const estado = JSON.parse(nodo.textContent)
  hydrateRoot(raiz, <StrictMode><Raiz estado={estado} /></StrictMode>)
  iniciarAnalitica(estado)
} else if (import.meta.env.DEV) {                  // solo `npm run dev:vite`; la página 503 no carga el bundle
  createRoot(raiz).render(<StrictMode><Raiz estado={ESTADO_DEV} /></StrictMode>)
}
if (/[?&]diag\b/.test(location.search)) import('./diagnostico.js').then((m) => m.default())
```

### 2.4 Qué responde el servicio, en orden

1. `app.disable('x-powered-by')` y `app.set('trust proxy', <número de saltos>)`, **nunca `true`** (10.1).
2. **Cualquier host:** `/salud` (200 si el proceso vive, sin consultar la base: es el health check de Render), `/salud/base` (`SELECT 1` con 2 s de tope, para un monitor externo), `/salud/ip` (solo con `DEPURAR_IP=1`) y `/fotos/*` (sección 7).
3. **Host aceptado** (`req.get('host')`), igual para el sitio y el panel:
   - host de `URL_PUBLICA`, o (con `CANONICO=0`) el de `RENDER_EXTERNAL_URL` o `localhost` → sigue
   - con `CANONICO=1`, cualquier otro host → 301 a `URL_PUBLICA` + ruta normalizada (también `/administracion/…`)
4. **helmet, común:** HSTS sin `includeSubDomains`, 1 día durante la transición; `nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `X-Robots-Tag: noindex, nofollow` en todo host que no sea `mupa.ar`.
5. **Panel, montado en `/administracion`** (antes de las redirecciones públicas):
   - en toda respuesta: CSP del panel (9) y `X-Robots-Tag: noindex, nofollow`, también con el host `mupa.ar`; `no-store` en todo salvo los assets
   - `/administracion/assets` de `dist/panel/assets` con `immutable`, un año y `fallthrough: false`; `/administracion/manual.pdf`
   - `/administracion/api` con `express.json` (100 kB; 300 kB en contenido), CSRF, límites, routers y 404 en JSON
   - todo otro GET de `/administracion` o `/administracion/…` → `dist/panel/index.html` con `no-store` (si falta el build del panel, una página 503 simple y `panel_sin_build` en el log; en desarrollo, el Vite del panel: E2.1)
6. **Redirecciones públicas:**
   - `/index.html` → `/`; `/preview` y `/preview/{*r}` → `/`
   - barras repetidas o finales, normalizadas con `'/' + req.path.split('/').filter(Boolean).join('/')`: nunca sale un `Location` que empiece con `//`
   - **no** se redirige `*.html`: `/google19017c966a32aec2.html` tiene que dar 200
7. **Estáticos públicos**, con la CSP pública (9): `/assets` de `dist/client/assets` con `immutable`, un año y `fallthrough: false`; la raíz de `dist/client` con `index: false`, un día y `no-cache` en los `.html`. Los dotfiles no se sirven.
8. **Público**, con la CSP pública: `/robots.txt`, `/sitemap.xml`, `GET` y `POST /contacto`, rutas SSR (6.1) y la 404. No hay API fuera de `/administracion/api`: `/api/…` da la 404 del sitio.
9. **Errores:** se respeta `err.status`; en `/administracion/api`, `{error}`; un estático que falta da **404 en texto**, no 500; el resto, una página 500/503 simple sin el bundle; nunca el stack.

### 2.5 Variables de entorno

| Variable | Local | Render | Para qué |
|---|---|---|---|
| `NODE_ENV` | development | production | errores sin stack |
| `DATABASE_URL` | `postgres://mupa:…@localhost:5432/mupa_dev` | `fromDatabase` (interna) | |
| `DATABASE_URL_TEST` | `…/mupa_test` | — | `ayudas.js` exige localhost y que termine en `_test` |
| `DB_SSL` | 0 | 0 | `1` solo desde una PC contra la URL externa |
| `URL_PUBLICA` | `http://localhost:5300/` | `https://mupa.ar/` (fija) | canonical, OG, sitemap, JSON-LD, origen permitido. Su host decide `noindex` y GA; su esquema, la cookie (`__Secure-` y `Secure` solo con https) |
| `CANONICO` | 0 | `sync: false`: 0, y 1 el día del corte | 301 de los otros hosts |
| `TRUST_PROXY` | 0 | `sync: false`: lo que dé la prueba de 10.1 | número de saltos |
| `DIR_FOTOS` | `C:/mupa-datos/fotos` (fuera de OneDrive) | `/var/data/fotos` | solo con disco |
| `CORREO_MODO` | consola | smtp | `memoria` en las pruebas. En producción, solo `smtp` |
| `SMTP_HOST` | — | `smtp.hostinger.com` | |
| `SMTP_PUERTO` | — | `sync: false`: 465 (587 si 465 no conecta) | 465 con SSL, 587 con STARTTLS |
| `SMTP_USUARIO` | — | `sync: false`: `web@mupa.ar` | también es el From. Sin ella, el formulario queda apagado |
| `SMTP_CLAVE` | — | `sync: false` | la contraseña de la casilla de envío |
| `USERWAY_ID` | — | `sync: false` | |
| `SIN_BASE` | 1 (opcional) | — | Home con un `museo` de ejemplo "máximo" y otro vacío (6.7) |
| `DIR_BUILD` | `dist` o `dist-dev` | — | prueba de hidratación (13.3) |
| `DEPURAR_IP` | — | 1 solo durante la prueba de 10.1 | |
| `RENDER_EXTERNAL_URL` | — | la pone Render | host aceptado y origen permitido antes del corte (sitio, panel y formulario) |

No hay variable para el panel: es la ruta fija `/administracion` (`RUTA_PANEL` en `compartido/panel.js`) del host que se esté usando. La usan el servidor, `vite.panel.config.js` y el router del panel.

**Prueba de producción en local:** `URL_PUBLICA=http://localhost:5183/` y `NODE_ENV=production`; el panel queda en `http://localhost:5183/administracion/`. Así GA queda activo en local y se usa `analitica-check`. Para no mandar mails de verdad, `CORREO_MODO=smtp` con un `SMTP_HOST` inexistente: el formulario recorre el camino del envío fallido.

**Entorno de prueba:** no hay uno permanente.
- Antes del corte, producción **es** la prueba: `https://mupa-web.onrender.com` con `noindex` y el panel en `https://mupa-web.onrender.com/administracion`. El museo carga su contenido real ahí mismo. Al cortar, el contenido sigue (es la misma base), pero las sesiones abiertas en `mupa-web.onrender.com` no pasan a `mupa.ar`: hay que volver a entrar.
- Después del corte se prueba en local. Si hace falta, con una copia de producción restaurada **en `C:\mupa-datos`, fuera de OneDrive**, después de vaciar `usuarios`, `sesiones`, `mensajes_contacto` y `museo.email_destino_contacto`. Se borra al terminar.

### 2.6 Desarrollo local

1. **PostgreSQL 17** con el instalador de postgresql.org (pregunta D2), con el directorio de datos fuera de OneDrive. Después:

   ```
   psql -U postgres -c "CREATE ROLE mupa LOGIN PASSWORD '<local>'" -c "CREATE DATABASE mupa_dev OWNER mupa" -c "CREATE DATABASE mupa_test OWNER mupa"
   ```

2. **Datos de arranque:** `.env` a partir de `.env.example`, y después `npm run migrar`, `npm run semilla:ejemplo` y `npm run crear-admin -- --email <correo> --nombre "<nombre>"`, que imprime la contraseña temporal.
3. **Servidores:** `npm run dev` deja el SSR en http://localhost:5300/, el puerto de `measure.mjs`, y el panel en http://localhost:5300/administracion/, con recarga en caliente los dos (desde E2: no hay `dev:panel` ni proxy, ver 2.3).
4. **Sin base:** `$env:SIN_BASE=1; npm run dev`. Las demás rutas responden 503.
5. **Producción en local:** `npm run build` y luego `$env:PORT=5183; npm start`. Las recetas se corren con `--url http://127.0.0.1:5183/`.
6. **Vite solo:** `npm run dev:vite` (5302), para retocar efectos de la Home.

### 2.7 Ramas

- Hoy se crea la rama **`landing`** desde `master`. Ahí van los arreglos de la landing estática que pida el museo hasta el corte, y se suben a Hostinger como siempre. Después se pasan a `master`.
- `master` pasa a ser el sitio completo y es lo único que despliega Render, a mano. Render nunca cambia de rama.
- **Desde E0.4 la receta de CLAUDE.md "build + `servir.mjs dist`" deja de funcionar**: `dist/client/index.html` es una plantilla vacía. CLAUDE.md y `tools/README.md` se actualizan en E0.5, no al final.
- Después del corte se borran `tools/prerender.mjs`, `build:preview` y los `.htaccess` de `public/`, y `landing` se archiva.

---

## 3. Modelo de datos

### 3.1 Convenciones

- **Sequelize:** `define: { underscored: true, freezeTableName: true }` y un modelo por archivo. Las asociaciones van en `asociaciones.js`.
- **Tipos:** fechas de calendario en `DATEONLY` e instantes en `timestamptz`; roles y estados como `varchar` con `CHECK`, nunca `ENUM`.
- **Grupos de columnas que se repiten:**
  - **P**, en lo publicable: `estado` (`borrador` | `publicado`) y `publicado_en` (la primera publicación; es la fecha visible).
  - **C**, de control: `creado_por`, `actualizado_por`, `created_at` y `updated_at`. Sin `version` (gana el último guardado; fase 2) y sin `deleted_at` (no hay papelera).
- **Slug:** único, con el patrón `^[a-z0-9]+(-[a-z0-9]+)*$`, y **fijo desde la primera publicación**.
- **Textos con formato:** `jsonb` validado por `compartido/esquemas/textoRico.js`.

### 3.2 Tablas

```sql
-- 01 usuarios y sesiones
CREATE TABLE usuarios (
  id serial PRIMARY KEY,
  email varchar(254) NOT NULL UNIQUE CHECK (email = lower(email)),   -- es el usuario; no hace falta que reciba mails
  nombre varchar(100) NOT NULL,
  password_hash varchar(255) NOT NULL,
  debe_cambiar_clave boolean NOT NULL DEFAULT true, -- true mientras tenga una contraseña temporal
  clave_temporal_vence timestamptz,                 -- alta o restablecimiento + 72 h; NULL con la clave propia
  rol varchar(20) NOT NULL DEFAULT 'editor' CHECK (rol IN ('admin','editor')),
  activo boolean NOT NULL DEFAULT true,
  ultimo_acceso timestamptz,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CHECK (NOT debe_cambiar_clave OR clave_temporal_vence IS NOT NULL)
);
CREATE TABLE sesiones (
  id bigserial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES usuarios ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,              -- SHA-256 hex del valor de la cookie
  creada_en timestamptz NOT NULL DEFAULT now(),
  ultimo_uso timestamptz NOT NULL DEFAULT now(),
  expira_en timestamptz NOT NULL,                   -- creada_en + 12 h
  user_agent varchar(300)                           -- para "tus sesiones"; sin IP
);
CREATE INDEX sesiones_usuario ON sesiones (usuario_id);

-- 02 museo y visitas (+ fila museo id=1 vacía y los 7 días cerrados)
CREATE TABLE museo (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  direccion varchar(200), localidad varchar(100), provincia varchar(60), codigo_postal varchar(10),
  telefono varchar(40), email_publico varchar(254),
  email_destino_contacto varchar(254),              -- solo admin; nunca sale al HTML
  redes jsonb NOT NULL DEFAULT '[]',                -- [{red, url}]; zod: solo https
  mapa_embed_url text CHECK (mapa_embed_url IS NULL OR mapa_embed_url LIKE 'https://www.google.com/maps/embed?%'),
  mapa_url text CHECK (mapa_url IS NULL OR mapa_url LIKE 'https://%'),
  como_llegar jsonb, normas jsonb, accesibilidad jsonb,   -- texto con formato; vacío = no se muestra
  nota_horarios varchar(300), nota_tarifas varchar(300),
  compra_activa boolean NOT NULL DEFAULT false,
  compra_url text CHECK (compra_url IS NULL OR compra_url LIKE 'https://%'), compra_texto varchar(40),
  aviso_texto varchar(200), aviso_hasta date,       -- cierres y feriados mientras no haya excepciones (fase 2)
  updated_at timestamptz NOT NULL, actualizado_por int REFERENCES usuarios ON DELETE SET NULL
);
CREATE TABLE horario_semanal (
  dia smallint PRIMARY KEY CHECK (dia BETWEEN 1 AND 7),   -- ISO: 1 = lunes
  abierto boolean NOT NULL DEFAULT false,
  franjas jsonb NOT NULL DEFAULT '[]',              -- [{abre:'09:00', cierra:'13:00'}], hasta 2 (zod)
  nota varchar(120)
);
CREATE TABLE tarifas (
  id serial PRIMARY KEY,                            -- id estable: lo referencia el módulo 5
  nombre varchar(80) NOT NULL,
  gratuita boolean NOT NULL DEFAULT false,
  precio integer CHECK (precio >= 0),               -- pesos, sin centavos
  condicion varchar(160),
  orden smallint NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CHECK (gratuita OR precio IS NOT NULL)
);

-- 03 fotos
CREATE TABLE fotos (
  id serial PRIMARY KEY,
  clave char(16) NOT NULL UNIQUE,                   -- 64 bits al azar: /fotos/<clave>/960.webp
  ancho int NOT NULL, alto int NOT NULL,            -- de la maestra, ya orientada
  variantes jsonb NOT NULL,                         -- p. ej. [480, 960, 1600, 2400], sin agrandar
  bytes int NOT NULL,
  alt varchar(250) NOT NULL DEFAULT '', decorativa boolean NOT NULL DEFAULT false,
  epigrafe varchar(300), credito varchar(120),
  subida_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CHECK (decorativa OR alt <> '')
);
-- solo con 16.1: fotos_archivos (ver 16.1)

-- 04 salas y muestras
CREATE TABLE salas (
  id serial PRIMARY KEY,
  nombre varchar(120) NOT NULL,
  slug varchar(140) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  resumen varchar(200), descripcion jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL DEFAULT 0,
  plano_ref varchar(60) UNIQUE,                     -- id del área en el SVG del plano (módulo 4)
  -- + P y C
);
CREATE INDEX salas_publicas ON salas (estado, orden);
CREATE TABLE muestras (
  id serial PRIMARY KEY,
  titulo varchar(160) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tipo varchar(12) NOT NULL CHECK (tipo IN ('permanente','temporal')),
  fecha_inicio date, fecha_fin date,
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio),
  sala_id int REFERENCES salas ON DELETE SET NULL,
  resumen varchar(200), descripcion jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL DEFAULT 0,
  -- + P y C
  CHECK (estado = 'borrador' OR tipo = 'permanente' OR fecha_inicio IS NOT NULL)
);
CREATE INDEX muestras_publicas ON muestras (estado, fecha_fin);
CREATE TABLE galeria_muestras (muestra_id int REFERENCES muestras ON DELETE CASCADE,
  foto_id int REFERENCES fotos ON DELETE RESTRICT, orden smallint NOT NULL, PRIMARY KEY (muestra_id, foto_id));

-- 05 novedades
CREATE TABLE novedades (
  id serial PRIMARY KEY,
  tipo varchar(12) NOT NULL CHECK (tipo IN ('noticia','actividad')),
  titulo varchar(160) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  resumen varchar(200), cuerpo jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  evento_inicio timestamptz, evento_fin timestamptz,
  CHECK (evento_fin IS NULL OR evento_fin >= evento_inicio),
  lugar varchar(160), costo varchar(80),
  enlace_inscripcion text CHECK (enlace_inscripcion IS NULL OR enlace_inscripcion LIKE 'https://%'),
  -- + P y C
  CHECK (tipo = 'noticia' OR estado = 'borrador' OR evento_inicio IS NOT NULL)
);
CREATE INDEX novedades_publicas ON novedades (estado, publicado_en DESC);
CREATE INDEX novedades_actividades ON novedades (tipo, evento_inicio);
CREATE TABLE galeria_novedades (novedad_id int REFERENCES novedades ON DELETE CASCADE,
  foto_id int REFERENCES fotos ON DELETE RESTRICT, orden smallint NOT NULL, PRIMARY KEY (novedad_id, foto_id));

-- 06 mensajes del formulario de contacto
CREATE TABLE mensajes_contacto (
  id serial PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  mensaje text NOT NULL CHECK (length(mensaje) <= 5000),
  envio varchar(10) NOT NULL DEFAULT 'pendiente' CHECK (envio IN ('pendiente','enviado','fallido')),
  error varchar(40),                                -- código de nodemailer (EAUTH, ETIMEDOUT…), nunca el texto
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mensajes_fecha ON mensajes_contacto (created_at DESC);
```

**Galerías:** tablas con FK reales, armadas con la fábrica `definirGaleria(nombre, modeloPadre)`. Por ahora solo muestras y novedades; la de salas se suma con el módulo 4.

**Qué se calcula y no se guarda:**
- **Público:** `estado = 'publicado'`.
- **Estado de una muestra**, con el "hoy" de San Juan: Actual (`fecha_inicio <= hoy AND (fecha_fin IS NULL OR fecha_fin >= hoy)`), Próxima, Finalizada o Permanente.
- **Actividad:** "Realizada" si `coalesce(evento_fin, evento_inicio) < now()`.

**Eliminar contenido**, todo en una transacción:
1. Se juntan los ids de la portada y de la galería.
2. Se borra la fila; las galerías caen en cascada.
3. `liberarFotos(ids, t)` borra las fotos que ya no usa nadie.
4. Los archivos se borran **después del commit**.

Lo mismo pasa al reemplazar una portada o al quitar una foto de una galería.

### 3.3 Migraciones

**Herramienta:** umzug 3.8.3 con `SequelizeStorage` (tabla `SequelizeMeta`). Como el proyecto es ESM, el `resolve` va explícito:

```js
// server/db/migrar.js
const abajo = process.argv[2] === 'down'
if (abajo && config.produccion && !process.argv.includes('--confirmo-borrar-datos'))
  throw new Error('migrar:atras en producción borra datos: agregá --confirmo-borrar-datos')
const umzug = new Umzug({
  migrations: {
    glob: ['migraciones/*.js', { cwd: dirname(fileURLToPath(import.meta.url)) }],
    resolve: ({ name, path, context }) => ({
      name,
      up: async () => (await import(pathToFileURL(path).href)).up({ context }),
      down: async () => (await import(pathToFileURL(path).href)).down({ context }),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
})
await umzug[abajo ? 'down' : 'up']()
await sequelize.close()
```

- **Archivos:** `20261013-01-usuarios.js`, `20261013-02-museo-visitas.js`, `20261026-03-fotos.js`, `20261026-04-salas-muestras.js`, `20261026-05-novedades.js` y `20261109-06-mensajes-contacto.js`. Cada uno exporta `up` y `down`; los `CHECK` y los índices van como SQL fijo.
- **En producción:** `preDeployCommand: npm run migrar`. Corre después del build y, si falla, aborta el deploy ([render.com/docs/deploys](https://render.com/docs/deploys), 08/10/2026).
- **Riesgo conocido:** umzug anota la migración en `SequelizeMeta` después de que termina su `up`, fuera de su transacción. Si el pre-deploy muere justo entre el COMMIT de la migración y ese registro, la migración queda aplicada pero figura pendiente, y el deploy siguiente falla al repetirla (la tabla ya existe). Arreglo a mano, desde el Shell de Render: comprobar que el esquema tiene lo de esa migración y registrarla con `INSERT INTO "SequelizeMeta" (name) VALUES ('<archivo>.js')` (anotado en la verificación de E1, 13/10/2026).
- **Regla expand/contract:** mientras corre el pre-deploy la versión anterior sigue sirviendo. Una columna nueva entra nullable o con default, y lo que se saca se borra en una migración posterior.
- **`sync()` no aparece en ningún archivo.** `contenido.test.js` lo busca con grep.

### 3.4 Datos iniciales

- **En la migración 02**, que va a producción: la fila `museo` vacía y los 7 días cerrados. No se inventa ningún dato del museo.
- **`semillas/ejemplo.js`**, solo local (no corre con `NODE_ENV=production`) y crece con cada migración: contenido marcado "EJEMPLO ·", con 2 salas, 3 muestras (actual, próxima y finalizada), 4 novedades (una actividad pasada y otra futura), tarifas, horarios y 3 mensajes de contacto (uno fallido).
- **Primer admin:** `npm run crear-admin -- --email … --nombre …` desde el Shell de Render. Crea la cuenta con una contraseña temporal que imprime una sola vez en la terminal. No queda ninguna contraseña en variables ni en los logs.

### 3.5 Preparado para el plano (módulo 4)

**Ya queda hecho:** las salas con nombre, texto, portada y orden, y `plano_ref` reservado.

**Cuando se contrate:** el SVG en `src/assets/plano.svg` con `id="sala-<plano_ref>"`, la tabla `galeria_salas` (migración aditiva), una página o sección que cruce las salas publicadas con el SVG y un `<select>` de `plano_ref` en la ficha de la sala. Para varios pisos, `salas.piso smallint`.

### 3.6 Preparado para la venta de entradas (módulo 5)

**Ya queda hecho:** `tarifas` con id estable, roles como `varchar`, `correo.js` (separa el armado del mail del transporte), el patrón de transacción con lock y el CSRF con lista de excepciones (hoy vacía).

**Se agrega después**, con migraciones nuevas y sin tocar las tablas actuales:

| Tabla o cambio | Columnas clave |
|---|---|
| `tarifas` (columna nueva) | `vendible_online boolean DEFAULT false` |
| `cupos_dia` | `fecha date PK`, `capacidad`, `vendidas`. Se descuenta con `SELECT … FOR UPDATE` |
| `ordenes` | `id uuid`, `referencia uuid UNIQUE` (el `external_reference` de MP), email, nombre, `fecha_visita`, estado, total, `mp_preferencia_id`, `vence_en`, `pagada_en` |
| `orden_items` | `orden_id`, `tarifa_id`, `cantidad`, `precio_unitario` (copia del precio al comprar) |
| `pagos` | `mp_pago_id bigint UNIQUE` (hace idempotente el webhook), `orden_id`, estado, monto, `detalle jsonb` |
| `entradas` | `id uuid`, `orden_id`, `codigo char(32) UNIQUE` (128 bits: el QR), `usada_en`, `usada_por` |
| `registro_cambios` | auditoría de precios y ventas (está en la fase 2; con el módulo 5 conviene sí o sí) |
| `usuarios.rol` | se suma `'boleteria'`, con una pantalla de escaneo en el panel |
| API | `POST /mercadopago/webhook`, público y fuera de `/administracion`, exceptuado del CSRF y verificado con `x-signature` y consultando el pago a MP |
| Correo | Los mails a compradores (confirmación con el QR) necesitan un servicio de correo transaccional con sus registros DNS; se elige con el módulo 5. La casilla de Hostinger no alcanza para eso |

---

## 4. API

### 4.1 Convenciones

**Respuestas:** `{ data }` o `{ error, campos? }`, con los mensajes en castellano.

| Código | Cuándo |
|---|---|
| 400 | validación |
| 401 | sin sesión, credenciales incorrectas o contraseña temporal vencida |
| 403 | rol, origen o contraseña temporal sin cambiar (`debeCambiarClave`) |
| 404 | no existe |
| 409 | slug repetido o último admin |
| 413 | archivo grande |
| 415 | tipo de foto no admitido |
| 429 | límite |

**Errores:** los traduce solo `server/errores.js`: `SequelizeUniqueConstraintError` → 409, `ZodError` → 400, `40P01` → 409 "reintentar", el resto → 500 genérico.

**Entrada:** ids con `parseId` y búsquedas con `escapeLike`; listados con `?pagina=` y `?por=` (100 como máximo); a Sequelize llega **solo lo que devolvió `esquema.parse`**; `creado_por` y `actualizado_por` salen siempre de `req.usuario.id`.

### 4.2 Rutas sin sesión

| Método | Ruta | Notas |
|---|---|---|
| POST | `/administracion/api/sesion` | `{email ≤254, clave 1..256}`. Devuelve `{usuario, debeCambiarClave}` |
| GET | `/administracion/api/sesion` | `{usuario:{id,nombre,email,rol}, debeCambiarClave}` o 401 |
| DELETE | `/administracion/api/sesion` | Borra la fila y la cookie |
| POST | `/contacto` | Formulario público `application/x-www-form-urlencoded` (sección 8) |

No hay API fuera de `/administracion/api`: cualquier `/api/…` da la 404 del sitio.

### 4.3 Rutas del panel

Van bajo `/administracion/api`, montadas después de `/sesion`, con `requiereSesion` en el montaje. En la tabla, la ruta es relativa a ese prefijo (`/cuenta` es `/administracion/api/cuenta`).

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| PUT | `/cuenta` | editor | `{nombre}` |
| PUT | `/cuenta/clave` | editor | `{actual, nueva}`. También es el cambio obligatorio del primer ingreso. Borra **todas** las sesiones, crea una nueva y apaga `debe_cambiar_clave` |
| DELETE | `/cuenta/sesiones` | editor | Cierra la sesión en todos lados |
| GET / POST | `/usuarios` | admin | El POST `{nombre, email, rol}` crea la cuenta y devuelve `{usuario, claveTemporal}`. La temporal no vuelve a salir en ningún GET |
| PATCH | `/usuarios/:id` | admin | `{nombre?, rol?, activo?}`. 409 si deja sin admins activos (`LOCK`). Desactivar borra sus sesiones |
| POST | `/usuarios/:id/clave-temporal` | admin | Nueva temporal (72 h), `debe_cambiar_clave`, borra sus sesiones y devuelve `{claveTemporal}`. No sobre la propia cuenta (400) ni sobre una desactivada (409: el ingreso solo busca cuentas activas; primero se activa) |
| DELETE | `/usuarios/:id/sesiones` | admin | |
| GET / PUT | `/museo` | editor (`email_destino_contacto`: admin, si no → 403) | Incluye los textos de Visitas, el aviso y la compra externa. **E2.3 (14/10/2026):** el PUT es parcial (cambia solo los campos que trae, al menos uno): Datos del museo y Visitas guardan campos de la misma fila y, si no, una pisaría a la otra. Las reglas de dos campos (compra activa con su dirección; "Mostrar hasta" con el texto del aviso) se revisan sobre la fila como quedaría, con la fila bloqueada. Un editor que manda el correo de destino recibe 403 antes de validar, y el GET no se lo da. Los textos con formato entran con E3.2: hasta entonces el PUT los descarta |
| GET / PUT | `/horarios` | editor | Los 7 días en un PUT. Hasta 2 franjas, con `abre < cierra`. Un día cerrado descarta sus franjas sin validarlas; dos franjas pueden tocarse (13:00 y 13:00) (E2.4) |
| GET / POST | `/tarifas` | editor | Hasta 50 (409). **E2.4:** el alta va al final y, si el orden tiene huecos, primero renumera 1..n (`orden` es `smallint`: con max + 1, altas y bajas lo llevaban a 32767 y daba 500). Altas y cambios de orden van de a uno (`LOCK TABLE tarifas IN SHARE ROW EXCLUSIVE MODE`) |
| PUT / DELETE | `/tarifas/:id` | editor | Se recomienda ocultarla en vez de borrarla. El PUT exige la tarifa completa, sin valores por defecto (E2.4). Una gratuita se guarda sin precio |
| PUT | `/tarifas/orden` | editor | `{ids}` con todas las tarifas: si no coinciden con las que hay, 409. Va antes de `/tarifas/:id` en la tabla (E2.4) |
| GET / POST | `/salas`, `/muestras`, `/novedades` | editor | Listado `?estado=&q=&pagina=`. El POST crea un borrador: exige el título y el slug sale de él |
| GET / PUT | `/:tipo/:id` | editor | El PUT recibe el esquema completo. Si ya está publicada, la valida como publicada |
| POST | `/:tipo/:id/publicar` | editor | Valida para publicar, pone `publicado_en` la primera vez y congela el slug |
| POST | `/:tipo/:id/despublicar` | editor | Vuelve a borrador |
| DELETE | `/:tipo/:id` | editor | Eliminación real (con diálogo en el panel). Libera sus fotos |
| PUT | `/:tipo/:id/galeria` | editor | `{fotos:[id]}` en orden (muestras y novedades) |
| POST | `/fotos` | editor | multipart (sección 7) |
| PATCH | `/fotos/:id` | editor | `{alt?, decorativa?, epigrafe?, credito?}` |
| GET | `/mensajes` | admin | Solo lectura, de la más nueva a la más vieja, `?pagina=` (50 por página) |
| GET | `/estado` | editor | Para el Inicio: "Para completar", un solo admin, estado del correo (8), tareas fallidas y fotos faltantes (con disco). **E2.2:** devuelve códigos, no textos (`{ paraCompletar, unSoloAdmin, correo, tareasFallidas }`; los textos los pone el panel), en una sola consulta; `unSoloAdmin` llega a los dos roles y el correo de destino figura en `paraCompletar` solo para un admin |
| GET | `/copia/fotos` | admin | **Solo con disco:** ZIP en streaming con `2400.webp` y `og.jpg` de cada foto, más un `fotos.json` |

`server/api/contenido.js` es una fábrica (modelo, esquema, galería) que arma las rutas de los tres tipos. `api/indice.js` exporta la tabla `[{metodo, ruta, rol}]`, que recorre `permisos.test.js`.

### 4.4 Autenticación

**Inicio de sesión:**
1. zod; el correo pasa a minúsculas.
2. Se busca un usuario activo.
3. `argon2.verify`. Si el usuario no existe, se verifica igual contra un hash de relleno, para que el tiempo no lo delate.
4. Si la clave es correcta pero es una temporal vencida: 401 "La contraseña temporal venció. Pedile otra a un administrador" (solo se dice después de verificar la clave).
5. Si sale bien: token de `randomBytes(32).toString('base64url')` (en la base va su SHA-256), `expira_en = now() + 12 h`, `Set-Cookie`, se actualiza `ultimo_acceso` y una línea de log `ingreso` con `usuario_id`. La respuesta trae `debeCambiarClave`.
6. Si falla: 401 "Correo o contraseña incorrectos" y una línea de log `ingreso_fallido`, **sin el correo ni la IP**.

**Cookie:** `__Secure-mupa_sesion; Path=/administracion; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`, sin `Domain` (queda atada al host). El navegador la manda solo a `/administracion` y `/administracion/…`: ninguna respuesta pública la pone ni la recibe. No puede llevar el prefijo `__Host-`, que exige `Path=/`. Con `URL_PUBLICA` en http (local), `mupa_sesion` sin `Secure`. Es de un host: la de `mupa-web.onrender.com` no sirve en `mupa.ar` (después del corte hay que volver a entrar).

**`requiereSesion`:**
- Busca la sesión con `expira_en > now() AND ultimo_uso > now() - interval '2 hours' AND usuario.activo`.
- Renueva `ultimo_uso` como mucho cada 5 minutos.
- Pone `req.usuario`. **El rol se lee de la base en cada pedido**: desactivar a alguien o cambiarle el rol vale desde el pedido siguiente.
- **Con `debe_cambiar_clave`**, solo deja pasar `GET` y `DELETE /administracion/api/sesion` y `PUT /administracion/api/cuenta/clave`; el resto da 403 `{error, debeCambiarClave: true}`.
- **Si además la temporal ya venció** (`clave_temporal_vence <= now()`: la sesión se abrió con ella antes de las 72 h y dura hasta 12), borra esa sesión y da 401 con el mismo mensaje que el inicio de sesión, "La contraseña temporal venció. Pedile otra a un administrador", y `sesion_temporal_vencida` en el log (corrección de E1, 13/10/2026).

**Contraseñas** (`claves.js`):
- argon2id `{ memoryCost: 19456, timeCost: 2, parallelism: 1 }` ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), 08/10/2026). argon2 es nativo y se importa en el primer uso, no al arrancar: si el binario no cargara en Render, el sitio público sigue, las rutas que usan contraseñas dan 503 en JSON y el log dice una vez `argon2_no_disponible` (corrección de E1, 13/10/2026).
- De 15 a 128 caracteres ([NIST SP 800-63B-4](https://csrc.nist.gov/pubs/sp/800/63/B/4/final), 31/07/2025), sin reglas de composición. Se rechazan las que contienen la parte local del correo, "mupa", "museo" o "paleontologico", las de un solo carácter repetido y la misma temporal. El panel sugiere una frase de tres o cuatro palabras.
- **Temporal:** 16 caracteres al azar de un alfabeto sin confusiones (sin `0/O` ni `1/l/I`), en grupos de 4 (`k7mq-x3tf-9wrd-hp2c`): 80 bits. Se guarda solo su hash, como cualquier clave. Como se dicta en persona o por teléfono, mientras la cuenta la tenga pendiente se acepta en mayúsculas, sin los guiones o con espacios (el autocapitalizado del celular), y la nueva no puede ser ella misma escrita así (corrección de E1, 13/10/2026).

**Altas, olvidos y emergencias** (sin mails):
- **Alta:** el admin carga nombre, correo y rol. El servidor genera la temporal, guarda el hash con `debe_cambiar_clave = true` y `clave_temporal_vence = now() + 72 h`, y la devuelve **una sola vez**. El panel la muestra en un diálogo con "Copiar" y la advertencia "No se vuelve a mostrar. Dásela a la persona en persona o por teléfono". No queda en logs ni se puede volver a ver.
- **Primer ingreso:** con la temporal. El panel lleva a Cambiar la contraseña y no deja hacer otra cosa hasta cambiarla.
- **Olvido:** la persona le avisa a un admin, que usa "Dar contraseña temporal" en Usuarios: nueva temporal con las mismas reglas, y se cierran todas sus sesiones.
- **Cambio de clave** (Mi cuenta o primer ingreso): pide la actual; borra todas las sesiones, crea una nueva, pone `debe_cambiar_clave = false` y `clave_temporal_vence = NULL`, y escribe `clave_cambiada` en el log.
- **Llave de emergencia** (el primer admin, o si nadie puede entrar): desde el Shell de Render, `npm run crear-admin -- --email … --nombre …` (cuenta nueva) o `npm run restablecer-admin -- --email …` (cuenta existente: la deja activa, admin, con una temporal nueva y sin sesiones). La temporal sale solo en la terminal. Hace falta la cuenta de Render del museo: es la última llave, no un atajo.

**Usuarios y roles:**
- El alta la hace solo un admin; no hay autoregistro. El correo es el usuario: tiene que ser de esa persona, aunque el panel no le escribe.
- Roles `admin` y `editor` (4.5). No se puede desactivar ni bajar de rol al último admin activo.
- El Inicio avisa si hay un solo admin: lo recomendado son dos.
- La cuenta "Soporte" del desarrollador es admin. El museo la desactiva al terminar la garantía.

### 4.5 Matriz de permisos

| Acción | editor | admin |
|---|---|---|
| Novedades, salas y muestras: crear, editar, publicar, despublicar, eliminar | sí | sí |
| Fotos: subir y editar alt, epígrafe y crédito | sí | sí |
| Visitas: horarios, tarifas, textos, aviso, compra externa | sí | sí |
| Datos del museo (salvo el correo de destino) | sí | sí |
| Correo de destino del formulario y Mensajes | no | sí |
| Usuarios (alta, contraseñas temporales, roles) y copia de fotos (con disco) | no | sí |
| Mi cuenta | sí | sí |

### 4.6 CSRF

Corre en todo pedido con método que no sea GET, HEAD ni OPTIONS. `EXCEPTUADAS` queda vacía; el webhook de MP se suma con el módulo 5.

```js
const sitio = req.get('sec-fetch-site')
const origen = req.get('origin')
const permitidos = origenesPermitidos()   // URL_PUBLICA y RENDER_EXTERNAL_URL (en local, localhost)
const ok = sitio ? sitio === 'same-origin' : (origen != null && permitidos.includes(origen))
if (!ok) throw httpError(403, 'Origen no permitido')
```

- Es la misma regla para el panel y el formulario: los dos están en el mismo origen.
- `same-site` se rechaza: solo hace falta `same-origin`, y `same-site` incluiría cualquier otro subdominio de `mupa.ar`.
- **Lo que no cubre:** un script que corre en una página pública del mismo origen llega como `same-origin`. Es el riesgo aceptado de 9.
- No se usa el paquete `cors`. Las rutas JSON exigen `Content-Type: application/json`, salvo `/administracion/api/fotos` (multipart).

Fuente: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), 08/10/2026.

### 4.7 Límites de intentos

`express-rate-limit` 8.7.1 en memoria; alcanza porque hay una sola instancia.

| Ruta | Límite | Clave |
|---|---|---|
| `POST /administracion/api/sesion` | 10 cada 15 min | IP |
| `POST /administracion/api/sesion` | 5 **fallidos** cada 15 min (un ingreso correcto los pone en cero: no se acumulan entre ingresos buenos) | correo + IP: nadie puede dejar afuera al titular desde otra IP |
| `POST /contacto` | 5 por hora; 50 por día en total | IP; contador global |
| `POST /administracion/api/fotos` | 60 por hora | usuario |
| `PUT /administracion/api/cuenta/clave` | 5 con la contraseña actual **equivocada** cada 15 min (el cambio correcto los pone en cero; una nueva que no cumple las reglas no cuenta) | usuario: con una sesión robada no se puede probar la contraseña de a miles (sumado en la corrección de E1, 13/10/2026) |
| `/administracion/api/*` con sesión | 300 por minuto | usuario |

- **Los 50 por día del formulario** quedan por debajo del límite de la casilla de envío (100 por día en el correo gratuito de Hostinger, ver 8). Un reinicio solo pone el contador en cero.
- La respuesta 429 dice "Demasiados intentos. Esperá 15 minutos" (en Contacto, "Probá mañana o escribinos a <correo público>"). Es una espera, nunca un bloqueo permanente. **Depende de que `trust proxy` esté bien** (10.1).
- El log lleva una sola línea por ventana y clave (el primer pedido bloqueado: `limite_ingreso_ip`, `limite_ingreso_correo`, `limite_clave_actual`, `limite_usuario`), sin la IP ni el correo (corrección de E1, 13/10/2026).

### 4.8 Quién cambió qué

- Cada listado y cada ficha muestra "Última edición: <persona>, <fecha>", con `actualizado_por` y `updated_at`.
- Los inicios de sesión, los cambios de clave y los errores quedan en el log de Render (7 días, sin IP ni correos).
- La pantalla Actividad y la tabla `registro_cambios` están en la fase 2. Cuando se sumen, `password_hash` y `token_hash` no se registran nunca, con una prueba que lo verifique.

---

## 5. Panel

### 5.1 Construcción

**Librerías:** React 19.3; `react-router` 7 en **modo Data** (`createBrowserRouter(rutas, { basename: '/administracion' })` y `<RouterProvider>`; Vite con `base: '/administracion/'`); Tailwind 4 con su propia hoja; `fetch`; TipTap con `React.lazy`, solo en las fichas. Sin kit de componentes, sin librería de formularios y sin gestor de estado.

**Estilo:** claro, neutro y de alto contraste, con `system-ui`. Máximo 72 rem y una sola columna a 320 px. No es trabajo de la diseñadora.

**`api.js`:**
- `pedir(metodo, ruta, cuerpo)` con `credentials: 'same-origin'`.
- **En todo `POST`, `PUT` y `PATCH` manda `Content-Type: application/json` y un cuerpo, `'{}'` si la ruta no lleva datos** (p. ej. `POST /usuarios/:id/clave-temporal`): la API responde 415 a esos métodos sin ese Content-Type aunque no traigan cuerpo (`exigirJson`, `server/seguridad.js`; anotado en la verificación de E1, 13/10/2026).
- Un 401 abre `ReingresoDialogo` (un `<dialog>` de inicio de sesión) y reintenta el pedido, sin perder el formulario.
- Un 403 con `debeCambiarClave` lleva a `/cambiar-clave`.
- Los 400 se reparten a cada campo; los 409 (slug repetido, último admin) se muestran junto al campo o arriba.
- Un error de red, por ejemplo durante un deploy con disco, muestra "Sin conexión, reintentá" y el formulario queda como estaba.
- `vite:preloadError` (un chunk que ya no existe después de un deploy) muestra "Hay una versión nueva del panel: guardá y recargá".

**Lo que E2 agregó o cambió (14/10/2026):**
- **Reingreso:** el diálogo recuerda el correo después de "Ahora no". Si entra **otra** cuenta (una computadora compartida), el pedido no se repite: el panel vuelve al Inicio sin preguntar por los cambios sin guardar, para que lo escrito por la primera no se guarde a nombre de la segunda; si vuelve la misma persona con otro rol, la pantalla se recarga. Con la temporal vencida, el diálogo no tiene campos: solo "Ir a Ingresar". La decisión está en `panel/src/reingreso.js`, contra la última sesión conocida.
- **Sin `<ScrollRestoration />`**, que guarda las posiciones en `sessionStorage` (9 no lo permite): cada pantalla nueva arranca arriba.
- **zod en el panel con `jitless`** (`compartido/esquemas/zod.js`, vale también para el servidor): al definir un `z.object` zod prueba `new Function`, y la CSP del panel lo informaba como violación. El panel valida con el mismo esquema del servidor antes de mandar (`validarCon`).
- **Barra:** fija arriba solo desde lg; en el celular son dos filas que se van con el scroll, con Salir siempre a la vista. Salir navega a `/salir`, así un formulario sin guardar pregunta antes de cerrar la sesión. Mientras carga la pantalla siguiente, "Cargando…" a los 400 ms y `aria-busy` en el `<main>`.
- **Un solo bundle**, sin división en partes: al cerrar E2, 489 kB de JS (127 kB con Brotli). TipTap tiene que ir con `React.lazy` (E3.2); partir por ruta, cuando crezca.

**Subida de fotos:** con `XMLHttpRequest`, para mostrar el progreso ("Subiendo… 45 %" y después "Procesando foto…").

### 5.2 Pantallas (bajo `/administracion`)

Las rutas de la tabla son relativas a `/administracion`: `/novedades` es `https://mupa.ar/administracion/novedades`.

| Ruta | Pantalla | Rol | Contenido |
|---|---|---|---|
| `/ingresar` | Ingresar | — | Correo y contraseña (`username` y `current-password`). Debajo: "¿Olvidaste tu contraseña? Pedile a un administrador una contraseña temporal" |
| `/cambiar-clave` | Cambiar la contraseña | con sesión | Obligatoria con una temporal. Actual y nueva (`new-password`), mostrar u ocultar, ayuda. No deja ir a otra pantalla hasta cambiarla |
| `/` | Inicio | editor | Accesos directos, "Para completar" (datos vacíos, horarios sin cargar, sin tarifas, sin correo de destino), aviso de un solo admin, **aviso del correo** (8), tareas fallidas, fotos faltantes |
| `/novedades` (+ `/nueva`, `/:id`) | Novedades | editor | Listado (tarjetas en celular) con estado, tipo y fecha. Filtros |
| `/exposiciones` | Exposiciones | editor | Pestañas Muestras y Salas. Orden con botones |
| `/muestras/:id`, `/salas/:id` | Ficha | editor | 5.3 |
| `/visitas` | Visitas | editor | Horario semanal, Tarifas, Textos, Aviso y Compra de entradas |
| `/museo` | Datos del museo | editor | Contacto, dirección, mapa, redes. El correo de destino, solo para admin |
| `/mensajes` | Mensajes | admin | Lista de solo lectura del formulario (8) |
| `/usuarios` | Usuarios | admin | Alta (nombre, correo, rol) con el diálogo de la temporal; "Dar contraseña temporal"; rol; activar o desactivar; cerrar sesiones; descargar copia de fotos (con disco) |
| `/cuenta` | Mi cuenta | editor | Nombre, contraseña, cerrar sesión en todos lados |

**Barra superior**, siempre en el mismo lugar (WCAG 3.2.6): Inicio, Novedades, Exposiciones, Visitas y Datos del museo; Mensajes y Usuarios para admin. A la derecha: Ayuda (abre `/administracion/manual.pdf`), el nombre (lleva a Mi cuenta) y **Salir, siempre visible** (también en el celular): el manual pide cerrar sesión al terminar (9).

**Al cerrar E2 (14/10/2026):** la barra tiene Inicio, Visitas, Datos del museo y Usuarios (Novedades y Exposiciones entran con E3.3 y E3.4, Mensajes con E4.9 y Ayuda con E6.2, en `panel/src/navegacion.js`); el enlace dice "Mi cuenta", con el nombre desde pantallas medianas. `/cambiar-clave` sirve también para el cambio voluntario, aunque Mi cuenta ya tiene su propio formulario de contraseña. En el celular el Tab recorre las secciones antes que Mi cuenta y Salir (el orden de escritorio), a propósito. Una cuenta desactivada no puede entrar (4.4): Usuarios le ofrece "Activar" y no "Dar contraseña temporal", y la API rechaza esa temporal con 409 (corregido el 14/10/2026).

### 5.3 Campos por tipo

(*) = obligatorio para publicar. El borrador solo exige el título.

| Tipo | Campos |
|---|---|
| **Novedad** | Tipo (Noticia o Actividad); Título* (≤ 160); Resumen* (≤ 200, con contador: "Aparece en Google y en las tarjetas"); Portada* (con alt, no decorativa); Cuerpo* (editor); Galería; Dirección web (slug, editable hasta publicar). **Solo actividad:** Inicio* (`datetime-local`), Fin, Lugar (vacío = el museo), Costo (texto corto), Enlace de inscripción (`https://`) |
| **Muestra** | Título*; Tipo; Fecha de inicio* (si es temporal); Fecha de fin; Sala (`<select>`); Resumen*; Portada*; Descripción*; Galería; slug |
| **Sala** | Nombre*; Resumen*; Portada*; Descripción; slug. `plano_ref` queda oculto hasta el módulo 4 |
| **Horario semanal** | 7 renglones: Abierto, Franja 1 y Franja 2 opcional (`type="time"`), Nota. Más una nota general |
| **Tarifa** | Nombre*, Gratuita, Precio en pesos, Condición, Visible. Más una nota de tarifas |
| **Textos de Visitas** | Cómo llegar, Normas del museo, Accesibilidad del edificio (editor). Vacío = no se muestra |
| **Aviso general** | Texto (≤ 200) y "Mostrar hasta" (fecha). Sirve para feriados y cierres |
| **Datos del museo** | Dirección, Localidad, Provincia, CP, Teléfono, Correo público, Correo de destino del formulario (admin; cualquier dirección, también un Gmail), Redes (red + URL `https://`), Enlace "Insertar mapa" (validado), Enlace "Abrir en Google Maps" |
| **Compra externa** | Activa, URL (`https://`), Texto del botón (≤ 40) |

**Cómo quedaron en E2 (14/10/2026):**
- **Redes:** lista fija de 7 (`REDES` en `compartido/esquemas/museo.js`: Instagram, Facebook, YouTube, TikTok, X, Threads y LinkedIn), hasta 8 cargadas.
- **Mapa:** acepta el `<iframe>` entero que da Google Maps ("Insertar mapa") y guarda solo su `src`. El panel no lo muestra (la CSP del panel no deja a Google): un enlace lo abre en otra pestaña.
- **URLs:** solo `https://`, con el esquema guardado en minúsculas ("HTTPS://" pegado de un documento daba 500 contra los `CHECK`), y sin caracteres invisibles o de control.
- **Tarifas:** precio en pesos, sin centavos ("3.000" y "$3.000" se entienden); una gratuita se guarda sin precio; hasta 50.
- **Aviso:** "Mostrar hasta" exige el texto; **compra:** activa exige la URL.
- **Textos de Visitas:** no están todavía; llegan con el editor en E3.2.

### 5.4 Flujos

- **Estados** (`compartido/estados.js`): Borrador o Publicada; en muestras, Actual, Próxima, Finalizada o Permanente; en actividades, Realizada.
- **Botones:** en un borrador, "Guardar borrador" y "Publicar". En una publicada, "Guardar cambios" (aclara que salen al sitio al instante), "Ver en el sitio" y "Despublicar". "Ver en el sitio" abre la página pública con una ruta relativa (mismo host): antes del corte, en `mupa-web.onrender.com`; después, en `mupa.ar`.
- **Eliminar:** un `<dialog>` nativo con `showModal()` que nombra lo que se borra y propone: "Si solo querés que no se vea, despublicala".
- **Ediciones simultáneas:** gana el último guardado. El manual pide no editar la misma ficha a la vez; el aviso con control de versión está en la fase 2.
- **Cambios sin guardar:** `useBlocker` al cambiar de pantalla, más `beforeunload`. React Router admite un solo bloqueo por vez: una pantalla con varios formularios (Visitas, Mi cuenta) junta el `sucio` de cada uno en un solo `useCambiosSinGuardar` (E2, 14/10/2026); el diálogo de una tarifa cuenta, y con algo escrito Escape pregunta antes de descartar.

**Editor de texto** (`EditorTexto.jsx`):
- Configuración: `StarterKit.configure({ heading: { levels: [2] }, code: false, codeBlock: false, blockquote: false, horizontalRule: false, strike: false, underline: false, link: { openOnClick: false, autolink: true } })` y `ListItem.extend({ content: 'paragraph+' })`. Hay que verificar los nombres contra la documentación de TipTap 3.
- Barra: Negrita, Cursiva, Subtítulo, Lista, Lista numerada, Enlace (en un `<dialog>`) y Deshacer, con `aria-pressed`.
- Se guarda `editor.getJSON()`. El servidor lo valida con un zod recursivo: nodos `doc`, `paragraph`, `heading` (nivel 2), `bulletList`, `orderedList`, `listItem`, `text` y `hardBreak`; marcas `bold`, `italic` y `link` (`https:`, `http:`, `mailto:` o `tel:`; 500 caracteres como máximo); hasta 300 bloques; las claves desconocidas se descartan.
- El sitio lo dibuja `TextoRico.jsx` sin HTML crudo, con `<strong className="font-bold">` (por la trampa de `bolder` sobre el peso 300 que documenta CLAUDE.md).

### 5.5 Fotos en el panel

**`SubirFoto.jsx`:**
- `accept="image/jpeg,image/png,image/webp"`: Safari en iPhone convierte el HEIC a JPEG.
- Vista previa con `URL.createObjectURL`.
- **El alt es obligatorio antes de subir**, con una ayuda: "Describí lo que se ve: 'Cráneo de Herrerasaurus en la vitrina de la sala 2'". "Foto decorativa" deja `alt=""` y no se permite en la portada. Epígrafe y crédito, opcionales.
- Varias fotos se suben de a una, en cola.

**`Galeria.jsx`:** miniatura, alt editable, epígrafe y crédito; botones "Mover antes", "Mover después" y "Quitar", anunciados con `role="status"`. Sin arrastre (WCAG 2.5.7).

**Errores en castellano:** "La foto pesa 25 MB; el máximo es 20 MB." y "Esta foto está en formato HEIC. Exportala como JPG o elegí 'Más compatible' en el iPhone."

### 5.6 Accesibilidad del panel (WCAG 2.2 AA)

- **Navegación:** "Ir al contenido". Al cambiar de ruta, el foco va al `<h1>` y se actualiza `document.title`. `scroll-padding-top` evita que la barra tape el foco (2.4.11).
- **Formularios:** etiquetas visibles; al guardar con errores, un resumen arriba con enlaces y el foco puesto ahí, con `aria-invalid` y `aria-describedby` en los campos (3.3.1 y 3.3.3); "Guardado" con `role="status"` (4.1.3); se permite pegar y usar gestores de contraseñas (3.3.8), también en el diálogo de la temporal.
- **Táctil:** objetivos de 24 px como mínimo y 44 en el celular (2.5.8).
- **Celular:** alturas solo con `svh`.
- **Prueba:** teclado y NVDA en E6.1.

---

## 6. Sitio público

### 6.1 Rutas

Todas se arman en el servidor en cada pedido y se hidratan en el navegador.

| URL | Página | Datos | JSON-LD |
|---|---|---|---|
| `/` | Home (el `App.jsx` de hoy dentro de Layout) | `museo` | `WebSite` + `Museum` |
| `/exposiciones` | Exposiciones | Muestras actuales, próximas y permanentes publicadas; salas publicadas como secciones con ancla `#sala-<slug>` | `Museum` |
| `/exposiciones/:slug` | Muestra | La muestra, su sala y la galería. Si finalizó: 200 con "Finalizó el 30 de noviembre de 2026" | `Museum` |
| `/visitas` | Visitas | Horario, tarifas visibles, textos, aviso vigente, compra externa, "hoy" | `Museum` con `openingHoursSpecification` |
| `/novedades` | Novedades | "Próximas actividades" y las publicadas por fecha, 12 por página (`?pagina=`) | `Museum` |
| `/novedades/:slug` | Novedad | La novedad y su galería | `Museum` + `NewsArticle` |
| `/contacto` | Contacto | `museo`. Lee `?enviado=1`. El POST responde con `no-store` | `Museum` |
| todo lo demás | NoEncontrada | — | — |

**Reglas:**
- Un borrador da **404**. Lo finalizado o realizado da 200, porque Google ya lo indexó; no aparece en el listado (el archivo de muestras pasadas está en la fase 2).
- **Paginación:** `?pagina=1` responde 301 a `/novedades`. Una página que no es un entero ≥ 2 o que pasa del total da 404.
- Una sección sin contenido no se dibuja. Nunca se muestra "Contenido pendiente".
- **El cambio de DNS no se hace sin el contenido mínimo** (12.6).

### 6.2 Estado e hidratación

```js
{ pagina, ruta, datos, museo, hoy, medir, userway }
```

- **`cargar()` devuelve objetos planos** con fechas, precios y estados ya como texto: "Actual", "Finalizó el …", "$ 5.000", "Hoy (jueves)". Lo que se renderiza en el servidor es `JSON.parse` de lo mismo que se serializa (2.3).
- **Fechas:** `compartido/fechas.js` formatea con arrays propios de meses y días, nunca con `toLocaleDateString` al dibujar. "Hoy" sale de `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/San_Juan' })`, solo en el servidor. Los `datetime-local` se leen como `-03:00`, en una sola función.
- **`<head>`:** lo arma `seo.js`; no se usa el `<title>` de React 19.
- **Un solo bundle público**, que no puede importar zod: el formulario valida con atributos HTML. `rutas-check` busca zod en `dist/client/assets/*.js`. TipTap nunca entra en el bundle público.
- **Si el JS de la Home pasa de 342 kB** (+10 % sobre los 310.936 bytes de hoy): se separan las páginas con `import()` dinámico y `build.manifest`, con `modulepreload` por página, y **sin `React.lazy`** (en el servidor se hace `await import()` del módulo antes de `renderToString`, y en el cliente, antes de `hydrateRoot`; con `lazy`, el SSR emitiría el fallback y se perdería el contenido).

### 6.3 "Los cambios se ven al instante"

- **Sin caché de HTML:** cada pedido lee la base y renderiza. Lo que se guarda en el panel se ve en el pedido siguiente, y lo que cambia solo con el tiempo ("Próxima" → "Actual", el día de hoy) también.
- **Cabeceras:** HTML con `Cache-Control: no-cache` y ETag (304). **Nunca se cachea en el borde:** Edge Caching de Render en "Common static files", que deja afuera el HTML ([web-service-caching](https://render.com/docs/web-service-caching), 08/10/2026). Las respuestas públicas **nunca ponen cookies**.
- **Si la base falla:** la Home sale con el último `museo` bueno o con el pie mínimo; las demás rutas, una página 503 simple.
- **Si hiciera falta caché** (CPU alta en Metrics o TTFB peor que el criterio de 10.1): una caché corta de la Home, de pocos segundos (ver 14).

### 6.4 SEO por página

`seo.js` devuelve `{titulo, descripcion, ruta, imagen, tipoOg, jsonld[]}`.

| Página | Título y descripción |
|---|---|
| Home | Idénticos a los de hoy |
| Las demás | `title`: `<Título> · MuPa`. `description`: el resumen (≤ 160, cortado en una palabra) |

**En todas:** `canonical` y `og:url` con `URL_PUBLICA` + ruta, **siempre `https://mupa.ar/…` en producción**; `og:image` con el `og.jpg` de la portada y sus medidas (si no hay, `/og.jpg`); `noindex` (meta y cabecera) **si el host no es `mupa.ar`**.

**JSON-LD:** un `@graph` por página, escrito con `jsonEnScript()` (el mismo escape que el estado), con `@id` **absolutos** (`https://mupa.ar/#museo`, como hoy). Se omite todo campo vacío: no se inventan datos.
- **`Museum`**, en cada página: lo de hoy, más `address`, `telephone`, `email`, `sameAs` y `openingHoursSpecification` por franja (`dayOfWeek: https://schema.org/Monday`, `opens`, `closes`).
- **`NewsArticle`:** `headline` (≤ 110), `datePublished`, `dateModified`, `image` y `publisher`/`author` apuntando al museo.
- **`ExhibitionEvent` y `Event` quedan para la fase 2:** Google exige un `Place` con `address` ([datos estructurados de eventos](https://developers.google.com/search/docs/appearance/structured-data/event), actualizada el 08/09/2026) y la dirección todavía no está.
- Se valida con la Prueba de resultados enriquecidos en E4.6.

### 6.5 Sitemap, robots, 404 y Search Console

- **`/sitemap.xml`:** las rutas fijas y las muestras y novedades publicadas (también las finalizadas), con `lastmod = updated_at`. Nunca `/administracion`. En hosts que no son `mupa.ar` responde igual, pero nadie lo envía.
- **`/robots.txt`** (uno solo, para todo el host):

  ```
  User-agent: *
  Allow: /
  Sitemap: https://mupa.ar/sitemap.xml
  ```

- **`/administracion` no se bloquea en `robots.txt` a propósito:** todas sus respuestas llevan `X-Robots-Tag: noindex, nofollow`, y si se bloqueara el rastreo Google no vería ese `noindex` ([Google, bloquear la indexación](https://developers.google.com/search/docs/crawling-indexing/block-indexing), 08/10/2026).
- **404:** estado 404 real, con Layout y enlaces a las secciones.
- **Search Console:** `/google19017c966a32aec2.html` se sigue sirviendo desde `public/`, así la propiedad actual (prefijo de URL) sigue verificada después del corte. La **propiedad de dominio** (un TXT en Hostinger, que sobrevive a cualquier hosting) es opcional y queda para después del corte, porque necesita a la persona del museo con acceso a hPanel (11.3).

### 6.6 GA4 y UserWay

**GA4** (`analitica.js`):
- `iniciarAnalitica(estado)` mide solo si `estado.medir` (producción y host `mupa.ar`). Mantiene las condiciones de `webdriver`, DNT y GPC.
- `page_view` en cada carga. **`ver_*` y `abrir_*` solo si `estado.pagina === 'home'`**: hoy `medirSecciones()` busca cualquier `<footer>`, y las páginas internas, que son cortas, dispararían `ver_pie`.
- Se suman `enviar_contacto` (al cargar `/contacto?enviado=1`) y `clic_entradas`. Nunca en el panel.

**UserWay:** `https://cdn.userway.org/widget.js` con `data-account`, cargado con la página ya cargada y solo si hay ID. Sus dominios se confirman al integrarlo y van a la CSP. Hay que probar que no tape el indicador de scroll ni el menú y que dé CLS 0 con `vitals.mjs`.

### 6.7 Convivencia con la Home

**Header y menú:**
- **El header de la Home sigue siendo `absolute` y sube con el hero.** El menú (Exposiciones, Visitas, Novedades, Contacto, y "Comprar entradas" si está activa) va arriba a la derecha.
- **A la diseñadora se le pide primero el header con el menú, el menú móvil y el pie** (12.6).
- En celular, "Menú" abre un `<dialog>` a pantalla completa: `showModal()`; con Esc se cierra y el foco vuelve al botón; mientras está abierto, `lenis.stop()`, `overflow: hidden` en `html` y `overscroll-behavior: contain`; se prueba en el iPhone; a 375 px entran el logo de 260 y el botón.
- **Nada fijo ni sticky** que tape o corra los enganches.
- En las internas, el header va en el flujo. El logo pasa de `href="./"` a `href="/"` y se usa `aria-current="page"`.

**Pie:**
- Suma dirección, horario resumido, teléfono, correo, redes y la línea de privacidad (texto pendiente del museo).
- **Cambia el final de página del acordeón de Áreas** (`useAcordeonScroll` mide contra el largo del documento). Cada vez que cambie el pie: `acordeon-dedo.mjs` en `flick`, `apoyado` y `lectura --subir`, con y sin `--como-safari`, a 390x664, 375x635, 375x812 y 412x780, y `areas-check.js`.
- Con `SIN_BASE` se corren **dos veces**: con un `museo` "máximo" (todos los campos, 6 redes, dirección larga) y con uno vacío. Así lo que el museo cargue después queda dentro de lo probado.

**Se mantienen** `#identidad`, `#obra`, `#areas`, `#identidad-collage`, `[data-mosaico]` y `<main id="main">`.

**Lenis:** una sola instancia en Layout. `lenis.css` saca el puntero a los iframes mientras hay scroll: el mapa de Contacto se prueba con rueda a 1440x900.

**Reglas de Safari:** alturas solo con `svh`; el alto de la ventana, cacheado. Un solo `<h1>` por página.

**Verificación (H1 y E4.1):** todas las recetas en `ok: true` contra Express, hidratación sin diferencias, JS en ~311 kB y CSS en ~49,6 kB.

---

## 7. Fotos

**Recepción** (`POST /administracion/api/fotos`). Orden: sesión → rol → límite → multer → handler.
- multer 2.4.0 con `memoryStorage` y `{ fileSize: 20 MB, files: 1, fields: 10, parts: 12 }`. **Una foto por pedido.**
- Las versiones anteriores a la 2.1.0 tienen DoS publicados (CVE-2026-3304 y CVE-2026-2359; [Express security releases](https://expressjs.com/2026/02/27/security-releases.html), 27/02/2026).

**Tipo real:** `sharp(buf).metadata()`; se aceptan solo `jpeg`, `png` o `webp` (si no, 415). **Nunca SVG ni HEIC** (los binarios de sharp no leen HEIC: [sharp #1105](https://github.com/lovell/sharp/issues/1105)).

**Procesado** (`procesar.js`, dentro de `cola.js`: de a una, con 60 s de tope):

```js
sharp.concurrency(1); sharp.cache(false)
const base = sharp(buf, { limitInputPixels: 50_000_000 }).autoOrient()   // o .rotate() sin argumentos, según la versión
for (const ancho of [480, 960, 1600]) await base.clone().resize({ width: ancho, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
const maestra = await base.clone().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 90 }).toBuffer()
const og = await base.clone().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
```

- sharp borra EXIF y GPS salvo que se pida `keepMetadata()` ([sharp, salida](https://sharp.pixelplumbing.com/api-output), 08/10/2026). Lo verifica una prueba.
- La maestra permite regenerar tamaños si la diseñadora pide otros, y es lo que va a las copias.
- Sin deduplicación. La `clave` es aleatoria (`randomBytes(8)`): nunca se sobrescribe un archivo.

**Almacenamiento:** interfaz `guardar(clave, nombre, buffer)`, `abrir(clave, nombre)`, `borrar(clave)`, `existe(clave)`.

| | Disco (decidido) | Postgres (16.1, A RECONSIDERAR) |
|---|---|---|
| Dónde | `${DIR_FOTOS}/<clave>/{480,960,1600,2400}.webp` y `og.jpg`, escritos en `.tmp` y renombrados | `fotos_archivos (foto_id, variante, datos bytea)` |
| Orden | archivos → fila (transacción) → si la fila falla, se borran los archivos. Al borrar: fila y, **después del commit**, archivos | una sola transacción |
| Servido | `express.static(DIR_FOTOS, { immutable, maxAge: '1y', index: false, dotfiles: 'deny', fallthrough: false })` | handler propio por clave y variante, ETag = clave, `immutable`, LRU de ~32 MB en memoria |
| Tarea diaria | comprueba que existan los archivos de cada foto en uso y lista las faltantes en el Inicio ("Volvé a subir estas fotos") | — |
| Copia externa | "Descargar copia de las fotos" (admin) + `server/scripts/restaurar-fotos.js`: **3 h más** (E3.6) | dentro del export de la base |

**`Foto.jsx`:** `<img src=".../960.webp" srcset="480w, 960w, 1600w" sizes="…">`, con `width` y `height` reales (CLS 0), `alt` (o `""` si es decorativa), `loading="lazy"` salvo la portada de la ficha, `decoding="async"` y `<figcaption>` con epígrafe y crédito. **Regla de CLAUDE.md:** React precarga las imágenes que no son `lazy`, así que todo lo que no esté en el primer pantallazo lleva `loading="lazy"` o `fetchPriority="low"`.

**Borrado:**
- Al quitar una foto o eliminar su contenido, se borra en el momento si nadie más la usa (3.2). Las subidas que nunca se asociaron a nada se borran en la tarea diaria si tienen más de 24 h.
- Lo que el borde de Render ya cacheó sigue ahí hasta el próximo deploy. Para un retiro urgente (por ejemplo, una foto sin consentimiento) se usa "Purge cache" en el dashboard (paso en `docs/operacion.md`).
- Las URL de borradores no se pueden adivinar (64 bits), pero son públicas. Se acepta.

**Tarea diaria** (`tareas.js`):
- Corre a las 04:00 de San Juan, con `setTimeout` calculado, porque el cron de Render no ve el disco.
- Subtareas, cada una en su propio try/catch y con una línea de log: fotos huérfanas, sesiones vencidas, fotos faltantes (con disco), mensajes de contacto de más de 180 días y verificación de la casilla de envío (8).
- Si una falla dos días seguidos, aparece en el Inicio.

**Opcional:** achicar la foto en el navegador a 2400 px antes de subirla, si en 10.1 la memoria pasa de ~400 MB.

---

## 8. Correo: el formulario de contacto

**Qué hay y qué no:**
- El único correo del sitio es el del formulario, en un solo sentido: el visitante escribe y el mensaje llega a la **dirección de destino** que el admin elige en Datos del museo (la del museo u otra cualquiera, por ejemplo un Gmail).
- No hay respuesta automática al visitante, ni mails del panel (4.4), ni servicio de correo transaccional, ni registros DNS nuevos.

**Casilla de envío:**
- Una casilla de Hostinger dedicada al sitio, p. ej. `web@mupa.ar`. La crea una persona del museo con acceso a hPanel (Emails), con el instructivo de 11.1 y, mejor, en una llamada con el desarrollador. La contraseña se carga en Render en esa misma llamada o se le pasa al desarrollador por un canal seguro (nunca por mail ni WhatsApp).
- Conviene que no sea la casilla con la que se recuperan Render, GitHub y Google: su contraseña queda guardada en Render (10.6).
- `smtp.hostinger.com`, puerto 465 con SSL o 587 con STARTTLS ([Hostinger](https://www.hostinger.com/support/4305847-set-up-hostinger-email-on-your-applications-and-devices/), 08/10/2026).
- Límite por casilla: 100 envíos por día en el correo gratuito o de prueba del hosting, 1.000 en Business Starter ([Hostinger](https://www.hostinger.com/support/4625828-how-to-create-and-manage-hostinger-email/), modificada el 15/09/2026). Qué plan tiene el museo lo mira esa persona en hPanel → Emails (pregunta del mail de E0.1).

**DNS: no se toca.** La zona ya tiene `v=spf1 include:_spf.mail.hostinger.com ~all` en la raíz, el DKIM de Hostinger (`hostingermail-a._domainkey`) y `_dmarc` con `p=none` (leído con DNS públicos el 08/10/2026). Un mail con From `web@mupa.ar` que sale por `smtp.hostinger.com` pasa SPF, DKIM y DMARC. Se comprueba en E5.1 con "Mostrar original" en Gmail.

**`server/correo.js`** (nodemailer 10):

```js
const transporte = nodemailer.createTransport({
  host: config.SMTP_HOST, port: config.SMTP_PUERTO,
  secure: config.SMTP_PUERTO === 465, requireTLS: config.SMTP_PUERTO === 587,
  auth: { user: config.SMTP_USUARIO, pass: config.SMTP_CLAVE },
  connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
})
export async function enviarContacto({ nombre, email, mensaje }, destino) {
  await transporte.sendMail({
    from: { name: 'Formulario de mupa.ar', address: config.SMTP_USUARIO },  // nunca el visitante
    to: destino,                                                         // email_destino_contacto, leído en el momento
    replyTo: { name: nombre, address: email },
    subject: `Consulta desde mupa.ar: ${unaLinea(nombre)}`,
    text: `${mensaje}\n\n${nombre} <${email}>\n${fechaEnSanJuan()}`,
  })
}
```

- **Modos** (`CORREO_MODO`): `smtp`, `consola` (local) y `memoria` (pruebas). **En producción solo `smtp`**: `config.js` no arranca con otro, porque `consola` escribiría los mensajes del público en los logs. Sin `SMTP_USUARIO`, el formulario queda apagado y el Inicio lo avisa.
- **Estado del correo** (en memoria): `{ ok, codigo, en }` del último intento. Se actualiza con `transporte.verify()` al arrancar y en la tarea diaria, y con cada envío.
- **Errores:** una línea de log `correo_fallido` con el código de nodemailer (`EAUTH`, `ETIMEDOUT`, `ECONNECTION`…), sin direcciones ni texto.
- **`npm run probar-correo -- --para <dirección>`** manda un mail de prueba con la configuración real. Se usa en el primer deploy y cada vez que cambie la clave de la casilla.

**Formulario** (`GET` y `POST /contacto`, sin JS):
1. Se muestra si hay dirección de destino cargada y casilla configurada. Si no, se muestran el correo público y el teléfono.
2. El `<form method="post" action="/contacto">` lleva nombre, correo, mensaje y un **campo trampa** `sitio_web`, oculto con una clase CSS, `tabindex="-1"`, `aria-hidden="true"` y `autocomplete="off"`. Si viene con algo, se responde 303 sin guardar ni enviar.
3. El servidor:
   - **Valida:** CSRF por origen (4.6), límites (4.7) y zod (nombre ≤ 100 y sin saltos de línea, correo válido, mensaje de 10 a 5.000 caracteres con 3 enlaces como máximo).
   - **Guarda** una fila en `mensajes_contacto` con `envio = 'pendiente'`.
   - **Envía** con `enviarContacto()` y `await`, con los topes de tiempo de arriba. La fila pasa a `enviado`, o a `fallido` con el código.
   - **Si quedó guardado** (aunque el envío haya fallado): 303 a `/contacto?enviado=1#formulario`. El museo lo ve en Mensajes y el Inicio avisa.
   - **Si fallaron el guardado y el envío:** vuelve a dibujar la página (503) con los valores y "No pudimos enviar tu mensaje. Probá más tarde o escribinos a <correo público>".
   - **Si hay errores de validación:** vuelve a dibujarla (400, `no-store`) con los valores y los mensajes.
4. **Aviso en el Inicio** (`/administracion/api/estado`, para todos los roles): "Los mensajes del formulario no se están enviando por correo desde <fecha> (N guardados en Mensajes). Si cambió la contraseña de `web@mupa.ar`, hay que actualizarla en Render (`docs/operacion.md`)". Sale con el estado del correo en falla o con mensajes `fallido` posteriores al último `enviado`.
5. Si llega spam, se suma Turnstile en la fase 2 ([planes de Turnstile](https://developers.cloudflare.com/turnstile/plans/), 08/10/2026).
6. Debajo del formulario va el texto de privacidad del museo (pendiente), que dice que el mensaje se guarda 180 días.

**Mensajes en el panel** (`/mensajes`, solo admin):
- Lista de solo lectura, de la más nueva a la más vieja, 50 por página: fecha, nombre, correo (enlace `mailto:`), mensaje y "Enviado por correo" o "No se pudo enviar".
- Sin borrar, responder ni reintentar (el reintento está en la fase 2). La tarea diaria borra los de más de 180 días.

**Si Render bloquea SMTP:** Render bloquea los puertos 25, 465 y 587 solo en las instancias gratuitas ([changelog del 16/09/2025](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)); en Starter no está confirmado en la práctica. Se prueba en E5.1 con 465 y, si no conecta, con 587. Si ninguno sale, el formulario igual guarda los mensajes y se le plantea al desarrollador una alternativa antes de seguir (por ejemplo, un proveedor con API HTTPS, que sí suma registros DNS).

---

## 9. Seguridad: controles concretos

**El panel en el mismo origen que el sitio**
- [ ] El panel, su API y la cookie viven solo bajo `/administracion`. La cookie lleva `Path=/administracion`: ninguna respuesta pública la pone ni la recibe (prueba en `ssr.test.js`).
- [ ] `/administracion/*` no carga scripts de terceros: CSP propia con `script-src 'self'`, `connect-src 'self'` y `frame-ancestors 'none'`, y el bundle del panel no importa `analitica.js` ni UserWay. GA4 y UserWay van solo en las páginas públicas.
- [ ] El panel no guarda nada en `localStorage` ni en `sessionStorage`: se comparten con las páginas públicas.
- [ ] Sesión de 2 h sin actividad y 12 h como máximo, Salir siempre visible y, en el manual y la capacitación, la recomendación de cerrar sesión al terminar.
- **Riesgo residual, aceptado por el desarrollador (08/10/2026):** el panel comparte origen con las páginas públicas, que cargan UserWay y Google Analytics. Si uno de esos scripts fuera comprometido, podría actuar con la sesión de un administrador que tenga el panel abierto en el mismo navegador mientras visita el sitio público (por ejemplo, después de "Ver en el sitio"). Dentro de un mismo origen no hay aislamiento completo: ni la ruta de la cookie ni un token en la página lo impiden. Lo acotan los cuatro puntos de arriba y los límites de intentos (4.7). Si algún día hiciera falta aislarlo del todo, el panel puede pasar a un subdominio propio, con un cambio de DNS.

**Transporte y cabeceras**
- [ ] HTTPS de Render. HSTS sin `includeSubDomains`: 1 día durante la transición y 180 días a las 2 semanas estables (con un commit).
- [ ] CSP de las **páginas públicas** (todo lo que no es `/administracion`), fija y obligatoria desde el primer deploy:

  ```
  default-src 'self'; script-src 'self' https://*.googletagmanager.com https://*.userway.org;
  connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.userway.org;
  img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com https://*.userway.org;
  style-src 'self' 'unsafe-inline' https://*.userway.org; font-src 'self' https://*.userway.org;
  frame-src https://www.google.com https://*.userway.org; frame-ancestors 'self';
  base-uri 'self'; form-action 'self'; object-src 'none'
  ```

  - Los comodines de GA salen de la [guía de CSP de Google](https://developers.google.com/tag-platform/security/guides/csp) (08/10/2026). `www.google.com` está porque gtag manda a `/g/collect` ahí (CLAUDE.md, 01/10/2026). UserWay se confirma al integrarlo.
  - `'unsafe-inline'` en estilos hace falta por los `style=` del SSR. No hay scripts inline: el estado y el JSON-LD no se ejecutan.
  - **Se prueba una vez**, antes del corte: en el build local de producción con `analitica-check.mjs --ver-envios`, `vitals.mjs --consola` (sin violaciones) y UserWay cargado; otra vez contra Render; y en el iPhone (el desarrollador). Si UserWay o Google cambian de dominios, se ve en la consola: está en la revisión mensual (10.4).
- [ ] CSP del **panel**, en toda respuesta de `/administracion` y `/administracion/…` (sin ningún dominio de terceros):

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none';
  base-uri 'none'; form-action 'self'; object-src 'none'
  ```

  En desarrollo (`npm run dev`) suma `'unsafe-inline'` en `script-src` y `ws:` en `connect-src`, por el Vite del panel; en producción es exactamente esta (verificado al cerrar E2, 14/10/2026). zod va con `jitless` para no chocar con `script-src 'self'` (5.1).

- [ ] `nosniff`, `Referrer-Policy` y sin `X-Powered-By`. En `/administracion/*`, `X-Robots-Tag: noindex, nofollow` siempre (también con el host `mupa.ar`) y `no-store` salvo en sus assets.
- [ ] Redirecciones normalizadas: `GET //evil.com/` nunca devuelve un `Location` externo.

**Autenticación**
- [ ] argon2id, claves de 15 a 128 caracteres, rechazo de las contextuales y hash de relleno.
- [ ] Mensajes genéricos al ingresar; la temporal vencida se informa solo después de verificar la clave.
- [ ] Sesiones en tabla, cookie `__Secure-` con `Path=/administracion`, 2 h sin actividad y 12 h como máximo. Token nuevo en cada inicio de sesión. Se revoca al salir, al cambiar la clave, al recibir una temporal y al desactivar a alguien.
- [ ] Contraseñas temporales: 80 bits generados por el servidor, solo el hash en la base, mostradas una vez, nunca en logs, 72 h, cambio obligatorio (`debe_cambiar_clave` corta toda otra ruta).
- [ ] La llave de emergencia solo corre desde el Shell de Render.
- [ ] Límites de 4.7, con el bloqueo por correo + IP.
- [ ] `trust proxy` como **número**, verificado con un `X-Forwarded-For` falso (10.1).

**Autorización**
- [ ] `requiereSesion` en el montaje y `requiereRol('admin')` en usuarios, mensajes y copia. El correo de destino se controla por campo.
- [ ] El último admin está protegido.
- [ ] `permisos.test.js` recorre todas las rutas.

**Entrada**
- [ ] zod en todo, y solo lo validado llega a Sequelize, siempre con `replacements`.
- [ ] Texto con formato validado nodo por nodo. URLs de redes, mapa, compra e inscripción solo `https:`. Slugs con patrón.
- [ ] Formulario: nombre sin saltos de línea (no llega al asunto como cabecera), Reply-To armado por nodemailer, nunca From del visitante.

**Salida**
- [ ] Ningún `dangerouslySetInnerHTML` (prueba con grep).
- [ ] Una sola `jsonEnScript()` para el estado y el JSON-LD. Los valores del `<head>` van escapados como HTML.
- [ ] La plantilla se concatena, sin `.replace` con texto.
- [ ] `museoPublico()` sin el correo de destino.

**Archivos**
- [ ] Sesión antes de multer, límites, tipo verificado por sharp, sin SVG ni HEIC, `limitInputPixels` y metadatos borrados.
- [ ] Nombres al azar, `nosniff` y `dotfiles: 'deny'`.

**Comandos destructivos**
- [ ] `ayudas.js` se niega si la base no está en localhost o no termina en `_test`.
- [ ] `migrar:atras` en producción exige `--confirmo-borrar-datos`.
- [ ] Al terminar una tarea con la base abierta a una IP, se vuelve a cerrar `ipAllowList`.

**Secretos y cuentas**
- [ ] Solo en variables de Render; `SMTP_CLAVE` con `sync: false`. `.env` fuera del repo; `.env.example` sí se versiona.
- [ ] Al entregar, el museo cambia la clave de la casilla de envío, la actualiza en Render y corre `probar-correo`.
- [ ] 2FA en Render, GitHub y Google con el autenticador del museo, con un **correo de recuperación secundario fuera de `mupa.ar`** y **códigos de recuperación impresos** (10.6).
- [ ] La base con `ipAllowList: []`. Copias de producción, siempre fuera de OneDrive.

**Privacidad (Ley 25.326)**
- [ ] Sin IP ni correos en los logs (tampoco en `correo_fallido`).
- [ ] Mensajes del formulario: los ve solo un admin, se borran a los 180 días y se vacían en cualquier copia local.
- [ ] GA4 con la configuración actual; la línea de privacidad en el pie y el texto del formulario mencionan los mensajes guardados.

**Dependencias y disponibilidad**
- [ ] Dependabot (alertas y PR de seguridad) en la organización. `npm audit` antes de cada entrega. Node 24 fijo.
- [ ] Límites de cuerpo, tope diario del formulario, `sharp.concurrency(1)`, apagado ordenado, `/salud` sin la base y el último `museo` bueno en memoria.

---

## 10. Operación

### 10.1 Render: Blueprint y primer deploy

```yaml
# render.yaml (campos verificados en https://render.com/docs/blueprint-spec, 08/10/2026)
services:
  - type: web
    name: mupa-web
    runtime: node
    region: virginia                 # no se puede cambiar después
    plan: 0.5c-512mb                 # Starter, USD 7
    branch: master
    autoDeployTrigger: off           # se despliega a mano y de noche
    buildCommand: npm ci --include=dev && npm run build
    preDeployCommand: npm run migrar
    startCommand: npm start
    healthCheckPath: /salud
    maxShutdownDelaySeconds: 30
    disk: { name: fotos, mountPath: /var/data, sizeGB: 1 }   # solo con disco (16.1)
    envVars:
      - { key: NODE_ENV, value: production }
      - { key: DATABASE_URL, fromDatabase: { name: mupa-db, property: connectionString } }
      - { key: URL_PUBLICA, value: "https://mupa.ar/" }
      - { key: DIR_FOTOS, value: /var/data/fotos }           # solo con disco
      - { key: CORREO_MODO, value: smtp }
      - { key: SMTP_HOST, value: smtp.hostinger.com }
      - { key: SMTP_PUERTO, sync: false }                     # 465; 587 si 465 no conecta
      - { key: SMTP_USUARIO, sync: false }                    # web@mupa.ar
      - { key: SMTP_CLAVE, sync: false }
      - { key: CANONICO, sync: false }                        # 0 hasta el corte
      - { key: TRUST_PROXY, sync: false }
      - { key: USERWAY_ID, sync: false }
databases:
  - name: mupa-db
    region: virginia
    plan: 0.1c-256mb                 # Basic 256 MB, USD 6
    postgresMajorVersion: "17"
    diskSizeGB: 1                    # 1 o múltiplos de 5; si se omite, Basic arranca en 15 GB
    ipAllowList: []                  # sin conexiones externas
```

- **Valores que cambian:** van con `sync: false`, así un sync del Blueprint no los vuelve a poner como en el yaml. Render los pide al crear el Blueprint y después los ignora.
- **Auto Sync:** en el dashboard, Blueprint → Settings → **Auto Sync: No**. Se sincroniza a mano.
- **Edge Caching:** "Common static files".
- **`--include=dev`:** hace falta porque con `NODE_ENV=production` `npm ci` saltea Vite.

**Comprobaciones del primer deploy (E5.1):**
1. `/salud` y `/salud/base` responden 200. `SequelizeMeta` tiene las 6 migraciones.
2. **Panel:** `https://mupa-web.onrender.com/administracion` carga con la CSP del panel, `X-Robots-Tag: noindex` y `no-store`, sin pedidos a terceros. No hace falta DNS ni dominio propio.
3. Desde el Shell, `npm run crear-admin -- …`: imprime la temporal; se entra a `https://mupa-web.onrender.com/administracion`, se cambia la clave y se ve el Inicio. En las herramientas del navegador, la cookie sale como `__Secure-mupa_sesion` con `Path=/administracion`, y las páginas públicas no la reciben.
4. **`trust proxy` y Host:**
   - con `DEPURAR_IP=1`, `/salud/ip` devuelve `req.ip`, `X-Forwarded-For` y el `Host` crudo
   - se ajusta `TRUST_PROXY` (un número) hasta que `req.ip` sea la IP de quien prueba
   - después, `curl -H "X-Forwarded-For: 203.0.113.7" https://mupa-web.onrender.com/salud/ip` tiene que **seguir mostrando la IP real** ([Express detrás de proxies](https://expressjs.com/en/guide/behind-proxies.html), 08/10/2026)
   - el `Host` tiene que llegar crudo como `mupa-web.onrender.com` (y después del corte, `mupa.ar`): la redirección canónica, el `noindex` y GA4 dependen de eso
   - al terminar, `DEPURAR_IP` se apaga
5. **Correo** (cuando la casilla de envío exista: la crea la persona del museo con el instructivo de 11.1): `npm run probar-correo -- --para <un Gmail>` con `SMTP_PUERTO=465`. Si da `ETIMEDOUT` o `ECONNECTION`, se prueba 587. En Gmail, "Mostrar original": SPF, DKIM y DMARC en PASS. Si ningún puerto sale, se sigue con lo de 8 ("Si Render bloquea SMTP").
6. **Compresión:** `curl -sI -H "Accept-Encoding: br" https://mupa-web.onrender.com/` tiene que traer `content-encoding`. Si no, se suma `compression`.
7. **Memoria:** subir una foto de 12 MP y mirar el pico en Metrics. Si pasa de ~400 MB, se activa el achique en el navegador.
8. **Rutas:** `node tools/rutas-check.mjs --url https://mupa-web.onrender.com/` (ahí espera `noindex`).
9. **Velocidad:** `node tools/vitals.mjs --url https://mupa-web.onrender.com/ --perfil movil --veces 5`:

   | Medida | Hoy en producción (teléfono) | Criterio |
   |---|---|---|
   | FCP | 2,38 s | ≤ 2,6 s |
   | LCP | 3,16 s | ≤ 3,5 s |
   | TBT | 0,72 s | — |
   | LCP en escritorio | 0,87 s | — |

### 10.2 Costos mensuales

En USD, al 08/10/2026. Los paga el museo.

| Concepto | USD/mes | Fuente |
|---|---|---|
| Workspace Hobby (1 miembro, sin cuota fija) | 0 | [new-workspace-plans](https://render.com/docs/new-workspace-plans) |
| Servicio web 0,5 CPU / 512 MB | 7,00 | [render.com/pricing](https://render.com/pricing) |
| Postgres Basic 256 MB | 6,00 | ídem |
| Almacenamiento de la base, 1 GB | 0,30 | ídem |
| Disco persistente, 1 GB (solo con disco) | 0,25 | ídem |
| Ancho de banda: 5 GB incluidos | 0, y 0,15 por GB extra | [changelog del 23/04/2026](https://render.com/changelog/updated-plans-for-render-workspaces) |
| Dominios propios: 2 incluidos (`mupa.ar` y `www.mupa.ar`; el panel no suma dominio) | 0, y 0,25 por cada extra | [custom-domains](https://render.com/docs/custom-domains), 08/10/2026 |
| Casilla de envío (dentro del correo de Hostinger que ya tiene el museo; lo confirma en hPanel la persona del museo), GitHub Free, GA4, Search Console, UserWay gratuito | 0 | — |
| **Total** | **13,55** (13,30 con 16.1), + el excedente de tráfico | |
| Pagando en pesos con tarjeta (IVA 21 % RG 4240 + percepción 30 % RG 5617) | **≈ 20,50** | [ARCA](https://www.arca.gob.ar/iva/servicios-digitales/reg-percepcion-4240.asp), [iProUP, 09/2026](https://www.iproup.com/finanzas/71541-percepciones-30-por-ciento-arca-como-recuperar-devolucion-septiembre-2026) |

- Los "USD 16" se cumplen en dólares y sin impuestos.
- 5 GB alcanzan para unas 2.500-5.000 primeras visitas a la Home por mes. Es una estimación, no una medición.
- **La facturación empieza con el primer deploy (S2)**, alrededor de un mes antes de la salida al público. Se avisa por escrito en E0.1.
- Un organismo público puede tener otro tratamiento impositivo; que lo confirme su administración.
- Si el plan de correo actual no admitiera otra casilla, lo ve en hPanel la persona del museo antes de crearla (11.1).

### 10.3 Copias de seguridad y restauración

| Qué | Cómo | Retención | Quién |
|---|---|---|---|
| Base | PITR automático de Render | **3 días** en Hobby ([postgresql-backups](https://render.com/docs/postgresql-backups), 08/10/2026) | Render |
| Base | "Create export" en el dashboard, mensual, descargado al Drive del museo | 7 días en Render; sin límite en el Drive | **El museo** (una carilla en `docs/operacion.md` y recordatorio en su calendario) |
| Fotos (disco) | Snapshot diario, que solo se restaura entero | ≥ 7 días ([disks](https://render.com/docs/disks), 08/10/2026) | Render |
| Fotos (disco) | "Descargar copia de las fotos" en el panel, mensual | Drive | **El museo** |
| Fotos (Postgres) | Van dentro de las dos copias de la base | | |

**Restaurar la base sin que el Blueprint la pise** (documentado en `docs/operacion.md`; no se ensaya contra producción):
1. Recovery → base nueva `mupa-db-AAAAMMDD`. Revisar su `ipAllowList` y dejarla sin acceso externo.
2. En `render.yaml`, `DATABASE_URL` pasa a `sync: false`. Commit y **sync manual**: Render deja de administrar esa variable.
3. En el dashboard, pegar en `DATABASE_URL` la URL interna de la base recuperada. Se redespliega.
4. Comprobar **desde el sitio publicado** que el contenido es el correcto.
5. Sacar `mupa-db` del yaml, hacer sync manual y **recién ahí** borrar a mano la base vieja. Si no, el sync la recrea vacía ([IaC](https://render.com/docs/infrastructure-as-code), 08/10/2026).

**Ensayo (E5.3, antes del contenido real):**
- "Create export" en el dashboard, `pg_restore` en un Postgres local vacío en `C:\mupa-datos`, `npm start` contra esa base y comprobar que las páginas y el panel muestran lo mismo. Después se borra.
- Con disco: descargar la copia de las fotos y restaurarla en local con `restaurar-fotos.js`.
- En el dashboard, confirmar que la ventana de PITR está disponible.

### 10.4 Monitoreo y logs

**Avisos:**
- `/salud` es el health check: Render deja de mandar tráfico a los 15 s y reinicia a los 60 s ([health-checks](https://render.com/docs/health-checks), 08/10/2026). Por eso no mira la base.
- `/salud/base`, para un monitor externo gratuito opcional (revisar sus condiciones al crearlo).
- Las notificaciones de Render van al correo de la cuenta del museo.
- El Inicio del panel avisa del correo, las tareas diarias fallidas y las fotos faltantes.

**Logs:** una línea JSON por pedido a `/administracion/api` y por error (`{t, nivel, metodo, ruta, estado, ms}`), sin IP, sin cuerpos y sin cookies. Render los guarda 7 días. `unhandledRejection` y `uncaughtException` se registran y el proceso sale.

**Después de cada deploy:** `node tools/rutas-check.mjs --url https://mupa.ar/`. Falla si aparece `noindex` o un canonical que no empiece con `https://mupa.ar/`.

**Revisión mensual de 15 min**, en `docs/operacion.md`: ancho de banda, memoria y CPU en Render; cobertura en Search Console; GA4 (que siga midiendo) y la consola del sitio sin violaciones de CSP; el Inicio del panel sin avisos; `npm audit`; y si se hicieron las copias del mes.

### 10.5 Actualizaciones

- **La garantía (60 días) cubre defectos**, no tareas periódicas.
- Dependabot abre PR de seguridad solos. Aplicar uno es revisarlo, unir, desplegar a mano y correr `rutas-check`.
- **Después de la garantía, nadie aplica parches si no se acuerda quién lo hace.** Queda escrito en el acta.
- Las versiones mayores (Express, React, Sequelize 7) son trabajos aparte.
- Node 24 queda fijo. Pasar a otra versión mayor de Postgres es una restauración a una base nueva.

### 10.6 Cuentas a nombre del museo y entrega

| Cuenta | Titular | Desarrollador | Al entregar |
|---|---|---|---|
| Casilla institucional para las cuentas (p. ej. `sistemas@mupa.ar`) | museo | acceso temporal (ahí llegan los códigos) | El museo cambia la clave |
| Correo de recuperación secundario, **fuera de `mupa.ar`** | museo | — | Se configura en Render, GitHub y Google |
| Casilla de envío del sitio (`web@mupa.ar`) | museo (la crea una persona con acceso a hPanel, 11.1) | — (su clave se carga en Render) | El museo cambia la clave, la actualiza en `SMTP_CLAVE` y corre `probar-correo` |
| Render (Hobby: **un solo miembro**) | museo | entra con esa cuenta; un usuario propio exige el plan Pro (USD 25/mes) | Clave y 2FA nuevos; medio de pago del museo en Billing |
| GitHub (organización, p. ej. `museo-mupa`) | museo | colaborador | Se transfiere el repo; el desarrollador sale o queda como colaborador |
| GA4 (`G-KX4G76DL91`) | creada por el desarrollador | admin | El museo como admin; el desarrollador baja a lector |
| Search Console | verificada por el desarrollador | propietario | El museo como propietario (TXT) |
| Bing Webmaster Tools | importada por el desarrollador | — | Se suma un usuario del museo |
| UserWay | museo | — | — |
| Hostinger (DNS, correo, landing) | museo | sin acceso: los cambios los hace una persona del museo con el instructivo de 11. Opcional: acceso delegado (abajo) | Si hubo acceso delegado, el titular lo revoca |
| NIC Argentina | titular del dominio (a confirmar) | — | — |
| Panel | una cuenta por persona, **dos admins** | "Soporte" (admin) | El museo la desactiva al terminar la garantía |

**Acceso delegado a Hostinger (opcional, no es requisito):** el titular de la cuenta de Hostinger puede darle al desarrollador acceso solo al DNS y al correo de `mupa.ar` con la función de compartir acceso de hPanel (con el alcance más chico que permita), y revocarlo después del corte. Así la casilla y el corte no dependen de coordinar una llamada. Si no se consigue, el plan funciona igual: los pasos son los mismos y los hace la persona del museo.

**Plan B del medio de pago:** si el del museo no está para S2, el workspace se crea igual **a nombre del museo, con su casilla**, y con un medio de pago provisorio; el museo carga el suyo en Billing del mismo workspace. Cómo se resuelve lo facturado mientras tanto queda por escrito en E0.1.

**Entrega de credenciales:**
- Nunca por mail ni WhatsApp. En una videollamada o en persona, el museo pone sus claves y su 2FA (también la de la casilla de envío, directo en Render).
- **Acta de entrega**, sin contraseñas, con: por cuenta, titular, correo de recuperación, dispositivo del 2FA y dónde están los **códigos de recuperación impresos**; quién aplica los parches después de la garantía; fecha de inicio de la garantía.
- En `docs/operacion.md`: la **llave de emergencia** (`crear-admin` y `restablecer-admin` desde el Shell de Render, paso a paso); el cambio de la clave de la casilla de envío; el orden para irse de Render (primero el DNS, `A @` y `www`, con la persona del museo que tenga acceso a hPanel; después se borra el servicio); a qué casilla llegan las facturas y qué hacer si rechazan la tarjeta.

---

## 11. Puesta en producción

**Quién toca qué.** El desarrollador no tiene acceso a hPanel de Hostinger. Lo que pasa por ahí lo hace **una persona del museo con acceso a hPanel**, con estas instrucciones escritas y, mejor, en una videollamada con el desarrollador. Son solo dos cosas:
- **(a)** crear la casilla de envío `web@mupa.ar` (11.1), y
- **(b)** el día del corte, cambiar el DNS de `mupa.ar` (11.2).

**Antes del corte el DNS no se toca.** El sitio público se ve en `https://mupa-web.onrender.com` con `noindex` y el panel en `https://mupa-web.onrender.com/administracion`; el museo carga su contenido ahí. Si el titular de la cuenta da acceso delegado (10.6), los pasos son los mismos y los hace el desarrollador.

**Por qué no hay `nuevo.mupa.ar` ni otro subdominio de prueba:** cada uno es un cambio en hPanel. Todo se prueba antes en `mupa-web.onrender.com`, con certificado de Render. El certificado de `mupa.ar` se emite recién el día del corte, por eso ese día va con el TTL bajo, en un horario temprano y con la vuelta atrás lista.

**Fase A: primer deploy** (E5.1, S2, cuando estén la cuenta y el medio de pago; no depende del DNS ni de hPanel): lo de 10.1, con `CANONICO=0`. La prueba de correo, cuando exista la casilla de envío (11.1).

**Fase B: preparación de la entrega** (E5.2-E5.3 y E5.5, S5)
1. Contra `https://mupa-web.onrender.com/`: `rutas-check.mjs`, todas las recetas con `--url` y `vitals.mjs --consola` sin violaciones de CSP ni errores; `analitica-check.mjs --ver-envios` contra el build local de producción (2.5); la consola del iPhone sin violaciones.
2. Un envío real del formulario, que llega a la dirección de destino y aparece en Mensajes.
3. Ensayo de restauración (10.3), manual y capacitación. El museo empieza a cargar contenido en `https://mupa-web.onrender.com/administracion`.
4. **Entrega (H6):** acta y comienzo de la garantía.

### 11.1 Instructivo: crear la casilla de envío (persona del museo, ~20 min en una llamada)

| Paso | Qué hace la persona del museo en hPanel | Qué verifica el desarrollador |
|---|---|---|
| 1 | En Emails, mirar el plan de correo de `mupa.ar`: cuántas casillas admite y cuántos envíos por día. Si no admite otra, se frena acá y se decide con el desarrollador | Anota el límite diario (el tope del formulario es 50, 4.7) |
| 2 | Crear la casilla `web@mupa.ar` con una contraseña nueva y larga (una frase de 4 palabras o generada), que no se use en ningún otro lado. Sin reenvíos ni respuesta automática | — |
| 3 | En la misma llamada, escribir la contraseña directamente en Render (la cuenta del museo; Environment → `SMTP_CLAVE`, con `SMTP_USUARIO` = `web@mupa.ar`), guiada por el desarrollador. Si no se puede, pasársela al desarrollador por un canal seguro (por ejemplo, un enlace de un solo uso de un gestor de contraseñas), **nunca por mail ni WhatsApp** | Render redespliega. `npm run probar-correo -- --para <un Gmail>` desde el Shell (10.1, paso 5): llega, y en "Mostrar original" SPF, DKIM y DMARC dan PASS. El Inicio del panel no muestra el aviso del correo |
| 4 | Nada más: no se toca el DNS ni otra casilla | — |

### 11.2 Fase C: corte del dominio (instructivo para la persona del museo)

**Cuándo:** dentro de los 10 días hábiles después de que el museo confirme por escrito el contenido mínimo (12.6). Un día hábil, en un horario de poco tráfico (por ejemplo, 08:00), con la persona del museo y el desarrollador en videollamada: unos 15 minutos el día anterior y alrededor de una hora el día del corte. La persona del museo queda en la llamada hasta que el desarrollador confirme que todo anda, por si hay que volver atrás.

**Qué cambia para el personal:** el panel pasa a `https://mupa.ar/administracion`. Las sesiones abiertas en `mupa-web.onrender.com` no pasan al dominio nuevo: hay que volver a entrar, con la misma contraseña (el gestor de contraseñas del navegador puede no ofrecerla, porque es otro dominio). El contenido es el mismo.

**Valores de hoy** (leídos de los DNS públicos el 08/10/2026; se vuelven a leer en T−48 h): `A @` = `212.85.9.20`, `AAAA @` = `2a02:4780:13:820:0:b30:3a8a:7`, `www` = `CNAME mupa.ar`.

| Momento | Quién | Paso | Qué verifica el desarrollador |
|---|---|---|---|
| T−48 h | Museo y desarrollador | Confirmación escrita del contenido mínimo. El desarrollador guarda la zona completa en `docs/operacion.md` y anota el vencimiento del certificado de Hostinger: marca hasta cuándo se puede volver atrás | `Resolve-DnsName <nombre> -Type <A,AAAA,MX,TXT,CNAME> -Server 8.8.8.8` para `@`, `www`, `_dmarc`, `hostingermail-a._domainkey`, `autodiscover` y `autoconfig`, sin hPanel |
| T−24 h | Desarrollador | En Render, Settings → Custom Domains: agregar `mupa.ar` y `www.mupa.ar`. Render muestra los registros a cargar (hoy `A @ → 216.24.57.1` y `CNAME www → mupa-web.onrender.com`); si muestra otros, mandan los de Render y se corrige este instructivo | Captura de lo que muestra Render. Los dominios quedan pendientes de verificación; el sitio actual no se entera |
| T−24 h | Persona del museo | 1. Captura de pantalla de la tabla de registros DNS de `mupa.ar`, antes de tocar nada. 2. En el `A` de `@`, el `AAAA` de `@` y el `CNAME` de `www`, cambiar **solo el TTL a 300**, sin cambiar el valor. Guardar | `Resolve-DnsName mupa.ar -Type A -Server ns1.dns-parking.com` (y `AAAA`, y `www.mupa.ar -Type CNAME`) da TTL 300 y los valores de siempre. El MX sigue igual |
| D, paso 1 | Persona del museo | Editar el `A` de `@`: de `212.85.9.20` a **`216.24.57.1`**. Guardar | `Resolve-DnsName mupa.ar -Type A -Server ns1.dns-parking.com` da `216.24.57.1`; en pocos minutos, también contra `1.1.1.1` y `8.8.8.8` |
| D, paso 2 | Persona del museo | **Borrar** el `AAAA` de `@` (`2a02:4780:13:820:0:b30:3a8a:7`) | `-Type AAAA` no devuelve nada |
| D, paso 3 | Persona del museo | Editar `www`: `CNAME` a **`mupa-web.onrender.com`** (hoy apunta a `mupa.ar`). Guardar | `Resolve-DnsName www.mupa.ar -Type CNAME` da `mupa-web.onrender.com` |
| D, paso 4 | Desarrollador | Verify en Render y esperar los certificados de `mupa.ar` y `www.mupa.ar`. Mientras tanto alguien puede ver un error de certificado: por eso el horario y el TTL bajo | Render los muestra emitidos; `curl -sI https://mupa.ar/` responde 200 desde Render |
| D, paso 5 | Desarrollador | `CANONICO=1` en el dashboard (se redespliega). La indexación y GA4 quedan activos solos por el host | `curl -sI https://mupa-web.onrender.com/administracion/` da 301 a `https://mupa.ar/administracion/` |
| D, paso 6 | Desarrollador | Verificación (abajo), entrar al panel en `https://mupa.ar/administracion` y avisar a la persona del museo que puede cortar la llamada | Todo lo de la lista; MX sin cambios |
| D, paso 7 | Desarrollador | Search Console: enviar `sitemap.xml` e inspeccionar `/` y dos páginas internas. Bing: sitemap. Avisar al museo y al personal del panel la dirección nueva y que hay que volver a entrar | — |

**Lo que no se toca nunca** (ni ese día ni después): MX, los TXT que ya existen (el SPF `v=spf1 include:_spf.mail.hostinger.com ~all` y cualquier otro), `_dmarc`, `hostingermail-a._domainkey`, `autodiscover` y `autoconfig`. Tampoco el botón "Reset DNS Records".

**Verificación del día D** (también en `tools/rutas-check.mjs --url https://mupa.ar/`):

```
curl -sI http://mupa.ar/                        → 301 https://mupa.ar/
curl -sI https://www.mupa.ar/                   → 301 https://mupa.ar/
curl -sI https://mupa.ar/                       → 200, no-cache, content-security-policy, SIN set-cookie, SIN x-robots-tag
curl -s  https://mupa.ar/ | grep canonical      → https://mupa.ar/
curl -sI https://mupa.ar/google19017c966a32aec2.html   → 200 text/html
curl -sI https://mupa.ar//evil.com/             → Location /evil.com (o 404), nunca externo
curl -sI https://mupa.ar/preview/               → 301 /
curl -sI https://mupa.ar/api/usuarios           → 404 (no hay API fuera de /administracion)
curl -sI https://mupa.ar/assets/<index-hash>.js → max-age=31536000, immutable
curl -sI https://mupa.ar/administracion/        → 200, x-robots-tag: noindex, no-store, CSP del panel, SIN set-cookie
curl -sI https://mupa.ar/administracion/api/usuarios → 401
curl -sI https://mupa-web.onrender.com/         → 301 https://mupa.ar/
curl -sI https://mupa-web.onrender.com/administracion/ → 301 https://mupa.ar/administracion/
Resolve-DnsName mupa.ar -Type MX -Server 8.8.8.8 → mx1/mx2.hostinger.com (sin cambios)
```

Además: un mail a la casilla del museo y otro desde ella; un envío del formulario desde `https://mupa.ar/contacto`; entrar al panel en `https://mupa.ar/administracion` (la cookie sale con `Path=/administracion`); GA4 en Tiempo real; recetas, `analitica-check.mjs` y `vitals.mjs` contra `https://mupa.ar/`.

**Volver atrás:**
- Cuándo: el certificado no sale en una hora o hay errores serios.
- Cómo, la persona del museo en la misma llamada, con la captura de T−24 h a mano: `A @` de vuelta a `212.85.9.20`, volver a crear el `AAAA @` `2a02:4780:13:820:0:b30:3a8a:7` y `www` de vuelta a `CNAME mupa.ar`. El desarrollador pone `CANONICO=0`.
- Qué verifica el desarrollador: `Resolve-DnsName` contra `ns1.dns-parking.com` con los valores anteriores y `https://mupa.ar/` con la landing, que sigue en `public_html` de Hostinger.
- El panel vuelve a usarse en `https://mupa-web.onrender.com/administracion` (hay que volver a entrar). El contenido cargado no se pierde.
- **Sirve hasta que venza el certificado de Hostinger.**

### 11.3 Fase D: después (D+1 a D+14)

- Seguir de cerca los logs, Search Console y GA4.
- A los 14 días: HSTS a 180 días (un commit). El TTL de vuelta a 3600 lo puede hacer la persona del museo en otra llamada corta; si queda en 300 no pasa nada.
- Opcional, en esa misma llamada o con acceso delegado: la propiedad de dominio de Search Console (un TXT **nuevo** `google-site-verification=…`; no se edita el TXT del SPF).
- Si hubo acceso delegado a Hostinger, el titular lo revoca.
- Se borran `prerender.mjs`, `build:preview` y los `.htaccess` de `public/`. La rama `landing` se archiva.
- **Por escrito al museo: nunca usar "Reset DNS Records" en hPanel**, porque devuelve el sitio a Hostinger ([tutorial de Hostinger](https://www.hostinger.com/uk/tutorials/how-to-use-hostinger-dns-zone-editor/), 23/04/2025).
- La landing de Hostinger se conserva 60 días.

---

## 12. Plan por etapas

### 12.1 Tareas y horas

| ID | Tarea | h | Módulo | Verificación |
|---|---|---|---|---|
| **E0** | **Arranque** | | | |
| E0.1 | Mail al museo: preguntas, materiales con fechas (incluidas la casilla de envío y la persona con acceso a hPanel; el acceso delegado como opción), **fecha límite del diseño (06/11)**, header/menú/pie primero, medio de pago, facturación desde el primer deploy | 0,5 | Base | Enviado; respuesta archivada |
| E0.2 | Postgres 17 local (datos fuera de OneDrive), `.env.example` + `!.env.example`, `config.js`, guardas de comandos destructivos | 1,5 | Base | `npm run migrar` contra una base vacía |
| E0.3 | Esqueleto de Express 5: app y servidor, panel montado en `/administracion` y redirección canónica por host, errores (404 en estáticos), `/salud` y `/salud/base`, redirecciones normalizadas, SIGTERM, `SIN_BASE` (incluye 0,5 h de Express 5) | 2,5 | Base | `/salud` 200; `//evil.com/` sin Location externo |
| E0.4 | SSR multipágina sobre la Home, sin caché: `vite.config.js` (`source(".")`), plantilla partida, `render(estado)` con ida y vuelta JSON, `main.jsx`, `ssr.js` (último `museo` bueno), `dev.js`, `Raiz`, `Home` | 5 | Base | `npm run dev` y `npm start` sirven la Home |
| E0.5 | Regresión de la Home: recetas, hidratación con build de desarrollo, tamaños, `vitals` con `servir.mjs` como proxy. **CLAUDE.md y `tools/README.md` al día** | 3 | Base | Todo `ok: true`, consola vacía, JS 311 kB ±2 % |
| **E1** | **Base y autenticación** | | | |
| E1.1 | Sequelize + umzug + migraciones 01-02 + semilla | 2,5 | Panel | up, down, up |
| E1.2 | Sesiones, cookie `__Secure-` con `Path=/administracion`, argon2, CSRF por origen, límites (correo + IP), roles | 3,5 | Panel | Inicio y cierre de sesión con curl |
| E1.3 | Usuarios: alta con contraseña temporal, cambio obligatorio, temporal nueva por admin, cambio de clave, último admin, `crear-admin` y `restablecer-admin` | 2,5 | Panel | Ciclo completo en local |
| E1.4 | `auth.test.js` y `permisos.test.js` | 1,5 | Panel | `npm test` en verde |
| **E2** | **Panel base** | | | |
| E2.1 | Vite del panel (`base: '/administracion/'`), data router con `basename`, layout accesible, Ingresar, Cambiar la contraseña, reingreso | 3,5 | Panel | Teclado de punta a punta |
| E2.2 | Componentes genéricos, `api.js`, Inicio ("Para completar", un solo admin, correo, tareas) | 2 | Panel | |
| E2.3 | Datos del museo | 1,5 | Panel | El pie los muestra |
| E2.4 | Visitas: horario, tarifas, textos, aviso, compra externa | 3 | Panel | |
| E2.5 | Usuarios (diálogo de la temporal, "Dar contraseña temporal") y Mi cuenta | 1,5 | Panel | Alta y primer ingreso con otra persona |
| **E3** | **Fotos y contenidos** | | | |
| E3.1 | Fotos: multer, sharp, almacén, servido, SubirFoto, Portada, Galería accesible, borrado al quitar, huérfanas, `fotos.test.js` | 7 | Panel | Foto de iPhone sin GPS |
| E3.2 | TipTap, esquema zod y `TextoRico.jsx` (incluye 0,5 h de TipTap 3) | 4 | Panel | Pegar desde Word queda limpio |
| E3.3 | Novedades: migración 05, API con la fábrica, pantallas | 3 | Panel | |
| E3.4 | Salas y muestras: migración 04, API, pantallas | 3 | Panel | |
| E3.5 | Eliminar con diálogo y cambios sin guardar | 1 | Panel | |
| E3.6 | **Solo con disco:** "Descargar copia de las fotos", `restaurar-fotos.js` y fotos faltantes | 3 | Panel | Ensayo de E5.3 |
| **E4** | **Sitio público** | | | |
| E4.1 | Layout: menú, menú móvil, pie; regresión de la Home con pie máximo y vacío | 7,5 | Base | Recetas en `ok: true` a 4 tamaños de celular |
| E4.2 | Exposiciones (listado con salas) y ficha de muestra | 3 | Sitio | |
| E4.3 | Visitas | 2,5 | Sitio | |
| E4.4 | Novedades: listado paginado y ficha | 2,5 | Sitio | |
| E4.5 | Contacto: formulario sin JS, trampa, límites, `correo.js` (nodemailer, modos, verificación, `probar-correo`), mapa, `contacto.test.js` | 2,5 | Sitio | Envío en local por consola y SMTP caído |
| E4.6 | SEO: `<head>`, JSON-LD absoluto (`Museum` y `NewsArticle`), sitemap, robots, 404, `noindex` por host y en `/administracion` | 2,5 | 1,5 Base / 1 Sitio | Rich Results Test |
| E4.7 | GA4 por host y página, UserWay, CSP fija (pública y del panel) | 1 | Base | `analitica-check`; consola sin violaciones |
| E4.8 | `ssr.test.js` | 1 | Sitio | |
| E4.9 | Mensajes del formulario: migración 06, guardado y estado del envío, `/mensajes`, retención de 180 días, aviso en el Inicio | 1,5 | Sitio | Un envío fallido aparece en Mensajes y en el Inicio |
| **E5** | **Producción** | | | |
| E5.1 | Workspace del museo, `render.yaml`, primer deploy en `mupa-web.onrender.com` (sitio y `/administracion`, sin DNS ni dominio propio), instructivo y llamada para crear `web@mupa.ar` y cargar su clave en Render (11.1), prueba de SMTP desde Render, comprobaciones de 10.1 | 4 | Base | Lista de 10.1; SPF, DKIM y DMARC en PASS |
| E5.2 | `tools/rutas-check.mjs`, mediciones contra Render, CSP comprobada en Render y en el iPhone | 1,5 | Base | 11, fase B |
| E5.3 | Ensayo de restauración: export en un Postgres local (y fotos, con disco) | 1 | Base | 10.3 documentado |
| E5.4 | Corte del dominio con la persona del museo: instructivo con los valores exactos (1 h), dominios en Render y llamada del T−24 h para el TTL (0,5 h), llamada del corte guiado paso a paso con verificación, Search Console y Bing (2,5 h) | 4 | Base | 11.2 |
| E5.5 | `docs/operacion.md`, CLAUDE.md, acta, `dependabot.yml` | 1,5 | Base | |
| **E6** | **Cierre** | | | |
| E6.1 | Teclado y NVDA en el panel y las páginas | 1,5 | Panel | |
| E6.2 | Manual del panel con capturas (2 h) y capacitación (1 h), con la dirección nueva después del corte y la recomendación de cerrar sesión al terminar | 3 | Panel | |
| E6.3 | Diseño de la diseñadora sobre header, menú, pie y fichas (**hasta 6 h, si llega antes del 06/11**) | 6 | Sitio | Recetas e hidratación de nuevo |
| **C** | **Coordinación, revisiones y garantía** | | | |
| C1 | Coordinación con el museo y la diseñadora (0,5 h por semana) | 3,5 | — | |
| C2 | Dos rondas de revisión después de la entrega | 6 | — | |
| C3 | Reserva para la garantía de 60 días | 4 | — | |
| | **Total con disco** | **115** | | |
| | **Total con 16.1** (sin E3.6) | **112** | | |

### 12.2 Horas por módulo

| Módulo | Tareas | h |
|---|---|---|
| Base | E0, E4.1, E4.6 (1,5 h), E4.7, E5 | 34,5 |
| Sitio institucional | E4.2-E4.5, E4.6 (1 h), E4.8, E4.9, E6.3 | 20 |
| Panel | E1, E2, E3, E6.1, E6.2 | 47 (44 con 16.1) |
| Coordinación, revisiones y garantía | C1-C3 | 13,5 |
| **Total** | | **115** (112 con 16.1) |

- La Base incluye lo que la landing no tenía: el servidor con SSR, el deploy, el corte de DNS y la regresión de la Home.
- **Cambio de la versión 3: +2 h, todas en E5.4.** Que el corte lo haga una persona del museo guiada por el desarrollador suma el instructivo y dos llamadas. Pasar el panel a `/administracion` no cambia las horas: lo que se ahorra en DNS del panel (E5.1) se va en el instructivo de la casilla, y el reparto por ruta, la cookie y el CSRF cuestan lo mismo que por host (E0.3, E1.2).
- Con acceso delegado a Hostinger (10.6), E5.4 vuelve a unas 2 h.
- 6 de las 20 h del Sitio dependen de que el diseño llegue antes del 06/11 (E6.3).

### 12.3 Fase 2: lo que sale del alcance

Se suma con migraciones aditivas, sin rehacer nada (regla de 3.3).

| Función | Estimado |
|---|---|
| Papelera con Deshacer, restaurar y purga a 30 días | 2 h |
| Publicación programada y vista previa de borradores | 2,5 h |
| Registro de cambios y pantalla Actividad | 2 h |
| Excepciones de horario (feriados, cierres) con su JSON-LD | 2 h |
| Control de ediciones simultáneas (versión y aviso 409) | 1 h |
| `ExhibitionEvent` y `Event` en el JSON-LD (con la dirección cargada) | 0,5 h |
| Punto focal de las fotos | 1 h |
| Página propia por sala (hoy: sección con ancla en /exposiciones) | 1,5 h |
| Archivo de muestras pasadas | 1 h |
| Mensajes: reintentar el envío y marcar como respondido | 1 h |
| Invitaciones y recuperación de contraseña por mail (necesita un servicio de correo y registros DNS) | 3 h |
| Copia local de los formularios del panel (solo contenido a publicar: el `localStorage` se comparte con las páginas públicas) | 0,5 h |
| Turnstile en el formulario | 0,5 h |
| CI con GitHub Actions y Postgres | 1 h |
| Novedades en la Home (con diseño) | 2 h |
| **Total** | **~21,5 h** |

### 12.4 Calendario

Se planifica a 20 h por semana (4 h por día hábil), desde el 08/10 y sujeto a la llegada de los materiales. Hay que confirmar el feriado del 20/11 y si se traslada.

| Semana | Fechas | h | Tareas | Hito |
|---|---|---|---|---|
| S1 | vie 09/10 y 13-16/10 (12/10 feriado) | 18,5 (+1,5 de colchón) | E0.1-E0.5, E1.1, E1.2 | **H1 (16/10):** la Home servida por Express con SSR es idéntica (recetas, hidratación, tamaños); migraciones y sesión con curl contra el Postgres local |
| S2 | 19-23/10 | 20 | E1.3, E1.4, E2.1-E2.5, E5.1, C1 | **H2 (23/10):** panel con ingreso, usuarios con temporal, museo y visitas; pruebas en verde; servicio en Render (`mupa-web.onrender.com` y `/administracion`) y prueba de SMTP (si hay cuenta y casilla) |
| S3 | 26-30/10 | 18,5 (+1,5) | E3.1-E3.5, C1 | **H3 (30/10):** fotos, novedades y exposiciones en el panel |
| S4 | 02-06/11 | 19 (+1) | E3.6, E4.1-E4.4, C1 | **H4 (06/11):** páginas públicas, menú y pie, Home sin regresiones. **Fecha límite del diseño** |
| S5 | 09-13/11 | 17,5 (+2,5) | E4.5-E4.9, E5.2, E5.3, E5.5, E6.1, E6.2, C1 | **H5 (13/11):** contacto con mensajes, SEO, CSP, restauración ensayada, accesibilidad, manual y capacitación; el museo carga contenido en `mupa-web.onrender.com/administracion` |
| S6 | 16-20/11 | 6,5 (+13,5) | E6.3, C1 | **H6 (≤ 20/11): entrega.** Acta y comienzo de la garantía |
| Después | desde 23/11 | 15 | E5.4 cuando el museo confirme el contenido y esté la persona con acceso a hPanel; C2 (dos rondas con 5 días hábiles de respuesta del museo cada una); C3 hasta ~19/01/2027; C1 | **H7:** corte de DNS |

**Ajustes posibles:**
- Con 16.1, S4 libera 3 h.
- El deploy (E5.1) no depende del DNS ni de hPanel: solo de la cuenta y el medio de pago. Si se traba, pasa a S5 y esas horas se adelantan. La prueba de SMTP espera a la casilla de envío sin frenar lo demás.
- A 16 h por semana, la entrega se corre a alrededor del 24/11.
- Las fechas de los hitos se le comunican al museo como estimadas, sujetas a los materiales. En el mail queda anotada la fecha en que llega cada material.

### 12.5 Definición de la entrega

- **Entrega:** sistema completo en Render (`https://mupa-web.onrender.com` y su `/administracion`), panel funcionando con cuentas reales, formulario enviando a la dirección de destino, manual y capacitación hechos, y acta firmada.
- **Revisiones:** las dos rondas van **después** de la entrega.
- **Corte de DNS:** no frena el cierre. Si el museo no confirma el contenido mínimo o no hay una persona con acceso a hPanel, queda como tarea pendiente con 4 h reservadas.

### 12.6 Materiales del museo que bloquean

| Material | Bloquea | Hace falta para |
|---|---|---|
| **Casilla institucional** para las cuentas y correo de recuperación fuera de `mupa.ar` | E5.1 | S2 |
| **Medio de pago** en USD (si no, plan B de 10.6) | E5.1 | S2 (S5 como límite) |
| **Una persona del museo con acceso a hPanel**, disponible para crear la casilla (una llamada de ~20 min) y el día del corte (~15 min el día anterior y ~1 h ese día) | Casilla de envío (E5.1), E5.4 | S2 para la casilla (S5 como límite); el día del corte |
| **Casilla de envío del sitio** (`web@mupa.ar`, la crea esa persona con el instructivo de 11.1; su clave se carga en Render en la llamada) | Prueba de SMTP (E5.1), Contacto en producción | S2 (S5 como límite) |
| Acceso delegado a Hostinger, solo DNS y correo (opcional, revocable; 10.6) | Nada: sin él, lo hace la persona del museo | — |
| Personal del panel: nombres, un correo por persona, **dos admins** | Cuentas reales | S5 |
| Correo de destino del formulario (cualquier dirección) | Contacto en producción | S5 |
| Datos: dirección, teléfono, correo público, redes, horarios (siesta, feriados), tarifas y gratuidades, normas, cómo llegar | Contenido y JSON-LD | S5 |
| **Contenido mínimo para el corte:** dirección, un medio de contacto, correo de destino, horarios, tarifas y al menos una muestra o sala | E5.4 | Después de H6 |
| Textos y fotos de exposiciones y novedades (los carga el museo) | Contenido | S5-S6 |
| ID de UserWay | E4.7 | S5 |
| Enlace de la plataforma externa de entradas, si existe | Botón de compra | S5 |
| Texto de privacidad para el pie y el formulario (con los mensajes guardados 180 días) | Pie definitivo | S6 |
| **Diseño: primero header, menú móvil y pie; después una ficha tipo** | E6.3 | **06/11** (si llega después, se acuerda aparte) |
| OK para la organización de GitHub | Transferencia del repo | H6 |

---

## 13. Pruebas

### 13.1 API, base y SSR

**Herramienta:** `node:test` con `npm test`, en serie, contra `mupa_test`.

**`ayudas.js`:**
- `prepararBase()` hace `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` y corre todas las migraciones. **Se niega** si la base no está en localhost o no termina en `_test`.
- `crearUsuario(rol)`, `cookiePara(rol)`, `levantar()` (`app.listen(0)`) y `pedir(metodo, ruta, { host, cookie, origen, sitio, cuerpo })`.
- `correo.js` en modo `memoria`, con una opción para que el transporte falle.

| Archivo | Qué comprueba |
|---|---|
| `auth.test.js` | Inicio correcto y fallido con el mismo mensaje. 5 fallidos desde una IP dan 429, y **desde otra IP la clave correcta da 200**. Vencimiento por inactividad y por máximo. **Un desactivado pierde la sesión en el pedido siguiente.** **La temporal sale una sola vez** (no aparece en `GET /usuarios` ni en los logs). **Con `debe_cambiar_clave`, todo menos sesión y `cuenta/clave` da 403**; después de cambiarla, todo anda. Temporal vencida → 401 con su mensaje. Dar una temporal cierra las sesiones de esa persona. Cambiar la clave invalida las otras sesiones. Último admin → 409. Flags de la cookie: con https, `__Secure-mupa_sesion`, `Path=/administracion`, HttpOnly, Secure y SameSite=Strict, sin `Domain`. `crearAdmin()` y `restablecerAdmin()` de `admin.js` |
| `permisos.test.js` | Recorre `api/indice.js` bajo `/administracion/api`: sin cookie → 401; editor en ruta de admin (usuarios, mensajes) → 403; `Sec-Fetch-Site` `cross-site` o **`same-site`** → 403; `Origin` ajeno → 403; cuerpo inválido → 400 antes de tocar la base; editor que cambia el correo de destino → 403. **Por ruta:** `/api/…` fuera de `/administracion` → 404; toda respuesta de `/administracion/…` (HTML, API y errores) trae la CSP del panel y `X-Robots-Tag: noindex`, también con el host `mupa.ar`, y `no-store` salvo en `/administracion/assets` |
| `migraciones.test.js` | Ida, vuelta de a una hasta el principio y otra vez ida, con `SequelizeMeta` al día. Cada modelo contra las columnas de su tabla (nombres y `NOT NULL`). Las restricciones con nombre de 3.2 y que rechacen lo que tienen que rechazar. Datos iniciales de 3.4. Grep de `sync(` desde E1 (sumado en la corrección de E1, 13/10/2026) |
| `estado.test.js` (E2.2) | `GET /estado` para un editor y para un admin ("Para completar", un solo admin, el correo, las tareas fallidas) y, sin base, el registro de las tareas diarias que lee |
| `museo.test.js` (E2.3) | El esquema del PUT (URLs, el `<iframe>` del mapa, redes, reglas de dos campos, caracteres invisibles), `GET`/`PUT /museo` y el museo público del estado: sin el correo de destino aunque esté cargado, el aviso solo vigente, la compra solo activa y el último museo bueno |
| `visitas.test.js` (E2.4) | Horario (franjas, días cerrados, mensajes) y tarifas: alta, cambio completo, borrado, orden (409 si la lista no coincide), el tope de 50 con dos altas a la vez y la renumeración del orden (con 32767) |
| `panel-api.test.js` (E2) | Sin base ni navegador, con un fetch falso: `panel/src/api.js` (Content-Type y `'{}'`, 401 con reingreso, 403 con `debeCambiarClave`, sin red, sesión terminada), `navegacion.js` (`volverSeguro`) y `reingreso.js` |
| `contenido.test.js` | Borrador → 404 en el sitio. Publicar → visible **en el pedido siguiente**. Slug único (409) y fijo después de publicar. Eliminar libera solo las fotos sin uso. Nodo prohibido o `javascript:` → 400. Grep: ni `sync(` ni `dangerouslySetInnerHTML` |
| `fotos.test.js` | JPEG, PNG y WebP entran. SVG, HEIC falso y texto `.jpg` → 415. 60 MP → rechazo. **El JPEG con GPS sale sin EXIF.** Las variantes existen. Sin sesión, multer no corre. Con disco: un archivo borrado a mano aparece como faltante |
| `contacto.test.js` | Envío correcto: fila `enviado`, From = la casilla, Reply-To = el visitante, texto plano. Transporte que falla: fila `fallido`, 303 igual y aviso en `/estado`. Base y transporte caídos → 503 con el correo público. Trampa con algo → 303 sin guardar ni enviar. Salto de línea en el nombre → 400. Sin destino → no hay formulario. 6.º envío de una IP en la hora → 429. Los mensajes de más de 180 días se borran en la tarea |
| `ssr.test.js` | Cada ruta da 200 con `title`, canonical `https://mupa.ar/…` y JSON-LD que parsea. Host no público → `noindex` en meta y cabecera; host público → sin `noindex`. Con `CANONICO=1`, otro host → 301 a `https://mupa.ar/` con la misma ruta, también `/administracion/…`. **Ninguna respuesta pública trae `Set-Cookie`**, aunque el pedido traiga la cookie de sesión. Ninguna página pública trae la CSP del panel ni ninguna de `/administracion` la pública. El estado no contiene `email_destino_contacto`. `</script><script>alert(1)</script>` en cada campo de texto: no aparece y el JSON-LD parsea. `$'`, `$&` y `$$` en el título: el HTML queda intacto. Paginación (301 y 404). `//evil.com/`. `/google19017c966a32aec2.html` → 200. Con la base caída, la Home da 200 y las demás 503 |

### 13.2 Recetas de `tools/`

Se corren con `--url` contra Express después de E0.4, E4.1 y E6.3, en cada cambio del header o del pie, y antes del corte.

| Receta | Cómo y dónde |
|---|---|
| `parallax-expr.js`, `parallax-compuerta.js`, `parallax-ejes.js`, `collage-check.js`, `mosaico-check.js`, `hitos-check.js`, `areas-check.js` | Con `measure.mjs` a 1440x900, 1366x768, 1280x720, 375x812, **390x664 y 375x635** |
| `parallax-check.mjs` | Sin navegador |
| `acordeon-dedo.mjs` | `flick`, `apoyado` y `lectura --subir`, con y sin `--como-safari`, a 390x664, 375x635, 375x812 y 412x780, con pie máximo y vacío. 0 tirones y 0 bandas salteadas |
| `analitica-check.mjs` | Build local de producción con `URL_PUBLICA` local (2.5). Que `ver_pie` **no** salga en `/visitas` |
| `vitals.mjs` | En local, `tools/servir.mjs --latencia 150 --kbps 1638` como **proxy delante de `npm start`**, comparado con H1. Y contra Render. Con `--consola`, sin violaciones de CSP |

### 13.3 Hidratación (sobre el build, no sobre `npm run dev`)

En desarrollo no aparecen las diferencias que obligaron a usar `renderBuiltUrl`: URL con hash y SVG chicos inlineados.

```
NODE_ENV=development npx vite build --outDir dist-dev/client
NODE_ENV=development npx vite build --ssr src/entry-server.jsx --outDir dist-dev/server
DIR_BUILD=dist-dev PORT=5183 npm start
node tools/vitals.mjs --url http://127.0.0.1:5183/<ruta> --veces 1 --consola
```

- Rutas: `/`, `/exposiciones`, `/exposiciones/<slug>`, `/visitas`, `/novedades`, `/novedades/<slug>` y `/contacto`. **La consola tiene que venir vacía.**
- Prueba de control: alterar el HTML a mano tiene que hacer aparecer la diferencia.
- En el HTML servido, `"./assets"` y `href="./"` tienen que dar 0 apariciones.
- Se hace en E0.5, E4 y E6.3.

### 13.4 `tools/rutas-check.mjs`

Revisa las redirecciones y cabeceras de 11.2 (páginas públicas y `/administracion`), `noindex` y canonical según el host, que `/administracion` lleve siempre `noindex` y su CSP, que no haya zod en el bundle público y los tamaños de JS y CSS contra la línea de base. Sale con código 1 si algo falla. Se corre **después de cada deploy** y en la revisión mensual.

### 13.5 A mano

- Teclado y NVDA en el panel y en cada página.
- Contacto sin JS: envío correcto, error de validación y SMTP caído (en local, `CORREO_MODO=smtp` con un host inexistente).
- Alta de un usuario, primer ingreso con la temporal y "Dar contraseña temporal", con otra persona del otro lado.
- **iPhone** (el desarrollador, con `?diag`): menú móvil y bloqueo del scroll, formulario, subir una foto desde la cámara (HEIC → JPEG), el panel a 375 px y la consola sin violaciones de CSP.

---

## 14. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Los materiales (medio de pago, casillas, la persona con acceso a hPanel, contenido) llegan después de cuando hacen falta | Media | Alto | Pedirlos el 09/10 con fechas; plan B del medio de pago (10.6); el deploy no depende del DNS; la entrega no depende del corte (12.5) |
| No hay una persona del museo con acceso a hPanel cuando hace falta | Media | Medio | Sin ella no hay casilla de envío (el formulario igual guarda los mensajes) ni corte: el sitio y el panel siguen en `mupa-web.onrender.com` y la entrega no depende del corte (12.5). Acceso delegado como opción (10.6) |
| La persona del museo se equivoca en hPanel (edita el MX o el SPF, borra otro registro) | Baja | Alto | Instructivo con los valores exactos y la lista de lo que no se toca (11.2), captura de la zona antes de empezar, llamada con el desarrollador verificando cada paso contra el servidor de Hostinger, zona completa guardada en `docs/operacion.md` para restaurarla |
| Regresiones en la Home por SSR, menú o pie | Media | Alto | H1 antes de seguir; recetas con pie máximo y vacío en cada cambio |
| Diferencias de hidratación | Media | Medio | DTO planos, `render(JSON.parse(json))`, prueba sobre el build |
| CPU o TTFB por renderizar en cada pedido (robots, picos) | Baja | Medio | Metrics en la revisión mensual; si hace falta, caché corta de la Home (~1 h) |
| La base se cae o está en mantenimiento | Baja | Medio | `/salud` sin la base; Home con el último `museo` bueno; 503 simple en las demás |
| Un sync del Blueprint pisa variables o recrea la base | Media | Alto | `sync: false`, Auto Sync en No, `autoDeployTrigger: off`, `rutas-check` después de cada deploy, procedimiento de 10.3 |
| `trust proxy` mal configurado: límites globales o falsificables | Media | Alto | Número de saltos y prueba con `X-Forwarded-For` falso |
| Un script de terceros comprometido (UserWay o GA4) actúa con la sesión de un admin que tiene el panel abierto en el mismo navegador mientras visita el sitio público | Baja | Alto | **Riesgo residual aceptado por el desarrollador** al elegir `/administracion` (9): el panel no carga scripts de terceros, sesión de 2 h sin actividad y 12 h como máximo, Salir siempre visible y cerrar sesión al terminar (manual y capacitación), límites de intentos |
| TTFB y LCP peores desde EE. UU. | Media | Medio | Virginia, borde para estáticos, criterio de 10.1 |
| sharp sin memoria con 512 MB | Baja-media | Medio | Una foto por pedido, `concurrency(1)`, `limitInputPixels`, achique en el navegador |
| Con disco: segundos de caída en cada deploy y copias separadas | Segura | Bajo-medio | Deploy de noche; ZIP de fotos; o 16.1 |
| Render bloquea SMTP también en Starter | Baja-media | Alto (Contacto) | Prueba en E5.1 con 465 y 587; los mensajes quedan guardados igual; alternativa a decidir antes de seguir (8) |
| Cambia la clave de la casilla de envío y el formulario deja de mandar | Media | Medio | Verificación al arrancar y diaria, aviso en el Inicio, mensajes guardados, paso en `docs/operacion.md` con `probar-correo` |
| Los mails del formulario caen en spam en el destino | Baja | Medio | From de `mupa.ar` por su propio servidor (SPF, DKIM y DMARC en PASS, comprobado en E5.1); Reply-To al visitante |
| Se pasa el límite diario de la casilla | Baja | Bajo | Tope de 50 por día, trampa y límites por IP |
| Contraseña temporal interceptada | Baja | Medio | 80 bits, vence a las 72 h, cambio obligatorio, entrega en persona o por teléfono, nunca en logs |
| Nadie puede entrar al panel (se va el único admin o se olvidan todos) | Baja | Alto | Dos admins, "Dar contraseña temporal", `restablecer-admin` en el Shell de Render |
| Dos personas editan la misma ficha | Baja | Bajo | Gana el último guardado; lo avisa el manual; control de versión en la fase 2 |
| Datos personales en los mensajes guardados | — | Medio | Solo admin, 180 días, fuera de logs y de copias locales, texto de privacidad |
| La CSP fija bloquea GA4 o UserWay | Media | Medio | Comodines de la guía de Google; prueba con `analitica-check`, `vitals --consola` y el iPhone antes del corte; GA4 en Tiempo real el día D y en la revisión mensual |
| Corte: AAAA olvidado, certificado que no sale, correo afectado | Baja | Alto | Pasos exactos con verificación del desarrollador en cada uno, TTL 300, horario temprano, vuelta atrás lista y MX verificado. El certificado de `mupa.ar` no se puede probar antes (no hay subdominio de prueba); todo lo demás se prueba en `mupa-web.onrender.com` |
| Después del corte, el personal no puede entrar al panel | Media | Bajo | Aviso el día del corte: dirección nueva `https://mupa.ar/administracion`, hay que volver a entrar con la misma contraseña; el manual lo dice |
| La vuelta atrás vence con el certificado de Hostinger | Segura | Bajo | Anotarlo en T−48 h |
| "Reset DNS Records" en hPanel | Baja | Alto | Aviso por escrito y zona en `docs/operacion.md` |
| Se pierde el acceso a las cuentas (casilla, 2FA, único admin) | Baja | Alto | Correo secundario fuera de `mupa.ar`, códigos impresos, dos admins, llave de emergencia |
| Nadie aplica parches después de la garantía | Alta | Medio | Dependabot, revisión mensual en `docs/operacion.md`, quién lo hace escrito en el acta |
| El medio de pago en USD no está disponible | Media | Alto | Preguntar ya; plan B por escrito |
| Render cambia precios o límites | Media | Bajo | `render.yaml` y revisión mensual |
| Menú móvil en iOS / UserWay tapa o corre elementos | Media | Bajo | `lenis.stop()`, prueba en el iPhone, CLS 0 |
| El personal no completa los alt o no usa el panel | Media | Medio | Alt obligatorio con ejemplos, manual, capacitación, "Para completar" |

---

## 15. Preguntas abiertas

### Para el desarrollador

1. **D1. Fotos: ¿disco (decidido) o Postgres (16.1)?** Antes de E5.1 (S2), porque el disco se declara en el Blueprint, y antes de E3.1.
2. **D2. ¿PostgreSQL 17 en esta PC?** Las pruebas lo necesitan.
3. **D3. ¿Se le pide al museo el acceso delegado a Hostinger (solo DNS y correo, revocable)?** Es opcional: sin él, la casilla y el corte los hace una persona del museo (11). Con él, E5.4 baja unas 2 h.
4. **D4. ¿Algo de Novedades en la Home?** No está en el alcance (fase 2).
5. **D5. Mensajes del formulario: ¿solo admins (propuesto) o también editores?**

### Para el museo (mail de E0.1)

1. **Medio de pago** para Render, en USD. ¿Puede el organismo pagar a un proveedor del exterior? ¿Cómo lo trata su administración? Si tarda, ¿aceptan el plan B (10.6) y que la facturación empiece con el primer deploy?
2. **Casilla institucional** para las cuentas y un **correo de recuperación fuera de `mupa.ar`**.
3. **Casilla de envío del sitio** (`web@mupa.ar`), distinta de la anterior. La crea una persona del museo en hPanel → Emails, en una llamada de unos 20 minutos con el desarrollador (11.1). ¿Qué plan de correo tienen (límite de envíos por día)?
4. **¿Quién del museo tiene acceso a hPanel?** Hace falta para la casilla (S2) y el día del corte (unos 15 minutos el día anterior y alrededor de una hora ese día). Opcional: ¿el titular de la cuenta de Hostinger puede darle al desarrollador acceso delegado, solo al DNS y al correo, y revocarlo después del corte? Si no, el plan funciona igual.
5. **Quiénes usan el panel:** nombres, un correo por persona (es el usuario para entrar) y **dos administradores**.
6. **Correo de destino** del formulario: puede ser cualquiera, también un Gmail.
7. **Datos de visita:** dirección, teléfono, correo público, redes, horarios (¿cierran a la siesta? ¿feriados?), tarifas y gratuidades, normas, cómo llegar y accesibilidad.
8. **¿Plataforma externa de entradas?** El enlace.
9. **¿Cada sala necesita página propia?** ¿Archivo de muestras pasadas? (Ambas cosas son fase 2.)
10. **ID de UserWay.**
11. **Texto de privacidad** para el pie y el formulario (tiene que mencionar que los mensajes se guardan 180 días).
12. **Diseño:** primero header, menú móvil y pie; después una ficha tipo; **fecha límite 06/11**.
13. **Titular del dominio** en NIC Argentina.
14. **Ventana para el corte de DNS:** un día hábil temprano, con la persona de hPanel disponible.

---

## 16. A reconsiderar

### 16.1 Guardar las fotos en Postgres en lugar del disco persistente

**Decidido:** disco persistente de Render. **Recomendación:** Postgres (`bytea`). Hay que decidirlo antes de E5.1.

**Por qué conviene revisarlo:**
1. **Cada deploy deja el sitio caído unos segundos.** Render dice: "Adding a disk to a service prevents zero-downtime deploys" ([disks](https://render.com/docs/disks), 08/10/2026). El sitio público sale de ese mismo servicio.
2. **Una sola copia en lugar de dos:** con Postgres, el export mensual que hace el museo incluye todo y el PITR de 3 días también restaura las fotos. Con disco hacen falta el botón de copia, el script de restauración y la detección de faltantes (E3.6, **3 h**), y la base y el disco pueden quedar desfasados.
3. **Mudarse es más fácil:** cambiar de workspace o irse de Render es un `pg_dump`. El disco no se lee desde one-off jobs ni desde otros servicios (ídem).
4. **El costo es casi igual:** USD 0,30 por GB en la base contra 0,25 en el disco. Unas 300 fotos con todas sus variantes rondan los 120-150 MB (estimación). El siguiente escalón de la base es 5 GB (USD 1,50), porque `diskSizeGB` va en 1 o múltiplos de 5 y solo crece ([blueprint-spec](https://render.com/docs/blueprint-spec), 08/10/2026).

**En contra:** una foto sin caché la sirve una base de 0,1 CPU (se mitiga con URL inmutables, el borde de Render para `.webp` y `.jpg` y una LRU de ~32 MB), y el `pg_dump` pesa más.

**Qué cambia si se adopta:**
- La migración 03 suma `fotos_archivos (foto_id int REFERENCES fotos ON DELETE CASCADE, variante varchar(8), datos bytea NOT NULL, bytes int, PRIMARY KEY (foto_id, variante))`. En los listados, `datos` nunca se pide.
- `almacen-postgres.js` mantiene la misma interfaz. `/fotos/:clave/:archivo` pasa a ser un handler de ~20 líneas.
- `render.yaml` va sin `disk` y desaparece `DIR_FOTOS`.
- No hacen falta E3.6, `copia.js` ni `restaurar-fotos.js`: **−3 h**.

**Si se mantiene el disco,** el plan funciona tal como está escrito, con E3.6 incluido.

### 16.2 Nada más

El resto de lo decidido no tiene razones fuertes en contra: stack sin Next.js, panel a medida con SSR, Render y DNS en Hostinger.

Los ajustes de este plan **no contradicen ninguna decisión tomada**:
- panel en `https://mupa.ar/administracion` dentro del mismo servicio (decisión del desarrollador del 08/10/2026, que reemplaza a `panel.mupa.ar`)
- DNS sin cambios hasta el corte y, en hPanel, solo la casilla de envío y el corte, a cargo de una persona del museo
- sesiones en Postgres, argon2id y Express 5
- correo solo para el formulario, por SMTP de Hostinger y sin Resend (corrección del desarrollador del 08/10/2026: Resend estaba pensado para la ticketera, que no se contrató)

---

## Observaciones de las revisiones descartadas o adaptadas

- **Volver a Express 4.22.** Descartada: Express 5 es la versión actual. Lo que cambia para este código (sintaxis de comodines y errores async) está cubierto con 0,5 h en E0.3; el aprendizaje de TipTap, en E3.2.
- **ZIP con JSON de todas las tablas y `restaurar-copia.js` genérico.** Adaptada: el export de Render ya es un `pg_dump` que se restaura en cualquier Postgres. El ZIP queda solo para las fotos, y solo con disco.
- **Avisar al admin a los 35 días sin copia.** Descartada: el panel no puede saber si se hizo el export en Render (y no manda mails). Queda como recordatorio en el calendario del museo y en la revisión mensual.
- **Contador diario en la base y guardar los mensajes que pasan el tope.** Adaptada: el contador va en memoria (una sola instancia), y todo mensaje que pasa la validación y el tope se guarda en `mensajes_contacto`.
- **Caché de HTML sin tope.** Resuelta de otra forma: no hay caché de HTML al lanzar. Si las métricas lo piden, se suma una caché corta y acotada de la Home.
- **CSP en report-only sin `report-uri`.** Resuelta con una CSP fija y obligatoria, probada antes del corte con las recetas y en el iPhone.
- **Cupo diario de correo compartido entre olvidos, invitaciones y contacto.** Sin efecto: el panel no manda mails y el único envío es el del formulario.
- **Que el panel exija dos admins.** Adaptada: aviso en el Inicio y recomendación en el acta, sin bloqueo.
- **CI con GitHub Actions.** A la fase 2. Dependabot sí entra.
- **Renombrar la base en `render.yaml` al restaurar.** Adaptada: `DATABASE_URL` con `sync: false` y la URL a mano, porque no está documentado que un Blueprint adopte una base creada fuera de él. El procedimiento queda escrito; el ensayo es el del export local.
