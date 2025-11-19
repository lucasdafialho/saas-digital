import { NextRequest, NextResponse } from "next/server"
import { PLANS } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType, userEmail } = body

    if (!planType || !userEmail) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    if (!["starter", "pro"].includes(planType)) {
      return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    const isLocalhost = appUrl.includes("localhost")
    const backUrl = isLocalhost 
      ? "https://konvexy.com/dashboard/planos?subscription=success"
      : `${appUrl}/dashboard/planos?subscription=success`

    const planConfig = PLANS[planType as "starter" | "pro"]

    const subscriptionData = {
      reason: `Assinatura ${planConfig.name} - Konvexy`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: planConfig.price,
        currency_id: "BRL",
      },
      back_url: backUrl,
      payer_email: userEmail,
      external_reference: `subscription_${planType}_${userEmail}_${Date.now()}`,
      status: "pending",
    }

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Erro do Mercado Pago:", error)
      return NextResponse.json(
        { error: `Erro ao criar assinatura: ${error.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    const subscription = await response.json()

    return NextResponse.json({
      subscriptionId: subscription.id,
      initPoint: subscription.init_point,
    })
  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao criar assinatura no Mercado Pago" },
      { status: 500 }
    )
  }
}

