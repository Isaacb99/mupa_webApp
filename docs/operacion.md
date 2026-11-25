# Operación del sitio del MuPa

Guía para quien mantenga el sitio del Museo Paleontológico de San Juan (https://mupa.ar/) y su panel de administración (https://mupa.ar/administracion/). Explica qué es cada pieza, cómo se publica una versión nueva, qué hacer cuando algo falla y qué revisar cada mes.

- **Acá no hay contraseñas.** Cada clave vive en un solo lugar: la de la casilla de envío y la de la audioguía (`AUDIOGUIA_CLAVE`, sección 8 bis), en Render; las de las cuentas (Render, GitHub, Google, Hostinger), en el gestor de contraseñas del museo; las del panel, las elige cada persona. Quién es titular de cada cuenta y dónde están los códigos de recuperación lo dice el acta de entrega (`docs/acta-entrega.md`).
- **El detalle técnico** está en `docs/plan-panel-admin.md` (el plan, con las decisiones) y en `CLAUDE.md` (cómo está hecho cada cosa y cómo se verifica). Las herramientas de verificación, en `tools/README.md`.
- Los nombres de botones de Render son los de su panel en octubre de 2026: si cambian, el camino suele ser el mismo.

Estado de esta guía: escrita el 27/10/2026, **antes del primer deploy**. Lo marcado con *(a confirmar en el primer deploy)* se completa ese día (plan 10.1).

---

## 1. Las piezas

```
                 visitantes                          personal del museo
                     │                                       │
             https://mupa.ar/                 https://mupa.ar/administracion/
                     │                                       │
   DNS de mupa.ar (Hostinger) ──► Render: servicio web "mupa-web" (Node 24, Express)
                                   │  el sitio público (cada página se arma en el servidor)
                                   │  el panel y su API (/administracion)
                                   │  las fotos (/fotos/…)
                                   ▼
                              Render: base "mupa-db" (PostgreSQL 17)
                                   todo el contenido, las cuentas del panel, los mensajes del formulario
                                   y LAS FOTOS (van adentro de la base, no en un disco aparte)

   Formulario de contacto ──► casilla web@mupa.ar (correo de Hostinger, por SMTP) ──► la dirección de destino
```

| Pieza | Qué es | Dónde se administra |
|---|---|---|
| **Servicio web `mupa-web`** | El programa que responde todo: el sitio, el panel y las fotos. Plan Starter (0,5 CPU, 512 MB de memoria), región Virginia (Estados Unidos). Se despliega a mano desde la rama `master` de GitHub. | Render (dashboard.render.com), con la cuenta del museo |
| **Base `mupa-db`** | PostgreSQL 17, plan Basic (256 MB de memoria), 1 GB de disco. Guarda todo, también las fotos. No acepta conexiones desde afuera de Render (`ipAllowList: []`). | Render |
| **`render.yaml`** (el Blueprint) | La descripción de las dos piezas de arriba: planes, comandos y variables fijas. Render la lee **solo cuando alguien sincroniza a mano** (Blueprint → Manual Sync; Auto Sync está en No). | En el repositorio |
| **Hostinger** | El **DNS** de `mupa.ar` (a dónde apunta el dominio) y el **correo** del museo, incluida la casilla de envío del sitio, `web@mupa.ar`. Hasta 60 días después del corte, también la landing vieja. **Nunca se da de baja.** | hPanel de Hostinger, con la cuenta del museo |
| **GitHub** | El código (`master` es lo que despliega Render) y Dependabot, que propone las actualizaciones. | github.com |
| **NIC Argentina** | El registro del dominio `mupa.ar` (su titular y su vencimiento). | nic.ar |
| **Google y Bing** | Analytics 4 (`G-KX4G76DL91`: las visitas, solo en `mupa.ar`), Search Console y Bing Webmaster Tools (cómo aparece el sitio en los buscadores). | Sus paneles |
| **UserWay** | El widget de accesibilidad, si el museo lo activa (sección 11). | userway.org |
| **La audioguía** (opcional) | Las 70 pistas en `audioguias/` del repositorio, que el servicio sirve solo con el permiso de un QR, y los 13 carteles impresos (sección 8 bis). No se administra desde el panel. | El repositorio y Render (`AUDIOGUIA_CLAVE`) |

**Direcciones.** Antes del corte del dominio, el sitio nuevo se ve en `https://mupa-web.onrender.com/` (con `noindex`: los buscadores no lo indexan) y el panel en `https://mupa-web.onrender.com/administracion/` *(a confirmar en el primer deploy: si el nombre `mupa-web` está tomado, Render agrega letras al final)*. Después del corte, `https://mupa.ar/` y `https://mupa.ar/administracion/`, y la dirección de Render manda a `mupa.ar`.

**Avisos automáticos.** Render manda sus notificaciones (deploys fallidos, el servicio caído, facturas) al correo de la cuenta del museo. El Inicio del panel avisa de lo que pasa adentro del sitio (sección 7).

---

## 2. Publicar una versión nueva (deploy)

Render **no despliega solo**: cada versión se publica a mano, en un horario de poco tráfico (temprano o de noche).

**Antes**, en una PC con el repositorio:
1. `npm test` con la base de pruebas (que no diga `skipped` mayor que 0: ver `CLAUDE.md`, Verificación) y `npm run build`.
2. Si cambió algo que se ve, las recetas de `tools/` contra la producción local (`CLAUDE.md`, Verificación).
3. Subir los cambios a `master` en GitHub.

**Desplegar:** Render → servicio `mupa-web` → **Manual Deploy → Deploy latest commit**. En *Events* y *Logs* se ve cómo avanza:
1. **Build:** `npm ci --include=dev && npm run build` (el `--include=dev` hace falta: con `NODE_ENV=production`, `npm ci` saltearía Vite).
2. **Pre-deploy:** `npm run migrar`, que aplica las migraciones de la base que falten. **Si falla, el deploy se corta y sigue sirviendo la versión anterior.**
3. **Start:** `npm start`. Render espera a que `/salud` responda y recién ahí pasa el tráfico a la versión nueva (la anterior se apaga con hasta 30 s para terminar lo que estaba haciendo).

**Después:**
- `node tools/rutas-check.mjs --url https://mupa.ar/` (antes del corte, `--url https://mupa-web.onrender.com/`). Tiene que terminar en "Todo bien.". Antes del corte, mientras quede relleno o contenido de ejemplo (sección 10, T−24 h), termina igual en "Todo bien.", pero con un aviso que dice en cuántas páginas y en cuáles, y otro con cuántos comentarios «RELLENO DEL TABLERO:» quedan en `src/content.js`: no son fallas, son la lista de lo que hay que reemplazar o sacar antes del corte. Después del corte, contra `https://mupa.ar/`, el relleno es una falla.
- **Con la audioguía prendida** (sección 8 bis), lo mismo con un QR de verdad: `node tools/rutas-check.mjs --url https://mupa.ar/ --audioguia-codigo-archivo <archivo>`, con la dirección de un QR en un archivo **fuera del repositorio** (por ejemplo, el `urls.txt` de los QR: toma el de Recepción), o `--audioguia-codigo-archivo -` para pegarla sin que se vea. **Nunca la dirección en la línea de comandos** (queda en el historial de la terminal; la herramienta se niega). Recorre el QR, la página con el permiso y sin él, el primer audio (pidiendo solo un pedacito), que el borde de Render no guarde ningún audio y la versión con audiodescripción, y no escribe la dirección, el código ni el permiso en ningún lado. Sin la opción, revisa igual lo que no necesita un QR (que sin permiso la página dé 403 y no ponga cookies); con la audioguía apagada lo dice («apagada») y termina en "Todo bien.".
- Entrar al panel y mirar que el Inicio no tenga avisos nuevos.
- En *Logs*, la línea `arranque` y, si hay base, `base_ok`; con la audioguía prendida, `audioguia_prendida`.

**Volver a la versión anterior:** Render → `mupa-web` → *Deploys* → el último deploy bueno → **Rollback**. Usa lo que ya estaba construido (no vuelve a hacer el build) y tarda poco.
- **La base no vuelve atrás.** Si la versión nueva aplicó una migración, la tabla o la columna nueva queda. Las migraciones de este sitio son *aditivas* (agregan; lo que se saca se borra recién en una migración posterior: plan 3.3), así que la versión anterior funciona igual con la base nueva.
- Deshacer una migración (`npm run migrar:atras -- --confirmo-borrar-datos`, desde el Shell) **borra los datos** de lo que esa migración había creado. Solo si la migración misma es el problema, después de un export de la base (sección 5) y leyendo antes el plan 3.3.
- **Si un deploy falla por una migración "que ya existe"** (riesgo conocido, plan 3.3: la migración quedó aplicada pero no anotada): desde el Shell, `node server/db/migrar.js estado` lista las aplicadas y las pendientes. Si el esquema ya tiene lo de esa migración, se anota a mano con
  `node -e "const pg=require('pg');const c=new pg.Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query('INSERT INTO \"SequelizeMeta\" (name) VALUES (\$1)',['<archivo>.js'])).then(()=>c.end())"`
  (reemplazando `<archivo>.js` por el nombre exacto) y se vuelve a desplegar.

**Cambios del `render.yaml`:** se suben a GitHub y después Render → *Blueprints* → el Blueprint del sitio → **Manual Sync**. Las variables que dicen `sync: false` no se tocan con el sync: esas se cambian en el dashboard (sección 9).

**Otros botones del menú Manual Deploy:** *Clear build cache & deploy* (si un build falla por algo raro de la caché) y *Restart service* (reinicia sin desplegar nada nuevo).

---

## 3. Llave de emergencia: nadie puede entrar al panel

Para cuando la única cuenta de administrador olvidó su contraseña, está desactivada o esa persona ya no está. Si hay otro admin que puede entrar, **no hace falta**: desde *Usuarios* → la cuenta → **Dar contraseña temporal**.

Lo hace alguien con acceso a la cuenta de Render del museo:
1. Render → servicio `mupa-web` → **Shell**.
2. Si la cuenta ya existe:
   ```
   npm run restablecer-admin -- --email <correo de la cuenta>
   ```
   La deja activa, como administradora, sin sesiones abiertas y con una contraseña temporal nueva.
   Si hay que crear una cuenta nueva:
   ```
   npm run crear-admin -- --email <correo> --nombre "<Nombre y apellido>"
   ```
3. El comando imprime la **contraseña temporal una sola vez**, en esa terminal (no queda en los logs, ni en variables, ni en archivos). Vale **72 horas**.
4. Pasársela a la persona en persona o por teléfono, **nunca por mail ni WhatsApp**.
5. La persona entra en `https://mupa.ar/administracion/` con su correo y la temporal, y el panel le pide una contraseña nueva.
6. Cerrar el Shell. Después, desde *Usuarios*, que haya **dos administradores** (el Inicio avisa si hay uno solo).

---

## 4. La casilla de envío del formulario de contacto

El formulario de `/contacto` manda cada mensaje **desde** `web@mupa.ar` (la casilla de envío, `SMTP_USUARIO`) **a** la dirección de destino que un administrador carga en *Datos del museo*, con la dirección del visitante para responder. Todo mensaje queda además guardado 180 días en *Mensajes* del panel, aunque el mail no salga.

**Cambiar la contraseña de la casilla** (cuando se sospecha que se filtró, cuando se va alguien que la conocía, o porque Hostinger la pide):
1. La persona con acceso a hPanel cambia la contraseña de `web@mupa.ar` (Emails → la casilla → cambiar contraseña). Una frase larga que no se use en otro lado.
2. **Enseguida**, en la misma llamada: Render → `mupa-web` → *Environment* → `SMTP_CLAVE` → pegar la nueva → guardar y desplegar. Nunca se escribe en un mail, un chat ni un archivo.
3. Cuando termina el deploy: Render → `mupa-web` → **Shell** →
   ```
   npm run probar-correo -- --para <una casilla que se pueda leer>
   ```
   Tiene que terminar en "Listo: el mail de prueba salió." y el mail tiene que llegar (mirar también en spam). Si falla, dice el código y qué revisar, y termina con error:

   | Código | Qué pasa | Qué hacer |
   |---|---|---|
   | `EAUTH` | La casilla rechazó el usuario o la contraseña | Revisar `SMTP_USUARIO` y `SMTP_CLAVE` |
   | `ECONNECTION`, `ETIMEDOUT` | El servidor cortó o no contestó | Probar el otro puerto: `SMTP_PUERTO` 465 (SSL) o 587 (STARTTLS) |
   | `ESOCKET` | Falló la conexión | Revisar `SMTP_HOST` y `SMTP_PUERTO` |
   | `EDNS` | No se encontró el servidor | `SMTP_HOST` tiene que ser `smtp.hostinger.com` |
   | `ETLS` | Falló el cifrado | Con 465 va SSL; con 587, STARTTLS |
4. En el panel, el Inicio deja de mostrar el aviso del correo.

Entre el paso 1 y el 3 los mensajes del formulario no salen por correo, pero quedan en *Mensajes*: después se pueden leer ahí.

**Que no caiga en spam:** en Gmail, el mail de prueba → "Mostrar original": SPF, DKIM y DMARC tienen que decir PASS. Si no, es la configuración del correo de `mupa.ar` en Hostinger (no del sitio).

**Si Render no deja salir por ningún puerto**, ver el plan 8 ("Si Render bloquea SMTP").

Una tarea diaria (`casilla_correo`, a las 04:00 de San Juan) prueba la casilla sin mandar nada: si la contraseña dejó de andar, el Inicio lo avisa aunque nadie haya escrito.

---

## 5. Copias de seguridad y restauración

Hay **una sola cosa que copiar: la base**. Las fotos van adentro (plan 16.1), así que cada copia trae el contenido, las fotos, las cuentas y los mensajes, siempre juntos.

| Copia | Cómo | Cuánto dura | Quién |
|---|---|---|---|
| Recuperación a un punto en el tiempo (PITR) | Automática, de Render | Los últimos **3 días** (plan Hobby; 7 en Pro) | Render |
| Export mensual | Render → base `mupa-db` → *Recovery* → **Create export** → descargar el `.dir.tar.gz`, guardarlo en la carpeta del Drive del museo y **borrarlo de la PC** (de Descargas y de la papelera) | 7 días en Render; sin límite en el Drive | **El museo**, con un recordatorio mensual en su calendario |

- Un export pesa más o menos lo que la base (las fotos ya vienen comprimidas): con 800 fotos, alrededor de 1 GB.
- El archivo trae **datos personales** (los mensajes del formulario y las cuentas del panel, con sus contraseñas cifradas): guardarlo solo en el Drive del museo, con acceso restringido, y no dejar copias en la PC: después de subirlo, borrarlo de Descargas y vaciar la papelera (o, en PowerShell, `Remove-Item "$HOME\Downloads\<fecha>.dir.tar.gz"`, que no pasa por la papelera).

### 5.1 Restaurar en Render (si se borró o se rompió contenido)

**Antes de empezar, avisar al personal del museo que no cargue nada en el panel hasta que termine:** lo que se guarde después del momento elegido queda solo en la base vieja y no pasa a la nueva.

Primero, la recuperación a un punto (si pasó hace menos de 3 días). **No se ensaya contra producción.** Los pasos son los del plan 10.3, para que el Blueprint no pise la base nueva:
1. Render → `mupa-db` → *Recovery* → **Restore Database**: elegir el momento (no puede ser de los últimos 10 minutos) y el nombre `mupa-db-AAAAMMDD`. Render crea **otra base** con ese contenido; la de ahora sigue igual. Revisar que la base nueva tampoco acepte conexiones de afuera (copia la lista de IP de la original).
2. En `render.yaml`, la variable `DATABASE_URL` pasa a `{ key: DATABASE_URL, sync: false }`. Subir el cambio y **Manual Sync**: Render deja de manejar esa variable.
3. Render → `mupa-web` → *Environment* → `DATABASE_URL` → pegar la **URL interna** de la base recuperada → guardar y desplegar.
4. Comprobar **en el sitio publicado** que el contenido es el correcto (y `rutas-check`).
5. Sacar `mupa-db` del `render.yaml`, Manual Sync y **recién ahí** borrar a mano la base vieja. Si se borra antes de sacarla del yaml, el próximo sync la crea de nuevo, vacía. (Un cambio del Blueprint nunca borra nada: sacarla del yaml solo hace que Render deje de manejarla.)
6. **Volver a poner la base en el Blueprint**, para que el yaml siga diciendo cómo es todo: en `render.yaml`, la base con su nombre nuevo (`name: mupa-db-AAAAMMDD`) y lo mismo que tenía la vieja (`region: virginia`, `plan: 0.1c-256mb`, `postgresMajorVersion: "17"`, el `diskSizeGB` que tenga e `ipAllowList: []`), y `DATABASE_URL` otra vez con `fromDatabase` y ese nombre. Subir el cambio y Manual Sync: Render toma la base que ya existe (no crea otra) y le aplica lo del yaml. Comprobar que el sitio sigue mostrando el contenido.
7. **Poner esta guía al día:** donde dice `mupa-db` (secciones 1, 5, 6, 9, 13 y 14) pasa a decir `mupa-db-AAAAMMDD`, y se anota acá la fecha y el motivo de la restauración.

Si ya pasaron más de 3 días, se restaura el último export en una base nueva de Render:
1. Avisar al personal, como arriba.
2. Crear la base: Render → *New* → *Postgres*, con el nombre `mupa-db-AAAAMMDD`, **plan Basic 256 MB, región Virginia, PostgreSQL 17 y el mismo disco que la base de ahora** (1 GB, o el que diga `diskSizeGB` en `render.yaml`; sin elegirlo, Basic arranca con más disco y cuesta más).
3. **Cerrarla a internet antes de cargarle nada.** Una base nueva de Render acepta conexiones **desde cualquier dirección** (con la regla `0.0.0.0/0`, que Render pone sola: alcanzaría con la contraseña). En su *Networking*, **borrar esa regla** y agregar solo la IP de la PC desde la que se va a restaurar.
4. Restaurar con la **URL externa**, con el export descomprimido como en 5.3, pero **sin la contraseña en el comando**: PowerShell guarda cada comando que se escribe en su historial (`ConsoleHost_history.txt`), y una URL con la contraseña quedaría ahí. La URL externa (en la base, arriba a la derecha, *Connect* → *External* *(a confirmar en el primer deploy)*) tiene la forma `postgresql://<usuario>:<contraseña>@<host>/<base>`: en el comando va **sin** `:<contraseña>`, y la contraseña (lo que va entre `:` y `@`) se pega cuando PowerShell la pide, que la muestra como asteriscos y no la guarda en el historial:
   ```powershell
   $PG = 'C:\Program Files\PostgreSQL\17\bin'
   $env:PGPASSWORD = [Net.NetworkCredential]::new('', (Read-Host 'Contraseña de la base' -AsSecureString)).Password
   & "$PG\pg_restore.exe" --dbname="postgresql://<usuario>@<host>/<base>" --clean --if-exists --no-owner --no-privileges --format=directory "C:\mupa-datos\export\<fecha>\<base>"
   Remove-Item Env:PGPASSWORD
   ```
   `PGPASSWORD` vale solo en esa ventana de PowerShell y la última línea la borra (si algo falla antes, cerrar la ventana). Si la contraseña está mal, `pg_restore` termina con `password authentication failed`, sin tocar nada: volver a empezar desde la segunda línea.
5. En *Networking*, **borrar también la IP de la PC: la lista tiene que quedar vacía**, sin ninguna regla (solo los servicios de Render llegan a la base, como con `ipAllowList: []`). Volver a abrir la pantalla y comprobarlo.
6. Seguir desde el paso 2 de arriba, también con los pasos 6 y 7.

Lo que se cargó después de ese export se pierde: por eso la copia es mensual y conviene una extra antes de cambios grandes.

**Al volver una copia, vuelve todo como estaba en ese momento:** también las cuentas del panel (quien cambió su contraseña después usa la anterior, o se le da una temporal) y los mensajes. Las sesiones de ese momento ya vencieron (duran 12 horas como mucho): hay que volver a entrar.

### 5.2 El ensayo local (27/10/2026)

Antes de que exista la cuenta del museo se ensayó la copia y la restauración en una PC (plan 10.3, E5.3), con un esquema aislado de la base de desarrollo cargado por la API del panel como lo haría el museo: datos del museo, horario, tarifas (una oculta), una sala, dos muestras (una con galería), tres novedades (una actividad y un borrador) con seis fotos reales, y un mensaje del formulario. El volcado se hizo **en el formato de los exports de Render** (`pg_dump` en formato directorio, empaquetado como `<fecha>.dir.tar.gz` con la carpeta `<fecha>/<base>` adentro), se borró el esquema y se restauró con los parámetros de la guía de Render. Resultado: **77 comprobaciones, todas bien**:
- tabla por tabla, las mismas filas con el mismo contenido (md5), las secuencias en el mismo valor, las mismas 71 restricciones y 33 índices, `fotos_archivos.datos` con su `STORAGE EXTERNAL`, las 6 migraciones anotadas y ninguna pendiente;
- las 11 páginas públicas (también el sitemap y la 404 de un borrador) **iguales byte a byte**, los 30 archivos de fotos iguales (las cuatro variantes publicadas con 200 y la maestra con 404), las 8 pantallas del panel iguales (también *Mensajes*), el Inicio con el espacio, y un alta nueva sin chocar con los números restaurados;
- se entró al panel con la misma cuenta y contraseña de antes de la copia;
- `rutas-check` sin fallas sobre lo restaurado (427 comprobaciones);
- lo mismo en un PostgreSQL **vacío y descartable** (el procedimiento de 5.3), donde el dueño original de las tablas no existe: páginas, fotos y panel iguales; y después de vaciar los datos personales (5.3, paso 6), el sitio sigue andando.

Con 5 MB de base, `pg_dump` y `pg_restore` tardaron menos de un segundo cada uno. El ensayo usó un esquema propio dentro de la base de desarrollo y no el esquema `public` de un export real: **con el primer export de Render se repite 5.3 entero** (plan 10.3, E5.3) y se corrige esta guía si algo no coincide.

**Lo que apareció:**
- La guía de Render muestra el archivo como `2025-02-03T19_21Z.dir.tar.gz` y la carpeta de adentro como `2025-02-03T19:21Z/<base>`. **En Windows una carpeta no puede llevar ":"**: el `tar` de Windows (el que viene con Windows 10 y 11) descomprime igual y la deja como `2025-02-03T19_21Z`. El `pg_restore` va con `_`, como en 5.3. *(A confirmar con el primer export real: puede que la carpeta ya venga sin ":".)*
- Comparar el esquema restaurado por su texto marca 8 diferencias que no lo son: los `CHECK` con una lista de valores (`IN (…)`) vuelven escritos de otra forma equivalente. En el ensayo se comprobó que siguen rechazando lo que no admiten.
- `--no-owner --no-privileges` son necesarios: el usuario dueño de las tablas en Render no existe en otra base.

Los scripts del ensayo quedaron en `tools/salida/e5-prep/` (no se versionan: `ensayo.mjs`).

### 5.3 Revisar un export en una PC (o restaurarlo para trabajar)

Sirve para comprobar que el export del mes se abre, o para tener una copia de producción en una PC. Se usa un PostgreSQL **descartable**, creado para la ocasión: no necesita la contraseña de ningún PostgreSQL instalado ni lo toca. Con PostgreSQL 17 instalado (sus programas en `C:\Program Files\PostgreSQL\17\bin`), en PowerShell, **fuera de OneDrive** (los datos de una base no se sincronizan):

```powershell
$PG = 'C:\Program Files\PostgreSQL\17\bin'
mkdir C:\mupa-datos\export
# El tar de Windows, con la ruta entera (si hay otro tar en el PATH, como el de Git, falla con "C:").
& "$env:SystemRoot\System32\tar.exe" -xzf "$HOME\Downloads\2026-11-01T10_00Z.dir.tar.gz" -C C:\mupa-datos\export
# La carpeta de la fecha (con "_") y, adentro, la de la base: su nombre es el que va en <base> más abajo.
Get-ChildItem C:\mupa-datos\export -Directory -Recurse -Depth 1 | Select-Object FullName

# 1. Un PostgreSQL vacío, solo en esta PC (127.0.0.1) y solo mientras dure la revisión.
& "$PG\initdb.exe" -D C:\mupa-datos\cluster -U restaurar --auth=trust --encoding=UTF8 --no-locale
& "$PG\pg_ctl.exe" -D C:\mupa-datos\cluster -o "-p 5433 -c listen_addresses=127.0.0.1" -l C:\mupa-datos\cluster\log.txt -w start
& "$PG\createdb.exe" -h 127.0.0.1 -p 5433 -U restaurar mupa_restaurada

# 2. La copia (los mismos parámetros que la guía de Render).
& "$PG\pg_restore.exe" -h 127.0.0.1 -p 5433 -U restaurar --dbname=mupa_restaurada --clean --if-exists --no-owner --no-privileges --format=directory "C:\mupa-datos\export\2026-11-01T10_00Z\<base>"
```

3. Para verla con el sitio, desde la carpeta del repositorio, después de `npm run build`, en PowerShell:
   ```powershell
   $env:DATABASE_URL='postgres://restaurar@127.0.0.1:5433/mupa_restaurada'; $env:NODE_ENV='production'; $env:PORT='5183'
   $env:URL_PUBLICA='http://localhost:5183/'; $env:CORREO_MODO='smtp'
   node server/servidor.js
   ```
   (en bash, las mismas variables delante de `node server/servidor.js`). Con `node server/servidor.js`, y no `npm start`, el `.env` de la PC no se lee: un `SIN_BASE` de ahí (que mostraría el museo de ejemplo en vez de la copia) o un `CORREO_MODO=consola` (con el que en producción no arranca) no se mezclan. Abrir **`http://127.0.0.1:5183/`** (no `localhost`): como no es el host de `URL_PUBLICA`, la copia sale con `noindex` y **sin Google Analytics** (abierta con el host de `URL_PUBLICA`, cada revisión sumaría visitas a las estadísticas del museo). Las páginas, las fotos y el sitemap tienen que mostrar el contenido del museo; `node tools/rutas-check.mjs --url http://127.0.0.1:5183/ --canonica http://localhost:5183/` tiene que terminar en "Todo bien." (con un aviso por la compresión, que en local no hay). Al terminar, cerrar esa ventana de PowerShell: las variables quedan puestas mientras esté abierta.
4. Para ver el panel de la copia (en `http://127.0.0.1:5183/administracion/`), una cuenta propia: `DATABASE_URL=postgres://restaurar@127.0.0.1:5433/mupa_restaurada npm run crear-admin -- --email <correo> --nombre "<nombre>"` (en PowerShell, `$env:DATABASE_URL=…` antes, como en el paso 3).
5. Si la copia se va a usar para trabajar (no solo para revisarla), **sin datos personales** (plan 2.5):
   ```powershell
   & "$PG\psql.exe" -h 127.0.0.1 -p 5433 -U restaurar -d mupa_restaurada -v ON_ERROR_STOP=1 -c "TRUNCATE sesiones, mensajes_contacto; DELETE FROM usuarios; UPDATE museo SET email_destino_contacto = NULL;"
   ```
6. Al terminar, se apaga y se borra todo, también el export descargado (ya quedó en el Drive del museo):
   ```powershell
   & "$PG\pg_ctl.exe" -D C:\mupa-datos\cluster -m fast -w stop
   Remove-Item -Recurse -Force C:\mupa-datos
   Remove-Item "$HOME\Downloads\2026-11-01T10_00Z.dir.tar.gz"
   ```

---

## 6. El espacio de la base

Las fotos son lo que más ocupa: **alrededor de 1 MB por foto** (cada una se guarda en cinco tamaños). Con el disco de **1 GB** entran unas 800 antes del aviso.

- **El Inicio del panel avisa desde el 80 %** ("La base de datos se está llenando"). Compara lo que ocupa la base con `ESPACIO_BASE_MB`, que tiene que ser **el disco de la base en MB**: 1024 con 1 GB, 5120 con 5 GB, 10240 con 10 GB.
- **Si se llena, Render suspende la base** (su guía: la base pasa a *unhealthy* y Render la suspende para no perder datos). Mientras tanto **casi todo el sitio deja de andar**: solo la portada y las páginas de El Museo, Divulgación, Educación y Circuitos siguen saliendo (la portada y Divulgación, sin el carrusel de Novedades ni sus «Últimas noticias»), con los datos del museo que el servicio tenía en memoria; las demás páginas y el sitemap dan "no disponible", y las fotos también, salvo las que el servicio ya tenía en memoria, y el panel no anda (ni siquiera para entrar a borrar fotos: al entrar, o en cualquier pantalla, dice "Algo salió mal. Probá de nuevo en unos minutos."). **No vuelve solo:** hay que reanudar la base y agrandar el disco enseguida (el punto que sigue). Por eso el aviso del 80 % no se deja para después: el de "llena" puede no llegar a verse nunca, porque con la base suspendida el panel no carga.
- **Si la base quedó suspendida por el disco lleno**, los pasos de la guía de Render ([postgresql-creating-connecting](https://render.com/docs/postgresql-creating-connecting), "Running out of storage", 27/10/2026), en este orden y sin pausas:
  1. Render → `mupa-db` → *Info* → al pie de la página, **Resume Database** *(a confirmar en el primer deploy; el botón aparece solo con la base suspendida)*.
  2. Esperar uno o dos minutos, a que termine de reanudarse.
  3. **Enseguida**, agrandar el disco (el punto que sigue). Render avisa que si se espera demasiado después de reanudarla, la vuelve a suspender ("If you wait too long after resuming, Render will suspend your database again"). **Si la vuelve a suspender, repetir desde el paso 1** y agrandar el disco apenas termine de reanudarse.
  4. En unos minutos la base vuelve a estar sana. Comprobar `https://mupa.ar/salud/base` (tiene que decir `"base":"ok"`), una página interna y el Inicio del panel; el servicio vuelve a conectarse solo, sin desplegar nada (en una PC, con la base apagada y vuelta a prender, tardó unos segundos; si no vuelve, *Manual Deploy* → *Restart service*). Después, lo de "Cada vez que cambia el disco", más abajo.

  *(A confirmar la primera vez que haga falta: cómo muestra Render la base suspendida, si con la base suspendida se puede agrandar el disco antes del Resume —la guía no lo dice: sus pasos reanudan primero— y cuánto es "demasiado" entre los pasos 1 y 3.)*
- **Agrandar el disco:** Render → `mupa-db` → *Plan* → *Storage* → *Edit*. Va de 1 GB a múltiplos de 5 GB, **nunca se puede achicar** y, después de agrandarlo, hay que esperar 6 horas para volver a hacerlo. El lugar nuevo está disponible en uno o dos minutos. Cuesta un poco más por mes (ver *Billing*).
- **Crecimiento automático** (opcional, en la misma pantalla *Plan*): cuando la base llega al 90 %, Render la agranda un 50 % redondeado a múltiplos de 5 GB (de 1 a 5 GB). No viene prendido. **Se decide en la entrega y queda escrito en el acta:** prendido, la base no se suspende por el disco, pero crece (y cuesta un poco más) sin que nadie lo note, y hay que hacer igual lo de abajo; apagado, el aviso del 80 % del Inicio es la única alarma, y alguien tiene que verlo y agrandar el disco a tiempo (con fotos de ~1 MB, entre el 80 % y el 100 % de 1 GB entran unas 200).
- **Cada vez que cambia el disco** (a mano o solo), cambiar **las dos cosas juntas** en `render.yaml`: `diskSizeGB` de la base y `ESPACIO_BASE_MB` del servicio (GB × 1024). Subir el cambio a GitHub y Manual Sync. Si no, el aviso del Inicio mide contra el tamaño viejo y el yaml dice un disco más chico que el real.

---

## 7. Los avisos del Inicio del panel

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| **La base de datos se está llenando** | Ocupa entre el 80 % y el 99 % de `ESPACIO_BASE_MB` | Agrandar el disco ya (sección 6): llena, Render suspende la base y casi todo el sitio deja de andar. Mientras tanto, se gana lugar quitando de sus fichas las fotos que ya no hagan falta (una foto que ninguna ficha usa se borra sola). El número del aviso puede no bajar: PostgreSQL se queda con ese lugar y lo reusa para lo que se cargue después |
| **La base de datos está llena** | Ocupa el 100 % (o más) de `ESPACIO_BASE_MB` | Sección 6, enseguida. Con la base llena Render la suspende y el panel no carga, así que este aviso puede no llegar a verse: el que importa es el anterior. Si se ve y el sitio anda, revisar que `ESPACIO_BASE_MB` sea el disco real (sección 6, "Cada vez que cambia el disco") |
| **Los mensajes del formulario de contacto no se están enviando por correo** (con un código) | La casilla de envío falló en su última prueba o envío. Los mensajes se guardan igual en *Mensajes* | Sección 4: casi siempre es `EAUTH` (cambió la contraseña de `web@mupa.ar` y no se actualizó `SMTP_CLAVE`) |
| **Un mensaje / N mensajes del formulario no salieron por correo** | Un problema momentáneo del sitio (la base tardó), no de la casilla | Leerlos en *Mensajes*. Si se repite seguido, mirar los Logs (`contacto_sin_base`, `contacto_no_guardado`, `salud_base`), `https://mupa.ar/salud/base` y el estado de la base en Render |
| **Una tarea automática del sitio está fallando** | Una de las tareas diarias de las 04:00 (borrar sesiones vencidas, fotos subidas que no se usan, mensajes de más de 180 días) falló | En Logs, buscar `tarea_fallida` (dice la tarea y el código). El sitio sigue andando; si sigue al otro día, revisar la base |
| **Hay un solo administrador** | Si esa cuenta no puede entrar, nadie puede dar contraseñas temporales | Hacer administradora a otra persona en *Usuarios* |
| **Para completar** (la lista) | Datos del museo que faltan (dirección, teléfono, correos y el horario; desde el 03/11/2026 ya no pide las tarifas, que el sitio no muestra) | Cargarlos: lo que no está cargado no se muestra en el sitio. Si el horario aparece acá, ningún día está marcado como abierto y la página de Visitas no lo muestra (para un cierre temporal, el manual, sección 13) |

---

## 8. Retirar una foto con urgencia

Por ejemplo, una foto con una persona que pidió que la saquen.

1. **En el panel, sacar la foto de todas las fichas que la usan:** cambiar la portada por otra o quitarla de la galería, y **Guardar**. Cuando ninguna ficha la usa, la foto se borra de la base en ese momento (con sus cinco tamaños). Despublicar la ficha esconde la página, **pero no borra la foto**: su dirección sigue andando mientras alguna ficha la tenga.
2. **Vaciar la caché de Render:** las fotos se sirven con una caché de un año en el borde de Render. Render → `mupa-web` → *Settings* → *Edge Caching* → **Purge cache**. Vacía todo (el sitio sigue andando; por un rato llegan más pedidos al servicio).
3. **Comprobar:** la dirección de la foto (clic derecho sobre la imagen → copiar la dirección: `https://mupa.ar/fotos/<clave>/960.webp`) tiene que dar "No encontrado". Probar también `480.webp`, `1600.webp` y `og.jpg` con la misma clave.
4. **Lo que queda fuera de nuestro alcance:** los navegadores de quienes ya la vieron la tienen guardada hasta que la limpien, y una red social o un buscador pueden mostrar una vista previa vieja. Para Google: Search Console → *Removals* (*Retiradas*).

---

## 8 bis. La audioguía

*(Sección nueva del 24/11/2026; va con «bis» para no correr los números de las secciones que siguen, que se citan en otros documentos.)* Es un **módulo opcional**: la visita autoguiada del museo («EXPERIENCIA MUPA 2026»), con **35 estaciones en 12 espacios** (los del plano de la portada, más Recepción, que va al principio y al final del recorrido), cada una en **dos versiones**, la común y una con audiodescripción para personas ciegas o con baja visión: **70 pistas**. Se escucha en `https://mupa.ar/audioguia` **solo con el permiso de un QR**: hay un cartel por espacio (12) y una tarjeta para el mostrador de recepción que abre directo la versión con audiodescripción (13 en total). **Cualquier QR válido habilita todas las estaciones, en las dos versiones, hasta la medianoche de San Juan**; después hay que volver a escanear. No tiene horario, no mira la base, no se administra desde el panel y no tiene modo sin conexión (necesita señal: un recorrido completo baja de 21 a 29 MB de datos móviles). La especificación completa no está en el repositorio (`tools/salida/audioguias/prep/spec.md`, en la PC de quien mantiene el código); lo que sigue es lo que hace falta para operarla.

**Hoy está apagada:** en Render no está `AUDIOGUIA_CLAVE` y `audioguias/` tiene solo el manifiesto (`pistas.json`, con las 35 estaciones, ninguna grabada y 9 con un título provisorio). Apagada, el sitio responde igual que sin el módulo: sus direcciones dan la página "no encontrada" del sitio y no se pone ninguna cookie.

**Las piezas:**
- **`audioguias/`**, en la raíz del repositorio (no en `public/`: lo de `public/` lo puede bajar cualquiera, sin QR): `pistas.json` (la **versión de los códigos** y el recorrido: los espacios y sus estaciones, con los títulos del guion del museo, tal cual) y, por cada estación aprobada, cuatro archivos con su número en dos cifras: `07.mp3`, `07-ad.mp3`, `07.txt` y `07-ad.txt` (las dos versiones y sus transcripciones). El servicio los sirve desde el disco solo con el permiso del día; nunca pasan por la base ni por la caché del borde.
- **`AUDIOGUIA_CLAVE`**, en Render (sección 9): el secreto con que se firman los códigos de los QR y el permiso de cada día. **Vive solo en Render** (*Environment*): no se copia a ninguna PC ni a ningún documento. El acta dice dónde está, nunca el valor.
- **`npm run audioguia-urls`**, que corre **en el Shell de Render** (donde está la clave) y arma las direcciones firmadas de los QR, y **`tools/audioguia-qr.mjs`**, que corre en una PC **sin la clave** y arma con esas direcciones los SVG y los PDF para imprimir.

### Prenderla

1. Las grabaciones aprobadas en `audioguias/` (abajo, «Cargar o reemplazar una tanda»). **Sin ninguna estación grabada queda apagada aunque esté la clave** (el log dice `audioguia_sin_grabar` y `audioguia_sin_pistas`).
2. Render → servicio `mupa-web` → **Shell**: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Copiar lo que imprime **directo** a *Environment* → `AUDIOGUIA_CLAVE` (sin espacios ni comillas; los espacios de los bordes se sacan solos) y guardar: Render vuelve a desplegar. La clave **tiene que quedar igual entre deploys**: cambiarla anula todos los QR.
3. En *Logs*, la línea `audioguia_prendida` con cuántos espacios y estaciones quedaron y cuántas se saltearon. Si dice `audioguia_clave_invalida`, la clave quedó mal pegada (la audioguía sigue apagada y el resto del sitio anda: volver al paso 2). Si dice `audioguia_limite_global`, `TRUST_PROXY` está en 0 y el límite del audio sería uno solo para todo el museo: corregirlo (sección 9) antes de usarla.
4. Las direcciones de los QR y la comprobación de punta a punta (abajo, «Los QR», y sección 2).

**Apagarla:** dejar `AUDIOGUIA_CLAVE` vacía (Render vuelve a desplegar). Los QR impresos dejan de andar (llevan a la página "no encontrada"); si después se vuelve a poner **la misma** clave, vuelven a andar. *(Esa página "no encontrada" se mide en Google Analytics como `/audioguia`, sin el código del QR ni el resto de la dirección.)*

### Cargar o reemplazar una tanda de audios

Los audios los graba gente de afuera y los cargamos nosotros; el museo no los administra. Los másters (WAV) **nunca entran al repositorio** (`.gitignore` los ignora y `npm test` falla si hay en `audioguias/` cualquier archivo que el manifiesto no explica).
1. **Codificar** cada máster **una sola vez** a MP3 **CBR, 64 kbps, mono, 44,1 kHz** (una pista con mucha música puede ir a 80 kbps, declarado en su estación con `kbps: 80`, o `kbpsAd` en la versión con audiodescripción), de 20 s a 5 minutos y de 3 MB como mucho. La herramienta prevista para esto, `tools/audioguia-mp3.mjs` (con ffmpeg), **todavía no existe** (24/11/2026), y ffmpeg no está instalado en la PC de desarrollo. Lo que se codifica para escuchar va a `tools/salida/audioguias/mp3/`, que no se versiona.
2. **Escuchar cada una entera** contra su guion y anotar lo que no va (con el número y el minuto: vuelve a quienes grabaron).
3. Las **aprobadas**, con sus dos transcripciones (UTF-8, párrafos separados por una línea en blanco; un sonido que cuenta algo, entre corchetes: «[Música]»), a `audioguias/`, con sus cuatro archivos por estación. **No se toca `version`.**
4. `npm test`: valida el manifiesto, los títulos contra el guion, que cada estación tenga sus cuatro archivos o ninguno (una estación a medias, un archivo de más o un MP3 que no es como se pidió hacen fallar la prueba) y deja un resumen con cuántas estaciones y cuántos MB.
5. **Un commit por tanda aprobada** (no uno por pista ni por ronda de arreglos), Manual Deploy (sección 2) y, después, la comprobación de la sección 2 con un QR.

**Que el historial del repositorio no engorde:** git guarda entera cada versión de un MP3. Nunca se commitea uno de prueba; un reemplazo después de publicado cuesta su tamaño (de 0,5 a 1 MB; diez reemplazos, unos 8 MB: se acepta); reemplazarlas todas (otra locución) son otros 42 a 55 MB, y conviene preguntarlo antes. Si se commiteó algo de más y todavía no se subió a GitHub, se saca de ese commit antes de subirlo. Las 70 pistas pesan de 42 a 55 MB en total; no se usa Git LFS.

Una estación que no se puede leer al arrancar (un MP3 roto o distinto de lo que declara el manifiesto, una transcripción vacía) se saltea entera, con sus dos versiones, y el log dice `audioguia_pista_invalida` con el número; el resto sigue andando. Una que no tiene ninguno de sus cuatro archivos todavía cuenta como «sin grabar» (`audioguia_sin_grabar`, con cuántas) y no se muestra.

### Los QR

1. Render → `mupa-web` → **Shell**: `npm run audioguia-urls -- --url https://mupa.ar/`. Imprime 12 renglones, uno por espacio (Recepción una sola vez), con el nombre del espacio y su dirección. **Se niega** (sale con 1 y dice por qué) si falta la clave, si alguna estación tiene un título provisorio, si alguna está salteada o sin grabar: no se imprimen carteles definitivos incompletos.
2. Copiar esos 12 renglones a la PC, a `tools/salida/audioguias/qr/urls.txt` (no se versiona). **Esas direcciones valen lo mismo que los QR impresos:** no van por mail, chat ni documentos.
3. En la PC: `node tools/audioguia-qr.mjs --urls tools/salida/audioguias/qr/urls.txt --salida tools/salida/audioguias/qr`. Suma sola la 13.ª (Recepción con audiodescripción) y deja un SVG y un PDF por cartel, `todos.pdf` (los 13 juntos, para mandar a imprimir) y `prueba.pdf` (la hoja de prueba, en dos A4). Comprueba los PDF antes de escribirlos (que sean vectoriales, del tamaño pedido y con el código que corresponde).
4. **Imprimir al 100 %** («Tamaño real», nunca «Ajustar a la página»): cada PDF trae al pie una regla de 5 cm para comprobarlo con una regla de verdad. Los 12 carteles, en A5 vertical, con el código a 10 cm; la tarjeta del mostrador, en A6, a 7 cm, para laminar. Siempre negro sobre blanco y sin nada adentro del margen blanco del código. Recomendación para el museo: laminado mate, con el centro a 1,20 m del piso, en el mismo lugar en cada puerta. La tarjeta de audiodescripción **no es un cartel de pared**: la escanea el personal con el teléfono de la visita.
5. **La hoja de prueba**, antes de entregar: imprimirla al 100 % y escanearla con **2 o 3 teléfonos** (un iPhone y un Android al menos, con la cámara común). Pasa si el de 10 cm se lee a 1 m con todos y el de 4 cm de cerca. Si a 1 m no lee, se rearman a 12 cm (`--cm 12`) y se vuelve a probar. Después, los 13 uno por uno con un teléfono.

**Antes del corte** las direcciones se arman con `--url https://mupa-web.onrender.com/` (y la versión 1 de los códigos): sirven para probar y pueden andar por WhatsApp, porque van a morir. **Se imprime después del corte del dominio** (antes, `mupa.ar` es la landing de Hostinger): con `"version": 2` en `audioguias/pistas.json`, commit, Manual Deploy, `npm run audioguia-urls -- --url https://mupa.ar/`, los PDF, **la hoja de prueba otra vez con el código definitivo y los mismos teléfonos**, y recién ahí los 13 carteles.

### Cambiar los códigos (y si un QR se filtra)

Se sube `version` en `audioguias/pistas.json` (un entero de 1 a 999; **nunca baja**), commit y Manual Deploy: **mueren a la vez los 13 QR y todos los permisos del día**. Después, las direcciones nuevas (paso 1 de «Los QR») y **reimprimir los 13**. Cambiar `AUDIOGUIA_CLAVE` hace lo mismo; si la clave se pierde (o se filtra), se genera otra y se reimprimen. **Cuándo:** si se filtra un QR (una foto en una red social, un chat) y una vez antes de imprimir (la versión 2).

**Lo que este control no garantiza:** cualquiera que haya tenido un QR (una foto, el historial del teléfono) puede abrir la audioguía cualquier día y desde cualquier lado, hasta que se suba la versión; quien entra puede bajar los MP3 y compartirlos; y no hay contadores: la única señal de un abuso es el tráfico de salida en Render (sección 13). La respuesta es siempre la misma: subir la versión y reimprimir. La audioguía tampoco guía a una persona ciega por el edificio: le da las estaciones en orden, pero llegar de un espacio al siguiente es del museo (acompañamiento y personal de sala).

**Las cookies:** la audioguía pone dos, propias, sin datos personales, las dos solo en `/audioguia`: el permiso del día (`__Secure-mupa_audioguia`, que vence a la medianoche) y la preferencia de la versión (`mupa_audioguia_version`, `ad` o `comun`, 180 días). Las tiene que nombrar el texto de privacidad del museo. Si el navegador las bloquea, la página lo explica.

---

## 9. Las variables del servicio

Se ven en Render → `mupa-web` → *Environment*. Las que en la tabla dicen **yaml** están escritas en `render.yaml`: se cambian ahí, con un commit y Manual Sync (si se cambian en el dashboard, el próximo sync las vuelve a poner como en el yaml). Las que dicen **dashboard** (`sync: false`) se cargan en el dashboard y el sync no las toca. Al guardar una variable, Render vuelve a desplegar. El servicio comprueba todas al arrancar (`server/config.js`): si una está mal, no arranca y el log dice cuál (nunca su valor).

| Variable | Qué es | Valor en Render | Dónde | Cuándo cambia |
|---|---|---|---|---|
| `NODE_ENV` | Modo de producción | `production` | yaml | Nunca |
| `DATABASE_URL` | La base (URL interna, sin salir de Render) | La pone Render desde `mupa-db` | yaml (`fromDatabase`) | Al restaurar en otra base (5.1) |
| `URL_PUBLICA` | La dirección pública: canonical, sitemap, redes, cookies | `https://mupa.ar/` | yaml | Nunca (ya antes del corte apunta a `mupa.ar`) |
| `ESPACIO_BASE_MB` | El disco de la base, para el aviso del Inicio | `1024` | yaml | Con el disco (sección 6) |
| `CORREO_MODO` | Cómo sale el correo del formulario | `smtp` (en producción no arranca con otro) | yaml | Nunca |
| `SMTP_HOST` | El servidor de correo | `smtp.hostinger.com` | yaml | Si el correo se va de Hostinger |
| `SMTP_PUERTO` | El puerto del servidor de correo | `465` (o `587` si 465 no conecta) | dashboard | Si `probar-correo` da `ETIMEDOUT` o `ECONNECTION` |
| `SMTP_USUARIO` | La casilla de envío, que también es el remitente | `web@mupa.ar` | dashboard | Si cambia la casilla. Vacía: el formulario no se muestra |
| `SMTP_CLAVE` | La contraseña de la casilla de envío | (solo en Render) | dashboard | Cada vez que cambia la contraseña de la casilla (sección 4) |
| `CANONICO` | Si los otros dominios redirigen a `mupa.ar` | `0` hasta el corte; `1` desde el corte | dashboard | El día del corte (y `0` si se vuelve atrás) |
| `TRUST_PROXY` | Cuántos proxys hay delante (para saber la IP real de quien entra: los límites de intentos del panel) | El número que dé la prueba del primer deploy *(a confirmar)* | dashboard | Solo si Render cambia su red; con `0`, el arranque avisa `trust_proxy_cero` en el log |
| `USERWAY_ID` | El widget de accesibilidad | Vacía hasta que el museo pase el ID | dashboard | Sección 11 |
| `INDEXNOW_CLAVE` | Avisarle a Bing de lo que se publica (opcional) | Vacía, o una clave elegida | dashboard | Después del corte, si se quiere (sección 11). Antes del corte no avisa aunque esté cargada |
| `AUDIOGUIA_CLAVE` | El secreto de los QR de la audioguía y del permiso de cada día (sección 8 bis) | Vacía hasta que haya grabaciones; después, la que se genera en el Shell (8 bis, «Prenderla»). Vacía: la audioguía apagada | dashboard | Solo para anular todos los QR (8 bis, «Cambiar los códigos»): cambiarla obliga a reimprimir los 13. Mal pegada, el sitio arranca igual con la audioguía apagada y el log dice `audioguia_clave_invalida` (nunca su valor) |
| `DEPURAR_IP` | Muestra `/salud/ip`, para ajustar `TRUST_PROXY` | No se carga | dashboard | Solo durante la prueba del primer deploy (plan 10.1, paso 4); después se borra |
| `PORT`, `RENDER`, `RENDER_EXTERNAL_URL` | El puerto, que es Render y su dirección `…onrender.com` (que se acepta antes del corte) | Las pone Render | — | No se tocan |

**Nunca en Render:** `SIN_BASE` (el museo de ejemplo: el servicio se niega a arrancar con ella), `DATABASE_URL_TEST`, `DB_SSL` (solo desde una PC contra la URL externa), `DIR_BUILD`, `DIR_AUDIOGUIAS` (la carpeta de la audioguía: en Render, la de siempre, `audioguias/`) y `HOST`. Todas están explicadas en `.env.example`.

---

## 10. El corte del dominio (resumen)

El paso a paso, con los valores exactos y lo que verifica quien mantiene el sitio en cada momento, está en el **plan 11.2**. En corto:
- **Quién:** una persona del museo con acceso a hPanel (el DNS está en Hostinger) y quien mantiene el sitio, en videollamada. Un día hábil temprano.
- **T−48 h:** confirmación escrita del contenido; se guarda la zona DNS completa abajo (10.1) y el vencimiento del certificado de Hostinger (hasta ahí se puede volver atrás).
- **T−24 h, antes de tocar el DNS: que no quede relleno** (quien mantiene el sitio). `node tools/rutas-check.mjs --url https://mupa-web.onrender.com/ --relleno falla`, corrido desde la misma copia del repositorio que está desplegada, tiene que terminar en "Todo bien.". Antes del corte, sin `--relleno falla`, el relleno y el contenido de ejemplo son solo un aviso; con ella, cada página que los tiene es una falla (`MAL <ruta>: sin marcas de relleno ni de contenido de ejemplo — …`, con las marcas que encontró) y la herramienta sale con código 1. **Si falla, no se corta:** lo que va entre corchetes («[—]», «[Nombre del integrante]», «[Rol]», «[Título pendiente]») se reemplaza con lo que mandó el museo, o se saca, en `src/content.js` (cada hueco tiene al lado su comentario «RELLENO DEL TABLERO:») y se despliega (sección 2); lo que empieza con «EJEMPLO ·» o «PRUEBA ·» se cambia o se elimina en el panel. Después se corre otra vez, hasta "Todo bien."; si no da el tiempo, el corte se pasa a otro día. Ojo: "Todo bien." quiere decir «sin esas marcas», no «sin relleno». El relleno sin marca (los textos copiados del tablero, las fotos) no se ve en el HTML: la herramienta avisa cuántos comentarios «RELLENO DEL TABLERO:» quedan en `src/content.js` (23 al 18/11/2026) y no falla por ellos. Ese número tiene que llegar al corte en 0, o con lo que quede aceptado en la confirmación escrita de T−48 h. Si un contenido real da una falla falsa (una novedad que empieza con «Prueba ·», un texto con «[Rol]»), se le cambia el texto en el panel (por ejemplo, «Prueba: …»).
- **T−24 h:** en Render, *Settings → Custom Domains*: agregar `mupa.ar` y `www.mupa.ar` (mandan los registros que muestre Render). En hPanel, la persona del museo **primero saca una captura de pantalla de la tabla de registros DNS, antes de tocar nada** (es la que se usa para volver atrás), y después baja a 300 el TTL del `A` y el `AAAA` de `@` y del `CNAME` de `www`, **sin cambiar valores**.
- **Día D:** `A @` → `216.24.57.1`; borrar el `AAAA @`; `www` → `CNAME mupa-web.onrender.com`. Verify en Render y esperar los certificados. `CANONICO=1`. Verificar con `node tools/rutas-check.mjs --url https://mupa.ar/` (revisa también que `http://`, `www` y `onrender.com` manden a `mupa.ar`, y contra `mupa.ar` el relleno ya es una falla sin pedirlo), un envío del formulario, el panel en `https://mupa.ar/administracion/` y GA4 en Tiempo real. **Y el correo del museo, que `rutas-check` no mira** (es lo único que un error en hPanel rompe sin que el sitio lo note): `Resolve-DnsName mupa.ar -Type MX -Server 8.8.8.8` sigue dando `mx1` y `mx2.hostinger.com`, y llegan un mail mandado a la casilla del museo y otro mandado desde ella. La persona del museo sigue en la llamada hasta que todo eso esté confirmado. Search Console y Bing: enviar `sitemap.xml`.
- **Nunca se tocan** el MX, los TXT que ya existen (SPF y otros), `_dmarc`, `hostingermail-a._domainkey`, `autodiscover` ni `autoconfig`. **Nunca se usa "Reset DNS Records" en hPanel**: devuelve el sitio a Hostinger.
- **Volver atrás:** los valores anteriores en hPanel (la captura de T−24 h) y `CANONICO=0`. La landing sigue en Hostinger.
- **A los 14 días, si todo anda:** HSTS de 1 día a 180 (un commit en `server/seguridad.js`, `cabecerasComunes`) y, si se quiere, el TTL de vuelta a 3600. Después: borrar `tools/prerender.mjs`, `build:preview` y los `.htaccess` de `public/`, y archivar la rama `landing`. La landing de Hostinger se conserva 60 días.

### 10.1 Zona DNS de `mupa.ar`

*Se completa en T−48 h, leída con `Resolve-DnsName <nombre> -Type <tipo> -Server 8.8.8.8` para `@`, `www`, `_dmarc`, `hostingermail-a._domainkey`, `autodiscover` y `autoconfig`.* Lo leído el 08/10/2026:

| Nombre | Tipo | Valor antes del corte | Valor después del corte |
|---|---|---|---|
| `@` | A | `212.85.9.20` | `216.24.57.1` (o lo que muestre Render) |
| `@` | AAAA | `2a02:4780:13:820:0:b30:3a8a:7` | (borrado) |
| `www` | CNAME | `mupa.ar` | `mupa-web.onrender.com` |
| `@` | MX | `mx1.hostinger.com`, `mx2.hostinger.com` | sin cambios |
| `@` | TXT (SPF) | `v=spf1 include:_spf.mail.hostinger.com ~all` | sin cambios |
| `_dmarc`, `hostingermail-a._domainkey`, `autodiscover`, `autoconfig` | — | *(completar en T−48 h)* | sin cambios |

Vencimiento del certificado de Hostinger (límite para volver atrás): *(completar en T−48 h)*.

---

## 11. IndexNow y UserWay

**IndexNow** (opcional): cuando se publica, se cambia o se despublica algo, el sitio le avisa a Bing (y a los buscadores que usan IndexNow) qué páginas cambiaron. Solo funciona en producción, con el dominio `mupa.ar` y **desde el corte** (`CANONICO=1`): antes del corte `mupa.ar` todavía es la landing de Hostinger, que no tiene esas páginas ni el archivo de la clave, así que el sitio no avisa nada aunque la clave esté cargada (y si se vuelve atrás el corte, deja de avisar).
- **Prender (después del corte, desde el día siguiente):** elegir una clave (de 8 a 128 letras, números o guiones; por ejemplo, la salida de `node -e "console.log(crypto.randomUUID())"`) y cargarla en `INDEXNOW_CLAVE`. Después del deploy, `https://mupa.ar/<clave>.txt` tiene que mostrar la clave. Al publicar algo, en Logs aparece `indexnow`; en Bing Webmaster Tools, la sección IndexNow muestra lo recibido.
- **Apagar:** dejar `INDEXNOW_CLAVE` vacía.

**UserWay** (el widget de accesibilidad): sin `USERWAY_ID` no se carga nada de UserWay.
- **Prender:** cargar en `USERWAY_ID` el ID de la cuenta de UserWay del museo. El sitio suma solo los dominios de UserWay a su política de seguridad (CSP).
- **Comprobar la primera vez** (plan 6.6): la consola del navegador sin violaciones de CSP (`node tools/vitals.mjs --url https://mupa.ar/ --consola`: las listas `consola` y `csp` vacías), que el widget no tape el header de la portada (los botones «Tickets» y «Menú»), la franja de accesos ni las flechas «Anterior» y «Siguiente» del carrusel de Novedades (en la portada y en Divulgación: desde el 16/11/2026 van sobre las fotos, una a cada costado de la fila, y «Siguiente» queda del lado donde suele ir el botón de UserWay), ni, en el teléfono, el «Mapa del Museo» de la portada con una sala tocada (desde el 17/11/2026, tocar una sala la pinta de bordó y muestra su nombre en una etiqueta arriba o abajo de ella), y que la página no salte al cargar (CLS 0). Con la audioguía prendida (8 bis), además, que el botón de UserWay no tape en `/audioguia` los reproductores, el enlace «Cambiar a la versión…» ni «Ir a…», en ningún ancho, y que la prueba con VoiceOver y TalkBack se repita con UserWay prendido (sus superpuestos pueden chocar con un lector de pantalla; si chocan, `/audioguia` se deja sin UserWay: lo decide quien mantiene el código). Si la consola muestra un dominio de UserWay bloqueado, se suma en `server/seguridad.js` (`USERWAY`).

---

## 12. Search Console, Bing y Analytics

- **Search Console:** la propiedad `https://mupa.ar/` se verifica con el archivo `public/google19017c966a32aec2.html`, que **tiene que seguir en el repositorio y respondiendo 200** (Google lo vuelve a consultar; `rutas-check` lo revisa). Opcional, después del corte: la propiedad de dominio, con un TXT **nuevo** `google-site-verification=…` en hPanel (no se edita el TXT del SPF). Después del corte: enviar `https://mupa.ar/sitemap.xml` e inspeccionar la portada y dos páginas internas.
- **Bing Webmaster Tools:** el sitio se importó desde Search Console. Enviar el sitemap y, si se quiere, prender IndexNow (sección 11). Bing alimenta también a DuckDuckGo, Yahoo y Ecosia.
- **Lo que pesa para aparecer:** que otros sitios enlacen a `mupa.ar` (la bio de Instagram del museo, Gobierno, Turismo, la UNSJ) y, para las búsquedas locales y Maps, la ficha de Google Business Profile con la dirección y los horarios.
- **Google Analytics 4** (`G-KX4G76DL91`): mide solo cuando el sitio corre en producción y se lo abre con el host de `URL_PUBLICA`: en Render, en `mupa.ar` (no en `onrender.com`); en una PC, solo si se lo levanta en producción y se lo abre con el host de su `URL_PUBLICA` (por eso la sección 5.3 abre la copia con otro). No mide navegadores automatizados ni a quien pidió no ser rastreado. Sus eventos están en `CLAUDE.md`, «Sitio con el diseño de la diseñadora», D14: `page_view`, `ver_pie`, `clic_entradas` y `enviar_contacto` (lo de «Buscadores y medición» sobre las secciones y las bandas es de la landing). Para revisarlo sin sumar visitas: `node tools/analitica-check.mjs --url https://mupa.ar/ --ver-envios`.

---

## 13. Revisión mensual (15 minutos)

- [ ] **Render, servicio `mupa-web` → Metrics:** memoria (lejos de los 512 MB), CPU y ancho de banda del mes (5 GB incluidos en el plan del workspace).
- [ ] **Render, base `mupa-db`:** el disco usado (y el aviso del Inicio, sección 6).
- [ ] **El export del mes** hecho, descargado y guardado en el Drive del museo (sección 5).
- [ ] **El Inicio del panel** sin avisos (sección 7).
- [ ] `node tools/rutas-check.mjs --url https://mupa.ar/` → "Todo bien.".
- [ ] La consola del sitio sin violaciones de CSP: `node tools/vitals.mjs --url https://mupa.ar/ --consola` (`consola` y `csp` vacías).
- [ ] **Search Console:** páginas indexadas y errores de cobertura. **GA4:** que siga midiendo (Tiempo real).
- [ ] **Dependabot:** los PR del mes (sección 16) y `npm audit --omit=dev`. Al 09/11/2026, después de `npm audit fix`, marca 3, moderados: `nodemailer` 10.0.16 (moderado, corregido en la 10.4.0, fuera de la versión fija: subirla lo decide quien mantiene el código, plan 15, D6); y `uuid` por `sequelize` (dos moderados, los de siempre, en un camino que no se usa). Después de un `npm audit fix`, `npm test` antes de desplegar. **Nunca `npm audit fix --force`**: bajaría Sequelize a la versión 3.
- [ ] **La audioguía** (si está prendida, sección 8 bis): escanear un QR con un teléfono, que abra en su espacio y que suene una estación; y, en Render → `mupa-web` → *Metrics*, el **tráfico de salida** del mes. Sin contadores, es la única señal de que alguien comparte un QR fuera del museo: un salto que no se explica por las visitas. **El primer mes, mirarlo cada semana.** Si se ve un abuso: 8 bis, «Cambiar los códigos».
- [ ] **Billing de Render:** la factura del mes pagada.

---

## 14. Si se cae algo

Primero, **https://status.render.com/**: si Render tiene un problema general, no hay nada que hacer de este lado más que esperar.

| Qué se ve | Qué mirar | Qué hacer |
|---|---|---|
| **El sitio no carga** (error de Render, 502 o 503 en todo) | Render → `mupa-web` → *Events* (¿un deploy falló? ¿el health check falla?) y *Logs* (`no_escucha`, `sin_build`, "Configuración inválida" con la variable que está mal) | Si empezó con un deploy: Rollback (sección 2). Si una variable está mal: corregirla. Si no: Manual Deploy → Restart service |
| **La portada, El Museo, Divulgación, Educación y Circuitos andan pero las demás páginas dicen "no disponible"**, o el panel dice "Algo salió mal" | `https://mupa.ar/salud/base` (tiene que decir `"base":"ok"`; con `"base":"no responde"`, es la base); Render → `mupa-db` (estado, disco lleno); Logs: `pagina_sin_base`, `sitemap_sin_base`, `home_sin_novedades` (la portada salió sin el carrusel de Novedades) y `divulgacion_sin_novedades` (Divulgación salió sin «Últimas noticias»), con la causa en `mensaje` (como `timeout expired`) y un `codigo` (en `pagina_sin_base` y `sitemap_sin_base`, `BASE_NO_DISPONIBLE` si la causa no trae uno; en `home_sin_novedades` y `divulgacion_sin_novedades`, solo el de la causa); `museo_sin_base`, `salud_base` y, del panel, `error_500` con un `codigo` como `ECONNREFUSED` o `ECONNRESET`, o con el `mensaje` `timeout expired` o, en el primer pedido después del corte, `Connection terminated unexpectedly` (sin `codigo`) (el panel no tiene un evento propio para la base: cada pedido que no llega a ella deja un `error_500` con su `stack`) | Si el disco está lleno (la base suspendida): sección 6, "Si la base quedó suspendida por el disco lleno": **Resume Database y agrandar el disco enseguida**. Si la base está caída o en mantenimiento, esperar (la portada, El Museo, Divulgación, Educación y Circuitos siguen andando solas; la portada y Divulgación, sin las novedades). Si no vuelve: soporte de Render. Si `/salud/base` dice `ok` y el panel sigue diciendo "Algo salió mal", no es la base: el `error_500` del log, con su `stack`, es lo que necesita quien mantiene el código |
| **Las fotos no cargan** | Logs: `foto_sin_base` | Lo mismo que la base |
| **El formulario no manda mails** | El aviso del Inicio y su código | Sección 4 |
| **Error de certificado en `mupa.ar`** (después del corte) | Render → *Settings* → *Custom Domains*; el DNS con `Resolve-DnsName mupa.ar -Type A -Server 8.8.8.8` | Que el `A` siga en la IP de Render y el `www` en `mupa-web.onrender.com`. Nadie usó "Reset DNS Records" |
| **Nadie puede entrar al panel** | — | Sección 3 |
| **Contenido borrado por error** | Cuándo pasó | Sección 5.1 (si fue hace menos de 3 días, recuperación a un punto anterior) |
| **La audioguía no anda** (sección 8 bis) | Qué dice la página: «Este código ya no funciona» (el QR es de otra versión, o la dirección está mal copiada), «El permiso … venció» (pasó la medianoche: volver a escanear), «Tu navegador no guardó el permiso» (las cookies bloqueadas, o el navegador de adentro de una app: abrir el código en Safari o Chrome) o «La audioguía se escucha en el museo» (se entró sin escanear); la página "no encontrada" en `/audioguia` es la audioguía **apagada**. En *Logs*, al arrancar: `audioguia_prendida` (cuántas estaciones quedaron y cuántas se saltearon), `audioguia_clave_invalida` (la clave mal pegada), `audioguia_sin_pistas` (sin manifiesto o sin ninguna estación válida), `audioguia_sin_grabar` (cuántas estaciones no tienen todavía sus archivos), `audioguia_pista_invalida` (una estación salteada, con su número y el motivo), `audioguia_apagada` (hay grabaciones y falta la clave) y `audioguia_limite_global` (`TRUST_PROXY` en 0); mientras anda: `audioguia_codigo_invalido` (QR que no valen, como mucho uno por minuto, con el motivo), `audioguia_limite` (una IP pasó los 3.000 pedidos de audio en 15 minutos: 429 por unos minutos) y `audioguia_pista_sin_archivo` (falta un MP3 en el disco). Ninguno lleva el código, el permiso ni la IP | Clave: 8 bis, «Prenderla». Una estación salteada: reemplazar su grabación (8 bis, «Cargar o reemplazar una tanda»). El 429: si pasa con visitas normales, revisar `TRUST_PROXY` (con un valor mal puesto, todo el museo comparte el límite). Un QR que dejó de andar después de subir la versión: es lo esperado, reimprimir. Comprobar con `rutas-check --audioguia-codigo-archivo` (sección 2) |

**Los logs:** Render los guarda 7 días. Una línea por pedido a la API del panel y por error, sin IP, sin el contenido de los pedidos y sin cookies. Los eventos útiles: `arranque`; `base_ok` y `base_no_responde` (la base, solo al arrancar); `pagina_sin_base`, `museo_sin_base`, `sitemap_sin_base`, `foto_sin_base`, `contacto_sin_base` y `salud_base` (la base no respondió a una página, a los datos del museo, al sitemap, a una foto, al formulario o a `/salud/base`); `home_sin_novedades` (la portada salió sin el carrusel de Novedades porque no pudo leerlas: como aviso si la base no respondió o rechazó la conexión, y como error, con su `stack`, si la falla no fue de la base; la portada sigue andando); `divulgacion_sin_novedades` (lo mismo en la página de Divulgación, que sale sin «Últimas noticias»); `pagina_sin_base`, `sitemap_sin_base`, `home_sin_novedades` y `divulgacion_sin_novedades` dicen la causa en `mensaje` (por ejemplo, `timeout expired`) y un `codigo` (en las dos primeras, `BASE_NO_DISPONIBLE` si la causa no trae uno); `contacto_no_guardado` (un mensaje del formulario no se terminó de guardar a tiempo: a veces es la única huella de la base en un mensaje que no salió por correo); `error_500` (un error sin traducir, con su `stack`; con la base caída, uno por cada pedido del panel); `tarea_fallida`, `correo_fallido`, `panel_sin_build`, `trust_proxy_cero`, `ingreso_fallido` e `indexnow`; los de la audioguía, en la fila de arriba. *(A confirmar en el primer deploy: si los registros HTTP propios de Render guardan la ruta y la consulta de cada pedido, ahí quedan los códigos de los QR y los permisos del día de la audioguía, y esos registros se tratan con la misma reserva que los QR.)*

**Un monitor externo** (opcional): uno gratuito que consulte `https://mupa.ar/salud/base` cada pocos minutos y avise por correo si falla (`/salud` es el de Render y no mira la base, a propósito).

---

## 15. Irse de Render

El orden importa: **primero el DNS, después borrar.** Si se borra antes, el sitio queda caído hasta que el DNS apunte a otro lado.
1. Un **export** de la base (sección 5), descargado y guardado.
2. El sitio funcionando en el lugar nuevo, con la base restaurada (5.3 sirve de guía) y comprobado en su propia dirección (`rutas-check`).
3. Con la persona del museo que tenga acceso a hPanel: bajar el TTL a 300 un día antes y después cambiar `A @` y `www` al lugar nuevo (como en el corte, plan 11.2). Nunca tocar el MX ni los TXT.
4. Esperar a que el lugar nuevo tenga su certificado y comprobar `https://mupa.ar/`.
5. Recién ahí, en Render: un último export, sacar los dominios propios del servicio, suspender o borrar el servicio y la base, y el Blueprint. Borrar la base borra también sus copias automáticas.
6. **Hostinger no se da de baja nunca**: tiene el correo y el DNS.

---

## 16. Actualizaciones

- **Dependabot** (`.github/dependabot.yml`) abre una vez por mes un PR con las actualizaciones menores de las dependencias de producción y otro con las de desarrollo. Nunca propone versiones mayores. **nodemailer** (el correo del formulario) va fijo a propósito y queda fuera del grupo: su actualización llega en un PR propio, que se aplica solo después de leer los cambios de la versión y de probar el correo (`npm run probar-correo` en el Shell de Render, sección 4). Las alertas de seguridad, si están prendidas en GitHub, abren su propio PR enseguida.
- **Aplicar un PR:** descargarlo, `npm ci`, `npm test` (con la base de pruebas) y `npm run build`; si toca lo que se ve, las recetas de `tools/`; unirlo a `master`; desplegar (sección 2) y `rutas-check`.
- **Versiones mayores** (Express, React, Sequelize 7, Vite…): son trabajos aparte, con sus pruebas. **Node 24 queda fijo** (`.node-version`). Pasar a otra versión mayor de PostgreSQL es una restauración a una base nueva (sección 5.1).
- **Después de la garantía nadie aplica parches si no se acordó quién lo hace**: está escrito en el acta de entrega.

---

## 17. Facturas y pagos

- Render factura al **workspace del museo**, por mes y a mes vencido. Las facturas y los avisos de pago llegan a: *(completar en el acta: la casilla de la cuenta de Render del museo)*.
- **Si rechazan la tarjeta:** Render avisa por correo. Cargar otro medio de pago en *Billing* y pagar la factura pendiente desde ahí. Con una factura impaga Render puede suspender los servicios (el sitio deja de verse); al pagarla deberían volver solos, y si no, escribir a soporte. Soporte: desde el dashboard o escribiendo a `support@render.com` desde el correo de la cuenta.
- Lo demás no tiene costo aparte: el correo y el DNS ya los paga el museo en Hostinger; GitHub, Analytics, Search Console, Bing y UserWay (el plan gratuito) son gratis.
