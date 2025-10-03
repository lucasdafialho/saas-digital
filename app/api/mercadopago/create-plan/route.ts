import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoService } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType } = body

    if (!planType || !["starter", "pro"].includes(planType)) {
      return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 })
    }

    const mp = new MercadoPagoService()

    const planConfig = {
      starter: {
        reason: "Plano Starter Konvexy - Marketing Digital com IA",
        transaction_amount: 49.9,
      },
      pro: {
        reason: "Plano Pro Konvexy - Marketing Digital com IA",
        transaction_amount: 149.9,
      },
    }

    const config = planConfig[planType as "starter" | "pro"]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    const isLocalhost = appUrl.includes("localhost")
    const backUrl = isLocalhost 
      ? "https://konvexy.com/dashboard?payment=success"
      : `${appUrl}/dashboard?payment=success`

    const plan = await mp.createPlan({
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: config.transaction_amount,
        currency_id: "BRL",
      },
      back_url: backUrl,
      reason: config.reason,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Erro ao criar plano:", error)
    return NextResponse.json(
      { error: "Erro ao criar plano no Mercado Pago" },
      { status: 500 }
    )
  }
}

