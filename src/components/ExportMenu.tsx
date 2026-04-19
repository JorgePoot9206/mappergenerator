"use client";

import { useState, useRef, useEffect } from "react";
import type { ZoneMapData } from "@/types";
import { exportJSON, exportHTML, exportHTMLMap, exportImageMapSnippet, exportReact } from "@/lib/exporters";

interface Props {
  data: ZoneMapData;
  imageBase64: string;
  mimeType: string;
}

export function ExportMenu({ data, imageBase64, mimeType }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    {
      label: "Image Map snippet",
      description: "<img usemap> + <map> solo coords",
      icon: "📋",
      action: () => { exportImageMapSnippet(data); setOpen(false); },
    },
    {
      label: "HTML Image Map",
      description: "Página completa con imagen embebida",
      icon: "🗺",
      action: () => { exportHTMLMap(data, imageBase64, mimeType); setOpen(false); },
    },
    {
      label: "JSON data",
      description: "zonemap-data.json",
      icon: "{ }",
      action: () => { exportJSON(data); setOpen(false); },
    },
    {
      label: "HTML widget",
      description: "SVG overlay, no deps",
      icon: "</>",
      action: () => { exportHTML(data, imageBase64, mimeType); setOpen(false); },
    },
    {
      label: "React component",
      description: "ZoneMap.tsx + data JSON",
      icon: "⚛",
      action: () => { exportReact(data); setOpen(false); },
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <span className="font-mono text-emerald-400 text-sm mt-0.5 w-6 flex-shrink-0">
                  {opt.icon}
                </span>
                <div>
                  <div className="text-white text-sm font-medium">{opt.label}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
