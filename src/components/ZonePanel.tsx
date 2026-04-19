"use client";

import { useState, useEffect } from "react";
import type { Zone } from "@/types";

interface Props {
  zone: Zone;
  onClose: () => void;
  onUpdate: (zoneId: string, updates: Partial<Zone>) => void;
}

const TYPE_LABELS: Record<string, string> = {
  room: "Room",
  parking: "Parking",
  office: "Office",
  region: "Region",
  road: "Road / Corridor",
  area: "Area",
  other: "Other",
};

export function ZonePanel({ zone, onClose, onUpdate }: Props) {
  const [editName, setEditName] = useState(zone.name);
  const [editDesc, setEditDesc] = useState(zone.description);
  const [editNotes, setEditNotes] = useState(zone.notes);
  const [editHref, setEditHref] = useState(zone.href);
  const [editTarget, setEditTarget] = useState<"_blank" | "_self">(zone.target);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when zone changes
  useEffect(() => {
    setEditName(zone.name);
    setEditDesc(zone.description);
    setEditNotes(zone.notes);
    setEditHref(zone.href);
    setEditTarget(zone.target);
    setIsDirty(false);
  }, [zone.id, zone.name, zone.description, zone.notes, zone.href, zone.target]);

  const handleSave = () => {
    onUpdate(zone.id, {
      name: editName.trim() || zone.name,
      description: editDesc.trim() || zone.description,
      notes: editNotes,
      href: editHref.trim(),
      target: editTarget,
    });
    setIsDirty(false);
  };

  const markDirty = () => setIsDirty(true);

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: zone.color }}
          />
          <div className="min-w-0">
            <h2 className="font-bold text-white text-sm leading-tight truncate">
              {zone.name}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 uppercase tracking-wider">
              {TYPE_LABELS[zone.type] ?? zone.type}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0 p-1 -mr-1"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Editable fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => { setEditName(e.target.value); markDirty(); }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Zone name…"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Description <span className="normal-case text-slate-500 ml-1">(AI generated)</span>
          </label>
          <textarea
            value={editDesc}
            onChange={(e) => { setEditDesc(e.target.value); markDirty(); }}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Zone description…"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Notes <span className="normal-case text-slate-500 ml-1">(your annotations)</span>
          </label>
          <textarea
            value={editNotes}
            onChange={(e) => { setEditNotes(e.target.value); markDirty(); }}
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Add your own notes here…"
          />
          <p className="text-xs text-slate-600 mt-1">Saved automatically to localStorage</p>
        </div>

        {/* Link (href) */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Link URL <span className="normal-case text-slate-500 ml-1">(for HTML map)</span>
          </label>
          <input
            type="url"
            value={editHref}
            onChange={(e) => { setEditHref(e.target.value); markDirty(); }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="https://example.com/…"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Open link in
          </label>
          <div className="flex gap-2">
            {(["_blank", "_self"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setEditTarget(t); markDirty(); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  editTarget === t
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {t === "_blank" ? "New tab" : "Same tab"}
              </button>
            ))}
          </div>
        </div>

        {/* Zone ID (read-only) */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
            Zone ID
          </label>
          <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono">
            {zone.id}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${isDirty
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
        >
          {isDirty ? "Save changes" : "No changes"}
        </button>
      </div>
    </aside>
  );
}
