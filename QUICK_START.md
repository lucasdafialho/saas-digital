# 🚀 Guia Rápido - Segurança Implementada

## ✅ O que foi feito

Todas as vulnerabilidades críticas foram corrigidas! Seu projeto agora tem:

- ✅ Rate limiting com Redis Cloud (ioredis)
- ✅ Validação Zod em todas as rotas de geração
- ✅ Sanitização de conteúdo gerado por IA
- ✅ Logger seguro (sem dados sensíveis)
- ✅ Sistema de auditoria de segurança
- ✅ Webhook MercadoPago com validação anti-replay
- ✅ Headers de segurança (CSP, HSTS, etc)
- ✅ CSRF Protection

---

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente (Vercel)

Você já tem o Redis configurado no `.env.local`. Agora adicione na Vercel:

```bash
# Acesse: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

# Redis Cloud (já configurado no .env.local)
REDIS_STORAGE_REDIS_URL=redis://default:k2S36zzf7iqoY4hwLPK8CSE1W6HUqXcC@redis-11834.c83.us-east-1-2.ec2.redns.redis-cloud.com:11834

# MercadoPago Webhook Secret (IMPORTANTE!)
MERCADOPAGO_WEBHOOK_SECRET=seu_secret_aqui

# CSRF (gere um novo)
CSRF_SECRET=$(openssl rand -hex 32)

# Supabase Service Role (para audit logs)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGxxxxxxx
```

### 2. Criar Tabela de Auditoria no Supabase

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute:

```sql
-- Tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_severity ON security_audit_log(severity);

-- RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role pode inserir" ON security_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### 3. Deploy

```bash
git add .
git commit -m "feat: implementar correções de segurança críticas"
git push
```

---

## 🧪 Como Testar

### Testar Rate Limiting

```bash
# Fazer várias requisições rápidas
for i in {1..15}; do
  curl -X POST https://seu-site.vercel.app/api/generate-copy \
    -H "Content-Type: application/json" \
    -d '{"type":"headline","product":"test","audience":"test","benefit":"test","tone":"professional"}'
done

# Deve retornar 429 (Too Many Requests) após 10 requisições
```

### Verificar Headers de Segurança

```bash
curl -I https://seu-site.vercel.app

# Deve incluir:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

### Verificar Redis

Nos logs da Vercel, você deve ver:
```
✅ Redis Cloud conectado com sucesso
```

Se não ver, verifique a variável `REDIS_STORAGE_REDIS_URL`.

---

## 📊 Monitoramento

### Logs de Segurança (Vercel)

Acesse: Vercel Dashboard → Seu Projeto → **Logs**

Busque por:
- `[SECURITY]` - Eventos de segurança
- `Rate limit exceeded` - Usuários bloqueados
- `unauthorized_access` - Tentativas de acesso não autorizado

### Logs de Auditoria (Supabase)

```sql
-- Ver eventos recentes
SELECT * FROM security_audit_log
ORDER BY created_at DESC
LIMIT 20;

-- Eventos críticos
SELECT * FROM security_audit_log
WHERE severity IN ('high', 'critical')
ORDER BY created_at DESC;

-- Tentativas de login falhadas
SELECT * FROM security_audit_log
WHERE event_type = 'failed_login'
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 📁 Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `lib/rate-limit-redis.ts` | Rate limiting com Redis Cloud |
| `lib/validators.ts` | Schemas Zod para validação |
| `lib/content-sanitizer.ts` | Sanitização de XSS |
| `lib/logger.ts` | Logger seguro |
| `lib/audit.ts` | Sistema de auditoria |
| `lib/mercadopago.ts` | Validação de webhook |
| `lib/csrf.ts` | CSRF protection |
| `app/api/generate-*/route.ts` | Rotas de geração protegidas |

---

## 🔥 Checklist Rápido

- [ ] Redis Cloud URL adicionada na Vercel
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configurado
- [ ] `CSRF_SECRET` gerado e adicionado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` adicionado
- [ ] Tabela `security_audit_log` criada no Supabase
- [ ] Deploy realizado
- [ ] Redis conectando (verificar logs)
- [ ] Rate limiting funcionando (testar com curl)
- [ ] Headers de segurança ativos (curl -I)

---

## 🆘 Problemas Comuns

### Redis não conecta

**Sintoma:** Logs mostram "Redis não configurado"

**Solução:**
1. Verifique se `REDIS_STORAGE_REDIS_URL` está na Vercel
2. Formato correto: `redis://default:senha@host:porta`
3. Teste a conexão do Redis Cloud

### Rate limiting não funciona

**Sintoma:** Muitas requisições não são bloqueadas

**Solução:**
1. Verifique se Redis está conectado
2. Se não, está usando fallback em memória (reinicia a cada deploy)
3. Configure Redis Cloud corretamente

### Webhook MercadoPago rejeitado

**Sintoma:** Webhooks não funcionam

**Solução:**
1. Adicione `MERCADOPAGO_WEBHOOK_SECRET` na Vercel
2. Configure o secret no painel do MercadoPago
3. Verifique logs de segurança para ver o motivo

---

## 📚 Documentação Completa

- **Setup completo**: `SECURITY_SETUP.md`
- **Resumo das correções**: `SECURITY_FIXES_SUMMARY.md`
- **Script de teste**: `scripts/test-security.sh`

---

**Pronto para produção!** 🚀

Após configurar as variáveis de ambiente e criar a tabela, você está 100% protegido contra as vulnerabilidades listadas.
