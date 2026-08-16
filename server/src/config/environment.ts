import 'dotenv/config';

import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  SOCKET_NAMESPACE: z.string().min(1).default('/'),
  YJS_ROOM_NAME: z.string().min(1).default('shared-document')
});

export type Environment = z.infer<typeof environmentSchema>;

export const environment = environmentSchema.parse(process.env);
