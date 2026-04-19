"use client";

import { useState, useRef, useCallback } from "react";
import type { ClassicZone, ClassicVisualStyle } from "@/types";

interface Props {
  imageUrl: string;
  zones: ClassicZone[];
  selectedZoneId: string | null;
  visualStyle: ClassicVisualStyle;
  onZoneClick: (zone: ClassicZone) => void;
  onZoneNameEdit: (zoneId: string, newName: string) => void;
}

export function ZoneMapClassic({
  imageUrl,
  zones,
  selectedZoneId,
  visualStyle,
  onZoneClick,
  onZoneNameEdit,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent, zone: ClassicZone) => {
    e.stopPropagation();
    setEditingId(zone.id);
    setEditValue(zone.name);
    setTimeout(() => editInputRef.current?.select(), 0);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingId && editValue.trim()) onZoneNameEdit(editingId, editValue.trim());
    setEditingId(null);
  }, [editingId, editValue, onZoneNameEdit]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (visualStyle !== "tooltips") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [visualStyle]);

  const hoveredZone = zones.find((z) => z.id === hoveredId);
  const dotSize = (imp: number) => 20 + imp * 4;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onMouseMove={handleMouseMove}
    >
      <img
        src={imageUrl}
        alt="Map"
        className="w-full rounded-xl block"
        draggable={false}
      />

      {zones.map((zone) => {
        const isSelected = zone.id === selectedZoneId;
        const isHovered = zone.id === hoveredId;
        const size = dotSize(zone.importance);

        return (
          <div
            key={zone.id}
            style={{
              position: "absolute",
              left: `${zone.position.x}%`,
              top: `${zone.position.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: isSelected ? 20 : isHovered ? 10 : 5,
            }}
            onClick={() => onZoneClick(zone)}
            onDoubleClick={(e) => handleDoubleClick(e, zone)}
            onMouseEnter={(e) => {
              setHoveredId(zone.id);
              if (visualStyle === "tooltips") {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }
            }}
            onMouseLeave={() => { setHoveredId(null); setTooltipPos(null); }}
            className="cursor-pointer"
          >
            {/* ── Polygons style ─── */}
            {visualStyle === "polygons" && (
              <>
                <div
                  style={{
                    width: size, height: size, borderRadius: "50%",
                    background: zone.color,
                    border: isSelected ? "3px solid white" : "2px solid rgba(255,255,255,0.5)",
                    opacity: isHovered || isSelected ? 1 : 0.8,
                    transform: isHovered || isSelected ? "scale(1.3)" : "scale(1)",
                    transition: "transform 0.15s, opacity 0.15s",
                    boxShadow: isSelected ? `0 0 0 4px ${zone.color}40` : undefined,
                  }}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 pointer-events-none">
                  {editingId === zone.id ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold bg-slate-900 text-white border border-indigo-500 rounded px-1 py-0.5 outline-none w-28 text-center pointer-events-auto"
                    />
                  ) : (
                    <span className="whitespace-nowrap text-xs font-semibold bg-slate-900/85 text-slate-100 px-1.5 py-0.5 rounded">
                      {zone.name}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ── Labels style ─── */}
            {visualStyle === "labels" && (
              <div className="relative">
                <div
                  style={{ background: zone.color }}
                  className={`absolute -top-1 -left-1 w-2 h-2 rounded-full opacity-80 transition-transform duration-150 ${isHovered ? "scale-150" : "scale-100"}`}
                />
                {editingId === zone.id ? (
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold bg-slate-900 text-white border border-indigo-500 rounded px-1 py-0.5 outline-none w-28 pointer-events-auto"
                  />
                ) : (
                  <span
                    style={{ color: zone.color, textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                    className={`whitespace-nowrap text-sm font-bold transition-all duration-150 ${isHovered ? "text-base" : ""} ${isSelected ? "underline" : ""}`}
                  >
                    {zone.name}
                  </span>
                )}
              </div>
            )}

            {/* ── Tooltips style ─── */}
            {visualStyle === "tooltips" && (
              <div
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: isHovered ? zone.color : "transparent",
                  border: `2px solid ${zone.color}`,
                  opacity: isHovered ? 0.9 : 0.5,
                  transition: "all 0.15s",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Floating tooltip */}
      {visualStyle === "tooltips" && hoveredZone && tooltipPos && (
        <div
          className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-700 rounded-xl p-3 text-sm shadow-2xl max-w-[200px]"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: hoveredZone.color }} />
            <span className="font-bold text-white truncate">{hoveredZone.name}</span>
          </div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1.5">{hoveredZone.type}</div>
          <div className="text-slate-300 text-xs leading-relaxed line-clamp-3">{hoveredZone.description}</div>
          <div className="mt-2 text-yellow-400 text-xs">
            {"★".repeat(hoveredZone.importance)}{"☆".repeat(5 - hoveredZone.importance)}
          </div>
        </div>
      )}
    </div>
  );
}
