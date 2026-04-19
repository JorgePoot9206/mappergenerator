"use client";

import { useState } from "react";
import { JsonTab } from "@/components/help/JsonTab";
import { HtmlTab } from "@/components/help/HtmlTab";
import { ReactTab } from "@/components/help/ReactTab";
import { TypesTab } from "@/components/help/TypesTab";

type TabId = "json" | "html" | "react" | "types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "json",  label: "JSON Structure",    icon: "{ }" },
  { id: "html",  label: "HTML Vanilla",      icon: "</>" },
  { id: "react", label: "React / Next.js",   icon: "⚛"  },
  { id: "types", label: "Type Reference",    icon: "◈"  },
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabId>("json");

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
          <a href="/" className="hover:text-slate-300 transition-colors">App</a>
          <span>›</span>
          <span className="text-slate-300">Documentation</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Integration Guide</h1>
        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
          Learn how to use ZoneMapper exports in your own projects. Choose your integration
          method and follow the interactive examples below.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900 rounded-xl p-1.5 border border-slate-800 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-shrink-0
              transition-all duration-150
              ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }
            `}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pb-16">
        {activeTab === "json"  && <JsonTab />}
        {activeTab === "html"  && <HtmlTab />}
        {activeTab === "react" && <ReactTab />}
        {activeTab === "types" && <TypesTab />}
      </div>
    </main>
  );
}
