import { createClient } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redireciona para o dashboard após login bem-sucedido
  return NextResponse.redirect(`${origin}/dashboard`)
}
