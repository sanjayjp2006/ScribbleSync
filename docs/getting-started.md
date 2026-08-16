# Getting Started

This guide gets a new developer from zero to a running local environment and
explains the moving parts. It assumes you have already read the
[README](../README.md).

## Prerequisites

- **Node.js ≥ 22** (the server declares `engines: >=22.0.0`; older Node will
  warn or fail)
- npm (bundled with Node)
- A terminal per package (client and server run side by side)

Verify:

```bash
node --version   # v22.x
npm --version
```

## 1. Install dependencies

```bash
cd client && npm ci
cd ../server && npm ci
```

`npm ci` installs from the lockfile. Use `npm install` only when you intend to
change dependencies (and commit the resulting `package-lock.json`).

## 2. Configure environment

Both packages read environment variables; all have sane defaults, so local
development works with **no `.env` files at all**:

- The server defaults to port `4000` and allows `http://localhost:5173`.
- The client defaults to `VITE_SERVER_URL` unset, which means "use the same
  origin as the page" — but on the Vite dev server (`:5173`) that is not where
  the backend lives. Copy `client/.env.example` → `client/.env` and set:

  ```env
  VITE_SERVER_URL="http://localhost:4000"
  ```

  (If you already have a `client/.env` from an earlier session, just confirm
  this value.)

Optionally copy `server/.env.example` → `server/.env` and adjust `PORT` or
`CLIENT_ORIGIN` — not required for local work.

## 3. Run the server

```bash
cd server
npm run dev
```

`tsx watch` compiles on the fly and restarts on file changes. Expected output:

```
{"level":"info","message":"Backend server listening", ... "port":4000 ...}
```

Smoke test: `curl http://localhost:4000/health` → JSON with `"status":"ok"`.

## 4. Run the client

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## 5. Try the app

1. Enter a name, click **Create Room**, and note the 4-digit room ID.
2. Open the same URL in a second browser or an incognito window.
3. Enter a different name, join the room with the ID from step 1.
4. Type in the editor in either window — the other updates live. You should
   also see both names in the sidebar with color dots, and live cursors in the
   editor.
5. Draw on the canvas in one window — the stroke appears in the other.

## Where things run

| Piece                   | Dev                         | Production                             |
| ----------------------- | --------------------------- | -------------------------------------- |
| Frontend                | Vite dev server `:5173`     | Express static from `client/dist`      |
| Backend API + Socket.IO | `tsx watch` on `:4000`      | `node dist/index.js` on `:4000`        |
| Client → server URL     | `VITE_SERVER_URL` (`:4000`) | same origin (`window.location.origin`) |
| Server → client CORS    | `CLIENT_ORIGIN` (`:5173`)   | `CLIENT_ORIGIN` set on EC2             |

## Codebase tour

| Path                                                  | What lives there                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `client/src/contexts/AppContext.tsx`                  | session state: name, room, socket, editor, collaboration objects |
| `client/src/hooks/useEditor.ts`                       | Tiptap editor with Collaboration + CollaborationCursor           |
| `client/src/hooks/useCollaborationTransport.ts`       | Yjs ↔ Socket.IO bridge (the heart of realtime sync)              |
| `client/src/services/socketService.ts`                | Socket.IO client factory and URL resolution                      |
| `client/src/components/DrawingCanvas.tsx`             | shared canvas                                                    |
| `server/src/socket/collaborationGateway.ts`           | every socket event handler                                       |
| `server/src/services/collaborationDocumentService.ts` | per-room `Y.Doc` + awareness                                     |
| `server/src/services/userRegistry.ts`                 | online users and cursor colors                                   |
| `server/src/app.ts`                                   | Express app: middleware, health, static serving, SPA fallback    |
| `server/src/index.ts`                                 | entrypoint: server wiring and graceful shutdown                  |
| `deploy/`                                             | systemd unit + EC2 provision script                              |
| `docs/`                                               | this documentation set                                           |

Start with `useCollaborationTransport.ts` and `collaborationGateway.ts` — they
are the two halves of the sync loop. See
[docs/architecture.md](architecture.md) for the full data flow.

## Production-like local test

Run the app exactly as it runs on EC2:

```bash
cd client && npm ci && npm run build
cd ../server && npm ci && npm run build
cd server
SERVE_CLIENT=true PORT=4000 node dist/index.js
```

Then:

- `http://localhost:4000` → the built React app (not the Vite server)
- `http://localhost:4000/health` → JSON health payload
- `http://localhost:4000/editor` → SPA fallback returns the app shell
- `http://localhost:4000/api/nonexistent` → JSON 404 (not the SPA)
- Two windows on `:4000` → realtime sync still works

## Common issues

| Symptom                                          | Cause / fix                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `VITE_SERVER_URL must be configured` (old build) | rebuild the client; the env var is now optional                                                    |
| Blank page / `ERR_SSL_PROTOCOL_ERROR` on assets  | Helmet must not emit `upgrade-insecure-requests`/HSTS over HTTP — the current config disables both |
| Editor shows "Loading editor" forever            | Tiptap needs the Collaboration extension's document — check the socket connects (footer dot)       |
| `Cannot find module` after server build          | stale `dist/`; delete `server/dist` and rebuild                                                    |
| Socket connects then drops                       | check `CLIENT_ORIGIN` matches the page origin and the SG allows TCP 4000                           |
| Rooms disappear after `systemctl restart`        | expected — state is in-memory                                                                      |

## Tests and checks

```bash
cd server && npm test        # node:test runner (health, gateway wiring, registry, colors)
cd client && npm run build   # typecheck + Vite build
cd server && npm run build   # typecheck + tsc emit
cd client && npm run lint    # ESLint (strict type-checked rules)
cd server && npm run lint
```

Formatting: `npm run format:check` / `npm run format` in each package. Note:
on Windows with `core.autocrlf=true` the working tree has CRLF endings while
Prettier expects LF — a checkout-time artifact, not a code issue; CI (Linux)
passes.
