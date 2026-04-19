"use client";

import { useState } from "react";
import type { Zone, VisualStyle } from "@/types";

interface Props {
  imageUrl: string;
  zones: Zone[];
  selectedZoneId: string | null;
  visualStyle: VisualStyle;
  onZoneClick: (zone: Zone) => void;
  onZoneNameEdit: (zoneId: string, newName: string) => void;
}

/** Compute center point of a shape (% coords) */
function shapeCenter(zone: Zone): { cx: number; cy: number } {
  const { shape } = zone;
  if (shape.type === "rect") return { cx: shape.x + shape.w / 2, cy: shape.y + shape.h / 2 };
  if (shape.type === "circle") return { cx: shape.cx, cy: shape.cy };
  if (shape.type === "poly" && shape.points.length > 0) {
    return {
      cx: shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length,
      cy: shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length,
    };
  }
  return { cx: 50, cy: 50 };
}

export function ZoneMap({
  imageUrl,
  zones,
  selectedZoneId,
  visualStyle,
  onZoneClick,
  onZoneNameEdit,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const commitEdit = () => {
    if (editingId && editValue.trim()) onZoneNameEdit(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="relative w-full select-none">
      <img
        src={imageUrl}
        alt="Map"
        className="w-full rounded-xl block pointer-events-none"
        draggable={false}
      />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full rounded-xl">
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          const isHovered = zone.id === hoveredId;
          const { shape, color } = zone;

          const fill = visualStyle === "outline"
            ? "transparent"
            : isHovered || isSelected ? color + "66" : color + "33";
          const stroke = isSelected ? "white" : color;
          const strokeW = isSelected ? 2 : 1;
          const opacity = visualStyle === "labels" ? "0" : "1";

          const commonProps = {
            fill,
            stroke,
            strokeWidth: strokeW,
            opacity,
            vectorEffect: "non-scaling-stroke" as const,
            cursor: "pointer" as const,
            onClick: () => onZoneClick(zone),
            onMouseEnter: () => setHoveredId(zone.id),
            onMouseLeave: () => setHoveredId(null),
          };

          let shapeEl: React.ReactNode = null;
          if (shape.type === "rect") {
            shapeEl = (
              <rect
                x={shape.x} y={shape.y}
                width={shape.w} height={shape.h}
                {...commonProps}
              />
            );
          } else if (shape.type === "circle") {
            shapeEl = (
              <ellipse
                cx={shape.cx} cy={shape.cy}
                rx={shape.r} ry={shape.r}
                {...commonProps}
              />
            );
          } else if (shape.type === "poly" && shape.points.length >= 3) {
            const pts = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
            shapeEl = <polygon points={pts} {...commonProps} />;
          }

          const { cx, cy } = shapeCenter(zone);

          return (
            <g key={zone.id}>
              {shapeEl}
              {/* Label (always shown for "labels" style, otherwise on hover/select) */}
              {(visualStyle === "labels" || isHovered || isSelected) && (
                <text
                  x={cx} y={cy}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="1.2" fontWeight="600" fill="white"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(zone.id);
                    setEditValue(zone.name);
                  }}
                >
                  {zone.name.length > 16 ? zone.name.slice(0, 14) + "…" : zone.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Inline rename (floating input near center) */}
      {editingId && (() => {
        const zone = zones.find((z) => z.id === editingId);
        if (!zone) return null;
        const { cx, cy } = shapeCenter(zone);
        return (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
            className="absolute z-20 text-xs font-semibold bg-slate-900 text-white border border-indigo-500 rounded px-1 py-0.5 outline-none w-28 text-center"
            style={{ left: `calc(${cx}% - 56px)`, top: `calc(${cy}% - 12px)` }}
          />
        );
      })()}
    </div>
  );
}
