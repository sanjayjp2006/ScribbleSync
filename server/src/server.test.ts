import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as Y from 'yjs';

import type { Environment } from './config/environment.js';
import { createBackendServer } from './server.js';

const testEnvironment: Environment = {
  NODE_ENV: 'test',
  PORT: 0,
  CLIENT_ORIGIN: 'http://localhost:5173',
  SOCKET_NAMESPACE: '/',
  YJS_ROOM_NAME: 'shared-document'
};

void describe('createBackendServer', () => {
  void it('creates an HTTP server, Socket.IO server, one shared room, and one Y document', () => {
    const backend = createBackendServer(testEnvironment);

    const room = backend.documentService.createRoom();

    assert.equal(
      backend.documentService.getRoomName(room.roomId),
      `shared-document:${room.roomId}`
    );
    assert.equal(backend.documentService.getDocument(room.roomId) instanceof Y.Doc, true);
    assert.equal(backend.userRegistry.list().length, 0);

    void backend.socketServer.close();
    void backend.httpServer.close();
    backend.documentService.destroy();
  });
});
