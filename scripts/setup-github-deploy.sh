#!/bin/bash

# Setup script for GitHub auto-deploy
# This helps configure your repository for automated deployment

set -e

echo "🚀 HA Dashboard - GitHub Auto-Deploy Setup"
echo "==========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Run 'git init' first."
    exit 1
fi

# Get GitHub username for GHCR
echo "📦 GitHub Container Registry Configuration"
echo ""
echo "ℹ️  This will use GitHub Container Registry (ghcr.io) - FREE!"
echo ""

# Get GitHub repo info
echo "📁 GitHub Repository"
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name (default: HA_Dashboard): " REPO_NAME
REPO_NAME=${REPO_NAME:-HA_Dashboard}

# Convert repo name to lowercase for GHCR
REPO_NAME_LOWER=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')

# Update docker-compose.prod.yml with GitHub repo path
echo "Updating docker-compose.prod.yml..."
GITHUB_USERNAME_LOWER=$(echo "$GITHUB_USERNAME" | tr '[:upper:]' '[:lower:]')
sed -i.bak "s|ghcr.io/yourusername/ha_dashboard|ghcr.io/$GITHUB_USERNAME_LOWER/$REPO_NAME_LOWER|g" docker-compose.prod.yml
rm -f docker-compose.prod.yml.bak

echo "✅ Updated docker-compose.prod.yml"
echo ""

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Adding GitHub remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "✅ Added remote origin"
else
    echo "ℹ️  Remote origin already exists"
fi

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Enable GitHub Container Registry (GHCR):"
echo "   → Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/actions"
echo "   → Scroll to 'Workflow permissions'"
echo "   → Select 'Read and write permissions'"
echo "   → Save"
echo ""
echo "2. Add GitHub Secret (Webhook):"
echo "   → Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/secrets/actions"
echo "   → Add PORTAINER_WEBHOOK_URL: <get from step 3>"
echo ""
echo "3. Setup Portainer Webhook:"
echo "   → Login to Portainer"
echo "   → Create stack using docker-compose.prod.yml"
echo "   → Enable webhook in stack settings"
echo "   → Copy webhook URL"
echo "   → Add as GitHub secret: PORTAINER_WEBHOOK_URL"
echo ""
echo "4. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Setup auto-deploy with GHCR'"
echo "   git push -u origin main"
echo ""
echo "5. Watch deployment:"
echo "   → GitHub Actions: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
echo "   → Container Registry: https://github.com/$GITHUB_USERNAME/$REPO_NAME/pkgs/container/$REPO_NAME_LOWER"
echo ""
echo "📦 Your image will be at:"
echo "   ghcr.io/$GITHUB_USERNAME_LOWER/$REPO_NAME_LOWER:latest"
echo ""

