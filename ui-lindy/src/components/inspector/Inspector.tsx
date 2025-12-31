"use client";

import { MockMessage } from "@/lib/mock";
import { SelectedItem } from "@/lib/types";
import { Box, ListChecks, FileText } from "lucide-react";

type Props = {
  messages: MockMessage[];
  selected: SelectedItem;
};

function kindIcon(kind: string) {
  switch (kind) {
    case "entity":
      return Box;
    case "plan":
      return ListChecks;
    default:
      return FileText;
  }
}

export default function Inspector({ messages, selected }: Props) {
  const selection =
    selected.type === "message_block"
      ? messages
          .find((m) => m.id === selected.messageId)
          ?.blocks.find((b) => b.id === selected.blockId)
      : null;

  if (!selection) {
    return (
      <div className="h-full p-6 text-sm text-white/45">
        <div className="text-xs uppercase tracking-wider text-white/35">
          Inspector
        </div>
        <div className="mt-6 leading-relaxed">
          Click a block in the canvas.
          <br />
          <br />
          <span className="text-white/35">
            Entities appear here as inspectable objects.
          </span>
        </div>
      </div>
    );
  }

  const Icon = kindIcon(selection.kind);

  return (
    <div className="h-full p-6 text-sm text-white/70">
      <div className="text-xs uppercase tracking-wider text-white/35">
        Inspector
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-white/70" />
          <div>
            <div className="text-white/95 font-semibold">
              {selection.title}
            </div>
            <div className="text-xs text-white/45 uppercase tracking-wider">
              {selection.kind}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 p-4 whitespace-pre-wrap text-white/75">
          {selection.content}
        </div>

        <div className="pt-4 text-xs text-white/35">
          UI-only representation
          <br />
          Backend will hydrate this object later
        </div>
      </div>
    </div>
  );
}
