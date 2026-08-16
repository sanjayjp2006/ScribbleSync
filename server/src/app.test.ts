import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';

import { createApp } from './app.js';
import type { Environment } from './config/environment.js';

const testEnvironment: Environment = {
  NODE_ENV: 'test',
  PORT: 0,
  CLIENT_ORIGIN: 'http://localhost:5173',
  SOCKET_NAMESPACE: '/',
  YJS_ROOM_NAME: 'shared-document',
  SERVE_CLIENT: false
};

void describe('createApp', () => {
  const app = createApp(testEnvironment);
  const server = app.listen(0);

  before(async () => {
    await new Promise<void>((resolve) => {
      server.once('listening', resolve);
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  const getBaseUrl = (): string => {
    const address = server.address() as AddressInfo;
    return `http://127.0.0.1:${String(address.port)}`;
  };

  void it('returns the root health text', async () => {
    const response = await fetch(`${getBaseUrl()}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(body, 'Backend Running');
  });

  void it('returns detailed health metadata', async () => {
    const response = await fetch(`${getBaseUrl()}/health`);
    const body = (await response.json()) as {
      readonly status: string;
      readonly uptime: number;
      readonly memory: unknown;
      readonly nodeVersion: string;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
    assert.equal(typeof body.memory, 'object');
    assert.equal(body.nodeVersion, process.version);
  });

  void it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${getBaseUrl()}/missing`);

    assert.equal(response.status, 404);
  });
});
