-- Admins need to manage draft modules without making them visible to students.
alter policy modules_read_allowed
on public.modules
using (
  (select private.current_user_is_admin())
  or (
    is_published = true
    and (
      order_index = 0
      or (select private.current_user_is_enrolled())
    )
  )
);
