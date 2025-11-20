import { NextRequest, NextResponse } from "next/server"
import { PaymentWebhookHandler } from "@/lib/services/webhook-handlers"
import secureLogger from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Endpoint para processar pagamentos manualmente
 * Útil para testes, troubleshooting e processamento manual
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório" }, { status: 400 })
    }

    secureLogger.info("🔧 Processando pagamento manualmente", { paymentId })

    // Usar o handler refatorado
    const handler = new PaymentWebhookHandler()
    const result = await handler.handlePaymentWebhook(paymentId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        status: result.status
      }, { status: 400 })
    }

    secureLogger.info("✅ Pagamento processado manualmente com sucesso", {
      paymentId,
      result
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      status: result.status
    })

  } catch (error) {
    secureLogger.error("❌ Erro ao processar pagamento manualmente", {
      error: error instanceof Error ? error.message : 'Unknown'
    })

    return NextResponse.json({
      error: "Erro ao processar pagamento",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
