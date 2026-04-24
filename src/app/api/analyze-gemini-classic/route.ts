import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeError, ClassicAnalyzeResponse } from "@/types";
import { checkRateLimit, undoRateLimit, applyRateCookie, formatReset } from "@/lib/rateLimiter";

// ─────────────────────────────────────────────────────────────
//  POST /api/analyze-gemini-classic
//  Tries Flash 2.5 → Flash 3. If both fail, returns modelError
//  so the frontend can fall back to Claude.
// ─────────────────────────────────────────────────────────────

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-preview-04-17", label: "Flash 2.5" },
  { id: "gemini-3-flash-preview",          label: "Flash 3"   },
] as const;

const PROMPT = `Analiza esta imagen y detecta automáticamente qué tipo de espacio o área muestra.
Identifica todas las zonas, espacios o regiones visibles.

Devuelve ÚNICAMENTE un JSON válido sin texto adicional ni backticks:
{
  "imageType": "tipo de imagen",
  "description": "descripción breve del espacio general",
  "zones": [
    {
      "id": "zone_1",
      "name": "Nombre de la zona",
      "type": "room|parking|office|region|road|area|other",
      "description": "descripción de esta zona",
      "importance": 3,
      "position": { "x": 45.5, "y": 32.0 },
      "color": "#hexcolor"
    }
  ]
}

Reglas:
- position.x y position.y son porcentajes del centro de la zona (0–100)
- importance es del 1 al 5 según relevancia
- Detecta entre 4 y 20 zonas
- Colores: habitaciones → cálidos (#f97316, #ec4899), agua → #06b6d4, vegetación → #22c55e, circulación → #94a3b8, estacionamiento → #475569, oficinas → #6366f1`;

async function tryGeminiModel(
  apiKey: string,
  modelId: string,
  image: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: mimeType, data: image } },
            { text: PROMPT },
          ]}],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, "gemini");
  const rlHeaders = new Headers();
  applyRateCookie(rlHeaders, rl.cookieValue);

  if (!rl.allowed) {
    return NextResponse.json<AnalyzeError>(
      { error: `Rate limit reached. Try again in ${formatReset(rl.resetMs)}.` },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const body: AnalyzeRequest = await req.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json<AnalyzeError>({ error: "Missing image or mimeType" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json<AnalyzeError>({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Try each model in order; first success wins
    let rawText: string | null = null;
    let usedLabel = "";

    for (const model of GEMINI_MODELS) {
      rawText = await tryGeminiModel(apiKey, model.id, image, mimeType);
      if (rawText) { usedLabel = model.label; break; }
    }

    if (!rawText) {
      undoRateLimit(req, "gemini");
      const undoHeaders = new Headers();
      applyRateCookie(undoHeaders, rl.cookieUndo);
      return NextResponse.json<AnalyzeError>(
        { error: "All Gemini models failed", modelError: true },
        { status: 502, headers: undoHeaders }
      );
    }

    const jsonString = rawText.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: ClassicAnalyzeResponse;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      undoRateLimit(req, "gemini");
      const undoHeaders = new Headers();
      applyRateCookie(undoHeaders, rl.cookieUndo);
      return NextResponse.json<AnalyzeError>(
        { error: `Invalid JSON from Gemini: ${jsonString.slice(0, 200)}`, modelError: true },
        { status: 502, headers: undoHeaders }
      );
    }

    parsed.zones = parsed.zones.map((z) => ({
      ...z,
      importance: Math.max(1, Math.min(5, Math.round(z.importance ?? 3))),
      position: {
        x: Math.max(0, Math.min(100, z.position?.x ?? 50)),
        y: Math.max(0, Math.min(100, z.position?.y ?? 50)),
      },
    }));
    parsed.usedModel = usedLabel;

    const res = NextResponse.json<ClassicAnalyzeResponse>(parsed);
    applyRateCookie(res.headers, rl.cookieValue);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/analyze-gemini-classic]", message);
    return NextResponse.json<AnalyzeError>({ error: message }, { status: 500 });
  }
}
