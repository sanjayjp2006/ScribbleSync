# Architecture

This document explains how ScribbleSync works internally: the runtime data
flow, the custom Yjs-over-Socket.IO transport, the room lifecycle, and the
production serving model.

## High-level flow

```text
┌─────────────── Browser 1 ───────────────┐   ┌─────────────── Browser 2 ───────────────┐
│  Tiptap editor ── Y.Doc (client)        │   │  Tiptap editor ── Y.Doc (client)        │
│  Awareness ── cursor/selection          │   │  Awareness ── cursor/selection          │
└──────────┬──────────────────────────────┘   └──────────┬──────────────────────────────┘
           │ Socket.IO (polling → websocket)             │
           └──────────────┬──────────────────────────────┘
                          v
              ┌─────────────────────────────┐
              │  Express + Socket.IO server │
              │  (single Node 22 process)   │
              │                             │
              │  CollaborationGateway       │
              │  CollaborationDocumentService  ── Y.Doc + Awareness per room
              │  UserRegistry               │
              └─────────────────────────────┘
```

Everything goes through one Socket.IO server. There is no second sync channel:
Yjs updates, awareness, presence, cursors, and drawing strokes all travel as
typed socket events.

## Collaboration state

State lives entirely in memory on the server:

- **`CollaborationDocumentService`** keeps a `Map<roomId, room>` where each room
  holds a `Y.Doc`, a `y-protocols` `Awareness` instance, and a map from socket
  id → set of awareness client ids.
- **`UserRegistry`** keeps `Map<socketId, User>` (name, room, color, joinedAt).
- Rooms are created with a random 4-digit code; socket rooms are named
  `shared-document:<roomId>` to keep Yjs doc and Socket.IO room scoping aligned.

Because state is in memory, a process restart clears everything. This is an
accepted design constraint of the current scope.

## Room lifecycle

1. **Create** — client emits `room:create {name}`; the server allocates a
   4-digit `roomId` and calls `joinRoom`.
2. **Join** — client emits `join {name, roomId}` (or the ack-style
   `room:join`); the server validates the payload with Zod, verifies the room
   exists, joins the socket to the socket room, and upserts the user.
3. **Sync** — the new member receives:
   - `yjs:sync` — full document snapshot (`Y.encodeStateAsUpdate`)
   - `yjs:awareness` — current awareness states for all clients
   - `users:online` — the room's user list
4. **Live updates** — subsequent `yjs:update` / `yjs:awareness` events are
   applied server-side and re-broadcast to the rest of the room.
5. **Leave/disconnect** — the user is removed from the registry, their
   awareness states are removed (`removeAwarenessStates`), and a removal
   update is broadcast so other clients drop the ghost cursor.

## The custom Yjs transport

The client uses a hand-rolled transport instead of `y-websocket` so that Yjs
shares the same authenticated connection and event contracts as the rest of
the app.

Client side ([`useCollaborationTransport.ts`](../client/src/hooks/useCollaborationTransport.ts)):

- Listens to `document.on('update')` and `awareness.on('update')` and emits
  `yjs:update` / `yjs:awareness` when the origin is not `SOCKET_ORIGIN`.
- Applies inbound `yjs:update` / `yjs:awareness` / `yjs:sync` with
  `SOCKET_ORIGIN` as the origin.

`SOCKET_ORIGIN` (`'socket.io-yjs-transport'`) is the echo-suppression key:
the server broadcasts an update back to the whole room (including the sender),
and each client ignores updates whose origin is `SOCKET_ORIGIN`, preventing
infinite loops and double application.

Server side ([`collaborationGateway.ts`](../server/src/socket/collaborationGateway.ts)):

- `yjs:update` — decode to `Uint8Array`, apply to the room document, then
  re-emit to everyone else in the room.
- `yjs:awareness` — apply the update with the socket id as origin, track which
  awareness client ids belong to that socket, and re-emit.
- On disconnect, `removeAwarenessForSocket` encodes the removal update only for
  the affected client ids and broadcasts it.

## Presence, cursors, and typing

- `presence` / `cursor` / `selection` / `typing` / `stopTyping` events are
  validated with Zod and re-broadcast to the room with `socketId` attached.
- Cursor colors are assigned server-side by `generateCursorColor`, which picks
  a color from a palette not already used in the room.
- The client's editor is configured with
  `@tiptap/extension-collaboration-cursor`, which renders remote cursors from
  the Yjs awareness data.

## Drawing canvas

The canvas is a fixed logical size (960×420). Pointer coordinates are scaled
from the element rect into that space, so strokes render identically at any
viewport size. Strokes (`drawing:stroke`) and clears (`drawing:clear`) are
relayed verbatim to the room.

Note: drawing is **not** CRDT-synced. A client that joins later receives no
canvas history, and strokes are not replayed on reconnect.

## HTTP serving model

In production the server serves the SPA itself (single origin):

1. `helmet` (with `upgrade-insecure-requests` removed and HSTS disabled so the
   app works over plain HTTP), CORS, JSON body parsing, request logging.
2. `GET /health` — JSON health payload.
3. `express.static(clientDistPath)` — built assets from `client/dist`.
4. SPA fallback middleware — GET requests that accept HTML and are not
   `/api/*` or `/socket.io/*` receive `client/dist/index.html`.
5. JSON 404 handler and error handler.

The client path is resolved relative to the compiled module
(`fileURLToPath(new URL('../../client/dist', import.meta.url))`), so it works
regardless of the process's current working directory:

```text
server/dist/app.js  --../../-->  <root>/client/dist
```

## Security boundaries

- Socket payloads are validated with Zod schemas before use; invalid payloads
  emit a generic `error` event and are logged.
- Express keeps Helmet defaults (CSP `default-src 'self'`, `X-Frame-Options`,
  `nosniff`, etc.) with the two HTTP-compatibility exceptions noted above.
- CORS allows only `CLIENT_ORIGIN`.
- There is no authentication — room codes are the only access control. Anyone
  with the 4-digit code can join the room.

## Event contract

All event names and payloads are typed in
[`client/src/types/socket-events.ts`](../client/src/types/socket-events.ts) and
[`server/src/types/socket-events.ts`](../server/src/types/socket-events.ts),
which mirror each other.

| Event                               | Direction             | Payload                  |
| ----------------------------------- | --------------------- | ------------------------ |
| `client:connected`                  | server → client       | `{ socketId }`           |
| `room:create` / `room:join`         | client → server (ack) | `{ name, roomId? }`      |
| `join` / `leave`                    | client → server       | `{ name, roomId }` / —   |
| `user:joined` / `user:left`         | server → client       | `{ user }`               |
| `users:online`                      | server → client       | `{ users }`              |
| `yjs:sync` / `yjs:update`           | both                  | `{ update: Uint8Array }` |
| `yjs:awareness`                     | both                  | `{ update: Uint8Array }` |
| `presence` / `cursor` / `selection` | both                  | payload + `{ socketId }` |
| `typing` / `stopTyping`             | both                  | `{ socketId }`           |
| `drawing:stroke` / `drawing:clear`  | both                  | stroke payload / —       |
| `room:created` / `room:not-found`   | server → client       | `{ roomId }` / —         |
| `error`                             | server → client       | `{ message }`            |
