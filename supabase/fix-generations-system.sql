-- Script para corrigir o sistema de gerações e limites

-- 1. Remover políticas antigas que estão causando problemas
DROP POLICY IF EXISTS "generations_insert_with_limits" ON public.generations;
DROP POLICY IF EXISTS "generations_select_own" ON public.generations;
DROP POLICY IF EXISTS "generations_no_update" ON public.generations;
DROP POLICY IF EXISTS "generations_no_delete" ON public.generations;

-- 2. Remover trigger antigo que pode estar causando conflitos
DROP TRIGGER IF EXISTS check_generation_limits_trigger ON public.generations;
DROP FUNCTION IF EXISTS check_generation_limits();

-- 3. Criar políticas RLS simplificadas e funcionais
CREATE POLICY "generations_select_own"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "generations_insert_own"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Criar função para verificar e incrementar limites (mais robusta)
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

-- 5. Criar trigger para verificar limites antes de inserir
CREATE TRIGGER check_generation_limit_trigger
  BEFORE INSERT ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION check_and_increment_generation_limit();

-- 6. Criar função para resetar contadores mensais (útil para cron job)
CREATE OR REPLACE FUNCTION reset_monthly_generation_counters()
RETURNS void AS $$
BEGIN
  -- Resetar apenas para planos que não são Pro
  UPDATE public.profiles
  SET 
    generations_used = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE plan != 'pro';
  
  RAISE NOTICE 'Contadores mensais resetados com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar função helper para obter estatísticas de geração de um usuário
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
  -- Obter plano do usuário
  SELECT profiles.plan INTO v_plan
  FROM public.profiles
  WHERE id = p_user_id;

  -- Definir limite
  CASE v_plan
    WHEN 'free' THEN v_limit := 5;
    WHEN 'starter' THEN v_limit := 100;
    WHEN 'pro' THEN v_limit := -1;
    ELSE v_limit := 0;
  END CASE;

  -- Contar gerações do mês
  v_start_of_month := date_trunc('month', CURRENT_TIMESTAMP);
  
  SELECT COUNT(*) INTO v_count
  FROM public.generations
  WHERE user_id = p_user_id
    AND created_at >= v_start_of_month;

  -- Retornar estatísticas
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

-- 8. Garantir que a tabela profiles tem as políticas corretas para UPDATE
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 9. Comentários úteis
COMMENT ON FUNCTION check_and_increment_generation_limit() IS 'Verifica limites de geração e incrementa contador antes de inserir';
COMMENT ON FUNCTION reset_monthly_generation_counters() IS 'Reseta contadores mensais (executar todo dia 1 do mês)';
COMMENT ON FUNCTION get_user_generation_stats(UUID) IS 'Retorna estatísticas de geração do usuário';

