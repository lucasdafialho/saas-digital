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
      budget: budget ?? "",
      timeframe: timeframe ?? "",
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
        temperature: 0.6,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            objective: { type: "string" },
            platforms: { type: "array", items: { type: "string" } },
            budget: { type: "string" },
            timeframe: { type: "string" },
            strategySummary: { type: "string" },
            kpis: { type: "array", items: { type: "string" } },
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  goal: { type: "string" },
                  budgetSplitPercent: { type: "number" },
                  biddingStrategy: { type: "string" },
                  audiences: { type: "array", items: { type: "string" } },
                  placements: { type: "array", items: { type: "string" } },
                  creatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        format: { type: "string" },
                        headline: { type: "string" },
                        description: { type: "string" },
                        cta: { type: "string" },
                        angle: { type: "string" },
                      },
                      required: ["format", "headline", "description", "cta", "angle"],
                    },
                  },
                  recommendations: { type: "array", items: { type: "string" } },
                },
                required: [
                  "name",
                  "goal",
                  "budgetSplitPercent",
                  "biddingStrategy",
                  "audiences",
                  "placements",
                  "creatives",
                  "recommendations",
                ],
              },
            },
            testingPlan: { type: "array", items: { type: "string" } },
            dailyRoutine: { type: "array", items: { type: "string" } },
            optimizationTips: { type: "array", items: { type: "string" } },
          },
          required: [
            "objective",
            "platforms",
            "budget",
            "timeframe",
            "strategySummary",
            "kpis",
            "campaigns",
            "testingPlan",
            "dailyRoutine",
            "optimizationTips",
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
  budget: string | number
  timeframe: string | number
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
    budget: norm(String(input.budget)),
    timeframe: norm(String(input.timeframe)),
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

  const base = `Você é um media buyer sênior em pt-BR. Gere uma estratégia de tráfego pago orientada a resultados para ${s.platform}.
Produto/serviço: ${s.product}. Oferta: ${s.offer}. Público: ${s.audience}. Objetivo: ${s.objective}. Orçamento mensal em BRL: ${s.budget || "indefinido"}. Janela (dias): ${s.timeframe || "indefinida"}. Região/idioma: ${s.region || "BR"}. Contexto: ${s.context}.

Responda estritamente com JSON válido no schema abaixo. Use chaves duplas em todas as propriedades e strings. Não inclua comentários, blocos de código ou texto fora do JSON. Crie no mínimo 3 criativos por campanha com "headline", "description" e "cta". Schema: ${schema}`

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
  const cleaned = String(source || "").replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z]*\n?|```/g, "")).trim()
  try {
    return JSON.parse(cleaned)
  } catch {}
  try {
    let start = -1
    let depth = 0
    let inString = false
    let quote: string | null = null
    let prev = ""
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (inString) {
        if (ch === quote && prev !== "\\") inString = false
      } else {
        if (ch === '"' || ch === "'") {
          inString = true
          quote = ch
        } else if (ch === "{") {
          if (depth === 0) start = i
          depth++
        } else if (ch === "}") {
          depth--
          if (depth === 0 && start !== -1) {
            const slice = cleaned.slice(start, i + 1)
            try {
              return JSON.parse(slice)
            } catch {}
            start = -1
          }
        }
      }
      prev = ch
    }
  } catch {}
  return null
}


