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

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Home Assistant connection:**
   - Update the WebSocket URL in `src/hooks/useHomeAssistant.ts`
   - Update the access token in `src/hooks/useHomeAssistant.ts`

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Configuration

The dashboard connects to Home Assistant using:
- **WebSocket URL**: `ws://192.168.1.4:8123/api/websocket`
- **Access Token**: Configured in the code

To change these settings, edit `src/hooks/useHomeAssistant.ts`.

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
