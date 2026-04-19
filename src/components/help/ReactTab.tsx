"use client";

import { useState } from "react";
import { SAMPLE_DATA } from "@/lib/sampleData";
import type { Zone } from "@/types";

const USAGE_CODE = `import { ZoneMap } from './ZoneMap';
import zoneData from './zonemap-data.json';

export default function MyPage() {
  return (
    <div style={{ padding: 24, background: '#0f172a' }}>
      <h1 style={{ color: 'white', marginBottom: 16 }}>
        {zoneData.imageName}
      </h1>
      <ZoneMap
        imageUrl="/your-floor-plan.png"
        width="100%"
      />
    </div>
  );
}`;

/** Minimal live preview of the ZoneMap component logic */
function LiveZoneMapPreview() {
  const [selected, setSelected] = useState<Zone | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const zones = SAMPLE_DATA.zones;

  return (
    <div className="flex gap-4">
      {/* Map */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden aspect-[4/3]">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-4 opacity-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-slate-400 rounded" />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-slate-500 text-sm">[ Sample floor plan ]</span>
        </div>
        {zones.map((zone) => {
          const s = zone.shape;
          const cx = s.type === "rect" ? s.x + s.w / 2 : s.type === "circle" ? s.cx : s.type === "poly" && s.points.length ? s.points.reduce((a, p) => a + p.x, 0) / s.points.length : 50;
          const cy = s.type === "rect" ? s.y + s.h / 2 : s.type === "circle" ? s.cy : s.type === "poly" && s.points.length ? s.points.reduce((a, p) => a + p.y, 0) / s.points.length : 50;
          return (
          <div
            key={zone.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
              transform: "translate(-50%, -50%)",
              zIndex: selected?.id === zone.id ? 20 : hovered === zone.id ? 10 : 5,
            }}
            onClick={() => setSelected((p) => (p?.id === zone.id ? null : zone))}
            onMouseEnter={() => setHovered(zone.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: zone.color,
                border: selected?.id === zone.id ? "3px solid white" : "2px solid rgba(255,255,255,0.5)",
                opacity: hovered === zone.id || selected?.id === zone.id ? 1 : 0.75,
                transform: hovered === zone.id ? "scale(1.25)" : "scale(1)",
                transition: "all 0.15s",
                boxShadow: selected?.id === zone.id ? `0 0 0 4px ${zone.color}40` : undefined,
              }}
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-xs font-semibold bg-slate-900/85 text-slate-100 px-1.5 py-0.5 rounded pointer-events-none">
              {zone.name}
            </div>
          </div>
          );
        })}
      </div>

      {/* Side panel */}
      {selected && (
        <div className="w-52 flex-shrink-0 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
            <span className="font-bold text-white">{selected.name}</span>
          </div>
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">{selected.type}</div>
          <p className="text-slate-300 text-xs leading-relaxed mb-3">{selected.description}</p>
          <button
            onClick={() => setSelected(null)}
            className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Close ×
          </button>
        </div>
      )}
    </div>
  );
}

export function ReactTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(USAGE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">React / Next.js Component</h2>
        <p className="text-slate-400">
          Export a ready-to-use <code className="text-indigo-400 text-sm">ZoneMap.tsx</code> component
          and a <code className="text-indigo-400 text-sm">zonemap-data.json</code> file.
          Drop both into your React or Next.js project and you&apos;re done.
        </p>
      </div>

      {/* Steps */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Setup steps</h3>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>In ZoneMapper, click <strong className="text-slate-200">Export → React component</strong></li>
          <li>Copy <code className="text-indigo-400">ZoneMap.tsx</code> and <code className="text-indigo-400">zonemap-data.json</code> into your project</li>
          <li>Place your original image in the <code className="text-indigo-400">public/</code> folder</li>
          <li>Import and use the component as shown below</li>
        </ol>
      </div>

      {/* Usage code */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Usage example</h3>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? "bg-emerald-700 text-emerald-100"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-slate-300 leading-relaxed">
          <code>{USAGE_CODE}</code>
        </pre>
      </div>

      {/* Props table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Component props</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {[
            { prop: "imageUrl", type: "string", required: true, desc: "URL or import path for the background image" },
            { prop: "width", type: "string | number", required: false, desc: "Container width, e.g. \"100%\" or 800. Default: \"100%\"" },
            { prop: "height", type: "string | number", required: false, desc: "Container height. Default: \"auto\"" },
          ].map(({ prop, type, required, desc }) => (
            <div key={prop} className="px-4 py-3 flex items-start gap-4">
              <code className="text-indigo-400 font-mono text-sm flex-shrink-0 w-24">{prop}</code>
              <code className="text-emerald-400 font-mono text-xs flex-shrink-0 w-28 mt-0.5">{type}</code>
              <div className="flex-1">
                <span className={`text-[10px] uppercase tracking-wider mr-2 ${required ? "text-orange-400" : "text-slate-600"}`}>
                  {required ? "required" : "optional"}
                </span>
                <span className="text-slate-400 text-sm">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Live preview <span className="text-slate-500 font-normal">(rendered with sample data)</span>
        </h3>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <LiveZoneMapPreview />
          <p className="text-xs text-slate-500 mt-3 text-center">
            Click a zone marker to open the side panel
          </p>
        </div>
      </div>
    </div>
  );
}
