import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Obter token de autenticação do header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autenticação não fornecido" },
        { status: 401 }
      )
    }

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar perfil do usuário
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
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autenticação não fornecido" },
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    // Atualizar perfil
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ name })
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
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
