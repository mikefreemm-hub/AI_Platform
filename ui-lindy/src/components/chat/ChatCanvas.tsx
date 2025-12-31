"use client";

import { useEffect, useRef, useState } from "react";
import { Play, SendHorizontal } from "lucide-react";
import { MockMessage } from "@/lib/mock";
import ChatMessage from "@/components/chat/ChatMessage";
import { SelectedItem } from "@/lib/types";

type Props = {
  messages: MockMessage[];
  selected: SelectedItem;
  onSelectBlock: (messageId: string, blockId: string) => void;
  onSend: (text: string) => void;
  onRun: () => void;
};

export default function ChatCanvas(props: Props) {
  const [text, setText] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [props.messages.length]);

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollerRef} className="flex-1 overflow-auto px-8 pt-10 pb-32">
        <div className="max-w-3xl mx-auto space-y-6">
          {props.messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              selected={props.selected}
              onSelectBlock={props.onSelectBlock}
            />
          ))}
        </div>
      </div>

      {/* COMPOSER */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur border-t border-white/10">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-end gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what to build…"
            className="flex-1 resize-none bg-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/85 outline-none placeholder:text-white/35"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                props.onSend(text);
                setText("");
              }
            }}
          />

          <button
            onClick={() => {
              props.onSend(text);
              setText("");
            }}
            className="rounded-xl bg-white text-black font-semibold px-4 py-3 hover:opacity-95"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>

          <button
            onClick={props.onRun}
            className="rounded-xl bg-emerald-400/20 text-emerald-200 font-semibold px-4 py-3 hover:bg-emerald-400/30"
          >
            <Play className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
