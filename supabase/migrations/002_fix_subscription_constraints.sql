-- Migration: Fix subscription constraints for UPSERT
-- Data: 2025-10-11
-- Descrição: Adiciona constraint única para evitar múltiplas subscriptions ativas por usuário

-- 1. Primeiro, limpar possíveis subscriptions duplicadas (manter apenas a mais recente)
WITH ranked_subs AS (
  SELECT id,
         user_id,
         status,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, status
           ORDER BY created_at DESC
         ) as rn
  FROM public.subscriptions
  WHERE status = 'active'
)
UPDATE public.subscriptions
SET status = 'cancelled'
WHERE id IN (
  SELECT id FROM ranked_subs WHERE rn > 1
);

-- 2. Adicionar constraint única para user_id + status quando status = 'active'
-- Isso permite apenas UMA subscription ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_unique_idx
ON public.subscriptions(user_id)
WHERE status = 'active';

-- 3. Adicionar comentário
COMMENT ON INDEX subscriptions_user_active_unique_idx IS
'Garante que cada usuário tenha apenas uma subscription ativa por vez';

-- 4. Adicionar índice adicional para payment_id (busca rápida em reembolsos)
CREATE INDEX IF NOT EXISTS subscriptions_payment_id_idx
ON public.subscriptions(mercadopago_payment_id)
WHERE mercadopago_payment_id IS NOT NULL;

COMMENT ON INDEX subscriptions_payment_id_idx IS
'Índice para buscar subscriptions por ID de pagamento do MercadoPago';

-- Rollback instructions (comentado):
-- Para reverter esta migration, execute:
/*
DROP INDEX IF EXISTS subscriptions_user_active_unique_idx;
DROP INDEX IF EXISTS subscriptions_payment_id_idx;
*/
