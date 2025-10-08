import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/sanitize'

const profileRateLimit = rateLimit({
  ...RATE_LIMITS.api.profile,
  keyPrefix: 'profile'
})

export async function GET(request: NextRequest) {
  const rateLimitResult = await profileRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      plan: profile.plan,
      generationsUsed: profile.generations_used,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    })

  } catch (error) {
    console.error('Erro ao buscar perfil')
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitResult = await profileRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório e deve ser válido" },
        { status: 400 }
      )
    }

    const sanitizedName = sanitizeInput(name, { 
      maxLength: 100,
      allowHtml: false,
      stripScripts: true
    })

    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { error: "Nome inválido após sanitização" },
        { status: 400 }
      )
    }

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ name: sanitizedName })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError || !profile) {
      return NextResponse.json(
        { error: "Erro ao atualizar perfil" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      plan: profile.plan,
      generationsUsed: profile.generations_used,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    })

  } catch (error) {
    console.error('Erro ao atualizar perfil')
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
