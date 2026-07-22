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

## Orden de despliegue

1. Aplicar las migraciones de Supabase.
2. Desplegar el LMS con `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WEBHOOK_SECRET` y `NEXT_PUBLIC_APP_URL`.
3. Desplegar la web pública con el mismo `WEBHOOK_SECRET` y la URL HTTPS de este endpoint.
4. Registrar el webhook de Stripe y confirmar el callback de dLocal.
5. Ejecutar las pruebas de compra nueva, cuenta existente, aviso duplicado y correo fallido.
