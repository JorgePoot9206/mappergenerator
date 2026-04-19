"use client";

import { useState } from "react";
import { SAMPLE_DATA } from "@/lib/sampleData";

const SNIPPET = `<!-- Option 1: Direct embed (self-contained) -->
<div id="zone-container">
  <!-- Paste the content of zonemap-widget.html here -->
</div>

<!-- Option 2: iframe (cleanest isolation) -->
<iframe
  src="./zonemap-widget.html"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>`;

export function HtmlTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build a minimal inline preview using the sample data
  const previewZones = SAMPLE_DATA.zones;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">HTML Widget</h2>
        <p className="text-slate-400">
          The exported <code className="text-indigo-400 text-sm">zonemap-widget.html</code> is a
          completely standalone file — the image is embedded as base64 and the zones are hardcoded
          as JSON. No external dependencies, no build step.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">How to use the widget</h3>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>In ZoneMapper, click <strong className="text-slate-200">Export → HTML widget</strong></li>
          <li>Save the downloaded <code className="text-indigo-400">zonemap-widget.html</code> to your project</li>
          <li>Embed it via <code className="text-indigo-400">&lt;iframe&gt;</code> or paste its source into your page</li>
          <li>Optionally customize the CSS inside the file — it&apos;s plain HTML/CSS/JS</li>
        </ol>
      </div>

      {/* Code snippet */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Integration snippet</h3>
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
          <code>{SNIPPET}</code>
        </pre>
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Live preview <span className="text-slate-500 font-normal">(sample data)</span>
        </h3>
        <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 aspect-[4/3] overflow-hidden">
            {/* Fake floor plan background */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-4 opacity-20">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-slate-400 rounded" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-slate-500 text-sm">[ Floor plan preview ]</span>
            </div>

            {/* Zone markers */}
            {previewZones.map((zone) => {
              const s = zone.shape;
              const cx = s.type === "rect" ? s.x + s.w / 2 : s.type === "circle" ? s.cx : s.type === "poly" && s.points.length ? s.points.reduce((a, p) => a + p.x, 0) / s.points.length : 50;
              const cy = s.type === "rect" ? s.y + s.h / 2 : s.type === "circle" ? s.cy : s.type === "poly" && s.points.length ? s.points.reduce((a, p) => a + p.y, 0) / s.points.length : 50;
              return (
              <div
                key={zone.id}
                className="absolute group"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/50 transition-transform duration-150 group-hover:scale-125"
                  style={{ background: zone.color, opacity: 0.85 }}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-xs font-semibold bg-slate-900/85 text-slate-100 px-1.5 py-0.5 rounded pointer-events-none">
                  {zone.name}
                </div>
                {/* Tooltip */}
                <div className="hidden group-hover:block absolute bottom-[130%] left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-xs min-w-[150px] z-10 pointer-events-none text-slate-100">
                  <div className="font-bold mb-1">{zone.name}</div>
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">{zone.type}</div>
                  <div className="text-slate-300 line-clamp-2">{zone.description}</div>
                </div>
              </div>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
            Interactive hover preview — hover over a zone marker to see tooltip
          </div>
        </div>
      </div>
    </div>
  );
}
