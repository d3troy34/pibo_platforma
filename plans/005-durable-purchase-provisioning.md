# Plan 005: Hacer durable y atómico el alta por compra

> BLOQUEADO. Requiere el plan 004, el proyecto Supabase activo y coordinación
> con Pagina web/plans/005-durable-provider-webhooks.md.
>
> Drift check: git diff --stat 172d95b..HEAD -- app/api/webhooks/purchase app/api/auth/accept-invitation supabase lib/email-templates.ts

## Estado

- Estado: BLOCKED (depende de Supabase y del plan web 005)
- Prioridad: P1
- Esfuerzo: L
- Riesgo: HIGH
- Depende de: 004 y plan web 005
- Categoría: pagos y consistencia
- Planeado en: 172d95b, 2026-07-13

## Por qué importa

El webhook puede responder éxito aunque falle el upsert de enrollment. Al crear
un usuario, también continúa hacia correo tras una inscripción fallida.
accept-invitation hace lo mismo. Stripe hoy depende de que el cliente visite
Success y no cubre reembolsos.

## Evidencia local

- app/api/webhooks/purchase/route.ts:90-106 ignora error de upsert existente.
- :122-123 busca email dentro de una sola página de listUsers.
- :164-178 registra error de enrollment pero continúa.
- app/api/auth/accept-invitation/route.ts:69-94 continúa tras error y consume la
  invitación.
- migration 010 crea unicidad de payment_id y user_id, pero los handlers
  ocultan conflictos.

## Alcance futuro

- tabla de eventos/fulfillment con unicidad proveedor + ID;
- estados durable y reintentos;
- operación transaccional para perfil/enrollment/invitación cuando aplique;
- correo posterior al commit, reintentable;
- manejo acordado de reembolso/disputa;
- webhook LMS que sólo responde éxito después del commit;
- observabilidad sin email o cuerpos sensibles;
- pruebas concurrentes e idempotencia.

## Pasos futuros

1. Confirmar esquema remoto y constraints reales.
2. Definir política de negocio para reembolso y acceso manual.
3. Añadir pruebas de compra válida, repetida, concurrente, impaga, fallo DB,
   correo fallido e invitación repetida.
4. Crear migración y función/RPC transaccional con autorización estricta.
5. Cambiar handlers para distinguir error temporal, permanente y éxito.
6. Enviar correo sólo después de acceso confirmado.
7. Integrar eventos firmados de Stripe/dLocal del plan web.
8. Probar en sandbox y rama Supabase.

## Criterios futuros

- [ ] una compra produce como máximo una inscripción.
- [ ] HTTP 2xx significa acceso durable confirmado.
- [ ] error DB no envía bienvenida ni consume invitación.
- [ ] correo fallido no revierte acceso pero queda reintentable.
- [ ] reembolso sigue la política aprobada.
- [ ] pruebas concurrentes pasan.

## STOP

- backend ambiguo/INACTIVE;
- falta sandbox;
- esquema remoto difiere;
- no hay decisión sobre reembolsos;
- el cambio exige tocar producción directamente.
