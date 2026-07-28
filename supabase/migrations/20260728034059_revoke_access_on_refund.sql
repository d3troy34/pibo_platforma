-- Revoke course access as soon as a verified refund or dispute reaches the LMS.
-- The provider event remains idempotent because the purchase event and its
-- payment identifier are the durable lookup keys.

alter table private.purchase_events
  add column access_revoked_at timestamptz,
  add column access_revocation_reason text
    check (access_revocation_reason in ('refund', 'dispute', 'manual'));

create index purchase_events_revoked_idx
  on private.purchase_events (provider, payment_id)
  where access_status = 'revoked';

create or replace function public.revoke_purchase_access(
  revoke_provider text,
  revoke_event_id text,
  revoke_payment_id text,
  revoke_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row private.purchase_events%rowtype;
  enrollment_status text;
  normalized_provider text := lower(trim(revoke_provider));
  normalized_event_id text := nullif(trim(revoke_event_id), '');
  normalized_payment_id text := nullif(trim(revoke_payment_id), '');
  normalized_reason text := lower(trim(revoke_reason));
begin
  if normalized_provider is null
    or normalized_provider not in ('stripe', 'dlocal', 'manual')
    or normalized_event_id is null
    or length(normalized_event_id) > 200
    or normalized_payment_id is null
    or length(normalized_payment_id) > 200
    or normalized_reason is null
    or normalized_reason not in ('refund', 'dispute', 'manual') then
    raise exception 'invalid access revocation details';
  end if;

  select * into event_row
  from private.purchase_events
  where provider = normalized_provider
    and (
      provider_event_id = normalized_event_id
      or payment_id = normalized_payment_id
    )
  order by received_at desc
  limit 1
  for update;

  if not found then
    raise exception 'purchase event not found';
  end if;

  enrollment_status := case
    when normalized_reason = 'refund' then 'refunded'
    else 'revoked'
  end;

  update public.enrollments
  set payment_status = enrollment_status,
      updated_at = now()
  where payment_provider = normalized_provider
    and payment_id = event_row.payment_id
    and payment_status = 'completed';

  update private.purchase_events
  set access_status = 'revoked',
      access_revoked_at = coalesce(access_revoked_at, now()),
      access_revocation_reason = coalesce(access_revocation_reason, normalized_reason),
      updated_at = now()
  where id = event_row.id;

  return jsonb_build_object(
    'matched', true,
    'access_status', 'revoked',
    'payment_status', enrollment_status,
    'already_revoked', event_row.access_status = 'revoked'
  );
end;
$$;

revoke all on function public.revoke_purchase_access(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.revoke_purchase_access(text, text, text, text)
  to service_role;
