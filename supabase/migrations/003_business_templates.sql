-- Migration: Business Templates (Presets) para Plano Pro
-- Data: 2025-10-13
-- Descrição: Permite que usuários Pro salvem templates de empresa para uso rápido

-- 1. Criar tabela de templates de empresa
CREATE TABLE IF NOT EXISTS public.business_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informações básicas
  name VARCHAR(100) NOT NULL, -- Nome do template (ex: "Loja Principal", "Produto X")
  is_default BOOLEAN DEFAULT false, -- Se é o template padrão

  -- Dados da empresa
  company_name VARCHAR(200),
  company_description TEXT,
  niche VARCHAR(100), -- Nicho/segmento
  target_audience TEXT, -- Público-alvo

  -- Dados de produto/serviço
  product_name VARCHAR(200),
  product_description TEXT,
  product_benefits TEXT, -- Principais benefícios
  product_price VARCHAR(50), -- Faixa de preço

  -- Tom e estilo
  tone VARCHAR(50) DEFAULT 'professional', -- professional, casual, friendly, urgent
  voice_style TEXT, -- Estilo da marca/voz

  -- Keywords e tags
  keywords TEXT[], -- Array de palavras-chave
  tags TEXT[], -- Tags para organização

  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT unique_template_name_per_user UNIQUE(user_id, name)
);

-- 2. Criar índices para performance
CREATE INDEX idx_business_templates_user_id ON public.business_templates(user_id);
CREATE INDEX idx_business_templates_is_default ON public.business_templates(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_business_templates_last_used ON public.business_templates(user_id, last_used_at DESC);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_business_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_templates_updated_at
  BEFORE UPDATE ON public.business_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_business_templates_updated_at();

-- 4. Criar função para garantir apenas um template padrão por usuário
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o novo template está sendo marcado como padrão
  IF NEW.is_default = true THEN
    -- Desmarcar todos os outros templates do usuário como padrão
    UPDATE public.business_templates
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON public.business_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- 5. Função para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.business_templates
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS (Row Level Security)
ALTER TABLE public.business_templates ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios templates
CREATE POLICY "Users can view their own templates"
  ON public.business_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar templates (será validado no app se é Pro)
CREATE POLICY "Users can create templates"
  ON public.business_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios templates
CREATE POLICY "Users can update their own templates"
  ON public.business_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios templates
CREATE POLICY "Users can delete their own templates"
  ON public.business_templates FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Comentários
COMMENT ON TABLE public.business_templates IS
  'Templates de empresa para usuários Pro. Permite salvar presets de informações de negócio para uso rápido nos geradores de IA.';

COMMENT ON COLUMN public.business_templates.is_default IS
  'Apenas um template pode ser padrão por usuário. É usado automaticamente quando nenhum template é selecionado.';

COMMENT ON COLUMN public.business_templates.usage_count IS
  'Contador de quantas vezes o template foi usado. Útil para analytics e ordenação.';

COMMENT ON FUNCTION increment_template_usage(UUID) IS
  'Incrementa o contador de uso e atualiza last_used_at para um template específico.';

-- 8. Dados de exemplo (opcional, remover em produção)
-- Este INSERT só funcionará se houver um usuário válido
-- Descomente para testar localmente

/*
INSERT INTO public.business_templates (
  user_id,
  name,
  is_default,
  company_name,
  company_description,
  niche,
  target_audience,
  product_name,
  product_description,
  product_benefits,
  tone,
  keywords
) VALUES (
  'SEU_USER_ID_AQUI', -- Substituir por um UUID válido
  'Minha Loja Principal',
  true,
  'TechStore Brasil',
  'Loja online especializada em produtos de tecnologia e gadgets inovadores',
  'Tecnologia e Eletrônicos',
  'Jovens profissionais de 25-40 anos, tech-savvy, renda média-alta',
  'Smartphone XYZ Pro',
  'Smartphone de última geração com câmera 108MP e bateria de longa duração',
  'Alta performance, design premium, câmera profissional, bateria que dura 2 dias',
  'professional',
  ARRAY['smartphone', 'tecnologia', 'câmera', 'bateria', 'performance']
);
*/

-- Rollback instructions (comentado):
-- Para reverter esta migration, execute:
/*
DROP TRIGGER IF EXISTS ensure_single_default_template_trigger ON public.business_templates;
DROP TRIGGER IF EXISTS business_templates_updated_at ON public.business_templates;
DROP FUNCTION IF EXISTS ensure_single_default_template();
DROP FUNCTION IF EXISTS update_business_templates_updated_at();
DROP FUNCTION IF EXISTS increment_template_usage(UUID);
DROP TABLE IF EXISTS public.business_templates CASCADE;
*/
