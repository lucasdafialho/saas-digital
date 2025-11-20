# 🚀 Integração Mercado Pago - Arquitetura Refatorada

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Componentes](#componentes)
3. [Fluxo de Pagamento](#fluxo-de-pagamento)
4. [Webhooks](#webhooks)
5. [Configuração](#configuração)
6. [Testes](#testes)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitetura

### **Princípios**

- ✅ **Separação de Responsabilidades** - Services, Handlers e Routes separados
- ✅ **Idempotência** - Webhooks podem ser reprocessados sem efeitos colaterais
- ✅ **Validação de Assinatura** - Todos os webhooks são validados
- ✅ **Logs Detalhados** - Rastreabilidade completa
- ✅ **Tratamento de Erros** - Rollback automático em falhas

### **Estrutura**

```
lib/
├── services/
│   ├── payment-service.ts       # Lógica de negócio de pagamentos
│   └── webhook-handlers.ts      # Handlers específicos por tipo de evento
├── mercadopago.ts               # Cliente e validação MP
└── logger.ts                    # Sistema de logs

app/api/mercadopago/
├── create-payment/              # Criar preferência de pagamento
├── webhook-v2/                  # Webhook refatorado (USAR ESTE)
├── webhook/                     # Webhook antigo (DEPRECADO)
└── process-payment/             # Processamento manual
```

---

## 🧩 Componentes

### **1. PaymentService**

**Localização:** `lib/services/payment-service.ts`

**Responsabilidades:**
- Processar pagamentos aprovados
- Criar/atualizar subscriptions
- Cancelar assinaturas
- Identificar tipo de plano

**Métodos Principais:**

```typescript
// Processar pagamento aprovado
await paymentService.processApprovedPayment(
  userEmail: string,
  planType: 'starter' | 'pro',
  paymentData: {
    paymentId: string
    amount: number
    paymentMethod: string
    dateApproved: string | null
  }
)

// Cancelar assinatura
await paymentService.cancelUserSubscription(userId: string)

// Identificar plano
const plan = paymentService.identifyPlanType(
  metadata?,
  externalReference?,
  amount?
)
```

---

### **2. Webhook Handlers**

**Localização:** `lib/services/webhook-handlers.ts`

**Classes:**

#### **PaymentWebhookHandler**

Processa webhooks de pagamentos únicos.

```typescript
const handler = new PaymentWebhookHandler()
const result = await handler.handlePaymentWebhook(paymentId)
```

**Status tratados:**
- ✅ `approved` - Ativa o plano
- ⏳ `pending` / `in_process` - Aguardando confirmação
- ❌ `rejected` / `cancelled` - Pagamento falhou
- 💸 `refunded` / `charged_back` - Cancela assinatura

#### **SubscriptionWebhookHandler**

Processa webhooks de assinaturas recorrentes.

```typescript
const handler = new SubscriptionWebhookHandler()
const result = await handler.handleSubscriptionWebhook(subscriptionId, action)
```

**Ações tratadas:**
- ✅ `created` / `authorized` - Ativa assinatura
- ❌ `cancelled` - Cancela assinatura

---

### **3. Webhook Route (v2)**

**Localização:** `app/api/mercadopago/webhook-v2/route.ts`

**Fluxo:**

```
1. Parse do corpo da requisição
2. Validação de estrutura
3. Validação de assinatura (HMAC SHA256)
4. Geração de webhook ID único
5. Verificação de duplicação (idempotência)
6. Registro no banco (previne race conditions)
7. Processamento via handlers
8. Atualização de status
9. Resposta ao Mercado Pago
```

**URL do Webhook:**
```
https://seu-dominio.com/api/mercadopago/webhook-v2
```

---

## 💳 Fluxo de Pagamento

### **1. Usuário Clica em "Assinar"**

```typescript
// Frontend chama:
POST /api/mercadopago/create-payment
{
  "planType": "starter",
  "userEmail": "usuario@example.com",
  "userName": "Nome do Usuário"
}

// Resposta:
{
  "preferenceId": "123456",
  "initPoint": "https://mercadopago.com.br/checkout/..."
}
```

### **2. Usuário Paga**

- Usuário é redirecionado para Mercado Pago
- Escolhe método de pagamento (PIX, Cartão, etc)
- Realiza o pagamento

### **3. Mercado Pago Envia Webhook**

```json
POST /api/mercadopago/webhook-v2
{
  "type": "payment",
  "action": "payment.created",
  "data": {
    "id": "78901234"
  },
  "id": 12345
}
```

### **4. Sistema Processa**

1. Valida assinatura
2. Busca detalhes do pagamento na API do MP
3. Identifica plano (metadata > external_reference > amount)
4. Busca usuário por email
5. Cria/atualiza subscription
6. Atualiza perfil do usuário
7. Marca webhook como processado

### **5. Usuário Acessa Dashboard**

- Plano atualizado ✅
- Limites aumentados ✅
- Features desbloqueadas ✅

---

## 🔔 Webhooks

### **Configuração no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em: **Webhooks** > **Configurar Notificações**
3. Configure:
   - **URL:** `https://seu-dominio.com/api/mercadopago/webhook-v2`
   - **Eventos:**
     - ✅ Pagamentos (`payment`)
     - ✅ Assinaturas (`subscription_preapproval`)
     - ✅ Pagamentos recorrentes (`subscription_authorized_payment`)

### **Validação de Assinatura**

O webhook valida a assinatura usando:

```typescript
// Formato do header x-signature:
"ts=1234567890,v1=hash_sha256"

// Manifest construído:
"id:{data.id};request-id:{x-request-id};ts:{timestamp};"

// Validação:
HMAC-SHA256(manifest, MERCADOPAGO_WEBHOOK_SECRET) === v1
```

### **Idempotência**

Cada webhook recebe um ID único e é registrado na tabela `webhook_events`:

```sql
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR UNIQUE NOT NULL,  -- Previne duplicação
  event_type VARCHAR NOT NULL,
  payment_id VARCHAR,
  status VARCHAR NOT NULL,              -- processing | completed | failed
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ Configuração

### **Variáveis de Ambiente**

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxxx

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### **Preços dos Planos**

**Arquivo:** `lib/mercadopago.ts`

```typescript
export const PLANS = {
  free: {
    name: "Gratuito",
    price: 0,
    limit: 5
  },
  starter: {
    name: "Starter",
    price: 1.0,    // ← AJUSTAR AQUI (teste: R$ 1,00 | prod: R$ 49,90)
    limit: 100
  },
  pro: {
    name: "Pro",
    price: 149.9,
    limit: -1
  }
}
```

**IMPORTANTE:** Ao mudar o preço do Starter, também ajuste em:
- `lib/services/payment-service.ts` (linha ~119): range de validação por valor

---

## 🧪 Testes

### **1. Teste de Pagamento Completo**

```bash
# 1. Criar pagamento
curl -X POST https://seu-dominio.com/api/mercadopago/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "starter",
    "userEmail": "teste@example.com",
    "userName": "Teste"
  }'

# 2. Pagar via Mercado Pago (use o initPoint retornado)

# 3. Verificar webhook nos logs da Vercel
# Filtrar por: /api/mercadopago/webhook-v2

# 4. Verificar plano atualizado no banco
```

### **2. Processamento Manual**

Se o webhook falhar, use o endpoint manual:

```bash
curl -X POST https://seu-dominio.com/api/mercadopago/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "SEU_PAYMENT_ID"
  }'
```

### **3. Simulador de Webhooks**

Use o simulador do Mercado Pago:
https://www.mercadopago.com.br/developers/panel/notifications-simulator

---

## 🔧 Troubleshooting

### **Problema: Webhook não chega**

**Possíveis causas:**
1. URL do webhook incorreta no painel MP
2. Webhook secret não configurado
3. Firewall bloqueando MP

**Solução:**
1. Verifique a URL: deve ser `webhook-v2`, não `webhook`
2. Confirme variáveis de ambiente na Vercel
3. Verifique logs: procure por rejeições de assinatura

---

### **Problema: Webhook rejeitado (401)**

**Causa:** Assinatura inválida

**Solução:**
1. Verifique se `MERCADOPAGO_WEBHOOK_SECRET` está correto
2. Certifique-se que é o secret da aplicação correta
3. Logs devem mostrar: "🚫 Webhook rejeitado - assinatura inválida"

---

### **Problema: Pagamento aprovado mas plano não atualiza**

**Diagnóstico:**

```bash
# 1. Verificar se webhook chegou
# Logs: procurar por "🔔 Webhook MercadoPago recebido"

# 2. Verificar se foi processado
# Logs: procurar por "✅ Pagamento processado com sucesso"

# 3. Verificar tabela webhook_events
SELECT * FROM webhook_events
WHERE payment_id = 'SEU_PAYMENT_ID'
ORDER BY created_at DESC;
```

**Solução:**
```bash
# Se webhook não chegou: configure no painel MP
# Se chegou mas falhou: use processamento manual

curl -X POST https://konvexy.com/api/mercadopago/process-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "SEU_PAYMENT_ID"}'
```

---

### **Problema: Email não encontrado**

**Causa:** Usuário fez pagamento mas não está cadastrado no sistema

**Solução:**
1. Verificar se o email do pagamento coincide com o cadastrado
2. Criar perfil manualmente se necessário
3. Processar pagamento com endpoint manual

---

## 📊 Monitoramento

### **Logs Importantes**

Procure por estes emojis nos logs:

- 🔔 Webhook recebido
- ✅ Webhook validado
- 💰 Processando pagamento
- ✅ Pagamento processado
- 🚫 Webhook rejeitado
- ❌ Erro ao processar

### **Queries Úteis**

```sql
-- Webhooks recebidos hoje
SELECT * FROM webhook_events
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Webhooks com falha
SELECT * FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Último pagamento de um usuário
SELECT p.email, s.*
FROM subscriptions s
JOIN profiles p ON s.user_id = p.id
WHERE p.email = 'usuario@example.com'
ORDER BY s.created_at DESC
LIMIT 1;
```

---

## 🚀 Deploy

### **Checklist Pré-Deploy**

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Webhook URL configurada no painel Mercado Pago
- [ ] Preços ajustados para produção
- [ ] Tabela `webhook_events` criada no Supabase
- [ ] Logs configurados

### **Migração do Webhook Antigo**

**Passo 1:** Atualize a URL no painel Mercado Pago
```
DE:  https://seu-dominio.com/api/mercadopago/webhook
PARA: https://seu-dominio.com/api/mercadopago/webhook-v2
```

**Passo 2:** Deploy na Vercel

**Passo 3:** Teste com pagamento real de R$ 1,00

**Passo 4:** Se tudo funcionar, remova o webhook antigo:
```bash
rm -rf app/api/mercadopago/webhook/route.ts
```

---

## 📚 Recursos

- [Documentação Mercado Pago - Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Painel de Aplicações](https://www.mercadopago.com.br/developers/panel/app)
- [Simulador de Notificações](https://www.mercadopago.com.br/developers/panel/notifications-simulator)

---

**Desenvolvido com ❤️ para Konvexy**
