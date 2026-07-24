-- Chat readiness: enrollment-gated support chat and one moderated community room.
-- Data API exposure is explicit because public tables are no longer automatically
-- reachable in new Supabase projects.

-- Direct support messages are only useful while the student has active course
-- access. Keep this rule in RLS so a forged browser request cannot bypass it.
drop policy if exists messages_select_participant_or_admin on public.direct_messages;
drop policy if exists messages_insert_participant_or_admin on public.direct_messages;
drop policy if exists messages_mark_read_participant_or_admin on public.direct_messages;

revoke all on table public.direct_messages from anon, authenticated;
grant select on table public.direct_messages to authenticated;
grant insert (student_id, sender_id, message)
  on table public.direct_messages to authenticated;
grant update (read_at) on table public.direct_messages to authenticated;

create policy messages_select_active_participant_or_admin
on public.direct_messages for select to authenticated
using (
  (
    student_id = (select auth.uid())
    and (select private.current_user_is_enrolled())
  )
  or (
    (select private.current_user_is_admin())
  )
);

create policy messages_insert_active_participant_or_admin
on public.direct_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and read_at is null
  and (
    (
      student_id = (select auth.uid())
      and (select private.current_user_is_enrolled())
    )
    or (
      (select private.current_user_is_admin())
    )
  )
);

create policy messages_mark_read_active_participant_or_admin
on public.direct_messages for update to authenticated
using (
  sender_id <> (select auth.uid())
  and (
    (
      student_id = (select auth.uid())
      and (select private.current_user_is_enrolled())
    )
    or (
      (select private.current_user_is_admin())
    )
  )
)
with check (
  read_at is not null
  and sender_id <> (select auth.uid())
  and (
    (
      student_id = (select auth.uid())
      and (select private.current_user_is_enrolled())
    )
    or (
      (select private.current_user_is_admin())
    )
  )
);

-- The directory exposes only name, avatar and role. This SECURITY DEFINER helper
-- is required to evaluate both the actor and target enrollment across the RLS
-- boundaries on profiles/enrollments. It returns one boolean, lives outside the
-- exposed schema, fixes search_path and rejects unauthenticated/non-participant
-- actors before revealing whether a target participates in chat.
create or replace function private.current_user_can_view_chat_profile(
  target_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.profiles as actor
        where actor.id = (select auth.uid())
          and actor.role = 'admin'
      )
      or exists (
        select 1
        from public.enrollments as actor_enrollment
        where actor_enrollment.user_id = (select auth.uid())
          and actor_enrollment.payment_status = 'completed'
      )
    )
    and (
      exists (
        select 1
        from public.profiles as target
        where target.id = target_profile_id
          and target.role = 'admin'
      )
      or exists (
        select 1
        from public.enrollments as target_enrollment
        where target_enrollment.user_id = target_profile_id
          and target_enrollment.payment_status = 'completed'
      )
    );
$$;

revoke all on function private.current_user_can_view_chat_profile(uuid)
  from public, anon, authenticated;
grant execute on function private.current_user_can_view_chat_profile(uuid)
  to authenticated;

drop policy if exists profile_directory_read_authenticated on public.profile_directory;
create policy profile_directory_read_chat_participants
on public.profile_directory for select to authenticated
using ((select private.current_user_can_view_chat_profile(id)));

create table public.community_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid()
    references public.profile_directory(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  constraint community_messages_message_length check (
    length(trim(message)) between 1 and 2000
  )
);

create index community_messages_created_at_idx
  on public.community_messages (created_at desc);
create index community_messages_sender_id_idx
  on public.community_messages (sender_id);

alter table public.community_messages enable row level security;
revoke all on table public.community_messages from anon, authenticated;
grant select, delete on table public.community_messages to authenticated;
grant insert (sender_id, message)
  on table public.community_messages to authenticated;
grant select, insert, update, delete on table public.community_messages to service_role;

create policy community_messages_read_enrolled_or_admin
on public.community_messages for select to authenticated
using (
  (select private.current_user_is_enrolled())
  or (select private.current_user_is_admin())
);

create policy community_messages_send_as_self
on public.community_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    (select private.current_user_is_enrolled())
    or (select private.current_user_is_admin())
  )
);

create policy community_messages_admin_delete
on public.community_messages for delete to authenticated
using ((select private.current_user_is_admin()));

-- Realtime Postgres Changes honors the SELECT policies above. The conditional
-- blocks keep local resets and already-configured hosted projects idempotent.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'direct_messages'
    ) then
      alter publication supabase_realtime add table public.direct_messages;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'community_messages'
    ) then
      alter publication supabase_realtime add table public.community_messages;
    end if;
  end if;
end;
$$;
