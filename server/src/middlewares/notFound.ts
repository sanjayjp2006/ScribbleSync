import type { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: 'NotFound',
    message: `Route ${request.method} ${request.path} was not found`
  });
};
