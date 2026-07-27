-- Keep the privileged read needed for locked-module metadata outside the
-- exposed API schema. The public RPC remains the stable client contract, but
-- it now runs as the caller and delegates only the sanitized projection to
-- this private helper.

create or replace function private.get_course_modules_outline()
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

-- The private helper is callable only through the authenticated public
-- wrapper. It still checks auth.uid() in its query as defense in depth.
revoke all on function private.get_course_modules_outline() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.get_course_modules_outline() to authenticated;

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
security invoker
set search_path = ''
as $$
  select * from private.get_course_modules_outline();
$$;

revoke all on function public.get_course_modules_outline() from public, anon;
grant execute on function public.get_course_modules_outline() to authenticated;
