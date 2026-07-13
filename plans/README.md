# Planes de mejora

Generados con la skill improve el 2026-07-13 sobre el commit 172d95b.
Los planes 001 a 003 y 006 se completaron sin modificar Supabase. Los planes
004 y 005 siguen bloqueados porque Pibo no pudo vincularse con certeza a un
proyecto remoto y el único candidato figura INACTIVE.

## Orden y estado

| Plan | Título | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---:|---:|---|---|
| 001 | Crear una base de pruebas y eliminar UI muerta | P1 | M | — | DONE (`3137956`) |
| 002 | Corregir redirects de login y recuperación | P1 | S | 001 | DONE (`35e136a`) |
| 003 | Reducir esperas y mostrar progreso real | P2 | M | 001 | DONE (`9a88646`) |
| 004 | Cerrar escalamiento de rol, tokens y permisos de chat | P1 | L | backend identificado | BLOCKED: Supabase ambiguo/INACTIVE |
| 005 | Hacer durable y atómico el alta por compra | P1 | L | 004 + plan web 005 | BLOCKED: Supabase ambiguo/INACTIVE |
| 006 | Aplicar parches seguros de dependencias | P1 | S | 001 | DONE (`bbcb096`) |

## Dependencias

- 001 crea npm test, npm run typecheck y npm run check.
- 002 y 003 sólo cambian código local y deben pasar esas puertas.
- 004 requiere comparar el esquema local con el remoto antes de escribir SQL.
- 005 requiere un almacenamiento idempotente y sandbox de proveedores.
- 006 aplicó sólo parches compatibles; no fuerza la migración de Next.

## Hallazgos considerados y diferidos

- El chat descarga historiales completos y vuelve a filtrarlos por alumno.
  Queda dentro de 004 porque no debe optimizarse sin verificar las políticas y
  consultas remotas.
- checkRateLimit siempre devuelve true. No se reemplazará con memoria local,
  que tampoco funciona de forma confiable en Vercel. Debe resolverse con un
  servicio durable cuando el backend vuelva.
- Next 14 tiene alertas altas sin parche dentro de su línea. Migrar a Next 16
  merece un plan separado después de recuperar tests y backend; mezclarlo ahora
  aumentaría mucho el riesgo.
- Los parches compatibles redujeron la auditoría de producción de 7 alertas a
  2. Las restantes pertenecen a Next 14 y su PostCSS interno.
- No se borrarán tablas lessons, lesson_progress o foro basándose sólo en
  archivos locales. Primero hay que comprobar si conservan datos.
- La carga administrativa valida tipo declarado y tamaño, pero todavía podría
  inspeccionar el contenido real. Es una mejora secundaria frente a los
  permisos críticos.

## Acción humana necesaria

- Recuperar el project ref desde la configuración privada del hosting.
- Confirmar que pertenece a Pibo antes de restaurar o cambiar Supabase.
