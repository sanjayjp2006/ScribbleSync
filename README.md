# Realtime Collaborative Editor

Architecture-only milestone for a production-quality realtime collaborative text editor. This repository is intentionally scoped to one shared document, no authentication, no database, and no persistence. Refreshing the running app is expected to reset state once the implementation milestone is added.

## Current Scope

This milestone creates the project architecture and configuration only. It does not implement React components, backend routes, Socket.IO handlers, Yjs state, Tiptap editor setup, or UI behavior.

## Folder Structure

```text
project/
  client/
    src/
      assets/
      components/
      contexts/
      editor/
      hooks/
      pages/
      services/
      socket/
      styles/
      types/
      utils/
  server/
    src/
      config/
      controllers/
      middlewares/
      services/
      socket/
      types/
      utils/
  .vscode/
```

## Why Each Folder Exists

- `client/src/assets`: Static frontend assets such as images, icons, fonts, and editor-adjacent media.
- `client/src/components`: Reusable presentational React components, including the editor, sidebar, and drawing canvas.
- `client/src/pages`: Route-level or screen-level composition, including the landing screen and editor screen.
- `client/src/hooks`: Reusable React hooks for connection state, editor lifecycle, Yjs transport, and browser events.
- `client/src/contexts`: React context providers for cross-cutting client state such as session identity and collaboration state.
- `client/src/services`: Client-side service adapters for APIs and infrastructure boundaries.
- `client/src/editor`: Tiptap-specific configuration, extensions, commands, and editor domain helpers.
- `client/src/socket`: Socket.IO client setup and typed event adapters.
- `client/src/styles`: Tailwind entry point and global CSS.
- `client/src/utils`: Pure utilities with no framework or infrastructure coupling.
- `client/src/types`: Shared frontend-only TypeScript declarations.
- `server/src/config`: Environment parsing and server configuration modules.
- `server/src/socket`: Socket.IO server setup, namespaces, rooms, and typed socket event contracts.
- `server/src/controllers`: HTTP controller boundaries for health or operational endpoints.
- `server/src/middlewares`: Express middleware composition such as CORS, security headers, and error handling.
- `server/src/services`: Backend application services, including collaboration rooms and user registry.
- `server/src/utils`: Pure backend utilities.
- `server/src/types`: Backend TypeScript declarations and event contracts.
- `.vscode`: Workspace recommendations and editor behavior for a consistent team setup.
## Dependency Decisions

### Client

- `react` and `react-dom`: Production UI foundation for the editor shell.
- `vite` and `@vitejs/plugin-react`: Fast TypeScript React build pipeline with a simple production bundle.
- `typescript`: Strict static typing across the frontend.
- `tailwindcss`, `postcss`, and `autoprefixer`: Utility-first styling with predictable production CSS output.
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`: Rich text editing built on ProseMirror without hand-rolling editor primitives.
- `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor`: Tiptap-supported Yjs collaboration and live cursor integration.
- `@tiptap/extension-placeholder`: Editor placeholder support for the future empty-document state.
- `yjs` and `y-websocket`: CRDT collaboration primitives and provider package requested for realtime syncing.
- `socket.io-client`: Presence, join/leave notifications, connection status, and online user metadata.
- `zod`: Runtime validation for environment and network payload boundaries.
- `clsx` and `tailwind-merge`: Safe class composition once reusable components are introduced.
- `eslint`, `typescript-eslint`, React ESLint plugins, and `prettier`: Consistent strict linting and formatting.

### Server

- `express`: HTTP server foundation for operational endpoints and Socket.IO attachment.
- `socket.io`: Realtime presence and collaboration event transport.
- `yjs`: Shared CRDT primitives for the backend collaboration layer.
- `cors` and `helmet`: Production baseline for cross-origin control and security headers.
- `dotenv`: Local environment loading.
- `zod`: Runtime validation for environment and socket payload boundaries.
- `tsx`: Development-time TypeScript execution without a manual compile loop.
- `typescript`, `eslint`, `typescript-eslint`, and `prettier`: Strict build, lint, and formatting pipeline.

## Architecture Decisions

- The project is split into `client` and `server` packages to keep browser and Node concerns independent.
- Absolute imports are configured in both packages so modules can scale without fragile relative paths.
- TypeScript is strict, with backend options such as `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` enabled early.
- The client entry point is intentionally inert and only verifies the DOM root exists. It is not a UI implementation.
- The server entry point is intentionally empty. Server runtime behavior belongs to the implementation milestone.
- Environment variables are documented through `.env.example` files and are not committed as real secrets.

## Scripts

Run scripts from each package directory.

### Client

```bash
cd client
npm install
npm run dev
npm run build
npm run lint
npm run format:check
```

### Server

```bash
cd server
npm install
npm run dev
npm run build
npm run lint
npm run format:check
```

## Environment Variables

Client variables use Vite's `VITE_` prefix and are declared in `client/src/types/env.d.ts`.

- `VITE_APP_NAME`: Display name for the application.
- `VITE_CLIENT_PORT`: Local Vite development port.
- `VITE_PREVIEW_PORT`: Local Vite preview port.
- `VITE_SERVER_URL`: Backend HTTP and Socket.IO origin.
- `VITE_SOCKET_NAMESPACE`: Socket.IO namespace.
- `VITE_YJS_ROOM_NAME`: Single shared Yjs room name.

Server variables:

- `NODE_ENV`: Runtime environment.
- `PORT`: Backend service port.
- `CLIENT_ORIGIN`: Allowed browser origin for CORS.
- `SOCKET_NAMESPACE`: Socket.IO namespace.
- `YJS_ROOM_NAME`: Single shared Yjs room name.
- `SERVE_CLIENT`: Serve the built React client from `client/dist` (default `true`).

## AWS EC2 Deployment

Production serves the built React client and the Socket.IO backend from one EC2 instance at `http://<ELASTIC_IP>:4000`. Collaboration state is in-memory: restarting the service or the instance loses all active rooms and documents.

### Architecture

- Single Ubuntu 24.04 EC2 instance (`t3.micro`, 8 GB gp3)
- Node.js 22 runs the compiled server under systemd
- Express serves `client/dist` (static assets + SPA fallback) and Socket.IO on port 4000
- GitHub Actions builds both packages and deploys on push to `main`

### Required AWS setup

1. Launch an EC2 instance: Ubuntu 24.04, `t3.micro`, 8 GB gp3, with a key pair you keep locally.
2. Security group inbound rules:
   - TCP 22 from your IP only
   - TCP 4000 from `0.0.0.0/0`
3. Allocate an Elastic IP and associate it with the instance.

### One-time provisioning

Run from your machine (requires SSH access to the instance):

```bash
bash deploy/provision.sh <ELASTIC_IP> [SSH_PRIVATE_KEY_PATH]
```

This installs Node.js 22, creates `/opt/scribblesync/{client,server,deployments}`, installs the `scribble-sync` systemd unit, writes the production `.env`, and enables the service.

### GitHub Actions secrets

| Secret | Value |
| --- | --- |
| `EC2_HOST` | Public/Elastic IP of the instance |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Private key of the EC2 key pair |

### Deployment flow

Push to `main`. The workflow builds `client/` and `server/`, ships only `client/dist/`, `server/dist/`, `server/package.json`, and `server/package-lock.json` to `/opt/scribblesync/deployments/<sha>/`, runs `npm ci --omit=dev`, swaps the active directories, restarts the service, and rolls back if the service fails to start.

### Verification

```bash
curl http://<ELASTIC_IP>:4000/health
sudo systemctl status scribble-sync
sudo systemctl is-active scribble-sync
```

Open `http://<ELASTIC_IP>:4000` in two browsers to verify realtime editing, cursors, and drawing.

### Logs

```bash
sudo journalctl -u scribble-sync -f
```

### systemd troubleshooting

```bash
sudo systemctl restart scribble-sync
sudo journalctl -u scribble-sync -n 50 --no-pager
```

### Local production-like test

```bash
cd client && npm ci && npm run build
cd ../server && npm ci && npm run build
cd server && SERVE_CLIENT=true PORT=4000 node dist/index.js
```

Open `http://localhost:4000`; `/health` remains a JSON endpoint and `/api/*` returns JSON 404s.

### Limitation

Restarting `scribble-sync` or the instance loses all in-memory rooms and documents; users must create or join a new room. No persistence is planned in the current scope.

## Verification Checklist

- [x] Folder structure
- [x] Configurations
- [x] Build scripts
- [x] ESLint
- [x] Prettier
- [x] Tailwind
- [x] Vite
- [x] TypeScript
- [x] Ready for development


