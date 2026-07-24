-- Preserve historical chat identities for administrators while keeping the
-- student directory limited to current participants and administrators.
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
      or (
        exists (
          select 1
          from public.enrollments as actor_enrollment
          where actor_enrollment.user_id = (select auth.uid())
            and actor_enrollment.payment_status = 'completed'
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
        )
      )
    );
$$;

revoke all on function private.current_user_can_view_chat_profile(uuid)
  from public, anon, authenticated;
grant execute on function private.current_user_can_view_chat_profile(uuid)
  to authenticated;

-- The inbox selects the newest row per student with a stable UUID tie-breaker.
drop index if exists public.direct_messages_student_created_idx;
create index direct_messages_student_created_idx
  on public.direct_messages (student_id, created_at desc, id desc);

-- Only student-authored unread messages contribute to the administrator badge.
create index direct_messages_admin_unread_idx
  on public.direct_messages (student_id)
  where read_at is null and sender_id = student_id;

-- Build one bounded inbox page in Postgres instead of downloading every message
-- and repeatedly scanning the full result in the browser/server runtime.
create or replace function public.get_admin_conversation_summaries(
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  student_id uuid,
  student_name text,
  student_avatar text,
  last_message text,
  last_message_time timestamptz,
  last_message_id uuid,
  unread_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select private.current_user_is_admin())
  then
    raise exception 'admin access required'
      using errcode = '42501';
  end if;

  return query
  with latest_messages as (
    select distinct on (message.student_id)
      message.student_id,
      message.id,
      message.message,
      message.created_at
    from public.direct_messages as message
    order by
      message.student_id,
      message.created_at desc,
      message.id desc
  ),
  unread_counts as (
    select
      message.student_id,
      count(*)::bigint as unread_count
    from public.direct_messages as message
    where message.read_at is null
      and message.sender_id = message.student_id
    group by message.student_id
  )
  select
    latest.student_id,
    coalesce(student.full_name, 'Usuario') as student_name,
    student.avatar_url as student_avatar,
    latest.message as last_message,
    latest.created_at as last_message_time,
    latest.id as last_message_id,
    coalesce(unread.unread_count, 0::bigint) as unread_count
  from latest_messages as latest
  left join public.profile_directory as student
    on student.id = latest.student_id
  left join unread_counts as unread
    on unread.student_id = latest.student_id
  order by latest.created_at desc, latest.id desc
  limit least(greatest(coalesce(page_limit, 50), 1), 100)
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_conversation_summaries(integer, integer)
  from public, anon, authenticated;
grant execute on function public.get_admin_conversation_summaries(integer, integer)
  to authenticated;
