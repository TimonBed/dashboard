# Automated Deployment Guide

## GitHub Actions + Portainer Auto-Deploy

This project uses GitHub Actions to automatically build Docker images and deploy to your server via Portainer.

---

## Setup Instructions

### 1. GitHub Secrets Configuration

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### Required Secrets:

**`DOCKER_USERNAME`**
- Your Docker Hub username
- Example: `yourusername`

**`DOCKER_PASSWORD`**
- Your Docker Hub access token (not your password!)
- Get it from: https://hub.docker.com/settings/security
- Click "New Access Token"
- Name: `GitHub Actions HA Dashboard`
- Permissions: `Read, Write, Delete`
- Copy the token and add as secret

**`PORTAINER_WEBHOOK_URL`**
- Webhook URL from Portainer (see below how to get it)
- Example: `https://your-server:9443/api/webhooks/12345678-1234-1234-1234-123456789abc`

#### Optional Secrets (Home Assistant Default Configuration):

**`VITE_HA_URL`**
- Your Home Assistant URL (e.g., `http://homeassistant.local:8123`)
- This will be baked into the built app as a default value
- Can be overridden via the UI Settings page

**`VITE_HA_TOKEN`**
- Your Home Assistant Long-Lived Access Token
- Generate from: Profile → Long-Lived Access Tokens
- This will be baked into the built app as a default value
- Can be overridden via the UI Settings page

**`VITE_OPENWEATHER_API_KEY`** (optional)
- Your OpenWeather API key if using weather features

---

### 2. Portainer Webhook Setup

#### Option A: Create Stack with Webhook

1. **Login to Portainer** (`https://your-server:9443`)

2. **Create Stack:**
   - Go to: `Stacks` → `+ Add stack`
   - **Name**: `ha-dashboard`
   - **Build method**: `Repository`
   
3. **Repository Configuration:**
   - **Repository URL**: `https://github.com/yourusername/HA_Dashboard`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`
   - **Authentication**: Leave empty for public repos, or add deploy key for private

4. **Advanced Settings:**
   - Enable **Automatic updates**
   - **Webhook**: Enable this!
   - **Fetch interval**: 5 minutes (or as desired)

5. **Deploy** the stack

6. **Get Webhook URL:**
   - After deployment, click on your stack
   - Look for "Service webhook" section
   - Copy the webhook URL
   - Add it to GitHub secrets as `PORTAINER_WEBHOOK_URL`

---

#### Option B: Use Watchtower (Alternative)

If you prefer automatic image updates without webhooks:

**Add to your `docker-compose.yml`:**

```yaml
services:
  ha-dashboard:
    image: yourusername/ha-dashboard:latest
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    # ... rest of config

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
      - WATCHTOWER_LABEL_ENABLE=true
    restart: unless-stopped
```

---

### 3. Update docker-compose.yml for Auto-Deploy

Use pre-built images instead of building locally:

```yaml
services:
  ha-dashboard:
    image: yourusername/ha-dashboard:latest  # Change to your Docker Hub username
    container_name: ha-dashboard
    ports:
      - "3002:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ha-dashboard-data:/app/dist/data/dashboards
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  ha-dashboard-data:
    driver: local
```

---

### 4. First Deployment

**Push to GitHub:**
```bash
git add .
git commit -m "Setup auto-deploy"
git push origin main
```

**Watch the build:**
- Go to GitHub → Actions tab
- Watch the workflow run
- Should see: ✅ Build and Deploy to Docker

**Check Portainer:**
- The webhook will trigger
- Stack will pull new image and restart
- Check logs: `docker logs ha-dashboard`

---

## Deployment Workflow

### Automatic:
1. **Push code** to GitHub (main branch)
2. **GitHub Actions** builds multi-arch Docker image
3. **Pushes** to Docker Hub
4. **Triggers** Portainer webhook
5. **Portainer** pulls new image and restarts stack
6. **Done!** ✅

### Manual Deploy:
```bash
# Trigger workflow manually
# Go to: GitHub → Actions → "Build and Deploy to Docker" → Run workflow
```

---

## Troubleshooting

### Build fails in GitHub Actions
- Check Actions logs
- Verify Docker Hub credentials
- Ensure Dockerfile is correct

### Webhook doesn't trigger deployment
- Check webhook URL is correct
- Test manually: `curl -X POST 'YOUR_WEBHOOK_URL'`
- Verify stack auto-update is enabled in Portainer

### Image not updating on server
- Check Portainer stack settings
- Enable "Pull latest image version"
- Or use Watchtower for automatic updates

### Port conflicts
- Change host port in `docker-compose.yml`
- Example: `"8080:3001"` instead of `"3002:3001"`

---

## Security Notes

**GitHub Secrets:**
- Never commit secrets to repository
- Use GitHub encrypted secrets only
- Rotate Docker Hub tokens regularly

**Portainer Webhook:**
- Keep webhook URL private
- Use HTTPS for Portainer
- Consider IP restrictions if possible

**Docker Registry:**
- Use private registry for sensitive apps
- Or keep repo private and use Docker Hub private images

---

## Multi-Environment Setup

### Production + Staging

**Create branches:**
```bash
git checkout -b staging
git push -u origin staging
```

**Update workflow** to deploy staging to different port:
```yaml
- name: Set environment
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      echo "ENV=production" >> $GITHUB_ENV
      echo "PORT=3002" >> $GITHUB_ENV
    else
      echo "ENV=staging" >> $GITHUB_ENV
      echo "PORT=3003" >> $GITHUB_ENV
    fi
```

**Create separate stacks** in Portainer:
- `ha-dashboard-prod` (port 3002)
- `ha-dashboard-staging` (port 3003)
- Separate webhooks for each

---

## Rollback

### Via Portainer:
1. Go to stack
2. Click "Redeploy"
3. Choose previous image tag

### Via Docker:
```bash
# List available tags
docker images yourusername/ha-dashboard

# Pull specific version
docker pull yourusername/ha-dashboard:main-abc123

# Update compose with specific tag
# Then redeploy
```

---

## Monitoring

**View logs:**
```bash
docker logs -f ha-dashboard
```

**Health check:**
```bash
curl http://your-server:3002/api/health
```

**Container stats:**
```bash
docker stats ha-dashboard
```

---

## Cost Optimization

**GitHub Actions:**
- Free tier: 2,000 minutes/month
- This workflow uses ~2-3 minutes per run
- ~600-1000 deploys per month on free tier

**Docker Hub:**
- Free tier: Unlimited public repos
- Rate limits: 200 pulls/6hr (authenticated)
- Consider upgrading for private repos

**Alternatives:**
- GitHub Container Registry (ghcr.io) - Free!
- Self-hosted registry
- GitLab CI/CD with built-in registry

---

## Advanced: Use GitHub Container Registry (Free Alternative)

**Update workflow:**
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  with:
    tags: ghcr.io/${{ github.repository }}:latest
```

**Update docker-compose.yml:**
```yaml
services:
  ha-dashboard:
    image: ghcr.io/yourusername/ha_dashboard:latest
```

**Authenticate Portainer:**
- Create GitHub Personal Access Token
- Add to Portainer registry settings
- Registry URL: `ghcr.io`
