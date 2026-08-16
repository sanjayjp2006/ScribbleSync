import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UserRegistry } from './userRegistry.js';

void describe('UserRegistry', () => {
  void it('stores users by socket id and preserves color when a name is updated', () => {
    const registry = new UserRegistry();

    const firstUser = registry.upsert('socket-1', '1234', 'Sanjay');
    const updatedUser = registry.upsert('socket-1', '1234', 'Sanjay Kumar');

    assert.equal(updatedUser.socketId, 'socket-1');
    assert.equal(updatedUser.name, 'Sanjay Kumar');
    assert.equal(updatedUser.color, firstUser.color);
    assert.equal(registry.list().length, 1);
  });

  void it('removes users and returns the removed user', () => {
    const registry = new UserRegistry();
    const user = registry.upsert('socket-1', '1234', 'Sanjay');

    const removedUser = registry.remove('socket-1');

    assert.deepEqual(removedUser, user);
    assert.equal(registry.list().length, 0);
  });
});
