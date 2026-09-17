# Migrar la landing y Claude Code a otra PC

Solo hace falta este repo. El del servidor de dispositivos (`mupa-web/servidor_dispositivos`) ya vive en GitHub y no interviene en la landing.

## Qué viaja por dónde
| Qué | Cómo | Dónde queda en la PC nueva |
|---|---|---|
| Código de la landing | GitHub (repo privado) | la carpeta que elijas, por ejemplo `Proyectos/mupa-web` |
| Memoria de Claude (15 archivos `.md`) | `migracion-claude-mupa.zip` -> `memoria/` (USB o Drive) | `~/.claude/projects/<slug>/memory/` |
| Permisos de la sesión | `migracion-claude-mupa.zip` -> `config-sesion/settings.local.json` | `mupa-web/.claude/settings.local.json` |
| Config global de Claude | `config-sesion/settings.global.json` | `~/.claude/settings.json` |
| Mockup `Landing Page - V01.ai` | en el zip | `mupa-web/design/` (carpeta ignorada por git) |
| Fotos originales del museo | siguen en el Drive del museo | no hacen falta: los WebP van en el repo |
| Secretos (`.env`, spike de Mercado Pago) | no están en este repo ni en esta PC | siguen en la PC personal |

Abrí en Claude Code la carpeta `mupa-web` directamente, no una carpeta padre: así el preview (`.claude/launch.json`, versionado) y los permisos quedan donde corresponde. `<slug>` es la ruta absoluta de esa carpeta con las barras y los dos puntos reemplazados por guiones: `C:\Users\juan\Proyectos\mupa-web` se convierte en `C--Users-juan-Proyectos-mupa-web`. La carpeta se crea sola la primera vez que abrís el proyecto.

## En la PC vieja (una sola vez)
1. Confirmar la identidad del commit (`git log -1 --format='%an <%ae>'`) y corregirla con `--amend --reset-author` si no es la tuya.
2. Crear el repo privado en GitHub (org `mupa-web`), agregar el remoto y pushear `master`.
3. Copiar `Downloads/migracion-claude-mupa.zip` a un USB o al Drive.

## En la PC nueva
1. Instalar Git, Node 24 LTS, Google Chrome (lo usa `tools/measure.mjs`) y Claude Code; iniciar sesión con la misma cuenta.
2. Clonar `mupa-web` (por HTTPS es lo más simple si esa PC no tiene clave SSH).
3. `npm install` y `npm run dev`; abrir http://localhost:5173 y comprobar que "sanjuaninos" baja de fila al hacer scroll.
4. Descomprimir el zip: el `.ai` a `mupa-web/design/`, `settings.local.json` a `mupa-web/.claude/`, `settings.global.json` a `~/.claude/settings.json`.
5. Abrir `mupa-web` en Claude Code, escribir cualquier cosa para que se cree `~/.claude/projects/<slug>/`, y copiar los 15 archivos de `memoria/` a `~/.claude/projects/<slug>/memory/`.
6. Prueba final: pedir "leé tu memoria y CLAUDE.md y contame en qué estamos". Si nombra el presupuesto, el dominio mupa.ar, el parallax y los pendientes, la migración está completa.

Las conversaciones anteriores no se migran (195 MB, solo se retoman en la misma máquina). Lo que importaba de ellas está en el código, en `CLAUDE.md` y en la memoria.
