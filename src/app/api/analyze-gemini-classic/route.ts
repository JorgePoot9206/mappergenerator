import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeError, ClassicAnalyzeResponse } from "@/types";
import { checkRateLimit, applyRateCookie, formatReset } from "@/lib/rateLimiter";

// ─────────────────────────────────────────────────────────────
//  POST /api/analyze-gemini-classic
//  Gemini Flash — returns point-marker zones (classic format)
// ─────────────────────────────────────────────────────────────

const MODEL = "gemini-3-flash-preview";

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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: image } },
              { text: PROMPT },
            ],
          }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json<AnalyzeError>({ error: `Gemini API error: ${err.slice(0, 200)}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return NextResponse.json<AnalyzeError>({ error: "Empty response from Gemini" }, { status: 502 });
    }

    const jsonString = text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: ClassicAnalyzeResponse;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return NextResponse.json<AnalyzeError>(
        { error: `Invalid JSON from Gemini: ${jsonString.slice(0, 200)}` }, { status: 502 }
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

    const res = NextResponse.json<ClassicAnalyzeResponse>(parsed);
    applyRateCookie(res.headers, rl.cookieValue);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/analyze-gemini-classic]", message);
    return NextResponse.json<AnalyzeError>({ error: message }, { status: 500 });
  }
}
