"use client";

const ZONE_TYPES = [
  {
    type: "room",
    label: "Room",
    color: "#f97316",
    description: "Individual enclosed spaces — bedrooms, living rooms, meeting rooms",
    useCases: ["Residential floor plans", "Hotel layouts", "School classrooms"],
    defaultColors: ["#f97316", "#ec4899", "#eab308", "#f43f5e"],
  },
  {
    type: "parking",
    label: "Parking",
    color: "#475569",
    description: "Vehicle parking spaces, bays, and related areas",
    useCases: ["Parking lot diagrams", "Garage layouts", "Airport parking"],
    defaultColors: ["#475569", "#64748b", "#334155"],
  },
  {
    type: "office",
    label: "Office",
    color: "#6366f1",
    description: "Workspaces — open plan, cubicles, individual offices",
    useCases: ["Corporate floor plans", "Co-working spaces", "Call centers"],
    defaultColors: ["#6366f1", "#8b5cf6", "#7c3aed", "#a78bfa"],
  },
  {
    type: "region",
    label: "Region",
    color: "#0ea5e9",
    description: "Geographic or administrative areas on maps",
    useCases: ["Geographic maps", "City districts", "Sales territories"],
    defaultColors: ["#0ea5e9", "#38bdf8", "#7dd3fc"],
  },
  {
    type: "road",
    label: "Road / Corridor",
    color: "#94a3b8",
    description: "Circulation paths — corridors, hallways, roads, aisles",
    useCases: ["Floor plans (hallways)", "Parking lot lanes", "Campus maps"],
    defaultColors: ["#94a3b8", "#64748b", "#cbd5e1"],
  },
  {
    type: "area",
    label: "Area",
    color: "#22c55e",
    description: "Open or outdoor spaces — gardens, plazas, natural features",
    useCases: ["Gardens", "Parks", "Open-plan zones", "Water features"],
    defaultColors: ["#22c55e", "#84cc16", "#06b6d4", "#3b82f6"],
  },
  {
    type: "other",
    label: "Other",
    color: "#a16207",
    description: "Anything that doesn't fit a standard category",
    useCases: ["Utility rooms", "Mechanical spaces", "Storage areas"],
    defaultColors: ["#a16207", "#92400e", "#78350f"],
  },
];

export function TypesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Zone Type Reference</h2>
        <p className="text-slate-400">
          Claude automatically assigns a type to each detected zone based on visual cues.
          You can rely on these types to filter, style, or process zones differently in your integration.
        </p>
      </div>

      {/* Type cards */}
      <div className="space-y-3">
        {ZONE_TYPES.map((zt) => (
          <div key={zt.type} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              {/* Color swatch */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ background: zt.color }}
              >
                <span className="font-mono opacity-80">{zt.type.slice(0, 2).toUpperCase()}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <code className="text-indigo-400 font-mono text-sm">"{zt.type}"</code>
                  <span className="text-slate-200 font-medium">{zt.label}</span>
                </div>
                <p className="text-slate-400 text-sm mb-3">{zt.description}</p>

                {/* Use cases */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {zt.useCases.map((uc) => (
                    <span key={uc} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                      {uc}
                    </span>
                  ))}
                </div>

                {/* Color palette */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Default colors:</span>
                  <div className="flex gap-1.5">
                    {zt.defaultColors.map((c) => (
                      <div
                        key={c}
                        className="w-5 h-5 rounded-full border border-slate-700"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TypeScript type definition */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">TypeScript type definition</h3>
        </div>
        <pre className="p-4 text-sm text-slate-300 leading-relaxed overflow-x-auto">
          <code>{`export type ZoneType =
  | "room"
  | "parking"
  | "office"
  | "region"
  | "road"
  | "area"
  | "other";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  notes: string;
  importance: number;   // 1–5
  position: {
    x: number;          // 0–100 (% of image width)
    y: number;          // 0–100 (% of image height)
  };
  color: string;        // hex, e.g. "#f97316"
}`}
          </code>
        </pre>
      </div>

      {/* Color system info */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Color assignment rules</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <p>Claude follows these guidelines when choosing zone colors:</p>
          <ul className="space-y-1 list-disc list-inside ml-2">
            <li>Rooms → warm tones (orange, pink, yellow, rose)</li>
            <li>Water / pools → blue shades (#06b6d4, #3b82f6)</li>
            <li>Vegetation / gardens → greens (#22c55e, #84cc16)</li>
            <li>Roads / circulation → neutral grays (#94a3b8, #64748b)</li>
            <li>Offices / workspaces → indigo / violet (#6366f1, #8b5cf6)</li>
            <li>Parking → dark slate (#475569, #334155)</li>
            <li>Geographic regions → light blues and teals</li>
          </ul>
          <p className="mt-2 text-slate-500 text-xs">
            All colors use Tailwind CSS palette values and are designed for readability on dark backgrounds.
          </p>
        </div>
      </div>
    </div>
  );
}
