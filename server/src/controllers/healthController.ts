import type { Request, Response } from 'express';

export const rootHandler = (_request: Request, response: Response): void => {
  response.status(200).send('Backend Running');
};

export const healthHandler = (_request: Request, response: Response): void => {
  response.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
};
