# Home Assistant Dashboard

A modern, real-time dashboard alternative to Home Assistant's Lovelace UI built with React, TypeScript, and WebSocket API.

## Features

- 🔄 **Real-time Updates**: Live sensor data via WebSocket connection
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean, professional interface with Tailwind CSS
- ⚡ **Fast Performance**: Built with Vite and optimized React
- 🔐 **Secure**: Token-based authentication
- 📊 **Live Statistics**: Real-time sensor counts and status

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **WebSocket API** for real-time communication
- **Lucide React** for icons

## Getting Started

### Development Mode

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Home Assistant connection:**
   - Copy `.env.example` to `.env`
   - Set your Home Assistant URL and token in `.env`:
     ```
     VITE_HA_URL=http://homeassistant.local:8123
     VITE_HA_TOKEN=your_long_lived_access_token
     ```
   - These values can also be overridden via the UI Settings page
   - See [ENV_SETUP.md](ENV_SETUP.md) for detailed configuration guide

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3001`

### Production Mode

1. **Build and start production server:**
   ```bash
   npm run prod
   ```
   This will:
   - Build the app with Vite
   - Copy dashboard configurations
   - Start Express server at `http://localhost:3001`

2. **Or run steps separately:**
   ```bash
   npm run build   # Build only
   npm start       # Start production server
   ```

**Key Difference**: 
- **Development**: Dashboard edits save to `src/data/dashboards/` (source files)
- **Production**: Dashboard edits save to `dist/data/dashboards/` (build output)

See [PRODUCTION.md](./PRODUCTION.md) for detailed deployment guide.

## Configuration

### Home Assistant Connection

The dashboard supports multiple configuration methods:

1. **Environment Variables** (recommended for defaults)
   - Set in `.env` file: `VITE_HA_URL` and `VITE_HA_TOKEN`
   - Used as defaults when UI settings are empty
   - See [ENV_SETUP.md](ENV_SETUP.md) for detailed guide

2. **UI Settings Page** (recommended for runtime changes)
   - Navigate to Settings in the dashboard
   - Configure URL and token
   - Overrides environment variables
   - Persists in browser localStorage

**Priority**: UI Settings > Environment Variables > Empty

### Dashboard Icons
You can use both named icons and image URLs for cards and dashboards.
See [ICON_USAGE.md](./ICON_USAGE.md) for detailed examples and icon sources.

## Features Overview

### Live Sensor Monitoring
- Real-time updates for all sensor entities
- Automatic filtering of sensor, binary_sensor, device_tracker, weather, sun, and person entities
- Visual status indicators with appropriate colors and icons

### Dashboard Statistics
- Total sensor count
- Online sensor count
- Temperature sensor count
- Binary sensor count

### Connection Management
- Automatic reconnection on connection loss
- Connection status indicator
- Manual reconnect button
- Error handling and display

## Development

The project uses modern development practices:
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Vite for fast development

## License

MIT License
