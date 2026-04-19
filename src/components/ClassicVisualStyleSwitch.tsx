"use client";

import type { ClassicVisualStyle } from "@/types";

interface Props {
  value: ClassicVisualStyle;
  onChange: (style: ClassicVisualStyle) => void;
}

const OPTIONS: { value: ClassicVisualStyle; label: string; icon: string }[] = [
  { value: "polygons", label: "Polygons", icon: "⬡" },
  { value: "labels",   label: "Labels",   icon: "Aa" },
  { value: "tooltips", label: "Tooltips", icon: "◎" },
];

export function ClassicVisualStyleSwitch({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
            value === opt.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span className="text-base leading-none">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
