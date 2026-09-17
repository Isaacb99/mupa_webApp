# Migrar el proyecto y Claude Code a otra PC

## Qué viaja por dónde
| Qué | Cómo | Dónde queda en la PC nueva |
|---|---|---|
| Código de la landing (`mupa-web`) | GitHub (repo privado) | `Downloads/web-project/mupa-web` (o donde prefieras) |
| Repo del servidor de dispositivos | ya está en GitHub (`mupa-web/servidor_dispositivos`) | `Downloads/web-project/web-project` |
| Memoria de Claude (15 archivos `.md`) | carpeta `migracion-claude-mupa/memoria` (USB o Drive) | `~/.claude/projects/<slug>/memory/` |
| Permisos y config de la sesión | `migracion-claude-mupa/config-sesion` | `web-project/.claude/settings.local.json`; `settings.global.json` -> `~/.claude/settings.json` |
| Mockup `Landing Page - V01.ai` | `migracion-claude-mupa/` | `mupa-web/design/` (carpeta ignorada por git) |
| Fotos originales del museo | siguen en el Drive del museo | no hace falta bajarlas; los WebP van en el repo |
| Secretos (`.env`, spike de Mercado Pago) | NO están en este repo ni en esta PC | siguen en la PC personal |

`<slug>` es la ruta absoluta de la carpeta que abrís en Claude Code con `\` y `:` reemplazados por `-`. Ejemplo: `C:\Users\juan\Downloads\web-project` -> `C--Users-juan-Downloads-web-project`. La carpeta se crea sola la primera vez que abrís el proyecto.

## En la PC vieja (una sola vez)
1. Commitear y pushear `mupa-web` a un repo privado de GitHub (org `mupa-web`).
2. Copiar `Downloads/migracion-claude-mupa.zip` a un USB o al Drive.
3. Verificar dónde están los PDF del presupuesto (`Presupuesto Mupa Web v2.pdf`, `informe sitio web MUPA v2.pdf`): ya no están en Downloads.

## En la PC nueva
1. Instalar Git, Node 24 LTS, Google Chrome (lo usa `tools/measure.mjs`) y Claude Code; iniciar sesión con la misma cuenta.
2. Crear `Downloads/web-project` y clonar adentro los dos repos (`mupa-web` y `servidor_dispositivos` como `web-project`).
3. En `mupa-web`: `npm install` y `npm run dev`; abrir http://localhost:5173 y comprobar que el titular hace el parallax.
4. Descomprimir `migracion-claude-mupa.zip`: copiar el `.ai` a `mupa-web/design/`, `settings.local.json` a `web-project/.claude/` y `settings.global.json` a `~/.claude/settings.json`.
5. Abrir la carpeta `web-project` en Claude Code, escribir cualquier cosa para que se cree `~/.claude/projects/<slug>/`, cerrar, y copiar los 15 archivos de `memoria/` a `~/.claude/projects/<slug>/memory/`.
6. Volver a abrir la sesión y pedir "leé tu memoria y CLAUDE.md y contame en qué estamos": si nombra el presupuesto, el dominio, el parallax y los pendientes, la migración está completa.

Las conversaciones anteriores (transcripciones) no se migran: pesan 195 MB y solo se pueden retomar en la misma máquina. Todo lo que importa de ellas está en `CLAUDE.md`, en la memoria y en el código.
