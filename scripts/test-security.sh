#!/bin/bash

# Script de teste de segurança
# Usage: ./scripts/test-security.sh https://seu-site.vercel.app

if [ -z "$1" ]; then
  echo "❌ Erro: URL não fornecida"
  echo "Usage: ./scripts/test-security.sh https://seu-site.vercel.app"
  exit 1
fi

URL=$1
echo "🔒 Testando segurança de: $URL"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar header
check_header() {
  local header_name=$1
  local expected_value=$2
  local result=$(curl -s -I "$URL" | grep -i "^$header_name:")

  if [ ! -z "$result" ]; then
    echo -e "${GREEN}✓${NC} $header_name encontrado: $result"
  else
    echo -e "${RED}✗${NC} $header_name NÃO encontrado"
  fi
}

echo "📋 1. Verificando Headers de Segurança"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_header "X-Frame-Options" "DENY"
check_header "X-Content-Type-Options" "nosniff"
check_header "Strict-Transport-Security" "max-age"
check_header "Content-Security-Policy" ""
check_header "Referrer-Policy" ""
check_header "X-XSS-Protection" ""
echo ""

echo "🚦 2. Testando Rate Limiting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Enviando 15 requisições rápidas para /api/generate-copy..."

success_count=0
rate_limited=0

for i in {1..15}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/generate-copy" \
    -H "Content-Type: application/json" \
    -d '{"type":"headline","product":"test","audience":"test","benefit":"test","tone":"professional"}')

  if [ "$status" == "429" ]; then
    rate_limited=$((rate_limited + 1))
  elif [ "$status" == "200" ] || [ "$status" == "401" ]; then
    success_count=$((success_count + 1))
  fi

  echo -n "."
done

echo ""
if [ $rate_limited -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Rate limiting funcionando! ($rate_limited requisições bloqueadas)"
else
  echo -e "${YELLOW}⚠${NC} Rate limiting pode não estar configurado (nenhuma requisição bloqueada)"
fi
echo ""

echo "🔐 3. Testando HTTPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $URL == https://* ]]; then
  echo -e "${GREEN}✓${NC} URL usa HTTPS"

  # Verificar redirecionamento HTTP → HTTPS
  http_url=${URL/https/http}
  redirect=$(curl -s -I "$http_url" | grep -i "^location:")

  if [[ $redirect == *"https"* ]]; then
    echo -e "${GREEN}✓${NC} HTTP redireciona para HTTPS"
  else
    echo -e "${YELLOW}⚠${NC} HTTP não redireciona automaticamente para HTTPS"
  fi
else
  echo -e "${RED}✗${NC} URL não usa HTTPS!"
fi
echo ""

echo "📊 4. Testando CSP (Content Security Policy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
csp=$(curl -s -I "$URL" | grep -i "content-security-policy:")
if [ ! -z "$csp" ]; then
  echo -e "${GREEN}✓${NC} CSP configurado"

  if [[ $csp == *"default-src 'self'"* ]]; then
    echo -e "${GREEN}✓${NC} default-src 'self' configurado"
  fi

  if [[ $csp == *"frame-ancestors 'none'"* ]]; then
    echo -e "${GREEN}✓${NC} frame-ancestors 'none' configurado (proteção clickjacking)"
  fi
else
  echo -e "${RED}✗${NC} CSP NÃO configurado"
fi
echo ""

echo "🌐 5. Testando Webhook Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
webhook_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/mercadopago/webhook" \
  -H "Content-Type: application/json" \
  -d '{"action":"payment.created","data":{"id":"123"}}')

if [ "$webhook_status" == "401" ] || [ "$webhook_status" == "403" ]; then
  echo -e "${GREEN}✓${NC} Webhook rejeitou requisição sem assinatura (status: $webhook_status)"
elif [ "$webhook_status" == "400" ]; then
  echo -e "${GREEN}✓${NC} Webhook validando assinaturas (status: $webhook_status)"
else
  echo -e "${YELLOW}⚠${NC} Webhook retornou status inesperado: $webhook_status"
fi
echo ""

echo "🎯 Resumo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Site testado: $URL"
echo ""
echo "Próximos passos:"
echo "1. Configure Vercel KV ou Upstash Redis para rate limiting"
echo "2. Adicione MERCADOPAGO_WEBHOOK_SECRET nas variáveis de ambiente"
echo "3. Crie tabela security_audit_log no Supabase"
echo "4. Monitore logs de segurança regularmente"
echo ""
echo "Para mais detalhes, consulte: SECURITY_SETUP.md"
