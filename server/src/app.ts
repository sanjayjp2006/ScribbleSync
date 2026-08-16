import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createCorsOptions } from './config/cors.js';
import type { Environment } from './config/environment.js';
import { healthHandler, rootHandler } from './controllers/healthController.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { requestLogger } from './middlewares/logger.js';
import { logger } from './utils/logger.js';

const clientDistPath = fileURLToPath(new URL('../../client/dist', import.meta.url));
const indexHtmlPath = fileURLToPath(new URL('../../client/dist/index.html', import.meta.url));

export const createApp = (environmentConfig: Environment): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(createCorsOptions(environmentConfig)));
  app.use(express.json({ limit: '32kb' }));
  app.use(requestLogger);

  if (!environmentConfig.SERVE_CLIENT) {
    app.get('/', rootHandler);
  }

  app.get('/health', healthHandler);

  if (environmentConfig.SERVE_CLIENT && existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    app.use((request, response, next) => {
      if (request.method !== 'GET' || !request.accepts('html')) {
        next();
        return;
      }

      if (request.path.startsWith('/api') || request.path.startsWith('/socket.io')) {
        next();
        return;
      }

      response.sendFile(indexHtmlPath);
    });
  } else if (environmentConfig.SERVE_CLIENT) {
    logger.warn('SERVE_CLIENT is enabled but client/dist does not exist; skipping static serving', {
      clientDistPath
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
