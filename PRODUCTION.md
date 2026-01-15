# Production Deployment Guide

## How It Works

The production setup includes:
- **Frontend**: Static React app built to `dist/`
- **Backend**: Express server that serves the static files AND provides the API
- **Dashboard Files**: Copied to `dist/data/dashboards/` during build
- **Dynamic Loading**: Dashboards are loaded from the filesystem at runtime, not bundled

```
┌─────────────────────────────────────────────┐
│  Express Server (server.js)                 │
│  Port: 3001                                  │
│                                              │
│  ┌────────────────────────────────┐         │
│  │  API Routes                    │         │
│  │  GET  /api/dashboards          │         │
│  │  GET  /api/dashboards/:id      │         │
│  │  POST /api/dashboard           │         │
│  │  GET  /api/health              │         │
│  │                                │         │
│  │  → Reads from dist/data/dashboards/     │
│  │  → Writes to dist/data/dashboards/      │
│  └────────────────────────────────┘         │
│                                              │
│  ┌────────────────────────────────┐         │
│  │  Static File Serving           │         │
│  │  Serves: dist/                 │         │
│  │  → index.html, assets/, etc.   │         │
│  └────────────────────────────────┘         │
└─────────────────────────────────────────────┘
         ↕
┌─────────────────────────────────────────────┐
│  React App (in Browser)                     │
│                                              │
│  dashboardService:                           │
│  • Fetches dashboards from /api/dashboards  │
│  • Saves changes to /api/dashboard          │
│  • Automatically reloads after save         │
│                                              │
│  ✅ Changes persist immediately              │
│  ✅ No page reload needed                    │
└─────────────────────────────────────────────┘
```

## Development vs Production

### Development Mode
```bash
npm run dev
```
- Uses Vite dev server
- Middleware in `vite.config.ts` handles API
- Saves to `src/data/dashboards/`
- Hot module replacement (HMR)
- Fast refresh

### Production Mode
```bash
npm run prod
```
- Builds static files with `vite build`
- Copies dashboards to `dist/data/dashboards/`
- Starts Express server with `server.js`
- Serves static files from `dist/`
- API endpoint available at `/api/dashboard`
- Saves to `dist/data/dashboards/`

## Build & Run

### Build for Production
```bash
npm run build
```
This will:
1. Compile TypeScript
2. Build React app with Vite
3. Copy dashboard files to `dist/data/dashboards/`

### Start Production Server
```bash
npm start
```
Server will run on port 3001 (or PORT environment variable)

### Build & Start Combined
```bash
npm run prod
```

## Deployment Options

### Option 1: Node.js Hosting (Recommended)

**Platforms:** Heroku, Railway, Render, DigitalOcean, AWS EC2, etc.

**Files to Deploy:**
```
.
├── dist/              ← Built frontend
├── server.js          ← Production server
├── package.json       ← Dependencies
└── package-lock.json
```

**Deployment Steps:**
1. Build the app: `npm run build`
2. Upload files to server
3. Install dependencies: `npm install --production`
4. Start server: `npm start`

**Example: Heroku**
```bash
# Add Procfile
echo "web: npm start" > Procfile

# Deploy
git add .
git commit -m "Production build"
git push heroku main
```

**Example: PM2 (Process Manager)**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "ha-dashboard"

# Save PM2 config
pm2 save
pm2 startup
```

### Option 2: Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy built files and server
COPY dist/ ./dist/
COPY server.js ./

EXPOSE 3001

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  ha-dashboard:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    volumes:
      - ./dist/data/dashboards:/app/dist/data/dashboards
    restart: unless-stopped
```

**Build & Run:**
```bash
docker build -t ha-dashboard .
docker run -p 3001:3001 ha-dashboard
```

### Option 3: Reverse Proxy (nginx)

**nginx config:**
```nginx
server {
    listen 80;
    server_name dashboard.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

```bash
# Port (default: 3001)
PORT=3001

# Node environment
NODE_ENV=production
```

## How Dashboard Loading Works

### Development Mode
```javascript
// Falls back to bundled data if API not available
this.dashboards = [tabletDashboard, securityDashboard];
```

### Production Mode
```javascript
// dashboardService.ts fetches from API
const response = await fetch("/api/dashboards");
const result = await response.json();

// Loads fresh data from disk every time
this.dashboards = result.dashboards;
```

**Key Benefits:**
- ✅ Dashboard edits are **immediately visible** (no rebuild needed)
- ✅ Changes **persist to disk** automatically
- ✅ API **reads fresh data** from files on every request
- ✅ Automatically **falls back** to bundled data if API unavailable

## File Persistence

**Important:** Dashboard edits save to `dist/data/dashboards/`

**How it works:**
1. User edits dashboard in UI (right-click → Edit JSON)
2. Frontend calls `POST /api/dashboard` with changes
3. Server writes to `dist/data/dashboards/[id].json`
4. dashboardService reloads from `GET /api/dashboards`
5. UI updates with new data

**Options for persistence:**

### 1. Volume Mount (Docker)
```yaml
volumes:
  - ./dashboards:/app/dist/data/dashboards
```

### 2. Copy Back After Changes
```bash
# Sync edited dashboards back to src
cp -r dist/data/dashboards/* src/data/dashboards/
```

### 3. Git Commit Changes
```bash
# After editing dashboards in production
cd dist/data/dashboards
git add .
git commit -m "Update dashboards"
git push
```

### 4. External Storage (Advanced)
Modify `server.js` to save to:
- Database (MongoDB, PostgreSQL)
- Cloud storage (S3, Google Cloud Storage)
- Network file system

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
# Response: {"status":"ok","timestamp":"2024-..."}
```

### Logs
```bash
# PM2 logs
pm2 logs ha-dashboard

# Docker logs
docker logs ha-dashboard

# Direct logs
npm start 2>&1 | tee app.log
```

## Security Considerations

1. **HTTPS**: Use reverse proxy (nginx/Caddy) with SSL
2. **Authentication**: Add auth middleware to `/api/dashboard` endpoint
3. **CORS**: Configure if frontend served from different domain
4. **Rate Limiting**: Prevent abuse of API endpoint
5. **Input Validation**: Validate dashboard JSON before saving

**Example: Add Basic Auth**
```javascript
// server.js
import basicAuth from 'express-basic-auth';

app.use('/api/dashboard', basicAuth({
  users: { 'admin': 'secretpassword' },
  challenge: true
}));
```

## Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3002 npm start
```

### Dashboards Not Saving
Check file permissions:
```bash
ls -la dist/data/dashboards/
chmod -R 755 dist/data/dashboards/
```

### API 404 Errors
Ensure server is running and check:
```bash
curl -X POST http://localhost:3001/api/dashboard \
  -H "Content-Type: application/json" \
  -d '{"dashboardId":"test","data":{}}'
```

## Updating the Application

```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies
npm install

# 3. Rebuild
npm run build

# 4. Restart server
pm2 restart ha-dashboard
# or
docker restart ha-dashboard
```

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Dashboard Location** | `src/data/dashboards/` | `dist/data/dashboards/` |
| **Dashboard Loading** | Static imports (bundled) | API fetch (from disk) |
| **API Handler** | `vite.config.ts` middleware | `server.js` Express routes |
| **API Endpoints** | `POST /api/dashboard` | `GET /api/dashboards`<br>`GET /api/dashboards/:id`<br>`POST /api/dashboard` |
| **Server** | Vite dev server | Node.js Express server |
| **Port** | 3001 (Vite) | 3001 (Express) |
| **Auto-reload** | HMR (Hot Module Replacement) | API refetch after save |

## Summary

✅ **Development**: Edit dashboards → Saved to `src/data/dashboards/` → HMR reload  
✅ **Production**: Edit dashboards → Saved to `dist/data/dashboards/` → API reload  
✅ Both modes support live editing via the UI  
✅ Changes persist immediately to disk  
✅ No manual file downloads/replacements needed  
✅ Dashboard data always loaded fresh from filesystem  
✅ Right-click any card → Settings → JSON tab → Edit & Save  
✅ Icons support both named icons and image URLs (JPG, PNG, SVG, etc.)  
✅ Use CDN-hosted icons from dashboard-icons repos

