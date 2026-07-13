# Pibo LMS

Plataforma privada de aprendizaje de Pibo. Incluye autenticacion, acceso gratuito y pago a modulos, seguimiento de progreso, mensajeria, anuncios y administracion de contenido.

## Requisitos

- Node.js 20, 22 o 24 o superior, junto con npm. Las versiones 21 y 23 no son compatibles con las herramientas de prueba.
- Un proyecto Supabase compatible con las tablas y politicas esperadas por la aplicacion.
- Bunny Stream para reproducir videos.
- Resend para los correos de registro, recuperacion e invitacion.

## Preparacion local

Instala exactamente las versiones del lockfile:

```bash
npm ci
```

Configura las variables necesarias en `.env.local` y levanta el servidor:

```bash
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Verificacion

Ejecuta todas las puertas locales antes de entregar un cambio:

```bash
npm run check
```

Este comando comprueba tipos, ejecuta las pruebas y corre el linter. Para generar la version publicable, con las variables configuradas:

```bash
npm run build
```

## Variables de entorno

No guardes valores privados en Git. Consulta `.env.example` y configura únicamente los valores del entorno correspondiente.

Variables visibles por el navegador:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID`
- `NEXT_PUBLIC_APP_URL`

Variables exclusivas del servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `WEBHOOK_SECRET`

`.env.example` también conserva variables de proveedores de pago y de Bunny que el código actual no consume directamente. Confirma el flujo de compra antes de depender de ellas o eliminarlas.

## Servicios externos

- **Supabase**: autenticacion, base de datos, reglas de acceso, archivos y tiempo real.
- **Bunny Stream**: videos de los modulos.
- **Resend**: correos transaccionales.

El estado del backend remoto todavía no fue identificado. No asumas que está activo ni que coincide con los archivos SQL del repositorio.

## Base de datos

No ejecutes `supabase/schema.sql` a ciegas sobre un proyecto remoto. El archivo es una referencia historica y puede diferir del estado desplegado.

Antes de aplicar cualquier archivo de `supabase/migrations/`:

1. Confirma el proyecto remoto correcto y crea un respaldo.
2. Compara su esquema, funciones y reglas de acceso con el repositorio.
3. Prueba las migraciones sobre una base desechable.
4. Aplica en remoto sólo los cambios revisados y en el orden acordado.
