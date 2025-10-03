import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("payment_id")
    const preferenceId = searchParams.get("preference_id")

    if (!paymentId) {
      return NextResponse.json({ error: "payment_id não fornecido" }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    // Buscar informações do pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Erro ao buscar pagamento:", response.status)
      return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 })
    }

    const payment = await response.json()

    return NextResponse.json({
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentType: payment.payment_type_id,
      email: payment.payer?.email,
      amount: payment.transaction_amount,
      externalReference: payment.external_reference,
      planType: payment.external_reference?.split("_")[0],
    })
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error)
    return NextResponse.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

