#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# deploy.sh — Push Zync backend to Oracle Cloud VM and restart PM2
#
# Usage (from your local Zync root folder):
#   bash deploy.sh
#
# Prerequisites:
#   - SSH key at ./ssh-key-2026-03-05.key
#   - VM_IP environment variable set, OR edit the default below
#   - First-time setup already completed (see ORACLE_VM_SETUP.md)
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────
SSH_KEY="./ssh-key-2026-03-05.key"
VM_USER="ubuntu"
VM_IP="${VM_IP:-68.233.96.221}"       # Oracle Cloud VM public IP
REMOTE_DIR="/home/ubuntu/zync-backend"
PM2_PROCESS_NAME="zync-backend"

if [ "$VM_IP" = "YOUR_VM_PUBLIC_IP" ]; then
  echo "ERROR: Set VM_IP first.  export VM_IP=<your-ip>"
  exit 1
fi

SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VM_USER@$VM_IP"
SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"

echo "🚀 Deploying Zync backend to $VM_IP ..."

# ── 1. Sync backend folder (excluding node_modules, .env, uploads) ───
echo "📦 Uploading backend files..."
rsync -avz --progress \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'uploads/*' \
  --exclude 'prisma/generated' \
  --exclude 'package-lock.json' \
  ./backend/ $VM_USER@$VM_IP:$REMOTE_DIR/

# ── 2. Install deps + regenerate Prisma client on the VM ─────────────
echo "📥 Installing dependencies on VM..."
$SSH_CMD << 'EOF'
  cd /home/ubuntu/zync-backend
  npm install --production
  npx prisma generate
EOF

# ── 3. Restart PM2 ──────────────────────────────────────────────────
echo "♻️  Restarting PM2 process..."
$SSH_CMD << EOF
  cd /home/ubuntu/zync-backend
  pm2 describe $PM2_PROCESS_NAME > /dev/null 2>&1 && pm2 restart $PM2_PROCESS_NAME || pm2 start index.js --name $PM2_PROCESS_NAME
  pm2 save
EOF

echo ""
echo "✅ Deployment complete!"
echo "   Backend running at http://$VM_IP:5000"
echo "   Check logs: ssh -i $SSH_KEY $VM_USER@$VM_IP 'pm2 logs $PM2_PROCESS_NAME'"
