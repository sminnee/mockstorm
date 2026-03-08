import { ActionIcon, Anchor, Badge, Button, Group, Text, Title } from "@mantine/core";
import { VIEWPORT_WIDTHS } from "@mockstorm/shared";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCode,
  IconEraser,
  IconPencil,
  IconPhoto,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { AnnotationCanvas, type AnnotationCanvasHandle } from "./AnnotationCanvas";

/** djb2 string hash — returns a short numeric string for use as a React key */
function hashString(s: string): string {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function ScreenView() {
  const { slug, cid, sid } = useParams<{ slug: string; cid: string; sid: string }>();
  const { concepts, wsRef, setGetAnnotationImage, setHasAnnotations } = useWorkspaceContext();
  const navigate = useNavigate();
  const [annotationMode, setAnnotationMode] = useState(false);
  const [hasAnnotations, setLocalHasAnnotations] = useState(false);
  const annotationRef = useRef<AnnotationCanvasHandle>(null);

  const concept = concepts.find((c) => c.id === cid);
  const screen = concept?.screens.find((s) => s.id === sid);
  const screenIndex = concept?.screens.findIndex((s) => s.id === sid) ?? -1;

  const compositeAnnotation = useCallback(async (): Promise<string> => {
    if (!screen?.thumbnailUrl || !annotationRef.current?.canvas) return "";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = screen.thumbnailUrl;
    await new Promise((r) => {
      img.onload = r;
    });
    const offscreen = document.createElement("canvas");
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(img, 0, 0);
    ctx.drawImage(annotationRef.current.canvas, 0, 0, offscreen.width, offscreen.height);
    return offscreen.toDataURL("image/png").split(",")[1] ?? "";
  }, [screen?.thumbnailUrl]);

  // Register compositing function into context
  useEffect(() => {
    if (hasAnnotations) {
      setGetAnnotationImage(compositeAnnotation);
    } else {
      setGetAnnotationImage(null);
    }
    setHasAnnotations(hasAnnotations);
    return () => {
      setGetAnnotationImage(null);
      setHasAnnotations(false);
    };
  }, [hasAnnotations, compositeAnnotation, setGetAnnotationImage, setHasAnnotations]);

  const handleSendAnnotations = useCallback(async () => {
    const imageBase64 = await compositeAnnotation();
    if (!imageBase64) return;
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "chatSend",
          content: "[Annotated screenshot]",
          imageBase64,
          ...(cid ? { conceptId: cid } : {}),
          ...(sid ? { screenId: sid } : {}),
        }),
      );
    }
    annotationRef.current?.clear();
    setAnnotationMode(false);
  }, [compositeAnnotation, wsRef, cid, sid]);

  if (!concept) return <Text c="dimmed">Concept not found.</Text>;
  if (!screen) return <Text c="dimmed">Screen not found.</Text>;

  const prevScreen = screenIndex > 0 ? concept.screens[screenIndex - 1] : null;
  const nextScreen =
    screenIndex < concept.screens.length - 1 ? concept.screens[screenIndex + 1] : null;

  return (
    <>
      <Group mb="md" justify="space-between">
        <Group>
          <Anchor component={Link} to={`/${slug}/concepts/${cid}`} size="sm">
            &larr; {concept.title}
          </Anchor>
        </Group>
        <Group gap="xs">
          <ActionIcon
            component="a"
            href={`/api/workspaces/${slug}/screens/${sid}/download.html`}
            variant="subtle"
            color="gray"
            title="Download HTML"
          >
            <IconCode size={16} />
          </ActionIcon>
          {screen.thumbnailUrl && (
            <ActionIcon
              component="a"
              href={`/api/workspaces/${slug}/screens/${sid}/thumbnail.png?download=true`}
              variant="subtle"
              color="gray"
              title="Download image"
            >
              <IconPhoto size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant={annotationMode ? "filled" : "subtle"}
            color={annotationMode ? "red" : "gray"}
            onClick={() => setAnnotationMode((v) => !v)}
            title={annotationMode ? "Exit annotation mode" : "Annotate screen"}
          >
            <IconPencil size={16} />
          </ActionIcon>
          {hasAnnotations && (
            <>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => annotationRef.current?.clear()}
                title="Clear annotations"
              >
                <IconEraser size={16} />
              </ActionIcon>
              <Button size="compact-xs" color="red" onClick={handleSendAnnotations}>
                Send annotations
              </Button>
            </>
          )}
          <ActionIcon
            variant="subtle"
            disabled={!prevScreen}
            onClick={() =>
              prevScreen && navigate(`/${slug}/concepts/${cid}/screens/${prevScreen.id}`)
            }
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed">
            {screenIndex + 1} / {concept.screens.length}
          </Text>
          <ActionIcon
            variant="subtle"
            disabled={!nextScreen}
            onClick={() =>
              nextScreen && navigate(`/${slug}/concepts/${cid}/screens/${nextScreen.id}`)
            }
          >
            <IconArrowRight size={16} />
          </ActionIcon>
        </Group>
      </Group>
      <Group mb="md" gap="xs" align="center">
        <Title order={4}>{screen.title}</Title>
        <Badge variant="light" size="sm">
          {screen.viewport ?? "laptop"}
        </Badge>
      </Group>
      {(() => {
        const vp = screen.viewport ?? "laptop";
        const vpWidth = VIEWPORT_WIDTHS[vp];
        return (
          <div style={{ maxWidth: vpWidth, margin: "0 auto", position: "relative" }}>
            <iframe
              key={hashString(screen.html)}
              src={`/api/workspaces/${slug}/screens/${sid}/html`}
              sandbox="allow-same-origin"
              title={screen.title}
              style={{
                width: "100%",
                height: "calc(100vh - 300px)",
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 8,
                background: "white",
                display: "block",
              }}
            />
            <AnnotationCanvas
              ref={annotationRef}
              width={vpWidth}
              height={Math.round(vpWidth * 0.75)}
              disabled={!annotationMode}
              onAnnotationChange={setLocalHasAnnotations}
            />
          </div>
        );
      })()}
    </>
  );
}
