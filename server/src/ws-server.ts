import type http from "node:http";
import type { Duplex } from "node:stream";
import type { ClientMessage, ServerMessage } from "@mockstorm/shared";
import { type WebSocket, WebSocketServer } from "ws";
import type { WorkspaceStore } from "./workspace-store";

interface UpgradeEmitter {
  on(
    event: "upgrade",
    listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): void;
}

export function attachWsServer(httpServer: UpgradeEmitter, store: WorkspaceStore): void {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<string, Set<WebSocket>>();

  httpServer.on("upgrade", (req, socket, head) => {
    const url = req.url ?? "";
    const match = url.match(/^\/ws\/([^/?]+)/);
    if (!match) {
      socket.destroy();
      return;
    }
    const slug = match[1] ?? "";
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, slug);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, slug: string) => {
    const workspace = store.get(slug);
    if (!workspace) {
      ws.close(4004, "Workspace not found");
      return;
    }

    if (!clients.has(slug)) clients.set(slug, new Set());
    clients.get(slug)?.add(ws);

    const initMsg: ServerMessage = { type: "init", workspace };
    ws.send(JSON.stringify(initMsg));

    ws.on("message", (data) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(data.toString()) as ClientMessage;
      } catch {
        return;
      }

      const fields: Partial<{ title: string; description: string }> = {};
      if (msg.title !== undefined) fields.title = msg.title;
      if (msg.description !== undefined) fields.description = msg.description;

      store.update(slug, fields);

      const updateMsg: ServerMessage = { type: "workspaceUpdated", ...fields };
      const payload = JSON.stringify(updateMsg);
      for (const client of clients.get(slug) ?? []) {
        if (client.readyState === client.OPEN) {
          client.send(payload);
        }
      }
    });

    ws.on("close", () => {
      clients.get(slug)?.delete(ws);
    });
  });
}
