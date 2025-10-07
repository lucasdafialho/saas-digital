-- Melhorias nas políticas RLS para maior segurança

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias assinaturas" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias gerações" ON public.generations;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias gerações" ON public.generations;

-- Políticas mais seguras para profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Apenas permite atualizar campos específicos
      -- plan não pode ser alterado diretamente pelo usuário
      OLD.plan = NEW.plan
      AND OLD.id = NEW.id
      AND OLD.email = NEW.email
      AND OLD.created_at = NEW.created_at
    )
  );

CREATE POLICY "profiles_insert_on_signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas mais seguras para subscriptions
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE profiles.id = subscriptions.user_id
    )
  );

-- Apenas service role pode inserir/atualizar assinaturas
CREATE POLICY "subscriptions_no_direct_insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "subscriptions_no_direct_update"
  ON public.subscriptions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "subscriptions_no_direct_delete"
  ON public.subscriptions FOR DELETE
  USING (false);

-- Políticas mais seguras para generations
CREATE POLICY "generations_select_own"
  ON public.generations FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "generations_insert_with_limits"
  ON public.generations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid()
      AND (
        -- Free: máximo 5 gerações por mês
        (plan = 'free' AND generations_used < 5)
        -- Starter: máximo 100 gerações por mês
        OR (plan = 'starter' AND generations_used < 100)
        -- Pro: ilimitado
        OR plan = 'pro'
      )
    )
  );

CREATE POLICY "generations_no_update"
  ON public.generations FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "generations_no_delete"
  ON public.generations FOR DELETE
  USING (false);

-- Função para verificar limites antes de inserir
CREATE OR REPLACE FUNCTION check_generation_limits()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  user_generations INTEGER;
  monthly_limit INTEGER;
  start_of_month TIMESTAMP;
BEGIN
  -- Obter plano do usuário
  SELECT plan, generations_used INTO user_plan, user_generations
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Definir limite baseado no plano
  CASE user_plan
    WHEN 'free' THEN monthly_limit := 5;
    WHEN 'starter' THEN monthly_limit := 100;
    WHEN 'pro' THEN monthly_limit := 999999; -- Praticamente ilimitado
    ELSE monthly_limit := 0;
  END CASE;

  -- Calcular início do mês
  start_of_month := date_trunc('month', CURRENT_TIMESTAMP);

  -- Contar gerações do mês atual
  SELECT COUNT(*) INTO user_generations
  FROM public.generations
  WHERE user_id = NEW.user_id
    AND created_at >= start_of_month;

  -- Verificar limite
  IF user_generations >= monthly_limit THEN
    RAISE EXCEPTION 'Limite de gerações mensais atingido para o plano %', user_plan;
  END IF;

  -- Incrementar contador no perfil
  UPDATE public.profiles
  SET generations_used = generations_used + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para verificar limites
DROP TRIGGER IF EXISTS check_generation_limits_trigger ON public.generations;
CREATE TRIGGER check_generation_limits_trigger
  BEFORE INSERT ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION check_generation_limits();

-- Função para verificar expiração de assinaturas
CREATE OR REPLACE FUNCTION check_subscription_expiration()
RETURNS void AS $$
BEGIN
  -- Marcar assinaturas expiradas
  UPDATE public.subscriptions
  SET status = 'expired',
      updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;

  -- Downgrade usuários com assinaturas expiradas
  UPDATE public.profiles
  SET plan = 'free',
      updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT user_id 
    FROM public.subscriptions
    WHERE status = 'expired'
      AND updated_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_generations_user_month 
  ON public.generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expiration 
  ON public.subscriptions(expires_at, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_plan 
  ON public.profiles(plan);

-- Configurar job para verificar expirações (executar via cron ou trigger)
-- SELECT cron.schedule('check-expired-subscriptions', '0 * * * *', 'SELECT check_subscription_expiration();');
