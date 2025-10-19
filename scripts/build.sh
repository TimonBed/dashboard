#!/bin/bash

# Home Assistant Dashboard Build Script
# 
# Environment Variables (optional):
#   VITE_HA_URL - Home Assistant URL (e.g., http://homeassistant.local:8123)
#   VITE_HA_TOKEN - Home Assistant Long-Lived Access Token
#   VITE_OPENWEATHER_API_KEY - OpenWeather API key
#
# These can be set in .env file or passed as build arguments
# See ENV_SETUP.md for detailed configuration guide

set -e

echo "🏗️  Building Home Assistant Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Get version from package.json or use default
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "latest")
IMAGE_NAME="ha-dashboard"
FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"

print_status "Building image: ${FULL_IMAGE_NAME}"

# Check if .env file exists and inform user
if [ -f .env ]; then
    print_status "Found .env file - environment variables will be included in build"
else
    print_warning "No .env file found - using empty defaults (can configure via UI later)"
fi

# Build the Docker image with build args from environment
print_status "Starting Docker build..."
if docker build \
    --build-arg VITE_HA_URL="${VITE_HA_URL}" \
    --build-arg VITE_HA_TOKEN="${VITE_HA_TOKEN}" \
    --build-arg VITE_OPENWEATHER_API_KEY="${VITE_OPENWEATHER_API_KEY}" \
    -t "${FULL_IMAGE_NAME}" .; then
    print_success "Docker image built successfully!"
else
    print_error "Docker build failed!"
    exit 1
fi

# Also tag as latest
docker tag "${FULL_IMAGE_NAME}" "${IMAGE_NAME}:latest"
print_success "Tagged as latest"

# Show image info
print_status "Image information:"
docker images | grep "${IMAGE_NAME}"

# Ask if user wants to run the container
echo
read -p "Do you want to run the container now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting container..."
    
    # Stop existing container if running
    if docker ps -q -f name=ha-dashboard | grep -q .; then
        print_warning "Stopping existing container..."
        docker stop ha-dashboard
        docker rm ha-dashboard
    fi
    
    # Run the container
    if docker run -d \
        --name ha-dashboard \
        -p 3000:80 \
        --restart unless-stopped \
        "${FULL_IMAGE_NAME}"; then
        print_success "Container started successfully!"
        print_status "Dashboard is available at: http://localhost:3000"
        print_status "To view logs: docker logs -f ha-dashboard"
        print_status "To stop: docker stop ha-dashboard"
    else
        print_error "Failed to start container!"
        exit 1
    fi
else
    print_status "Container not started. You can run it later with:"
    echo "docker run -d --name ha-dashboard -p 3000:80 --restart unless-stopped ${FULL_IMAGE_NAME}"
fi

print_success "Build process completed!"


