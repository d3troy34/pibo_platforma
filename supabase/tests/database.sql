begin;

create extension if not exists pgtap with schema extensions;

select plan(92);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'profile_directory', 'chat-safe profile directory exists');
select has_table('public', 'community_messages', 'community messages table exists');
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
        'community_messages',
        'announcements'
      )
  ),
  'RLS is enabled on every public application table'
);

select ok(
  (
    select bool_and(class.relrowsecurity)
    from pg_class as class
    join pg_namespace as namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'private'
      and class.relname in ('purchase_events', 'api_rate_limits')
  ),
  'RLS is enabled on every private application table'
);

select is(
  (
    select count(*)
    from pg_indexes
    where schemaname in ('public', 'private')
      and indexname in (
        'purchase_events_user_id_idx',
        'announcements_created_by_idx',
        'direct_messages_sender_id_idx',
        'invitations_accepted_by_idx',
        'invitations_invited_by_idx',
        'modules_created_by_idx',
        'community_messages_created_at_idx',
        'community_messages_sender_id_idx'
      )
  ),
  8::bigint,
  'foreign-key columns have supporting indexes'
);
select ok(
  has_table_privilege('authenticated', 'public.community_messages', 'SELECT'),
  'authenticated users have an explicit Data API read grant for community messages'
);
select ok(
  has_table_privilege('authenticated', 'public.community_messages', 'INSERT'),
  'authenticated users have an explicit Data API insert grant for community messages'
);
select ok(
  has_table_privilege('authenticated', 'public.community_messages', 'DELETE'),
  'authenticated users have an explicit Data API delete grant for moderated community messages'
);
select ok(
  has_table_privilege('service_role', 'public.community_messages', 'SELECT, INSERT, UPDATE, DELETE'),
  'service role has an explicit Data API grant for community moderation tooling'
);
select ok(
  not has_table_privilege('authenticated', 'public.community_messages', 'UPDATE'),
  'community messages cannot be edited through the Data API'
);
select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ),
  'direct messages are published to Realtime'
);
select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ),
  'community messages are published to Realtime'
);

select ok(
  not (
    select procedure.prosecdef
    from pg_proc as procedure
    where procedure.oid = 'public.get_unread_message_count()'::regprocedure
  ),
  'unread count runs with the caller permissions'
);
select ok(
  not (
    select procedure.prosecdef
    from pg_proc as procedure
    where procedure.oid = 'public.mark_message_read(uuid)'::regprocedure
  ),
  'mark message read runs with the caller permissions'
);
select ok(
  (
    select procedure.prosecdef
    from pg_proc as procedure
    where procedure.oid = 'public.get_course_modules_outline()'::regprocedure
  ),
  'course outline keeps its intentional sanitized privileged read'
);
select ok(
  has_column_privilege('authenticated', 'public.direct_messages', 'read_at', 'UPDATE'),
  'authenticated users can update only the message read marker'
);
select ok(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated policies can resolve the private authorization helpers'
);
select ok(
  has_function_privilege(
    'authenticated',
    'private.current_user_is_admin()',
    'EXECUTE'
  ),
  'authenticated policies can execute the admin authorization helper'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'private.handle_new_user()',
    'EXECUTE'
  ),
  'authenticated users cannot execute private trigger functions'
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
select ok(
  has_function_privilege(
    'service_role',
    'public.provision_purchase(text,text,text,text,text,numeric,numeric,text,text,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'service role can provision verified purchases'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.provision_purchase(text,text,text,text,text,numeric,numeric,text,text,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'authenticated users cannot provision purchases'
);
select ok(
  has_function_privilege('service_role', 'public.claim_purchase_email(text,text)', 'EXECUTE'),
  'service role can claim a purchase email'
);
select ok(
  not has_function_privilege('authenticated', 'public.claim_purchase_email(text,text)', 'EXECUTE'),
  'authenticated users cannot claim purchase emails'
);
select ok(
  has_function_privilege('service_role', 'public.complete_purchase_email(text,text,text)', 'EXECUTE'),
  'service role can complete a purchase email'
);
select ok(
  not has_function_privilege('authenticated', 'public.complete_purchase_email(text,text,text)', 'EXECUTE'),
  'authenticated users cannot complete purchase emails'
);
select ok(
  has_function_privilege('service_role', 'public.fail_purchase_email(text,text,text)', 'EXECUTE'),
  'service role can fail a purchase email'
);
select ok(
  not has_function_privilege('authenticated', 'public.fail_purchase_email(text,text,text)', 'EXECUTE'),
  'authenticated users cannot fail purchase emails'
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
select is((select count(*) from public.profile_directory), 0::bigint, 'unenrolled students cannot read the chat directory');

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
  public.provision_purchase(
    'student-b@example.com',
    'Student B',
    'dlocal',
    'dlocal-session-1',
    'dlocal-payment-1',
    756000,
    180,
    'COP',
    encode(digest('existing-user-token', 'sha256'), 'hex'),
    now() + interval '7 days',
    '{"source":"test"}'::jsonb
  )->>'access_status',
  'active',
  'an existing buyer receives access immediately'
);

reset role;
select is(
  (select amount_usd from public.enrollments where user_id = '00000000-0000-0000-0000-000000000002'),
  180::numeric,
  'local-currency purchases retain the USD course value'
);
select is(
  (select amount_local from public.enrollments where user_id = '00000000-0000-0000-0000-000000000002'),
  756000::numeric,
  'local-currency purchases retain the charged local amount'
);

set local role service_role;
select is(
  public.claim_purchase_email('dlocal', 'dlocal-session-1')->>'claimed',
  'true',
  'the first worker claims purchase email delivery'
);
select is(
  public.claim_purchase_email('dlocal', 'dlocal-session-1')->>'claimed',
  'false',
  'a concurrent worker cannot claim the same email'
);
select is(
  public.fail_purchase_email('dlocal', 'dlocal-session-1', 'delivery_failed'),
  true,
  'a failed delivery is recorded'
);
select is(
  public.claim_purchase_email('dlocal', 'dlocal-session-1')->>'claimed',
  'true',
  'a failed delivery can be retried'
);
select is(
  public.complete_purchase_email('dlocal', 'dlocal-session-1', 'resend-1'),
  true,
  'a successful retry completes email delivery'
);
select is(
  public.claim_purchase_email('dlocal', 'dlocal-session-1')->>'email_status',
  'sent',
  'a sent email cannot be claimed again'
);

select is(
  public.provision_purchase(
    'new-buyer@example.com',
    'New Buyer',
    'stripe',
    'checkout-new-buyer',
    'payment-new-buyer',
    180,
    180,
    'USD',
    encode(digest('stable-purchase-token', 'sha256'), 'hex'),
    now() + interval '7 days',
    '{"source":"test"}'::jsonb
  )->>'access_status',
  'pending_account',
  'a new buyer receives a pending account entitlement'
);

reset role;
select is(
  (
    select count(*)
    from public.invitations
    where email = 'new-buyer@example.com'
      and purchase_event_id is not null
  ),
  1::bigint,
  'a new buyer receives one purchase invitation'
);
select is(
  (
    select count(*)
    from public.enrollments as enrollment
    join public.profiles as profile on profile.id = enrollment.user_id
    where profile.email = 'new-buyer@example.com'
  ),
  0::bigint,
  'no orphan enrollment is created before the account exists'
);

set local role service_role;
select is(
  public.provision_purchase(
    'new-buyer@example.com',
    'New Buyer',
    'stripe',
    'checkout-new-buyer',
    'payment-new-buyer',
    180,
    180,
    'USD',
    encode(digest('stable-purchase-token', 'sha256'), 'hex'),
    now() + interval '7 days',
    '{"source":"duplicate"}'::jsonb
  )->>'duplicate',
  'true',
  'replayed provider events are idempotent'
);

reset role;
select is(
  (select count(*) from public.invitations where email = 'new-buyer@example.com'),
  1::bigint,
  'a replay does not create another invitation'
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
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'new-buyer@example.com',
  crypt('Password1', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"New Buyer"}'::jsonb,
  now(),
  now()
);

set local role service_role;
select is(
  public.accept_invitation(
    encode(digest('stable-purchase-token', 'sha256'), 'hex'),
    '00000000-0000-0000-0000-000000000005'
  ),
  true,
  'accepting a purchase invitation activates paid access'
);

reset role;
select is(
  (
    select payment_id
    from public.enrollments
    where user_id = '00000000-0000-0000-0000-000000000005'
  ),
  'payment-new-buyer',
  'the activated enrollment retains its verified payment'
);
select is(
  (
    select access_status
    from private.purchase_events
    where provider = 'stripe' and provider_event_id = 'checkout-new-buyer'
  ),
  'active',
  'the purchase event records active access after account creation'
);

set local role service_role;
select is(
  public.accept_invitation(
    encode(digest('stable-purchase-token', 'sha256'), 'hex'),
    '00000000-0000-0000-0000-000000000005'
  ),
  false,
  'a purchase invitation cannot be accepted twice'
);
select throws_ok(
  $$
    select public.provision_purchase(
      'other-buyer@example.com',
      'Other Buyer',
      'stripe',
      'checkout-new-buyer',
      'payment-new-buyer',
      180,
      180,
      'USD',
      encode(digest('other-token', 'sha256'), 'hex'),
      now() + interval '7 days',
      '{}'::jsonb
    )
  $$,
  'P0001',
  'purchase event conflict',
  'a replay cannot change the verified buyer'
);

reset role;

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

insert into public.enrollments (
  user_id,
  payment_provider,
  payment_status,
  payment_method,
  amount_usd,
  currency
)
values (
  '00000000-0000-0000-0000-000000000001',
  'manual',
  'completed',
  'test',
  0,
  'USD'
);

insert into public.direct_messages (id, student_id, sender_id, message)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Private support reply'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Private support reply for Student B'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
select is((select count(*) from public.direct_messages), 0::bigint, 'another student cannot read private messages');
select is((select count(*) from public.community_messages), 0::bigint, 'unenrolled students cannot read the community');
select throws_ok(
  $$
    insert into public.direct_messages (student_id, sender_id, message)
    values (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000002',
      'Blocked private message'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "direct_messages"',
  'unenrolled students cannot send private messages'
);
select throws_ok(
  $$
    insert into public.community_messages (sender_id, message)
    values ('00000000-0000-0000-0000-000000000002', 'Blocked community message')
  $$,
  '42501',
  'new row violates row-level security policy for table "community_messages"',
  'unenrolled students cannot send community messages'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select is((select count(*) from public.profile_directory), 4::bigint, 'enrolled students can read chat identities');
select is((select count(*) from public.direct_messages), 1::bigint, 'message owner can read the conversation');
select is(public.get_unread_message_count(), 1, 'message owner sees the unread count');
select lives_ok(
  $$
    insert into public.direct_messages (id, student_id, sender_id, message)
    values (
      '10000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      'Private message from an enrolled student'
    )
  $$,
  'enrolled students can send private messages only as themselves'
);
select lives_ok(
  $$
    insert into public.community_messages (id, sender_id, message)
    values (
      '20000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      'Community message from an enrolled student'
    )
  $$,
  'enrolled students can send community messages only as themselves'
);
select is((select count(*) from public.community_messages), 1::bigint, 'enrolled students can read the community');
select lives_ok(
  $$select public.mark_message_read('00000000-0000-0000-0000-000000000000')$$,
  'marking an unknown message remains harmless'
);
select lives_ok(
  $$select public.mark_message_read('10000000-0000-0000-0000-000000000003')$$,
  'marking an own message remains harmless'
);
reset role;
select is(
  (select read_at from public.direct_messages where id = '10000000-0000-0000-0000-000000000003'),
  null,
  'students cannot mark their own messages as read'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.mark_message_read('10000000-0000-0000-0000-000000000002')$$,
  'marking another student message remains harmless'
);
reset role;
select is(
  (select read_at from public.direct_messages where id = '10000000-0000-0000-0000-000000000002'),
  null,
  'students cannot mark another student message as read'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select lives_ok(
  format(
    'select public.mark_message_read(%L)',
    (select id from public.direct_messages limit 1)
  ),
  'message owner can mark an incoming message as read'
);
select is(public.get_unread_message_count(), 0, 'marked message leaves the unread count');
delete from public.community_messages
where id = '20000000-0000-0000-0000-000000000001';
select is(
  (select count(*) from public.community_messages),
  1::bigint,
  'students cannot delete community messages'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select is((select count(*) from public.direct_messages), 3::bigint, 'admins can read every private conversation');
select is((select count(*) from public.community_messages), 1::bigint, 'admins can read every community message');
select lives_ok(
  $$delete from public.community_messages where id = '20000000-0000-0000-0000-000000000001'$$,
  'admins can moderate by deleting a community message'
);
select is((select count(*) from public.community_messages), 0::bigint, 'admin moderation removes the community message');

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

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
