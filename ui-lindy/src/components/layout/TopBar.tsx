"use client";

import { Sparkles, Shield, Zap } from "lucide-react";

type Props = {
  title: string;
  selectedLabel: string;
};

export default function TopBar({ title, selectedLabel }: Props) {
  return (
    <div className="h-14 w-full flex items-center justify-between px-4 border-b border-white/10 bg-black/35 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white/90" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="text-xs text-white/50">{selectedLabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 text-xs text-white/60">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            <Shield className="h-3.5 w-3.5" />
            UI-only
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            <Zap className="h-3.5 w-3.5" />
            Stub runtime
          </span>
        </div>

        <button
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-medium text-white/80"
          onClick={() => alert("UI-only: Settings stub")}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
