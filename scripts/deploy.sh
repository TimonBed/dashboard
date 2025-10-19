#!/bin/bash

# Home Assistant Dashboard Deployment Script
#
# Environment Variables (optional):
#   VITE_HA_URL - Home Assistant URL (e.g., http://homeassistant.local:8123)
#   VITE_HA_TOKEN - Home Assistant Long-Lived Access Token
#   VITE_OPENWEATHER_API_KEY - OpenWeather API key
#
# These can be set in .env file or exported in shell
# See ENV_SETUP.md for detailed configuration guide

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
DEPLOYMENT_TYPE="docker"
PORT=3000
IMAGE_NAME="ha-dashboard"
CONTAINER_NAME="ha-dashboard"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -t, --type TYPE    Deployment type: docker, compose, swarm (default: docker)"
            echo "  -p, --port PORT    Port to expose (default: 3000)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Starting deployment with type: $DEPLOYMENT_TYPE"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists and inform user
if [ -f .env ]; then
    print_status "Found .env file - environment variables will be included in build"
    # Export variables from .env for docker-compose
    export $(cat .env | grep -v '^#' | xargs)
else
    print_warning "No .env file found - using empty defaults (can configure via UI later)"
fi

# Build the image
print_status "Building Docker image..."
docker build \
    --build-arg VITE_HA_URL="${VITE_HA_URL}" \
    --build-arg VITE_HA_TOKEN="${VITE_HA_TOKEN}" \
    --build-arg VITE_OPENWEATHER_API_KEY="${VITE_OPENWEATHER_API_KEY}" \
    -t "$IMAGE_NAME" .
print_success "Image built successfully!"

# Deploy based on type
case $DEPLOYMENT_TYPE in
    "docker")
        print_status "Deploying with Docker..."
        
        # Stop existing container
        if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
            print_warning "Stopping existing container..."
            docker stop "$CONTAINER_NAME"
            docker rm "$CONTAINER_NAME"
        fi
        
        # Run new container
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p "$PORT:80" \
            --restart unless-stopped \
            "$IMAGE_NAME"
        
        print_success "Container deployed successfully!"
        print_status "Dashboard available at: http://localhost:$PORT"
        ;;
        
    "compose")
        print_status "Deploying with Docker Compose..."
        
        # Update port in docker-compose.yml if different
        if [ "$PORT" != "3000" ]; then
            sed -i "s/3000:80/$PORT:80/g" docker-compose.yml
        fi
        
        docker-compose up -d
        print_success "Stack deployed successfully!"
        print_status "Dashboard available at: http://localhost:$PORT"
        ;;
        
    "swarm")
        print_status "Deploying with Docker Swarm..."
        
        # Initialize swarm if not already initialized
        if ! docker info | grep -q "Swarm: active"; then
            print_status "Initializing Docker Swarm..."
            docker swarm init
        fi
        
        # Deploy stack
        docker stack deploy -c docker-compose.yml ha-dashboard
        print_success "Stack deployed successfully!"
        print_status "Dashboard available at: http://localhost:$PORT"
        ;;
        
    *)
        print_error "Invalid deployment type: $DEPLOYMENT_TYPE"
        print_error "Valid types: docker, compose, swarm"
        exit 1
        ;;
esac

# Show status
print_status "Deployment status:"
if [ "$DEPLOYMENT_TYPE" = "swarm" ]; then
    docker service ls | grep ha-dashboard
else
    docker ps | grep "$CONTAINER_NAME"
fi

print_success "Deployment completed successfully!"
print_status "Useful commands:"
print_status "  View logs: docker logs -f $CONTAINER_NAME"
print_status "  Stop: docker stop $CONTAINER_NAME"
print_status "  Restart: docker restart $CONTAINER_NAME"


