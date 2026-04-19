"use client";

import {
  useRef, useState, useCallback, useEffect, MouseEvent,
} from "react";
import type { Zone, ZoneShape, DrawTool, ShapeRect, ShapeCircle, ShapePoly } from "@/types";

// ─────────────────────────────────────────────────────────────
//  DrawingCanvas — SVG overlay for drawing / editing zones
// ─────────────────────────────────────────────────────────────

interface Props {
  imageUrl: string;
  zones: Zone[];
  selectedZoneId: string | null;
  activeTool: DrawTool;
  onZoneCreated: (shape: ZoneShape) => void;
  onZoneSelect: (id: string | null) => void;
  onZoneMove: (id: string, dx: number, dy: number) => void;  // delta in %
}

interface Point { x: number; y: number; }

/** Convert client mouse coords to SVG percentage (0–100) */
function toPercent(e: MouseEvent<SVGSVGElement | SVGElement>, svg: SVGSVGElement): Point {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

/** Render a zone shape as an SVG element */
function ShapeEl({
  zone,
  isSelected,
  onClick,
  onMouseDown,
}: {
  zone: Zone;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const { shape, color } = zone;
  const fill = isSelected ? color + "55" : color + "33";
  const stroke = isSelected ? "white" : color;
  const strokeW = isSelected ? 1.5 : 1;

  const common = {
    fill,
    stroke,
    strokeWidth: strokeW,
    vectorEffect: "non-scaling-stroke" as const,
    cursor: "pointer" as const,
    onClick,
    onMouseDown,
  };

  if (shape.type === "rect") {
    return (
      <rect
        x={shape.x} y={shape.y}
        width={shape.w} height={shape.h}
        {...common}
      />
    );
  }
  if (shape.type === "circle") {
    return (
      <ellipse
        cx={shape.cx} cy={shape.cy}
        rx={shape.r} ry={shape.r}
        {...common}
      />
    );
  }
  if (shape.type === "poly" && shape.points.length >= 3) {
    const pts = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
    return <polygon points={pts} {...common} />;
  }
  return null;
}

/** Zone name label centered on shape */
function ZoneLabel({ zone }: { zone: Zone }) {
  const { shape, name, color } = zone;
  let cx = 50, cy = 50;
  if (shape.type === "rect")   { cx = shape.x + shape.w / 2; cy = shape.y + shape.h / 2; }
  if (shape.type === "circle") { cx = shape.cx; cy = shape.cy; }
  if (shape.type === "poly" && shape.points.length > 0) {
    cx = shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length;
    cy = shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length;
  }
  return (
    <text
      x={cx} y={cy}
      textAnchor="middle" dominantBaseline="central"
      fontSize="1.2"
      fontWeight="600"
      fill="white"
      style={{ pointerEvents: "none", textShadow: "0 1px 3px #000", userSelect: "none" }}
    >
      {name.length > 16 ? name.slice(0, 14) + "…" : name}
    </text>
  );
}

export function DrawingCanvas({
  imageUrl,
  zones,
  selectedZoneId,
  activeTool,
  onZoneCreated,
  onZoneSelect,
  onZoneMove,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Rect / circle drawing state
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Polygon drawing state
  const [polyPoints, setPolyPoints] = useState<Point[]>([]);
  const [polyMouse, setPolyMouse] = useState<Point | null>(null);

  // Move state
  const moveRef = useRef<{ id: string; startX: number; startY: number } | null>(null);

  // ── Mouse handlers ───────────────────────────────────────────

  const handleMouseDown = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    // Only handle clicks on the SVG background (not on shapes)
    if ((e.target as SVGElement).tagName !== "svg" &&
        (e.target as SVGElement).tagName !== "image") return;

    if (activeTool === "poly") return; // polygon uses click events
    if (activeTool === "select") { onZoneSelect(null); return; }

    const pt = toPercent(e, svgRef.current);
    setDragStart(pt);
    setDragCurrent(pt);
    setIsDrawing(true);
    e.preventDefault();
  }, [activeTool, onZoneSelect]);

  const handleMouseMove = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const pt = toPercent(e, svgRef.current);

    // Polygon mouse tracking
    if (activeTool === "poly") {
      setPolyMouse(pt);
    }

    // Rect / circle drawing
    if (isDrawing && activeTool !== "poly") {
      setDragCurrent(pt);
    }

    // Move selected zone
    if (moveRef.current && activeTool === "select") {
      const dx = pt.x - moveRef.current.startX;
      const dy = pt.y - moveRef.current.startY;
      onZoneMove(moveRef.current.id, dx, dy);
      moveRef.current.startX = pt.x;
      moveRef.current.startY = pt.y;
    }
  }, [activeTool, isDrawing, onZoneMove]);

  const handleMouseUp = useCallback((e: MouseEvent<SVGSVGElement>) => {
    moveRef.current = null;
    if (!isDrawing || !dragStart || !dragCurrent || !svgRef.current) return;

    let shape: ZoneShape | null = null;

    if (activeTool === "rect") {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      if (w > 1 && h > 1) {
        shape = { type: "rect", x, y, w, h };
      }
    }

    if (activeTool === "circle") {
      const r = Math.sqrt(
        Math.pow(dragCurrent.x - dragStart.x, 2) +
        Math.pow(dragCurrent.y - dragStart.y, 2)
      );
      if (r > 1) {
        shape = { type: "circle", cx: dragStart.x, cy: dragStart.y, r };
      }
    }

    if (shape) onZoneCreated(shape);
    setIsDrawing(false);
    setDragStart(null);
    setDragCurrent(null);
  }, [isDrawing, dragStart, dragCurrent, activeTool, onZoneCreated]);

  // Polygon: add point on click
  const handleSvgClick = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (activeTool !== "poly" || !svgRef.current) return;
    if ((e.target as SVGElement).tagName !== "svg" &&
        (e.target as SVGElement).tagName !== "image") return;

    const pt = toPercent(e, svgRef.current);

    // Close polygon if clicking near first point (within 3%)
    if (polyPoints.length >= 3) {
      const first = polyPoints[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      if (dist < 3) {
        onZoneCreated({ type: "poly", points: polyPoints });
        setPolyPoints([]);
        setPolyMouse(null);
        return;
      }
    }

    setPolyPoints((prev) => [...prev, pt]);
  }, [activeTool, polyPoints, onZoneCreated]);

  // Polygon: close on double-click
  const handleDblClick = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (activeTool !== "poly") return;
    if (polyPoints.length >= 3) {
      onZoneCreated({ type: "poly", points: polyPoints });
      setPolyPoints([]);
      setPolyMouse(null);
    }
  }, [activeTool, polyPoints, onZoneCreated]);

  // Cancel polygon with Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPolyPoints([]);
        setPolyMouse(null);
        setIsDrawing(false);
        setDragStart(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Cursor style ─────────────────────────────────────────────
  const cursorMap: Record<DrawTool, string> = {
    select: "default",
    rect: "crosshair",
    circle: "crosshair",
    poly: "crosshair",
  };

  // ── Preview shape while drawing ───────────────────────────────
  let preview: React.ReactNode = null;
  if (isDrawing && dragStart && dragCurrent) {
    if (activeTool === "rect") {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      preview = (
        <rect
          x={x} y={y} width={w} height={h}
          fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 3" style={{ pointerEvents: "none" }}
        />
      );
    }
    if (activeTool === "circle") {
      const r = Math.sqrt(
        (dragCurrent.x - dragStart.x) ** 2 + (dragCurrent.y - dragStart.y) ** 2
      );
      preview = (
        <ellipse
          cx={dragStart.x} cy={dragStart.y}
          rx={r} ry={r}
          fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 3" style={{ pointerEvents: "none" }}
        />
      );
    }
  }

  // Polygon preview lines
  let polyPreview: React.ReactNode = null;
  if (activeTool === "poly" && polyPoints.length > 0) {
    const all = polyMouse ? [...polyPoints, polyMouse] : polyPoints;
    const pts = all.map((p) => `${p.x},${p.y}`).join(" ");
    polyPreview = (
      <>
        <polyline
          points={pts}
          fill="rgba(99,102,241,0.15)"
          stroke="#6366f1" strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 3"
          style={{ pointerEvents: "none" }}
        />
        {/* Dot on each confirmed point */}
        {polyPoints.map((p, i) => (
          <circle
            key={i} cx={p.x} cy={p.y} r="1"
            vectorEffect="non-scaling-stroke"
            fill={i === 0 ? "#22c55e" : "#6366f1"}
            stroke="white" strokeWidth={1}
            style={{ pointerEvents: "none" }}
          />
        ))}
      </>
    );
  }

  return (
    <div className="relative w-full select-none">
      <img
        src={imageUrl}
        alt="Map"
        className="w-full rounded-xl block pointer-events-none"
        draggable={false}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full rounded-xl"
        style={{ cursor: cursorMap[activeTool] }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleSvgClick}
        onDoubleClick={handleDblClick}
      >
        {/* Existing zones */}
        {zones.map((zone) => (
          <g key={zone.id}>
            <ShapeEl
              zone={zone}
              isSelected={zone.id === selectedZoneId}
              onClick={(e) => { e.stopPropagation(); onZoneSelect(zone.id); }}
              onMouseDown={(e) => {
                if (activeTool !== "select") return;
                e.stopPropagation();
                if (!svgRef.current) return;
                const pt = toPercent(e as unknown as MouseEvent<SVGSVGElement>, svgRef.current);
                moveRef.current = { id: zone.id, startX: pt.x, startY: pt.y };
              }}
            />
            <ZoneLabel zone={zone} />
          </g>
        ))}

        {/* Drawing previews */}
        {preview}
        {polyPreview}
      </svg>

      {/* Polygon hint */}
      {activeTool === "poly" && polyPoints.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 pointer-events-none">
          {polyPoints.length} points — double-click or click green dot to close
        </div>
      )}
    </div>
  );
}
