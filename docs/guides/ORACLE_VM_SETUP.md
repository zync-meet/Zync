# Oracle VM Setup Guide — Zync Real-Time Backend

This guide walks through setting up your **Oracle Cloud Always Free** Ubuntu 24.04 VM to host the Zync Node.js backend with WebSocket support for chat and presence.

---

## 1. SSH into Your VM

From your **local Zync project folder** (where `ssh-key-2026-03-05.key` lives):

```bash
# Fix key permissions (required on Linux/Mac, skip on Windows if using PuTTY)
chmod 400 ssh-key-2026-03-05.key

# Connect (replace YOUR_VM_PUBLIC_IP with your actual Oracle VM IP)
ssh -i ssh-key-2026-03-05.key ubuntu@YOUR_VM_PUBLIC_IP
```

> **Windows (PowerShell)**:  
> ```powershell
> ssh -i .\ssh-key-2026-03-05.key ubuntu@YOUR_VM_PUBLIC_IP
> ```

---

## 2. Install Node.js 20 LTS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x
```

---

## 3. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Enable PM2 to auto-start on boot
pm2 startup systemd
# (Copy and run the command PM2 prints out)
```

---

## 4. Open Firewall Ports

Oracle Cloud has **two** firewalls: the VM's iptables AND the VCN Security List.

### A. VM iptables (Ubuntu)
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5000 -j ACCEPT
sudo netfilter-persistent save
```

### B. Oracle Cloud Console (VCN Security List)
1. Go to **Networking → Virtual Cloud Networks → your VCN → Subnet → Security Lists**
2. Add an **Ingress Rule**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `5000`
3. Save.

---

## 5. Create the Backend Directory & .env

```bash
mkdir -p /home/ubuntu/zync-backend
cd /home/ubuntu/zync-backend
```

Create a `.env` file with your production secrets:

```bash
nano .env
```

Paste (adjust values for your environment):

```env
PORT=5000
NODE_ENV=production

# Oracle ADB MongoDB API connection string
MONGO_URI=mongodb://ADMIN:<password>@<adb-host>:27017/ZYNC_USER?authMechanism=PLAIN&authSource=$external&ssl=true&retryWrites=false&loadBalanced=true

# Firebase Admin (for token verification — keep this)
GCP_SERVICE_ACCOUNT_KEY='<your-firebase-admin-json>'

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Add any other env vars your backend needs (Google, GitHub, etc.)
```

Save (`Ctrl+X`, `Y`, `Enter`).

---

## 6. First Deploy (from your local machine)

Back on your **local machine**, from the Zync project root:

```bash
# Set your VM IP
export VM_IP=YOUR_VM_PUBLIC_IP

# Run the deploy script
bash deploy.sh
```

This will:
1. `rsync` your `backend/` folder to the VM (excluding `node_modules`, `.env`, `uploads`)
2. Run `npm install --production` on the VM
3. Run `npx prisma generate` to build the Prisma client
4. Start (or restart) the backend via PM2

---

## 7. Verify

```bash
# Check PM2 status
ssh -i ssh-key-2026-03-05.key ubuntu@YOUR_VM_PUBLIC_IP 'pm2 status'

# Check logs
ssh -i ssh-key-2026-03-05.key ubuntu@YOUR_VM_PUBLIC_IP 'pm2 logs zync-backend --lines 50'

# Test the API
curl http://YOUR_VM_PUBLIC_IP:5000/
# Should return: "API is running..."
```

---

## 8. Frontend Configuration

Update your frontend `.env` to point to the new VM:

```env
VITE_API_URL=http://YOUR_VM_PUBLIC_IP:5000
```

The WebSocket connections (presence, chat, notes) will automatically connect to this URL since they derive the socket URL from `API_BASE_URL`.

---

## 9. Optional: Nginx Reverse Proxy + SSL

For production with HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/zync
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # WebSocket keep-alive (24h)
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/zync /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Add SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

Then update your frontend to use `https://your-domain.com` instead of the raw IP.

---

## 10. Useful PM2 Commands

```bash
pm2 status               # See all processes
pm2 logs zync-backend     # Stream logs
pm2 restart zync-backend  # Restart
pm2 stop zync-backend     # Stop
pm2 delete zync-backend   # Remove from PM2
pm2 monit                 # Real-time monitoring dashboard
```
