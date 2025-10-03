import { NextRequest, NextResponse } from "next/server"
import { PLANS } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType, userEmail, userName } = body

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
      ? "https://konvexy.com/dashboard/planos?payment=success"
      : `${appUrl}/dashboard/planos?payment=success`

    const planConfig = PLANS[planType as "starter" | "pro"]

    const preferenceData = {
      items: [
        {
          title: `${planConfig.name} - Konvexy (Mensal)`,
          description: `Assinatura mensal do plano ${planConfig.name}`,
          quantity: 1,
          unit_price: planConfig.price,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: userEmail,
        name: userName || userEmail.split("@")[0],
      },
      back_urls: {
        success: backUrl,
        failure: `${isLocalhost ? "https://konvexy.com" : appUrl}/dashboard/planos?payment=failed`,
        pending: `${isLocalhost ? "https://konvexy.com" : appUrl}/dashboard/planos?payment=pending`,
      },
      auto_return: "approved",
      payment_methods: {
        installments: 12,
        default_installments: 1,
      },
      statement_descriptor: "KONVEXY",
      external_reference: `${planType}_${Date.now()}`,
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Erro do Mercado Pago:", error)
      return NextResponse.json(
        { error: `Erro ao criar preferência de pagamento: ${error.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    const preference = await response.json()

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    })
  } catch (error) {
    console.error("Erro ao criar preferência de pagamento:", error)
    return NextResponse.json(
      { error: "Erro ao criar preferência de pagamento no Mercado Pago" },
      { status: 500 }
    )
  }
}

