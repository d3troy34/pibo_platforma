# Pibo LMS

Plataforma privada de aprendizaje de Pibo. Incluye acceso gratuito y pago a clases, progreso, mensajería, novedades y administración de contenido.

Los videos no viven en este repositorio: se reproducen desde Bunny.net Stream usando el GUID guardado en cada módulo.

## Requisitos

- Node.js 20.9+, 22 o 24+
- npm
- Docker Desktop
- Supabase CLI
- Una biblioteca de Bunny.net Stream
- Resend para emails transaccionales

## Desarrollo local

Instalá las versiones exactas del lockfile:

```bash
npm ci
```

Levantá Supabase y aplicá la base desde cero:

```bash
supabase start
supabase db reset --local --yes
```

El entorno local usa puertos `553xx` para no chocar con otros proyectos. Copiá `.env.example` a `.env.local` y completá las credenciales que muestra Supabase. Después:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Verificación

Antes de entregar cambios:

```bash
npm run check
supabase db lint --local --level warning --fail-on warning
supabase test db --local supabase/tests/database.sql
npm run build
```

Las pruebas de base validan permisos, privacidad entre alumnos, invitaciones de un solo uso, compras repetidas y límites reales de intentos.

## Variables de entorno

No guardes valores privados en Git. La lista vigente está en `.env.example`.

Variables visibles por el navegador:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID`
- `NEXT_PUBLIC_APP_URL`

Variables exclusivas del servidor:

- `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY` sólo para proyectos antiguos)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `WEBHOOK_SECRET`

## Base nueva y migración de clientes

La fuente de verdad es `supabase/migrations/20260722190106_pibo_v2_foundation.sql`. No hay que reconstruir producción copiando SQL histórico ni arrancar con una base vacía si ya existen clientes.

Para pasar a un proyecto remoto nuevo, el orden seguro es:

1. Obtener un respaldo del proyecto anterior, incluidos usuarios de Auth.
2. Crear el proyecto nuevo y aplicar la migración base.
3. Importar perfiles, inscripciones, módulos, progreso, mensajes y novedades mediante un script revisado.
4. Conservar los GUID existentes de Bunny.net; no volver a subir ni recrear los videos.
5. Migrar usuarios de Auth y comprobar cómo se conservarán las contraseñas y sesiones.
6. Hacer una prueba con una copia, comparar cantidades y recién después cambiar producción.

El proyecto remoto nuevo todavía no fue creado ni recibió datos. Esto es intencional: primero hace falta acceso al respaldo anterior y confirmar el costo del proyecto nuevo.

## Servicios externos

- **Supabase**: autenticación, base de datos, reglas de acceso, archivos y tiempo real.
- **Bunny.net Stream**: videos de las clases.
- **Resend**: emails de registro, recuperación e invitación.

El recorrido completo desde el pago hasta el acceso está documentado en [docs/purchase-bridge.md](docs/purchase-bridge.md).
