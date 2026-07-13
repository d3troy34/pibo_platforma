# Plan 002: Corregir redirects de login y recuperación

> Executor: no cambies contratos de Supabase Auth ni envíes correos reales.
> El revisor mantiene el índice.
>
> Drift check: git diff --stat 172d95b..HEAD -- components/auth/login-form.tsx middleware.ts app/auth/confirm/route.ts lib/navigation.ts lib/navigation.test.ts

## Estado

- Estado: DONE (`35e136a`)
- Prioridad: P1
- Esfuerzo: S
- Riesgo: LOW
- Depende de: 001
- Categoría: seguridad y bug
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

Login toma redirect directamente de la URL y lo entrega a router.push. Debe
aceptar sólo rutas internas para no convertir el login en un salto hacia un
sitio externo o un esquema peligroso.

Al mismo tiempo, middleware considera /update-password una página de login y
expulsa al usuario autenticado que acaba de validar su enlace de recuperación.
Eso puede bloquear altas y recuperación de contraseña.

## Estado actual

    // components/auth/login-form.tsx:38 y 90
    const redirectTo = searchParams.get("redirect") || "/curso"
    router.push(redirectTo)

    // middleware.ts:44 y 71
    const authRoutes = ["/login", "/register", "/reset-password", "/update-password"]
    if (isAuthRoute) return NextResponse.redirect(...)

La ruta app/auth/confirm intercambia el token y redirige a /update-password, por
lo que esa página necesita conservar la sesión recuperada.

## Comandos

- npm test -- lib/navigation.test.ts
- npm run typecheck
- npm run lint
- npm run check
- npm run build con variables temporales

## Alcance

En alcance:

- lib/navigation.ts, crear
- lib/navigation.test.ts, crear
- components/auth/login-form.tsx
- middleware.ts
- app/auth/confirm/route.ts

Fuera de alcance:

- Supabase, RLS y rutas API de auth distintas de app/auth/confirm
- diseño de formularios
- política de contraseñas
- correos

## Pasos

### 1. Crear normalizador de destino interno

- Implementa getSafeInternalPath(value, fallback).
- Acepta sólo paths relativos al mismo sitio que comienzan con una barra.
- Rechaza doble barra, barra invertida, esquemas, host, credenciales y valores
  que no puedan analizarse.
- Conserva query y fragmento válidos.
- Devuelve fallback para null, vacío o inválido.

Verifica con tests:

- /curso y /curso?id=1 pasan;
- https://otro, //otro, javascript:, backslash y vacío vuelven al fallback.

### 2. Usarlo en login

- Calcula redirectTo con getSafeInternalPath.
- Mantén /curso como fallback.
- No agregues listas de dominios ni expresiones parciales.

Verifica: no queda router.push con un search param sin normalizar.

### 2b. Reutilizarlo al confirmar el correo

- Sustituye la validacion local de `next` en app/auth/confirm/route.ts por
  getSafeInternalPath.
- Conserva /curso como fallback y no cambies verifyOtp ni el contrato de
  Supabase.
- Cubre especificamente `/\\otro.example`: el parser de URL puede tratar esa
  barra invertida como separador de host y no debe producir un redirect externo.

Verifica: login y confirm usan una sola implementacion para validar destinos.

### 3. Permitir recuperación de contraseña

- Quita /update-password de authRoutes.
- Trátala como protegida: sin usuario debe ir a login; con la sesión creada por
  confirm debe permanecer en la página.
- Mantén login/register/reset-password redirigiendo a usuarios ya autenticados.

Verifica manualmente con mocks o una prueba de clasificación de rutas.

## Criterios

- [ ] destinos externos o peligrosos son rechazados.
- [ ] la confirmacion de correo tampoco acepta destinos con barra invertida.
- [ ] /update-password no expulsa una sesión válida.
- [ ] una visita sin sesión no entra a /update-password.
- [ ] npm run check y build pasan.
- [ ] sólo se modifican archivos en alcance.

## STOP

- app/auth/confirm no crea una sesión antes de redirigir.
- Supabase requiere que update-password permanezca pública sin sesión.
- La solución necesita cambiar plantillas de correo o URLs remotas.

## Mantenimiento

Toda futura lectura de redirect/next desde query debe usar el mismo helper.
