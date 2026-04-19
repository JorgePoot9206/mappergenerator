"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ImageUploader } from "@/components/ImageUploader";
// ── Auto tab
import { ZoneMapClassic } from "@/components/ZoneMapClassic";
import { ClassicZonePanel } from "@/components/ClassicZonePanel";
import { ClassicExportMenu } from "@/components/ClassicExportMenu";
import { ClassicVisualStyleSwitch } from "@/components/ClassicVisualStyleSwitch";
// ── Manual tab
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { ZonePanel } from "@/components/ZonePanel";
import { ExportMenu } from "@/components/ExportMenu";

import type {
  // classic
  ClassicZone, ClassicZoneMapData, ClassicVisualStyle, ClassicAnalyzeResponse,
  // manual
  Zone, ZoneShape, ZoneMapData, DrawTool, AnalyzeResponse,
} from "@/types";

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

type AppMode = "auto" | "manual";
type AIProvider = "anthropic" | "gemini";

// ─────────────────────────────────────────────────────────────
//  Provider toggle
// ─────────────────────────────────────────────────────────────

function ProviderToggle({ value, onChange }: { value: AIProvider; onChange: (p: AIProvider) => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 text-xs font-medium">
      <button
        onClick={() => onChange("anthropic")}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${value === "anthropic" ? "bg-orange-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l6.57-16.48z" />
        </svg>
        Claude
      </button>
      <button
        onClick={() => onChange("gemini")}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${value === "gemini" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12z" />
        </svg>
        Gemini
      </button>
    </div>
  );
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}

function loadNotes(key: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(`zm_notes_${key}`) ?? "{}"); }
  catch { return {}; }
}
function saveNotes(key: string, notes: Record<string, string>) {
  localStorage.setItem(`zm_notes_${key}`, JSON.stringify(notes));
}

const ZONE_COLORS = [
  "#f97316","#ec4899","#eab308","#22c55e",
  "#06b6d4","#6366f1","#a855f7","#ef4444","#14b8a6","#f59e0b",
];
function nextColor(i: number) { return ZONE_COLORS[i % ZONE_COLORS.length]; }

// ─────────────────────────────────────────────────────────────
//  New-zone dialog (manual mode)
// ─────────────────────────────────────────────────────────────

function NewZoneDialog({
  shape, colorIndex, onConfirm, onCancel,
}: { shape: ZoneShape; colorIndex: number; onConfirm: (name: string, color: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(nextColor(colorIndex));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => onConfirm(name.trim() || `Zone ${colorIndex + 1}`, color);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-80">
        <h2 className="text-white font-bold text-lg mb-4">New Zone</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Name</label>
            <input ref={ref} type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
              placeholder={`Zone ${colorIndex + 1}`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {ZONE_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900" : "hover:scale-110"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">Shape: <span className="text-slate-400">{shape.type}</span></p>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={submit} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Add Zone</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Tab bar
// ─────────────────────────────────────────────────────────────

function ModeTabs({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1">
      <button onClick={() => onChange("auto")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "auto" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Auto-detect
      </button>
      <button onClick={() => onChange("manual")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "manual" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Manual Drawing
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Provider badge (shown on results)
// ─────────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: AIProvider }) {
  if (provider === "gemini") {
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-blue-950/60 border border-blue-800/60 rounded-lg text-blue-400 text-xs font-medium">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12z" />
        </svg>
        Gemini Flash
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-1 bg-orange-950/60 border border-orange-800/60 rounded-lg text-orange-400 text-xs font-medium">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-3.654 0H6.57L0 20h3.603l6.57-16.48z" />
      </svg>
      Claude
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<AppMode>("auto");

  // ── Shared image state ──────────────────────────────────────
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType]       = useState("");
  const [imageName, setImageName]     = useState("");
  const [imageKey, setImageKey]       = useState("");
  const [imageWidth, setImageWidth]   = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  // ── AUTO tab state ──────────────────────────────────────────
  const [classicZones, setClassicZones]               = useState<ClassicZone[]>([]);
  const [selectedClassicId, setSelectedClassicId]     = useState<string | null>(null);
  const [classicStyle, setClassicStyle]               = useState<ClassicVisualStyle>("polygons");
  const [classicImageType, setClassicImageType]       = useState("");
  const [classicDescription, setClassicDescription]  = useState("");
  const [autoLoading, setAutoLoading]                 = useState(false);
  const [autoError, setAutoError]                     = useState<string | null>(null);
  const [autoProvider, setAutoProvider]               = useState<AIProvider>("anthropic");
  const [autoUsedProvider, setAutoUsedProvider]       = useState<AIProvider | null>(null);

  // ── MANUAL tab state ────────────────────────────────────────
  const [manualZones, setManualZones]         = useState<Zone[]>([]);
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
  const [activeTool, setActiveTool]           = useState<DrawTool>("rect");
  const [pendingShape, setPendingShape]       = useState<ZoneShape | null>(null);
  const [manualLoading, setManualLoading]     = useState(false);
  const [manualError, setManualError]         = useState<string | null>(null);
  const [manualImageType, setManualImageType] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualProvider, setManualProvider]   = useState<AIProvider>("anthropic");
  const [manualUsedProvider, setManualUsedProvider] = useState<AIProvider | null>(null);

  // ─────────────────────────────────────────────────────────────
  //  AI classic analysis
  // ─────────────────────────────────────────────────────────────

  const runClassicAnalysis = useCallback(async (b64: string, mime: string, key: string, provider: AIProvider = "anthropic") => {
    setAutoLoading(true);
    setAutoError(null);
    setClassicZones([]);
    const endpoint = provider === "gemini" ? "/api/analyze-gemini-classic" : "/api/analyze-classic";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, mimeType: mime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error: string }).error ?? "Analysis failed");
      const result = data as ClassicAnalyzeResponse;
      const savedNotes = loadNotes(key);
      setClassicZones(result.zones.map((z) => ({ ...z, notes: savedNotes[z.id] ?? "" })));
      setClassicImageType(result.imageType);
      setClassicDescription(result.description);
      setAutoUsedProvider(provider);
    } catch (err) {
      setAutoError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAutoLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  Image upload
  // ─────────────────────────────────────────────────────────────

  const handleImageSelected = useCallback((file: File, base64: string, mime: string) => {
    const url = URL.createObjectURL(file);
    const key = hashString(file.name + file.size);
    setImageUrl(url);
    setImageBase64(base64);
    setMimeType(mime);
    setImageName(file.name);
    setImageKey(key);
    // Reset both tabs
    setClassicZones([]); setSelectedClassicId(null);
    setManualZones([]);  setSelectedManualId(null);
    setAutoError(null);  setManualError(null);
    const img = new Image();
    img.onload = () => { setImageWidth(img.naturalWidth); setImageHeight(img.naturalHeight); };
    img.src = url;
    // Auto tab runs immediately on upload
    if (mode === "auto") runClassicAnalysis(base64, mime, key, autoProvider);
  }, [mode, autoProvider, runClassicAnalysis]);

  const handleModeChange = useCallback((m: AppMode) => {
    setMode(m);
    setPendingShape(null);
    // Switching to auto with no zones yet → run analysis
    if (m === "auto" && imageBase64 && classicZones.length === 0 && !autoLoading) {
      runClassicAnalysis(imageBase64, mimeType, imageKey, autoProvider);
    }
  }, [imageBase64, mimeType, imageKey, classicZones.length, autoLoading, autoProvider, runClassicAnalysis]);

  const handleNewImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      handleImageSelected(file, result.split(",")[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  // ─────────────────────────────────────────────────────────────
  //  Classic zone interactions
  // ─────────────────────────────────────────────────────────────

  const handleClassicUpdate = useCallback((id: string, updates: Partial<ClassicZone>) => {
    setClassicZones((prev) => {
      const next = prev.map((z) => (z.id === id ? { ...z, ...updates } : z));
      if ("notes" in updates && imageKey) {
        const notes: Record<string, string> = {};
        next.forEach((z) => { notes[z.id] = z.notes; });
        saveNotes(imageKey, notes);
      }
      return next;
    });
  }, [imageKey]);

  // ─────────────────────────────────────────────────────────────
  //  Manual zone interactions
  // ─────────────────────────────────────────────────────────────

  const runManualAI = useCallback(async () => {
    if (!imageBase64 || !mimeType) return;
    setManualLoading(true);
    setManualError(null);
    const endpoint = manualProvider === "gemini" ? "/api/analyze-gemini" : "/api/analyze";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error: string }).error ?? "Analysis failed");
      const result = data as AnalyzeResponse;
      const savedNotes = loadNotes(imageKey);
      setManualZones(result.zones.map((z) => ({ ...z, notes: savedNotes[z.id] ?? "", href: "", target: "_blank" as const })));
      setManualImageType(result.imageType);
      setManualDescription(result.description);
      setManualUsedProvider(manualProvider);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setManualLoading(false);
    }
  }, [imageBase64, mimeType, imageKey, manualProvider]);

  const handleZoneCreated = useCallback((shape: ZoneShape) => {
    setPendingShape(shape);
    setActiveTool("select");
  }, []);

  const handleDialogConfirm = useCallback((name: string, color: string) => {
    if (!pendingShape) return;
    const zone: Zone = {
      id: `zone_${Date.now()}`, name, type: "area", description: "",
      notes: "", href: "", target: "_blank", color, shape: pendingShape,
    };
    setManualZones((prev) => [...prev, zone]);
    setSelectedManualId(zone.id);
    setPendingShape(null);
  }, [pendingShape]);

  const handleManualUpdate = useCallback((id: string, updates: Partial<Zone>) => {
    setManualZones((prev) => {
      const next = prev.map((z) => (z.id === id ? { ...z, ...updates } : z));
      if ("notes" in updates && imageKey) {
        const notes: Record<string, string> = {};
        next.forEach((z) => { notes[z.id] = z.notes; });
        saveNotes(imageKey, notes);
      }
      return next;
    });
  }, [imageKey]);

  const handleZoneMove = useCallback((id: string, dx: number, dy: number) => {
    setManualZones((prev) => prev.map((z) => {
      if (z.id !== id) return z;
      const { shape } = z;
      if (shape.type === "rect")   return { ...z, shape: { ...shape, x: shape.x + dx, y: shape.y + dy } };
      if (shape.type === "circle") return { ...z, shape: { ...shape, cx: shape.cx + dx, cy: shape.cy + dy } };
      if (shape.type === "poly")   return { ...z, shape: { ...shape, points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } };
      return z;
    }));
  }, []);

  const handleZoneDelete = useCallback((id: string) => {
    setManualZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedManualId((prev) => (prev === id ? null : prev));
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  Export data
  // ─────────────────────────────────────────────────────────────

  const classicExportData: ClassicZoneMapData = {
    imageType: classicImageType, description: classicDescription,
    imageName, exportedAt: new Date().toISOString(), zones: classicZones,
  };

  const manualExportData: ZoneMapData = {
    imageType: manualImageType, description: manualDescription,
    imageName, imageWidth, imageHeight,
    exportedAt: new Date().toISOString(), zones: manualZones,
  };

  const selectedClassicZone = classicZones.find((z) => z.id === selectedClassicId) ?? null;
  const selectedManualZone  = manualZones.find((z) => z.id === selectedManualId) ?? null;

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col">

      {/* ── Landing ─────────────────────────────────────────── */}
      {!imageUrl && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Create interactive{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                image maps
              </span>
            </h1>
          </div>

          <ModeTabs mode={mode} onChange={setMode} />

          <p className="text-slate-400 text-sm mt-4 mb-8 text-center max-w-md">
            {mode === "auto"
              ? "Upload any image — Claude detects all zones automatically and places interactive markers."
              : "Upload an image and draw zones manually (rectangles, circles, polygons) to create an HTML image map."}
          </p>

          <ImageUploader onImageSelected={handleImageSelected} />

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {["Floor plans","Parking lots","Office layouts","Geographic maps","Shopping malls","Venues"].map((ex) => (
              <span key={ex} className="px-3 py-1 bg-slate-800/80 text-slate-400 text-xs rounded-full border border-slate-700">{ex}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Editor ──────────────────────────────────────────── */}
      {imageUrl && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex-wrap">
            <ModeTabs mode={mode} onChange={handleModeChange} />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium truncate max-w-[160px]">{imageName}</span>
              {mode === "auto" && classicZones.length > 0 && (
                <span className="text-slate-500 text-xs flex-shrink-0">· {classicZones.length} zones</span>
              )}
              {mode === "manual" && manualZones.length > 0 && (
                <span className="text-slate-500 text-xs flex-shrink-0">· {manualZones.length} zones</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Auto tab controls */}
              {mode === "auto" && (
                <>
                  <ProviderToggle value={autoProvider} onChange={(p) => { setAutoProvider(p); setClassicZones([]); setAutoError(null); }} />
                  {classicZones.length > 0 && (
                    <ClassicVisualStyleSwitch value={classicStyle} onChange={setClassicStyle} />
                  )}
                  <button
                    onClick={() => runClassicAnalysis(imageBase64, mimeType, imageKey, autoProvider)}
                    disabled={autoLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className={`w-4 h-4 ${autoLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {autoLoading ? "Analyzing…" : "Regenerate"}
                  </button>
                  {classicZones.length > 0 && (
                    <ClassicExportMenu data={classicExportData} imageBase64={imageBase64} mimeType={mimeType} />
                  )}
                  {autoError && <span className="text-red-400 text-xs">{autoError}</span>}
                </>
              )}

              {/* Manual tab controls */}
              {mode === "manual" && (
                <>
                  <ProviderToggle value={manualProvider} onChange={(p) => { setManualProvider(p); }} />
                  {manualZones.length > 0 && (
                    <ExportMenu data={manualExportData} imageBase64={imageBase64} mimeType={mimeType} />
                  )}
                  {manualError && <span className="text-red-400 text-xs">{manualError}</span>}
                </>
              )}

              {/* New image */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                New image
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleNewImageFile(f); e.target.value = ""; }} />
              </label>
            </div>
          </div>

          {/* ── AUTO TAB ────────────────────────────────────── */}
          {mode === "auto" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto bg-slate-950 p-4">
                {/* Loading */}
                {autoLoading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                      <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-200 font-medium">{autoProvider === "gemini" ? "Gemini" : "Claude"} is analyzing the image…</p>
                      <p className="text-slate-400 text-sm mt-1">Detecting zones and regions</p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {autoError && !autoLoading && (
                  <div className="max-w-xl mx-auto mt-8 bg-red-950/50 border border-red-800 rounded-xl p-5">
                    <p className="text-red-300 font-medium">Analysis failed</p>
                    <p className="text-red-400 text-sm mt-1">{autoError}</p>
                    <button onClick={() => runClassicAnalysis(imageBase64, mimeType, imageKey)}
                      className="mt-3 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-100 rounded-lg text-sm transition-colors">
                      Try again
                    </button>
                  </div>
                )}

                {/* Map */}
                {!autoLoading && classicZones.length > 0 && (
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-3 flex items-center gap-2 text-sm flex-wrap">
                      {autoUsedProvider && <ProviderBadge provider={autoUsedProvider} />}
                      {classicImageType && (
                        <span className="px-2 py-1 bg-slate-900/80 rounded-lg border border-slate-800 text-indigo-400 font-medium">{classicImageType}</span>
                      )}
                      {classicDescription && <span className="text-slate-400 text-xs truncate">{classicDescription}</span>}
                    </div>
                    <ZoneMapClassic
                      imageUrl={imageUrl}
                      zones={classicZones}
                      selectedZoneId={selectedClassicId}
                      visualStyle={classicStyle}
                      onZoneClick={(z) => setSelectedClassicId((p) => (p === z.id ? null : z.id))}
                      onZoneNameEdit={(id, name) => handleClassicUpdate(id, { name })}
                    />
                    {/* Legend */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classicZones.map((zone) => (
                        <button key={zone.id}
                          onClick={() => setSelectedClassicId((p) => (p === zone.id ? null : zone.id))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                            selectedClassicId === zone.id ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                          }`}>
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: zone.color }} />
                          <span className="truncate">{zone.name}</span>
                          <span className="ml-auto text-yellow-500/70 flex-shrink-0 text-[10px]">{"★".repeat(zone.importance)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty */}
                {!autoLoading && classicZones.length === 0 && !autoError && (
                  <div className="max-w-4xl mx-auto opacity-40">
                    <img src={imageUrl} alt="Uploaded" className="w-full rounded-xl" />
                  </div>
                )}
              </div>

              {/* Classic side panel */}
              {selectedClassicZone && (
                <ClassicZonePanel
                  zone={selectedClassicZone}
                  onClose={() => setSelectedClassicId(null)}
                  onUpdate={handleClassicUpdate}
                />
              )}
            </div>
          )}

          {/* ── MANUAL TAB ──────────────────────────────────── */}
          {mode === "manual" && (
            <div className="flex flex-1 overflow-hidden">
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                zones={manualZones}
                selectedZoneId={selectedManualId}
                onZoneSelect={setSelectedManualId}
                onZoneDelete={handleZoneDelete}
                onAIDetect={runManualAI}
                aiLoading={manualLoading}
              />

              <div className="flex-1 overflow-auto bg-slate-950 p-4">
                <div className="w-full max-w-4xl mx-auto">
                  {(manualUsedProvider || manualImageType) && (
                    <div className="mb-3 flex items-center gap-2 text-sm flex-wrap">
                      {manualUsedProvider && <ProviderBadge provider={manualUsedProvider} />}
                      {manualImageType && (
                        <span className="px-2 py-1 bg-slate-900/80 rounded-lg border border-slate-800 text-indigo-400 font-medium">{manualImageType}</span>
                      )}
                      {manualDescription && <span className="text-slate-400 text-xs truncate">{manualDescription}</span>}
                    </div>
                  )}
                  <DrawingCanvas
                    imageUrl={imageUrl}
                    zones={manualZones}
                    selectedZoneId={selectedManualId}
                    activeTool={activeTool}
                    onZoneCreated={handleZoneCreated}
                    onZoneSelect={setSelectedManualId}
                    onZoneMove={handleZoneMove}
                  />
                </div>
              </div>

              {selectedManualZone && (
                <ZonePanel
                  zone={selectedManualZone}
                  onClose={() => setSelectedManualId(null)}
                  onUpdate={handleManualUpdate}
                />
              )}
            </div>
          )}

        </div>
      )}

      {/* New zone dialog */}
      {pendingShape && (
        <NewZoneDialog
          shape={pendingShape}
          colorIndex={manualZones.length}
          onConfirm={handleDialogConfirm}
          onCancel={() => { setPendingShape(null); setActiveTool("rect"); }}
        />
      )}
    </main>
  );
}
