export interface Workspace {
  slug: string;
  name: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type ClientMessage =
  | { type: "workspaceUpdate"; title?: string; description?: string }
  | { type: "chatSend"; content: string }
  | { type: "chatStop" };

export type ServerMessage =
  | { type: "init"; workspace: Workspace }
  | { type: "workspaceUpdated"; title?: string; description?: string }
  | { type: "chatHistory"; messages: ChatMessage[] }
  | { type: "chatUserMessage"; message: ChatMessage }
  | { type: "chatStreamStart"; messageId: string }
  | { type: "chatStreamChunk"; messageId: string; delta: string }
  | { type: "chatStreamEnd"; messageId: string; content: string }
  | { type: "chatError"; error: string };
