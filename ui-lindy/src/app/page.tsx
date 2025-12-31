"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import CreateSurface from "@/components/create/CreateSurface";
import { MOCK_MESSAGES, MOCK_PROJECTS, MockMessage } from "@/lib/mock";
import { SelectedItem } from "@/lib/types";
import { uid } from "@/lib/uid";

export default function Page() {
  const [uiMode, setUiMode] = useState<"create" | "build">("create");
  const [messages, setMessages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [selected, setSelected] = useState<SelectedItem>({ type: "none" });

  function handleCreate(prompt: string) {
    if (!prompt.trim()) return;

    setMessages([
      {
        id: uid(),
        role: "user",
        createdAt: new Date().toISOString(),
        blocks: [
          {
            id: uid(),
            kind: "text",
            title: "User Prompt",
            content: prompt,
          },
        ],
      },
    ]);

    setUiMode("build");
  }

  if (uiMode === "create") {
    return <CreateSurface onCreate={handleCreate} />;
  }

  return (
    <AppShell
      projects={MOCK_PROJECTS}
      activeProjectId={MOCK_PROJECTS[0].id}
      onSelectProject={() => {}}
      title="Universal AI Builder"
      messages={messages}
      selected={selected}
      onSelectBlock={(m, b) =>
        setSelected({ type: "message_block", messageId: m, blockId: b })
      }
      onClearSelection={() => setSelected({ type: "none" })}
      onSend={() => {}}
      onRun={() => {}}
    />
  );
}
