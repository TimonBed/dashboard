# Environment Variables Setup

This guide explains how to configure Home Assistant connection using environment variables.

## Overview

Environment variables provide default values for Home Assistant connection settings. These defaults can be overridden at any time through the UI Settings page.

## Quick Start

### 1. Create Environment File

Copy the example file:
```bash
cp .env.example .env
```

### 2. Configure Variables

Edit `.env` file:
```env
# Home Assistant URL (include protocol and port)
VITE_HA_URL=http://homeassistant.local:8123

# Home Assistant Long-Lived Access Token
VITE_HA_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGc...

# Optional: OpenWeather API Key
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

---

## Available Variables

### VITE_HA_URL
- **Description**: Your Home Assistant instance URL
- **Required**: No (can be set in UI)
- **Format**: Full URL with protocol and port
- **Examples**:
  - `http://homeassistant.local:8123`
  - `https://ha.example.com`
  - `http://192.168.1.100:8123`

### VITE_HA_TOKEN
- **Description**: Long-Lived Access Token for authentication
- **Required**: No (can be set in UI)
- **Format**: JWT token string
- **How to generate**:
  1. Login to Home Assistant
  2. Go to your Profile page
  3. Scroll to "Long-Lived Access Tokens"
  4. Click "Create Token"
  5. Copy the token (you won't see it again!)

### VITE_OPENWEATHER_API_KEY
- **Description**: OpenWeather API key for weather features
- **Required**: No (only if using weather cards)
- **Format**: API key string
- **How to get**: Sign up at https://openweathermap.org/api

---

## Usage Priority

The application uses settings in this order:

1. **UI Settings** (highest priority)
   - Settings saved via the Settings page
   - Stored in browser localStorage
   - Persists across sessions

2. **Environment Variables** (fallback)
   - Defined in `.env` file
   - Used if no UI settings exist
   - Baked into the build for production

3. **Empty/Default** (lowest priority)
   - If nothing is configured
   - User must configure via Settings page

---

## Development vs Production

### Development Mode

Environment variables are loaded from `.env` file at build time:

```bash
# .env file is read by Vite
npm run dev
```

Changes to `.env` require restarting the dev server.

### Production Build (Local)

Environment variables are baked into the build:

```bash
# Variables from .env are embedded in build
npm run build
npm run start
```

### Production Build (Docker)

#### Using docker-compose.yml

1. Set variables in your shell environment:
```bash
export VITE_HA_URL=http://homeassistant.local:8123
export VITE_HA_TOKEN=your_token_here
```

2. Build and run:
```bash
docker-compose up --build
```

Or create a `.env` file in the project root (docker-compose reads it automatically):
```env
VITE_HA_URL=http://homeassistant.local:8123
VITE_HA_TOKEN=your_token_here
```

#### Using GitHub Actions

Add secrets to your GitHub repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Add secrets:
   - `VITE_HA_URL`
   - `VITE_HA_TOKEN`
   - `VITE_OPENWEATHER_API_KEY`

The GitHub Actions workflow will automatically pass these to the Docker build.

---

## Security Considerations

### ⚠️ Important Security Notes

1. **Never commit `.env` to git**
   - `.env` is in `.gitignore` by default
   - Only commit `.env.example` (without actual values)

2. **Environment variables are baked into builds**
   - In production, these values are embedded in JavaScript
   - Anyone with access to the built files can extract them
   - The token is visible in browser DevTools

3. **Use Home Assistant's security features**
   - Use Long-Lived Access Tokens (can be revoked)
   - Don't use your admin password
   - Regularly rotate tokens
   - Monitor token usage in Home Assistant

4. **Network security**
   - Use HTTPS for Home Assistant when possible
   - Keep Home Assistant behind firewall
   - Use VPN for external access

### Recommended Setup

**For public deployments:**
- Don't set `VITE_HA_TOKEN` in environment
- Leave it empty and configure via UI after deployment
- Each user/device can use their own token

**For private/personal use:**
- Setting environment variables is convenient
- Tokens are embedded but only you have access
- Still recommended to configure via UI for flexibility

---

## Troubleshooting

### Environment variables not working

1. **Check variable names**: Must start with `VITE_`
2. **Restart dev server**: Changes require restart
3. **Check file location**: `.env` must be in project root
4. **Verify format**: No quotes needed, no spaces around `=`

### Token authentication fails

1. **Verify token is valid**: Check in Home Assistant
2. **Check token format**: Should be long JWT string
3. **Ensure no extra spaces**: Token must be exact
4. **Try regenerating**: Create new token if issues persist

### Settings page shows empty values

This is normal! Environment variables are defaults but don't show in the UI unless explicitly saved there. To see what's being used:

1. Open browser DevTools
2. Go to Application → Local Storage
3. Check `dashboard-settings` key

---

## Examples

### Example 1: Local Development

`.env`:
```env
VITE_HA_URL=http://192.168.1.100:8123
VITE_HA_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

```bash
npm run dev
```

### Example 2: Docker with Environment File

`.env`:
```env
VITE_HA_URL=http://homeassistant.local:8123
VITE_HA_TOKEN=your_token_here
```

```bash
docker-compose up --build
```

### Example 3: Docker with Command Line

```bash
docker-compose build \
  --build-arg VITE_HA_URL=http://homeassistant.local:8123 \
  --build-arg VITE_HA_TOKEN=your_token_here

docker-compose up
```

### Example 4: CI/CD Pipeline

GitHub Actions automatically uses repository secrets. No additional configuration needed if secrets are set up correctly.

---

## Related Documentation

- [README.md](README.md) - Main documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment with CI/CD
- [QUICKSTART-DEPLOY.md](QUICKSTART-DEPLOY.md) - Quick deployment guide
- [.env.example](.env.example) - Template file

