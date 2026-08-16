import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { createCorsOptions } from './config/cors.js';
import type { Environment } from './config/environment.js';
import { healthHandler, rootHandler } from './controllers/healthController.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { requestLogger } from './middlewares/logger.js';

export const createApp = (environmentConfig: Environment): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(createCorsOptions(environmentConfig)));
  app.use(express.json({ limit: '32kb' }));
  app.use(requestLogger);

  app.get('/', rootHandler);
  app.get('/health', healthHandler);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
