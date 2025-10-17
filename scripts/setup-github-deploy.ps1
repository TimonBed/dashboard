# Setup script for GitHub auto-deploy (PowerShell)
# This helps configure your repository for automated deployment

$ErrorActionPreference = "Stop"

Write-Host "🚀 HA Dashboard - GitHub Auto-Deploy Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Get GitHub username for GHCR
Write-Host "📦 GitHub Container Registry Configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "ℹ️  This will use GitHub Container Registry (ghcr.io) - FREE!" -ForegroundColor Blue
Write-Host ""

# Get GitHub repo info
Write-Host "📁 GitHub Repository" -ForegroundColor Yellow
Write-Host ""
$GITHUB_USERNAME = Read-Host "Enter your GitHub username"
$REPO_NAME = Read-Host "Enter repository name (default: HA_Dashboard)"
if ([string]::IsNullOrWhiteSpace($REPO_NAME)) {
    $REPO_NAME = "HA_Dashboard"
}

# Convert repo name to lowercase for GHCR
$REPO_NAME_LOWER = $REPO_NAME.ToLower()

# Update docker-compose.prod.yml with GitHub repo path
Write-Host "Updating docker-compose.prod.yml..." -ForegroundColor Gray
$content = Get-Content "docker-compose.prod.yml" -Raw
$content = $content -replace "ghcr.io/yourusername/ha_dashboard", "ghcr.io/$($GITHUB_USERNAME.ToLower())/$REPO_NAME_LOWER"
Set-Content "docker-compose.prod.yml" -Value $content

Write-Host "✅ Updated docker-compose.prod.yml" -ForegroundColor Green
Write-Host ""

# Check if remote exists
try {
    git remote get-url origin 2>&1 | Out-Null
    Write-Host "ℹ️  Remote origin already exists" -ForegroundColor Blue
} catch {
    Write-Host "Adding GitHub remote..." -ForegroundColor Gray
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    Write-Host "✅ Added remote origin" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Enable GitHub Container Registry (GHCR):" -ForegroundColor White
Write-Host "   → Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/actions" -ForegroundColor Gray
Write-Host "   → Scroll to 'Workflow permissions'" -ForegroundColor Gray
Write-Host "   → Select 'Read and write permissions'" -ForegroundColor Gray
Write-Host "   → Save" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add GitHub Secret (Webhook):" -ForegroundColor White
Write-Host "   → Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   → Add PORTAINER_WEBHOOK_URL: <get from step 3>" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Setup Portainer Webhook:" -ForegroundColor White
Write-Host "   → Login to Portainer" -ForegroundColor Gray
Write-Host "   → Create stack using docker-compose.prod.yml" -ForegroundColor Gray
Write-Host "   → Enable webhook in stack settings" -ForegroundColor Gray
Write-Host "   → Copy webhook URL" -ForegroundColor Gray
Write-Host "   → Add as GitHub secret: PORTAINER_WEBHOOK_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Push to GitHub:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Setup auto-deploy with GHCR'" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Watch deployment:" -ForegroundColor White
Write-Host "   → GitHub Actions: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions" -ForegroundColor Gray
Write-Host "   → Container Registry: https://github.com/$GITHUB_USERNAME/$REPO_NAME/pkgs/container/$REPO_NAME_LOWER" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Your image will be at:" -ForegroundColor Yellow
Write-Host "   ghcr.io/$($GITHUB_USERNAME.ToLower())/$REPO_NAME_LOWER:latest" -ForegroundColor Cyan
Write-Host ""

# Open browser to helpful links
$openGitHub = Read-Host "Open GitHub Actions settings in browser? (y/n)"
if ($openGitHub -eq "y") {
    Start-Process "https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/actions"
}

$openSecrets = Read-Host "Open GitHub secrets page in browser? (y/n)"
if ($openSecrets -eq "y") {
    Start-Process "https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/secrets/actions"
}

Write-Host ""
Write-Host "🎉 Ready to deploy! Run the commands above to get started." -ForegroundColor Green

