# ScribbleSync — Realtime Collaborative Editor

A realtime collaborative text editor with live cursors, presence, and a shared drawing canvas. Teams create or join a room by 4-digit code and edit a shared rich-text document together, synced over Socket.IO with Yjs CRDTs.

![stack](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB) ![stack](https://img.shields.io/badge/Node_22-339933?style=flat&logo=nodedotjs&logoColor=white) ![stack](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socketdotio&logoColor=white) ![stack](https://img.shields.io/badge/Yjs-0B6E4F?style=flat) ![stack](https://img.shields.io/badge/TypeScript_Strict-3178C6?style=flat&logo=typescript&logoColor=white) ![stack](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

## Features

- **Realtime rich-text editing** — Tiptap (ProseMirror) with Yjs CRDT sync, conflict-free concurrent edits
- **Live cursors** — each collaborator's cursor and selection color-tagged and streamed via Yjs awareness
- **Presence** — online user list per room with per-user cursor colors
- **Shared drawing canvas** — brush/eraser strokes relayed live between room members
- **Rooms** — create or join a 4-digit room; no accounts, no setup
- **Connection health** — visible connection status indicator and automatic reconnection

## Architecture

The repository is a two-package monorepo: a browser SPA and a Node.js backend.

```text
Browser (React SPA)
   |
   | Socket.IO (typed events + custom Yjs transport)
   v
Express server (Node 22)
   |-- /health          operational health endpoint
   |-- /socket.io       Socket.IO: Yjs updates, awareness, presence, drawing
   +-- client/dist      static React build (production, single origin)
```

In production the Express server also serves the built React app, so the whole
system runs from one origin (`http://<host>:4000`). Collaboration state is
**in-memory only** — no database, no persistence. Restarting the server loses
all active rooms and documents. See [docs/architecture.md](docs/architecture.md)
for the full design.

## Tech Stack

| Layer              | Technology                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| Frontend           | React 19, Vite 6, TypeScript (strict), Tailwind CSS 3                             |
| Editor             | Tiptap 2 + StarterKit, Collaboration, CollaborationCursor, Placeholder, Underline |
| Collaboration      | Yjs (CRDT), y-protocols (awareness)                                               |
| Realtime transport | Socket.IO (client + server), custom transport replacing y-websocket               |
| Backend            | Node.js 22, Express 5, Helmet, CORS, Zod                                          |
| Deployment         | AWS EC2 (Ubuntu 24.04), systemd, GitHub Actions                                   |

## Repository Layout

```text
ScribbleSync/
├── client/                  # React SPA (Vite)
│   ├── src/
│   │   ├── components/      # presentational components
│   │   ├── contexts/        # AppContext: session + collaboration state
│   │   ├── hooks/           # useEditor, useCollaborationTransport, useAppContext
│   │   ├── pages/           # LandingPage, EditorPage
│   │   ├── services/        # Socket.IO client setup
│   │   ├── styles/          # Tailwind entry + global CSS
│   │   ├── types/           # shared frontend types
│   │   └── utils/           # pure utilities (cn)
│   └── ...                  # Vite, Tailwind, TS configs
├── server/                  # Node.js backend (Express + Socket.IO)
│   ├── src/
│   │   ├── config/          # environment, CORS, Socket.IO options
│   │   ├── controllers/     # health endpoints
│   │   ├── middlewares/     # logging, 404, error handling
│   │   ├── services/        # room documents (Yjs), user registry
│   │   ├── socket/          # collaboration gateway (all socket events)
│   │   ├── types/           # shared backend types
│   │   └── utils/           # validation, colors, logger
│   └── ...                  # TS configs, tests
├── deploy/                  # systemd unit + EC2 provision script
├── docs/                    # architecture, onboarding, deployment guides
└── .github/workflows/       # CI/CD: build + deploy to EC2
```

## Prerequisites

- **Node.js ≥ 22** (the server requires it; NodeSource 22.x is used on EC2)
- npm (bundled with Node)

## Local Development

Install and run each package in its own terminal.

```bash
# Terminal 1 — server (API + Socket.IO on :4000)
cd server
npm ci
npm run dev

# Terminal 2 — client (Vite dev server on :5173)
cd client
npm ci
npm run dev
```

Open `http://localhost:5173`, create a room, then open the same room in a second
browser (or incognito window) to see realtime sync. In development the client
calls the server through `VITE_SERVER_URL` (defaults to `http://localhost:4000`).

### Environment variables

Copy `.env.example` to `.env` in each package as needed. All variables have
working defaults for local development.

Client (`VITE_` prefix, consumed at build time):

| Variable                | Default           | Purpose                                                                             |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| `VITE_APP_NAME`         | —                 | display name                                                                        |
| `VITE_CLIENT_PORT`      | `5173`            | Vite dev port                                                                       |
| `VITE_PREVIEW_PORT`     | `4173`            | Vite preview port                                                                   |
| `VITE_SERVER_URL`       | _unset_           | Socket.IO server origin. Unset = same origin as the page (`window.location.origin`) |
| `VITE_SOCKET_NAMESPACE` | `/`               | Socket.IO namespace                                                                 |
| `VITE_YJS_ROOM_NAME`    | `shared-document` | base name for the Yjs room                                                          |

Server:

| Variable           | Default                 | Purpose                                                       |
| ------------------ | ----------------------- | ------------------------------------------------------------- |
| `NODE_ENV`         | `development`           | runtime environment                                           |
| `PORT`             | `4000`                  | HTTP + Socket.IO port                                         |
| `CLIENT_ORIGIN`    | `http://localhost:5173` | allowed CORS origin                                           |
| `SOCKET_NAMESPACE` | `/`                     | Socket.IO namespace                                           |
| `YJS_ROOM_NAME`    | `shared-document`       | base Yjs room name                                            |
| `SERVE_CLIENT`     | `true`                  | serve the built React app from `client/dist` (boolean string) |

`SERVE_CLIENT=false` disables static serving and restores the plain text root
endpoint; if `client/dist` is missing, the server logs a warning and continues
serving the API without crashing.

## Quality Gates

Run from each package directory (`client/` or `server/`):

```bash
npm run build        # typecheck + production build (tsc, Vite)
npm run lint         # ESLint (strict, type-checked rules)
npm run format:check # Prettier check
```

Server tests (Node's built-in test runner):

```bash
cd server
npm test
```

## Production Deployment

The application is deployed to a single AWS EC2 instance (Ubuntu 24.04,
t3.micro) and served over HTTP at `http://<ELASTIC_IP>:4000`. GitHub Actions
builds both packages and ships them over SSH on every push to `main`.

| Artifact        | Location                                 |
| --------------- | ---------------------------------------- |
| React build     | `client/dist/`                           |
| Compiled server | `server/dist/`                           |
| Runtime deps    | installed via `npm ci --omit=dev` on EC2 |
| Service         | systemd unit `scribble-sync`             |

### GitHub Actions secrets

| Secret            | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| `EC2_HOST`        | Public/Elastic IP of the instance                             |
| `EC2_USER`        | `ubuntu`                                                      |
| `EC2_SSH_KEY_B64` | EC2 private key, base64-encoded (`base64 -w0 ~/.ssh/key.pem`) |

### One-time provisioning

```bash
bash deploy/provision.sh <ELASTIC_IP> [SSH_PRIVATE_KEY_PATH]
```

Installs Node 22, creates `/opt/scribblesync/{client,server,deployments}`,
installs the systemd unit, writes the production `.env`, and enables the
service. Full walkthrough: [docs/deployment.md](docs/deployment.md).

### Verification

```bash
curl http://<ELASTIC_IP>:4000/health
sudo systemctl status scribble-sync
sudo journalctl -u scribble-sync -f
```

## Troubleshooting

- **Blank page / assets failing to load over HTTP** — ensure Helmet does not
  emit `upgrade-insecure-requests` or HSTS. The current config disables both
  (see `server/src/app.ts`).
- **Service crashes on start** — check `sudo journalctl -u scribble-sync -n 50`.
  Common causes: missing `dist/`, wrong `Node` version, or a `.env` parse error.
- **No realtime sync** — confirm the browser reaches `:4000` and the socket
  connects (the footer shows a connection status dot).

## Known Limitations

- **No persistence** — all rooms and documents live in memory; any server or
  instance restart wipes them. Users must create/join a new room.
- **HTTP only** — no TLS, no custom domain at this stage (upgrade path: ACM
  certificate + reverse proxy or ALB).
- **Single instance** — Yjs state is not shared across processes; horizontal
  scaling would require an external state layer.
- **Drawing is not CRDT-synced** — strokes are relayed as events; late joiners
  see an empty canvas.

## Documentation

- [docs/getting-started.md](docs/getting-started.md) — onboarding for new developers
- [docs/architecture.md](docs/architecture.md) — how the system works internally
- [docs/deployment.md](docs/deployment.md) — EC2 deployment and operations guide
