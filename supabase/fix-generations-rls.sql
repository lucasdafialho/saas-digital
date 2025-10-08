-- ============================================================================
-- CORRIGIR POLÍTICAS RLS DA TABELA GENERATIONS
-- ============================================================================

-- Desabilitar RLS temporariamente para permitir inserts do service role
ALTER TABLE public.generations DISABLE ROW LEVEL SECURITY;

-- OU criar política que permite service role inserir para qualquer usuário
-- (Mantenha RLS ativado mas permita admin)

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "generations_select_own" ON public.generations;
DROP POLICY IF EXISTS "generations_insert_own" ON public.generations;
DROP POLICY IF EXISTS "Service role can insert" ON public.generations;
DROP POLICY IF EXISTS "Users can select own generations" ON public.generations;

-- Política para SELECT: usuários veem apenas suas gerações
CREATE POLICY "Users can select own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: permite service role (backend) inserir para qualquer user
CREATE POLICY "Service role can insert"
  ON public.generations FOR INSERT
  WITH CHECK (true);

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'generations';
