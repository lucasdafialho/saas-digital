import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, planType } = body

    if (!userEmail || !planType) {
      return NextResponse.json(
        { error: "Email e tipo de plano são obrigatórios" },
        { status: 400 }
      )
    }

    if (!["starter", "pro"].includes(planType)) {
      return NextResponse.json(
        { error: "Tipo de plano inválido" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
