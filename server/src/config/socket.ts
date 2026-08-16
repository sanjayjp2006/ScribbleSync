import type { ServerOptions } from 'socket.io';

import type { Environment } from './environment.js';

export const createSocketOptions = (environmentConfig: Environment): Partial<ServerOptions> => ({
  cors: {
    origin: environmentConfig.CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  serveClient: false
});
