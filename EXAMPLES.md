# Dashboard Configuration Examples

## LinkCard with Image URLs

### Example 1: Using Dashboard Icons CDN

```json
{
  "type": "link",
  "id": "jellyfin",
  "title": "Jellyfin",
  "url": "https://jellyfin.example.com",
  "subtitle": "Media Server",
  "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/jellyfin.png",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 1, "height": 1 }
}
```

### Example 2: Multiple Services with Custom Icons

```json
{
  "type": "room-section",
  "cards": [
    {
      "type": "link",
      "id": "plex",
      "title": "Plex",
      "url": "https://plex.example.com",
      "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/plex.svg"
    },
    {
      "type": "link",
      "id": "sonarr",
      "title": "Sonarr",
      "url": "https://sonarr.example.com",
      "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/sonarr.svg"
    },
    {
      "type": "link",
      "id": "radarr",
      "title": "Radarr",
      "url": "https://radarr.example.com",
      "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/radarr.svg"
    }
  ]
}
```

### Example 3: Using Simple Icons

```json
{
  "type": "link",
  "id": "github",
  "title": "GitHub",
  "url": "https://github.com",
  "icon": "https://cdn.simpleicons.org/github/white"
}
```

## Dashboard with Custom Icon

```json
{
  "id": "media-dashboard",
  "title": "Media",
  "path": "/media",
  "description": "Media server management",
  "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg",
  "backgroundColor": "bg-gradient-to-br from-purple-900 via-purple-800 to-violet-900",
  "columns": [
    {
      "id": "main",
      "gridColumns": { "sm": 1, "md": 2, "lg": 3, "xl": 4 },
      "cards": [...]
    }
  ]
}
```

## RoomHeaderCard with Custom Badge Icons

```json
{
  "type": "room-header",
  "title": "Media Room",
  "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/kodi.svg",
  "badges": [
    {
      "id": "temp",
      "entityId": "sensor.media_room_temperature",
      "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/temperature.svg"
    },
    {
      "id": "humidity",
      "entityId": "sensor.media_room_humidity",
      "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/humidity.svg"
    }
  ]
}
```

## ButtonCard with Custom Icon

```json
{
  "type": "button",
  "id": "plex-server",
  "title": "Plex Server",
  "iconName": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/plex.svg",
  "entityId": "switch.plex_server",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 1, "height": 1 }
}
```

## Complete Dashboard Example

```json
{
  "id": "services-dashboard",
  "title": "Services",
  "path": "/services",
  "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/server.svg",
  "columns": [
    {
      "id": "col1",
      "gridColumns": { "sm": 1, "md": 2, "lg": 3, "xl": 4 },
      "cards": [
        {
          "type": "link",
          "id": "homeassistant",
          "title": "Home Assistant",
          "url": "http://homeassistant.local:8123",
          "subtitle": "Smart Home Hub",
          "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/home-assistant.svg"
        },
        {
          "type": "link",
          "id": "portainer",
          "title": "Portainer",
          "url": "https://portainer.example.com",
          "subtitle": "Container Management",
          "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/portainer.svg"
        },
        {
          "type": "link",
          "id": "grafana",
          "title": "Grafana",
          "url": "https://grafana.example.com",
          "subtitle": "Monitoring",
          "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/grafana.svg"
        },
        {
          "type": "link",
          "id": "proxmox",
          "title": "Proxmox",
          "url": "https://proxmox.example.com:8006",
          "subtitle": "Virtualization",
          "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/proxmox.svg"
        }
      ]
    }
  ]
}
```

## Testing Icons

To test if an icon URL works:

1. **Right-click any card** → Settings → JSON tab
2. **Modify the icon field**:
   ```json
   {
     "icon": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg"
   }
   ```
3. **Click Save Changes**
4. The icon should update immediately

## Icon Resources

### Dashboard Icons Repository
Browse available icons:
- https://github.com/walkxcode/dashboard-icons
- https://github.com/homarr-labs/dashboard-icons

### Finding Icons
1. Visit the GitHub repository
2. Browse the `png/` or `svg/` folders
3. Copy the jsdelivr CDN URL for the icon
4. Use it in your dashboard JSON

### Creating CDN URLs

**Format:**
```
https://cdn.jsdelivr.net/gh/[username]/[repo]/[path]/[filename]
```

**Example:**
```
https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/plex.svg
```

## Best Practices

1. **Use SVG when possible** - Better quality at all sizes
2. **Use CDN URLs** - Faster and more reliable
3. **Test URLs first** - Open in browser to verify
4. **Consistent size** - All icons are rendered at the same size
5. **Keep URLs stable** - Avoid URLs that might change or expire
6. **Consider dark mode** - Some icons may not be visible on dark backgrounds

## Troubleshooting

**Icon doesn't show up:**
- Verify URL is accessible
- Check browser console for errors
- Try a different icon source

**Icon looks distorted:**
- Ensure using proper aspect ratio
- Try SVG instead of PNG/JPG
- Check source image quality

**Slow loading:**
- Use CDN-hosted icons
- Consider caching
- Optimize image size

