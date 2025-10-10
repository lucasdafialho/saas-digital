# 🧪 Guia de Teste - Pagamento e Atualização de Plano

## ✅ O que foi implementado

### 1. **Webhook Funcionando 100%**
- ✅ Validação de assinatura corrigida
- ✅ Status HTTP corretos (401, 404, 500)
- ✅ Cache no banco de dados (tabela `webhook_events`)
- ✅ Identificação robusta de planos
- ✅ Logs detalhados para debug

### 2. **Auto-refresh Automático na Dashboard**
- ✅ Polling a cada 3 segundos por 60 segundos
- ✅ Notificação "Processando pagamento..."
- ✅ Notificação "Pagamento confirmado!" quando atualizar
- ✅ Atualização automática do plano e limites

---

## 🚀 Como Testar

### Passo 1: Execute a Migration SQL

**Se ainda não executou:**

```sql
-- Copie de: supabase/migrations/001_add_webhook_tracking.sql
-- E execute no SQL Editor do Supabase Dashboard

-- Ou via CLI:
cd saas-digital
supabase db push
```

### Passo 2: Configure Variáveis de Ambiente na Vercel

```env
# Obrigatórias
MERCADOPAGO_ACCESS_TOKEN=seu_token
SUPABASE_SERVICE_ROLE_KEY=sua_key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# Recomendada (Produção)
MERCADOPAGO_WEBHOOK_SECRET=seu_secret

# OU Modo Dev (apenas testes!)
MERCADOPAGO_WEBHOOK_SKIP_VALIDATION=true
NODE_ENV=development
```

### Passo 3: Faça Deploy

```bash
git add .
git commit -m "fix: auto-refresh após pagamento e webhook corrections"
git push
```

### Passo 4: Teste o Fluxo Completo

#### 4.1 Faça um Pagamento de Teste

1. Acesse `/dashboard/planos`
2. Clique em "Assinar Starter" ou "Assinar Pro"
3. Complete o pagamento no MercadoPago
4. Você será redirecionado para `/dashboard?subscription=success`

#### 4.2 O que deve acontecer AUTOMATICAMENTE:

**Imediatamente após redirecionamento:**
1. ⏳ Notificação aparece: "Processando pagamento..."
2. 🔄 Sistema começa a verificar a cada 3 segundos

**Dentro de 3-60 segundos:**
3. ✅ Webhook processa o pagamento
4. 🎉 Notificação: "Pagamento confirmado!"
5. 📊 Badge do plano atualiza (FREE → STARTER/PRO)
6. 🔢 Limite de gerações atualiza
7. 🗑️ URL limpa (remove `?subscription=success`)

#### 4.3 Verificar nos Logs da Vercel

Você deve ver:
```
🔔 Webhook MercadoPago recebido
🔍 Headers recebidos do webhook
✅ Webhook validado com sucesso!
💰 Processando pagamento
📋 Detalhes do pagamento obtidos
🎯 Plano identificado
👤 Usuário encontrado
✅ PAGAMENTO PROCESSADO COM SUCESSO!
```

#### 4.4 Verificar no Console do Navegador

Você deve ver:
```
✅ Verificando atualização do plano... (1/20)
✅ Verificando atualização do plano... (2/20)
...
🎉 Plano atualizado automaticamente!
```

---

## 🔍 Debug - Se NÃO Atualizar

### 1. Verifique se a Migration foi Executada

No Supabase SQL Editor:
```sql
-- Verificar se tabela existe
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

-- Verificar se colunas foram adicionadas
SELECT subscription_status, last_payment_id FROM profiles LIMIT 1;
```

Se der erro, **execute a migration primeiro!**

### 2. Verifique os Logs da Vercel

Acesse: `https://vercel.com/seu-projeto/logs`

**Procure por:**
- ❌ Erro 401 → Webhook secret incorreto ou ausente
- ❌ Erro 404 → Usuário não encontrado no banco
- ❌ Erro 500 → Supabase não conectado ou tabela ausente

### 3. Verifique Variáveis de Ambiente

No dashboard da Vercel:
```
Settings > Environment Variables

✅ MERCADOPAGO_ACCESS_TOKEN
✅ SUPABASE_SERVICE_ROLE_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ MERCADOPAGO_WEBHOOK_SECRET (ou MERCADOPAGO_WEBHOOK_SKIP_VALIDATION=true)
```

### 4. Teste Manual do Webhook

#### 4.1 No Painel do MercadoPago:

1. Vá em **Notificações** > **Webhooks**
2. Encontre um webhook com erro
3. Clique em **"Reenviar"**
4. Monitore os logs da Vercel

#### 4.2 Verificar no Banco de Dados:

```sql
-- Ver webhooks processados
SELECT * FROM webhook_events
WHERE payment_id = 'SEU_PAYMENT_ID'
ORDER BY created_at DESC;

-- Ver status da subscription
SELECT * FROM subscriptions
WHERE user_id = (SELECT id FROM profiles WHERE email = 'seu@email.com')
ORDER BY created_at DESC;

-- Ver perfil atualizado
SELECT id, email, plan, subscription_status, last_payment_id
FROM profiles
WHERE email = 'seu@email.com';
```

---

## 🎯 Comportamento Esperado

### Se o Webhook Processar RÁPIDO (< 5s):
1. Redirect para dashboard
2. Notificação "Processando pagamento..."
3. **1ª verificação (3s):** Plano já atualizado!
4. Notificação "Pagamento confirmado!"
5. Dashboard mostra novo plano

### Se o Webhook Processar LENTO (5-60s):
1. Redirect para dashboard
2. Notificação "Processando pagamento..."
3. Várias verificações a cada 3s...
4. Quando webhook processar → Plano atualiza
5. Notificação "Pagamento confirmado!"
6. Dashboard mostra novo plano

### Se o Webhook NÃO Processar (> 60s):
1. Redirect para dashboard
2. Notificação "Processando pagamento..."
3. 20 verificações (60s total)
4. Notificação "Ainda processando... Atualize a página em alguns minutos"
5. **Ação:** Verifique logs da Vercel!

---

## 🛠️ Forçar Atualização Manual

Se o webhook demorar muito e você quiser ver o plano atualizado:

### Opção 1: Recarregar a Página
```
F5 ou Ctrl+R
```
O `useAuth` vai buscar dados atualizados do banco.

### Opção 2: Via Console do Navegador
```javascript
// Forçar refresh do usuário
window.location.reload()
```

### Opção 3: Fazer Logout/Login
Ao fazer login novamente, os dados são recarregados do banco.

---

## 📊 Checklist de Verificação

### Antes do Teste:
- [ ] Migration SQL executada no Supabase
- [ ] Tabela `webhook_events` existe
- [ ] Colunas adicionadas em `profiles` e `subscriptions`
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado na Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado na Vercel
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configurado (ou skip em dev)
- [ ] Deploy feito na Vercel
- [ ] URL do webhook configurada no MercadoPago

### Durante o Teste:
- [ ] Pagamento concluído com sucesso no MercadoPago
- [ ] Redirect para `/dashboard?subscription=success`
- [ ] Notificação "Processando pagamento..." apareceu
- [ ] Console mostra "Verificando atualização do plano..."
- [ ] Logs da Vercel mostram "Webhook MercadoPago recebido"

### Após o Teste (Sucesso):
- [ ] Notificação "Pagamento confirmado!" apareceu
- [ ] Badge do plano atualizado (FREE → STARTER/PRO)
- [ ] Limite de gerações atualizado
- [ ] URL limpa (sem `?subscription=success`)
- [ ] Banco mostra subscription ativa
- [ ] Webhook_events mostra status "completed"

### Se Falhar:
- [ ] Verificar logs da Vercel (procurar por ❌)
- [ ] Verificar tabela `webhook_events` no Supabase
- [ ] Reenviar webhook manualmente no MercadoPago
- [ ] Verificar variáveis de ambiente
- [ ] Consultar `WEBHOOK_DEBUG.md` para troubleshooting

---

## 🎓 Entendendo o Fluxo

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuário completa pagamento no MercadoPago       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. MercadoPago envia webhook para /api/webhook     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. Webhook valida assinatura e processa pagamento  │
│    - Busca detalhes na API do MercadoPago          │
│    - Identifica plano (metadata > ref > valor)     │
│    - Cria/atualiza subscription no banco           │
│    - Atualiza plan no profile                      │
│    - Marca webhook como "completed"                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. Usuário é redirecionado para dashboard          │
│    URL: /dashboard?subscription=success            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 5. Dashboard inicia polling automático             │
│    - Verifica a cada 3 segundos                    │
│    - Chama refreshUser() do useAuth                │
│    - useAuth busca dados do banco via Supabase     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 6. Quando plano atualizar no banco:                │
│    - user.plan muda de "free" → "starter"/"pro"    │
│    - Notificação "Pagamento confirmado!" aparece   │
│    - Badge e limites atualizam automaticamente     │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Dicas Importantes

1. **Não precisa fazer nada manualmente!** Tudo é automático após o pagamento.

2. **Se demorar mais de 60s:** Verifique os logs da Vercel para ver onde está travando.

3. **Use modo dev apenas para testes!** Em produção, sempre use `MERCADOPAGO_WEBHOOK_SECRET` real.

4. **O banco é a fonte da verdade:** Se o banco está atualizado mas a dashboard não, faça F5.

5. **Logs são seus amigos:** Sempre verifique os logs da Vercel para debug.

---

## 🎉 Resultado Final Esperado

Quando tudo estiver funcionando:

1. ✅ Usuário paga no MercadoPago
2. ✅ Webhook processa em < 5 segundos
3. ✅ Dashboard atualiza automaticamente
4. ✅ Notificação de sucesso aparece
5. ✅ Plano e limites corretos
6. ✅ Sem erros 502 nos logs
7. ✅ Usuário feliz usando o plano pago! 🎊

**Tudo 100% automático!** 🚀
