-- Migration: Adicionar rastreamento de webhooks e melhorias nas tabelas
-- Data: 2025-10-10
-- Descrição: Adiciona tabela de webhook_events e novas colunas em profiles e subscriptions

-- 1. Adicionar novas colunas na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS last_payment_id text;

-- 2. Adicionar novas colunas na tabela subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS mercadopago_payment_id text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10, 2);

-- 3. Criar tabela de histórico de webhooks (para evitar duplicados)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payment_id text,
  status text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS webhook_events_webhook_id_idx ON public.webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_events_payment_id_idx ON public.webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx ON public.webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON public.webhook_events(status);

-- 5. Comentários nas tabelas/colunas para documentação
COMMENT ON TABLE public.webhook_events IS 'Histórico de webhooks recebidos do MercadoPago para evitar processamento duplicado';
COMMENT ON COLUMN public.webhook_events.webhook_id IS 'ID único do webhook gerado pela aplicação';
COMMENT ON COLUMN public.webhook_events.payment_id IS 'ID do pagamento no MercadoPago';
COMMENT ON COLUMN public.webhook_events.status IS 'Status do processamento: processing, completed, failed';

COMMENT ON COLUMN public.profiles.subscription_status IS 'Status atual da assinatura do usuário';
COMMENT ON COLUMN public.profiles.last_payment_id IS 'ID do último pagamento processado';

COMMENT ON COLUMN public.subscriptions.mercadopago_payment_id IS 'ID do pagamento no MercadoPago';
COMMENT ON COLUMN public.subscriptions.payment_method IS 'Método de pagamento utilizado (credit_card, pix, etc)';
COMMENT ON COLUMN public.subscriptions.last_payment_date IS 'Data do último pagamento aprovado';
COMMENT ON COLUMN public.subscriptions.last_payment_amount IS 'Valor do último pagamento';

-- 6. Criar função para limpar webhooks antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.webhook_events
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status = 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_webhooks() IS 'Remove webhooks processados com sucesso há mais de 30 dias';

-- 7. (Opcional) Criar cron job para limpar webhooks antigos automaticamente
-- Descomente as linhas abaixo se você tiver a extensão pg_cron instalada:
-- SELECT cron.schedule('cleanup-old-webhooks', '0 3 * * *', 'SELECT public.cleanup_old_webhooks()');

-- Rollback instructions (comentado):
-- Para reverter esta migration, execute:
/*
DROP FUNCTION IF EXISTS public.cleanup_old_webhooks();
DROP TABLE IF EXISTS public.webhook_events;
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS mercadopago_payment_id,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS last_payment_date,
  DROP COLUMN IF EXISTS last_payment_amount;
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS last_payment_id;
*/
