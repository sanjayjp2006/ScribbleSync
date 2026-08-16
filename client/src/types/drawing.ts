export interface DrawingPoint {
  readonly x: number;
  readonly y: number;
}

export type DrawingTool = 'brush' | 'eraser';

export interface DrawingStrokePayload {
  readonly id: string;
  readonly tool: DrawingTool;
  readonly color: string;
  readonly size: number;
  readonly points: readonly DrawingPoint[];
}
