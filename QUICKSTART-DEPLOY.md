# Quick Start: Auto-Deploy with GitHub Container Registry

**Goal**: Push code to GitHub → Automatically build → Deploy to your server

**Time**: ~10 minutes

**Cost**: FREE! (Uses GitHub Container Registry)

---

## 🚀 Super Quick Setup

### 1. Run Setup Script

**Windows (PowerShell):**
```powershell
.\scripts\setup-github-deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-github-deploy.sh
./scripts/setup-github-deploy.sh
```

This will:
- ✅ Update docker-compose with your GitHub repo
- ✅ Configure git remote
- ✅ Show you exactly what to do next

---

### 2. Enable GitHub Container Registry

**Go to your repository settings:**
```
https://github.com/YOUR_USERNAME/YOUR_REPO/settings/actions
```

**Enable GHCR:**
1. Scroll to **"Workflow permissions"**
2. Select **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"** (optional)
4. Click **"Save"**

✅ This allows GitHub Actions to push Docker images to GHCR

---

### 3. Setup Portainer

**Login to Portainer:**
```
https://your-server:9443
```

**Create Stack:**
1. Go to: `Stacks` → `+ Add stack`
2. **Name**: `ha-dashboard`
3. **Build method**: `Web editor`
4. Copy content from `docker-compose.prod.yml`
5. **Update the image path:**
   ```yaml
   image: ghcr.io/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:latest
   ```
   Replace with your actual GitHub username and repo name (lowercase!)
6. Click **"Deploy the stack"**

**Enable Webhook:**
1. Click on your `ha-dashboard` stack
2. Scroll to **"Webhooks"** section
3. Click **"Add webhook"**
4. Copy the webhook URL

**Add Webhook to GitHub:**
1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `PORTAINER_WEBHOOK_URL`
4. Value: The webhook URL from Portainer
5. Click **"Add secret"**

---

### 4. First Deploy

**Commit and push:**
```bash
git add .
git commit -m "Setup auto-deploy with GHCR"
git push origin main
```

**Watch it work:**
1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. You should see workflow running
3. Wait ~3-5 minutes
4. Check your server: `http://your-server:3002`
5. Done! 🎉

---

## 📝 What Happens When You Push?

```
[Push to GitHub] 
    ↓
[GitHub Actions Triggered]
    ↓
[Build Docker Image (multi-arch)]
    ↓
[Push to GitHub Container Registry (ghcr.io)]
    ↓
[Trigger Portainer Webhook]
    ↓
[Portainer Pulls New Image]
    ↓
[Restart Container]
    ↓
[✅ Deployed!]
```

**Timeline:**
- Build: ~2-3 minutes
- Push to GHCR: ~30 seconds
- Portainer pull & restart: ~30 seconds
- **Total**: ~3-4 minutes from push to live

---

## 🔧 Troubleshooting

### Build fails in GitHub Actions

**Check:**
- Are workflow permissions set to "Read and write"?
- Check Actions logs for errors

**Fix:**
```bash
# Test build locally first
docker build -t test .
```

---

### Image not pushed to GHCR

**Check:**
- Repository → Settings → Actions → Workflow permissions
- Should be "Read and write permissions"

**Fix:**
- Update permissions and rerun workflow

---

### Webhook doesn't trigger

**Check:**
- Is `PORTAINER_WEBHOOK_URL` secret set in GitHub?
- Is webhook enabled in Portainer stack?
- Test manually:
  ```bash
  curl -X POST 'YOUR_WEBHOOK_URL'
  ```

**Fix:**
- Regenerate webhook in Portainer
- Update GitHub secret

---

### Container not updating

**Check:**
- Did GHCR receive new image?
- Check: `https://github.com/YOUR_USERNAME/YOUR_REPO/pkgs/container/YOUR_REPO`
- Is Portainer pulling latest?

**Fix:**
```bash
# Force update in Portainer
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
docker-compose up -d --force-recreate
```

---

### Port conflicts

**Change port in `docker-compose.prod.yml`:**
```yaml
ports:
  - "8080:3001"  # Change 8080 to any available port
```

Then redeploy in Portainer.

---

## 🎯 Daily Usage

**Normal development:**
```bash
# Make changes
git add .
git commit -m "Add new feature"
git push
# Wait 3-4 minutes
# ✅ Automatically deployed!
```

**Check deployment status:**
- GitHub Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- Container Registry: `https://github.com/YOUR_USERNAME/YOUR_REPO/pkgs/container/YOUR_REPO`
- Your server: `http://your-server:3002`

**View logs:**
```bash
docker logs -f ha-dashboard
```

---

## 🆓 Why GitHub Container Registry?

**Advantages:**
✅ **FREE** - No cost for public or private images
✅ **No separate account** - Uses your GitHub account
✅ **Unlimited storage** for public images
✅ **Fast** - Integrated with GitHub Actions
✅ **Multi-arch** - Supports AMD64, ARM64, etc.
✅ **No rate limits** (unlike Docker Hub free tier)

**vs Docker Hub:**
- Docker Hub free: 6 hours rate limit, requires separate account
- GHCR: No limits, same account, faster builds

---

## 🔐 Security Tips

✅ **DO:**
- Use GitHub secrets for sensitive data
- Keep webhook URLs private
- Use HTTPS for Portainer
- Enable 2FA on GitHub

❌ **DON'T:**
- Commit secrets to repository
- Share webhook URLs publicly
- Make container images public if they contain secrets

---

## 📦 Image Privacy

**Public images** (default):
- Anyone can pull: `docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:latest`
- Visible in GitHub Packages

**Private images:**
1. Go to: `https://github.com/users/YOUR_USERNAME/packages/container/YOUR_REPO/settings`
2. Change visibility to **"Private"**
3. Portainer needs authentication:
   - Add GitHub Personal Access Token in Portainer
   - Registries → Add registry
   - URL: `ghcr.io`
   - Username: Your GitHub username
   - Password: Personal Access Token

---

## 💡 Pro Tips

**Multi-environment:**
```yaml
# In .github/workflows/docker-deploy.yml
# Add staging branch support
on:
  push:
    branches:
      - main      # → Production (port 3002)
      - staging   # → Staging (port 3003)
```

**Rollback:**
```bash
# View available tags
docker images ghcr.io/YOUR_USERNAME/YOUR_REPO

# Pull specific version
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:main-abc123

# Update in Portainer or docker-compose
```

**Monitoring:**
```bash
# Watch logs
docker logs -f ha-dashboard

# Check health
curl http://your-server:3002/api/health

# Container stats
docker stats ha-dashboard
```

**Backup dashboards:**
```bash
# Before major updates
docker cp ha-dashboard:/app/dist/data/dashboards ./backup-$(date +%Y%m%d)
```

---

## 📊 GitHub Actions Free Tier

- **Minutes per month**: 2,000 (Free)
- **This workflow uses**: ~3 minutes per run
- **You can deploy**: ~600 times per month
- **Storage**: Unlimited for public images
- **Cost**: FREE! 🎉

---

## 🆘 Need Help?

**Check logs:**
1. GitHub Actions logs (`Actions` tab)
2. Container logs: `docker logs ha-dashboard`
3. Portainer logs

**Common issues:**
- Workflow permissions not set → Enable in repo settings
- Port conflicts → Change port in compose file
- Build fails → Check Dockerfile
- Webhook fails → Regenerate in Portainer
- Private image can't pull → Add GHCR credentials in Portainer

---

## ✅ Success Checklist

- [ ] Setup script run successfully
- [ ] GitHub workflow permissions enabled (Read and write)
- [ ] GitHub secret added: `PORTAINER_WEBHOOK_URL`
- [ ] Portainer stack created with correct image path
- [ ] Webhook enabled and added to GitHub
- [ ] First push successful
- [ ] GitHub Actions workflow passed
- [ ] Image appears in GitHub Packages
- [ ] Container running on server
- [ ] Dashboard accessible in browser

**All checked?** Congratulations! 🎊 You now have automated deployments with GHCR!

---

## 🔗 Useful Links

**Your repository:**
- Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- Packages: `https://github.com/YOUR_USERNAME/YOUR_REPO/pkgs/container/YOUR_REPO`
- Settings: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings`

**Documentation:**
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Portainer](https://docs.portainer.io/)

---

## 🚀 Next Steps

- Add more environments (staging, dev)
- Setup monitoring (Uptime Kuma, etc.)
- Configure reverse proxy (Nginx, Traefik)
- Add SSL certificate
- Setup automated backups
- Configure Home Assistant integration

Happy deploying with GHCR! 🎉
