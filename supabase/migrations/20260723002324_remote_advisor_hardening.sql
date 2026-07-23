-- Defense in depth for internal tables. They are outside the exposed schema,
-- but RLS prevents accidental access if the API schema configuration changes.
alter table private.purchase_events enable row level security;
alter table private.api_rate_limits enable row level security;

-- Authenticated policies call only these two private helpers. Schema access is
-- required to resolve them, while every other private function stays blocked.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_user_is_admin() to authenticated;
grant execute on function private.current_user_is_enrolled() to authenticated;

-- Supporting indexes keep foreign-key checks and deletes fast as customer data grows.
create index purchase_events_user_id_idx
  on private.purchase_events (user_id);
create index announcements_created_by_idx
  on public.announcements (created_by);
create index direct_messages_sender_id_idx
  on public.direct_messages (sender_id);
create index invitations_accepted_by_idx
  on public.invitations (accepted_by);
create index invitations_invited_by_idx
  on public.invitations (invited_by);
create index modules_created_by_idx
  on public.modules (created_by);

-- These RPCs can honor the caller's RLS policies directly. The unread query
-- deliberately relies on the direct_messages SELECT policy instead of reaching
-- into the private helper schema with elevated privileges.
create or replace function public.get_unread_message_count()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.direct_messages as message
  where (select auth.uid()) is not null
    and message.sender_id <> (select auth.uid())
    and message.read_at is null;
$$;

grant update (read_at) on public.direct_messages to authenticated;

create policy messages_mark_read_participant_or_admin
on public.direct_messages for update to authenticated
using (
  sender_id <> (select auth.uid())
  and (
    student_id = (select auth.uid())
    or (select private.current_user_is_admin())
  )
)
with check (
  sender_id <> (select auth.uid())
  and (
    student_id = (select auth.uid())
    or (select private.current_user_is_admin())
  )
);

alter function public.mark_message_read(uuid) security invoker;

-- The course-outline RPC intentionally remains SECURITY DEFINER because it
-- returns sanitized metadata for locked modules without exposing video fields.
