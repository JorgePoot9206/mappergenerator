import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeRequest, AnalyzeError, ClassicAnalyzeResponse } from "@/types";
import { checkRateLimit, applyRateCookie, formatReset } from "@/lib/rateLimiter";

// ─────────────────────────────────────────────────────────────
//  POST /api/analyze-classic
//  Original ZoneMapper flow — returns point-marker zones
//  with position (x/y %) and importance (1–5).
// ─────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un experto analizando imágenes espaciales.
Respondes ÚNICAMENTE con JSON válido — sin markdown, sin backticks, sin texto extra.`;

const USER_PROMPT = `Analiza esta imagen y detecta automáticamente qué tipo de espacio o área muestra
(plano arquitectónico, estacionamiento, mapa geográfico, layout de oficina,
área exterior, etc.). Identifica todas las zonas, espacios o regiones visibles.

Devuelve ÚNICAMENTE un JSON válido sin texto adicional ni backticks con esta estructura exacta:
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
- importance es un número del 1 al 5 que indica relevancia de la zona
- Detecta entre 4 y 20 zonas según la complejidad de la imagen
- Colores apropiados según tipo:
  habitaciones → tonos cálidos (#f97316, #ec4899, #eab308)
  agua → azul (#06b6d4)
  vegetación → verde (#22c55e)
  circulación/pasillos → gris (#94a3b8)
  estacionamiento → pizarra (#475569)
  oficinas → índigo (#6366f1)
- Las posiciones deben distribuirse por toda la imagen y no agruparse`;

export async function POST(req: NextRequest) {
  // Parse body first so we can check isFallback before choosing which counter to use
  let body: AnalyzeRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json<AnalyzeError>({ error: "Invalid request body" }, { status: 400 });
  }

  const provider = body.isFallback ? "gemini-fallback" : "anthropic";
  const rl = checkRateLimit(req, provider);
  const rlHeaders = new Headers();
  applyRateCookie(rlHeaders, rl.cookieValue);

  if (!rl.allowed) {
    if (body.isFallback) {
      // Both Gemini models failed AND the fallback quota is exhausted
      return NextResponse.json<AnalyzeError>(
        { error: "Gemini services appear to be down. Please try again later.", geminiDown: true },
        { status: 503, headers: rlHeaders }
      );
    }
    return NextResponse.json<AnalyzeError>(
      { error: `Rate limit reached. Try again in ${formatReset(rl.resetMs)}.` },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json<AnalyzeError>(
        { error: "Missing image or mimeType" }, { status: 400 }
      );
    }

    const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!supported.includes(mimeType)) {
      return NextResponse.json<AnalyzeError>(
        { error: `Unsupported type: ${mimeType}` }, { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image,
            },
          },
          { type: "text", text: USER_PROMPT },
        ],
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json<AnalyzeError>({ error: "No text response from Claude" }, { status: 502 });
    }

    const jsonString = textBlock.text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: ClassicAnalyzeResponse;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return NextResponse.json<AnalyzeError>(
        { error: `Invalid JSON from Claude: ${jsonString.slice(0, 200)}` }, { status: 502 }
      );
    }

    // Validate and clamp positions to 0–100
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
    console.error("[/api/analyze-classic]", message);
    return NextResponse.json<AnalyzeError>({ error: message }, { status: 500 });
  }
}
