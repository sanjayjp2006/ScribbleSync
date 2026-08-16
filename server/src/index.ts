import { environment } from './config/environment.js';
import { createBackendServer } from './server.js';
import { logger } from './utils/logger.js';

const backend = createBackendServer(environment);

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info('Graceful shutdown started', { signal });

  void backend.socketServer.close(() => {
    backend.httpServer.close((error) => {
      backend.documentService.destroy();

      if (error !== undefined) {
        logger.error('Graceful shutdown failed', { error: error.message });
        process.exitCode = 1;
      }

      logger.info('Graceful shutdown completed');
      process.exit();
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason)
  });
});

backend.httpServer.listen(environment.PORT, () => {
  logger.info('Backend server listening', {
    port: environment.PORT,
    roomName: environment.YJS_ROOM_NAME,
    socketNamespace: environment.SOCKET_NAMESPACE
  });
});
