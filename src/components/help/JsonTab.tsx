"use client";

import { useState } from "react";
import { SAMPLE_DATA } from "@/lib/sampleData";

export function JsonTab() {
  const [collapsed, setCollapsed] = useState(true);

  const sample = {
    ...SAMPLE_DATA,
    exportedAt: "2024-01-15T10:30:00.000Z",
    zones: SAMPLE_DATA.zones.slice(0, 2),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">JSON Structure</h2>
        <p className="text-slate-400">
          The exported JSON contains metadata about the image and a list of all detected zones.
          You can use this data to build your own integrations.
        </p>
      </div>

      {/* Field definitions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Root fields</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            { field: "imageType", type: "string", desc: "Type of space detected by Claude (e.g. \"Architectural floor plan\")" },
            { field: "description", type: "string", desc: "Human-readable summary of the image" },
            { field: "imageName", type: "string", desc: "Original filename of the uploaded image" },
            { field: "exportedAt", type: "ISO 8601", desc: "Date and time the export was generated" },
            { field: "zones", type: "Zone[]", desc: "Array of detected zone objects" },
          ].map(({ field, type, desc }) => (
            <div key={field} className="px-4 py-3 flex items-start gap-4">
              <code className="text-indigo-400 font-mono text-sm flex-shrink-0 w-32">{field}</code>
              <code className="text-emerald-400 font-mono text-xs flex-shrink-0 w-20 mt-0.5">{type}</code>
              <span className="text-slate-400 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Zone fields</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            { field: "id", type: "string", desc: "Unique identifier, e.g. \"zone_1\"" },
            { field: "name", type: "string", desc: "Human-readable zone name, editable in the UI" },
            { field: "type", type: "ZoneType", desc: "Category: room | parking | office | region | road | area | other" },
            { field: "description", type: "string", desc: "AI-generated description of the zone" },
            { field: "notes", type: "string", desc: "User-added annotations, persisted in localStorage" },
            { field: "importance", type: "1–5", desc: "Relevance score assigned by Claude" },
            { field: "position.x", type: "0–100", desc: "Horizontal center of zone as % of image width" },
            { field: "position.y", type: "0–100", desc: "Vertical center of zone as % of image height" },
            { field: "color", type: "#hex", desc: "Display color — warm tones for rooms, blue for water, green for vegetation, etc." },
          ].map(({ field, type, desc }) => (
            <div key={field} className="px-4 py-3 flex items-start gap-4">
              <code className="text-indigo-400 font-mono text-sm flex-shrink-0 w-32">{field}</code>
              <code className="text-emerald-400 font-mono text-xs flex-shrink-0 w-20 mt-0.5">{type}</code>
              <span className="text-slate-400 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible JSON example */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
        >
          <h3 className="text-sm font-semibold text-slate-200">Example JSON output</h3>
          <span className="text-slate-400 text-xs">{collapsed ? "▶ Expand" : "▼ Collapse"}</span>
        </button>
        {!collapsed && (
          <pre className="p-4 overflow-x-auto text-xs text-slate-300 leading-relaxed">
            {JSON.stringify(sample, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
