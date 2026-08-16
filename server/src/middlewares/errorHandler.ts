import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;

  if (response.headersSent) {
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: error.issues
    });
    return;
  }

  logger.error('Unhandled request error', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });

  response.status(500).json({
    error: 'InternalServerError',
    message: 'Unexpected server error'
  });
};
