import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-api"
import { checkGenerationLimit } from "@/lib/generation-limits"
import { trackGeneration } from "@/lib/generations"

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
const FALLBACK_MODEL = "gemini-2.0-flash-lite"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 })
    }

    const limitCheck = await checkGenerationLimit(user.userId, 'canvas')
    if (!limitCheck.allowed) {
      return NextResponse.json({ success: false, error: limitCheck.reason }, { status: 403 })
    }

    const body = await request.json()
    const { product, audience, offer, objective, market, context } = body || {}

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
      market: market || "",
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
        temperature: 0.6,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            customerSegments: { type: "array", items: { type: "string" } },
            valueProposition: { type: "array", items: { type: "string" } },
            channels: { type: "array", items: { type: "string" } },
            customerRelationships: { type: "array", items: { type: "string" } },
            revenueStreams: { type: "array", items: { type: "string" } },
            keyResources: { type: "array", items: { type: "string" } },
            keyActivities: { type: "array", items: { type: "string" } },
            keyPartners: { type: "array", items: { type: "string" } },
            costStructure: { type: "array", items: { type: "string" } },
          },
          required: [
            "customerSegments",
            "valueProposition",
            "channels",
            "customerRelationships",
            "revenueStreams",
            "keyResources",
            "keyActivities",
            "keyPartners",
            "costStructure",
          ],
        },
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

    await trackGeneration({
      userId: user.userId,
      type: 'canvas',
      metadata: {
        product,
        audience,
        offer,
        objective,
        market
      }
    })

    return NextResponse.json({ success: true, canvas: parsed })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 })
  }
}

function sanitize(input: {
  product: string
  audience: string
  offer: string
  objective: string
  market: string
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
    market: norm(input.market),
    context: norm(input.context),
  }
}

function buildPrompt(s: {
  product: string
  audience: string
  offer: string
  objective: string
  market: string
  context: string
}) {
  const schema = `{
    "customerSegments": string[],
    "valueProposition": string[],
    "channels": string[],
    "customerRelationships": string[],
    "revenueStreams": string[],
    "keyResources": string[],
    "keyActivities": string[],
    "keyPartners": string[],
    "costStructure": string[]
  }`

  const base = `Você é um estrategista de marketing em pt-BR. Gere um Marketing Model Canvas completo e prático baseado nos dados fornecidos. Público: ${s.audience}. Produto/serviço: ${s.product}. Oferta: ${s.offer}. Objetivo: ${s.objective}. Mercado/nicho: ${s.market || "indefinido"}. Contexto adicional: ${s.context}.

Responda estritamente com JSON válido e nada mais, conforme o schema abaixo. Use bullets curtos, claros e acionáveis para cada bloco. Inclua somente os 9 blocos do Canvas (sem campos extras). Schema: ${schema}`

  return base
}

function extractText(json: any): string {
  try {
    const parts = json?.candidates?.[0]?.content?.parts
    if (Array.isArray(parts)) {
      for (const part of parts) {
        const txt = (part?.text ?? "").trim()
        if (txt && (txt.startsWith("{") || txt.startsWith("["))) return txt
      }
      const joined = parts.map((p: any) => p?.text || "").join("\n").trim()
      return joined
    }
    const t2 = json?.candidates?.[0]?.output_text
    return String(t2 || "").trim()
  } catch {
    return ""
  }
}

function extractJsonObject(source: string): any | null {
  const cleaned = String(source || "").replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z]*\n?|```/g, "")).trim()
  try {
    return JSON.parse(cleaned)
  } catch {}
  try {
    const objMatch = cleaned.match(/\{[\s\S]*\}$/)
    if (objMatch) return JSON.parse(objMatch[0])
  } catch {}
  return null
}


