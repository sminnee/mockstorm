import type http from "node:http";
import type { Duplex } from "node:stream";
import type { ClientMessage, ServerMessage } from "@mockstorm/shared";
import { type WebSocket, WebSocketServer } from "ws";
import { WorkspaceHub } from "./workspace-hub";
import type { WorkspaceStore } from "./workspace-store";

interface UpgradeEmitter {
  on(
    event: "upgrade",
    listener: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): void;
}

export function attachWsServer(httpServer: UpgradeEmitter, store: WorkspaceStore): void {
  const wss = new WebSocketServer({ noServer: true });
  const hub = new WorkspaceHub();

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

    hub.subscribe(slug, ws);

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
      hub.broadcast(slug, updateMsg, ws);
    });

    ws.on("close", () => {
      hub.unsubscribe(slug, ws);
    });
  });
}
