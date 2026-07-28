# Compras provenientes de la web pública

El endpoint `POST /api/webhooks/purchase` sólo acepta mensajes firmados por la web de Pibo. Nunca confía en datos enviados por el navegador.

La base guarda cada compra por proveedor e identificador de checkout. Esto permite que Stripe, dLocal y la pantalla de regreso repitan el mismo pedido sin crear cuentas, matrículas o correos duplicados.

## Alumno nuevo

- La compra queda guardada como `pending_account`.
- Se crea una invitación pagada de siete días.
- El alumno recibe un enlace estable para elegir contraseña.
- Al aceptar, la matrícula conserva el proveedor, el pago y los importes verificados.
- Luego del login, el onboarding existente se muestra antes del curso.

## Alumno existente

- La matrícula se activa inmediatamente.
- El alumno recibe un enlace al login.
- Su cuenta y progreso existentes no se reemplazan.

## Entrega del correo

El estado del acceso y el estado del correo son independientes. Si Resend falla, el acceso o la invitación siguen guardados. El endpoint devuelve un error reintentable para que el proveedor vuelva a avisar. Un bloqueo en la base evita dos envíos simultáneos y la clave estable de Resend evita duplicados durante los reintentos.

Los estados que hay que vigilar en `private.purchase_events` son:

- `access_status`: `pending_account`, `active` o `revoked`;
- `access_revoked_at` y `access_revocation_reason` para saber cuándo y por qué se cortó el acceso;
- `email_status`: `pending`, `sending`, `sent` o `failed`;
- `email_attempts` y `email_last_error` para localizar entregas que necesitan un reintento.

Si una compra queda registrada pero el email falla, no hay que crear otra compra manualmente. Hay que corregir el problema del correo y reenviar el mismo evento del proveedor. La clave de idempotencia mantiene una sola entrega.

## Orden de despliegue

1. Aplicar las migraciones de Supabase.
2. Desplegar el LMS con `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WEBHOOK_SECRET` y `NEXT_PUBLIC_APP_URL`.
3. Desplegar la web pública con el mismo `WEBHOOK_SECRET` y la URL HTTPS de este endpoint.
4. Registrar el webhook de Stripe y confirmar el callback de dLocal sólo si dLocal está habilitado.
5. Ejecutar las pruebas de compra nueva, cuenta existente, aviso duplicado y correo fallido.

## Reembolsos y contracargos

La web envía una orden firmada con `access_action: revoke`, el identificador
del evento, el identificador del pago y el motivo `refund` o `dispute`. El LMS
la procesa con `revoke_purchase_access`, cambia la matrícula a `refunded` o
`revoked` y marca el evento como `access_status = revoked`. La operación es
idempotente: repetir el mismo aviso no vuelve a crear ni a modificar una
segunda matrícula.

## Operación segura

- No modificar `private.purchase_events` desde el navegador.
- No borrar invitaciones o matrículas para “reintentar” una compra.
- No compartir valores de `SUPABASE_SECRET_KEY`, `RESEND_API_KEY` o `WEBHOOK_SECRET` en tickets, capturas o commits.
- Antes de publicar cambios, ejecutar `npm run check` y las pruebas de base disponibles.
- Para cambios remotos de Supabase, aplicar primero una migración revisada y comprobar el resultado con una consulta de sólo lectura.

Los reembolsos aprobados y los contracargos confirmados revocan el acceso
inmediatamente. Un reembolso parcial queda para revisión manual y no revoca por
sí solo el curso.
