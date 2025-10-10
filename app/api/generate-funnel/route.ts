import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-api"
import { checkGenerationLimit } from "@/lib/generation-limits"
import { trackGeneration } from "@/lib/generations"
import { cleanMarkdownFromObject } from "@/lib/text-formatter"
import { rateLimitByUserId, RATE_LIMITS } from "@/lib/rate-limit-redis"
import { generateFunnelSchema, validateInput } from "@/lib/validators"
import secureLogger from "@/lib/logger"
import { logSecurityEvent } from "@/lib/audit"

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
const FALLBACK_MODEL = "gemini-2.0-flash-lite"

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      await logSecurityEvent({
        type: 'unauthorized_access',
        ip,
        userAgent,
        details: { endpoint: '/api/generate-funnel' },
        severity: 'medium'
      })
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 })
    }

    // Rate limiting
    const rateLimitCheck = await rateLimitByUserId({
      ...RATE_LIMITS.api.generation,
      userId: user.userId,
      keyPrefix: 'generate-funnel'
    })

    if (!rateLimitCheck.allowed) {
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        userId: user.userId,
        ip,
        userAgent,
        details: { endpoint: '/api/generate-funnel' },
        severity: 'low'
      })
      return NextResponse.json({
        success: false,
        error: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      }, { status: 429 })
    }

    const limitCheck = await checkGenerationLimit(user.userId, 'funnel')
    if (!limitCheck.allowed) {
      return NextResponse.json({ success: false, error: limitCheck.reason }, { status: 403 })
    }

    const body = await request.json()

    // Validação com Zod
    const validation = validateInput(generateFunnelSchema, body)
    if (!validation.success) {
      secureLogger.warn('Validação falhou em generate-funnel', {
        userId: user.userId,
        error: validation.error
      })
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    const { product, audience, goal, budget, context } = validation.data

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      secureLogger.error('GEMINI_API_KEY não configurada')
      return NextResponse.json({ success: false, error: "Serviço temporariamente indisponível" }, { status: 500 })
    }

    const prompt = buildPrompt({
      product,
      audience,
      goal,
      budget: budget || 0,
      context: context || ""
    })

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
            funnelType: { type: "string" },
            objective: { type: "string" },
            summary: { type: "string" },
            kpis: { type: "array", items: { type: "string" } },
            stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  objective: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  actions: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                  kpis: { type: "array", items: { type: "string" } },
                  copyGuidelines: { type: "array", items: { type: "string" } },
                },
                required: [
                  "name",
                  "objective",
                  "channels",
                  "actions",
                  "recommendations",
                  "kpis",
                  "copyGuidelines",
                ],
              },
            },
            recommendedTools: { type: "array", items: { type: "string" } },
            contentIdeas: { type: "array", items: { type: "string" } },
            timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  week: { type: "string" },
                  focus: { type: "string" },
                },
                required: ["phase", "week", "focus"],
              },
            },
          },
          required: [
            "funnelType",
            "objective",
            "summary",
            "kpis",
            "stages",
            "recommendedTools",
            "contentIdeas",
            "timeline",
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

    const cleanedStrategy = cleanMarkdownFromObject(parsed)

    await trackGeneration({
      userId: user.userId,
      type: 'funnel',
      metadata: {
        product,
        audience,
        goal,
        budget
      }
    })

    return NextResponse.json({ success: true, strategy: cleanedStrategy })
  } catch (error) {
    secureLogger.error('Erro em generate-funnel', error)
    return NextResponse.json({ success: false, error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

function buildPrompt(s: {
  product: string
  audience: string
  goal: string
  budget: number
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

  const base = `Você é um estrategista de growth e funis de vendas em pt-BR. Gere um plano completo de funil baseado nos dados fornecidos. Público: ${s.audience}. Produto/serviço: ${s.product}. Objetivo: ${s.goal}. Orçamento (BRL): ${s.budget || "indefinido"}. Contexto adicional: ${s.context}.

Responda estritamente com JSON válido e nada mais, conforme o schema abaixo. Não use blocos de código ou comentários. Para cada etapa, inclua canais, ações objetivas, recomendações e KPIs. Schema: ${schema}`

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
