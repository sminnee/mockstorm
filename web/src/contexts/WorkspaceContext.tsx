import type { Concept, Workspace } from "@mockstorm/shared";
import { type RefObject, createContext, useContext } from "react";

interface WorkspaceContextValue {
  workspace: Workspace;
  concepts: Concept[];
  wsRef: RefObject<WebSocket | null>;
  updateWorkspace: (fields: Partial<Pick<Workspace, "title" | "description">>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  return ctx;
}
