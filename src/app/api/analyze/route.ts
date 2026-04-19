import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeRequest, AnalyzeResponse, AnalyzeError, ZoneShape } from "@/types";
import { checkRateLimit, applyRateCookie, formatReset } from "@/lib/rateLimiter";

// ─────────────────────────────────────────────────────────────
//  POST /api/analyze
//  Returns zones with bounding-box shapes (percentages 0-100)
// ─────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert spatial analyst that detects regions in images.
You respond ONLY with valid JSON — no markdown, no backticks, no extra text.`;

const USER_PROMPT = `Analyze this image and detect all visible zones, spaces, or regions.
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

export async function POST(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────
  const rl = checkRateLimit(req, "anthropic");
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

    // Strip possible markdown code fences
    const jsonString = textBlock.text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: AnalyzeResponse;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return NextResponse.json<AnalyzeError>(
        { error: `Invalid JSON from Claude: ${jsonString.slice(0, 200)}` }, { status: 502 }
      );
    }

    // Validate and clamp shape coordinates to 0–100
    parsed.zones = parsed.zones.map((z) => ({
      ...z,
      shape: clampShape(z.shape as ZoneShape),
    }));

    const res = NextResponse.json<AnalyzeResponse>(parsed);
    applyRateCookie(res.headers, rl.cookieValue);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/analyze]", message);
    return NextResponse.json<AnalyzeError>({ error: message }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Claude sometimes returns coordinates in 0–1 proportion scale instead of 0–100 percent.
 * Detect this by checking if all meaningful values are ≤ 1 and scale up accordingly.
 */
function normalizeShape(shape: ZoneShape): ZoneShape {
  if (!shape) return shape;

  if (shape.type === "rect") {
    const vals = [shape.x ?? 0, shape.y ?? 0, shape.w ?? 0, shape.h ?? 0];
    const scale = vals.every((v) => v <= 1) ? 100 : 1;
    return {
      type: "rect",
      x: (shape.x ?? 0) * scale,
      y: (shape.y ?? 0) * scale,
      w: (shape.w ?? 10) * scale,
      h: (shape.h ?? 10) * scale,
    };
  }
  if (shape.type === "circle") {
    const vals = [shape.cx ?? 0, shape.cy ?? 0, shape.r ?? 0];
    const scale = vals.every((v) => v <= 1) ? 100 : 1;
    return {
      type: "circle",
      cx: (shape.cx ?? 50) * scale,
      cy: (shape.cy ?? 50) * scale,
      r: (shape.r ?? 10) * scale,
    };
  }
  if (shape.type === "poly" && (shape.points ?? []).length > 0) {
    const allCoords = shape.points.flatMap((p) => [p.x, p.y]);
    const scale = allCoords.every((v) => v <= 1) ? 100 : 1;
    return {
      type: "poly",
      points: shape.points.map((p) => ({ x: p.x * scale, y: p.y * scale })),
    };
  }
  return shape;
}

function clampShape(shape: ZoneShape): ZoneShape {
  if (!shape) {
    return { type: "rect", x: 10, y: 10, w: 20, h: 20 };
  }
  const normalized = normalizeShape(shape);
  if (normalized.type === "rect") {
    return {
      type: "rect",
      x: clamp(normalized.x ?? 0),
      y: clamp(normalized.y ?? 0),
      w: clamp(normalized.w ?? 10),
      h: clamp(normalized.h ?? 10),
    };
  }
  if (normalized.type === "circle") {
    return {
      type: "circle",
      cx: clamp(normalized.cx ?? 50),
      cy: clamp(normalized.cy ?? 50),
      r: clamp(normalized.r ?? 10),
    };
  }
  if (normalized.type === "poly") {
    return {
      type: "poly",
      points: (normalized.points ?? []).map((p) => ({
        x: clamp(p.x),
        y: clamp(p.y),
      })),
    };
  }
  return { type: "rect", x: 10, y: 10, w: 20, h: 20 };
}
