# Auto-Deploy with GitHub Container Registry (GHCR)

## 🎯 Overview

Push code → GitHub builds it → Automatically deploys to your server

**✅ NO Docker Hub account needed!**  
**✅ Uses FREE GitHub Container Registry**  
**✅ Fully automated with GitHub Actions**  

---

## 📋 Quick Setup (3 steps)

### 1. Run Setup Script

```powershell
# Windows
.\scripts\setup-github-deploy.ps1

# Linux/Mac
chmod +x scripts/setup-github-deploy.sh
./scripts/setup-github-deploy.sh
```

### 2. Enable GitHub Permissions

Go to: **Settings** → **Actions** → **General** → **Workflow permissions**

✅ Select: **"Read and write permissions"**

### 3. Setup Portainer

- Create stack using `docker-compose.prod.yml`
- Update image path: `ghcr.io/YOUR_USERNAME/YOUR_REPO:latest`
- Enable webhook
- Add webhook URL to GitHub secrets as `PORTAINER_WEBHOOK_URL`

---

## 🚀 Deploy!

```bash
git add .
git commit -m "My changes"
git push
```

Wait 3-4 minutes → ✅ Deployed!

---

## 📦 Your Image

After first push, your Docker image will be at:
```
ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
```

View it at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/pkgs/container/YOUR_REPO
```

---

## 🆓 Why GHCR?

| Feature | GitHub Container Registry | Docker Hub (Free) |
|---------|---------------------------|-------------------|
| **Cost** | FREE | FREE |
| **Account** | Use GitHub account | Separate account needed |
| **Rate Limits** | None | 100 pulls/6hr |
| **Storage** | Unlimited (public) | Limited |
| **Speed** | Fast (integrated) | Slower |
| **Setup** | 1 setting | Create account + token |

---

## 📚 Full Documentation

- **Quick Start**: [`QUICKSTART-DEPLOY.md`](QUICKSTART-DEPLOY.md)
- **Detailed Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

## 🆘 Troubleshooting

**Build fails?**
- Check: Settings → Actions → Workflow permissions
- Should be "Read and write"

**Can't pull image in Portainer?**
- Image path must be lowercase
- Format: `ghcr.io/username/repo:latest`

**Webhook not working?**
- Regenerate in Portainer
- Update GitHub secret

---

## ✅ Success Indicators

After pushing code, check:

1. ✅ GitHub Actions shows green checkmark
2. ✅ Image appears in GitHub Packages
3. ✅ Portainer webhook triggered
4. ✅ Container restarted
5. ✅ Dashboard accessible

---

## 💡 Pro Tip

Test locally before pushing:
```bash
docker build -t test .
docker run -p 3001:3001 test
```

Access at: `http://localhost:3001`

---

**Questions?** See [`QUICKSTART-DEPLOY.md`](QUICKSTART-DEPLOY.md) for detailed troubleshooting!

