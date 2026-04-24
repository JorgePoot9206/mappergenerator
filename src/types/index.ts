// ─────────────────────────────────────────────────────────────
//  ZoneMapper — shared TypeScript types
// ─────────────────────────────────────────────────────────────

/** Drawing tool modes */
export type DrawTool = "select" | "rect" | "circle" | "poly";

/** All supported zone categories */
export type ZoneType =
  | "room" | "parking" | "office" | "region"
  | "road" | "area" | "other";

// ── Shape geometry (coordinates in % of image 0–100) ──────────

export interface ShapeRect {
  type: "rect";
  x: number;   // left edge %
  y: number;   // top edge %
  w: number;   // width %
  h: number;   // height %
}

export interface ShapeCircle {
  type: "circle";
  cx: number;  // center x %
  cy: number;  // center y %
  r: number;   // radius %
}

export interface ShapePoly {
  type: "poly";
  /** Array of {x,y} percentage points */
  points: Array<{ x: number; y: number }>;
}

export type ZoneShape = ShapeRect | ShapeCircle | ShapePoly;

// ── Zone ──────────────────────────────────────────────────────

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  notes: string;
  href: string;       // clickable link (can be empty)
  target: "_blank" | "_self";
  color: string;      // hex
  shape: ZoneShape;
}

// ── Image map analysis ────────────────────────────────────────

export interface ZoneMapData {
  imageType: string;
  description: string;
  imageName: string;
  /** Original pixel dimensions — needed for HTML map coords export */
  imageWidth: number;
  imageHeight: number;
  exportedAt: string;
  zones: Zone[];
}

/** Visual rendering modes */
export type VisualStyle = "fill" | "outline" | "labels";

// ── API payloads ──────────────────────────────────────────────

export interface AnalyzeRequest {
  image: string;     // base-64
  mimeType: string;
  isFallback?: boolean; // true when Claude is called after all Gemini models failed
}

export interface AnalyzeResponse {
  imageType: string;
  description: string;
  zones: Omit<Zone, "notes" | "href" | "target">[];
  usedModel?: string; // label of the model that ran (set by Gemini routes)
}

export interface AnalyzeError {
  error: string;
  modelError?: boolean;  // true when the AI model itself failed (not rate-limit/config)
  geminiDown?: boolean;  // true when Gemini fallback quota is exhausted — show "services down" message
}

// ── Classic (AI auto-detect) zone model ──────────────────────
// Point-marker based — position is a percentage center point.

export type ClassicVisualStyle = "polygons" | "labels" | "tooltips";

export interface ClassicZone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  notes: string;
  importance: number;   // 1–5
  position: { x: number; y: number };  // center % 0–100
  color: string;
}

export interface ClassicZoneMapData {
  imageType: string;
  description: string;
  imageName: string;
  exportedAt: string;
  zones: ClassicZone[];
}

export interface ClassicAnalyzeResponse {
  imageType: string;
  description: string;
  zones: Omit<ClassicZone, "notes">[];
  usedModel?: string; // label of the model that ran (set by Gemini routes)
}
