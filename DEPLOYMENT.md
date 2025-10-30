# Deployment Guide - Linux

This guide covers deploying the Action Controller on a Linux machine.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Git (optional, for cloning)

## Deployment Steps

### 1. Transfer Files to Linux Server

```bash
# Option A: Using scp
scp -r /path/to/action-controller user@server:/home/user/

# Option B: Using git
ssh user@server
git clone <your-repo-url>
cd action-controller
```

### 2. Install Dependencies

```bash
cd action-controller
npm install
```

### 3. Configure Environment

```bash
# Copy and edit the .env file
cp .env .env.production
nano .env
```

Update your service URLs:
```env
PORT=3000
HR_SERVICE_URL=http://localhost:3001
```

### 4. Build the Project

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### 5. Create Logs Directory

```bash
mkdir -p logs
```

## Running the Application

### Option 1: PM2 (Recommended for Production)

PM2 is a production process manager for Node.js with built-in load balancing.

```bash
# Start the application
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart after changes
npm run pm2:restart

# Stop the application
npm run pm2:stop
```

**Auto-start on system boot:**
```bash
pm2 startup
# Follow the instructions from the command output
pm2 save
```

### Option 2: Systemd Service

Create a systemd service file for auto-restart and boot startup.

```bash
sudo nano /etc/systemd/system/action-controller.service
```

Add the following content:

```ini
[Unit]
Description=Action Controller API Gateway
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/action-controller
ExecStart=/usr/bin/node /home/your-username/action-controller/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/your-username/action-controller/logs/out.log
StandardError=append:/home/your-username/action-controller/logs/err.log

Environment=NODE_ENV=production
EnvironmentFile=/home/your-username/action-controller/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable action-controller
sudo systemctl start action-controller

# Check status
sudo systemctl status action-controller

# View logs
journalctl -u action-controller -f
```

### Option 3: Direct Node (Not Recommended for Production)

```bash
npm start
```

Or run in background with nohup:

```bash
nohup npm start > logs/output.log 2>&1 &
```

## Nginx Reverse Proxy (Optional)

If you want to expose the API on port 80/443:

```bash
sudo nano /etc/nginx/sites-available/action-controller
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/action-controller /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Firewall Configuration

Allow incoming connections on your port:

```bash
# UFW
sudo ufw allow 3000/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

## Monitoring

### Check if the service is running

```bash
curl http://localhost:3000/health
```

### View logs

**PM2:**
```bash
npm run pm2:logs
# or
pm2 logs action-controller --lines 100
```

**Systemd:**
```bash
journalctl -u action-controller -f
```

**Direct logs:**
```bash
tail -f logs/combined.log
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000
# or
sudo netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>
```

### Permission issues
```bash
# Ensure correct ownership
chown -R $USER:$USER /path/to/action-controller

# Ensure logs directory exists
mkdir -p logs
chmod 755 logs
```

### Service won't start
```bash
# Check build output exists
ls -la dist/

# Manually test
node dist/index.js

# Check environment variables
cat .env
```

## Updating the Application

```bash
# Pull latest changes (if using git)
git pull

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart
npm run pm2:restart
# or
sudo systemctl restart action-controller
```

## Security Recommendations

1. **Use environment variables** for sensitive data
2. **Run as non-root user**
3. **Use a firewall** to restrict access
4. **Use HTTPS** via Nginx reverse proxy with SSL
5. **Keep dependencies updated**: `npm audit` and `npm update`
6. **Set up log rotation** to prevent disk space issues

## Performance Tips

- Increase PM2 instances for load balancing: Edit `ecosystem.config.js` and set `instances: 'max'`
- Monitor memory usage: `pm2 monit`
- Set up alerting for downtime
