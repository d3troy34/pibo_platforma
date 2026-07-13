# Plan 003: Reducir esperas y mostrar progreso real

> Executor: sólo reorganiza lecturas existentes y cálculo de UI. No cambies
> tablas, políticas ni escrituras. El revisor mantiene el índice.
>
> Drift check: git diff --stat 172d95b..HEAD -- app/(dashboard)/layout.tsx app/(dashboard)/curso/page.tsx app/(dashboard)/progreso/page.tsx app/(admin)/admin/page.tsx components/dashboard/module-card.tsx lib/progress.ts lib/progress.test.ts

## Estado

- Estado: DONE (`9a88646`)
- Prioridad: P2
- Esfuerzo: M
- Riesgo: MED
- Depende de: 001
- Categoría: rendimiento y bug visual
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

Las páginas esperan consultas independientes una detrás de otra y repiten
perfil/inscripción entre layout y página. En una red con latencia, esa cascada
es más costosa que el procesamiento de React.

La página de progreso muestra 0% para cualquier módulo incompleto aunque tenga
progress_seconds y duration_seconds. Eso hace que el avance visible no coincida
con lo guardado.

## Estado actual

Dashboard layout ejecuta:

    auth -> profile -> enrollment -> modules -> progress -> announcement

CoursePage ejecuta:

    auth -> enrollment -> profile -> outline -> progress

ProgressPage ejecuta:

    auth -> profile -> enrollment -> modules -> progress

Y muestra:

    // app/(dashboard)/progreso/page.tsx:207
    <Progress value={isModuleCompleted ? 100 : 0} />

Module incluye duration_seconds y ModuleProgress incluye progress_seconds.

## Comandos

- npm test -- lib/progress.test.ts
- npm run typecheck
- npm run lint
- npm run check
- npm run build con variables temporales

## Alcance

En alcance:

- app/(dashboard)/layout.tsx
- app/(dashboard)/curso/page.tsx
- app/(dashboard)/progreso/page.tsx
- app/(admin)/admin/page.tsx
- components/dashboard/module-card.tsx
- lib/progress.ts, crear
- lib/progress.test.ts, crear

Fuera de alcance:

- escrituras de module-actions
- SQL, índices, RPC y RLS
- perfil cliente y chat
- cambiar qué módulos requieren pago
- caché global entre usuarios

## Pasos

### 1. Crear cálculo de progreso puro

- Implementa getModuleProgressPercent(progressSeconds, durationSeconds,
  completed).
- completed devuelve 100.
- duración 0, valores negativos o no finitos devuelven 0.
- El resultado se limita entre 0 y 100 y se redondea.
- Usa el helper en cada fila de ProgressPage.
- Limita estadísticas a IDs de módulos publicados para que filas antiguas no
  inflen el total.

Verifica con tests: 0, parcial, 90%, mayor a duración, completado y duración
inválida.

### 2. Paralelizar sólo lecturas independientes

- Después de auth, usa Promise.all para consultas que no dependen entre sí.
- En layout: profile, enrollment y announcement en paralelo; si hay acceso,
  modules y progress en paralelo.
- En CoursePage: enrollment, profile, outline y progress en paralelo. El
  fallback de admin para modules sólo corre si outline falla.
- En ProgressPage: profile y enrollment empiezan en paralelo; decide el
  paywall y, sólo para un usuario autorizado, carga modules y progress en un
  segundo Promise.all. No hagas esperar consultas de contenido a quien verá
  el paywall.
- En admin/page: ejecuta sus conteos independientes en paralelo.
- Conserva los mismos filtros y resultados.
- No uses caché global ni singleton con datos de usuario.

Verifica: revisa que cada Promise se espere y cada error siga el comportamiento
existente.

### 3. Reducir carga de miniaturas

- Añade loading y decoding apropiados a las imágenes de ModuleCard.
- No uses next/image con un wildcard remoto. Si no se conoce el host de
  miniaturas, conserva img y documenta el aviso.
- La primera tarjeta visible puede ser eager; las posteriores deben ser lazy.

Verifica: npm run lint no añade nuevos avisos.

## Pruebas

- lib/progress.test.ts cubre límites y valores inválidos.
- Prueba manual con datos simulados: un módulo 30/100 muestra 30%, completado
  muestra 100%.
- Build y typecheck confirman que Promise.all mantiene tipos.

## Criterios

- [ ] consultas independientes ya no forman cascadas evitables.
- [ ] un usuario sin acceso no consulta módulos ni progreso antes del paywall.
- [ ] progreso parcial no muestra 0%.
- [ ] porcentaje nunca supera 100 ni es negativo.
- [ ] estadísticas ignoran progreso de módulos no publicados.
- [ ] imágenes bajo el primer bloque son lazy.
- [ ] npm run check y build pasan.
- [ ] no hay cambios fuera de alcance.

## STOP

- Una consulta depende del resultado de otra de forma no documentada.
- Paralelizar cambia autorización o ejecuta una consulta privilegiada antes de
  comprobar identidad.
- Se necesita tocar un RPC, política o índice.
- No puede verificarse el build sin conexión real.

## Mantenimiento

Cuando Supabase vuelva, mide latencia real antes/después. El siguiente paso de
velocidad será una capa por petición para deduplicar perfil e inscripción, no
caché compartida entre usuarios.
