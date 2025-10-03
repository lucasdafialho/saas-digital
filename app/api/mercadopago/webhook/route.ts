import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("Webhook recebido:", JSON.stringify(body, null, 2))

    // Processar pagamentos do Checkout Pro (PIX, Cartão, Boleto)
    if (body.type === "payment") {
      const paymentId = body.data.id
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

      // Buscar informações do pagamento
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!paymentResponse.ok) {
        console.error("Erro ao buscar pagamento:", paymentResponse.status)
        return NextResponse.json({ received: true })
      }

      const payment = await paymentResponse.json()
      
      console.log("Pagamento recebido:", {
        id: payment.id,
        status: payment.status,
        email: payment.payer?.email,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference,
      })

      // Se o pagamento foi aprovado
      if (payment.status === "approved") {
        const userEmail = payment.payer?.email
        const externalRef = payment.external_reference // Ex: "starter_1234567890"
        const planType = externalRef?.split("_")[0] // "starter" ou "pro"

          console.log(" Pagamento aprovado:", {
          email: userEmail,
          plan: planType,
          amount: payment.transaction_amount,
        })

        // Atualizar o plano do usuário
        if (userEmail && planType && ["starter", "pro"].includes(planType)) {
          try {
            // Chamar API interna para atualizar o plano
            const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/update-plan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail,
                planType
              })
            })

            if (updateResponse.ok) {
              const result = await updateResponse.json()
              console.log(" Plano atualizado com sucesso:", result)
            } else {
              console.error(" Erro ao atualizar plano:", await updateResponse.text())
            }
            
          } catch (error) {
            console.error(" Erro ao atualizar plano do usuário:", error)
          }
        }
      }
    }

    // Processar assinaturas (caso use no futuro)
    if (body.type === "subscription_preapproval") {
      console.log("Webhook de assinatura recebido:", body.data.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}

