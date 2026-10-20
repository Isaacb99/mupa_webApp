# Plan de implementación: panel de administración y sitio institucional del MuPa

**Fecha:** versión 3, 08/10/2026 (panel en `https://mupa.ar/administracion`; los cambios en hPanel de Hostinger los hace una persona del museo). Al día con lo implementado hasta E4 (20/10/2026).
**Estado:** plan aprobado por el desarrollador: pendiente.
**Repo:** `C:\Users\badia\OneDrive\Escritorio\isaac\MUPA\SITIO WEB\mupa-web` (`github.com/Isaacb99/mupa_webApp`, rama `master`). Este archivo va en `docs/plan-panel-admin.md`.

## Resumen

1. **Arquitectura:** un solo servicio Node (Express 5 + React 19 con SSR) en Render y un solo host. `mupa.ar` es el sitio público y el panel, con su API, va en `https://mupa.ar/administracion`, sin scripts de terceros. Compartir el origen con UserWay y GA4 deja un riesgo acotado, aceptado por el desarrollador (9).
2. **Páginas públicas:** se renderizan en cada pedido, sin caché de HTML. Lo que se guarda en el panel se ve en el pedido siguiente.
3. **Base de datos:** Render Postgres 17 Basic 256 MB (`0.1c-256mb`), 1 GB, región Virginia, sin acceso externo. Sequelize 6 con migraciones de umzug.
4. **Fotos:** en Postgres (`bytea`), sin disco persistente, y achicadas en el navegador antes de subirlas: lo decidió el desarrollador el 15/10/2026 (16.1) y quedó implementado en E3.1 (7).
5. **Acceso:** una cuenta por persona, roles admin/editor, sesiones en Postgres con una cookie `__Secure-` limitada a `/administracion` y contraseñas con argon2id. **El panel no manda mails:** el admin da de alta a cada persona con una contraseña temporal (se muestra una sola vez y se cambia en el primer ingreso) y le da otra si la olvida. Si nadie puede entrar, hay un comando para el Shell de Render.
6. **Correo:** solo el formulario de contacto, en un sentido. Sale por SMTP desde una casilla de Hostinger del sitio (`web@mupa.ar`) hacia la dirección que elige el admin. Cada mensaje queda además guardado y se ve en el panel (Mensajes). No hay servicio de correo nuevo ni registros DNS de correo.
7. **Costo mensual:** USD 13,30 sin impuestos (sin disco: 16.1). Pagando en pesos, con IVA y percepción, son unos USD 20.
8. **DNS y hPanel:** la zona sigue en Hostinger y **no se toca hasta el corte**. Hasta entonces el sitio se ve en `https://mupa-web.onrender.com` (con `noindex`) y el panel en `https://mupa-web.onrender.com/administracion`, donde el museo carga su contenido. El desarrollador no tiene acceso a hPanel: lo único que pasa por ahí (crear la casilla de envío y, el día del corte, cambiar el DNS de `mupa.ar`) lo hace una persona del museo, con un instructivo y en una videollamada con el desarrollador (11). El correo no se toca.
9. **Alcance:** solo el núcleo contratado. Papelera, programación, vista previa, registro de actividad, excepciones de horario, control de ediciones simultáneas, punto focal y datos estructurados de eventos pasan a una fase 2 (12.3).
10. **Horas:** 113 h: Base 34,5, Sitio institucional 20, Panel 45 y 13,5 de coordinación, revisiones y garantía (12.2). Eran 115: el 15/10/2026, sin disco se fue E3.6 (−3 h) y el achique en el navegador sumó 1 h a E3.1.
11. **Plazos:** a 20 h por semana, la entrega es el 20/11/2026 como máximo. La garantía de 60 días arranca en la entrega. El cambio de DNS se hace cuando el museo confirme el contenido.
12. **Bloqueantes para S2:** medio de pago para Render, casilla institucional para las cuentas y la casilla de envío del sitio, que crea una persona del museo con acceso a hPanel. Esa misma persona hace falta el día del corte. Si el medio de pago tarda, plan B en 10.6.

**Qué cubre este plan:**
- La parte de la Base que falta: menú, estructura, SEO multipágina, servidor y puesta en producción.
- El Sitio institucional y el Panel completos.
- La base preparada para el plano (módulo 4) y la venta de entradas (módulo 5), sin implementarlos.

**Avance al 20/10/2026:** E0 a E3 implementadas y commiteadas (`b0bfb1f`, `64e4e28`, `f2be728` y `d0a7d36`); E4 (el sitio público: menú, pie, páginas internas, SEO, contacto con correo, Mensajes, GA4 y UserWay) implementada entre el 19 y el 20/10/2026, verificada y corregida, sin commitear, **con un aspecto provisorio** hecho con el lenguaje de la Home hasta que llegue el diseño de la diseñadora (E6.3). Cada sección anota, con su fecha, lo que la implementación cambió respecto de lo planeado ("Cómo quedó en…", "Desvío de…", "Corrección de…"). Lo que todavía no existe (E5 y E6) es a crear.

---

## 1. Resumen de decisiones

| Tema | Decisión | Por qué | Descartado |
|---|---|---|---|
| Forma general | **Un solo servicio Node y un solo host.** Reparte por ruta: `/administracion/*` es el panel (SPA y API); el resto es el sitio público (SSR, fotos y formulario) | Se despliega una sola cosa. La Home sigue siendo el mismo código | Dos servicios separados |
| Dirección del panel | **`https://mupa.ar/administracion`** (decisión del desarrollador, 08/10/2026). Antes del corte, `https://mupa-web.onrender.com/administracion` | No depende del DNS ni de hPanel, al que el desarrollador no tiene acceso: funciona desde el primer deploy. Más simple: un dominio, un certificado y una configuración. El riesgo de compartir origen con UserWay y GA4 está acotado y aceptado (9) | `panel.mupa.ar`: aislaba la sesión de los scripts de terceros, pero necesita un registro DNS que solo puede cargar el museo en hPanel |
| Stack | Lo que ya está instalado (React 19.3.0, Vite 8.3.0, Tailwind 4.3.3, Lenis 1.3.26) más Express **5.2.1**, Sequelize **6.37.8**, pg ^8.21.0, PostgreSQL **17** y nodemailer **10** (10.0.16 desde E4.5) | Es el stack que el desarrollador ya conoce. Express 5 manda los rechazos async al manejador de errores ([migración](https://expressjs.com/en/guide/migrating-5.html), 08/10/2026) | Next.js (decisión del desarrollador) |
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
| Texto con formato | **TipTap 3** (3.32.0 desde E3.2; el plan decía 3.31.4, misma API) recortado, guardado como JSON (`jsonb`) y dibujado con `TextoRico.jsx` | Sin HTML del usuario: sin XSS y sin diferencias de hidratación | HTML sanitizado, Markdown |
| Fotos | multer 2.4.0 en memoria y sharp 0.35.5. WebP en 480, 960 y 1600, una maestra de 2400 (se guarda, no se publica) y `og.jpg`. Guardadas en **Postgres** (`bytea`, decidido el 15/10/2026: 16.1), detrás de `server/fotos/almacen.js`. **El panel las achica en el navegador antes de subirlas** (hasta 2400 px; estándar desde el 15/10/2026) | Sin disco: un solo respaldo (la base), sin caída en los deploys ni copia aparte. Achicadas, el servidor las procesa en un tercio del tiempo y con mucha menos memoria (7) | Disco persistente (descartado, 16.1), Cloudinary, R2, Hostinger |
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
 │   /salud (vida)  /salud/base (SELECT 1)  /fotos/* (desde la base, con una caché en memoria; 1 año, immutable)
 │   /administracion/*  PANEL: sin scripts de terceros, CSP propia, noindex
 │     /administracion/assets/* (dist/panel)  /administracion/api/*
 │     cualquier otro GET → index.html del panel (no-store)
 │   el resto  SITIO PÚBLICO:
 │     /assets/* (dist/client)  /robots.txt  /sitemap.xml  POST /contacto  /<clave de IndexNow>.txt (opcional, E4.6)
 │     SSR en cada pedido: /  /exposiciones  /exposiciones/:slug  /visitas  /novedades  /novedades/:slug  /contacto
 │   desde el corte (CANONICO=1), otro host → 301 a https://mupa.ar/ + la misma ruta
 │   sin disco persistente: las fotos van en la base (16.1)
 │         │ red interna
 └ Postgres 17 "mupa-db" Basic 256 MB, 1 GB (PITR de 3 días en Hobby): contenido, sesiones y fotos

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
    main.jsx               lee #estado, baja la página e hidrata (2.3; desde E4, cargarPagina antes de hydrateRoot)
    entry-server.jsx       export async function render(estado) (desde E4, async: espera la página)
    Raiz.jsx               elige la página por estado.pagina (import() dinámico desde E4, 6.2) y la envuelve en Layout
    paginas/               Home.jsx (el App.jsx de hoy), Exposiciones.jsx, Muestra.jsx, Visitas.jsx,
                           Novedades.jsx, Novedad.jsx, Contacto.jsx, NoEncontrada.jsx
    components/            los de hoy + Layout, Header, Logo, Menu, MenuMovil, Pie (era Footer), Foto, GaleriaFotos,
                           Tarjeta, Seccion, Ficha, TablaHorarios, ListaTarifas, Aviso, BotonCompra, Paginacion,
                           FormularioContacto, DatosDeContacto, datosMuseo.js y estilos.js (E4; aspecto provisorio
                           hasta E6.3) y TextoRico (desde E3.2; lo usan las páginas desde E4)
    hooks/, content.js, analitica.js (recibe el estado), userway.js (E4.7), index.css (@import "tailwindcss" source("."))
  panel/                   PANEL (SPA, solo cliente; se publica en /administracion)
    index.html, public/manual.pdf (sale en /administracion/manual.pdf)
    src/ main.jsx, rutas.jsx (createBrowserRouter, basename '/administracion'), api.js, sesion.jsx, panel.css
         (desde E2 también navegacion.js, reingreso.js y formato.js; desde E3, achicarFoto.js y contenidos.js)
         componentes/ Campo, Confirmar, Aviso, EditorTexto (lazy) y editorTexto/ (el chunk de TipTap), SubirFoto,
                      Portada, Galeria, DatosFoto, EstadoContenido, ReingresoDialogo, ClaveTemporal (E2 sumó Marco,
                      Encabezado, Boton, Casilla, Modal, formulario.jsx, FormularioClave, UltimaEdicion y
                      AvisoVersionNueva; en E3 Listado no hizo falta, EstadoPublicacion es EstadoContenido y SelectorPortada es Portada)
         pantallas/   Ingresar, CambiarClave, Inicio, Novedades, Exposiciones, contenido/ (Nuevo y Ficha: una sola
                      ficha para novedades, muestras y salas, con valores.js), Visitas (y visitas/, con Textos desde
                      E3.2), Museo, Mensajes (E4.9), Usuarios, Cuenta
  compartido/              código puro, sin APIs de Node ni del DOM
    esquemas/              museo, horarios, tarifas, contenido (novedades, muestras y salas en uno: E3.3), fotos,
                           usuarios, contacto (E4.5), textoRico (solo servidor y panel; desde E2, campos.js con los
                           campos que se repiten)
    precios.js             (E2) leer y mostrar un precio en pesos, sin zod: lo usa también el sitio (E4.3)
    fechas.js              hoy en San Juan, formato con meses propios, datetime-local ↔ -03:00 (instanteDeLocal y
                           localDeInstante desde E3.3)
    contenidos.js          (E3.3, era slug.js) la dirección web (crearSlug, slugNumerado), urlPublica y
                           PAGINAS_PUBLICAS_DE_CONTENIDO
    fotos.js, enlaces.js   (E3.1 y E3.2, sin zod) las constantes y los mensajes de las fotos; la regla de los enlaces
    horarios.js, redes.js  (E4.1, sin zod) el horario resumido y los días; las redes que el sitio sabe mostrar (los
                           esquemas los reexportan: así el pie no importa zod)
    contacto.js            (E4.5, sin zod) los topes del formulario, los códigos de error, unaLinea y sinInvisibles
    estados.js, panel.js (RUTA_PANEL = '/administracion'); el textoRico.js "a texto plano" no hizo falta en E4
  server/
    servidor.js            conecta, verifica la casilla de envío, escucha, tareas diarias, apagado ordenado
    app.js                 arma la app (la usan las pruebas)
    config.js              variables validadas con zod; en producción no arranca si CORREO_MODO ≠ smtp
    dev.js                 Express + Vite en middlewareMode
    hosts.js               hosts aceptados y redirección canónica (el panel se reparte por ruta, en app.js)
    ssr.js                 plantilla partida, render por pedido, último `museo` bueno, modulepreload por página (E4)
    rutas-publicas.js      tabla ruta → { pagina, params, cargar }
    paginas.js             (E4) el cargar() de cada página interna: datos planos, fechas y precios ya como texto
    contenido-publico.js   (E4) lo publicado, una consulta por página, fotos con sus campos públicos, tope de 4 s
    seo.js                 <head>, JSON-LD, jsonEnScript(), robots, sitemap
    contacto.js            POST /contacto (la página es una ruta más de la tabla) y el servicio del formulario
    correo.js              nodemailer (SMTP), modos, estado del correo
    indexnow.js            (E4.6, opcional) el aviso a los buscadores al publicar
    tope.js                (E4) conTope y el error de la base que no responde, para las cuatro esperas con tope
    seguridad.js           helmet, CSP pública y del panel (por ruta), CSRF, redirecciones normalizadas
    limites.js, errores.js, tareas.js, log.js
    principal.js           "¿me ejecutaron directamente?" de los comandos (import.meta.main, o la ruta real)
    auth/                  sesiones.js, claves.js (argon2 y temporales), middleware.js
    api/                   indice.js (tabla de rutas), sesion.js, cuenta.js, usuarios.js, museo.js, horarios.js,
                           tarifas.js, contenido.js (fábrica), fotos.js, mensajes.js, estado.js
    fotos/                 procesar.js, almacen.js (Postgres, 16.1), cola.js, usos.js, servir.js
    db/                    conexion.js, migrar.js, guardas.js, asociaciones.js, modelos/ (desde E3, Galeria.js es la
                           fábrica de las galerías y grupos.js los grupos P y C), migraciones/, semillas/ejemplo.js
    scripts/               admin.js (crear y restablecer), probar-correo.js
    pruebas/               ayudas.js, auth, permisos, migraciones, estado, museo, visitas, textoRico, fotos, contenido,
                           panel-api, contacto y ssr (*.test.js; más los de E0 y E1: esqueleto, apagado, api-sin-base,
                           comandos, guardas y log; desde E4, layout.test.js y smtpFalso.js, un SMTP falso con
                           node:net); las imágenes de prueba las arma fotos.test.js con sharp (no hay archivos/)
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

Cómo quedaron: `test` corre `"server/pruebas/**/*.test.js"` y no la carpeta (con comillas: el patrón lo expande Node, y `ayudas.js` y `smtpFalso.js` no se toman como pruebas); `probar-correo` entró con E4.5.

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
| `multer` | 2.4.0 (E3.1) | runtime |
| `nodemailer` | 10.0.16 (pide Node ≥ 20). E4.5: fija, sin `^`. Al 20/10/2026 la última es la 10.1.7, pero la 10.1 sacó 8 versiones entre el 10 y el 18/10 (cuatro el mismo 18/10): subir queda a decisión del desarrollador (15) | runtime |
| `sharp` | 0.35.5 (E3.1: pasó de devDependencies a dependencies; la 0.35.4 tenía un aviso alto en `npm audit`) | runtime |
| `compression` | 1.8.2, **solo** si Render no comprime (10.1) | runtime |
| `react-router` | ^7.14.2 (se instaló ^7.18.4, la última 7.x al 14/10/2026; ya existe la 8) | dev (solo entra en el bundle del panel) |
| `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/core`, `@tiptap/extension-list`, `@tiptap/extension-link` | 3.32.0 (E3.2; `extension-link`, explícita desde la corrección de E3: el enlace no inclusivo, 5.4) | dev (ídem) |

- Sin empaquetador ZIP: era para la copia de las fotos en disco (E3.6), que no existe con 16.1.
- `npm audit --omit=dev` al cerrar E3 (16/10/2026) y al cerrar E4 (20/10/2026): los mismos 6 moderados de E1 (`sprintf-js` por umzug y `uuid` por Sequelize, en caminos que no se usan); multer, TipTap y nodemailer (sin dependencias propias) no suman avisos.
- `dotenv` no hace falta: Node 24 trae `--env-file-if-exists`.
- `react`, `react-dom` y `lenis` siguen como dependencias de runtime, porque el bundle SSR las deja externas.

**Qué produce `npm run build`:** `dist/client/` (plantilla, `assets/` con hash y lo de `public/`), `dist/server/entry-server.js` y `dist/panel/` (sus URL empiezan con `/administracion/`). Con `base: '/'`, los dos builds públicos generan las mismas URL `/assets/x-hash.ext`, así que `renderBuiltUrl` ya no hace falta. Se comprueba con la prueba de hidratación sobre el build (13.3). Desde E4, el build del navegador deja además `dist/client/.vite/manifest.json` (`build.manifest`): el servidor lo lee al arrancar para saber qué archivo JS tiene cada página (6.2). No se publica (da 404).

**Tailwind:**
- `src/index.css` pasa a `@import "tailwindcss" source(".");` para que escanee solo `src/` ([detección de clases](https://tailwindcss.com/docs/detecting-classes-in-source-files), 08/10/2026). Hoy escanearía también `docs/`, `tools/` y `CLAUDE.md`.
- `panel/src/panel.css` hace lo mismo con su carpeta.
- El CSS público tiene que seguir en ~49,6 kB. **E4:** las páginas internas suman sus clases (toda clase escrita en `src/`, también en un comentario, entra en el CSS): al cerrar E4, 56.416 B (10,3 kB con Brotli), contra 49.375 al cerrar E3.

**Arranque** (`servidor.js`):
1. Valida la configuración.
2. Conecta Sequelize con pool `max: 5`.
3. Lee una sola vez la plantilla y `entry-server.js` de `DIR_BUILD` (por defecto `dist`).
4. Verifica la casilla de envío (`transporte.verify()`, sin esperar) y deja el resultado para el Inicio del panel (8). **Cómo quedó (E4.5):** crea un solo correo (`crearCorreo`) que comparten la página de Contacto, `POST /contacto`, el Inicio del panel y las tareas; la verificación es la tarea diaria `casilla_correo`, que corre también al arrancar (punto 5).
5. Escucha en `PORT` y programa las tareas diarias (una vuelta al arrancar y después a las 04:00 de San Juan, 7). Desde E3.1 crea también el almacén de las fotos (su caché en memoria), que comparten `/fotos`, la API y la tarea de las huérfanas: lo que se borra sale también de la caché.
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

**Cómo quedó en E4 (19-20/10/2026):**
- `cargar(ctx)` recibe `{ params, consulta, hoy, ahora, lector, museo, contacto }`: "hoy" y "ahora" se calculan una vez por pedido; `lector` lee lo publicado (`server/contenido-publico.js`); `museo()` es la lectura del museo de ese pedido, que se hace a la vez que la de la página y solo esperan las que la usan (Visitas y Contacto). Devuelve los datos, `null` (404) o `redirigir(destino)` (301). Las funciones están en `server/paginas.js`.
- **El museo del estado común es `museoComun(museo)`**: todo menos los tres textos con formato de Visitas, que van solo en los datos de `/visitas` (COD-04 de la verificación de E3: con los tres cerca de su tope la Home pasaba de 73 a 357 kB).
- **Sin el museo de ahora** (`museoPublico.conEstado()` da `alDia: false`: la base falló y es el último bueno), Visitas y Contacto responden la 503 simple; la Home sale igual.
- **Lo publicado tiene un tope de 4 s** (`TOPE_CONTENIDO_MS`); si la base falla o no contesta, la 503 simple con `no-store` y `Retry-After: 60`. Las cuatro esperas con tope (`probarBase`, el museo, lo publicado y el formulario) usan `conTope` de `server/tope.js` (COD-04 de la verificación de E4: eran cuatro copias de la misma carrera).
- **`render(estado)` es async** y el `<head>` suma `<link rel="modulepreload">` del archivo de la página y lo que comparte (6.2).
- `POST /contacto` vuelve a dibujar la página con `dibujarPagina()` (con lo escrito, los errores y `no-store`; 8).

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

**Cómo quedó en E4:** antes de `hydrateRoot` se baja la página del estado (`cargarPagina(estado.pagina)`, que el servidor ya pidió con `modulepreload`), y después de `iniciarAnalitica(estado)` va `iniciarUserWay(estado)` (6.6).

### 2.4 Qué responde el servicio, en orden

1. `app.disable('x-powered-by')` y `app.set('trust proxy', <número de saltos>)`, **nunca `true`** (10.1).
2. **Cualquier host:** `/salud` (200 si el proceso vive, sin consultar la base: es el health check de Render), `/salud/base` (`SELECT 1` con 2 s de tope, para un monitor externo), `/salud/ip` (solo con `DEPURAR_IP=1`) y `/fotos/*` (sección 7). **E3.1 (16/10/2026):** `/fotos` es GET y HEAD desde la base (`server/fotos/servir.js`) y, como va antes del punto 4, pone él mismo `X-Robots-Tag: noindex` fuera del host público; nunca pone cookies.
3. **Host aceptado** (`req.get('host')`), igual para el sitio y el panel:
   - host de `URL_PUBLICA`, o (con `CANONICO=0`) el de `RENDER_EXTERNAL_URL` o `localhost` → sigue
   - con `CANONICO=1`, cualquier otro host → 301 a `URL_PUBLICA` + ruta normalizada (también `/administracion/…`)
4. **helmet, común:** HSTS sin `includeSubDomains`, 1 día durante la transición; `nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `X-Robots-Tag: noindex, nofollow` en todo host que no sea `mupa.ar`.
5. **Panel, montado en `/administracion`** (antes de las redirecciones públicas):
   - en toda respuesta: CSP del panel (9) y `X-Robots-Tag: noindex, nofollow`, también con el host `mupa.ar`; `no-store` en todo salvo los assets
   - `/administracion/assets` de `dist/panel/assets` con `immutable`, un año y `fallthrough: false`; `/administracion/manual.pdf`
   - `/administracion/api` con `express.json` (100 kB; 300 kB en contenido), CSRF, límites, routers y 404 en JSON. **Corrección de E3 (16/10/2026):** los 300 kB son de las rutas que guardan textos con formato (`PUT /museo` y `PUT /novedades`, `/muestras` y `/salas/:id`: `limiteJson` en la tabla de `server/api/indice.js`); cada texto, hasta 90.000 bytes de JSON en su forma canónica (`BYTES_MAX` de `compartido/esquemas/textoRico.js`, con su mensaje en el campo), así uno con demasiado formato da 400 en su campo, no el 413 genérico, y los tres de Visitas en su forma canónica entran juntos. **Quedan dos detalles de severidad baja** (verificación de E3, sin corregir): el panel no manda la forma canónica sino el JSON del editor, que lleva `target`, `rel`, `class` y `title` en cada enlace (unos 80 bytes más que la forma canónica), así tres textos de Visitas cerca del tope y con cientos de enlaces, cambiados a la vez, pueden pasar los 300 kB y dar el 413 genérico (COD-09: mandar el resultado de `textoRico.safeParse`, que el panel ya calcula); y el parser de 300 kB de `/salas/:id` y `/muestras/:id` lee también `/salas/orden` y `/muestras/orden` (COD-08: saltearlo si el `:id` no es un id)
   - todo otro GET de `/administracion` o `/administracion/…` → `dist/panel/index.html` con `no-store` (si falta el build del panel, una página 503 simple y `panel_sin_build` en el log; en desarrollo, el Vite del panel: E2.1)
6. **Redirecciones públicas:**
   - `/index.html` → `/`; `/preview` y `/preview/{*r}` → `/`
   - barras repetidas o finales, normalizadas con `'/' + req.path.split('/').filter(Boolean).join('/')`: nunca sale un `Location` que empiece con `//`
   - **no** se redirige `*.html`: `/google19017c966a32aec2.html` tiene que dar 200
7. **Estáticos públicos**, con la CSP pública (9): `/assets` de `dist/client/assets` con `immutable`, un año y `fallthrough: false`; la raíz de `dist/client` con `index: false`, un día y `no-cache` en los `.html`. Los dotfiles no se sirven.
8. **Público**, con la CSP pública: `/robots.txt`, `/sitemap.xml`, `GET` y `POST /contacto`, rutas SSR (6.1) y la 404. No hay API fuera de `/administracion/api`: `/api/…` da la 404 del sitio. **Cómo quedó en E4:** `/sitemap.xml` se arma con lo publicado en cada pedido (`no-cache`; si la base falla, 503 con `no-store` y `Retry-After: 60`, 6.5); con `INDEXNOW_CLAVE`, `/<clave>.txt` (6.5); `POST /contacto` con sus middlewares en orden (8); `GET /contacto` es una ruta más de la tabla. El manifiesto del build (`/.vite/manifest.json`) no se sirve.
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
| `ESPACIO_BASE_MB` | 1024 (por defecto) | 1024 con el plan de 1 GB (el valor por defecto; si la base crece, 5120, 10240…) | el aviso de espacio del Inicio: `GET /estado` compara `pg_database_size` con este total y el panel avisa desde el 80 % (E3.1). Entero de 1 a 10.000.000; otro valor no deja arrancar, con su mensaje (`config.js`) |
| `CORREO_MODO` | consola | smtp | `memoria` en las pruebas. En producción, solo `smtp`. **E4.5:** sin definir, `consola` en desarrollo, `memoria` en las pruebas y `smtp` en producción |
| `SMTP_HOST` | — | `smtp.hostinger.com` | obligatoria con `SMTP_USUARIO` en `smtp` (E4.5) |
| `SMTP_PUERTO` | — | `sync: false`: 465 (587 si 465 no conecta) | 465 con SSL, 587 con STARTTLS. **E4.5:** 465 por defecto; en producción solo 465 o 587, salvo contra la propia máquina (`localhost`, `127.x`: el SMTP falso de las pruebas), y fuera de 465 exige STARTTLS (`requireTLS`; COD-05 de la verificación de E4: si no, la contraseña podía viajar sin cifrar) |
| `SMTP_USUARIO` | — | `sync: false`: `web@mupa.ar` | también es el From. Sin ella, el formulario queda apagado. En local, para verlo sin mandar nada: `SMTP_USUARIO=web@example.com` con `CORREO_MODO=consola` |
| `SMTP_CLAVE` | — | `sync: false` | la contraseña de la casilla de envío; obligatoria con `SMTP_USUARIO` en `smtp` (E4.5) |
| `USERWAY_ID` | — | `sync: false` | sin él no se carga nada de UserWay ni entra a la CSP (E4.7). Letras, números, `_` y `-`, hasta 64 |
| `INDEXNOW_CLAVE` | — | `sync: false`, opcional | **E4.6:** la clave de IndexNow (de 8 a 128 letras, números o guiones; la elige quien mantiene el sitio). Vacía, apagado: ni avisos ni `/<clave>.txt`. Con clave, avisa solo en producción y con el host `mupa.ar` |
| `SIN_BASE` | 1 (opcional) | — | Home con un `museo` de ejemplo "máximo" y otro vacío (6.7) |
| `DIR_BUILD` | `dist` o `dist-dev` | — | prueba de hidratación (13.3) |
| `DEPURAR_IP` | — | 1 solo durante la prueba de 10.1 | |
| `RENDER_EXTERNAL_URL` | — | la pone Render | host aceptado y origen permitido antes del corte (sitio, panel y formulario) |

No hay variable para el panel: es la ruta fija `/administracion` (`RUTA_PANEL` en `compartido/panel.js`) del host que se esté usando. La usan el servidor, `vite.panel.config.js` y el router del panel.

No hay `DIR_FOTOS`: las fotos van en la base (16.1, decidido el 15/10/2026). `ESPACIO_BASE_MB` la reemplaza en `.env.example` y en `config.js`.

**Prueba de producción en local:** `URL_PUBLICA=http://localhost:5183/` y `NODE_ENV=production`; el panel queda en `http://localhost:5183/administracion/`. Así GA queda activo en local y se usa `analitica-check`. Para no mandar mails de verdad, `CORREO_MODO=smtp` con un `SMTP_HOST` inexistente: el formulario recorre el camino del envío fallido. **Cómo quedó (E4.5):** `CORREO_MODO=smtp SMTP_HOST=smtp.invalid SMTP_USUARIO=web@example.com SMTP_CLAVE=x` (está en `.env.example`); con `CORREO_MODO=consola` la producción no arranca. Las verificaciones de E4 usaron además un SMTP falso local, escrito con `node:net` (`server/pruebas/smtpFalso.js`: acepta, rechaza con 535 o corta), dentro del mismo proceso: ningún mail salió a la red.

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

-- 03 fotos (y sus archivos: 16.1, decidido el 15/10/2026)
CREATE TABLE fotos (
  id serial PRIMARY KEY,
  clave char(16) NOT NULL,                          -- 64 bits al azar: /fotos/<clave>/960.webp
  ancho int NOT NULL, alto int NOT NULL,            -- de la maestra, ya orientada
  variantes jsonb NOT NULL,                         -- los anchos nominales [480, 960, 1600, 2400]; real = min(variante, ancho)
  bytes int NOT NULL,                               -- lo que ocupan los cinco archivos juntos
  alt varchar(250) NOT NULL DEFAULT '', decorativa boolean NOT NULL DEFAULT false,
  epigrafe varchar(300), credito varchar(120),
  subida_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CONSTRAINT fotos_clave_unico UNIQUE (clave),
  CONSTRAINT fotos_clave_hex CHECK (clave ~ '^[0-9a-f]{16}$'),
  CONSTRAINT fotos_alt_o_decorativa CHECK (decorativa OR alt <> ''),
  CONSTRAINT fotos_medidas_positivas CHECK (ancho > 0 AND alto > 0 AND bytes > 0)
);
CREATE TABLE fotos_archivos (                       -- sin modelo de Sequelize: ningún listado lee "datos"
  foto_id int NOT NULL REFERENCES fotos ON DELETE CASCADE,
  variante varchar(8) NOT NULL,
  datos bytea NOT NULL,
  bytes int NOT NULL,
  PRIMARY KEY (foto_id, variante),
  CONSTRAINT fotos_archivos_variante_valida CHECK (variante IN ('480','960','1600','2400','og'))
);
ALTER TABLE fotos_archivos ALTER COLUMN datos SET STORAGE EXTERNAL;   -- WebP y JPEG ya vienen comprimidos

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
  mensaje text NOT NULL,
  envio varchar(10) NOT NULL DEFAULT 'pendiente',
  error varchar(40),                                -- código de nodemailer (EAUTH, ETIMEDOUT…), nunca el texto
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mensajes_contacto_mensaje_largo CHECK (length(mensaje) <= 5000),
  CONSTRAINT mensajes_contacto_envio_valido CHECK (envio IN ('pendiente','enviado','fallido'))
);
CREATE INDEX mensajes_fecha ON mensajes_contacto (created_at DESC);
```

**Cómo quedó en E4.9 (19/10/2026):** migración `20261019-06-mensajes-contacto.js`, con las dos restricciones con nombre (las de arriba) y el índice por fecha (la lista del panel y el borrado de los de más de 180 días); modelo `MensajeContacto`, sin asociaciones. Además de los códigos de nodemailer, `error` puede ser `SIN_DESTINO` (el destino no se pudo leer: ver 8, "Lo que quedó abierto"). Un envío que pasa su tope de tiempo deja la fila en `pendiente` hasta que termina, y ahí se anota.

**Galerías:** tablas con FK reales, armadas con la fábrica `definirGaleria(nombre, modeloPadre)`. Por ahora solo muestras y novedades; la de salas se suma con el módulo 4.

**Qué se calcula y no se guarda:**
- **Público:** `estado = 'publicado'`.
- **Estado de una muestra**, con el "hoy" de San Juan: Actual (`fecha_inicio <= hoy AND (fecha_fin IS NULL OR fecha_fin >= hoy)`), Próxima, Finalizada o Permanente.
- **Actividad:** "Realizada" si `coalesce(evento_fin, evento_inicio) < now()`.

**Eliminar contenido**, todo en una transacción:
1. Se juntan los ids de la portada y de la galería.
2. Se borra la fila; las galerías caen en cascada.
3. `liberarFotos(ids, t)` borra las fotos que ya no usa nadie (`almacen.liberar`; quién usa una foto lo dice solo `server/fotos/usos.js`). Desde la corrección de E3, en dos pasos: primero bloquea esas fotos (`FOR UPDATE`) y después borra, en otra sentencia, las que no se usan (7).
4. Con Postgres, sus archivos caen en cascada en la misma transacción; la caché en memoria de `/fotos` se limpia **después del commit**.

Lo mismo pasa al reemplazar una portada o al quitar una foto de una galería.

**Cómo quedó en E3.3 y E3.4 (16/10/2026):** migraciones `20261016-04-salas-muestras.js` y `20261016-05-novedades.js` (con la fecha del día, como la 03). Además de lo de arriba: `estado` con su `CHECK` (`<tabla>_estado_valido`), el patrón del slug con nombre (`<tabla>_slug_valido`), publicada ⇒ `publicado_en` (`<tabla>_publicada_con_fecha`), `novedades_inscripcion_https`, las únicas `<tabla>_slug_unico` y `salas_plano_ref_unico`, y un índice por cada columna que apunta a `fotos` (las portadas y `galeria_*.foto_id`: los usan `liberarFotos` y la tarea de las huérfanas). Las galerías tienen sus columnas `NOT NULL` y sus modelos salen de `definirGaleria(sequelize, nombre, modeloPadre)`. Quién usa una foto está en `server/fotos/usos.js` (las tres portadas y las dos galerías). Los estados calculados, en `compartido/estados.js`; la hora de una actividad, en `compartido/fechas.js` (`instanteDeLocal`, `localDeInstante`). Al eliminar, las fotos se liberan dentro de la misma transacción y la caché se limpia después del commit (con Postgres no hay archivos en disco).

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

- **Archivos:** `20261013-01-usuarios.js`, `20261013-02-museo-visitas.js`, `20261016-03-fotos.js`, `20261016-04-salas-muestras.js` y `20261016-05-novedades.js` (hechas; las 03 a 05 llevan la fecha en que se hicieron, no la del calendario, 26/10), y `20261019-06-mensajes-contacto.js` (E4.9, hecha el 19/10; el calendario decía 09/11). Lo único que importa es que la fecha va adelante: el orden alfabético es el de aplicación. Cada uno exporta `up` y `down`; los `CHECK` y los índices van como SQL fijo, en una transacción. Las 03 a 06 son aditivas (el sitio en marcha no usa sus tablas): se aplicaron en `mupa_dev` con `npm run migrar` sin cortar el `npm run dev` (la 06, el 19/10/2026). La verificación de E4 la probó de ida, vuelta e ida en un esquema aislado: el `down` deja intactas las tablas de la 05 y el segundo `up` da las mismas restricciones e índices.
- **En producción:** `preDeployCommand: npm run migrar`. Corre después del build y, si falla, aborta el deploy ([render.com/docs/deploys](https://render.com/docs/deploys), 08/10/2026).
- **Riesgo conocido:** umzug anota la migración en `SequelizeMeta` después de que termina su `up`, fuera de su transacción. Si el pre-deploy muere justo entre el COMMIT de la migración y ese registro, la migración queda aplicada pero figura pendiente, y el deploy siguiente falla al repetirla (la tabla ya existe). Arreglo a mano, desde el Shell de Render: comprobar que el esquema tiene lo de esa migración y registrarla con `INSERT INTO "SequelizeMeta" (name) VALUES ('<archivo>.js')` (anotado en la verificación de E1, 13/10/2026).
- **Regla expand/contract:** mientras corre el pre-deploy la versión anterior sigue sirviendo. Una columna nueva entra nullable o con default, y lo que se saca se borra en una migración posterior.
- **`sync()` no aparece en ningún archivo.** `migraciones.test.js` (desde E1) y `contenido.test.js` (desde E3.3, en `server/`, `panel/src`, `src/` y `compartido/`) lo buscan con grep.
- **E3 (16/10/2026):** `migraciones.test.js` tiene una tabla `TABLAS_DE` por migración: una migración nueva suma una línea con sus tablas (y sus restricciones con nombre van en las listas de la prueba) en vez de reescribir la prueba de ida y vuelta.

### 3.4 Datos iniciales

- **En la migración 02**, que va a producción: la fila `museo` vacía y los 7 días cerrados. No se inventa ningún dato del museo.
- **`semillas/ejemplo.js`**, solo local (no corre con `NODE_ENV=production`) y crece con cada migración: contenido marcado "EJEMPLO ·", con 2 salas, 3 muestras (actual, próxima y finalizada), 4 novedades (una actividad pasada y otra futura), tarifas, horarios y 3 mensajes de contacto (uno fallido). **E3.3 (16/10/2026):** las salas, muestras y novedades están, publicadas, con las fechas corridas desde hoy y portadas de un color liso hechas con sharp; al repetirla se reemplazan y sus fotos se liberan. La guarda no acepta una URL de la base con parámetros, así que no corre contra un esquema aislado (`?options=-c search_path=…`): la prueba es `contenido.test.js`, que la corre dos veces. En `mupa_dev` no se corrió la versión de E3. **E4.9 (19/10/2026):** suma 3 mensajes de contacto marcados "EJEMPLO ·", uno `fallido`, de hace unas horas; al repetirla también se reemplazan. Tampoco se corrió en `mupa_dev`.
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
| 409 | slug repetido o último admin. **Desde E3:** una portada, una foto de la galería o una sala que ya no existe ("volvé a subirla", con `faltan`), una galería que otra persona cambió mientras tanto, un orden que no coincide con lo que hay, una dirección que ya quedó fija |
| 413 | archivo grande; **desde E3**, también más de 50 megapíxeles, un JPG progresivo o un PNG entrelazado que ocuparía demasiado al decodificarlo (7) y un cuerpo de más de 100 kB (300 kB en lo que lleva textos con formato, 2.4) |
| 415 | tipo de foto no admitido (SVG y HEIC con su mensaje) |
| 429 | límite |
| 503 | sin base; **desde E3**, ya hay 3 fotos subiéndose (`Retry-After: 30`) o demasiadas lecturas de fotos esperando |

**Errores:** los traduce solo `server/errores.js`: `SequelizeUniqueConstraintError` → 409, `ZodError` → 400, `40P01` → 409 "reintentar", el resto → 500 genérico. **Corrección de E3 (16/10/2026):** también `23503` (una clave foránea: algo que se borró o se empezó a usar en el medio) → 409 "Otro cambio se cruzó con este. Recargá la pantalla y probá de nuevo.", con una línea de aviso en el log. Es una red: los pedidos de fotos ya se bloquean para que no pase (7). Un 503 que es un `httpError` (la cola de fotos, sin argon2) va al log como aviso, sin el stack.

**Entrada:** ids con `parseId` y búsquedas con `escapeLike` (los dos en `server/api/entrada.js`; `escapeLike` desde E3.3); listados con `?pagina=` y `?por=` (100 como máximo; la consulta se valida con zod: algo malo da 400 con los campos); a Sequelize llega **solo lo que devolvió `esquema.parse`**; `creado_por` y `actualizado_por` salen siempre de `req.usuario.id`.

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
| GET / PUT | `/museo` | editor (`email_destino_contacto`: admin, si no → 403) | Incluye los textos de Visitas, el aviso y la compra externa. **E2.3 (14/10/2026):** el PUT es parcial (cambia solo los campos que trae, al menos uno): Datos del museo y Visitas guardan campos de la misma fila y, si no, una pisaría a la otra. Las reglas de dos campos (compra activa con su dirección; "Mostrar hasta" con el texto del aviso) se revisan sobre la fila como quedaría, con la fila bloqueada. Un editor que manda el correo de destino recibe 403 antes de validar, y el GET no se lo da. Los textos con formato (`comoLlegar`, `normas`, `accesibilidad`) entraron con E3.2 (16/10/2026): validados con `textoRico.js` y guardados en su forma canónica; vacíos, null. Una columna con su nombre de la base (`como_llegar`) se sigue descartando. Desde la corrección de E3 (16/10/2026), el pedido admite 300 kB (los tres textos juntos, cada uno en su tope) |
| GET / PUT | `/horarios` | editor | Los 7 días en un PUT. Hasta 2 franjas, con `abre < cierra`. Un día cerrado descarta sus franjas sin validarlas; dos franjas pueden tocarse (13:00 y 13:00) (E2.4) |
| GET / POST | `/tarifas` | editor | Hasta 50 (409). **E2.4:** el alta va al final y, si el orden tiene huecos, primero renumera 1..n (`orden` es `smallint`: con max + 1, altas y bajas lo llevaban a 32767 y daba 500). Altas y cambios de orden van de a uno (`LOCK TABLE tarifas IN SHARE ROW EXCLUSIVE MODE`) |
| PUT / DELETE | `/tarifas/:id` | editor | Se recomienda ocultarla en vez de borrarla. El PUT exige la tarifa completa, sin valores por defecto (E2.4). Una gratuita se guarda sin precio |
| PUT | `/tarifas/orden` | editor | `{ids}` con todas las tarifas: si no coinciden con las que hay, 409. Va antes de `/tarifas/:id` en la tabla (E2.4) |
| GET / POST | `/novedades`, `/muestras`, `/salas` | editor | Listado `?estado=&tipo=&q=&pagina=&por=` (`{ items, total, pagina, por, paginas }`). El POST crea un borrador: exige el título (y el tipo) y el slug sale de él |
| PUT | `/muestras/orden`, `/salas/orden` | editor | `{ids}` con todas: si no coinciden con las que hay, 409. Van antes de su `:id` en la tabla (E3.3) |
| GET / PUT | `/novedades/:id`, `/muestras/:id`, `/salas/:id` | editor | El PUT recibe el esquema completo (300 kB, `portadaAntes` opcional). Si ya está publicada, la valida como publicada |
| POST | `/<tipo>/:id/publicar` | editor | Valida para publicar (también la portada no decorativa), pone `publicado_en` la primera vez y congela el slug |
| POST | `/<tipo>/:id/despublicar` | editor | Vuelve a borrador (`publicado_en` se queda) |
| DELETE | `/<tipo>/:id` | editor | Eliminación real (con diálogo en el panel). Libera sus fotos |
| PUT | `/muestras/:id/galeria`, `/novedades/:id/galeria` | editor | `{fotos:[id], antes?:[id]}` en orden, hasta 40. Con `antes`, 409 si otra persona la cambió |
| POST | `/fotos` | editor | multipart (sección 7): `foto` y `alt`, `decorativa`, `epigrafe`, `credito`. 201 con la foto |
| PATCH | `/fotos/:id` | editor | `{alt?, decorativa?, epigrafe?, credito?}`. La portada de algo no puede pasar a decorativa (400, desde E3.3) |
| GET | `/mensajes` | admin | Solo lectura, de la más nueva a la más vieja, `?pagina=` (50 por página). **E4.9 (19/10/2026):** `{ items, total, pagina, por, paginas }`, cada uno `{ id, fecha, nombre, email, mensaje, envio, error }` (`envio`: `pendiente`, `enviado` o `fallido`; `error`, el código); una `?pagina=` que no es un entero de 1 a 100.000, 400 en el campo; una editora, 403 |
| GET | `/estado` | editor | Para el Inicio: "Para completar", un solo admin, estado del correo (8), tareas fallidas y el espacio de la base. **E2.2:** devuelve códigos, no textos (`{ paraCompletar, unSoloAdmin, correo, tareasFallidas }`; los textos los pone el panel), en una sola consulta; `unSoloAdmin` llega a los dos roles y el correo de destino figura en `paraCompletar` solo para un admin. **E3.1:** suma `espacio: { usadoMb, totalMb }` (`pg_database_size` contra `ESPACIO_BASE_MB`, a los dos roles); el Inicio avisa desde el 80 %. Era el lugar de las "fotos faltantes" del disco. **E4.9:** `correo` pasa a `{ estado: 'sin_configurar' | 'ok' | 'falla', formulario, desde, codigo, sinEnviar }`, a los dos roles y en la misma consulta: `falla` si la casilla falló en su última prueba o envío, o si hay mensajes `fallido` después del último `enviado`; `formulario`, si el sitio lo dibuja (casilla y destino). Nunca direcciones: códigos, fechas y cantidades |

No hay `/copia/fotos`: era la copia de las fotos en disco (E3.6), que con 16.1 no existe (las fotos van en las copias de la base).

`server/api/contenido.js` es una fábrica (modelo, esquema, galería) que arma las rutas de los tres tipos. `api/indice.js` exporta la tabla `[{metodo, ruta, rol}]`, que recorre `permisos.test.js` (al cerrar E3: 22 rutas con cuerpo, 23 con `:id` y 5 de admin; con `GET /mensajes`, desde E4.9, 6 de admin). Desde E4.6, las rutas que publican, despublican, eliminan o cambian algo publicado le avisan a IndexNow (`ctx.indexNow`, 6.5); nunca por un borrador.

**Cómo quedaron las rutas de contenidos (E3.3 y E3.4, 16/10/2026):** las rutas van con el nombre del tipo (`/novedades/:id`, no `/:tipo/:id`), así cada una entra sola en `permisos.test.js`. El listado devuelve `{ items, total, pagina, por, paginas }`, sin los textos con formato ni la galería; acepta `?tipo=` (noticia/actividad, temporal/permanente) y `q` busca en el título (nombre), la dirección y el resumen; novedades de la más nueva a la más vieja (publicación o, si no, creación), salas y muestras en su orden. El alta lleva el título (y el tipo: noticia y temporal si no viene); la dirección sale del título y, si ya está, `-2`, `-3`… (las altas de un tipo van de a una —`LOCK TABLE` en salas y muestras, como las tarifas; un `pg_advisory_xact_lock` en novedades—, y si choca con un cambio de dirección hecho a la vez, se repite). Salas y muestras nuevas van al final del orden. El PUT recibe el esquema completo (un campo que falta, 400); una dirección vacía en un borrador se vuelve a armar con el título; otra dirección en algo que ya se publicó alguna vez, 409 en `slug`. La ficha (GET, PUT, publicar, despublicar, galería) trae los campos, `portada` y `galeria` con los datos de cada foto, `estado`, `publicadoEn`, `slugFijo` y `ultimaEdicion`. Portada, fotos de la galería o sala que ya no existen: 409 en su campo ("volvé a subirla"); se bloquean con `FOR KEY SHARE` hasta el commit. La hora de una actividad va y viene como `AAAA-MM-DDTHH:MM` de San Juan. `PUT /salas/orden` y `/muestras/orden` (`{ids}` con todas; si no, 409) van antes de su `:id` y responden la lista; no cambian la última edición. Desde E3.3, `PATCH /fotos/:id` no deja pasar a decorativa la portada de nada (400). **Corrección de E3 (16/10/2026):** el PUT de un contenido admite 300 kB y, opcional, `portadaAntes` (la portada con que se abrió la ficha: si otra persona la cambió y este pedido no la tocó, queda la suya; si las dos la cambiaron, gana este pero la otra no se borra en el momento); la galería, `antes` (si otra persona la cambió mientras tanto, 409 en `fotos`, en vez de borrar para siempre lo que agregó); el 409 de una foto que ya no está trae `faltan` (los ids), que el panel marca en la galería.

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
| Usuarios (alta, contraseñas temporales, roles) | no | sí |
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

- Es la misma regla para el panel y el formulario: los dos están en el mismo origen. **E4.5:** la regla es `crearVerificadorDeOrigen` (`server/seguridad.js`); la API la usa con su 403 en JSON y `POST /contacto` con una página 403 simple, sin línea en el log.
- `same-site` se rechaza: solo hace falta `same-origin`, y `same-site` incluiría cualquier otro subdominio de `mupa.ar`.
- **Lo que no cubre:** un script que corre en una página pública del mismo origen llega como `same-origin`. Es el riesgo aceptado de 9.
- No se usa el paquete `cors`. Las rutas JSON exigen `Content-Type: application/json`, salvo `POST /administracion/api/fotos` (multipart: la lista `MULTIPART` de `server/seguridad.js`, E3.1). El CSRF corre igual en el multipart, antes de multer.

Fuente: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), 08/10/2026.

### 4.7 Límites de intentos

`express-rate-limit` 8.7.1 en memoria; alcanza porque hay una sola instancia.

| Ruta | Límite | Clave |
|---|---|---|
| `POST /administracion/api/sesion` | 10 cada 15 min | IP |
| `POST /administracion/api/sesion` | 5 **fallidos** cada 15 min (un ingreso correcto los pone en cero: no se acumulan entre ingresos buenos) | correo + IP: nadie puede dejar afuera al titular desde otra IP |
| `POST /contacto` | 5 por hora; 50 por día en total (desde E4.5, el día de San Juan: vuelve a cero a la medianoche) | IP; contador global |
| `POST /administracion/api/fotos` | 60 por hora (cuentan también las subidas rechazadas; va antes de multer: con un archivo de 25 MB, 429 y no 413) | usuario. Además, como mucho 3 subidas en curso entre todas las cuentas (`cola.reservar()`, 7): la cuarta, 503 |
| `PUT /administracion/api/cuenta/clave` | 5 con la contraseña actual **equivocada** cada 15 min (el cambio correcto los pone en cero; una nueva que no cumple las reglas no cuenta) | usuario: con una sesión robada no se puede probar la contraseña de a miles (sumado en la corrección de E1, 13/10/2026) |
| `/administracion/api/*` con sesión | 300 por minuto | usuario |

- **Los 50 por día del formulario** quedan por debajo del límite de la casilla de envío (100 por día en el correo gratuito de Hostinger, ver 8). Un reinicio solo pone el contador en cero.
- La respuesta 429 dice "Demasiados intentos. Esperá 15 minutos" (en Contacto, "Probá mañana o escribinos a <correo público>"). Es una espera, nunca un bloqueo permanente. **Depende de que `trust proxy` esté bien** (10.1).
- El log lleva una sola línea por ventana y clave (el primer pedido bloqueado: `limite_ingreso_ip`, `limite_ingreso_correo`, `limite_clave_actual`, `limite_usuario`, desde E3.1 `limite_fotos` y desde E4.5 `limite_contacto_ip` y `limite_contacto_dia`), sin la IP ni el correo (corrección de E1, 13/10/2026).
- **Cómo quedaron los de `POST /contacto` (E4.5 y la corrección de E4, 20/10/2026; `crearLimitesDeContacto`):**
  - Van **después** del esquema y del mensaje repetido (8): un error de validación o un doble clic no gastan intentos.
  - **Todo pedido válido que llega cuenta, y nunca se descuenta** (sin `skipFailedRequests`). Con el descuento, express-rate-limit devolvía el lugar del pedido cuya conexión se cortaba antes de la respuesta, pero el mensaje se guardaba y salía igual: cortando la conexión se mandaron 76 mensajes contra un tope de 50 (COD-01 de la verificación, severidad alta). Un 503 (la base y el correo caídos a la vez) también cuenta.
  - No responden ellos: marcan el pedido y la página se vuelve a dibujar con lo escrito, el aviso y `Retry-After` (429).
  - **Sin las cabeceras `RateLimit`** (CON-03): la del límite de todos publicaba cuántos mensajes recibió el museo en el día.
  - Queda, de severidad baja (CON-10): el `Retry-After` del límite de 50 por día sale del primer pedido más 24 h y no de la medianoche de San Juan, cuando vuelve a cero el contador (llega a decir casi un día cuando faltan horas; la página dice "Probá mañana", que está bien). Arreglo: calcularlo hasta las 00:00 del día siguiente con `instanteDeLocal`.

### 4.8 Quién cambió qué

- Cada listado y cada ficha muestra "Última edición: <persona>, <fecha>", con `actualizado_por` y `updated_at`.
- Los inicios de sesión, los cambios de clave y los errores quedan en el log de Render (7 días, sin IP ni correos).
- La pantalla Actividad y la tabla `registro_cambios` están en la fase 2. Cuando se sumen, `password_hash` y `token_hash` no se registran nunca, con una prueba que lo verifique.

---

## 5. Panel

### 5.1 Construcción

**Librerías:** React 19.3; `react-router` 7 en **modo Data** (`createBrowserRouter(rutas, { basename: '/administracion' })` y `<RouterProvider>`; Vite con `base: '/administracion/'`); Tailwind 4 con su propia hoja; `fetch`; TipTap con `React.lazy`, solo en las fichas y en Visitas (E3.2). Sin kit de componentes, sin librería de formularios y sin gestor de estado.

**Estilo:** claro, neutro y de alto contraste, con `system-ui`. Máximo 72 rem y una sola columna a 320 px. No es trabajo de la diseñadora.

**`api.js`:**
- `pedir(metodo, ruta, cuerpo)` con `credentials: 'same-origin'`.
- **En todo `POST`, `PUT` y `PATCH` manda `Content-Type: application/json` y un cuerpo, `'{}'` si la ruta no lleva datos** (p. ej. `POST /usuarios/:id/clave-temporal`): la API responde 415 a esos métodos sin ese Content-Type aunque no traigan cuerpo (`exigirJson`, `server/seguridad.js`; anotado en la verificación de E1, 13/10/2026).
- Un 401 abre `ReingresoDialogo` (un `<dialog>` de inicio de sesión) y reintenta el pedido, sin perder el formulario.
- Un 403 con `debeCambiarClave` lleva a `/cambiar-clave`.
- Los 400 se reparten a cada campo; los 409 (slug repetido, último admin) se muestran junto al campo o arriba.
- Un error de red (sin conexión, o un deploy en curso) muestra "Sin conexión, reintentá" y el formulario queda como estaba.
- `vite:preloadError` (un chunk que ya no existe después de un deploy) muestra "Hay una versión nueva del panel: guardá y recargá".

**Lo que E2 agregó o cambió (14/10/2026):**
- **Reingreso:** el diálogo recuerda el correo después de "Ahora no". Si entra **otra** cuenta (una computadora compartida), el pedido no se repite: el panel vuelve al Inicio sin preguntar por los cambios sin guardar, para que lo escrito por la primera no se guarde a nombre de la segunda; si vuelve la misma persona con otro rol, la pantalla se recarga. Con la temporal vencida, el diálogo no tiene campos: solo "Ir a Ingresar". La decisión está en `panel/src/reingreso.js`, contra la última sesión conocida.
- **Sin `<ScrollRestoration />`**, que guarda las posiciones en `sessionStorage` (9 no lo permite): cada pantalla nueva arranca arriba.
- **zod en el panel con `jitless`** (`compartido/esquemas/zod.js`, vale también para el servidor): al definir un `z.object` zod prueba `new Function`, y la CSP del panel lo informaba como violación. El panel valida con el mismo esquema del servidor antes de mandar (`validarCon`).
- **Barra:** fija arriba solo desde lg; en el celular son dos filas que se van con el scroll, con Salir siempre a la vista. Salir navega a `/salir`, así un formulario sin guardar pregunta antes de cerrar la sesión. Mientras carga la pantalla siguiente, "Cargando…" a los 400 ms y `aria-busy` en el `<main>`.
- **Un solo bundle**, sin división en partes: al cerrar E2, 489 kB de JS (127 kB con Brotli). TipTap tiene que ir con `React.lazy` (E3.2); partir por ruta, cuando crezca.

**Lo que E3 agregó o cambió (16/10/2026):**
- **El editor en su propio archivo** (E3.2): `Editor-*.js`, 407 kB (109 kB con Brotli: TipTap y ProseMirror), que se pide solo en las pantallas con un editor (Visitas y las fichas; sus loaders llaman a `precargarEditor()`). Si no llega (sin conexión, un deploy que lo borró), el lugar de cada texto lo dice y el resto de la pantalla sigue andando.
- **El principal, al cerrar E3:** 571.578 B (147 kB con Brotli) y 22 kB de CSS; Vite avisa que pasa de 500 kB. Partirlo (`lazy` de React Router en Novedades, Exposiciones, las altas y las fichas, que se llevarían SubirFoto, Portada, Galeria y DatosFoto) queda **como decisión del desarrollador** (hallazgo COD-07 de la verificación). Unos 15 kB son `to-json-schema` de zod, que no se usa.
- **`api.subir(ruta, formData, { alProgreso, alProcesar, signal })`**: `XMLHttpRequest` (para el progreso), con las mismas reglas que `pedir` (401 con reingreso y un solo reintento, 403 con `debeCambiarClave`, sin red). `quizasGuardo` (de E2) también vale para las altas de contenido.
- **La barra fija** (desde lg): un `ResizeObserver` en `Marco.jsx` pone `--alto-barra` y `scroll-padding-top` es `calc(var(--alto-barra) + 1rem)`: con Novedades y Exposiciones, entre 1024 y ~1180 px la barra pasaba a dos filas y tapaba el foco con Mayús+Tab (WCAG 2.4.11). Entre lg y xl, "Mi cuenta" va sin el nombre.
- **Cambios sin guardar con detalle** (el `useCambiosSinGuardar(sucio, detalle)` de la corrección de E2): en una ficha dice qué falta, entre los datos de la ficha, las fotos o el orden de la galería, los datos de una foto y las fotos elegidas que todavía no se subieron ("Falta guardar: los datos de la ficha y los datos de una foto.").

**Lo que E4 agregó o cambió (19-20/10/2026):** la pantalla Mensajes (E4.9, 5.2) y el aviso del correo en el Inicio (8); `Pendiente.jsx`, que ya no usaba ninguna ruta, se borró. El principal pasó a 577.027 B (148 kB con Brotli) y 22.197 B de CSS; el editor sigue en 406.999 B. Partirlo sigue siendo decisión del desarrollador (COD-07 de E3).

**Subida de fotos:** con `XMLHttpRequest`, para mostrar el progreso ("Subiendo… 45 %" y después "Procesando foto…"). Antes, el navegador la achica (5.5 y 7).

### 5.2 Pantallas (bajo `/administracion`)

Las rutas de la tabla son relativas a `/administracion`: `/novedades` es `https://mupa.ar/administracion/novedades`.

| Ruta | Pantalla | Rol | Contenido |
|---|---|---|---|
| `/ingresar` | Ingresar | — | Correo y contraseña (`username` y `current-password`). Debajo: "¿Olvidaste tu contraseña? Pedile a un administrador una contraseña temporal" |
| `/cambiar-clave` | Cambiar la contraseña | con sesión | Obligatoria con una temporal. Actual y nueva (`new-password`), mostrar u ocultar, ayuda. No deja ir a otra pantalla hasta cambiarla |
| `/` | Inicio | editor | Accesos directos, "Para completar" (datos vacíos, horarios sin cargar, sin tarifas, sin correo de destino), aviso de un solo admin, **aviso del correo** (8), tareas fallidas y, desde E3.1, el espacio de la base (desde el 80 %: "La base de datos se está llenando", con los MB y el pedido de avisarle a quien mantiene el sitio) |
| `/novedades` (+ `/nueva`, `/:id`) | Novedades | editor | Listado (tarjetas en celular) con estado, tipo y fecha. Filtros |
| `/exposiciones` | Exposiciones | editor | Pestañas Muestras y Salas. Orden con botones |
| `/muestras/:id`, `/salas/:id` (+ `/muestras/nueva`, `/salas/nueva`) | Ficha | editor | 5.3 |
| `/visitas` | Visitas | editor | Horario semanal, Tarifas, Textos, Aviso y Compra de entradas |
| `/museo` | Datos del museo | editor | Contacto, dirección, mapa, redes. El correo de destino, solo para admin |
| `/mensajes` | Mensajes | admin | Lista de solo lectura del formulario (8). **E4.9:** la página en la dirección (`?pagina=2`: Atrás vuelve a la misma; una que no es un número es la primera, una que pasa del total lo dice y lleva a la primera); al cambiar de página, la cuenta se anuncia y recibe el foco, como en Novedades. Cada mensaje con la fecha, el nombre, el correo (`mailto:`), el texto y "Enviado por correo", "No se pudo enviar por correo" (con el código) o "Envío sin confirmar" (`pendiente`: el proceso se cortó entre el guardado y el envío) |
| `/usuarios` | Usuarios | admin | Alta (nombre, correo, rol) con el diálogo de la temporal; "Dar contraseña temporal"; rol; activar o desactivar; cerrar sesiones (sin copia de fotos: van en la base, 16.1) |
| `/cuenta` | Mi cuenta | editor | Nombre, contraseña, cerrar sesión en todos lados |

**Barra superior**, siempre en el mismo lugar (WCAG 3.2.6): Inicio, Novedades, Exposiciones, Visitas y Datos del museo; Mensajes y Usuarios para admin. A la derecha: Ayuda (abre `/administracion/manual.pdf`), el nombre (lleva a Mi cuenta) y **Salir, siempre visible** (también en el celular): el manual pide cerrar sesión al terminar (9).

**Al cerrar E2 (14/10/2026):** la barra tiene Inicio, Visitas, Datos del museo y Usuarios (Novedades y Exposiciones entran con E3.3 y E3.4, Mensajes con E4.9 y Ayuda con E6.2, en `panel/src/navegacion.js`); el enlace dice "Mi cuenta", con el nombre desde pantallas medianas. `/cambiar-clave` sirve también para el cambio voluntario, aunque Mi cuenta ya tiene su propio formulario de contraseña. En el celular el Tab recorre las secciones antes que Mi cuenta y Salir (el orden de escritorio), a propósito. Una cuenta desactivada no puede entrar (4.4): Usuarios le ofrece "Activar" y no "Dar contraseña temporal", y la API rechaza esa temporal con 409 (corregido el 14/10/2026).

**E3.3 y E3.4 (16/10/2026):** la barra suma Novedades y Exposiciones (las fichas de muestras y salas la marcan como Exposiciones, con `aria-current="true"`). El alta tiene pantalla propia en los tres tipos (`/novedades/nueva`, `/muestras/nueva`, `/salas/nueva`: tipo y título; crea el borrador y sigue en la ficha); `/muestras` y `/salas` solos llevan a Exposiciones. Novedades: filtros de estado y tipo y búsqueda en la dirección del panel, de a 20, tabla desde md y tarjetas en el celular. Exposiciones: pestañas Muestras y Salas (patrón de ARIA; la elegida en `?pestana=`; cambiar de pestaña no vuelve a pedir las listas), cada una con Subir y Bajar. El Inicio suma los accesos a las dos. **Corrección de E3:** la cantidad de cada pestaña sale de la lista que se ve, y después de un 409 del orden (otra persona agregó o borró una) la lista se vuelve a pedir y el aviso dice que ya está actualizada. Queda, menor: cada lista copia lo del loader al montarse, así que si el router recarga la pantalla sin desmontarla (un reingreso con otro rol) sigue con lo que tenía hasta volver a entrar.

**E4.9 (19/10/2026):** la barra suma Mensajes para admin (`panel/src/navegacion.js`), y el Inicio, su acceso directo (para admin) y el estado del formulario de contacto ("está en el sitio", "falta el correo al que llegan los mensajes" o el aviso del correo). Ayuda sigue esperando el manual (E6.2).

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
- **Novedades, muestras y salas (E3.3 y E3.4, 16/10/2026):** "(obligatorio para publicar)" junto a cada campo que lo pide; la actividad tiene su grupo (Empieza, Termina, Lugar, Costo, Enlace de inscripción, que se completa con `https://` al salir del campo) y una muestra permanente no muestra fechas; la Sala es un `<select>` con las salas (las que son borrador, marcadas); la dirección web se arregla sola al salir del campo (`crearSlug`) y desde la primera publicación es solo texto. Lo que no corresponde al tipo se guarda vacío.
- **Portada y Galería (E3.1 a E3.4, 16/10/2026):** la portada se elige y se sube en la misma ficha (sin "Foto decorativa"); la galería, hasta 40 fotos, de a 20 por vez como mucho. La descripción de cada foto, su epígrafe y su crédito se escriben antes de subirla y se pueden cambiar después (DatosFoto, que guarda solo la foto: `PATCH /fotos/:id`).
- **Textos de Visitas (E3.2, 16/10/2026):** sección "Textos" entre Tarifas y Aviso general, con los tres editores y un botón "Guardar los textos" (manda solo los que cambiaron). Cada texto avisa sus cambios sin guardar con su nombre ("Falta guardar: Cómo llegar."). La ayuda dice cuántos caracteres quedan.

### 5.4 Flujos

- **Estados** (`compartido/estados.js`): Borrador o Publicada; en muestras, Actual, Próxima, Finalizada o Permanente; en actividades, Realizada.
- **Botones:** en un borrador, "Guardar borrador" y "Publicar". En una publicada, "Guardar cambios" (aclara que salen al sitio al instante), "Ver en el sitio" y "Despublicar". "Ver en el sitio" abre la página pública con una ruta relativa (mismo host): antes del corte, en `mupa-web.onrender.com`; después, en `mupa.ar`.
- **Eliminar:** un `<dialog>` nativo con `showModal()` que nombra lo que se borra y propone: "Si solo querés que no se vea, despublicala".
- **Cómo quedó en E3.3 a E3.5 (16/10/2026):** "Publicar" valida en el panel con el mismo esquema y `problemasParaPublicar`, guarda lo que cambió y publica; el foco pasa a "Despublicar" (y al revés). "Despublicar" pregunta antes. "Ver en el sitio" espera a las páginas de E4 (`PAGINAS_PUBLICAS_DE_CONTENIDO`, en `compartido/contenidos.js`). Guardar manda la ficha y, si cambió, la galería (dos pedidos). Eliminar: el diálogo dice qué pasa con las fotos y, si está publicada, ofrece "Despublicarla en vez de eliminarla"; después vuelve al listado con el aviso. La pregunta por los cambios sin guardar de una ficha dice qué falta (los datos, la galería, los datos de una foto o fotos elegidas sin subir). **Corrección de E3:** después de guardar, lo que devuelve el servidor va solo a los campos que no se tocaron mientras tanto (`fusionarGuardado` de `pantallas/contenido/valores.js`; antes lo escrito durante el guardado se perdía sin aviso), y el panel manda la galería y la portada con las que abrió la ficha (`antes`, `portadaAntes`: 4.3). **Hasta E4 el panel no dice que algo "ya está en el sitio"**: con `PAGINAS_PUBLICAS_DE_CONTENIDO` apagada, publicar dice "Publicada. Las páginas de novedades y exposiciones del sitio todavía no están: lo publicado se va a ver ahí cuando se sumen." (`textosDelSitio` de `panel/src/contenidos.js`). Quedan dos frases del mismo tipo, de severidad baja: la ayuda de "Eliminar" en una ficha publicada ("Si solo querés que no se vea en el sitio, despublicala.") y la de Visitas ("Todo se ve en el sitio en cuanto se guarda.", de E2); el pie y la página de Visitas llegan con E4.
- **Desde E4 (19/10/2026):** `PAGINAS_PUBLICAS_DE_CONTENIDO` está en `true`: las fichas publicadas muestran "Ver en el sitio" (ruta relativa: `/novedades/<slug>`, `/exposiciones/<slug>` o `/exposiciones#sala-<slug>`) y `textosDelSitio` dice que lo publicado ya está en el sitio. Las dos frases de arriba pasaron a ser ciertas (FLU-04 de E3, resuelto).
- **Ediciones simultáneas:** gana el último guardado. El manual pide no editar la misma ficha a la vez; el aviso con control de versión está en la fase 2.
- **Cambios sin guardar:** `useBlocker` al cambiar de pantalla, más `beforeunload`. React Router admite un solo bloqueo por vez: una pantalla con varios formularios (Visitas, Mi cuenta) junta el `sucio` de cada uno en un solo `useCambiosSinGuardar` (E2, 14/10/2026); el diálogo de una tarifa cuenta, y con algo escrito Escape pregunta antes de descartar.

**Editor de texto** (`EditorTexto.jsx`):
- Configuración: `StarterKit.configure({ heading: { levels: [2] }, code: false, codeBlock: false, blockquote: false, horizontalRule: false, strike: false, underline: false, link: { openOnClick: false, autolink: true } })` y `ListItem.extend({ content: 'paragraph+' })`. Hay que verificar los nombres contra la documentación de TipTap 3.
- **Corrección de E3 (16/10/2026):** el enlace va con `link: false` en StarterKit y el `Link` de `@tiptap/extension-link` con `inclusive: false`: el de TipTap es inclusivo cuando tiene autolink y lo que se escribía después de un enlace (el punto, la frase siguiente) se guardaba adentro. Después de guardar, el editor pasa a mostrar lo guardado (sin las líneas en blanco, que la forma canónica no guarda), salvo que se haya escrito mientras se guardaba; lo escrito en ese momento queda y sigue como cambio sin guardar. El error del diálogo del enlace va con `ResumenErrores` (se anuncia también con Enter). **Ronda 2:** como el enlace no es inclusivo, ProseMirror no lo ve con el cursor justo después de su última letra (Fin, un clic a la derecha del renglón) ni justo antes de la primera (Inicio): el botón Enlace y el diálogo miran el texto de antes del cursor y, si no tiene enlace, el de después (`editorTexto/enlace.js`), así lo cambian o lo quitan entero y nunca ponen un enlace nuevo pegado a otro; el cursor queda donde estaba. El botón se ve activo también con el cursor pegado a un enlace, aunque lo que se escriba ahí quede afuera: quiere decir "Enlace cambia este enlace". **Queda, de severidad baja (FLU-07):** cuando el editor pasa a mostrar lo guardado (un texto con líneas en blanco), lo hace con `setContent` del documento entero fuera de la historia; prosemirror-history descarta los pasos anteriores y Deshacer queda habilitado sin hacer nada hasta vaciarse. Arreglo posible: borrar solo los párrafos vacíos con una transacción fuera de la historia (así se remapea) o vaciar la historia en el mismo momento.
- **Cómo quedó en E3.2 (16/10/2026; TipTap 3.32.0, nombres verificados en el código de `@tiptap/starter-kit`):** la configuración de arriba más `listItem: false` (va el propio) y `listKeymap: false` (va el propio, sin Tab), y en `link` también `linkOnPaste: true`, `defaultProtocol: 'https'` e `isAllowedUri` con la regla del servidor (`compartido/enlaces.js`). El `ListItem` propio deja solo Enter: Tab y Mayús+Tab siempre salen del editor (el de TipTap sacaba un elemento de la lista con Mayús+Tab, y la `ListKeymap` metía en la lista el párrafo que la sigue con Tab). `injectCSS: false`: los estilos de TipTap están en `panel.css`. Lo que se pega pasa por `pegar.js` (las listas de Word de escritorio, que son párrafos `mso-list`, pasan a `<ul>`/`<ol>`; los títulos de cualquier nivel, a subtítulo; las celdas de una tabla, a párrafos). El enlace se pone, cambia o quita en un `<dialog>` (en un portal: fuera del formulario de la pantalla) y acepta "www.…", un correo o un teléfono, que completa.
- **El esquema (`compartido/esquemas/textoRico.js`):** de forma fija (documento > lista > elemento > párrafo > texto: la profundidad no pasa de cinco); hasta 300 párrafos, subtítulos o elementos de lista y 20.000 caracteres; devuelve la **forma canónica** (sin párrafos ni elementos vacíos, textos seguidos con las mismas marcas juntos, marcas en orden fijo, `start` solo si no es 1), que es la que se guarda y la que compara el panel para saber si hay cambios sin guardar; vacío, null; un error por campo, con un mensaje para la persona.
- Barra: Negrita, Cursiva, Subtítulo, Lista, Lista numerada, Enlace (en un `<dialog>`) y Deshacer, con `aria-pressed`.
- Se guarda `editor.getJSON()`. El servidor lo valida con zod: nodos `doc`, `paragraph`, `heading` (nivel 2), `bulletList`, `orderedList`, `listItem`, `text` y `hardBreak`; marcas `bold`, `italic` y `link` (`https:`, `http:`, `mailto:` o `tel:`; 500 caracteres como máximo); hasta 300 bloques; las claves desconocidas se descartan. **Cómo quedó (E3.2):** el esquema no es recursivo sino de forma fija (arriba), y lo que se guarda es la forma canónica, no el JSON del editor. El panel manda `completarEnlaces(editor.getJSON())` (no la forma canónica: ver COD-09 en 2.4).
- El sitio lo dibuja `TextoRico.jsx` sin HTML crudo, con `<strong className="font-bold">` (por la trampa de `bolder` sobre el peso 300 que documenta CLAUDE.md). **E3.2:** vuelve a mirar cada enlace (`esEnlacePermitido`, sin zod), elige el nivel de los subtítulos (`nivelSubtitulo`) y recibe las clases de la página (`clases`): no trae estilos propios, porque una clase nueva en `src/` cambiaría el CSS del sitio. **Desde E4** lo usan la descripción de las salas en Exposiciones, las fichas de muestras y novedades y los tres textos de Visitas, en su propio archivo JS (6.2); las clases las pone cada página (las listas con `list-disc`/`list-decimal` y sangría, lo largo con `wrap-anywhere`) y los subtítulos van un nivel debajo del título de su sección.

### 5.5 Fotos en el panel

**`SubirFoto.jsx`:**
- `accept="image/jpeg,image/png,image/webp"`: Safari en iPhone convierte el HEIC a JPEG.
- Vista previa con `URL.createObjectURL`.
- **El alt es obligatorio antes de subir**, con una ayuda: "Describí lo que se ve: 'Cráneo de Herrerasaurus en la vitrina de la sala 2'". "Foto decorativa" deja `alt=""` y no se permite en la portada. Epígrafe y crédito, opcionales.
- Varias fotos se suben de a una, en cola.

**`Galeria.jsx`:** miniatura, alt editable, epígrafe y crédito; botones "Mover antes", "Mover después" y "Quitar", anunciados con `role="status"`. Sin arrastre (WCAG 2.5.7).

**Errores en castellano:** "La foto pesa 25 MB; el máximo es 20 MB." y "Esta foto está en formato HEIC. Exportala como JPG o elegí 'Más compatible' en el iPhone."

**Cómo quedó en E3.1 a E3.4 (16/10/2026; props de cada componente en su encabezado):**
- **Cuatro piezas** en `panel/src/componentes/`: `SubirFoto` (elegir, describir y subir, en cola), `Portada` (una foto, sin decorativa: reemplazar y quitar), `Galeria` (la lista con su orden, más un `SubirFoto` para agregar) y `DatosFoto` (con `Miniatura`: la descripción, el epígrafe y el crédito de una foto ya subida, que guarda solo esa foto con `PATCH /fotos/:id`). **No son `<form>`**: van adentro del formulario de la ficha, así Enter en sus campos guarda lo suyo y no la ficha. Son controladas: la ficha guarda `portadaId` y el orden de la galería.
- **El achique, antes de subir** (`panel/src/achicarFoto.js`, estándar desde el 15/10/2026): más de 2400 px de ancho o más de ~4 MB se dibuja en un lienzo de hasta 2400 px y sale en JPEG 0,92 (con transparencia, PNG). Reglas en 7.
- **Etapas a la vista y anunciadas** en una región `role="status"` al cambiar de etapa (no con cada porcentaje), encadenadas para que el lector no junte dos: "Se subió la foto 1 de 3. Preparando la foto 2 de 3…". "Cancelar la subida" corta la que está subiendo. Hasta 20 por vez (si se eligen más, quedan 20 con su aviso); la galería, hasta 40.
- **Errores:** una foto que falla queda en la lista con su error, enlazado a su grupo y a su primer control, y la cola sigue (salvo la sesión terminada, la temporal o el límite de fotos por hora: ahí se frena). Un 503 de la cola ("Hay muchas fotos subiéndose…") no se reintenta solo. **El foco** (corrección de E3): al empezar pasa a "Subir…"; si una falla, a su primer control; si se cancela, a "Subir…"; nunca cae en el `<body>`.
- **Galería:** "Mover antes", "Mover después" y "Quitar" (con "Deshacer"), anunciados con `role="status"`; los botones nombran la foto por su descripción ("Quitar la foto 2, «Chicos mirando…»"), no solo por el número, que cambia al reordenar. Una foto que ya no existe (409 con `faltan`) queda marcada con su mensaje y el resumen de errores lleva a su "Quitar".
- **El error de la ficha en su control:** `describedby` e `invalido` en SubirFoto, DatosFoto y Casilla, así el resumen de errores de la ficha lleva al control y el control dice su error (la portada, la galería, el tipo).

### 5.6 Accesibilidad del panel (WCAG 2.2 AA)

- **Navegación:** "Ir al contenido". Al cambiar de ruta, el foco va al `<h1>` y se actualiza `document.title`. `scroll-padding-top` evita que la barra tape el foco (2.4.11); desde la corrección de E3, con el alto real de la barra (`--alto-barra`, 5.1).
- **Formularios:** etiquetas visibles; al guardar con errores, un resumen arriba con enlaces y el foco puesto ahí, con `aria-invalid` y `aria-describedby` en los campos (3.3.1 y 3.3.3); "Guardado" con `role="status"` (4.1.3); se permite pegar y usar gestores de contraseñas (3.3.8), también en el diálogo de la temporal.
- **Táctil:** objetivos de 24 px como mínimo y 44 en el celular (2.5.8).
- **Celular:** alturas solo con `svh`.
- **Prueba:** teclado y NVDA en E6.1. Al cerrar E3 (16/10/2026), axe sin violaciones en 28 estados de las pantallas de E3 a 1440, 375 y 320 px (con los diálogos abiertos), objetivos de 44 px en el celular, sin scroll horizontal a 320, al 200 % y con el espaciado de WCAG 1.4.12 sin pérdidas. Para NVDA quedan anotados: los anuncios de SubirFoto, el resumen del diálogo del enlace, los nombres de los botones de la galería y las pestañas de Exposiciones.

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
| `/contacto` | Contacto | `museo`. Lee `?enviado=1` (quedó `?enviado=<marca>`: abajo). El POST responde con `no-store` | `Museum` |
| todo lo demás | NoEncontrada | — | — |

**Reglas:**
- Un borrador da **404**. Lo finalizado o realizado da 200, porque Google ya lo indexó; no aparece en el listado (el archivo de muestras pasadas está en la fase 2).
- **Paginación:** `?pagina=1` responde 301 a `/novedades`. Una página que no es un entero ≥ 2 o que pasa del total da 404.
- Una sección sin contenido no se dibuja. Nunca se muestra "Contenido pendiente".
- **El cambio de DNS no se hace sin el contenido mínimo** (12.6).

**Cómo quedó en E4.2 a E4.5 (19/10/2026; `server/paginas.js` y `server/contenido-publico.js`):**
- **Aspecto provisorio** (decisión del desarrollador del 19/10/2026): la diseñadora todavía no entregó las páginas internas, así que van con el lenguaje de la Home (las fuentes, la paleta, el ancho del contenido y los tamaños y pesos de títulos y párrafos), sin efectos de scroll ni animaciones nuevas, en componentes chicos que dicen en su encabezado que su aspecto es provisorio (E6.3 cambia clases y orden sin tocar datos ni lógica). Los textos de interfaz (títulos de sección, rótulos, botones, mensajes) están en `src/content.js`, neutros y mínimos.
- **Una consulta por página**, solo lo publicado, con las columnas escritas a mano; de las fotos, solo sus 8 campos públicos (`fotoPublica`). Los textos con formato pasan por `textoRicoPublicable`, con lo validado recordado por su md5. Fechas, situaciones, "Hoy (lunes)" y precios llegan como texto.
- **`/exposiciones`:** una sola lista de muestras en el orden del panel (las próximas, las actuales y las permanentes, como promete el panel), cada tarjeta con su situación ("Actual", "Próxima", "Permanente") y su período, en vez de secciones separadas por situación. Después, las salas publicadas como secciones `#sala-<slug>`, con su descripción y la lista de sus muestras.
- **`/exposiciones/:slug`:** la muestra, su sala, la portada, la descripción y la galería; finalizada, 200 con "Finalizó el …" y fuera del listado.
- **`/visitas`:** la tabla del horario (con "Hoy (lunes)"), las tarifas visibles ("Gratis" en las gratuitas), sus notas, el aviso vigente, "Comprar entradas" si la compra está activa y los tres textos. Si ningún día abre (lo que deja la migración sin horario cargado), la tabla no se dibuja.
- **`/novedades`:** la lista paginada, de a 12, tiene **solo las noticias**; las actividades van en "Próximas actividades", en la primera página, mientras no se realizaron. Así una actividad no sale dos veces. Una realizada da 200 en su página, con "Realizada" y sin el enlace de inscripción, y no se lista.
- **`/contacto`:** los datos del museo (dirección, teléfono, correo público, redes y el mapa de "Insertar mapa", más "Abrir en Google Maps") y el formulario (8). **El aviso de enviado no lee `?enviado=1`** sino `?enviado=<marca>`: la hora firmada por el servidor (HMAC con una clave por proceso), que vale 10 minutos; con `?enviado=1`, una marca vencida o una inventada, la página es la de siempre y no se cuenta `enviar_contacto` (CON-04 y COD-02 de la verificación de E4: una dirección guardada o compartida decía "Recibimos tu mensaje").
- **La 404** va dentro del Layout, con "Volver al inicio" y las cuatro secciones; no marca ninguna como actual, aunque su dirección empiece como una sección.
- **Si la base falla:** la Home sale como siempre; las demás, la 503 simple (6.3). Visitas y Contacto también si el museo no es el de ahora.

### 6.2 Estado e hidratación

```js
{ pagina, ruta, datos, museo, hoy, medir, userway }
```

- **`cargar()` devuelve objetos planos** con fechas, precios y estados ya como texto: "Actual", "Finalizó el …", "$ 5.000", "Hoy (jueves)". Lo que se renderiza en el servidor es `JSON.parse` de lo mismo que se serializa (2.3).
- **Fechas:** `compartido/fechas.js` formatea con arrays propios de meses y días, nunca con `toLocaleDateString` al dibujar. "Hoy" sale de `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/San_Juan' })`, solo en el servidor. Los `datetime-local` se leen como `-03:00`, en una sola función.
- **`<head>`:** lo arma `seo.js`; no se usa el `<title>` de React 19.
- **Un solo bundle público**, que no puede importar zod: el formulario valida con atributos HTML. `rutas-check` busca zod en `dist/client/assets/*.js`. TipTap nunca entra en el bundle público.
- **Si el JS de la Home pasa de 342 kB** (+10 % sobre los 310.936 bytes de hoy): se separan las páginas con `import()` dinámico y `build.manifest`, con `modulepreload` por página, y **sin `React.lazy`** (en el servidor se hace `await import()` del módulo antes de `renderToString`, y en el cliente, antes de `hydrateRoot`; con `lazy`, el SSR emitiría el fallback y se perdería el contenido).

**Cómo quedó en E4 (19-20/10/2026):**
- **El estado:** `estado.museo` es `museoComun(museo)`, sin los tres textos de Visitas (van en los datos de `/visitas`); `estado.userway` es el ID o `null`.
- **Las páginas se separaron antes de llegar al tope** (desvío): con todas en un solo bundle el JS medía 336.924 B y quedaban ~5 kB para Contacto y UserWay. Como dice el punto de arriba: `PAGINAS` y `ARCHIVOS_DE_PAGINAS` en `src/Raiz.jsx` (`cargarPagina`), `render` async en `src/entry-server.jsx`, `cargarPagina` antes de `hydrateRoot` en `src/main.jsx`, el manifiesto del build y `precargasDePaginas` en `server/ssr.js`. La 404 va en el bundle principal (es chica y es la de respaldo). Una página nueva va en la tabla de rutas del servidor, en `PAGINAS` y en `ARCHIVOS_DE_PAGINAS` (`ssr.test.js` falla si falta en alguna).
- **Al cerrar E4** (medido sobre el build final): la Home baja 327.395 B de JS (el principal, 277.037, más su archivo, 50.358; ~89,7 kB con Brotli), 15 kB debajo del tope, y las internas entre 282 y 287 kB (el principal más su página y lo que comparte: `Seccion`, `estilos`, `Ficha`, `TextoRico`); la Home hace un pedido JS más que en E3. CSS: 56.416 B (10,3 kB con Brotli). Ningún archivo público lleva zod, TipTap, ProseMirror, nodemailer ni nada de `/administracion` (buscado en el build).
- **El formulario valida con atributos HTML** (`required`, `minLength`, `maxLength`, `type="email"`, con los topes de `compartido/contacto.js`, sin zod); la validación de verdad es la del servidor (8).

### 6.3 "Los cambios se ven al instante"

- **Sin caché de HTML:** cada pedido lee la base y renderiza. Lo que se guarda en el panel se ve en el pedido siguiente, y lo que cambia solo con el tiempo ("Próxima" → "Actual", el día de hoy) también.
- **Cabeceras:** HTML con `Cache-Control: no-cache` y ETag (304). **Nunca se cachea en el borde:** Edge Caching de Render en "Common static files", que deja afuera el HTML ([web-service-caching](https://render.com/docs/web-service-caching), 08/10/2026). Las respuestas públicas **nunca ponen cookies**.
- **Si la base falla:** la Home sale con el último `museo` bueno o con el pie mínimo; las demás rutas, una página 503 simple. **Cómo quedó (E4):** la 503 simple lleva `no-store` y `Retry-After: 60`; lo publicado espera la base 4 s como mucho y el museo 2 (con la base colgada, medido por la verificación de E4 con un proxy TCP delante de Postgres: la Home en 2 s como mucho y las internas y el sitemap en 503 en 4 s, y todo vuelve solo cuando la base contesta).
- **Lo que cambia con el tiempo** (una muestra que pasa de "Próxima" a "Actual", "Hoy (lunes)", una actividad "Realizada") se calcula con "hoy" y "ahora" de San Juan una vez por pedido, en el servidor; la verificación lo probó con el proceso en UTC+14 y con el reloj corrido a las 23:30 y a las 00:30 de San Juan.
- **Si hiciera falta caché** (CPU alta en Metrics o TTFB peor que el criterio de 10.1): una caché corta de la Home, de pocos segundos (ver 14).

### 6.4 SEO por página

`seo.js` devuelve `{titulo, descripcion, ruta, imagen, tipoOg, jsonld[]}`.

| Página | Título y descripción |
|---|---|
| Home | Idénticos a los de hoy |
| Las demás | `title`: `<Título> · MuPa`. `description`: el resumen (≤ 160, cortado en una palabra) |

**En todas:** `canonical` y `og:url` con `URL_PUBLICA` + ruta, **siempre `https://mupa.ar/…` en producción**; `og:image` con el `og.jpg` de la portada y sus medidas (si no hay, `/og.jpg`); `noindex` (meta y cabecera) **si el host no es `mupa.ar`**. **Cómo quedó `og.jpg` (E3.1):** 1200 px de ancho con la proporción de la foto, no un recorte de 1200x630 (una portada vertical la recorta cada red a su manera); sin agrandar; sobre blanco si tenía transparencia. Sus medidas salen de la fila: ancho `min(1200, ancho)` y alto proporcional. La URL va absoluta: `URL_PUBLICA` + `urlFoto(clave, 'og.jpg')` (`compartido/fotos.js`).

**JSON-LD:** un `@graph` por página, escrito con `jsonEnScript()` (el mismo escape que el estado), con `@id` **absolutos** (`https://mupa.ar/#museo`, como hoy). Se omite todo campo vacío: no se inventan datos.
- **`Museum`**, en cada página: lo de hoy, más `address`, `telephone`, `email`, `sameAs` y `openingHoursSpecification` por franja (`dayOfWeek: https://schema.org/Monday`, `opens`, `closes`).
- **`NewsArticle`:** `headline` (≤ 110), `datePublished`, `dateModified`, `image` y `publisher`/`author` apuntando al museo.
- **`ExhibitionEvent` y `Event` quedan para la fase 2:** Google exige un `Place` con `address` ([datos estructurados de eventos](https://developers.google.com/search/docs/appearance/structured-data/event), actualizada el 08/09/2026) y la dirección todavía no está.
- Se valida con la Prueba de resultados enriquecidos en E4.6.

**Cómo quedó en E4.6 (19/10/2026; `server/seo.js`, `seoDe` por página):**
- Título `<Título> · MuPa`; descripción, el resumen cortado en una palabra (`cortarEnPalabra`, hasta 160) y, en las páginas fijas, **una línea neutra por página sin datos del museo** (desvío: el plan solo habla del resumen), por ejemplo "Horario, tarifas y lo que hay que saber para visitar el Museo Paleontológico de San Juan."; **hay que validarlas con el museo**, como la de la Home. Las páginas 2 en adelante de Novedades llevan su canonical (`/novedades?pagina=n`).
- `og:image` con el `og.jpg` de la portada y sus medidas reales (`medidasOg`), o `/og.jpg`; las novedades suman `article:published_time` y `article:modified_time`.
- **`Museum`** en todas, con dirección, teléfono, correo, redes (`sameAs`) y el horario por franja **solo si están cargados**: con el museo vacío, el `<head>` de la Home es idéntico byte a byte al de antes.
- **`NewsArticle`**: `author` y `publisher` van como `Organization` con el nombre, la URL y el logo del museo, no como `@id` al nodo `Museum` (desvío: en schema.org un `Museum` es un lugar, y `author`/`publisher` piden `Person` u `Organization`).
- **La Prueba de resultados enriquecidos no se pudo correr** (necesita una URL pública): queda para Render o `mupa.ar` (E5.2). Lo comprobado acá: el JSON-LD parsea, con `@id` absolutos y sin campos vacíos, también con `</script>`, `$'`, `$&`, `$$` y U+2028 en los textos.

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

**Cómo quedó en E4.6 (19/10/2026):**
- **El sitemap** se lee en cada pedido (`no-cache`, como el HTML: lo publicado entra en el pedido siguiente): las páginas fijas, sacadas de la tabla de rutas (`RUTAS_FIJAS`), y las muestras y novedades publicadas, también las finalizadas o realizadas, con su `lastmod`. **Si la base falla, 503** (`no-store`, `Retry-After: 60`): uno sin los contenidos le diría al buscador que ya no están. Era `public, max-age=3600`.
- **IndexNow** (opcional, no estaba en el plan; `server/indexnow.js`): para Bing, que conoce `mupa.ar` pero todavía no lo rastrea. Con `INDEXNOW_CLAVE`, el sitio sirve `/<clave>.txt` y, al publicar, despublicar, eliminar o guardar un cambio o la galería de algo publicado, le avisa a `api.indexnow.org` la página y su listado (una sala, solo `/exposiciones`). Nunca por un borrador, ni al reordenar, ni por los cambios del museo (Visitas, pie). Solo en producción y con el host `mupa.ar`; no espera la respuesta, tiene 5 s de tope y escribe una línea de log con la cantidad de direcciones, sin las direcciones. La URL de la API es fija (sin SSRF). Probado solo con un fetch falso: ningún pedido salió. Se prende poniendo la clave en Render.

### 6.6 GA4 y UserWay

**GA4** (`analitica.js`):
- `iniciarAnalitica(estado)` mide solo si `estado.medir` (producción y host `mupa.ar`). Mantiene las condiciones de `webdriver`, DNT y GPC.
- `page_view` en cada carga. **`ver_*` y `abrir_*` solo si `estado.pagina === 'home'`**: hoy `medirSecciones()` busca cualquier `<footer>`, y las páginas internas, que son cortas, dispararían `ver_pie`.
- Se suman `enviar_contacto` (al cargar `/contacto?enviado=1`; quedó con la marca de 6.1, abajo) y `clic_entradas`. Nunca en el panel.

**UserWay:** `https://cdn.userway.org/widget.js` con `data-account`, cargado con la página ya cargada y solo si hay ID. Sus dominios se confirman al integrarlo y van a la CSP. Hay que probar que no tape el indicador de scroll ni el menú y que dé CLS 0 con `vitals.mjs`.

**Cómo quedó en E4.7 (19-20/10/2026):**
- **GA4:** `enviar_contacto` sale solo con la marca de `?enviado=` firmada por el servidor (6.1) y solo en una navegación nueva (`performance.getEntriesByType('navigation')`: recargar o volver con Atrás no lo repite). `clic_entradas` sale en todas las páginas con el clic en cualquier enlace con `data-entradas` (el del menú, el del menú del celular y el de Visitas), con `origen` (`menu` o `pagina`) y `pagina`; GA4 lo manda con `sendBeacon` sin pedirlo (se sacó un `transport_type` que habría ido como dato del evento). `ver_*` y `abrir_*`, solo en la Home. **`ver_pie`** cuenta cuando se ve la mitad del pie o, si es más alto que la pantalla, media pantalla (`pieVisto`, umbrales de 0,05 a 0,5): con un umbral fijo de 0,5 un pie de más de dos pantallas (el museo con todo cargado, en el celular, ~1400 px) no contaba nunca (HOME-01 de la verificación).
- **UserWay** (`src/userway.js`): sin `USERWAY_ID` no se carga nada ni entra a la CSP. Con ID, un solo `<script async data-account>` agregado con la página cargada y el navegador en reposo (`requestIdleCallback`, o 1,5 s después de `load` en Safari). La CSP suma `https://*.userway.org` en `script-src`, `connect-src`, `img-src`, `style-src`, `font-src` y `frame-src`, y `https://userway.org` en `frame-src`: lo que pide la guía de UserWay, leída el 19/10/2026. **El museo todavía no pasó el ID: nunca se cargó el script de verdad** (en las pruebas se bloqueó por CDP y se comprobó solo el pedido, sus atributos y la CSP). Con el ID: confirmar sus dominios mirando la consola, que no tape el indicador de scroll ni el menú y CLS 0 con `vitals.mjs` (E5.2).

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

**Cómo quedó en E4.1 (19/10/2026; aspecto provisorio hasta el diseño de la diseñadora, E6.3):**
- **`src/components/Layout.jsx`**: el marco de todas las páginas (Header, `<main id="main" tabIndex={-1}>` y Pie, sueltos en `#root` como en la landing, para no cambiar cómo se juntan los márgenes de la Home) y **la única instancia de Lenis** (`useScrollSuave`, que antes creaba la Home). "Ir al contenido" en todas las páginas. La Home dibuja solo sus secciones: `#identidad`, `#obra`, `#areas`, `#identidad-collage` y `[data-mosaico]` siguen iguales, y `mantenerEnPantalla` y `scrollSuaveEnCurso` también.
- **El header** (`Header.jsx`, `Logo.jsx`): en la Home, `absolute` sobre el hero y con el logo en el mismo lugar (458 px a 82,5/71 en 1440; 260 en el celular); el menú, arriba a la derecha, centrado en el alto del logo sin moverlo, con una sombra detrás del texto sobre la foto. En las internas, en el flujo, con el mismo logo. `href="/"`.
- **El menú completo aparece desde xl (1280 px), no desde lg** (desvío, medido): los cuatro enlaces y "Comprar entradas" ocupan 595,5 px (629 con un texto de compra de 40 caracteres, el máximo del panel) y junto al logo de 458 quedan 401 px libres a 1024 y 657 a 1280. Debajo de xl, el botón "Menú".
- **El menú del celular** (`MenuMovil.jsx`): un `<dialog>` a pantalla completa con `showModal()`, alto en `svh`, el logo y "Cerrar" en el mismo lugar que el logo y "Menú". Mientras está abierto, Lenis parado (`detenerScrollSuave`), `overflow: hidden` en `html`, `overscroll-behavior: contain` y `data-lenis-prevent` en el menú (con Lenis parado se tragaba la rueda adentro). Esc o "Cerrar" lo cierran, el foco vuelve al botón sin mover el scroll y los efectos de la Home quedan donde estaban. También se cierra al pasar a xl y al volver a la página desde el bfcache. Sin animación de apertura. A 375 px entran el logo de 260 y el botón; por debajo de 360 el logo se achica (208 a 320).
- **`aria-current`:** `"page"` en la página de la sección y `"true"` dentro de ella (una muestra marca Exposiciones; el plan solo hablaba de `"page"`); la 404, ninguno. "Comprar entradas" solo con la compra activa, con el texto cargado o el de `content.js`, y `data-entradas` (6.6).
- **El pie** (`Pie.jsx`, era `Footer.jsx`; en `content.js`, `footer` pasó a `pie`): arriba, el de la landing (el nombre, los logos de la UNSJ y de Gobierno, ©); debajo, **las secciones del sitio** (andan sin JavaScript y antes de que la página hidrate, cuando el botón "Menú" todavía no abre nada: A11Y-03 de la verificación), y la dirección, el horario resumido (`compartido/horarios.js`: los días con las mismas franjas juntos, los cerrados al final, las notas aparte; si ningún día abre, nada), el teléfono (`tel:` solo si es un número), el correo (`mailto:`) y las redes con su nombre como texto del enlace (`src/components/datosMuseo.js`, que reusan Contacto y Visitas). La línea de privacidad solo si `content.js` la tiene: hoy está vacía, hasta que el museo mande el texto. Lo que no está cargado no se dibuja, ni su rótulo: con el museo vacío el pie mide lo de antes (277 px en el celular); con todo lo que admite el panel, ~1420 px.
- **`REDES` y `DIAS`** pasaron a módulos puros (`compartido/redes.js` y `compartido/horarios.js`) que los esquemas reexportan, así el pie no importa zod.
- **Objetivos de 44 px en el celular** en los enlaces sueltos del sitio (`ENLACE_SUELTO` de `src/components/estilos.js`) y en el logo (con padding y margen negativo, sin mover nada), como en el panel (A11Y-01 de la verificación). Con colores forzados en un tema claro, los logos blancos (`data-logo-blanco`) se invierten (A11Y-04).
- **Verificación al cerrar E4** (sobre el build final, con `SIN_BASE=maximo` y `SIN_BASE=vacio`, y con el museo más largo que admite el panel cargado por la API en un esquema aislado): las 7 recetas en los 6 tamaños, 42 de 42 con cada museo, con los mismos números que E3 (salvo los tiempos de `hitos-check`); `acordeon-dedo` en `flick`, `apoyado` y `lectura --subir`, con y sin `--como-safari`, a 390x664, 375x635, 375x812 y 412x780, 24 de 24 con 0 tirones y 0 bandas salteadas (también con el pie de 1420 px); la rueda (Lenis) por Áreas hasta el final y de vuelta, la misma secuencia de bandas que E3; el menú abierto y cerrado a mitad de cada efecto sin moverlos; hidratación sin diferencias; CLS 0. **Las corridas de `acordeon-dedo` van de a una**: con dos Chrome a la vez apareció un tirón aislado. La herramienta además cuenta como tirón un cierre bien compensado si coincide con un cuadro largo durante un flick (HOME-02, 13.2): no es un defecto de la página.

---

## 7. Fotos

**Decidido el 15/10/2026 (16.1):** las fotos van en Postgres, sin disco persistente, y el panel las achica en el navegador antes de subirlas. Implementado en E3.1 (16/10/2026) y ajustado en la corrección de E3, con los hallazgos de las cuatro verificaciones independientes (API, flujos, accesibilidad y código). Al final de la sección, lo que cambió respecto de lo planeado y lo que quedó abierto.

**Achique en el navegador** (`panel/src/achicarFoto.js`; estándar, no opcional):
- Si la foto mide más de 2400 px de ancho (ya orientada) o pesa más de ~4 MB, el panel la decodifica (`createImageBitmap` con `imageOrientation: 'from-image'`, o un `<img>` de respaldo, que también respeta la orientación), la dibuja en un lienzo de hasta 2400 px de ancho con su proporción (nunca agranda; el área no pasa de 16 M píxeles, el tope de Safari en iPhone) y la manda como JPEG 0,92. Si no, va el original.
- **Transparencia:** una PNG o WebP con transparencia (un logo, un recorte) sale como PNG; si esa PNG pasara los 20 MB, como JPEG sobre blanco (pierde la transparencia, pero sube).
- Si lo achicado pesa más que el original y el original ya entraba (2400 px o menos y hasta 20 MB), va el original.
- Si el navegador no puede leerla (un HEIC fuera de Safari: Safari en iPhone ya lo convierte a JPEG al elegirlo), va el original y el servidor responde su error en castellano.
- La decisión es código puro: la prueba `fotos.test.js`, sin navegador.
- **Medido el 15/10/2026** con 17 fotos reales de 6000x4000 (8 a 18 MB): achicadas pesan 0,4-1,3 MB, el servidor las procesa en un tercio del tiempo y el pico de memoria por foto baja a ~60 MB. En E3.1, con fotos de la Selección Fotográfica: sin achicar, 2,1-2,5 s de procesado; achicadas, 0,7-1,0 s; el pico del proceso subiendo las sin achicar, 201 MB.
- **El servidor no confía en el achique**: mantiene sus defensas (abajo) para un cliente que no achique.

**Recepción** (`POST /administracion/api/fotos`, `server/api/fotos.js`). Orden: sesión → contraseña temporal ya cambiada → rol → límite (60 por hora por usuario, 4.7) → **un lugar entre las subidas en curso** → multer → los campos con zod → el tipo real y el procesado (en la cola) → la foto y sus cinco archivos en una transacción → 201 con la foto.
- **Subidas en curso** (`cola.reservar()`, corrección de E3): como mucho 3 a la vez entre todas las cuentas, contadas desde que se empieza a recibir el archivo hasta que se responde. La cuarta recibe 503 ("Hay muchas fotos subiéndose en este momento…", `Retry-After: 30`) sin que se lea su archivo. Antes, multer leía cada cuerpo entero y recién después la cola decidía: 20 subidas de 18 MB llevaban el proceso a 579 MB (1051 con 40); medido después, 274 MB con 20 a la vez.
- multer 2.4.0 con `memoryStorage` y `{ fileSize: 20 MB, files: 1, fields: 10, parts: 12, fieldSize: 16 kB, fieldNestingDepth: 0 }` (los dos últimos, de E3.1: ningún campo de texto de más de 16 kB ni con corchetes en el nombre). **Una foto por pedido.** Las versiones anteriores a la 2.1.0 tienen DoS publicados (CVE-2026-3304 y CVE-2026-2359; [Express security releases](https://expressjs.com/2026/02/27/security-releases.html), 27/02/2026).
- Campos: `foto` (el archivo), `alt`, `decorativa` (`"true"`/`"false"`), `epigrafe` y `credito` (`compartido/esquemas/fotos.js`). Una decorativa se guarda con `alt` vacío; si después deja de serlo, hay que escribir la descripción.
- Nada de esto lee el archivo sin sesión, con la temporal sin cambiar, desde otro origen o pasado el límite: uno de 29 MB da 401, 403 o 429, nunca 413.
- El log (`foto_subida`) lleva el id, lo recibido, lo guardado y cuánto tardó: nunca el nombre del archivo, la descripción ni los bytes.

**Tipo real y tamaño** (`server/fotos/procesar.js`):
- Primero la firma (los primeros bytes): solo JPEG, PNG o WebP. Un SVG (sharp lo dibujaría) o un HEIC (los binarios de sharp no lo leen: [sharp #1105](https://github.com/lovell/sharp/issues/1105)) nunca llegan a sharp: 415, cada uno con su mensaje. Después `sharp(buf).metadata()`: si lee otro formato que el de la firma, 415; si no la puede leer (dañada o truncada), 400 "No se pudo leer la foto…".
- **Más de 50 megapíxeles:** 413 leyendo solo el encabezado, sin decodificar (`limitInputPixels` lo vuelve a limitar al procesar).
- **JPG progresivo y PNG entrelazado** (corrección de E3): libvips los decodifica enteros en memoria (los de 16 bits, el doble). Si eso pasa de 160 MB (`memoriaAlDecodificar`), 413 sin decodificar, con su mensaje ("…achicala antes de subirla… o guardala como JPG común"). Un PNG entrelazado de 16 bits de 7000x7000 (578 kB) llevaba el proceso a 563 MB; un JPG progresivo 4:2:0 de 50 megapíxeles pasa. La foto del hero de la Selección (JPG progresivo 4:4:4 de 6000x5283) cae en ese tope si llega sin achicar; por el panel llega achicada. Subir el tope a ~200 MB la dejaría pasar, con ~250 MB de pico, demasiado cerca de los 512 MB de Render: queda a decisión del desarrollador.

**Procesado** (dentro de `cola.js`: de a una, con 60 s de tope, que sharp respeta con su `timeout`; pasado eso, 503):

```js
sharp.concurrency(1); sharp.cache(false)
const medida = (ancho) => ({ width: ancho, height: LADO_MAX, fit: 'inside', withoutEnlargement: true })   // LADO_MAX = 16383
const base = sharp(buf, { limitInputPixels: 50_000_000 }).autoOrient()
for (const ancho of [480, 960, 1600]) await base.clone().resize(medida(ancho)).webp({ quality: 78 }).toBuffer()
const maestra = await base.clone().resize(medida(2400)).webp({ quality: 90 }).toBuffer()
const og = await base.clone().resize(medida(1200)).flatten({ background: '#ffffff' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
```

- sharp no copia los metadatos salvo que se pida `keepMetadata()` ([sharp, salida](https://sharp.pixelplumbing.com/api-output), 08/10/2026): EXIF con GPS, XMP, ICC, IPTC y los comentarios no quedan en ninguna de las cinco salidas, maestra incluida (lo prueba `fotos.test.js` y lo comprobó la verificación leyendo la base). La orientación se aplica (`autoOrient`) y los colores pasan a sRGB.
- **Alto de las salidas:** hasta 16383 px (el lado máximo de WebP), con su proporción: una captura larga de 1170x20000 daba "dañada" (corrección de E3).
- `og.jpg` va sobre blanco: si la foto tiene transparencia, el JPEG la pintaría de negro.
- La maestra permite regenerar tamaños si la diseñadora pide otros. Se guarda pero **no se publica** (404).
- `variantes` guarda los anchos nominales (`[480, 960, 1600, 2400]`); el real de cada archivo es `min(variante, ancho)`. `bytes` es lo que ocupan los cinco.
- Sin deduplicación. La `clave` es aleatoria (`randomBytes(8)`, 16 caracteres hexadecimales): nunca se sobrescribe una foto.

**Almacenamiento** (`server/fotos/almacen.js`): `guardar(datos, procesada, { transaction? })` escribe la fila de `fotos` y sus cinco filas de `fotos_archivos` (`480`, `960`, `1600`, `2400` y `og`) en **una transacción**, la propia o la de quien llama (la semilla guarda todo junto): si algo falla en el medio, no queda nada (probado con un trigger que corta a mitad y matando el proceso con el INSERT de los archivos bloqueado). `datos` va con `STORAGE EXTERNAL` (WebP y JPEG ya vienen comprimidos). `fotos_archivos` no tiene modelo de Sequelize: **ningún listado lee `datos`**, solo `abrir()`, de a un archivo. El almacén lo crean `servidor.js` y `dev.js` y lo comparten `/fotos`, la API y la tarea diaria, así lo que se borra sale también de la caché.

**Servido** (`GET` y `HEAD /fotos/:clave/:archivo`, `server/fotos/servir.js`; con cualquier host, antes del control de host: las mismas URL sirven antes y después del corte):
- Solo `480.webp`, `960.webp`, `1600.webp` y `og.jpg`; la maestra y cualquier otro nombre, 404. La clave se valida con su patrón antes de tocar la base.
- 200 con `Cache-Control: public, max-age=31536000, immutable`, ETag por clave y variante (`If-None-Match` → 304), `Content-Type`, `Content-Length`, `nosniff` y `Cross-Origin-Resource-Policy: cross-origin` (las redes leen `og.jpg`); nunca `Set-Cookie`. 404 y 503 con `no-store`. Fuera del host público, `X-Robots-Tag: noindex`.
- `abrir(clave, variante)`: una LRU en memoria de 32 MB (por bytes); si no está, la base, con **como mucho 2 lecturas a la vez** (el pool tiene 5 conexiones: las páginas y el panel nunca se quedan sin una por las fotos) y una sola lectura si piden lo mismo juntos. Las demás esperan en fila, hasta 1000 y hasta 10 s cada una (corrección de E3: con 100 en fila y sin espera, 300 fotos distintas con la caché fría daban 198 respuestas 503); pasado eso, 503. Lo que no existe se recuerda 10 minutos (hasta 10.000 claves).
- Una URL nunca cambia de contenido: el borde de Render puede cachear los `.webp` y `.jpg` ("Common static files", 10.1).

**Quién usa una foto** (`server/fotos/usos.js`): el único lugar que lo dice. Desde E3.3 y E3.4, las portadas de salas, muestras y novedades y las dos galerías, cada columna con su índice. Una clave foránea nueva a `fotos` (la galería de las salas, con el plano: 3.5) va ahí: `fotos.test.js` compara la lista con las claves foráneas de la base y falla si falta una (si no, la tarea diaria intentaría borrar fotos en uso).

**Borrado:**
- Al quitar una foto o eliminar su contenido, se borra en el momento si nadie más la usa (`almacen.liberar(ids, t)`, dentro de la transacción del cambio: 3.2); sus archivos caen en cascada y la caché se limpia después del commit. Las subidas que nunca se asociaron a nada las borra la tarea diaria cuando tienen más de 24 h.
- **En dos pasos** (corrección de E3): primero se bloquean las fotos (`FOR UPDATE`; la tarea, con `SKIP LOCKED`: las que alguien está usando las mira al día siguiente) y después, en otra sentencia, se borran las que no se usan. Quien está por usar una foto la tiene bloqueada (`FOR KEY SHARE`, hasta su commit): el borrado espera y, en READ COMMITTED, la sentencia siguiente ya ve ese uso. Con un solo `DELETE … AND NOT EXISTS`, una foto que otra transacción estaba metiendo en una galería se borraba igual y la clave foránea cortaba con un 500 (39 de 40 vueltas en la verificación), o la tarea diaria fallaba entera. Como red, un 23503 en la API es un 409 "recargá" (4.1).
- Una foto que la tarea borró mientras una ficha quedó abierta sin guardar más de 24 h: al guardar, 409 en su campo ("volvé a subirla"), con los ids que faltan (`faltan`).
- Lo que el borde de Render ya cacheó sigue ahí hasta el próximo deploy. Para un retiro urgente (por ejemplo, una foto sin consentimiento) se usa "Purge cache" en el dashboard (paso en `docs/operacion.md`).
- Las URL de borradores no se pueden adivinar (64 bits), pero son públicas. Se acepta.

**Tarea diaria** (`server/tareas.js`):
- Corre al arrancar (así el registro que lee el Inicio se llena después de cada deploy) y a las 04:00 de San Juan, fuera de las horas de uso: cada vuelta programa la siguiente con `setTimeout` hasta las próximas 04:00 (`msHastaLaProximaVuelta`), así un deploy no corre el horario (corrección de E3; hasta entonces, al arrancar y cada 24 h desde ahí).
- Subtareas, cada una en su propio try/catch y con una línea de log: sesiones vencidas y fotos huérfanas (E3.1); con E4, los mensajes de contacto de más de 180 días (E4.9) y la verificación de la casilla de envío (8).
- Una tarea cuya última vuelta falló aparece en el Inicio, con desde cuándo (E2.2; el plan decía "dos días seguidos").

**Espacio** (E3.1): `GET /estado` suma `espacio: { usadoMb, totalMb }` (`pg_database_size` contra `ESPACIO_BASE_MB`, 1024 por defecto) y el Inicio avisa desde el 80 %. Con las fotos en la base no hay "fotos faltantes": este aviso ocupa su lugar.

**Cuánto ocupa:** el 15/10/2026 (16.1, 17 fotos, antes de decidir), 622 kB de promedio por foto con sus cinco archivos y 256 kB sin la maestra: ~180 MB cada 300 fotos. Con la configuración final (la maestra en WebP 90 y `og.jpg` con mozjpeg), medido en E3.1 con fotos de la Selección de 6000x4000 y una PNG, cada una sin achicar y achicada: 0,7-1,8 MB por foto, ~1 MB de promedio, y la maestra es más de la mitad. Así, 1 GB alcanza para unas 800 fotos hasta el aviso del 80 %. Si aprieta: el escalón siguiente de la base es 5 GB (10.2), y lo que más ahorraría es bajar la calidad de la maestra.

**`Foto.jsx`** (E4): `<img src=".../960.webp" srcset="480w, 960w, 1600w" sizes="…">`, con `width` y `height` reales (CLS 0), `alt` (o `""` si es decorativa), `loading="lazy"` salvo la portada de la ficha, `decoding="async"` y `<figcaption>` con epígrafe y crédito. El ancho real de cada archivo del `srcset` es `min(variante, ancho)`: una foto de 800 px tiene los tres archivos de 800. **Regla de CLAUDE.md:** React precarga las imágenes que no son `lazy`, así que todo lo que no esté en el primer pantallazo lleva `loading="lazy"` o `fetchPriority="low"`. La forma de cada foto que devuelve la API está en `fotoDelPanel` (`server/api/fotos.js`). **Cómo quedó en E4.2 (19/10/2026):** `src/components/Foto.jsx` recibe la foto con sus 8 campos públicos (`fotoPublica` de `server/contenido-publico.js`) y arma el `srcset` con el ancho real de cada archivo (sin repetidos), `src` el de 960, `width`/`height` reales y `alt` (`""` si es decorativa). Con `prioridad` (la portada de una ficha y, desde la corrección de E4, la foto de la primera tarjeta de la primera lista, que era la imagen del LCP de `/novedades` y `/exposiciones` en el celular: PAG-02, LCP con red lenta de 4,4 a 3,0 s) va sin `lazy` y con `fetchPriority="high"`. La portada de una ficha no pasa del 75 % del alto de la pantalla: su ancho se calcula con la proporción (`altoMaximo`) antes de que cargue, y su `sizes` lo tiene en cuenta (`tamanoPortada`: una vertical baja el archivo de 480 en vez del de 1600, PAG-03). La galería va en columnas, cada foto con su proporción y su pie, sin recortar y sin visor; las tarjetas recortan a 3:2 con `object-cover`. Queda: en escritorio, con tres columnas, las otras dos fotos de la primera fila siguen `lazy`. La Selección Fotográfica no tiene fotos verticales: la portada vertical se probó con una armada con sharp.

**Respecto de lo planeado (E3.1 y la corrección de E3, 16/10/2026):**
- La interfaz del almacén no es `guardar(clave, nombre, buffer)`, `abrir`, `borrar` y `existe` sino `guardar(datos, procesada, { transaction })`, `abrir(clave, variante)`, `liberar(ids, t)` (el `liberarFotos` de 3.2), `borrarHuerfanas()` y `olvidar(claves)`.
- El tipo se mira primero por la firma y los megapíxeles por el encabezado (el plan pedía solo `metadata()`); sumados el tope de las imágenes progresivas, el alto de 16383 px, `og.jpg` sobre blanco y la maestra que no se publica.
- multer limita además cada campo a 16 kB y no acepta corchetes; las subidas en curso se cuentan antes de multer (3 entre todas las cuentas); el límite de 60 por hora cuenta también las rechazadas.
- Las lecturas de `/fotos`: 2 a la vez, hasta 1000 esperando 10 s, y lo que no existe recordado 10 minutos.
- Borrar en dos pasos; la tarea a las 04:00; el aviso de espacio en lugar de las fotos faltantes.

**Lo que quedó abierto** (verificación de E3, severidad baja, sin corregir):
- **Claves al azar contra `/fotos` (API-05).** La caché de "no existe" no sirve si ninguna clave se repite: 3000 pedidos anónimos a la vez con claves al azar llenaron la fila y las 40 fotos reales del medio dieron 503 (unos 650 pedidos por segundo sostenidos dejan las fotos del sitio rotas). Arreglo barato: tener en memoria las claves que existen (se cargan al arrancar y se actualizan al guardar y al borrar; 16 bytes por foto), así una clave que no existe da 404 sin ir a la base; o un límite de 404 por IP en `/fotos`. Con un CDN delante se alivia solo. Es el mismo tipo de ataque que afecta a cualquier ruta que consulta la base.
- **Subidas lentas (API-07).** Los 3 lugares son de todas las cuentas y una transferencia lenta los ocupa hasta el `requestTimeout` de Node (300 s): una cuenta con 3 subidas que mandan un byte cada 2 s, o tres personas con mala conexión, dejan a las demás con 503 durante 5 minutos (SubirFoto no reintenta). Hace falta sesión. Arreglos combinables: un lugar por cuenta (el panel sube de a una), un tope de tiempo propio para la subida (p. ej. `req.setTimeout(60_000)` en `lugarEnLaCola`) y que SubirFoto reintente una vez ante el 503, respetando `Retry-After`.

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
   - **Si quedó guardado** (aunque el envío haya fallado): 303 a `/contacto?enviado=1#formulario` (quedó `?enviado=<marca>`, 6.1). El museo lo ve en Mensajes y el Inicio avisa.
   - **Si fallaron el guardado y el envío:** vuelve a dibujar la página (503) con los valores y "No pudimos enviar tu mensaje. Probá más tarde o escribinos a <correo público>".
   - **Si hay errores de validación:** vuelve a dibujarla (400, `no-store`) con los valores y los mensajes.
4. **Aviso en el Inicio** (`/administracion/api/estado`, para todos los roles): "Los mensajes del formulario no se están enviando por correo desde <fecha> (N guardados en Mensajes). Si cambió la contraseña de `web@mupa.ar`, hay que actualizarla en Render (`docs/operacion.md`)". Sale con el estado del correo en falla o con mensajes `fallido` posteriores al último `enviado`.
5. Si llega spam, se suma Turnstile en la fase 2 ([planes de Turnstile](https://developers.cloudflare.com/turnstile/plans/), 08/10/2026).
6. Debajo del formulario va el texto de privacidad del museo (pendiente), que dice que el mensaje se guarda 180 días.

**Mensajes en el panel** (`/mensajes`, solo admin):
- Lista de solo lectura, de la más nueva a la más vieja, 50 por página: fecha, nombre, correo (enlace `mailto:`), mensaje y "Enviado por correo" o "No se pudo enviar".
- Sin borrar, responder ni reintentar (el reintento está en la fase 2). La tarea diaria borra los de más de 180 días.

**Si Render bloquea SMTP:** Render bloquea los puertos 25, 465 y 587 solo en las instancias gratuitas ([changelog del 16/09/2025](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)); en Starter no está confirmado en la práctica. Se prueba en E5.1 con 465 y, si no conecta, con 587. Si ninguno sale, el formulario igual guarda los mensajes y se le plantea al desarrollador una alternativa antes de seguir (por ejemplo, un proveedor con API HTTPS, que sí suma registros DNS).

**Cómo quedó en E4.5 y E4.9 (19-20/10/2026, con la corrección de E4):**
- **`server/correo.js`:** nodemailer 10.0.16 (2.3). `armarCorreo` arma From la casilla ("Formulario de mupa.ar"), To el destino, Reply-To el visitante (nodemailer codifica el nombre), el asunto con `unaLinea(nombre)` y el texto con la fecha de San Juan. `opcionesSmtp`: SSL en 465 y, en cualquier otro puerto, STARTTLS obligatorio salvo contra la propia máquina (2.5); los topes de arriba; sin acceso a archivos ni URL desde el mail. En `consola` y `memoria` nodemailer arma el mail igual (`streamTransport`), así lo que se ve es lo que saldría. El estado en memoria es `{ ok, codigo, en, desde }` (`desde`: el primer fallo de la racha); la verificación tiene además un tope total de 30 s.
- **`server/contacto.js`, `POST /contacto` en este orden:** (1) CSRF por origen (403 simple); (2) `application/x-www-form-urlencoded` (si no, 415 simple) y el cuerpo, hasta 64 kB y 20 parámetros (413); (3) la trampa (303 sin guardar ni mandar); (4) sin casilla, la página con lo escrito (503); (5) el esquema (400 con lo escrito; **antes de los límites**: un error no gasta intentos); (6) **el mensaje repetido** (el mismo correo y el mismo texto que otro de hace menos de 2 minutos: el doble clic en Enviar, con o sin JavaScript; 303 sin guardar ni mandar y, si el primero sigue en curso, espera cómo termina; en memoria, hasta 500; CON-02 de la verificación); (7) los límites (4.7); (8) el destino, leído en el momento, y se guarda la fila; (9) se manda y se anota; (10) 303 a `/contacto?enviado=<marca>#formulario` (6.1) si se guardó o salió, o la página con lo escrito y "No pudimos enviar tu mensaje…" (503) si no pasó ninguna de las dos. Todo con `no-store` y sin cookies; en el log, solo códigos.
- **Nada espera a la base sin tope** (CON-01 de la verificación, severidad media: con la base colgada el pedido no respondía en más de 200 s): leer el destino, guardar y anotar tienen 4 s cada uno, y el INSERT y el UPDATE van en una transacción corta con `SET LOCAL statement_timeout` (si la tabla está bloqueada, Postgres corta y suelta la conexión). No se puso un `statement_timeout` para toda la conexión: cortaría también las migraciones y las fotos grandes. Con el mensaje guardado, el envío tiene un tope total de 15 s: si se pasa, se responde 303 y la fila se anota cuando termina; si la fila se guarda tarde, también se le anota cómo salió.
- **El esquema** (`compartido/esquemas/contacto.js`): al nombre se le sacan los caracteres invisibles (los de formato de Unicode salvo los que unen letras y emojis, y los rellenos del hangul: uno de dirección mostraba "Ana ‮txt.exe" como "Ana exe.txt" en el asunto y en Mensajes, CON-05) y tiene que quedar una letra o un número. El mensaje pegado se acomoda en vez de rechazarse (CON-06: un error que no dice qué carácter es no se puede corregir): los saltos de línea de Windows, U+2028, U+2029, U+0085, el tabulador vertical y el salto de página pasan a `\n`; las comillas y rayas de Windows leídas como C1 (U+0091 a U+0094, U+0096 y U+0097), a las tipográficas; los demás caracteres de control se sacan. Los errores son códigos (`ERRORES_DE_CAMPO` de `compartido/contacto.js`); los textos, en `src/content.js`.
- **La página** (`src/paginas/Contacto.jsx`, `FormularioContacto.jsx` y `DatosDeContacto.jsx`, aspecto provisorio): sin formulario (sin casilla o sin destino), solo los datos; con un 400, el resumen (`role="group"`, como el del panel) con el foco y enlaces a cada campo (`scroll-margin`: la etiqueta y el error quedan a la vista), `aria-invalid` y `aria-describedby`; con el 303, el aviso (`role="status"`) con el foco; con el 429, el aviso con el correo público y lo escrito. Con JavaScript, el segundo clic en Enviar se frena durante 8 s y el botón dice "Enviando…" (`aria-disabled`). Si el formulario se apagó mientras la persona escribía (503 `no_disponible`), lo escrito queda en un cuadro de solo lectura para copiarlo (CON-07).
- **El aviso del Inicio** (4.3, `GET /estado`) y **Mensajes** (5.2), como estaba planeado. La verificación de la casilla es la tarea diaria `casilla_correo` (al arrancar y a las 04:00); que la casilla no responda no la cuenta como tarea fallida: tiene su propio aviso. La tarea `mensajes_viejos` borra los de más de 180 días.
- **`npm run probar-correo -- --para <dirección>`** (`server/scripts/probar-correo.js`): verifica y manda un mail de prueba; si falla, dice el código y qué revisar (EAUTH: la contraseña; ECONNECTION o ETIMEDOUT: el otro puerto; EDNS: el servidor) y sale con código 1. No usa la base.
- **Ningún mail salió de verdad** en la implementación ni en las verificaciones: modo memoria o consola, o el SMTP falso de `server/pruebas/smtpFalso.js` (acepta, responde 535 o corta la conexión), escrito con `node:net`. Contra un SMTP real se prueba en E5.1.

**Lo que quedó abierto** (verificación de E4, severidad baja, sin corregir):
- **El destino que no se pudo leer (CON-08).** Si la base tarda más de 4 s en dar el destino pero guarda el mensaje, la persona ve "Recibimos tu mensaje", el mail no sale y la fila queda `fallido` con `SIN_DESTINO` para siempre; si la base vuelve después de un 503, la fila se guarda tarde con el mismo código (y si la persona lo manda de nuevo, llega dos veces). El Inicio lo muestra como si fallara la casilla. Arreglo: volver a leer el destino cuando la fila se guardó y mandar el mail; si aun así no hay, un código propio que el Inicio no atribuya a la casilla; y marcar la fila guardada después de un 503.
- **Los caracteres de Windows-1252 (CON-09).** El acomodado del mensaje traduce solo seis de C1: el euro (U+0080), la viñeta (U+0095) y ™ (U+0099) se borran sin aviso, y los puntos suspensivos (U+0085) pasan a un salto de línea. Arreglo: traducir el bloque entero de 0x80 a 0x9F y borrar solo los cinco huecos, o decidir con un solo criterio qué es U+0085.
- **El `Retry-After` del límite diario (CON-10, 4.7).**
- **A decisión del desarrollador:** guardar sin mandar los mensajes que pasan de los 50 por día (la segunda parte de CON-03; necesitaría otro tope de guardado, por ejemplo 500 por día, para que nadie llene la base desde muchas IP) y subir nodemailer a la 10.1 (2.3).
- **El texto de privacidad** del formulario (`contacto.privacidad` en `src/content.js`) y del pie siguen vacíos hasta que los mande el museo: tienen que decir que el mensaje se guarda 180 días, y conviene que nombren a Google Maps y a GA4. Turnstile, reintentar un envío y marcar un mensaje como respondido siguen en la fase 2.

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
  frame-src 'self' https://www.google.com https://*.userway.org https://userway.org; frame-ancestors 'self';
  base-uri 'self'; form-action 'self'; object-src 'none'
  ```

  - Los comodines de GA salen de la [guía de CSP de Google](https://developers.google.com/tag-platform/security/guides/csp) (08/10/2026). `www.google.com` está porque gtag manda a `/g/collect` ahí (CLAUDE.md, 01/10/2026). UserWay se confirma al integrarlo.
  - **Cómo quedó en E4 (`textoCspPublica`, `server/seguridad.js`):** los dominios de UserWay entran **solo con `USERWAY_ID`** (sin él no aparecen en ninguna directiva). `frame-src` es `'self' https://www.google.com` (el mapa de Contacto; la base solo acepta un `src` que empiece con `https://www.google.com/maps/embed?`), y con UserWay suma `https://*.userway.org` y `https://userway.org`. **El `'self'` no estaba en el plan** y hace falta: hasta E4.5 la directiva no estaba escrita y valía la de `default-src` (`'self'`); sin él, cualquier marco del propio sitio quedaba bloqueado, y `tools/parallax-compuerta.js`, que carga la Home dentro de un `<iframe>`, daba `ok: false` en los seis tamaños. Es lo mismo que ya se permitía en E3. La del panel no cambia con UserWay.
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
- [ ] `requiereSesion` en el montaje y `requiereRol('admin')` en usuarios y mensajes (no hay copia de fotos: 16.1). El correo de destino se controla por campo.
- [ ] El último admin está protegido.
- [ ] `permisos.test.js` recorre todas las rutas.

**Entrada**
- [ ] zod en todo, y solo lo validado llega a Sequelize, siempre con `replacements`.
- [ ] Texto con formato validado nodo por nodo. URLs de redes, mapa, compra e inscripción solo `https:`. Slugs con patrón.
- [ ] Formulario: nombre sin saltos de línea (no llega al asunto como cabecera), Reply-To armado por nodemailer, nunca From del visitante. Desde E4.5, también sin caracteres invisibles (8), y `unaLinea` como segunda red antes del asunto.

**Salida**
- [ ] Ningún `dangerouslySetInnerHTML` (prueba con grep).
- [ ] Una sola `jsonEnScript()` para el estado y el JSON-LD. Los valores del `<head>` van escapados como HTML.
- [ ] La plantilla se concatena, sin `.replace` con texto.
- [ ] `museoPublico()` sin el correo de destino.

**Archivos**
- [ ] Sesión, CSRF, límite y un lugar en la cola antes de multer; tipo por la firma y por sharp, sin SVG ni HEIC; megapíxeles e imágenes progresivas medidos en el encabezado; `limitInputPixels` y metadatos borrados (7).
- [ ] Claves al azar (64 bits), `nosniff`, `/fotos` sin cookies y la maestra sin publicar. Sin disco: no hay archivos ni `dotfiles` que servir.

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
- [ ] Límites de cuerpo, tope diario del formulario, `sharp.concurrency(1)`, apagado ordenado, `/salud` sin la base y el último `museo` bueno en memoria. Desde E3: como mucho 3 subidas en curso y 2 lecturas de fotos a la vez (el pool tiene 5 conexiones), y la LRU de 32 MB. Desde E4: topes de tiempo en todo lo que espera a la base desde el sitio (el museo 2 s, lo publicado y el formulario 4 s, con `statement_timeout` en lo que escribe el formulario) y en el envío del correo (15 s).

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
    # sin disk: las fotos van en la base (16.1)
    envVars:
      - { key: NODE_ENV, value: production }
      - { key: DATABASE_URL, fromDatabase: { name: mupa-db, property: connectionString } }
      - { key: URL_PUBLICA, value: "https://mupa.ar/" }
      - { key: ESPACIO_BASE_MB, value: "1024" }               # = diskSizeGB de la base × 1024; cambiarlos juntos
      - { key: CORREO_MODO, value: smtp }
      - { key: SMTP_HOST, value: smtp.hostinger.com }
      - { key: SMTP_PUERTO, sync: false }                     # 465; 587 si 465 no conecta
      - { key: SMTP_USUARIO, sync: false }                    # web@mupa.ar
      - { key: SMTP_CLAVE, sync: false }
      - { key: CANONICO, sync: false }                        # 0 hasta el corte
      - { key: TRUST_PROXY, sync: false }
      - { key: USERWAY_ID, sync: false }
      - { key: INDEXNOW_CLAVE, sync: false }                  # opcional (E4.6); vacía: apagado
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
1. `/salud` y `/salud/base` responden 200. `SequelizeMeta` tiene todas las migraciones (6 con E4.9). `GET /administracion/api/estado` trae `espacio` con el `totalMb` del plan de la base (`ESPACIO_BASE_MB`) y el Inicio no muestra el aviso de espacio.
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
7. **Memoria y fotos:** subir desde el panel varias fotos de cámara (llegan achicadas) y, por la API, una de 12 MP sin achicar; mirar el pico en Metrics (en esta PC: ~60 MB por foto achicada y 201 MB de pico del proceso con las de 6000x4000 sin achicar; tiene que quedar lejos de los 512 MB). Después, pedir `/fotos/<clave>/960.webp` dos veces: `immutable`, ETag y, la segunda, servida por el borde de Render; y `2400.webp` da 404.
8. **Rutas:** `node tools/rutas-check.mjs --url https://mupa-web.onrender.com/` (ahí espera `noindex`).
9. **Velocidad:** `node tools/vitals.mjs --url https://mupa-web.onrender.com/ --perfil movil --veces 5`:

   | Medida | Hoy en producción (teléfono) | Criterio |
   |---|---|---|
   | FCP | 2,38 s | ≤ 2,6 s |
   | LCP | 3,16 s | ≤ 3,5 s |
   | TBT | 0,72 s | — |
   | LCP en escritorio | 0,87 s | — |

**Lo que E4 suma al primer deploy (20/10/2026):** las páginas internas en `rutas-check` y en la hidratación (13.3); `npm run probar-correo` sale con código 1 si falla y dice qué revisar (8); con el ID del museo, UserWay en `USERWAY_ID` y sus dominios confirmados en la consola, sin tapar el indicador de scroll ni el menú y con CLS 0 (6.6); la Prueba de resultados enriquecidos de Google sobre una novedad y la Home (6.4); el mapa de Contacto con el embed real del museo (con la rueda a 1440x900, 6.7); y, si se quiere, `INDEXNOW_CLAVE` (6.5). Como referencia, en esta PC con la red lenta del proxy (13.2), la Home de E4 dio FCP ~1,6 s, LCP ~3,7 s y CLS 0 en el celular (E3: 1,5 y 3,7 s; 10 corridas alternadas).

### 10.2 Costos mensuales

En USD, al 08/10/2026. Los paga el museo.

| Concepto | USD/mes | Fuente |
|---|---|---|
| Workspace Hobby (1 miembro, sin cuota fija) | 0 | [new-workspace-plans](https://render.com/docs/new-workspace-plans) |
| Servicio web 0,5 CPU / 512 MB | 7,00 | [render.com/pricing](https://render.com/pricing) |
| Postgres Basic 256 MB | 6,00 | ídem |
| Almacenamiento de la base, 1 GB (incluye las fotos: 16.1) | 0,30 | ídem |
| Ancho de banda: 5 GB incluidos | 0, y 0,15 por GB extra | [changelog del 23/04/2026](https://render.com/changelog/updated-plans-for-render-workspaces) |
| Dominios propios: 2 incluidos (`mupa.ar` y `www.mupa.ar`; el panel no suma dominio) | 0, y 0,25 por cada extra | [custom-domains](https://render.com/docs/custom-domains), 08/10/2026 |
| Casilla de envío (dentro del correo de Hostinger que ya tiene el museo; lo confirma en hPanel la persona del museo), GitHub Free, GA4, Search Console, UserWay gratuito | 0 | — |
| **Total** | **13,30**, + el excedente de tráfico (era 13,55 con el disco, que no se usa: 16.1) | |
| Pagando en pesos con tarjeta (IVA 21 % RG 4240 + percepción 30 % RG 5617) | **≈ 20,10** | [ARCA](https://www.arca.gob.ar/iva/servicios-digitales/reg-percepcion-4240.asp), [iProUP, 09/2026](https://www.iproup.com/finanzas/71541-percepciones-30-por-ciento-arca-como-recuperar-devolucion-septiembre-2026) |

- Los "USD 16" se cumplen en dólares y sin impuestos.
- 5 GB alcanzan para unas 2.500-5.000 primeras visitas a la Home por mes. Es una estimación, no una medición.
- **La base, con las fotos:** 1 GB alcanza para unas 800 fotos hasta el aviso del 80 % del Inicio (~1 MB por foto, medido en E3.1: 7). El escalón siguiente es 5 GB (USD 1,50 por mes), porque `diskSizeGB` va en 1 o múltiplos de 5 y solo crece; al agrandarla, `ESPACIO_BASE_MB` pasa a 5120.
- **La facturación empieza con el primer deploy (S2)**, alrededor de un mes antes de la salida al público. Se avisa por escrito en E0.1.
- Un organismo público puede tener otro tratamiento impositivo; que lo confirme su administración.
- Si el plan de correo actual no admitiera otra casilla, lo ve en hPanel la persona del museo antes de crearla (11.1).

### 10.3 Copias de seguridad y restauración

| Qué | Cómo | Retención | Quién |
|---|---|---|---|
| Base, con las fotos | PITR automático de Render | **3 días** en Hobby ([postgresql-backups](https://render.com/docs/postgresql-backups), 08/10/2026) | Render |
| Base, con las fotos | "Create export" en el dashboard, mensual, descargado al Drive del museo | 7 días en Render; sin límite en el Drive | **El museo** (una carilla en `docs/operacion.md` y recordatorio en su calendario) |

**Una sola copia** (16.1): las fotos van en la base, así las dos copias de arriba las incluyen y la base y las fotos nunca quedan desfasadas. No hay snapshot de disco, botón "Descargar copia de las fotos" ni `restaurar-fotos.js`. El export pesa más (~1 MB por foto, 7).

**Restaurar la base sin que el Blueprint la pise** (documentado en `docs/operacion.md`; no se ensaya contra producción):
1. Recovery → base nueva `mupa-db-AAAAMMDD`. Revisar su `ipAllowList` y dejarla sin acceso externo.
2. En `render.yaml`, `DATABASE_URL` pasa a `sync: false`. Commit y **sync manual**: Render deja de administrar esa variable.
3. En el dashboard, pegar en `DATABASE_URL` la URL interna de la base recuperada. Se redespliega.
4. Comprobar **desde el sitio publicado** que el contenido es el correcto.
5. Sacar `mupa-db` del yaml, hacer sync manual y **recién ahí** borrar a mano la base vieja. Si no, el sync la recrea vacía ([IaC](https://render.com/docs/infrastructure-as-code), 08/10/2026).

**Ensayo (E5.3, antes del contenido real):**
- "Create export" en el dashboard, `pg_restore` en un Postgres local vacío en `C:\mupa-datos`, `npm start` contra esa base y comprobar que las páginas y el panel muestran lo mismo, **también las fotos** (`/fotos/<clave>/960.webp` de unas cuantas). Después se borra.
- En el dashboard, confirmar que la ventana de PITR está disponible.

### 10.4 Monitoreo y logs

**Avisos:**
- `/salud` es el health check: Render deja de mandar tráfico a los 15 s y reinicia a los 60 s ([health-checks](https://render.com/docs/health-checks), 08/10/2026). Por eso no mira la base.
- `/salud/base`, para un monitor externo gratuito opcional (revisar sus condiciones al crearlo).
- Las notificaciones de Render van al correo de la cuenta del museo.
- El Inicio del panel avisa del correo, las tareas diarias fallidas y el espacio de la base (desde el 80 %, E3.1).

**Logs:** una línea JSON por pedido a `/administracion/api` y por error (`{t, nivel, metodo, ruta, estado, ms}`), sin IP, sin cuerpos y sin cookies. Render los guarda 7 días. `unhandledRejection` y `uncaughtException` se registran y el proceso sale.

**Después de cada deploy:** `node tools/rutas-check.mjs --url https://mupa.ar/`. Falla si aparece `noindex` o un canonical que no empiece con `https://mupa.ar/`.

**Revisión mensual de 15 min**, en `docs/operacion.md`: ancho de banda, memoria, CPU y espacio de la base en Render; cobertura en Search Console; GA4 (que siga midiendo) y la consola del sitio sin violaciones de CSP; el Inicio del panel sin avisos; `npm audit`; y si se hicieron las copias del mes.

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
| E3.1 | Fotos: multer, sharp, almacén en Postgres (16.1), servido, **achique en el navegador** (+1 h desde el 15/10/2026), SubirFoto, Portada, Galería accesible, borrado al quitar, huérfanas, aviso de espacio, `fotos.test.js` | 8 | Panel | Foto de iPhone sin GPS |
| E3.2 | TipTap, esquema zod y `TextoRico.jsx` (incluye 0,5 h de TipTap 3) | 4 | Panel | Pegar desde Word queda limpio |
| E3.3 | Novedades: migración 05, API con la fábrica, pantallas | 3 | Panel | |
| E3.4 | Salas y muestras: migración 04, API, pantallas | 3 | Panel | |
| E3.5 | Eliminar con diálogo y cambios sin guardar | 1 | Panel | |
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
| E5.3 | Ensayo de restauración: export en un Postgres local (con las fotos) | 1 | Base | 10.3 documentado |
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
| | **Total** | **113** | | |

**Cambio del 15/10/2026 (decisiones del desarrollador): −2 h netas.** Con las fotos en Postgres (16.1) se fue E3.6 ("Descargar copia de las fotos", `restaurar-fotos.js` y fotos faltantes: −3 h), y el achique en el navegador pasó a ser estándar (E3.1: +1 h). Total: de 115 a 113 h.

**Avance al 16/10/2026:** las tareas de código de E0 a E3 están hechas (E0 a E2 commiteadas; E3 verificada y corregida, sin commitear), adelantadas respecto del calendario de 12.4. Lo que figura en la columna "Verificación" y depende de otra persona o del iPhone (E2.5: alta y primer ingreso con otra persona; E3.1: foto de iPhone sin GPS) queda para el desarrollador (13.5). Lo que sigue es E4; E5 y E6, como están planeadas.

**Avance al 20/10/2026:** E3 commiteada (`d0a7d36`, 19/10). **E4 hecha entre el 19 y el 20/10/2026, sin commitear** (E4.1 a E4.9, más IndexNow, opcional, y la división del JS por página de 6.2), **con el aspecto provisorio** que decidió el desarrollador el 19/10 (el lenguaje de la Home, sin efectos nuevos, en componentes chicos marcados como provisorios): el header, el menú, el pie y las fichas de la diseñadora se aplican en E6.3 cuando lleguen (fecha límite 06/11). Verificada con cinco revisiones independientes (la Home, las páginas y los buscadores, contacto y correo, accesibilidad y celular, y código y seguridad) y dos rondas de corrección (13). Lo de la columna "Verificación" que no se pudo hacer acá: la Prueba de resultados enriquecidos (E4.6, necesita una URL pública) y un envío por un SMTP real (E4.5: queda para E5.1). Lo que sigue es E5 (depende de la cuenta y el medio de pago del museo) y E6.

### 12.2 Horas por módulo

| Módulo | Tareas | h |
|---|---|---|
| Base | E0, E4.1, E4.6 (1,5 h), E4.7, E5 | 34,5 |
| Sitio institucional | E4.2-E4.5, E4.6 (1 h), E4.8, E4.9, E6.3 | 20 |
| Panel | E1, E2, E3, E6.1, E6.2 | 45 |
| Coordinación, revisiones y garantía | C1-C3 | 13,5 |
| **Total** | | **113** |

- La Base incluye lo que la landing no tenía: el servidor con SSR, el deploy, el corte de DNS y la regresión de la Home.
- **Cambio de la versión 3: +2 h, todas en E5.4.** Que el corte lo haga una persona del museo guiada por el desarrollador suma el instructivo y dos llamadas. Pasar el panel a `/administracion` no cambia las horas: lo que se ahorra en DNS del panel (E5.1) se va en el instructivo de la casilla, y el reparto por ruta, la cookie y el CSRF cuestan lo mismo que por host (E0.3, E1.2).
- **Cambio del 15/10/2026: −2 h, todas en el Panel.** Sin disco (16.1) se va E3.6 (−3 h) y el achique en el navegador suma 1 h a E3.1.
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
| S3 | 26-30/10 | 19,5 (+0,5) | E3.1-E3.5, C1 | **H3 (30/10):** fotos, novedades y exposiciones en el panel |
| S4 | 02-06/11 | 16 (+4) | E4.1-E4.4, C1 | **H4 (06/11):** páginas públicas, menú y pie, Home sin regresiones. **Fecha límite del diseño** |
| S5 | 09-13/11 | 17,5 (+2,5) | E4.5-E4.9, E5.2, E5.3, E5.5, E6.1, E6.2, C1 | **H5 (13/11):** contacto con mensajes, SEO, CSP, restauración ensayada, accesibilidad, manual y capacitación; el museo carga contenido en `mupa-web.onrender.com/administracion` |
| S6 | 16-20/11 | 6,5 (+13,5) | E6.3, C1 | **H6 (≤ 20/11): entrega.** Acta y comienzo de la garantía |
| Después | desde 23/11 | 15 | E5.4 cuando el museo confirme el contenido y esté la persona con acceso a hPanel; C2 (dos rondas con 5 días hábiles de respuesta del museo cada una); C3 hasta ~19/01/2027; C1 | **H7:** corte de DNS |

**Avance real al 16/10/2026:** las tareas de código de S1 a S3 (E0.2 a E3.5) están hechas; el hito H3 quedó adelantado dos semanas. El deploy (E5.1) todavía no se hizo: depende de la cuenta y el medio de pago del museo (12.6).

**Avance real al 20/10/2026:** también E4.1 a E4.9 (las tareas de código de S4 y las de E4 de S5), unas tres semanas antes de H4 (06/11) y H5 (13/11), con el aspecto provisorio; lo que H4 y H5 piden de Render (contenido cargado en `mupa-web.onrender.com/administracion`), de la diseñadora (E6.3) y de E5/E6 sigue pendiente. El deploy sigue esperando la cuenta y el medio de pago del museo.

**Ajustes posibles:**
- 16.1 se adoptó el 15/10/2026: sin E3.6, S4 quedó con 3 h libres (y S3 con una más, por el achique en E3.1).
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
| ID de UserWay | E4.7 (hecho sin él: se carga cuando esté) | S5 |
| Enlace de la plataforma externa de entradas, si existe | Botón de compra | S5 |
| Texto de privacidad para el pie y el formulario (con los mensajes guardados 180 días) | Pie definitivo | S6 |
| **Diseño: primero header, menú móvil y pie; después una ficha tipo** | E6.3 (E4 se hizo con un aspecto provisorio: 6.7) | **06/11** (si llega después, se acuerda aparte) |
| Validar las descripciones de las páginas para los buscadores (6.4) | Nada (son neutras) | Antes del corte |
| OK para la organización de GitHub | Transferencia del repo | H6 |

---

## 13. Pruebas

### 13.1 API, base y SSR

**Herramienta:** `node:test` con `npm test`, en serie, contra `mupa_test`.

**`ayudas.js`:**
- `prepararBase()` hace `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` y corre todas las migraciones. **Se niega** si la base no está en localhost o no termina en `_test`.
- `crearUsuario(rol)`, `cookiePara(rol)`, `levantar()` (`app.listen(0)`) y `pedir(metodo, ruta, { host, cookie, origen, sitio, cuerpo })`.
- `correo.js` en modo `memoria`, con una opción para que el transporte falle.
- **E4:** `levantar(env, { obtener, correo })` le pasa a la app el render de verdad (`ssr.test.js`) y el correo del formulario. `prepararBase()` saltea sin variable o sin conexión (Postgres apagado) y, **si la base no contesta a tiempo** (la PC cargada), reintenta 3 veces de 5 s y la prueba **falla** en vez de saltearse (COD-03 de la verificación de E4: un verde con un archivo salteado no probó nada). Queda, de severidad baja (COD-06): si la base acepta la conexión y no contesta el saludo, el error de pg ("timeout expired", sin código) cae en la rama de "`DATABASE_URL_TEST` mal configurada" después de 2 intentos (el tope del intento es igual al `connectionTimeoutMillis` del pool, 5 s); falla igual, pero con un mensaje que culpa a la configuración. Arreglo: tratar ese error como `TOPE`, o subir el tope del intento a ~8 s.
- **Al cerrar E4 (20/10/2026):** con base, 364 de 364, 0 salteadas; sin base, 227: 217 pasan y 10 salteadas, una por archivo con base (se suman `ssr` y `contacto`).

| Archivo | Qué comprueba |
|---|---|
| `auth.test.js` | Inicio correcto y fallido con el mismo mensaje. 5 fallidos desde una IP dan 429, y **desde otra IP la clave correcta da 200**. Vencimiento por inactividad y por máximo. **Un desactivado pierde la sesión en el pedido siguiente.** **La temporal sale una sola vez** (no aparece en `GET /usuarios` ni en los logs). **Con `debe_cambiar_clave`, todo menos sesión y `cuenta/clave` da 403**; después de cambiarla, todo anda. Temporal vencida → 401 con su mensaje. Dar una temporal cierra las sesiones de esa persona. Cambiar la clave invalida las otras sesiones. Último admin → 409. Flags de la cookie: con https, `__Secure-mupa_sesion`, `Path=/administracion`, HttpOnly, Secure y SameSite=Strict, sin `Domain`. `crearAdmin()` y `restablecerAdmin()` de `admin.js` |
| `permisos.test.js` | Recorre `api/indice.js` bajo `/administracion/api`: sin cookie → 401; editor en ruta de admin (usuarios, mensajes) → 403; `Sec-Fetch-Site` `cross-site` o **`same-site`** → 403; `Origin` ajeno → 403; cuerpo inválido → 400 antes de tocar la base; editor que cambia el correo de destino → 403. **Por ruta:** `/api/…` fuera de `/administracion` → 404; toda respuesta de `/administracion/…` (HTML, API y errores) trae la CSP del panel y `X-Robots-Tag: noindex`, también con el host `mupa.ar`, y `no-store` salvo en `/administracion/assets`. **E3:** las rutas multipart (`POST /fotos`) entran con un formulario (`multipart()` de `ayudas.js`); al cerrar E3, 22 rutas con cuerpo, 23 con `:id` (con su cuerpo válido y su "No existe esa novedad/muestra/sala") y 5 de admin; qué rutas tienen `limiteJson`. **E4.9:** `GET /mensajes` entra solo: 6 de admin, y `/mensajes` salió de la lista que esperaba 404 |
| `migraciones.test.js` | Ida, vuelta de a una hasta el principio y otra vez ida, con `SequelizeMeta` al día. Cada modelo contra las columnas de su tabla (nombres y `NOT NULL`). Las restricciones con nombre de 3.2 y que rechacen lo que tienen que rechazar. Datos iniciales de 3.4. Grep de `sync(` desde E1 (sumado en la corrección de E1, 13/10/2026). **E3:** las migraciones 03 a 05 (tablas, modelos, todas las restricciones con nombre y que rechacen, los índices, `STORAGE EXTERNAL` de `fotos_archivos.datos`), con la tabla `TABLAS_DE` por migración. **E4.9:** la 06, con sus dos restricciones (que rechacen) y su índice |
| `estado.test.js` (E2.2) | `GET /estado` para un editor y para un admin ("Para completar", un solo admin, el correo, las tareas fallidas) y, sin base, el registro de las tareas diarias que lee. **E3:** `espacio` para los dos roles, `msHastaLaProximaVuelta` (las 04:00 de San Juan) y que una tarea que falla no frene a las demás. **E4.9:** las tareas nuevas en el registro y el `correo` de `/estado` (el aviso, para los dos roles) |
| `museo.test.js` (E2.3) | El esquema del PUT (URLs, el `<iframe>` del mapa, redes, reglas de dos campos, caracteres invisibles), `GET`/`PUT /museo` y el museo público del estado: sin el correo de destino aunque esté cargado, el aviso solo vigente, la compra solo activa y el último museo bueno. **E4.3:** los tres textos van solo en los datos de `/visitas`, no en el museo común de ninguna página |
| `visitas.test.js` (E2.4) | Horario (franjas, días cerrados, mensajes) y tarifas: alta, cambio completo, borrado, orden (409 si la lista no coincide), el tope de 50 con dos altas a la vez y la renumeración del orden (con 32767) |
| `textoRico.test.js` (E3.2) | Sin base: el esquema (documento válido y su forma canónica, vacío → null, nodo o marca prohibidos → 400, `javascript:` y demás enlaces → 400, 301 bloques y 20.001 caracteres → 400, claves de más descartadas, control y surrogates), los enlaces (`completarEnlace`, `completarEnlaces`) y `TextoRico.jsx` con `renderToStaticMarkup` (cargado con el Vite del proyecto): sin HTML crudo, sin enlaces que no sean https, http, mailto o tel; y que ningún archivo de `src/`, `panel/src` ni `compartido/` use HTML crudo. La API de los textos y la Home con los textos cargados están en `museo.test.js`. **Corrección de E3:** `BYTES_MAX` y, desde la ronda 2, 8 pruebas de `editorTexto/enlace.js` con un editor de TipTap sin montar (`new Editor({ element: null })`, sin DOM): el cursor justo después y justo antes de un enlace, en el medio, dos enlaces pegados, uno con una parte en negrita, lejos de un enlace y con texto elegido |
| `panel-api.test.js` (E2) | Sin base ni navegador, con un fetch falso: `panel/src/api.js` (Content-Type y `'{}'`, 401 con reingreso, 403 con `debeCambiarClave`, sin red, sesión terminada), `navegacion.js` (`volverSeguro`) y `reingreso.js`. **E3:** `api.subir` con un `XMLHttpRequest` falso; la barra con Novedades y Exposiciones, `contenidos.js` (`leerFiltros`, `consultaDe`, `traerTodas`) y `pantallas/contenido/valores.js` (`cuerpoDe`, `comparable`, `fusionarGuardado`) |
| `contenido.test.js` | Borrador → 404 en el sitio. Publicar → visible **en el pedido siguiente**. Slug único (409) y fijo después de publicar. Eliminar libera solo las fotos sin uso. Nodo prohibido o `javascript:` → 400. Grep: ni `sync(` ni `dangerouslySetInnerHTML`. **E3.3 a E3.5 (16/10/2026), sin páginas públicas todavía:** borrador, publicar y despublicar (`publicado_en` una sola vez), dirección única en el alta (también con altas a la vez) y en un cambio (409), fija después de publicar, validación al publicar y al guardar algo publicado (portada decorativa incluida), listado (filtros, `%` y `_` literales, páginas), galería (fotos que no existen → 409), eliminar y reemplazar liberan solo lo que nadie usa, la sala de una muestra, el orden, el log sin títulos, la semilla de ejemplo y que esas direcciones públicas den hoy la 404 (E4 cambia esa prueba por la del borrador y lo publicado). **E4 (19/10/2026):** cambiada: borrador → 404, publicado → visible en el pedido siguiente, despublicado → 404 otra vez; con `PAGINAS_PUBLICAS_DE_CONTENIDO` en `true`. El grep recorre `server/`, `panel/src`, `src/` y `compartido/`. **Corrección de E3 (16/10/2026):** borrar una foto que otra transacción está empezando a usar (pedido y tarea diaria), la galería y la portada de una pestaña vieja, `faltan` y el tope de 300 kB |
| `fotos.test.js` | JPEG, PNG y WebP entran. SVG, HEIC falso y texto `.jpg` → 415. 60 MP → rechazo. **El JPEG con GPS sale sin EXIF.** Las variantes existen. Sin sesión, multer no corre. **Cómo quedó (E3.1 y la corrección de E3, 16/10/2026):** las imágenes se arman con sharp en la prueba (con GPS, con Orientation 6, PNG con transparencia, un JPEG con el encabezado cambiado a 60 MP). Sin base: el procesado (EXIF y GPS fuera, orientación, sin agrandar, `og.jpg` sobre blanco, alto hasta 16383), 415 para SVG, HEIC, texto, GIF, AVIF y TIFF, 413 por megapíxeles y por imagen progresiva, la foto dañada, el tope de tiempo, la cola (de a una y los 3 lugares), la LRU, el semáforo de lecturas, `usos.js`, `/fotos` sin base, el 304 y la lógica del achique del panel. Con base: punta a punta con cabeceras (maestra 404, HEAD, 304, 404 con `no-store`, cualquier host y `noindex`); 415 y 413 por la API; que multer no corra sin sesión, con la temporal, sin CSRF ni pasado el límite (29 MB → 401, 403 o 429, no 413); una falla a mitad de la transacción (con un trigger) no deja nada; PATCH; `liberar` (rollback, commit y caché); una sola lectura si piden lo mismo juntos; como mucho 2 lecturas por HTTP; huérfanas; y `USOS_DE_FOTOS` contra las claves foráneas de la base. Con disco no hay nada que probar (16.1) |
| `contacto.test.js` | Envío correcto: fila `enviado`, From = la casilla, Reply-To = el visitante, texto plano. Transporte que falla: fila `fallido`, 303 igual y aviso en `/estado`. Base y transporte caídos → 503 con el correo público. Trampa con algo → 303 sin guardar ni enviar. Salto de línea en el nombre → 400. Sin destino → no hay formulario. 6.º envío de una IP en la hora → 429. Los mensajes de más de 180 días se borran en la tarea. **Cómo quedó (E4.5, E4.9 y la corrección de E4; 28 pruebas):** además, el esquema (también invisibles, inversión bidi y lo pegado que se acomoda), `armarCorreo` (un CRLF y un Bcc en el nombre no llegan a ninguna cabecera), la configuración sin mostrar valores (y `SMTP_PUERTO` en producción, `requireTLS`), el modo memoria con su estado y su racha, el SMTP falso de `smtpFalso.js` (acepta, 535 → EAUTH, corta → ECONNECTION) de punta a punta, `estadoDelCorreo`, la base caída (GET 503 y POST 503 con lo escrito), el formulario y el mapa en el HTML sin el destino, CSRF, 415 y 413, un 400 que no gasta intentos, 5 por hora y 50 por día con una línea de log por ventana, **cinco y cincuenta POST cortados a los 60 ms siguen contando** (quedan 50 filas y 50 mails), la base bloqueada (`LOCK TABLE`: 303 en menos de 3 s y ninguna fila suelta), un correo lento (la fila pasa de `pendiente` a `enviado`), el repetido, la marca de `?enviado=`, la tarea de la casilla, `GET /mensajes` solo admin y el log sin direcciones, nombres ni textos |
| `ssr.test.js` | Cada ruta da 200 con `title`, canonical `https://mupa.ar/…` y JSON-LD que parsea. Host no público → `noindex` en meta y cabecera; host público → sin `noindex`. Con `CANONICO=1`, otro host → 301 a `https://mupa.ar/` con la misma ruta, también `/administracion/…`. **Ninguna respuesta pública trae `Set-Cookie`**, aunque el pedido traiga la cookie de sesión. Ninguna página pública trae la CSP del panel ni ninguna de `/administracion` la pública. El estado no contiene `email_destino_contacto`. `</script><script>alert(1)</script>` en cada campo de texto: no aparece y el JSON-LD parsea. `$'`, `$&` y `$$` en el título: el HTML queda intacto. Paginación (301 y 404). `//evil.com/`. `/google19017c966a32aec2.html` → 200. Con la base caída, la Home da 200 y las demás 503. **Cómo quedó (E4.2 a E4.8; 18 pruebas, 14 con base):** las rutas y sus códigos, ETag y 304; la paginación (301 de `?pagina=1`; 404 con 3 si hay 2, 0, 02, abc, vacía, repetida, 1.5 y -2); borrador → 404, publicado en el pedido siguiente, despublicado → 404; el estado sin el correo de destino, tarifas ocultas, borradores ni campos internos de las fotos (solo sus 8 campos públicos); el escape en el estado, el JSON-LD y el `<title>`; `Museum` completo y `NewsArticle`; `og:image` con medidas; `noindex` por host y la CSP pública; el sitemap; **ninguna respuesta pública pone `Set-Cookie`** (la prueba pasó de `auth.test.js`, y ahora recorre también las páginas nuevas, la paginación y `//evil.com/`); con la base caída, la Home 200 y las demás 503; `precargasDePaginas`, `ARCHIVOS_DE_PAGINAS` contra la tabla de rutas, `cortarEnPalabra`, `medidasOg` y el horario del JSON-LD; IndexNow con un fetch falso (avisa al publicar, al cambiar algo publicado, al despublicar y al eliminar; nunca por un borrador; sin clave o fuera de `mupa.ar`, nada, y el `.txt` da 404) |
| `layout.test.js` (E4.1, sin base) | `resumirHorario` (días seguidos, franjas, cerrados al final, notas, todo cerrado → nada, datos ilegibles), `textoDias` y `textoFranjas`; el museo máximo y el vacío dibujados con `Raiz`, `Header` y `Pie` (con el Vite del proyecto, `ssrLoadModule`); `aria-current`; la 404; la compra con y sin texto; la privacidad solo si existe; `datosMuseo.js`; y, desde la corrección de E4, lo que arreglaron las dos rondas: las secciones en el pie y los enlaces de 44 px, `data-logo-blanco`, la foto con prioridad de la primera tarjeta, el `sizes` de la portada, las notas en varios renglones, lo largo que se parte y la tabla del horario (solo la celda de las horas parte palabras, el modo apilado y los `role`) |

### 13.2 Recetas de `tools/`

Se corren con `--url` contra Express después de E0.4, E4.1 y E6.3, en cada cambio del header o del pie, y antes del corte.

| Receta | Cómo y dónde |
|---|---|
| `parallax-expr.js`, `parallax-compuerta.js`, `parallax-ejes.js`, `collage-check.js`, `mosaico-check.js`, `hitos-check.js`, `areas-check.js` | Con `measure.mjs` a 1440x900, 1366x768, 1280x720, 375x812, **390x664 y 375x635** |
| `parallax-check.mjs` | Sin navegador |
| `acordeon-dedo.mjs` | `flick`, `apoyado` y `lectura --subir`, con y sin `--como-safari`, a 390x664, 375x635, 375x812 y 412x780, con pie máximo y vacío. 0 tirones y 0 bandas salteadas |
| `analitica-check.mjs` | Build local de producción con `URL_PUBLICA` local (2.5). Que `ver_pie` **no** salga en `/visitas` |
| `vitals.mjs` | En local, `tools/servir.mjs --latencia 150 --kbps 1638` como **proxy delante de `npm start`**, comparado con H1. Y contra Render. Con `--consola`, sin violaciones de CSP |

**Cómo se corrieron en E4 (19-20/10/2026):** contra builds propios (`DIR_BUILD`, nunca `dist/` mientras alguien lo sirve), con `SIN_BASE=maximo` y `SIN_BASE=vacio` y, además, con el museo más largo que admite el panel cargado por la API en un esquema aislado; las páginas internas, con contenido cargado por la API (fotos reales achicadas como el panel, muestras y actividades en todas sus situaciones). La matriz de la Home (las 7 recetas en los 6 tamaños y las 24 combinaciones de `acordeon-dedo`) **de a una**: con dos Chrome a la vez apareció un tirón aislado. `analitica-check` dio `ok` a 1440x900 y 390x664 con las mismas secciones que E3, y `ver_pie` no sale en `/visitas`. Los scripts quedaron en `tools/salida/e4-*` (no versionados; pasar una receta de E4 a `tools/` queda pendiente). Notas de los arneses, no de la página:
- **`acordeon-dedo` cuenta como tirón un cierre bien compensado** cuando el cuadro del cierre dura dos (33 ms) o el flick va rápido (HOME-02 de la verificación): su criterio (`|salto + dy| > 60` y `|salto| > 60`) no descuenta lo que se plegó arriba. Con la CPU limitada x4 a 412x780 lo dispara más seguido en E4 (la página es más pesada) que en E3. Un tirón con `salto + dy` igual a menos el plegado de un evento `cierra` no es un defecto. Arreglo en la herramienta: comparar el salto con lo que se plegó arriba en ese cuadro, o con el de los cuadros vecinos escalado por la duración del cuadro; y comprobar que `--tarde` siga dando tirones.
- `collage-check` falla si corre después de `parallax-ejes` en la misma carga (también en E3), e `Input.synthesizeScrollGesture` no mueve la página en este Chrome (se usaron eventos de toque).

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
- **E4 (19-20/10/2026):** sin diferencias en el celular y en escritorio, con `consola` y `csp` vacías y la prueba de control detectando el cambio: la Home, `/?diag` y `/no-existe` con el museo máximo y el vacío; las páginas internas con contenido (14 rutas en la implementación y en la corrección, 37 en la verificación de las páginas); y `/contacto` en sus estados (el 400, el 429, el 503 y el 303, con lo escrito raro).

### 13.4 `tools/rutas-check.mjs`

Revisa las redirecciones y cabeceras de 11.2 (páginas públicas y `/administracion`), `noindex` y canonical según el host, que `/administracion` lleve siempre `noindex` y su CSP, que no haya zod en el bundle público y los tamaños de JS y CSS contra la línea de base. Sale con código 1 si algo falla. Se corre **después de cada deploy** y en la revisión mensual.

### 13.5 A mano

- Teclado y NVDA en el panel y en cada página.
- Contacto sin JS: envío correcto, error de validación y SMTP caído (en local, `CORREO_MODO=smtp` con un host inexistente).
- Alta de un usuario, primer ingreso con la temporal y "Dar contraseña temporal", con otra persona del otro lado.
- **iPhone** (el desarrollador, con `?diag`): menú móvil y bloqueo del scroll, formulario, subir una foto desde la cámara (HEIC → JPEG), el panel a 375 px y la consola sin violaciones de CSP. **Desde E3:** elegir fotos de la galería y desde la cámara, el achique con `createImageBitmap` y la orientación en Safari; el editor de texto (escribir, la barra en varias filas, el diálogo del enlace, pegar, tocar a la derecha de un renglón que termina en un enlace y apretar Enlace); `datetime-local` y `date` con el selector del sistema; el foco al subir y al cancelar.
- **Pegar en el editor desde el portapapeles real** de Word (Windows y Mac), Google Docs y LibreOffice: en las pruebas automáticas se usó HTML de Word armado a mano con la estructura de `mso-list`.
- **La barra de progreso de una subida** con una conexión real: contra 127.0.0.1 la subida es instantánea y solo se ve en 0 %.
- **Desde E4 (iPhone, el desarrollador):** el menú del celular (que la página de atrás no se mueva con `overflow: hidden` y `overscroll-behavior: contain`, el `<dialog>` en `svh` con la barra de Safari, el foco y Esc con un teclado externo, volver atrás desde una sección); las fichas y la galería; `/visitas` con el aA de Safari al 150 y al 200 % (la tabla tiene que apilarse) y VoiceOver leyendo la tabla apilada como tabla; el ancla `#sala-<slug>` desde "Ver en el sitio"; el formulario con la validación nativa, el teclado, el foco al aviso, "Enviando…" y el cuadro de solo lectura del 503; el mapa con el dedo; los enlaces del pie de 44 px; y la consola sin violaciones de CSP.
- **Lo que no se pudo probar acá:** el mapa real de Google (siempre bloqueado en las pruebas; con el embed del museo), UserWay con el ID real, un SMTP real (E5.1), el alto contraste real de Windows (se emuló con `forced-colors`), NVDA (E6.1) y la Prueba de resultados enriquecidos (E5.2).

### 13.6 Cómo se verificó E4 (19-20/10/2026)

Cinco revisiones independientes, cada una con su copia del build, su producción local y su esquema aislado de `mupa_dev` (borrado al terminar), cuentas propias de `crear-admin`, Chrome solo headless y Google, UserWay y `example.com` bloqueados (ningún pedido salió de 127.0.0.1 y ningún mail salió a la red), y dos rondas de corrección re-verificadas por la misma revisión:
- **La Home** (355 comprobaciones): E4 contra E3 número a número, con las recetas, `acordeon-dedo`, la rueda por Áreas, las anclas, la recarga a mitad de página, reduced-motion, `vitals` y el menú abierto a mitad de cada efecto. Sin regresiones.
- **Las páginas y los buscadores** (unas 4.200): todas las rutas de 6.1 con códigos, `<head>`, JSON-LD, sitemap y escapes; publicar, cambiar y despublicar; el proceso en UTC+14 y el reloj a las 23:30 y a las 00:30 de San Juan; el host `mupa.ar`; la base caída y colgada; hidratación; axe en cinco tamaños; "Ver en el sitio".
- **Contacto y correo** (349): el formulario con y sin JavaScript, la validación, el mail (cabeceras, sin contrabando de SMTP), un SMTP que falla de cinco maneras, los límites, la base cortada, Mensajes, el Inicio, las tareas, la configuración, `probar-correo`, los logs, GA4 y UserWay.
- **Accesibilidad y celular** (1.550): axe sin violaciones en 12 páginas a 9 tamaños (salvo el contraste de las bandas de Áreas, de antes), el menú del celular con teclado, dedo y rueda, el formulario, el zoom al 200 %, el espaciado de WCAG 1.4.12, la letra del navegador agrandada y reduced-motion.
- **Código y seguridad** (216): el código contra el plan, la migración 06 de ida y vuelta, la CSP, las cookies, los datos privados, el CSRF y los límites del formulario, la configuración, IndexNow, el bundle y `npm test`.

La verificación encontró 24 hallazgos, ninguno crítico: uno alto (los límites del formulario se esquivaban cortando la conexión, 4.7), tres medios (la base colgada en el formulario, 8; una dirección web o un correo que ensanchaba la página en el celular; enlaces de menos de 44 px en el celular, 6.7) y el resto bajos. La ronda 1 corrigió 22 (A11Y-03 a medias; PAG-05 quedó a decisión del desarrollador) y la re-verificación encontró ocho más, uno medio causado por la corrección (los nombres de los días partidos en la tabla del horario), que corrigió la ronda 2. Quedaron abiertos, de severidad baja: CON-08, CON-09 y CON-10 (8 y 4.7), COD-06 (13.1), HOME-02 (de la herramienta, 13.2), PAG-05 (el menú se corre al llegar la fuente, 15), A11Y-03 a medias (el toque en "Menú" antes de que la página hidrate se pierde; el camino sin JavaScript son las secciones del pie), A11Y-07 (la 404 y el pie tienen dos navegaciones llamadas "Secciones del sitio", y "Visitas" del pie mide 43 px de ancho) y A11Y-08 (con colores forzados y tema claro, el logo invertido del header de la Home queda negro sobre el cielo del hero: 3 a 3,7:1 en el celular y la tablet; arreglo: no invertir el del header cuando va sobre el hero).

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
| sharp sin memoria con 512 MB | Baja-media | Medio | Una foto por pedido, `concurrency(1)`, `limitInputPixels`, achique en el navegador; desde la corrección de E3, como mucho 3 subidas en curso (antes de leer el archivo) y 413 para un JPG progresivo o un PNG entrelazado que ocuparía más de 160 MB al decodificarlo |
| Las fotos llenan la base (1 GB: unas 800 fotos hasta el aviso) | Baja-media | Medio | Achique en el navegador, aviso del Inicio desde el 80 % (`ESPACIO_BASE_MB`), revisión mensual y el escalón de 5 GB (USD 1,50, 10.2). Con disco no había este riesgo, pero sí segundos de caída en cada deploy y copias separadas (16.1) |
| Una ráfaga de pedidos a `/fotos` con claves al azar llena la fila de lecturas y las fotos reales dan 503 | Baja | Medio | 2 lecturas a la vez y 1000 esperando 10 s; la mejora barata (las claves que existen, en memoria) está anotada en 7 (API-05). Con un CDN delante se alivia |
| Tres subidas lentas ocupan los 3 lugares de subida durante 5 minutos | Baja | Bajo | Hace falta sesión; los arreglos (un lugar por cuenta, tope de tiempo propio, un reintento en el panel) están anotados en 7 (API-07) |
| Render bloquea SMTP también en Starter | Baja-media | Alto (Contacto) | Prueba en E5.1 con 465 y 587; los mensajes quedan guardados igual; alternativa a decidir antes de seguir (8) |
| Cambia la clave de la casilla de envío y el formulario deja de mandar | Media | Medio | Verificación al arrancar y diaria, aviso en el Inicio, mensajes guardados, paso en `docs/operacion.md` con `probar-correo` |
| Los mails del formulario caen en spam en el destino | Baja | Medio | From de `mupa.ar` por su propio servidor (SPF, DKIM y DMARC en PASS, comprobado en E5.1); Reply-To al visitante |
| Se pasa el límite diario de la casilla | Baja | Bajo | Tope de 50 por día, trampa y límites por IP. Desde la corrección de E4, los límites cuentan también los pedidos cortados y el doble clic no manda dos (4.7 y 8) |
| Contraseña temporal interceptada | Baja | Medio | 80 bits, vence a las 72 h, cambio obligatorio, entrega en persona o por teléfono, nunca en logs |
| Nadie puede entrar al panel (se va el único admin o se olvidan todos) | Baja | Alto | Dos admins, "Dar contraseña temporal", `restablecer-admin` en el Shell de Render |
| Dos personas editan la misma ficha | Baja | Bajo | Gana el último guardado; lo avisa el manual; control de versión en la fase 2. Desde la corrección de E3, la galería y la portada de una pestaña vieja ya no borran lo que agregó la otra persona (`antes` y `portadaAntes`, 4.3) |
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
| Menú móvil en iOS / UserWay tapa o corre elementos | Media | Bajo | `lenis.stop()`, prueba en el iPhone, CLS 0. Desde E4: el menú del celular no anda antes de que la página hidrate (en la Home, de 1,3 a 3,4 s a la vista sin funcionar, medido con la CPU x4 y la red lenta): las secciones también están en el pie, que anda sin JavaScript |
| El personal no completa los alt o no usa el panel | Media | Medio | Alt obligatorio con ejemplos, manual, capacitación, "Para completar" |
| El museo carga contenido antes de que estén las páginas de E4 y lo busca en el sitio | — | — | **Resuelto en E4** (19/10/2026): las páginas existen y el panel muestra "Ver en el sitio" (5.4) |
| El diseño de la diseñadora no llega a tiempo y el sitio sale con el aspecto provisorio de E4 | Media | Bajo | El aspecto provisorio usa el lenguaje de la Home y está en componentes chicos marcados como provisorios: E6.3 cambia clases y orden sin tocar datos ni lógica; recetas e hidratación otra vez después (13.2 y 13.3) |
| El formulario y la medición salen sin el texto de privacidad (Ley 25.326) | Media | Medio | El texto es del museo (12.6): el sitio lo dibuja en cuanto está en `content.js` (`pie.privacidad` y `contacto.privacidad`); pedirlo antes del corte |

---

## 15. Preguntas abiertas

### Para el desarrollador

1. **D1. Fotos: ¿disco o Postgres (16.1)?** Resuelta el 15/10/2026: Postgres (`bytea`), sin disco ni E3.6, y el achique en el navegador como estándar. Implementada en E3.1 (7).
2. **D2. ¿PostgreSQL 17 en esta PC?** Resuelta: instalado para E1 (`mupa_dev` y `mupa_test`).
3. **D3. ¿Se le pide al museo el acceso delegado a Hostinger (solo DNS y correo, revocable)?** Es opcional: sin él, la casilla y el corte los hace una persona del museo (11). Con él, E5.4 baja unas 2 h.
4. **D4. ¿Algo de Novedades en la Home?** No está en el alcance (fase 2).
5. **D5. Mensajes del formulario: ¿solo admins (propuesto) o también editores?** E4.9 implementó lo propuesto (solo admins); pasar a editores es el rol de la ruta en `server/api/indice.js` y en `panel/src/navegacion.js`, y el enlace del aviso del Inicio.
6. **D6. ¿nodemailer 10.0.16 o la 10.1?** (2.3).
7. **D7. ¿Guardar sin mandar los mensajes que pasan de los 50 por día?** Haría falta otro tope de guardado (8).
8. **D8. ¿Precargar la fuente en las páginas internas?** En la primera visita en escritorio, el menú del header se corre al llegar Google Sans Flex (CLS de 0,0003 a 0,0005, PAG-05 de la verificación de E4; con la fuente en caché, 0). Se evita precargando el woff2 o reservando el ancho del menú, pero cambia las prioridades de carga: también puede esperar a E6.3.
9. **D9. ¿Partir el JS del panel por ruta?** (5.1, COD-07 de E3: 577 kB) y **¿subir el tope de 160 MB de las imágenes progresivas?** (7).

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
11. **Texto de privacidad** para el pie y el formulario (tiene que mencionar que los mensajes se guardan 180 días; conviene que nombre a Google Maps y a GA4).
12. **Diseño:** primero header, menú móvil y pie; después una ficha tipo; **fecha límite 06/11**.
13. **Titular del dominio** en NIC Argentina.
14. **Ventana para el corte de DNS:** un día hábil temprano, con la persona de hPanel disponible.
15. **Las descripciones de las páginas para los buscadores** (6.4): hoy son líneas neutras escritas sin datos del museo; validarlas, como la de la Home.

---

## 16. A reconsiderar

### 16.1 Guardar las fotos en Postgres en lugar del disco persistente

**Resuelto el 15/10/2026: Postgres** (`bytea`, sin disco persistente), decisión del desarrollador, junto con el achique en el navegador como estándar. Implementado en E3.1 (16/10/2026) y ajustado en la corrección de E3: sección 7.

**Lo que se midió para decidir** (15/10/2026, en esta PC, con 17 fotos reales de 6000x4000, de 8 a 18 MB):
- **Espacio:** 622 kB de promedio por foto con sus cinco archivos y 256 kB sin la maestra: unos 180 MB cada 300 fotos (la estimación anterior era de 120-150 MB).
- **Tiempo:** ~2 s de procesado por foto.
- **Memoria:** ~60 MB por foto, achicada en el navegador.
- Con la configuración que quedó en E3.1 (la maestra en WebP 90 y `og.jpg` con mozjpeg), las fotos de la Selección Fotográfica ocuparon más: 0,7-1,8 MB por foto, ~1 MB de promedio, así que 1 GB alcanza para unas 800 fotos hasta el aviso del 80 % (7, "Cuánto ocupa").

**Por qué se eligió** (el análisis previo, 08/10/2026):
1. **Sin caída en cada deploy.** Render dice: "Adding a disk to a service prevents zero-downtime deploys" ([disks](https://render.com/docs/disks), 08/10/2026). El sitio público sale de ese mismo servicio.
2. **Una sola copia en lugar de dos:** el export mensual que hace el museo incluye todo y el PITR de 3 días también restaura las fotos. Con disco hacían falta el botón de copia, el script de restauración y la detección de faltantes (E3.6, 3 h), y la base y el disco podían quedar desfasados.
3. **Mudarse es más fácil:** cambiar de workspace o irse de Render es un `pg_dump`. El disco no se lee desde one-off jobs ni desde otros servicios (ídem).
4. **El costo es casi igual:** USD 0,30 por GB en la base contra 0,25 en el disco. El siguiente escalón de la base es 5 GB (USD 1,50), porque `diskSizeGB` va en 1 o múltiplos de 5 y solo crece ([blueprint-spec](https://render.com/docs/blueprint-spec), 08/10/2026).

**En contra, aceptado:** una foto sin caché la sirve una base de 0,1 CPU (se mitiga con URL inmutables, el borde de Render para `.webp` y `.jpg`, una LRU de 32 MB y como mucho 2 lecturas a la vez, que dejan conexiones libres para las páginas), y el `pg_dump` pesa más.

**Qué cambió en el plan:**
- La migración 03 tiene `fotos_archivos` (3.2), con `STORAGE EXTERNAL` y sin modelo: ningún listado lee `datos`. La foto y sus cinco archivos se guardan en una transacción.
- `server/fotos/almacen.js` guarda en Postgres y `/fotos/:clave/:archivo` es un handler propio (`server/fotos/servir.js`): ETag, 304, `immutable`, la maestra sin publicar.
- `render.yaml` va sin `disk` y no hay `DIR_FOTOS`; entra `ESPACIO_BASE_MB` (2.5) y el Inicio avisa del espacio desde el 80 % en lugar de las "fotos faltantes".
- No existen E3.6, `copia.js`, `restaurar-fotos.js` ni `/copia/fotos`: **−3 h**. El achique en el navegador como estándar suma **1 h** a E3.1. Total: **113 h** (12.1).
- El costo mensual queda en USD 13,30 (10.2) y las copias son una sola (10.3).

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
- **ZIP con JSON de todas las tablas y `restaurar-copia.js` genérico.** Adaptada: el export de Render ya es un `pg_dump` que se restaura en cualquier Postgres. El ZIP quedaba solo para las fotos con disco; con las fotos en la base (16.1, 15/10/2026) no hace falta.
- **Avisar al admin a los 35 días sin copia.** Descartada: el panel no puede saber si se hizo el export en Render (y no manda mails). Queda como recordatorio en el calendario del museo y en la revisión mensual.
- **Contador diario en la base y guardar los mensajes que pasan el tope.** Adaptada: el contador va en memoria (una sola instancia), y todo mensaje que pasa la validación y el tope se guarda en `mensajes_contacto`.
- **Caché de HTML sin tope.** Resuelta de otra forma: no hay caché de HTML al lanzar. Si las métricas lo piden, se suma una caché corta y acotada de la Home.
- **CSP en report-only sin `report-uri`.** Resuelta con una CSP fija y obligatoria, probada antes del corte con las recetas y en el iPhone.
- **Cupo diario de correo compartido entre olvidos, invitaciones y contacto.** Sin efecto: el panel no manda mails y el único envío es el del formulario.
- **Que el panel exija dos admins.** Adaptada: aviso en el Inicio y recomendación en el acta, sin bloqueo.
- **CI con GitHub Actions.** A la fase 2. Dependabot sí entra.
- **Renombrar la base en `render.yaml` al restaurar.** Adaptada: `DATABASE_URL` con `sync: false` y la URL a mano, porque no está documentado que un Blueprint adopte una base creada fuera de él. El procedimiento queda escrito; el ensayo es el del export local.
