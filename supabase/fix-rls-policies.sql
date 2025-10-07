-- Script para corrigir políticas RLS e garantir que tudo funcione
-- Execute este script no SQL Editor do Supabase

-- 1. DESABILITAR RLS TEMPORARIAMENTE (para debug)
-- Descomente as linhas abaixo se quiser desabilitar RLS temporariamente
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.generations DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Service role pode inserir perfis" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção de perfis via trigger" ON public.profiles;
DROP POLICY IF EXISTS "Permitir criação de perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;

-- 3. RECRIAR POLÍTICAS MAIS PERMISSIVAS
-- Permitir SELECT para usuários autenticados
CREATE POLICY "Permitir leitura de perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Permitir INSERT para usuários autenticados (necessário para o trigger)
CREATE POLICY "Permitir criação de perfil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permitir UPDATE para o próprio usuário
CREATE POLICY "Permitir atualização de perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies
WHERE tablename IN ('profiles', 'subscriptions', 'generations')
ORDER BY tablename, policyname;

-- 6. VERIFICAR SE O TRIGGER EXISTE
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 7. TESTAR SE CONSEGUE INSERIR (descomente para testar manualmente)
-- INSERT INTO public.profiles (id, email, name, plan, generations_used)
-- VALUES (
--   auth.uid(),
--   'teste@example.com',
--   'Teste',
--   'free',
--   0
-- );

-- 8. RESULTADO ESPERADO
-- Você deve ver 3 políticas para a tabela profiles:
-- - Permitir leitura de perfis (SELECT)
-- - Permitir criação de perfil (INSERT)
-- - Permitir atualização de perfil (UPDATE)
