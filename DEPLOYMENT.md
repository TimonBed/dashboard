# Home Assistant Dashboard - Docker Deployment Guide

This guide will help you deploy the Home Assistant Dashboard using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)
- Access to your Home Assistant instance

## Quick Start

### 1. Clone and Build

```bash
# Clone the repository
git clone <your-repo-url>
cd HA_Dashboard

# Build the Docker image
docker build -t ha-dashboard .
```

### 2. Run the Container

```bash
# Run with Docker
docker run -d \
  --name ha-dashboard \
  -p 3000:80 \
  --restart unless-stopped \
  ha-dashboard

# Or run with Docker Compose
docker-compose up -d
```

### 3. Access the Dashboard

Open your browser and navigate to:
- **Local**: http://localhost:3000
- **Network**: http://your-server-ip:3000

## Configuration

### Environment Variables

You can configure the dashboard using environment variables:

```bash
docker run -d \
  --name ha-dashboard \
  -p 3000:80 \
  -e HA_URL=ws://192.168.1.4:8123/api/websocket \
  -e HA_TOKEN=your_access_token \
  --restart unless-stopped \
  ha-dashboard
```

### Update WebSocket URL

To change the Home Assistant WebSocket URL, you'll need to rebuild the image with the new URL:

1. Edit `src/hooks/useHomeAssistant.ts`
2. Update the `WS_URL` constant
3. Rebuild the image: `docker build -t ha-dashboard .`
4. Restart the container: `docker restart ha-dashboard`

## Production Deployment

### 1. Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### 2. Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ha-dashboard

# View services
docker service ls
```

### 3. Using Kubernetes

Create a `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ha-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ha-dashboard
  template:
    metadata:
      labels:
        app: ha-dashboard
    spec:
      containers:
      - name: ha-dashboard
        image: ha-dashboard:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: ha-dashboard-service
spec:
  selector:
    app: ha-dashboard
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

Deploy with:
```bash
kubectl apply -f k8s-deployment.yaml
```

## Reverse Proxy Setup

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik (Docker Labels)

```yaml
version: '3.8'
services:
  ha-dashboard:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ha-dashboard.rule=Host(`dashboard.yourdomain.com`)"
      - "traefik.http.routers.ha-dashboard.entrypoints=websecure"
      - "traefik.http.routers.ha-dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.services.ha-dashboard.loadbalancer.server.port=80"
    networks:
      - traefik
```

## Monitoring and Maintenance

### Health Checks

The container includes health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect ha-dashboard | grep -A 10 Health
```

### Logs

```bash
# View container logs
docker logs ha-dashboard

# Follow logs in real-time
docker logs -f ha-dashboard
```

### Updates

```bash
# Pull latest changes
git pull

# Rebuild image
docker build -t ha-dashboard .

# Restart container
docker restart ha-dashboard
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check Home Assistant is running
   - Verify WebSocket URL is correct
   - Ensure firewall allows connections

2. **Container Won't Start**
   - Check logs: `docker logs ha-dashboard`
   - Verify port 3000 is available
   - Check Docker daemon is running

3. **Dashboard Not Loading**
   - Check container health: `docker ps`
   - Verify nginx is running inside container
   - Check browser console for errors

### Debug Mode

Run container in debug mode:

```bash
docker run -it --rm \
  --name ha-dashboard-debug \
  -p 3000:80 \
  ha-dashboard \
  sh
```

## Security Considerations

1. **Use HTTPS in production**
2. **Set up proper firewall rules**
3. **Regular security updates**
4. **Monitor container logs**
5. **Use secrets management for tokens**

## Performance Optimization

1. **Enable gzip compression** (already configured)
2. **Set up CDN for static assets**
3. **Use container resource limits**
4. **Monitor memory usage**

## Backup and Recovery

```bash
# Backup container data
docker cp ha-dashboard:/usr/share/nginx/html ./backup

# Restore from backup
docker cp ./backup ha-dashboard:/usr/share/nginx/html
```

## Support

For issues and questions:
1. Check the logs first
2. Verify Home Assistant connectivity
3. Check Docker and system resources
4. Review this documentation

---

**Note**: Remember to update the WebSocket URL in the source code before building if your Home Assistant instance uses a different address.
