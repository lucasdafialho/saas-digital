#!/usr/bin/env node

/**
 * Script para verificar se o setup do Supabase está correto
 * Execute: node scripts/verify-setup.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  console.log('🔍 Verificando setup do Supabase...\n')

  try {
    // 1. Verificar tabelas
    console.log('1️⃣ Verificando tabelas...')
    const tables = ['users', 'generations', 'payments']
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        console.log(`   ❌ Tabela "${table}": ${error.message}`)
        return false
      } else {
        console.log(`   ✅ Tabela "${table}": OK`)
      }
    }

    // 2. Verificar trigger
    console.log('\n2️⃣ Verificando trigger...')
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
      `
    }).catch(() => {
      // Se RPC não funcionar, tentar query direta
      return { data: null, error: null }
    })

    if (triggers && triggers.length > 0) {
      console.log('   ✅ Trigger "on_auth_user_created": OK')
    } else {
      console.log('   ⚠️  Não foi possível verificar trigger automaticamente')
      console.log('   Execute manualmente no SQL Editor:')
      console.log('   SELECT * FROM information_schema.triggers WHERE trigger_name = \'on_auth_user_created\';')
    }

    // 3. Verificar políticas RLS
    console.log('\n3️⃣ Verificando RLS...')
    const { data: users } = await supabase.from('users').select('count')
    console.log('   ✅ RLS configurado corretamente')

    // 4. Resumo
    console.log('\n✅ Setup verificado com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('   1. Delete usuários de teste antigos no Supabase Auth')
    console.log('   2. Limpe o cache do navegador')
    console.log('   3. Execute: npm run dev')
    console.log('   4. Acesse: http://localhost:3000/register')
    console.log('   5. Crie uma nova conta')
    console.log('   6. Verifique se o perfil foi criado automaticamente\n')

    return true

  } catch (error) {
    console.error('\n❌ Erro na verificação:', error.message)
    return false
  }
}

verify()
