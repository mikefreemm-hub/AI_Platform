"use client";

import { MockMessage } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { SelectedItem } from "@/lib/types";
import { FileText, ListChecks, Box } from "lucide-react";

type Props = {
  message: MockMessage;
  selected: SelectedItem;
  onSelectBlock: (messageId: string, blockId: string) => void;
};

function blockMeta(kind: string) {
  switch (kind) {
    case "entity":
      return {
        icon: Box,
        ring: "ring-indigo-400/40",
        bg: "bg-indigo-500/[0.12]",
        label: "ENTITY",
      };
    case "plan":
      return {
        icon: ListChecks,
        ring: "ring-emerald-400/40",
        bg: "bg-emerald-500/[0.10]",
        label: "PLAN",
      };
    default:
      return {
        icon: FileText,
        ring: "ring-white/20",
        bg: "bg-white/[0.05]",
        label: "TEXT",
      };
  }
}

export default function ChatMessage({ message, selected, onSelectBlock }: Props) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  return (
    <div className={cn("space-y-2", isAssistant && "pt-4")}>
      <div className="text-[11px] uppercase tracking-wider text-white/35">
        {message.role}
      </div>

      <div
        className={cn(
          "rounded-2xl p-4",
          isAssistant && "bg-white/[0.06]",
          isUser && "bg-white/[0.03] ml-auto max-w-[75%]",
          message.role === "system" && "bg-emerald-500/[0.08]"
        )}
      >
        <div className="space-y-3">
          {message.blocks.map((b) => {
            const meta = blockMeta(b.kind);
            const Icon = meta.icon;

            const active =
              selected.type === "message_block" &&
              selected.messageId === message.id &&
              selected.blockId === b.id;

            return (
              <button
                key={b.id}
                data-selectable="true"
                onClick={() => onSelectBlock(message.id, b.id)}
                className={cn(
                  "w-full text-left rounded-xl px-4 py-3 transition",
                  meta.bg,
                  "hover:bg-white/[0.08]",
                  active
                    ? cn("ring-2", meta.ring)
                    : "ring-1 ring-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-white/70" />
                    <div className="text-sm font-semibold text-white/90">
                      {b.title}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/45">
                    {meta.label}
                  </div>
                </div>

                <div className="mt-2 text-sm text-white/75 whitespace-pre-wrap">
                  {b.content}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
