# Acta de entrega del sitio del MuPa

Plantilla del acta de entrega (plan 10.6). Se completa en la reunión de entrega, se imprime y la firman las dos partes. **No lleva contraseñas, códigos de recuperación ni claves de ningún tipo**: solo dice quién es titular de cada cuenta, cómo se recupera y dónde están guardados los códigos. Las contraseñas las pone el museo en esa reunión (en persona o en videollamada), nunca por mail ni por WhatsApp.

| | |
|---|---|
| **Sitio** | https://mupa.ar/ (el panel de administración: https://mupa.ar/administracion/) |
| **Museo** | Museo Paleontológico de San Juan (MuPa) |
| **Fecha de la entrega** | ____ / ____ / ________ |
| **Versión entregada** | rama `master`, commit `__________` (el desplegado en Render ese día) |
| **Presentes** | Por el museo: ______________________________ Por el desarrollo: ______________________________ |

---

## 1. Cuentas

Una fila por cuenta. "Recuperación" es el correo secundario de recuperación, **fuera de `mupa.ar`**. "2FA" es el dispositivo donde está la verificación en dos pasos (por ejemplo, "celular institucional de Dirección, app Google Authenticator"). "Códigos" es dónde quedaron los **códigos de recuperación impresos** (por ejemplo, "sobre cerrado en la caja fuerte de Dirección").

| Cuenta | Titular | Usuario o correo de la cuenta | Recuperación | 2FA | Códigos impresos | Hecho |
|---|---|---|---|---|---|---|
| Casilla institucional para las cuentas (p. ej. `sistemas@mupa.ar`) | Museo | | | | | ☐ El museo cambió la clave |
| Casilla de envío del sitio (`web@mupa.ar`) | Museo | `web@mupa.ar` | — | — | — | ☐ El museo cambió la clave, la cargó en Render (`SMTP_CLAVE`) y `probar-correo` dio bien |
| Render (workspace del sitio) | Museo | | | | | ☐ Clave y 2FA nuevos ☐ Medio de pago del museo en *Billing* |
| GitHub (organización y repositorio) | Museo | Organización: __________ | | | | ☐ Repositorio transferido ☐ El desarrollo queda como: ☐ colaborador ☐ sin acceso |
| Google Analytics 4 (`G-KX4G76DL91`) | Museo | | | | | ☐ El museo es administrador ☐ El desarrollo bajó a lector |
| Google Search Console | Museo | | | | | ☐ El museo es propietario |
| Bing Webmaster Tools | Museo | | | | | ☐ Usuario del museo agregado |
| UserWay | Museo | | | | | ☐ No aplica |
| Hostinger (DNS, correo, landing) | Museo | | | | | ☐ Si hubo acceso delegado, el titular lo revocó |
| NIC Argentina (dominio `mupa.ar`) | | | | | | Vence el: ____ / ____ / ________ |
| Panel del sitio | Museo | Administradores: ______________________________ | — | — | — | ☐ Dos administradores activos |
| Panel del sitio, cuenta "Soporte" del desarrollo | Museo | | — | — | — | ☐ Se desactiva al terminar la garantía (____ / ____ / ________) |

**Facturas de Render:** llegan a ______________________________ (sección 17 de `docs/operacion.md`: qué hacer si rechazan la tarjeta).

---

## 2. Lo que se entrega

- ☐ El sitio publicado en `https://mupa.ar/`, comprobado ese día con `node tools/rutas-check.mjs --url https://mupa.ar/` ("Todo bien.").
- ☐ El repositorio con el código, `render.yaml` y la documentación: `docs/operacion.md` (la guía de operación), `docs/plan-panel-admin.md` (el plan), `CLAUDE.md` y `tools/README.md`.
- ☐ El manual del panel (`/administracion/manual.pdf`) y la capacitación hecha el ____ / ____ / ________.
- ☐ El ensayo de restauración hecho (plan 10.3) y el primer export mensual guardado en el Drive del museo, en la carpeta ______________________________.
- ☐ El recordatorio mensual del export y de la revisión mensual en el calendario de ______________________________.

---

## 3. Garantía y mantenimiento

- **Garantía:** desde el ____ / ____ / ________ hasta el ____ / ____ / ________ (60 días). Cubre defectos del sitio entregado, no tareas periódicas (plan 10.5).
- **Después de la garantía, las actualizaciones de seguridad y los PR de Dependabot los aplica:** ______________________________ (persona o empresa, y cómo se la contacta). Si queda en blanco, **nadie** las aplica.
- **La revisión mensual** (sección 13 de `docs/operacion.md`) la hace: ______________________________.
- **El disco de la base** (sección 6 de `docs/operacion.md`: con el disco lleno, Render suspende la base y casi todo el sitio deja de andar): ☐ crecimiento automático prendido ☐ apagado; en ese caso, el aviso del 80 % del Inicio lo atiende y agranda el disco: ______________________________.
- **La llave de emergencia** (sección 3 de `docs/operacion.md`: `npm run crear-admin` y `npm run restablecer-admin` desde el Shell de Render) la puede usar quien tenga acceso a la cuenta de Render: ______________________________.

---

## 4. Observaciones

______________________________________________________________________________________

______________________________________________________________________________________

______________________________________________________________________________________

---

| Por el museo | Por el desarrollo |
|---|---|
| Firma: | Firma: |
| Aclaración: | Aclaración: |
| Cargo: | |
| Fecha: | Fecha: |
