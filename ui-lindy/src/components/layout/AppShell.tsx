"use client";

import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatCanvas from "@/components/chat/ChatCanvas";
import Inspector from "@/components/inspector/Inspector";
import { MockMessage, MockProject } from "@/lib/mock";
import { SelectedItem } from "@/lib/types";

type Props = {
  projects: MockProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  title: string;
  messages: MockMessage[];
  selected: SelectedItem;
  onSelectBlock: (messageId: string, blockId: string) => void;
  onClearSelection: () => void;
  onSend: (text: string) => void;
  onRun: () => void;
};

export default function AppShell(props: Props) {
  return (
    <div className="h-full w-full builder-bg">
      <TopBar title={props.title} selectedLabel="Canvas Focus" />

      <div className="h-[calc(100vh-56px)] grid grid-cols-[260px_1fr_320px]">
        {/* SIDEBAR — PERIPHERAL */}
        <aside className="h-full bg-black/25 backdrop-blur-sm panel-recessed">
          <Sidebar
            projects={props.projects}
            activeProjectId={props.activeProjectId}
            onSelectProject={props.onSelectProject}
          />
        </aside>

        {/* CANVAS — AUTHORITY */}
        <main
          className="relative h-full bg-black/15"
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest('[data-selectable="true"]')) return;
            props.onClearSelection();
          }}
        >
          <ChatCanvas
            messages={props.messages}
            selected={props.selected}
            onSelectBlock={props.onSelectBlock}
            onSend={props.onSend}
            onRun={props.onRun}
          />
        </main>

        {/* INSPECTOR — PERIPHERAL */}
        <aside className="h-full bg-black/25 backdrop-blur-sm panel-recessed">
          <Inspector messages={props.messages} selected={props.selected} />
        </aside>
      </div>
    </div>
  );
}
