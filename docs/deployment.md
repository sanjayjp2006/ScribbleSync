# Deployment — AWS EC2 + GitHub Actions

Operations guide for the single-instance production deployment. Read
[docs/architecture.md](architecture.md) first if you are new to the system.

## Topology

```text
Developer ── git push origin main ──> GitHub Actions
                                          |
              build job: npm ci + build (client/, server/)
                                          |
             deploy job: SSH / scp + remote script
                                          v
                          AWS EC2 (Ubuntu 24.04, t3.micro)
                          +----------------------------------+
                          | /opt/scribblesync                |
                          |   client/dist/   (built React)   |
                          |   server/dist/   (compiled API)  |
                          |   server/.env    (prod config)   |
                          |   deployments/<sha>/ (staging)   |
                          | systemd: scribble-sync           |
                          | node dist/index.js :4000         |
                          +----------------------------------+
```

Production is **one origin**: `http://<ELASTIC_IP>:4000` serves the React app,
the health endpoint, and Socket.IO.

## AWS console setup (one time)

1. **EC2 → Launch instance**
   - AMI: Ubuntu 24.04 LTS (HVM, x86_64)
   - Instance type: `t3.micro` (free-tier eligible for 12 months)
   - Storage: 8 GB gp3
   - Key pair: create or reuse one; **keep the `.pem` file safe** — you need
     it for provisioning and GitHub.
2. **Security group** (inbound):
   - TCP `22` — source: your IP only
   - TCP `4000` — source: `0.0.0.0/0`
3. **Elastic IP**: Allocate one and associate it with the instance so the
   address survives restarts.

Expected cost: $0 during the free tier (t3.micro + 8 GB EBS + egress within
the monthly free allowances); roughly $8–9/month afterwards. There is no
database, load balancer, or extra service to pay for.

## Provision the instance (one time)

From your machine:

```bash
bash deploy/provision.sh <ELASTIC_IP> [SSH_PRIVATE_KEY_PATH]
```

The script (runs with `set -euo pipefail`):

1. Installs Node.js 22 via NodeSource (skips if an adequate Node is present).
2. Verifies `node --version` and `npm --version`.
3. Creates `/opt/scribblesync/{client,server,deployments}` and gives ownership
   to the `ubuntu` user.
4. Installs `deploy/scribble-sync.service` to `/etc/systemd/system/`.
5. Writes `/opt/scribblesync/server/.env`:

   ```env
   NODE_ENV=production
   PORT=4000
   CLIENT_ORIGIN=http://<ELASTIC_IP>:4000
   SOCKET_NAMESPACE=/
   YJS_ROOM_NAME=shared-document
   SERVE_CLIENT=true
   ```

6. Runs `systemctl daemon-reload` and `systemctl enable scribble-sync`.

The service is **enabled but not started** — the first real start happens on
the first deployment. No application files are required at provisioning time.

## GitHub secrets

Create these in **Settings → Secrets and variables → Actions**:

| Secret            | Value                                              |
| ----------------- | -------------------------------------------------- |
| `EC2_HOST`        | the Elastic IP                                     |
| `EC2_USER`        | `ubuntu`                                           |
| `EC2_SSH_KEY_B64` | `base64 -w0 <your-key>.pem` output (a single line) |

The workflow decodes `EC2_SSH_KEY_B64` to `~/.ssh/deploy_key` (chmod 600) and
uses `ssh-keyscan` to trust the host. Never paste the private key into code,
commits, or issues.

## Deployment flow (automatic)

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **Build job** — Node 22; `npm ci` + `npm run build` in `client/` and
   `server/`; packages `client/dist/`, `server/dist/`, and the server's
   `package.json` + `package-lock.json` into one tarball artifact.
2. **Deploy job** — downloads the artifact, scp's it to
   `/tmp/deploy-bundle.tar.gz`, then over SSH:
   - extracts into `/opt/scribblesync/deployments/<commit-sha>/`
   - `npm ci --omit=dev` in the staging server directory
   - copies the production `.env` into the staging server dir
   - swaps `client`/`server` by moving the old dirs to `.old-*`
   - `sudo systemctl restart scribble-sync`
   - verifies `systemctl is-active` is `active`; on failure **rolls back** the
     old directories, restarts, and fails the workflow with `::error::`
   - cleans up staging and `.old-*` dirs on success

Only production artifacts are transferred — never source, `.git`,
`node_modules`, or `.env` from the developer machine.

Manual deploy (emergency use):

```bash
scp -i key.pem deploy-bundle.tar.gz ubuntu@<IP>:/tmp/
ssh -i key.pem ubuntu@<IP> 'sudo systemctl restart scribble-sync'
```

## The systemd unit

`deploy/scribble-sync.service`:

- runs as `ubuntu` (non-root), `WorkingDirectory=/opt/scribblesync/server`
- `ExecStart=/usr/bin/node dist/index.js`
- loads env from `/opt/scribblesync/server/.env` via `EnvironmentFile`
- `Restart=always` with a 3-second backoff
- starts on boot (`multi-user.target`)

## Verification

```bash
# endpoint checks
curl http://<ELASTIC_IP>:4000/health          # {"status":"ok", ...}
curl -I http://<ELASTIC_IP>:4000/             # 200, text/html (React app)
curl -I http://<ELASTIC_IP>:4000/editor       # 200 (SPA fallback)
curl -I http://<ELASTIC_IP>:4000/api/nope     # 404 JSON (not the SPA)

# service checks
ssh -i key.pem ubuntu@<IP>
sudo systemctl status scribble-sync
sudo systemctl is-active scribble-sync       # active

# functional check: open http://<ELASTIC_IP>:4000 in two browsers,
# create/join a room, verify text, cursors, and drawing sync live
```

## Logs and troubleshooting

```bash
sudo journalctl -u scribble-sync -f           # follow logs
sudo journalctl -u scribble-sync -n 100       # last 100 lines
sudo systemctl restart scribble-sync          # restart the service
```

| Symptom                                            | Likely cause / fix                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Failed to start scribble-sync`                    | missing `dist/` (deploy never ran or failed), bad `.env` value, Node < 22                              |
| Workflow fails at "Deploy and restart"             | secret wrong/expired, SG blocks SSH from the GitHub runner IP range, `EC2_HOST` stale after EIP change |
| Health endpoint 200 but page blank                 | browser caching old `index.html`; hard refresh                                                         |
| `ERR_SSL_PROTOCOL_ERROR` on assets                 | stale Helmet headers (`upgrade-insecure-requests`) — current code disables them; redeploy              |
| Socket connects in dev but not prod                | `CLIENT_ORIGIN` in `/opt/scribblesync/server/.env` does not match the page origin; SG port 4000 closed |
| High disk usage in `/opt/scribblesync/deployments` | cleanup runs only on success; remove old dirs manually with `sudo rm -rf`                              |

## Important: state is in-memory

Restarting the service or the instance **loses every active room, document,
and user session**. This is by design — there is no database or persistence.
Users must create/join a new room after any restart. Coordinate restarts (for
example, a deploy) accordingly: notify active users before applying.

## Production security notes

- SSH is restricted to your IP (SG rule) — change it if your IP changes.
- Port 4000 is public by design (browsers must reach Socket.IO).
- HTTP only for now; the upgrade path is an ACM certificate plus a reverse
  proxy or ALB with HTTPS termination.
- No authentication exists in the app — room codes are the only gate. Anyone
  with the 4-digit code can join.
