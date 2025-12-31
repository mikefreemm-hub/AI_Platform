export type SelectedItem =
  | { type: "none" }
  | { type: "message_block"; messageId: string; blockId: string };
