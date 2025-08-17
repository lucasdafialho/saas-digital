import { type NextRequest, NextResponse } from "next/server"

// This would be the actual API route for Gemini integration
// For now, it's a mock implementation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, product, audience, benefit, tone, context } = body

    // Mock delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real implementation, you would call the Gemini API here
    // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     contents: [{
    //       parts: [{
    //         text: `Generate ${type} copy for ${product} targeting ${audience} with benefit ${benefit} in ${tone} tone. Context: ${context}`
    //       }]
    //     }]
    //   })
    // })

    // Mock response
    const mockCopies = generateMockCopies(type, product, audience, benefit, tone, context)

    return NextResponse.json({
      success: true,
      copies: mockCopies,
    })
  } catch (error) {
    console.error("Error generating copy:", error)
    return NextResponse.json({ success: false, error: "Failed to generate copy" }, { status: 500 })
  }
}

function generateMockCopies(
  type: string,
  product: string,
  audience: string,
  benefit: string,
  tone: string,
  context: string,
) {
  // Mock copy generation logic
  const copies = []

  for (let i = 1; i <= 3; i++) {
    let copy = ""

    switch (type) {
      case "headline":
        copy = `Como ${product} Pode ${benefit} Para ${audience} - Método Comprovado #${i}`
        break
      case "email":
        copy = `Assunto: ${benefit} Garantido!\n\nOlá,\n\nDescubra como ${product} está ajudando ${audience} a ${benefit}.\n\nClique aqui: [LINK]\n\nAbraços!`
        break
      case "social":
        copy = `🚀 ${audience}, vocês precisam conhecer ${product}!\n\nResultado: ${benefit}\n\n#marketing #vendas`
        break
      default:
        copy = `Copy ${i} para ${product} focada em ${audience}`
    }

    copies.push({
      id: `${Date.now()}-${i}`,
      content: copy,
      type,
      timestamp: new Date().toISOString(),
    })
  }

  return copies
}
