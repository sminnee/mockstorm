import type { ServerMessage, Workspace } from "@mockstorm/shared";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useWorkspaceWs(slug: string): {
  workspace: Workspace | null;
  updateWorkspace: (fields: Partial<Pick<Workspace, "title" | "description">>) => void;
  wsRef: RefObject<WebSocket | null>;
} {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsBase = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws/${slug}`);
    wsRef.current = ws;

    function handleMessage(event: MessageEvent<string>) {
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
    }

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, [slug]);

  const updateWorkspace = useCallback(
    (fields: Partial<Pick<Workspace, "title" | "description">>) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "workspaceUpdate", ...fields }));
      }
    },
    [],
  );

  return { workspace, updateWorkspace, wsRef };
}
