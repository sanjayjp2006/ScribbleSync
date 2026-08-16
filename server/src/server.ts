import { createServer, type Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

import { createApp } from './app.js';
import { createSocketOptions } from './config/socket.js';
import type { Environment } from './config/environment.js';
import { CollaborationGateway } from './socket/collaborationGateway.js';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from './types/socket-events.js';
import { CollaborationDocumentService } from './services/collaborationDocumentService.js';
import { UserRegistry } from './services/userRegistry.js';

export interface BackendServer {
  readonly httpServer: HttpServer;
  readonly socketServer: SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  readonly documentService: CollaborationDocumentService;
  readonly userRegistry: UserRegistry;
}

export const createBackendServer = (environmentConfig: Environment): BackendServer => {
  const app = createApp(environmentConfig);
  const httpServer = createServer(app);
  const socketServer = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, createSocketOptions(environmentConfig));
  const userRegistry = new UserRegistry();
  const documentService = new CollaborationDocumentService(environmentConfig.YJS_ROOM_NAME);
  const gateway = new CollaborationGateway(socketServer, userRegistry, documentService);

  gateway.register();

  return {
    httpServer,
    socketServer,
    documentService,
    userRegistry
  };
};
