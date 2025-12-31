export type MockProject = {
  id: string;
  name: string;
  updatedAt: string;
};

export type MockBlockKind = "text" | "plan" | "entity" | "status";

export type MockBlock = {
  id: string;
  kind: MockBlockKind;
  title: string;
  content: string;
};

export type MockMessageRole = "user" | "assistant" | "system";

export type MockMessage = {
  id: string;
  role: MockMessageRole;
  createdAt: string;
  blocks: MockBlock[];
};

export const MOCK_PROJECTS: MockProject[] = [
  { id: "p1", name: "Universal AI Builder", updatedAt: new Date().toISOString() },
  { id: "p2", name: "Sales Outreach Agent", updatedAt: new Date().toISOString() },
  { id: "p3", name: "Support Triage Flow", updatedAt: new Date().toISOString() },
];

export const MOCK_MESSAGES: MockMessage[] = [
  {
    id: "m1",
    role: "assistant",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    blocks: [
      {
        id: "b1",
        kind: "text",
        title: "Welcome",
        content:
          "Describe what you want to build. I will draft entities, steps, and a runnable plan (UI-only stub for now).",
      },
      {
        id: "b2",
        kind: "plan",
        title: "Suggested Inputs",
        content:
          "Try: 'Build a lead-gen agent that scrapes a list, enriches contacts, drafts emails, and logs to a CRM.'",
      },
    ],
  },
  {
    id: "m2",
    role: "user",
    createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    blocks: [
      {
        id: "b3",
        kind: "text",
        title: "User Prompt",
        content: "Build a universal AI builder UI that feels like Lindy.",
      },
    ],
  },
  {
    id: "m3",
    role: "assistant",
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    blocks: [
      {
        id: "b4",
        kind: "entity",
        title: "Entity: BuilderAgent (Stub)",
        content: "name=BuilderAgent | tools=[web, email, sheets] | state=local",
      },
      {
        id: "b5",
        kind: "plan",
        title: "Plan (Stub)",
        content:
          "1) Capture requirements\n2) Generate entities\n3) Render workflow\n4) Run / Observe logs\n(Backend later)",
      },
    ],
  },
];
