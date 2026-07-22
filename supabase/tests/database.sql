begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'profile_directory', 'chat-safe profile directory exists');
select has_table('private', 'purchase_events', 'purchase events stay outside the Data API');
select has_table('private', 'api_rate_limits', 'rate limits stay outside the Data API');

select ok(
  (
    select bool_and(class.relrowsecurity)
    from pg_class as class
    join pg_namespace as namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname in (
        'profiles',
        'profile_directory',
        'modules',
        'enrollments',
        'module_progress',
        'invitations',
        'direct_messages',
        'announcements'
      )
  ),
  'RLS is enabled on every public application table'
);

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_directory'
      and column_name in ('email', 'phone', 'country')
  ),
  0::bigint,
  'profile directory contains no contact data'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'authenticated users cannot update roles'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'authenticated users can update their own name'
);
select ok(
  has_function_privilege('service_role', 'public.accept_invitation(text,uuid)', 'EXECUTE'),
  'service role can accept invitations'
);
select ok(
  not has_function_privilege('authenticated', 'public.accept_invitation(text,uuid)', 'EXECUTE'),
  'authenticated users cannot call the invitation fulfillment RPC'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.fulfill_purchase(uuid,text,text,text,numeric,text,jsonb)',
    'EXECUTE'
  ),
  'service role can fulfill purchases'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.fulfill_purchase(uuid,text,text,text,numeric,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated users cannot fulfill purchases'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.consume_rate_limit(text,integer,integer)',
    'EXECUTE'
  ),
  'service role can consume rate limits'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.consume_rate_limit(text,integer,integer)',
    'EXECUTE'
  ),
  'authenticated users cannot bypass the server rate-limit RPC'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'student-a@example.com',
    crypt('Password1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Student A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'student-b@example.com',
    crypt('Password1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Student B"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('Password1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'invited@example.com',
    crypt('Password1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Invited Student"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000003';

select is((select count(*) from public.profiles), 4::bigint, 'auth trigger creates profiles');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is((select count(*) from public.profiles), 1::bigint, 'students only see their own private profile');
select is((select count(*) from public.profile_directory), 4::bigint, 'students can read the safe chat directory');

reset role;

insert into public.modules (id, slug, title, order_index, is_published, duration_seconds)
values
  ('10000000-0000-0000-0000-000000000001', 'open-class', 'Open class', 0, true, 600),
  ('10000000-0000-0000-0000-000000000002', 'paid-class', 'Paid class', 1, true, 600);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.get_course_modules_outline()),
  2::bigint,
  'course outline lists locked classes without leaking their content'
);
select is(
  (select count(*) from public.get_course_modules_outline() where can_access),
  1::bigint,
  'an unenrolled student can access only the open class'
);

reset role;
set local role service_role;

select is(
  public.consume_rate_limit('test-endpoint', 2, 60),
  true,
  'first request is allowed'
);
select is(
  public.consume_rate_limit('test-endpoint', 2, 60),
  true,
  'request at the limit is allowed'
);
select is(
  public.consume_rate_limit('test-endpoint', 2, 60),
  false,
  'request beyond the limit is rejected'
);

select is(
  public.fulfill_purchase(
    '00000000-0000-0000-0000-000000000001',
    'stripe',
    'event-1',
    'payment-1',
    180,
    'USD',
    '{"source":"test"}'::jsonb
  ),
  true,
  'first purchase event grants access'
);
select is(
  public.fulfill_purchase(
    '00000000-0000-0000-0000-000000000001',
    'stripe',
    'event-1',
    'payment-1',
    180,
    'USD',
    '{"source":"duplicate"}'::jsonb
  ),
  false,
  'duplicate purchase event is ignored'
);

reset role;
select is(
  (select count(*) from public.enrollments where user_id = '00000000-0000-0000-0000-000000000001'),
  1::bigint,
  'duplicate purchase creates only one enrollment'
);

insert into public.invitations (email, token_hash, expires_at)
values ('invited@example.com', encode(digest('raw-test-token', 'sha256'), 'hex'), now() + interval '1 day');

set local role service_role;
select is(
  public.accept_invitation(
    encode(digest('raw-test-token', 'sha256'), 'hex'),
    '00000000-0000-0000-0000-000000000004'
  ),
  true,
  'valid invitation grants access'
);
select is(
  public.accept_invitation(
    encode(digest('raw-test-token', 'sha256'), 'hex'),
    '00000000-0000-0000-0000-000000000004'
  ),
  false,
  'an invitation cannot be accepted twice'
);

reset role;
select is(
  (
    select accepted_by
    from public.invitations
    where email = 'invited@example.com'
  ),
  '00000000-0000-0000-0000-000000000004'::uuid,
  'accepted invitation records the correct user'
);

insert into public.direct_messages (student_id, sender_id, message)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Private support reply'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.direct_messages), 0::bigint, 'another student cannot read private messages');

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select count(*) from public.direct_messages), 1::bigint, 'message owner can read the conversation');

select throws_ok(
  $$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table profiles',
  'students cannot promote themselves'
);
select lives_ok(
  $$update public.profiles set full_name = 'Updated Student' where id = '00000000-0000-0000-0000-000000000001'$$,
  'students can update an allowed field on their own profile'
);

reset role;
select is(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  'Updated Student',
  'allowed profile update is persisted'
);

select * from finish();
rollback;
