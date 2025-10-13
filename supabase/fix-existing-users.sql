-- Script para criar perfis para usuários que já existem mas não têm perfil

INSERT INTO public.profiles (id, name, email, plan, generations_used)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  au.email,
  'free' as plan,
  0 as generations_used
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos perfis foram criados
SELECT COUNT(*) as perfis_criados FROM public.profiles;
