import type { Concept, Workspace } from "@mockstorm/shared";
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
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  return ctx;
}
