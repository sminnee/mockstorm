import type { Concept, ServerMessage } from "@mockstorm/shared";
import { type RefObject, useEffect, useState } from "react";

export function useConceptsWs(wsRef: RefObject<WebSocket | null>): {
  concepts: Concept[];
} {
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    function handleMessage(event: MessageEvent<string>) {
      const msg = JSON.parse(event.data) as ServerMessage;

      switch (msg.type) {
        case "conceptsInit":
          setConcepts(msg.concepts);
          break;
        case "conceptAdded":
          setConcepts((prev) => [...prev, msg.concept]);
          break;
        case "screenAdded":
          setConcepts((prev) =>
            prev.map((c) =>
              c.id === msg.conceptId ? { ...c, screens: [...c.screens, msg.screen] } : c,
            ),
          );
          break;
        case "screenThumbnailReady":
          setConcepts((prev) =>
            prev.map((c) =>
              c.id === msg.conceptId
                ? {
                    ...c,
                    screens: c.screens.map((s) =>
                      s.id === msg.screenId ? { ...s, thumbnailUrl: msg.thumbnailUrl } : s,
                    ),
                  }
                : c,
            ),
          );
          break;
      }
    }

    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [wsRef]);

  return { concepts };
}
