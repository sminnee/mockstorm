import type { ServerMessage, Workspace } from "@mockstorm/shared";
import { useCallback, useEffect, useRef, useState } from "react";

const WS_BASE = "ws://localhost:3001";

export function useWorkspaceWs(slug: string): {
  workspace: Workspace | null;
  updateWorkspace: (fields: Partial<Pick<Workspace, "title" | "description">>) => void;
} {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/${slug}`);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if (msg.type === "init") {
        setWorkspace(msg.workspace);
      } else if (msg.type === "workspaceUpdated") {
        setWorkspace((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(msg.title !== undefined ? { title: msg.title } : {}),
            ...(msg.description !== undefined ? { description: msg.description } : {}),
          };
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [slug]);

  const updateWorkspace = useCallback(
    (fields: Partial<Pick<Workspace, "title" | "description">>) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(fields));
      }
    },
    [],
  );

  return { workspace, updateWorkspace };
}
