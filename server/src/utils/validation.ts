import { z } from 'zod';

export const joinPayloadSchema = z.object({
  name: z.string().trim().min(1).max(80),
  roomId: z.string().regex(/^\d{4}$/u)
});

export const createRoomPayloadSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export const presencePayloadSchema = z.object({
  status: z.enum(['active', 'idle', 'away'])
});

export const cursorPayloadSchema = z.object({
  anchor: z.number().int().nonnegative(),
  head: z.number().int().nonnegative()
});

export const selectionPayloadSchema = z.object({
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative()
});

export const validatePayload = <T>(schema: z.ZodSchema<T>, payload: unknown): T =>
  schema.parse(payload);
