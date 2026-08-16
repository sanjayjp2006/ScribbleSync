import type { User } from '../types/user.js';
import { generateCursorColor } from '../utils/colors.js';

export class UserRegistry {
  private readonly users = new Map<string, User>();

  upsert(socketId: string, roomId: string, name: string): User {
    const existingUser = this.users.get(socketId);
    const color =
      existingUser?.roomId === roomId
        ? existingUser.color
        : generateCursorColor(this.getUsedColors(roomId));
    const joinedAt = existingUser?.joinedAt ?? new Date().toISOString();
    const user: User = {
      socketId,
      roomId,
      name,
      color,
      joinedAt,
      status: 'online'
    };

    this.users.set(socketId, user);
    return user;
  }

  remove(socketId: string): User | undefined {
    const user = this.users.get(socketId);
    this.users.delete(socketId);
    return user;
  }

  get(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  list(roomId?: string): readonly User[] {
    return Array.from(this.users.values())
      .filter((user) => roomId === undefined || user.roomId === roomId)
      .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
  }

  clear(): void {
    this.users.clear();
  }

  private getUsedColors(roomId: string): ReadonlySet<string> {
    return new Set(
      Array.from(this.users.values())
        .filter((user) => user.roomId === roomId)
        .map((user) => user.color)
    );
  }
}
