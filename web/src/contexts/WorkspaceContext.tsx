import type { ChatMessage, Concept, ToolCallInfo, Workspace } from "@mockstorm/shared";
import { type RefObject, createContext, useContext } from "react";

interface WorkspaceContextValue {
  workspace: Workspace;
  concepts: Concept[];
  wsRef: RefObject<WebSocket | null>;
  updateWorkspace: (fields: Partial<Pick<Workspace, "title" | "description">>) => void;
  annotationDataUrl: string | null;
  setAnnotationDataUrl: (url: string | null) => void;
  getAnnotationImage: (() => Promise<string>) | null;
  setGetAnnotationImage: (fn: (() => Promise<string>) | null) => void;
  hasAnnotations: boolean;
  setHasAnnotations: (v: boolean) => void;
  messages: ChatMessage[];
  toolCalls: Map<string, ToolCallInfo[]>;
  sendMessage: (
    content: string,
    context?: { conceptId?: string; screenId?: string; imageBase64?: string },
  ) => void;
  stop: () => void;
  isStreaming: boolean;
  chatError: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  return ctx;
}
