export interface Workspace {
  slug: string;
  name: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Screen {
  id: string;
  title: string;
  description: string;
  html: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  screens: Screen[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  conceptId?: string;
  screenId?: string;
}

export interface ToolCallInfo {
  messageId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: string;
  conceptId?: string;
  screenId?: string;
}

export type ClientMessage =
  | { type: "workspaceUpdate"; title?: string; description?: string }
  | { type: "chatSend"; content: string; conceptId?: string; screenId?: string }
  | { type: "chatStop" };

export type ServerMessage =
  | { type: "init"; workspace: Workspace }
  | { type: "workspaceUpdated"; title?: string; description?: string }
  | { type: "chatHistory"; messages: ChatMessage[] }
  | { type: "chatUserMessage"; message: ChatMessage }
  | { type: "chatStreamStart"; messageId: string }
  | { type: "chatStreamChunk"; messageId: string; delta: string }
  | { type: "chatStreamEnd"; messageId: string; content: string }
  | { type: "chatError"; error: string }
  | { type: "conceptsInit"; concepts: Concept[] }
  | { type: "conceptAdded"; concept: Concept }
  | { type: "screenAdded"; conceptId: string; screen: Screen }
  | {
      type: "screenThumbnailReady";
      conceptId: string;
      screenId: string;
      thumbnailUrl: string;
    }
  | { type: "conceptDeleted"; conceptId: string }
  | { type: "screenDeleted"; conceptId: string; screenId: string }
  | { type: "conceptUpdated"; conceptId: string; title?: string; description?: string }
  | { type: "screenUpdated"; conceptId: string; screen: Screen }
  | {
      type: "chatToolCall";
      messageId: string;
      toolName: string;
      args: Record<string, unknown>;
      result: string;
      conceptId?: string;
      screenId?: string;
    };
