import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

interface AnnotationCanvasProps {
  width: number;
  height: number;
  disabled: boolean;
  onAnnotationChange: (hasAnnotations: boolean) => void;
}

export interface AnnotationCanvasHandle {
  canvas: HTMLCanvasElement | null;
  clear: () => void;
}

export const AnnotationCanvas = forwardRef<AnnotationCanvasHandle, AnnotationCanvasProps>(
  function AnnotationCanvas({ width, height, disabled, onAnnotationChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const hasStrokesRef = useRef(false);

    useImperativeHandle(ref, () => ({
      get canvas() {
        return canvasRef.current;
      },
      clear() {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        hasStrokesRef.current = false;
        onAnnotationChange(false);
      },
    }));

    const startStroke = useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        isDrawingRef.current = true;
        canvas.setPointerCapture(e.pointerId);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      },
      [disabled],
    );

    const draw = useCallback((e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      ctx.lineTo(x, y);
      ctx.stroke();
    }, []);

    const endStroke = useCallback(() => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        hasStrokesRef.current = true;
        onAnnotationChange(true);
      }
    }, [onAnnotationChange]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={startStroke}
        onPointerMove={draw}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: disabled ? "none" : "auto",
          cursor: disabled ? "default" : "crosshair",
          borderRadius: 8,
        }}
      />
    );
  },
);
