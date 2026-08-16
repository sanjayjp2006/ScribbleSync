import { randomUUID } from 'node:crypto';

export const generateUserId = (): string => randomUUID();
