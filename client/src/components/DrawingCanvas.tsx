import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement
} from 'react';

import { useAppContext } from '@/hooks/useAppContext';
import type { DrawingPoint, DrawingStrokePayload, DrawingTool } from '@/types/drawing';
import { cn } from '@/utils/className';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 420;
const DEFAULT_COLOR = '#2563eb';
const DEFAULT_BRUSH_SIZE = 4;
const ERASER_COLOR = '#ffffff';

const createStrokeId = (): string => crypto.randomUUID();

export const DrawingCanvas = (): ReactElement => {
  const { socket } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<DrawingStrokePayload | null>(null);
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return null;
    }

    const context = canvas.getContext('2d');

    if (context === null) {
      return null;
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';
    return context;
  }, []);

  const drawSegment = useCallback(
    (start: DrawingPoint, end: DrawingPoint, stroke: DrawingStrokePayload): void => {
      const context = getContext();

      if (context === null) {
        return;
      }

      context.globalCompositeOperation =
        stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      context.strokeStyle = stroke.tool === 'eraser' ? ERASER_COLOR : stroke.color;
      context.lineWidth = stroke.size;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.globalCompositeOperation = 'source-over';
    },
    [getContext]
  );

  const drawStroke = useCallback(
    (stroke: DrawingStrokePayload): void => {
      for (let index = 1; index < stroke.points.length; index += 1) {
        const start = stroke.points[index - 1];
        const end = stroke.points[index];
        drawSegment(start, end, stroke);
      }
    },
    [drawSegment]
  );

  const clearCanvas = useCallback((): void => {
    const context = getContext();

    if (context === null) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [getContext]);

  useEffect(() => {
    const handleRemoteStroke = (stroke: DrawingStrokePayload): void => {
      drawStroke(stroke);
    };

    socket.on('drawing:stroke', handleRemoteStroke);
    socket.on('drawing:clear', clearCanvas);

    return () => {
      socket.off('drawing:stroke', handleRemoteStroke);
      socket.off('drawing:clear', clearCanvas);
    };
  }, [clearCanvas, drawStroke, socket]);

  const getCanvasPoint = (event: MouseEvent<HTMLCanvasElement>): DrawingPoint => {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  };

  const handlePointerDown = (event: MouseEvent<HTMLCanvasElement>): void => {
    const point = getCanvasPoint(event);
    currentStrokeRef.current = {
      id: createStrokeId(),
      tool,
      color,
      size: brushSize,
      points: [point]
    };
  };

  const handlePointerMove = (event: MouseEvent<HTMLCanvasElement>): void => {
    if (event.buttons !== 1 || currentStrokeRef.current === null) {
      return;
    }

    const point = getCanvasPoint(event);
    const previousPoint =
      currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];

    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, point]
    };
    drawSegment(previousPoint, point, currentStrokeRef.current);
  };

  const finishStroke = (): void => {
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (stroke === null || stroke.points.length < 2) {
      return;
    }

    socket.emit('drawing:stroke', stroke);
  };

  const handleClear = (): void => {
    clearCanvas();
    socket.emit('drawing:clear');
  };

  return (
    <section
      className="mt-6 rounded-lg border border-slate-200 bg-white"
      aria-label="Collaborative drawing canvas"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 p-3">
        <button
          type="button"
          onClick={() => {
            setTool('brush');
          }}
          className={cn(
            'rounded-md border px-3 py-2 text-sm font-medium',
            tool === 'brush'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700'
          )}
        >
          Brush
        </button>
        <button
          type="button"
          onClick={() => {
            setTool('eraser');
          }}
          className={cn(
            'rounded-md border px-3 py-2 text-sm font-medium',
            tool === 'eraser'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700'
          )}
        >
          Eraser
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Color
          <input
            type="color"
            value={color}
            onChange={(event) => {
              setColor(event.target.value);
            }}
            className="h-9 w-10 rounded border border-slate-200 bg-white"
          />
        </label>
        <label className="flex min-w-44 items-center gap-2 text-sm text-slate-700">
          Size
          <input
            type="range"
            min="2"
            max="24"
            value={brushSize}
            onChange={(event) => {
              setBrushSize(Number(event.target.value));
            }}
            className="w-28"
          />
          <span className="w-6 text-right">{brushSize}</span>
        </label>
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Clear canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={finishStroke}
        onMouseLeave={finishStroke}
        className="block aspect-[16/7] w-full cursor-crosshair touch-none rounded-b-lg bg-white"
      />
    </section>
  );
};
