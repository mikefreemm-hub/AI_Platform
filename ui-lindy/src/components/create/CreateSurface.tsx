"use client";

import { ArrowUp } from "lucide-react";
import { useState } from "react";
import TopNav from "./TopNav";

type Props = {
  onCreate: (prompt: string) => void;
};

const SUGGESTIONS = [
  "AI agent",
  "Website",
  "Automation",
  "App UI",
  "Workflow",
  "API",
  "Game",
  "Data tool",
];

export default function CreateSurface({ onCreate }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="h-full flex flex-col">
      <TopNav />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full text-center space-y-10">
          <h1 className="text-5xl font-semibold">
            Meet your universal AI creator
          </h1>

          <p className="text-xl text-slate-600">
            Describe anything digital you want to build. I’ll handle the rest.
          </p>

          <div className="card p-4 flex items-center gap-3">
            <input
              className="input flex-1 text-lg"
              placeholder="What do you want to create?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreate(text);
              }}
            />
            <button
              onClick={() => onCreate(text)}
              className="rounded-full bg-indigo-600 text-white h-11 w-11 flex items-center justify-center"
            >
              <ArrowUp size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => onCreate(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
