import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeError, AnalyzeResponse, ZoneShape } from "@/types";
import { checkRateLimit, undoRateLimit, applyRateCookie, formatReset } from "@/lib/rateLimiter";

// ─────────────────────────────────────────────────────────────
//  POST /api/analyze-gemini
//  Tries Flash 2.5 → Flash 3. If both fail, returns modelError
//  so the frontend can fall back to Claude.
// ─────────────────────────────────────────────────────────────

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-preview-04-17", label: "Flash 2.5" },
  { id: "gemini-3-flash-preview",          label: "Flash 3"   },
] as const;

const PROMPT = `Analyze this image and detect all visible zones, spaces, or regions.
For each zone, calculate its bounding box as percentages of the total image dimensions (0–100).

Return ONLY valid JSON (no backticks, no markdown) with this exact structure:
{
  "imageType": "type of image (floor plan / parking lot / office layout / map / etc.)",
  "description": "brief description of the overall space",
  "zones": [
    {
      "id": "zone_1",
      "name": "Zone name",
      "type": "room|parking|office|region|road|area|other",
      "description": "description of this zone",
      "color": "#hexcolor",
      "shape": {
        "type": "rect",
        "x": 10.5,
        "y": 8.2,
        "w": 25.0,
        "h": 18.5
      }
    }
  ]
}

Rules:
- shape.type must be "rect" for most zones (use "poly" only for clearly irregular shapes)
- For "rect": x=left%, y=top%, w=width%, h=height%
- For "poly": include a "points" array: [{"x":10,"y":20}, ...]
- For "circle": cx=center_x%, cy=center_y%, r=radius%
- Colors: rooms→warm (#f97316,#ec4899,#eab308), water→blue (#06b6d4),
  vegetation→green (#22c55e), corridors→gray (#94a3b8), parking→slate (#475569),
  offices→indigo (#6366f1)
- Detect between 4 and 20 zones depending on image complexity
- Bounding boxes must not overlap unnecessarily
- Cover the full image area with zones`;

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

    let parsed: AnalyzeResponse;
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
      shape: clampShape(z.shape as ZoneShape),
    }));
    parsed.usedModel = usedLabel;

    const res = NextResponse.json<AnalyzeResponse>(parsed);
    applyRateCookie(res.headers, rl.cookieValue);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/analyze-gemini]", message);
    return NextResponse.json<AnalyzeError>({ error: message }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function normalizeShape(shape: ZoneShape): ZoneShape {
  if (!shape) return shape;
  if (shape.type === "rect") {
    const vals = [shape.x ?? 0, shape.y ?? 0, shape.w ?? 0, shape.h ?? 0];
    const scale = vals.every((v) => v <= 1) ? 100 : 1;
    return { type: "rect", x: (shape.x ?? 0) * scale, y: (shape.y ?? 0) * scale, w: (shape.w ?? 10) * scale, h: (shape.h ?? 10) * scale };
  }
  if (shape.type === "circle") {
    const vals = [shape.cx ?? 0, shape.cy ?? 0, shape.r ?? 0];
    const scale = vals.every((v) => v <= 1) ? 100 : 1;
    return { type: "circle", cx: (shape.cx ?? 50) * scale, cy: (shape.cy ?? 50) * scale, r: (shape.r ?? 10) * scale };
  }
  if (shape.type === "poly" && (shape.points ?? []).length > 0) {
    const allCoords = shape.points.flatMap((p) => [p.x, p.y]);
    const scale = allCoords.every((v) => v <= 1) ? 100 : 1;
    return { type: "poly", points: shape.points.map((p) => ({ x: p.x * scale, y: p.y * scale })) };
  }
  return shape;
}

function clampShape(shape: ZoneShape): ZoneShape {
  if (!shape) return { type: "rect", x: 10, y: 10, w: 20, h: 20 };
  const normalized = normalizeShape(shape);
  if (normalized.type === "rect") {
    return { type: "rect", x: clamp(normalized.x ?? 0), y: clamp(normalized.y ?? 0), w: clamp(normalized.w ?? 10), h: clamp(normalized.h ?? 10) };
  }
  if (normalized.type === "circle") {
    return { type: "circle", cx: clamp(normalized.cx ?? 50), cy: clamp(normalized.cy ?? 50), r: clamp(normalized.r ?? 10) };
  }
  if (normalized.type === "poly") {
    return { type: "poly", points: (normalized.points ?? []).map((p) => ({ x: clamp(p.x), y: clamp(p.y) })) };
  }
  return { type: "rect", x: 10, y: 10, w: 20, h: 20 };
}
