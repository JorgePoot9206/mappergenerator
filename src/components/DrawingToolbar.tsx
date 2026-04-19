"use client";

import type { DrawTool, Zone } from "@/types";

// ─────────────────────────────────────────────────────────────
//  DrawingToolbar — tool selector + zone list sidebar
// ─────────────────────────────────────────────────────────────

interface Props {
  activeTool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneSelect: (id: string) => void;
  onZoneDelete: (id: string) => void;
  onAIDetect: () => void;
  aiLoading: boolean;
}

const TOOLS: { id: DrawTool; label: string; icon: React.ReactNode }[] = [
  {
    id: "select",
    label: "Select / Move",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
      </svg>
    ),
  },
  {
    id: "rect",
    label: "Rectangle",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="5" width="18" height="14" rx="1" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: "circle",
    label: "Circle",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: "poly",
    label: "Polygon",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <polygon points="12,3 21,9 18,20 6,20 3,9" strokeWidth={2} />
      </svg>
    ),
  },
];

export function DrawingToolbar({
  activeTool,
  onToolChange,
  zones,
  selectedZoneId,
  onZoneSelect,
  onZoneDelete,
  onAIDetect,
  aiLoading,
}: Props) {
  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* ── Drawing tools ───────────────────────────────────── */}
      <div className="p-3 border-b border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Draw</p>
        <div className="grid grid-cols-2 gap-1.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={`
                flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
                ${activeTool === tool.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }
              `}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── AI auto-detect ───────────────────────────────────── */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onAIDetect}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
        >
          {aiLoading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Detecting…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Auto-detect
            </>
          )}
        </button>
        <p className="text-xs text-slate-600 mt-1.5 text-center">
          Let Claude detect zones
        </p>
      </div>

      {/* ── Zone list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Zones
            {zones.length > 0 && (
              <span className="ml-1.5 text-slate-600">({zones.length})</span>
            )}
          </p>
        </div>

        {zones.length === 0 ? (
          <p className="text-xs text-slate-600 text-center mt-6 px-4">
            Draw a shape on the image to add a zone
          </p>
        ) : (
          <ul className="px-2 pb-2 space-y-1">
            {zones.map((zone) => (
              <li key={zone.id}>
                <button
                  onClick={() => onZoneSelect(zone.id)}
                  className={`
                    w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors group
                    ${selectedZoneId === zone.id
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                    }
                  `}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: zone.color }}
                  />
                  <span className="flex-1 truncate">{zone.name}</span>
                  <span className="text-slate-600 flex-shrink-0 text-[10px] uppercase">
                    {zone.shape.type}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onZoneDelete(zone.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all ml-1 flex-shrink-0"
                    title="Delete zone"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Keyboard hints ───────────────────────────────────── */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="text-slate-500">Esc</span> cancel draw ·{" "}
          <span className="text-slate-500">dbl-click</span> close polygon
        </p>
      </div>
    </aside>
  );
}
