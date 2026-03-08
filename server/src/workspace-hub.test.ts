import { describe, expect, it, vi } from "vitest";
import { WorkspaceHub } from "./workspace-hub";

function makeSocket(open = true): {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
} {
  return { readyState: open ? 1 : 3, OPEN: 1, send: vi.fn() };
}

describe("WorkspaceHub", () => {
  it("sends to all subscribers in a workspace", () => {
    const hub = new WorkspaceHub();
    const ws1 = makeSocket();
    const ws2 = makeSocket();
    hub.subscribe("abc", ws1 as never);
    hub.subscribe("abc", ws2 as never);

    hub.broadcast("abc", { type: "workspaceUpdated", title: "Hello" });

    expect(ws1.send).toHaveBeenCalledOnce();
    expect(ws2.send).toHaveBeenCalledOnce();
  });

  it("does not send to the excluded socket", () => {
    const hub = new WorkspaceHub();
    const ws1 = makeSocket();
    const ws2 = makeSocket();
    hub.subscribe("abc", ws1 as never);
    hub.subscribe("abc", ws2 as never);

    hub.broadcast("abc", { type: "workspaceUpdated", title: "Hello" }, ws1 as never);

    expect(ws1.send).not.toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalledOnce();
  });

  it("does not send to subscribers in other workspaces", () => {
    const hub = new WorkspaceHub();
    const ws1 = makeSocket();
    const ws2 = makeSocket();
    hub.subscribe("abc", ws1 as never);
    hub.subscribe("xyz", ws2 as never);

    hub.broadcast("abc", { type: "workspaceUpdated", title: "Hello" });

    expect(ws1.send).toHaveBeenCalledOnce();
    expect(ws2.send).not.toHaveBeenCalled();
  });

  it("silently skips closed sockets", () => {
    const hub = new WorkspaceHub();
    const ws = makeSocket(false);
    hub.subscribe("abc", ws as never);

    expect(() => hub.broadcast("abc", { type: "workspaceUpdated", title: "Hello" })).not.toThrow();
    expect(ws.send).not.toHaveBeenCalled();
  });

  it("unsubscribe removes the socket from future broadcasts", () => {
    const hub = new WorkspaceHub();
    const ws = makeSocket();
    hub.subscribe("abc", ws as never);
    hub.unsubscribe("abc", ws as never);

    hub.broadcast("abc", { type: "workspaceUpdated", title: "Hello" });

    expect(ws.send).not.toHaveBeenCalled();
  });
});
