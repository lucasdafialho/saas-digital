-- Verificar configuração de email no Supabase
-- Execute este script no SQL Editor para ver as configurações atuais

-- Ver se há perfis criados
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Ver usuários e seus perfis
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at as user_created,
  p.id as profile_id,
  p.name,
  p.plan,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- Ver se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
