-- Pibo LMS v2 foundation
-- Fresh-project baseline for Postgres 17 / Supabase.
-- The legacy SQL files in this repository were intentionally consolidated
-- because they contained permissive policies and depended on missing history.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  country text,
  phone text,
  avatar_url text,
  role text not null default 'student'
    check (role in ('student', 'admin')),
  goal text,
  target_university text,
  target_arrival_date date,
  onboarding_completed_at timestamptz,
  notification_preferences jsonb not null default
    '{"email": true, "important_updates": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(trim(email)) > 3),
  constraint profiles_preferences_object check (
    jsonb_typeof(notification_preferences) = 'object'
  )
);

create unique index profiles_email_unique
  on public.profiles (lower(email));

-- Safe public-facing profile data for chat. PII remains in profiles.
create table public.profile_directory (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null check (role in ('student', 'admin')),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  thumbnail_url text,
  bunny_video_guid text,
  duration_seconds integer not null default 0
    check (duration_seconds >= 0),
  resources jsonb not null default '[]'::jsonb,
  order_index integer not null default 0
    check (order_index >= 0),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_title_not_blank check (length(trim(title)) > 0),
  constraint modules_slug_not_blank check (length(trim(slug)) > 0),
  constraint modules_resources_array check (jsonb_typeof(resources) = 'array')
);

create unique index modules_slug_unique on public.modules (lower(slug));
create unique index modules_order_unique on public.modules (order_index);
create index modules_published_order_idx
  on public.modules (order_index)
  where is_published = true;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  payment_provider text not null
    check (payment_provider in ('stripe', 'dlocal', 'manual')),
  payment_id text,
  payment_status text not null default 'completed'
    check (payment_status in ('pending', 'completed', 'failed', 'refunded', 'revoked')),
  amount_usd numeric(10, 2) not null default 0 check (amount_usd >= 0),
  currency text not null default 'USD',
  amount_local numeric(12, 2) check (amount_local is null or amount_local >= 0),
  payment_method text,
  country text,
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index enrollments_provider_payment_unique
  on public.enrollments (payment_provider, payment_id)
  where payment_id is not null;
create index enrollments_active_user_idx
  on public.enrollments (user_id)
  where payment_status = 'completed';

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create index module_progress_user_updated_idx
  on public.module_progress (user_id, updated_at desc);
create index module_progress_module_completed_idx
  on public.module_progress (module_id, completed);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  token_hash text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint invitations_email_not_blank check (length(trim(email)) > 3),
  constraint invitations_token_hash_length check (length(token_hash) = 64)
);

create unique index invitations_pending_email_unique
  on public.invitations (lower(email))
  where accepted_at is null;
create index invitations_expiry_idx
  on public.invitations (expires_at)
  where accepted_at is null;

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profile_directory(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint direct_messages_message_length check (
    length(trim(message)) between 1 and 4000
  )
);

create index direct_messages_student_created_idx
  on public.direct_messages (student_id, created_at desc);
create index direct_messages_unread_idx
  on public.direct_messages (student_id, created_at desc)
  where read_at is null;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general'
    check (category in ('general', 'documents', 'universities', 'life_in_argentina')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_length check (length(trim(title)) between 1 and 200),
  constraint announcements_content_not_blank check (length(trim(content)) > 0)
);

create index announcements_feed_idx
  on public.announcements (published_at desc)
  where is_active = true and published_at is not null;

-- Provider events and request throttling are deliberately outside the Data API.
create table private.purchase_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'dlocal', 'manual')),
  provider_event_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table private.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Internal helpers and triggers
-- ---------------------------------------------------------------------------

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.current_user_is_enrolled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments
    where user_id = (select auth.uid())
      and payment_status = 'completed'
  );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.sync_profile_directory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_directory (id, full_name, avatar_url, role, updated_at)
  values (new.id, new.full_name, new.avatar_url, new.role, now())
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    country
  )
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'country'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

create or replace function private.normalize_module_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progress_seconds := greatest(new.progress_seconds, 0);
  new.last_watched_at := now();
  new.updated_at := now();

  if new.completed and new.completed_at is null then
    new.completed_at := now();
  elsif not new.completed then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profiles_sync_directory
after insert or update of full_name, avatar_url, role on public.profiles
for each row execute function private.sync_profile_directory();

create trigger modules_set_updated_at
before update on public.modules
for each row execute function private.set_updated_at();

create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function private.set_updated_at();

create trigger module_progress_normalize
before insert or update on public.module_progress
for each row execute function private.normalize_module_progress();

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Narrow RPC surface
-- ---------------------------------------------------------------------------

create or replace function public.get_course_modules_outline()
returns table (
  id uuid,
  title text,
  description text,
  thumbnail_url text,
  order_index integer,
  is_published boolean,
  can_access boolean,
  is_locked boolean,
  has_video boolean,
  duration_seconds integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    module.id,
    module.title,
    module.description,
    module.thumbnail_url,
    module.order_index,
    module.is_published,
    (
      module.order_index = 0
      or private.current_user_is_enrolled()
      or private.current_user_is_admin()
    ) as can_access,
    not (
      module.order_index = 0
      or private.current_user_is_enrolled()
      or private.current_user_is_admin()
    ) as is_locked,
    module.bunny_video_guid is not null as has_video,
    module.duration_seconds
  from public.modules as module
  where (select auth.uid()) is not null
    and module.is_published = true
  order by module.order_index;
$$;

create or replace function public.get_unread_message_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.direct_messages as message
  where (select auth.uid()) is not null
    and message.sender_id <> (select auth.uid())
    and message.read_at is null
    and (
      message.student_id = (select auth.uid())
      or private.current_user_is_admin()
    );
$$;

create or replace function public.mark_message_read(message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  update public.direct_messages as message
  set read_at = coalesce(message.read_at, now())
  where message.id = message_id
    and message.sender_id <> (select auth.uid())
    and (
      message.student_id = (select auth.uid())
      or private.current_user_is_admin()
    );
end;
$$;

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

  update public.invitations
  set accepted_by = invited_user_id,
      accepted_at = now()
  where id = pending.id;

  return true;
end;
$$;

create or replace function public.fulfill_purchase(
  purchase_user_id uuid,
  purchase_provider text,
  purchase_event_id text,
  purchase_payment_id text,
  purchase_amount_usd numeric,
  purchase_currency text,
  purchase_payload jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row_id uuid;
begin
  if purchase_provider not in ('stripe', 'dlocal', 'manual') then
    raise exception 'unsupported payment provider';
  end if;

  insert into private.purchase_events (
    provider,
    provider_event_id,
    user_id,
    payload
  )
  values (
    purchase_provider,
    purchase_event_id,
    purchase_user_id,
    coalesce(purchase_payload, '{}'::jsonb)
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into event_row_id;

  if event_row_id is null then
    return false;
  end if;

  insert into public.enrollments (
    user_id,
    payment_provider,
    payment_id,
    payment_status,
    payment_method,
    amount_usd,
    currency,
    enrolled_at
  )
  values (
    purchase_user_id,
    purchase_provider,
    purchase_payment_id,
    'completed',
    'pibo_purchase',
    greatest(coalesce(purchase_amount_usd, 0), 0),
    coalesce(nullif(purchase_currency, ''), 'USD'),
    now()
  )
  on conflict (user_id) do update
    set payment_provider = excluded.payment_provider,
        payment_id = excluded.payment_id,
        payment_status = excluded.payment_status,
        payment_method = excluded.payment_method,
        amount_usd = excluded.amount_usd,
        currency = excluded.currency,
        enrolled_at = excluded.enrolled_at,
        updated_at = now();

  update private.purchase_events
  set status = 'processed',
      processed_at = now()
  where id = event_row_id;

  return true;
end;
$$;

create or replace function public.consume_rate_limit(
  limit_rate_key text,
  limit_request_count integer,
  limit_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if length(limit_rate_key) < 1
    or length(limit_rate_key) > 128
    or limit_request_count < 1
    or limit_request_count > 10000
    or limit_window_seconds < 1
    or limit_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into private.api_rate_limits as limits (
    rate_key,
    window_started_at,
    request_count,
    updated_at
  )
  values (limit_rate_key, now(), 1, now())
  on conflict (rate_key) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => limit_window_seconds)
        then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - make_interval(secs => limit_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    updated_at = now()
  returning limits.request_count <= limit_request_count into allowed;

  -- Keep the private table bounded without adding a separate scheduler.
  if random() < 0.01 then
    delete from private.api_rate_limits
    where updated_at < now() - interval '7 days';
  end if;

  return allowed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security and privileges
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_directory enable row level security;
alter table public.modules enable row level security;
alter table public.enrollments enable row level security;
alter table public.module_progress enable row level security;
alter table public.invitations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.announcements enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (
  full_name,
  country,
  phone,
  avatar_url,
  goal,
  target_university,
  target_arrival_date,
  onboarding_completed_at,
  notification_preferences
) on public.profiles to authenticated;

grant select on public.profile_directory to authenticated;
grant select on public.modules to authenticated;
grant insert, update, delete on public.modules to authenticated;
grant select on public.enrollments to authenticated;
grant insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.module_progress to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;

create policy profiles_select_self_or_admin
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy profiles_update_self_or_admin
on public.profiles for update to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_admin())
)
with check (
  id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy profile_directory_read_authenticated
on public.profile_directory for select to authenticated
using ((select auth.uid()) is not null);

create policy modules_read_allowed
on public.modules for select to authenticated
using (
  is_published = true
  and (
    order_index = 0
    or (select private.current_user_is_enrolled())
    or (select private.current_user_is_admin())
  )
);

create policy modules_admin_insert
on public.modules for insert to authenticated
with check ((select private.current_user_is_admin()));

create policy modules_admin_update
on public.modules for update to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy modules_admin_delete
on public.modules for delete to authenticated
using ((select private.current_user_is_admin()));

create policy enrollments_select_self_or_admin
on public.enrollments for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy enrollments_admin_insert
on public.enrollments for insert to authenticated
with check ((select private.current_user_is_admin()));

create policy enrollments_admin_update
on public.enrollments for update to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy enrollments_admin_delete
on public.enrollments for delete to authenticated
using ((select private.current_user_is_admin()));

create policy progress_select_self_or_admin
on public.module_progress for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy progress_insert_self
on public.module_progress for insert to authenticated
with check (user_id = (select auth.uid()));

create policy progress_update_self
on public.module_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy progress_delete_self
on public.module_progress for delete to authenticated
using (user_id = (select auth.uid()));

create policy invitations_admin_select
on public.invitations for select to authenticated
using ((select private.current_user_is_admin()));

create policy invitations_admin_insert
on public.invitations for insert to authenticated
with check ((select private.current_user_is_admin()));

create policy invitations_admin_update
on public.invitations for update to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy invitations_admin_delete
on public.invitations for delete to authenticated
using ((select private.current_user_is_admin()));

create policy messages_select_participant_or_admin
on public.direct_messages for select to authenticated
using (
  student_id = (select auth.uid())
  or (select private.current_user_is_admin())
);

create policy messages_insert_participant_or_admin
on public.direct_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    student_id = (select auth.uid())
    or (select private.current_user_is_admin())
  )
);

create policy announcements_read_published_or_admin
on public.announcements for select to authenticated
using (
  (
    is_active = true
    and published_at is not null
    and published_at <= now()
  )
  or (select private.current_user_is_admin())
);

create policy announcements_admin_insert
on public.announcements for insert to authenticated
with check (
  (select private.current_user_is_admin())
  and created_by = (select auth.uid())
);

create policy announcements_admin_update
on public.announcements for update to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy announcements_admin_delete
on public.announcements for delete to authenticated
using ((select private.current_user_is_admin()));

grant execute on function private.current_user_is_admin() to authenticated;
grant execute on function private.current_user_is_enrolled() to authenticated;
grant execute on function public.get_course_modules_outline() to authenticated;
grant execute on function public.get_unread_message_count() to authenticated;
grant execute on function public.mark_message_read(uuid) to authenticated;
grant execute on function public.accept_invitation(text, uuid) to service_role;
grant execute on function public.fulfill_purchase(
  uuid, text, text, text, numeric, text, jsonb
) to service_role;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Private resources are only read through short-lived signed URLs generated
-- by trusted server code. The browser receives no direct storage privileges.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-resources', 'lesson-resources', false, 20971520)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end;
$$;
