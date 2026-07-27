# Pibo — Runbook de producción

Este documento describe cómo operar el puente de compra y qué revisar antes de publicar cambios. No contiene valores secretos.

## Variables

### LMS

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública del proyecto.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública para el navegador.
- `SUPABASE_SECRET_KEY`: sólo servidor y sólo producción.
- `RESEND_API_KEY`: sólo servidor y sólo producción.
- `RESEND_FROM_EMAIL`: remitente verificado.
- `WEBHOOK_SECRET`: secreto compartido con la web; debe ser el mismo en ambos proyectos y sólo debe existir en producción.
- `NEXT_PUBLIC_APP_URL`: `https://www.mipibo.com` en producción.

### Web pública

- `STRIPE_SECRET_KEY`: sólo producción para la cuenta real; usar una clave de prueba en un ambiente de prueba.
- `STRIPE_PAYMENT_LINK_ID`: identificador del enlace vigente.
- `STRIPE_WEBHOOK_SECRET`: firma del endpoint de Stripe.
- `PUBLIC_SITE_URL`: `https://www.estudiaargentina.com` en producción.
- `LMS_WEBHOOK_URL`: URL HTTPS del endpoint de compra del LMS.
- `WEBHOOK_SECRET`: debe coincidir con el LMS y no se expone al navegador.
- `VITE_DLOCAL_ENABLED`: `false` hasta completar una prueba de dLocal en sandbox.

Las claves reales nunca deben quedar en el repositorio, en una publicación de prueba, en una captura o en un ticket.

## Flujo de una compra

1. Stripe recibe el pago y firma el aviso.
2. La web verifica la firma, el Payment Link, el subtotal base de USD 180, la moneda y el estado pagado.
3. Los impuestos automáticos pueden aumentar el total; no deben hacer que se rechace un subtotal correcto.
4. La web envía al LMS un mensaje firmado.
5. El LMS guarda la compra una sola vez.
6. El LMS crea una matrícula activa o una invitación pagada.
7. El correo se envía con una clave de idempotencia estable.
8. Si Resend falla, la compra queda guardada y el aviso debe reintentarse.

## Pruebas antes de abrir ventas

- [ ] Compra de prueba con email nuevo.
- [ ] Aceptación de invitación, elección de contraseña y onboarding.
- [ ] Compra de prueba con email existente.
- [ ] Reenvío del mismo evento sin duplicar matrícula ni correo.
- [ ] Compra con impuesto automático.
- [ ] Método de pago que confirme de forma demorada.
- [ ] Fallo simulado de Resend y reintento.
- [ ] Chat privado y comunidad con cuenta de alumno y cuenta administradora.
- [ ] PDF privado con alumno autorizado y usuario sin matrícula.

Las pruebas reales con dinero, reembolsos, cambios de plan, rotación de claves, deploys y cargas a producción requieren autorización expresa.

## Recuperación de una entrega de correo

1. Buscar el evento por proveedor e identificador de evento.
2. Comprobar `access_status`, `email_status`, `email_attempts` y `email_last_error`.
3. Corregir el problema del remitente o del proveedor.
4. Reenviar el mismo evento del proveedor.
5. Confirmar que el estado termine en `sent`.

No crear una segunda compra y no borrar el evento original para forzar el reintento.

## Reembolsos y contracargos

El sistema todavía no revoca el acceso automáticamente. Antes de activar esa automatización hay que definir y aprobar:

- cuándo se revoca el acceso;
- si se conserva el progreso;
- qué ocurre con un reembolso parcial;
- qué mensaje recibe el alumno;
- quién revisa una disputa.

Hasta tomar esa decisión, cada reembolso requiere revisión manual y registro interno.

## Respaldos y alertas

- [ ] Elegir Supabase Pro o un procedimiento de respaldos frecuentes si se mantiene el plan gratuito.
- [ ] Respaldar la base y los archivos de Storage por separado.
- [ ] Guardar una copia fuera de `D:`.
- [ ] Configurar alertas para errores del webhook, fallos de Resend, errores de Vercel y eventos de Stripe sin entrega.
- [ ] Revisar semanalmente que el respaldo se pueda restaurar.

Una copia únicamente en la misma computadora no protege frente a una falla del disco.

## Puerta de publicación

Publicar sólo cuando exista evidencia de:

- código probado localmente;
- claves correctamente separadas por ambiente;
- compra completa comprobada;
- contenido y PDFs aprobados;
- páginas legales aprobadas;
- política de reembolso definida;
- respaldo y alertas configurados.
