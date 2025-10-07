-- SOLUÇÃO TEMPORÁRIA: Desabilitar RLS para testar
-- ⚠️ USE APENAS EM DESENVOLVIMENTO!
-- ⚠️ NÃO USE EM PRODUÇÃO!

-- Desabilitar RLS em todas as tabelas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'subscriptions', 'generations');

-- Resultado esperado: rowsecurity = false para todas as tabelas
