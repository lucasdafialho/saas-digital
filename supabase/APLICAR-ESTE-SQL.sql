-- ============================================================================
-- SCRIPT DE CORREÇÃO E OTIMIZAÇÃO DO SISTEMA
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. REMOVER POLÍTICAS ANTIGAS E TRIGGERS CONFLITANTES
-- ============================================================================

DROP POLICY IF EXISTS "generations_insert_with_limits" ON public.generations;
DROP POLICY IF EXISTS "generations_select_own" ON public.generations;
DROP POLICY IF EXISTS "generations_no_update" ON public.generations;
DROP POLICY IF EXISTS "generations_no_delete" ON public.generations;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias gerações" ON public.generations;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias gerações" ON public.generations;

DROP TRIGGER IF EXISTS check_generation_limits_trigger ON public.generations;
DROP TRIGGER IF EXISTS check_generation_limit_trigger ON public.generations;
DROP FUNCTION IF EXISTS check_generation_limits();
DROP FUNCTION IF EXISTS check_and_increment_generation_limit();

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- 2. CRIAR POLÍTICAS RLS SIMPLIFICADAS E SEGURAS
-- ============================================================================

-- Políticas para GENERATIONS (simples e diretas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'generations' 
    AND policyname = 'generations_select_own'
  ) THEN
    CREATE POLICY "generations_select_own"
      ON public.generations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'generations' 
    AND policyname = 'generations_insert_own'
  ) THEN
    CREATE POLICY "generations_insert_own"
      ON public.generations FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- 3. CRIAR FUNÇÃO PARA VERIFICAR E INCREMENTAR LIMITES
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_increment_generation_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  monthly_limit INTEGER;
  current_month_count INTEGER;
  start_of_month TIMESTAMP;
BEGIN
  -- Obter plano do usuário
  SELECT plan INTO user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Se não encontrar o perfil, bloquear
  IF user_plan IS NULL THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado';
  END IF;

  -- Definir limite baseado no plano
  CASE user_plan
    WHEN 'free' THEN monthly_limit := 5;
    WHEN 'starter' THEN monthly_limit := 100;
    WHEN 'pro' THEN monthly_limit := 999999;
    ELSE monthly_limit := 0;
  END CASE;

  -- Calcular início do mês
  start_of_month := date_trunc('month', CURRENT_TIMESTAMP);

  -- Contar gerações do mês atual (incluindo a que está sendo inserida)
  SELECT COUNT(*) INTO current_month_count
  FROM public.generations
  WHERE user_id = NEW.user_id
    AND created_at >= start_of_month;

  -- Verificar se já atingiu o limite (antes de inserir)
  IF current_month_count >= monthly_limit THEN
    RAISE EXCEPTION 'Limite de % gerações mensais atingido para o plano %', monthly_limit, user_plan;
  END IF;

  -- Incrementar contador no perfil para tracking
  UPDATE public.profiles
  SET 
    generations_used = generations_used + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR TRIGGER PARA VERIFICAR LIMITES
-- ============================================================================

CREATE TRIGGER check_generation_limit_trigger
  BEFORE INSERT ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION check_and_increment_generation_limit();

-- 5. GARANTIR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices já existentes (verificar se estão criados)
CREATE INDEX IF NOT EXISTS idx_generations_user_month 
  ON public.generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_user_type
  ON public.generations(user_id, type);

CREATE INDEX IF NOT EXISTS idx_profiles_plan 
  ON public.profiles(plan);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status)
  WHERE status = 'active';

-- 6. FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- Função para resetar contadores mensais
CREATE OR REPLACE FUNCTION reset_monthly_generation_counters()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    generations_used = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE plan != 'pro';
  
  RAISE NOTICE 'Contadores mensais resetados com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de um usuário
CREATE OR REPLACE FUNCTION get_user_generation_stats(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  monthly_limit INTEGER,
  current_month_count BIGINT,
  remaining INTEGER,
  percentage NUMERIC
) AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_count BIGINT;
  v_start_of_month TIMESTAMP;
BEGIN
  SELECT profiles.plan INTO v_plan
  FROM public.profiles
  WHERE id = p_user_id;

  CASE v_plan
    WHEN 'free' THEN v_limit := 5;
    WHEN 'starter' THEN v_limit := 100;
    WHEN 'pro' THEN v_limit := -1;
    ELSE v_limit := 0;
  END CASE;

  v_start_of_month := date_trunc('month', CURRENT_TIMESTAMP);
  
  SELECT COUNT(*) INTO v_count
  FROM public.generations
  WHERE user_id = p_user_id
    AND created_at >= v_start_of_month;

  RETURN QUERY SELECT
    v_plan,
    v_limit,
    v_count,
    CASE 
      WHEN v_limit = -1 THEN -1
      ELSE GREATEST(0, v_limit - v_count::INTEGER)
    END,
    CASE 
      WHEN v_limit = -1 THEN 0
      ELSE LEAST(100, (v_count::NUMERIC / NULLIF(v_limit, 0) * 100))
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TESTAR O SISTEMA
-- ============================================================================

-- Para testar, execute:
-- SELECT * FROM get_user_generation_stats('SEU_USER_ID_AQUI');

-- Para resetar contadores manualmente:
-- SELECT reset_monthly_generation_counters();

-- 8. COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION check_and_increment_generation_limit() IS 
  'Verifica limites de geração baseado no plano do usuário e incrementa contador antes de inserir';

COMMENT ON FUNCTION reset_monthly_generation_counters() IS 
  'Reseta contadores de gerações mensais para todos os usuários (exceto Pro). Executar todo dia 1 do mês';

COMMENT ON FUNCTION get_user_generation_stats(UUID) IS 
  'Retorna estatísticas de geração do usuário incluindo limite, uso atual e percentual';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Teste gerando uma copy para ver se o sistema de limites funciona
-- 4. Os limites são: Free = 5/mês, Starter = 100/mês, Pro = ilimitado
-- ============================================================================

