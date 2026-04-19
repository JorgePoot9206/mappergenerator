"use client";

import type { VisualStyle } from "@/types";

interface Props {
  value: VisualStyle;
  onChange: (style: VisualStyle) => void;
}

const OPTIONS: { value: VisualStyle; label: string; icon: string }[] = [
  { value: "fill",    label: "Fill",    icon: "⬡" },
  { value: "outline", label: "Outline", icon: "◻" },
  { value: "labels",  label: "Labels",  icon: "Aa" },
];

export function VisualStyleSwitch({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-all duration-150
            ${value === opt.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            }
          `}
        >
          <span className="text-base leading-none">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
