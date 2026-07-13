# Plan 006: Aplicar parches seguros de dependencias

> Executor: actualiza sólo dentro de las versiones compatibles declaradas. No
> uses `--force`, no migres Next/React y no cambies código de la aplicación.
>
> Drift check: `git diff --stat 172d95b..HEAD -- package.json package-lock.json`

## Estado

- Estado: DONE (`bbcb096`)
- Prioridad: P1
- Esfuerzo: S
- Riesgo: LOW
- Depende de: 001
- Categoría: seguridad, mantenimiento
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

La auditoría actual encuentra parches compatibles para Resend, WebSocket y
varias herramientas auxiliares. Dejarlos viejos no aporta estabilidad. La
alerta principal de Next 14, en cambio, exige una migración mayor y queda fuera
de este pase.

## Alcance

En alcance:

- `package-lock.json`
- `package.json` sólo si npm necesita ajustar una versión compatible

Fuera de alcance:

- código de la aplicación;
- actualizar Next, React o eslint-config-next a una versión principal nueva;
- `npm audit fix --force`;
- Supabase o servicios remotos.

## Pasos

1. Registra el resultado de `npm audit --omit=dev` y `npm audit` antes del cambio.
2. Ejecuta `npm audit fix` sin `--force`.
3. Revisa que ningún paquete directo cruce una versión principal.
4. Ejecuta `npm ci`, `npm run check` y el build con variables temporales.
5. Repite ambas auditorías y registra las alertas residuales.

## Criterios

- [ ] bajan las alertas corregibles sin migración principal;
- [ ] Next y React conservan sus versiones principales;
- [ ] `npm ci`, `npm run check`, build y `git diff --check` pasan;
- [ ] sólo cambian archivos de dependencias permitidos.

## STOP

- npm propone `--force` o una versión principal;
- una prueba o el build falla después de regenerar el lockfile;
- el diff cambia scripts o dependencias sin relación con un parche.

## Riesgo residual

Next 14 conserva alertas altas que no tienen arreglo dentro de su línea. No se
debe confundir este plan con una solución completa: requiere una migración
separada a una versión mantenida.

## Git

- Rama: `codex/improve-lms`
- Mensaje: `chore: apply safe dependency patches`
- No publicar.
