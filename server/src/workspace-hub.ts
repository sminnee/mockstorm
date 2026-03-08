import type { ServerMessage } from "@mockstorm/shared";
import type { WebSocket } from "ws";

export class WorkspaceHub {
  private subscribers = new Map<string, Set<WebSocket>>();

  subscribe(slug: string, ws: WebSocket): void {
    if (!this.subscribers.has(slug)) this.subscribers.set(slug, new Set());
    this.subscribers.get(slug)?.add(ws);
  }

  unsubscribe(slug: string, ws: WebSocket): void {
    this.subscribers.get(slug)?.delete(ws);
  }

  broadcast(slug: string, message: ServerMessage, exclude?: WebSocket): void {
    const payload = JSON.stringify(message);
    for (const client of this.subscribers.get(slug) ?? []) {
      if (client !== exclude && client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }
}
