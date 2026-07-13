# Plan 001: Crear una base de pruebas y eliminar UI muerta

> Executor: sigue todos los pasos, toca sólo el alcance y no cambies Supabase.
> El revisor mantiene plans/README.md.
>
> Drift check: git diff --stat 172d95b..HEAD -- package.json package-lock.json README.md components/ui lib/access.ts lib/access.test.ts lib/rate-limit.ts types/database.ts app/(dashboard)/curso/[moduleId]/module-actions.tsx app/(dashboard)/curso/[moduleId]/page.tsx

## Estado

- Estado: DONE (`3137956`)
- Prioridad: P1
- Esfuerzo: M
- Riesgo: LOW
- Depende de: ninguno
- Categoría: tests, DX, código muerto
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

El LMS no tiene pruebas ni comando de typecheck y el README es el texto genérico
de Create Next App. Los cambios de autenticación, progreso y pagos no tienen red
de seguridad. Además hay seis componentes UI sin una sola importación y cuatro
dependencias Radix que sólo existen para esos archivos.

Eliminar código muerto no acelerará mágicamente el navegador porque el bundler
ya lo excluye, pero reduce instalación, alertas y superficie de mantenimiento.

## Estado actual

- package.json sólo tiene dev, build, start y lint.
- npx tsc --noEmit --incremental false pasa.
- npm run lint pasa con dos avisos de imágenes.
- No existe ningún archivo test/spec.
- Sin importadores confirmados:
  - components/ui/checkbox.tsx
  - components/ui/dialog.tsx
  - components/ui/dropdown-menu.tsx
  - components/ui/sheet.tsx
  - components/ui/table.tsx
  - components/ui/tabs.tsx
- Dependencias directas exclusivas: @radix-ui/react-checkbox,
  @radix-ui/react-dialog, @radix-ui/react-dropdown-menu y
  @radix-ui/react-tabs.
- lib/rate-limit.ts exporta getRateLimitInfo sin consumidor.
- DirectMessageWithStudent y AnnouncementWithAuthor no tienen consumidor.
- ModuleActions declara initialProgress pero no lo usa.

Convención: npm con lockfile, TypeScript, aliases @/ y commits convencionales.

## Comandos

| Propósito | Comando | Resultado |
|---|---|---|
| Instalar | npm ci | exit 0 |
| Tipos | npm run typecheck | exit 0 |
| Pruebas | npm test | todas pasan |
| Lint | npm run lint | exit 0 |
| Todo local | npm run check | exit 0 |

El build necesita variables de entorno. Para verificarlo usa valores de prueba
no secretos sólo en el proceso y nunca los guardes:

    NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=temporary
    SUPABASE_SERVICE_ROLE_KEY=temporary
    RESEND_API_KEY=re_temporary
    WEBHOOK_SECRET=temporary

## Alcance

En alcance:

- package.json
- package-lock.json
- README.md
- lib/access.test.ts, crear
- componentes UI listados, eliminar
- lib/rate-limit.ts
- types/database.ts
- app/(dashboard)/curso/[moduleId]/module-actions.tsx
- app/(dashboard)/curso/[moduleId]/page.tsx

Fuera de alcance:

- SQL, migrations y schema
- rutas API
- actualización de Next/React/Supabase
- implementar rate limiting real
- otros componentes UI usados

## Git

- Rama: codex/improve-lms
- Mensaje: chore: add checks and remove dead ui
- No publicar ni abrir PR.

## Pasos

### 1. Añadir puertas locales

- Instala Vitest como dependencia de desarrollo.
- Añade scripts:
  - typecheck: tsc --noEmit
  - test: vitest run
  - check: npm run typecheck && npm test && npm run lint
- Crea lib/access.test.ts siguiendo la API actual de canAccessModule.
- Cubre admin, alumno pago, módulo gratuito y módulo bloqueado.

Verifica: npm run check termina con exit 0 y ejecuta al menos cuatro casos.

### 2. Eliminar UI y dependencias sin consumidores

- Repite rg para cada componente antes de borrarlo.
- Elimina los seis archivos confirmados.
- Desinstala sólo las cuatro dependencias Radix exclusivas.
- No borres react-alert-dialog: sí está usado.

Verifica:

    rg "@/components/ui/(checkbox|dialog|dropdown-menu|sheet|table|tabs)" app components lib

Debe devolver cero coincidencias.

### 3. Eliminar símbolos muertos pequeños

- Quita getRateLimitInfo, conservando checkRateLimit y su aviso explícito de que
  no protege realmente.
- Quita DirectMessageWithStudent y AnnouncementWithAuthor.
- Quita initialProgress de ModuleActionsProps y de su llamada en la página.
- No elimines onMessageSent del chat; puede convertirse en respaldo cuando se
  repare Realtime.

Verifica: npm run typecheck pasa.

### 4. Reemplazar README genérico

Documenta:

- propósito de LMS;
- npm ci, npm run dev, npm run check y build;
- grupos de variables sin valores;
- dependencia de Supabase, Bunny y Resend;
- estado conocido: backend remoto aún no identificado;
- prohibición de ejecutar schema.sql a ciegas;
- cómo usar migrations sólo después de comparar el remoto.

No copies valores privados.

## Pruebas

lib/access.test.ts:

- admin siempre accede;
- alumno sin pago accede a order_index 0;
- alumno sin pago no accede a order_index 1;
- alumno pago accede.

## Criterios

- [ ] npm run check pasa.
- [ ] npm run build pasa con valores temporales no guardados.
- [ ] seis componentes y cuatro dependencias exclusivas no existen.
- [ ] no quedan símbolos muertos listados.
- [ ] README ya no es Create Next App.
- [ ] sólo se cambian archivos en alcance.

## STOP

- Un componente candidato sí tiene importador.
- Una dependencia Radix tiene uso fuera del archivo eliminado.
- Vitest exige una migración principal de Node/Next.
- El build intenta una conexión o escritura real.

## Mantenimiento

No confundas menos dependencias con mejora de tiempo de carga: la ganancia
principal es mantenimiento. Los planes siguientes deben pasar npm run check.
