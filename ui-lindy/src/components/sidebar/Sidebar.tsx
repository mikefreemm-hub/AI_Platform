"use client";

import { Plus, Search } from "lucide-react";
import { MockProject } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Props = {
  projects: MockProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
};

export default function Sidebar({ projects, activeProjectId, onSelectProject }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3">
        <button
          className="w-full rounded-2xl bg-white text-black font-semibold text-sm py-2.5 hover:opacity-95 flex items-center justify-center gap-2"
          onClick={() => alert("UI-only: New Builder stub")}
        >
          <Plus className="h-4 w-4" />
          New Builder
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-white/50" />
          <input
            className="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/35"
            placeholder="Search projects…"
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="px-2 text-xs text-white/50 uppercase tracking-wider">
        Projects
      </div>

      <div className="mt-2 flex-1 overflow-auto px-2 pb-3">
        <div className="space-y-1">
          {projects.map((p) => {
            const active = p.id === activeProjectId;
            return (
              <button
                key={p.id}
                className={cn(
                  "w-full text-left rounded-2xl px-3 py-2 border",
                  active
                    ? "bg-white/10 border-white/15"
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                )}
                onClick={() => onSelectProject(p.id)}
              >
                <div className="text-sm font-medium text-white/85">{p.name}</div>
                <div className="text-xs text-white/40 truncate">
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
          <div className="text-sm font-semibold text-white/80">Builder Mode</div>
          <div className="text-xs text-white/45 mt-1">
            Chat → Entities → Inspect → Run (stub)
          </div>
        </div>
      </div>
    </div>
  );
}
