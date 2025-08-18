import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
const FALLBACK_MODEL = "gemini-2.0-flash-lite"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product,
      audience,
      offer,
      objective,
      funnelType,
      budget,
      timeframe,
      context,
    } = body || {}

    if (!product || !audience || !offer || !objective) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing API key" }, { status: 500 })
    }

    const safe = sanitize({
      product,
      audience,
      offer,
      objective,
      funnelType: funnelType || "",
      budget: budget || "",
      timeframe: timeframe || "",
      context: context || "",
    })

    const prompt = buildPrompt(safe)

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1200,
      },
    }

    const callModel = async (model: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const text = await resp.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }
      return { ok: resp.ok, status: resp.status, json, raw: text }
    }

    let result = await callModel(DEFAULT_MODEL)
    if (!result.ok && DEFAULT_MODEL !== FALLBACK_MODEL) {
      result = await callModel(FALLBACK_MODEL)
    }
    if (!result.ok) {
      const providerMsg = result.json?.error?.message || result.raw || "Provider error"
      return NextResponse.json({ success: false, error: providerMsg }, { status: 502 })
    }

    const modelText = extractText(result.json)
    if (!modelText) {
      return NextResponse.json({ success: false, error: "Empty response" }, { status: 502 })
    }

    const parsed = extractJsonObject(modelText)
    if (!parsed) {
      return NextResponse.json({ success: false, error: "Failed to parse provider JSON" }, { status: 502 })
    }

    return NextResponse.json({ success: true, strategy: parsed })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 })
  }
}

function sanitize(input: {
  product: string
  audience: string
  offer: string
  objective: string
  funnelType: string
  budget: string
  timeframe: string
  context: string
}) {
  const norm = (s: string) =>
    String(s || "")
      .slice(0, 700)
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/[<>`{}\[\]]/g, " ")
      .replace(/(?:ignore|disregard)\s+all\s+previous[^\n]*/gi, " ")
      .replace(/reveal|show\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message)/gi, " ")
      .replace(/jailbreak|ignore\s+instructions|do\s+anything\s+now/gi, " ")
      .trim()
  return {
    product: norm(input.product),
    audience: norm(input.audience),
    offer: norm(input.offer),
    objective: norm(input.objective),
    funnelType: norm(input.funnelType),
    budget: norm(input.budget),
    timeframe: norm(input.timeframe),
    context: norm(input.context),
  }
}

function buildPrompt(s: {
  product: string
  audience: string
  offer: string
  objective: string
  funnelType: string
  budget: string
  timeframe: string
  context: string
}) {
  const schema = `{
    "funnelType": string,
    "objective": string,
    "summary": string,
    "kpis": string[],
    "stages": [
      {
        "name": string,
        "objective": string,
        "channels": string[],
        "actions": string[],
        "recommendations": string[],
        "kpis": string[],
        "copyGuidelines": string[]
      }
    ],
    "recommendedTools": string[],
    "contentIdeas": string[],
    "timeline": [{ "phase": string, "week": string, "focus": string }]
  }`

  const base = `Você é um estrategista de growth e funis de vendas em pt-BR. Gere um plano completo de funil baseado nos dados fornecidos. Público: ${s.audience}. Produto/serviço: ${s.product}. Oferta: ${s.offer}. Objetivo: ${s.objective}. Tipo de funil preferido: ${s.funnelType || "indefinido"}. Orçamento: ${s.budget || "indefinido"}. Janela de execução: ${s.timeframe || "indefinida"}. Contexto adicional: ${s.context}.

Responda apenas com JSON VÁLIDO correspondente ao schema a seguir, sem explicações, sem blocos de código, sem comentários e sem texto fora do JSON. O plano deve ser prático, acionável, com linguagem direta, e considerar boas práticas de performance e ética. Para cada etapa, inclua canais, ações objetivas, recomendações e KPIs. Não inclua promises ou linguagem vaga. Schema: ${schema}`

  return base
}

function extractText(json: any): string {
  try {
    const c = json?.candidates?.[0]?.content?.parts
    if (Array.isArray(c)) {
      const t = c.map((p: any) => p?.text || "").join("\n").trim()
      return t
    }
    const t2 = json?.candidates?.[0]?.output_text
    return String(t2 || "").trim()
  } catch {
    return ""
  }
}

function extractJsonObject(source: string): any | null {
  try {
    const cleaned = source.replace(/```[a-zA-Z]*\n?|```/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) return null
    const slice = cleaned.slice(start, end + 1)
    return JSON.parse(slice)
  } catch {
    return null
  }
}


