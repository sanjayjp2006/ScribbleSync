#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <EC2_IP> [SSH_PRIVATE_KEY_PATH]" >&2
  exit 1
fi

EC2_IP="$1"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
if [ "$#" -ge 2 ]; then
  SSH_OPTS+=(-i "$2")
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_FILE="$SCRIPT_DIR/scribble-sync.service"

echo "==> Provisioning EC2 instance at $EC2_IP"

ssh "${SSH_OPTS[@]}" "ubuntu@$EC2_IP" 'bash -s' <<'REMOTE'
set -euo pipefail

install_node() {
  echo "==> Installing Node.js 22 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

if ! command -v node >/dev/null 2>&1; then
  install_node
else
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$NODE_MAJOR" -lt 22 ]; then
    install_node
  fi
fi

echo "==> Verifying Node.js"
node --version
npm --version

echo "==> Creating /opt/scribblesync directories"
sudo mkdir -p /opt/scribblesync/client /opt/scribblesync/server /opt/scribblesync/deployments
sudo chown -R ubuntu:ubuntu /opt/scribblesync
REMOTE

echo "==> Installing systemd unit"
scp "${SSH_OPTS[@]}" "$UNIT_FILE" "ubuntu@$EC2_IP:/tmp/scribble-sync.service"

ssh "${SSH_OPTS[@]}" "ubuntu@$EC2_IP" "EC2_IP=$EC2_IP bash -s" <<'REMOTE'
set -euo pipefail

sudo mv /tmp/scribble-sync.service /etc/systemd/system/scribble-sync.service

echo "==> Writing production .env"
printf 'NODE_ENV=production\nPORT=4000\nCLIENT_ORIGIN=http://%s:4000\nSOCKET_NAMESPACE=/\nYJS_ROOM_NAME=shared-document\nSERVE_CLIENT=true\n' "$EC2_IP" \
  | sudo tee /opt/scribblesync/server/.env >/dev/null
sudo chown ubuntu:ubuntu /opt/scribblesync/server/.env

sudo systemctl daemon-reload
sudo systemctl enable scribble-sync

echo "==> Provisioning complete. Ready for GitHub Actions deployment."
REMOTE