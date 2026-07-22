-- Durable purchase provisioning and email delivery.
--
-- Provider callbacks can arrive more than once and can race with the buyer's
-- browser return. The database is the source of truth: one provider checkout
-- creates one event, one entitlement, and one delivery attempt at a time.

alter table private.purchase_events
  add column payment_id text,
  add column email text,
  add column full_name text,
  add column amount numeric(12, 2),
  add column amount_usd numeric(10, 2),
  add column currency text,
  add column access_status text not null default 'pending_account'
    check (access_status in ('pending_account', 'active', 'revoked')),
  add column email_kind text
    check (email_kind in ('invitation', 'course_ready')),
  add column email_status text not null default 'pending'
    check (email_status in ('pending', 'sending', 'sent', 'failed')),
  add column email_attempts integer not null default 0
    check (email_attempts >= 0),
  add column email_claimed_at timestamptz,
  add column email_sent_at timestamptz,
  add column email_provider_id text,
  add column email_last_error text,
  add column updated_at timestamptz not null default now();

create unique index purchase_events_provider_payment_unique
  on private.purchase_events (provider, payment_id)
  where payment_id is not null;

create index purchase_events_email_pending_idx
  on private.purchase_events (lower(email), received_at)
  where access_status = 'pending_account';

alter table public.invitations
  add column purchase_event_id uuid
    references private.purchase_events(id) on delete set null;

create unique index invitations_purchase_event_unique
  on public.invitations (purchase_event_id)
  where purchase_event_id is not null;

-- Record a verified provider payment. Existing users receive access
-- immediately. New users receive an invitation and complete account creation
-- before the paid entitlement is attached to their profile.
create or replace function public.provision_purchase(
  purchase_email text,
  purchase_full_name text,
  purchase_provider text,
  purchase_event_id text,
  purchase_payment_id text,
  purchase_amount numeric,
  purchase_amount_usd numeric,
  purchase_currency text,
  purchase_invitation_token_hash text,
  purchase_invitation_expires_at timestamptz,
  purchase_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(purchase_email));
  normalized_name text := nullif(trim(purchase_full_name), '');
  normalized_currency text := upper(trim(purchase_currency));
  resolved_user_id uuid;
  event_row private.purchase_events%rowtype;
  inserted_event boolean := false;
begin
  if purchase_provider is null
    or purchase_provider not in ('stripe', 'dlocal', 'manual') then
    raise exception 'unsupported payment provider';
  end if;

  if normalized_email is null
    or normalized_name is not null and length(normalized_name) > 120
    or purchase_event_id is null
    or purchase_payment_id is null
    or purchase_amount is null
    or purchase_amount_usd is null
    or purchase_currency is null
    or purchase_invitation_token_hash is null
    or purchase_invitation_expires_at is null
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(normalized_email) > 254
    or length(trim(purchase_event_id)) not between 1 and 200
    or length(trim(purchase_payment_id)) not between 1 and 200
    or purchase_amount < 0
    or purchase_amount_usd < 0
    or normalized_currency !~ '^[A-Z]{3}$'
    or length(purchase_invitation_token_hash) <> 64
    or purchase_invitation_expires_at <= now() then
    raise exception 'invalid purchase details';
  end if;

  select users.id into resolved_user_id
  from auth.users as users
  where lower(users.email) = normalized_email
  order by users.created_at
  limit 1;

  insert into private.purchase_events (
    provider,
    provider_event_id,
    payment_id,
    email,
    full_name,
    user_id,
    amount,
    amount_usd,
    currency,
    payload,
    status,
    access_status,
    email_kind
  )
  values (
    purchase_provider,
    trim(purchase_event_id),
    trim(purchase_payment_id),
    normalized_email,
    normalized_name,
    resolved_user_id,
    purchase_amount,
    purchase_amount_usd,
    normalized_currency,
    coalesce(purchase_payload, '{}'::jsonb),
    'received',
    case when resolved_user_id is null then 'pending_account' else 'active' end,
    case when resolved_user_id is null then 'invitation' else 'course_ready' end
  )
  on conflict (provider, provider_event_id) do nothing
  returning * into event_row;

  inserted_event := found;

  if not inserted_event then
    select * into event_row
    from private.purchase_events
    where provider = purchase_provider
      and provider_event_id = trim(purchase_event_id)
    for update;

    if event_row.payment_id is distinct from trim(purchase_payment_id)
      or lower(event_row.email) is distinct from normalized_email
      or event_row.currency is distinct from normalized_currency
      or event_row.amount is distinct from purchase_amount
      or event_row.amount_usd is distinct from purchase_amount_usd then
      raise exception 'purchase event conflict';
    end if;
  elsif resolved_user_id is not null then
    insert into public.enrollments (
      user_id,
      payment_provider,
      payment_id,
      payment_status,
      payment_method,
      amount_usd,
      amount_local,
      currency,
      enrolled_at
    )
    values (
      resolved_user_id,
      purchase_provider,
      trim(purchase_payment_id),
      'completed',
      'pibo_purchase',
      purchase_amount_usd,
      case when normalized_currency = 'USD' then null else purchase_amount end,
      normalized_currency,
      now()
    )
    on conflict (user_id) do update
      set payment_provider = excluded.payment_provider,
          payment_id = excluded.payment_id,
          payment_status = excluded.payment_status,
          payment_method = excluded.payment_method,
          amount_usd = excluded.amount_usd,
          amount_local = excluded.amount_local,
          currency = excluded.currency,
          enrolled_at = excluded.enrolled_at,
          updated_at = now();

    update private.purchase_events
    set status = 'processed',
        access_status = 'active',
        processed_at = now(),
        updated_at = now()
    where id = event_row.id
    returning * into event_row;
  elsif inserted_event then
    insert into public.invitations (
      email,
      full_name,
      token_hash,
      purchase_event_id,
      expires_at
    )
    values (
      normalized_email,
      normalized_name,
      purchase_invitation_token_hash,
      event_row.id,
      purchase_invitation_expires_at
    )
    on conflict (lower(email)) where accepted_at is null do update
      set full_name = coalesce(excluded.full_name, public.invitations.full_name),
          token_hash = excluded.token_hash,
          purchase_event_id = coalesce(
            public.invitations.purchase_event_id,
            excluded.purchase_event_id
          ),
          expires_at = greatest(public.invitations.expires_at, excluded.expires_at);

    update private.purchase_events
    set status = 'processed',
        processed_at = now(),
        updated_at = now()
    where id = event_row.id
    returning * into event_row;
  end if;

  return jsonb_build_object(
    'duplicate', not inserted_event,
    'access_status', event_row.access_status,
    'email_status', event_row.email_status,
    'email_kind', event_row.email_kind
  );
end;
$$;

-- Only one request can own an email delivery. Failed attempts and abandoned
-- claims are retryable when the payment provider replays its callback.
create or replace function public.claim_purchase_email(
  purchase_provider text,
  purchase_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row private.purchase_events%rowtype;
  claimed boolean := false;
begin
  update private.purchase_events
  set email_status = 'sending',
      email_attempts = email_attempts + 1,
      email_claimed_at = now(),
      email_last_error = null,
      updated_at = now()
  where provider = purchase_provider
    and provider_event_id = trim(purchase_event_id)
    and status = 'processed'
    and email_kind is not null
    and (
      email_status in ('pending', 'failed')
      or (
        email_status = 'sending'
        and email_claimed_at < now() - interval '10 minutes'
      )
    )
  returning * into event_row;

  claimed := found;

  if not claimed then
    select * into event_row
    from private.purchase_events
    where provider = purchase_provider
      and provider_event_id = trim(purchase_event_id);
  end if;

  if not found then
    raise exception 'purchase event not found';
  end if;

  return jsonb_build_object(
    'claimed', claimed,
    'email', event_row.email,
    'full_name', event_row.full_name,
    'email_kind', event_row.email_kind,
    'email_status', event_row.email_status,
    'access_status', event_row.access_status
  );
end;
$$;

create or replace function public.complete_purchase_email(
  purchase_provider text,
  purchase_event_id text,
  purchase_email_provider_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.purchase_events
  set email_status = 'sent',
      email_provider_id = nullif(trim(purchase_email_provider_id), ''),
      email_sent_at = now(),
      email_last_error = null,
      updated_at = now()
  where provider = purchase_provider
    and provider_event_id = trim(purchase_event_id)
    and email_status = 'sending';

  return found;
end;
$$;

create or replace function public.fail_purchase_email(
  purchase_provider text,
  purchase_event_id text,
  purchase_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.purchase_events
  set email_status = 'failed',
      email_last_error = left(coalesce(nullif(trim(purchase_error_code), ''), 'delivery_failed'), 80),
      updated_at = now()
  where provider = purchase_provider
    and provider_event_id = trim(purchase_event_id)
    and email_status = 'sending';

  return found;
end;
$$;

-- Purchased invitations attach the verified payment to the account. Manual
-- invitations retain their previous zero-cost enrollment behavior.
create or replace function public.accept_invitation(
  invitation_token_hash text,
  invited_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending public.invitations%rowtype;
  invited_email text;
  purchase private.purchase_events%rowtype;
begin
  select * into pending
  from public.invitations
  where token_hash = invitation_token_hash
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    return false;
  end if;

  select lower(email) into invited_email
  from auth.users
  where id = invited_user_id;

  if invited_email is null or invited_email <> lower(pending.email) then
    raise exception 'invitation email mismatch';
  end if;

  if pending.purchase_event_id is not null then
    select * into purchase
    from private.purchase_events
    where id = pending.purchase_event_id
      and lower(email) = invited_email
      and status = 'processed'
    for update;

    if not found then
      raise exception 'purchase event unavailable';
    end if;

    insert into public.enrollments (
      user_id,
      payment_provider,
      payment_id,
      payment_status,
      payment_method,
      amount_usd,
      amount_local,
      currency,
      enrolled_at
    )
    values (
      invited_user_id,
      purchase.provider,
      purchase.payment_id,
      'completed',
      'pibo_purchase',
      purchase.amount_usd,
      case when purchase.currency = 'USD' then null else purchase.amount end,
      purchase.currency,
      now()
    )
    on conflict (user_id) do update
      set payment_provider = excluded.payment_provider,
          payment_id = excluded.payment_id,
          payment_status = excluded.payment_status,
          payment_method = excluded.payment_method,
          amount_usd = excluded.amount_usd,
          amount_local = excluded.amount_local,
          currency = excluded.currency,
          enrolled_at = excluded.enrolled_at,
          updated_at = now();

    update private.purchase_events
    set user_id = invited_user_id,
        access_status = 'active',
        updated_at = now()
    where lower(email) = invited_email
      and status = 'processed'
      and access_status = 'pending_account';
  else
    insert into public.enrollments (
      user_id,
      payment_provider,
      payment_status,
      payment_method,
      amount_usd,
      currency,
      enrolled_at
    )
    values (
      invited_user_id,
      'manual',
      'completed',
      'invitation',
      0,
      'USD',
      now()
    )
    on conflict (user_id) do update
      set payment_provider = excluded.payment_provider,
          payment_status = excluded.payment_status,
          payment_method = excluded.payment_method,
          enrolled_at = excluded.enrolled_at,
          updated_at = now();
  end if;

  update public.invitations
  set accepted_by = invited_user_id,
      accepted_at = now()
  where id = pending.id;

  return true;
end;
$$;

revoke all on function public.provision_purchase(
  text, text, text, text, text, numeric, numeric, text, text, timestamptz, jsonb
) from public, anon, authenticated;
revoke all on function public.claim_purchase_email(text, text)
  from public, anon, authenticated;
revoke all on function public.complete_purchase_email(text, text, text)
  from public, anon, authenticated;
revoke all on function public.fail_purchase_email(text, text, text)
  from public, anon, authenticated;

-- Replaced by provision_purchase, which keeps account creation and email
-- delivery durable and retryable.
drop function public.fulfill_purchase(uuid, text, text, text, numeric, text, jsonb);

grant execute on function public.provision_purchase(
  text, text, text, text, text, numeric, numeric, text, text, timestamptz, jsonb
) to service_role;
grant execute on function public.claim_purchase_email(text, text) to service_role;
grant execute on function public.complete_purchase_email(text, text, text) to service_role;
grant execute on function public.fail_purchase_email(text, text, text) to service_role;
