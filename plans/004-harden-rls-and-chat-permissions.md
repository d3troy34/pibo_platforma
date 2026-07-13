# Plan 004: Cerrar escalamiento de rol, tokens y permisos de chat

> BLOQUEADO. No ejecutar mientras el proyecto Supabase correcto no esté
> identificado, activo, respaldado y comparado con estos archivos.
>
> Drift check: git diff --stat 172d95b..HEAD -- supabase app/api/auth/accept-invitation app/(auth)/invite app/(dashboard)/mensajes app/(admin)/admin/mensajes

## Estado

- Estado: BLOCKED (Supabase no identificado; candidato INACTIVE)
- Prioridad: P1
- Esfuerzo: L
- Riesgo: HIGH
- Depende de: backend identificado
- Categoría: seguridad y base de datos
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

El esquema local permite al usuario actualizar su propia fila profiles sin
limitar columnas; role vive en esa fila y decide acceso administrativo. La
tabla invitations tiene una política SELECT USING (true), y el chat permite
leer todos los perfiles y actualizar columnas de mensajes más allá de read_at.

Estos son bloqueantes de publicación, pero aplicar SQL contra un proyecto
ambiguo sería irresponsable.

## Evidencia local

- supabase/schema.sql:12-21: profiles incluye email, teléfono y role.
- supabase/schema.sql:233-246: UPDATE propio sin columnas seguras.
- supabase/schema.sql:316-319: invitaciones legibles con USING true.
- migrations/009_fix_profiles_recursion.sql:14-17: todos los autenticados leen
  todos los perfiles.
- migrations/004_direct_messages.sql:93-112: UPDATE de fila recibida sin
  limitar columnas.
- get_unread_message_count acepta un user_id proporcionado por el llamador.

## Alcance futuro

- nueva migración creada con supabase migration new;
- privilegios por columna para profile editable;
- role y email sólo por operación administrativa;
- invitaciones validadas sólo en servidor y tokens almacenados con hash;
- perfil público mínimo para chat;
- lectura privada de PII;
- operación segura para marcar read_at;
- conteo no leído ligado a auth.uid();
- pruebas RLS con anon, estudiante A, estudiante B y admin;
- paginación del chat una vez estabilizados permisos.

## Pasos futuros

1. Obtener project ref del hosting y confirmar propiedad.
2. Listar tablas, migraciones y advisors en modo lectura.
3. Capturar esquema remoto y comparar con schema.sql/migrations.
4. Crear una rama Supabase de desarrollo con autorización de costo.
5. Escribir primero pruebas de permisos que reproduzcan cada fallo.
6. Crear migración con REVOKE/GRANT y políticas explícitas USING + WITH CHECK.
7. Evitar SECURITY DEFINER salvo necesidad demostrada; si se usa, mantenerla
   fuera de esquema expuesto, fijar search_path, comprobar auth.uid y revocar
   EXECUTE a PUBLIC.
8. Ejecutar advisors de seguridad y rendimiento.
9. Probar UI de perfil, invitación y chat contra la rama.

## Criterios futuros

- [ ] un estudiante no puede cambiar role, email, id o fechas.
- [ ] anon no puede listar invitaciones ni tokens.
- [ ] un estudiante no puede leer PII de otro.
- [ ] un receptor sólo puede marcar read_at, no editar texto/autoría.
- [ ] conteos ignoran user_id ajeno.
- [ ] advisors no reportan RLS faltante.

## STOP

- Supabase sigue ambiguo o INACTIVE.
- El remoto no coincide con el esquema local.
- Hay tokens/datos que requieren rotación o migración manual.
- No existe rama o copia de seguridad verificable.
