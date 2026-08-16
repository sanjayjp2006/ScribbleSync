import type { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger.js';

export const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  response.on('finish', () => {
    logger.info('HTTP request completed', {
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
};
