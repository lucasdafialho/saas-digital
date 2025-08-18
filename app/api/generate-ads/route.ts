import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
const FALLBACK_MODEL = "gemini-2.0-flash-lite"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product,
      offer,
      audience,
      objective,
      platform,
      budget,
      timeframe,
      region,
      context,
    } = body || {}

    if (!product || !offer || !audience || !objective) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing API key" }, { status: 500 })
    }

    const safe = sanitize({
      product,
      offer,
      audience,
      objective,
      platform: platform || "Auto",
      budget: budget || "",
      timeframe: timeframe || "",
      region: region || "",
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
  offer: string
  audience: string
  objective: string
  platform: string
  budget: string
  timeframe: string
  region: string
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
    offer: norm(input.offer),
    audience: norm(input.audience),
    objective: norm(input.objective),
    platform: norm(input.platform),
    budget: norm(input.budget),
    timeframe: norm(input.timeframe),
    region: norm(input.region),
    context: norm(input.context),
  }
}

function buildPrompt(s: {
  product: string
  offer: string
  audience: string
  objective: string
  platform: string
  budget: string
  timeframe: string
  region: string
  context: string
}) {
  const schema = `{
    "objective": string,
    "platforms": string[],
    "budget": string,
    "timeframe": string,
    "strategySummary": string,
    "kpis": string[],
    "campaigns": [
      {
        "name": string,
        "goal": string,
        "budgetSplitPercent": number,
        "biddingStrategy": string,
        "audiences": string[],
        "placements": string[],
        "creatives": [
          { "format": string, "headline": string, "description": string, "cta": string, "angle": string }
        ],
        "recommendations": string[]
      }
    ],
    "testingPlan": string[],
    "dailyRoutine": string[],
    "optimizationTips": string[]
  }`

  const base = `Você é um media buyer sênior em pt-BR. Gere uma estratégia de tráfego pago orientada a resultados para ${s.platform} com base nos dados.
Produto/serviço: ${s.product}. Oferta: ${s.offer}. Público: ${s.audience}. Objetivo: ${s.objective}. Orçamento: ${s.budget || "indefinido"}. Janela: ${s.timeframe || "indefinida"}. Região/idioma: ${s.region || "BR"}. Contexto adicional: ${s.context}.

Responda apenas com JSON VÁLIDO no schema abaixo. Forneça nomes de campanhas claros, divisões de orçamento, estratégia de lances, sugestões de público e posicionamentos. Gere no mínimo 3 criativos com headline, description e CTA por campanha, com ângulos distintos. Inclua plano de testes, rotina diária e dicas de otimização. Não escreva nada fora do JSON. Schema: ${schema}`

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


