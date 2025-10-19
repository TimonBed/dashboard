@echo off
REM Home Assistant Dashboard Build Script for Windows
REM 
REM Environment Variables (optional):
REM   VITE_HA_URL - Home Assistant URL (e.g., http://homeassistant.local:8123)
REM   VITE_HA_TOKEN - Home Assistant Long-Lived Access Token
REM   VITE_OPENWEATHER_API_KEY - OpenWeather API key
REM
REM These can be set in .env file or as system environment variables
REM See ENV_SETUP.md for detailed configuration guide

echo 🏗️  Building Home Assistant Dashboard...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)

REM Get version from package.json or use default
for /f "tokens=*" %%i in ('node -p "require('./package.json').version" 2^>nul') do set VERSION=%%i
if "%VERSION%"=="" set VERSION=latest

set IMAGE_NAME=ha-dashboard
set FULL_IMAGE_NAME=%IMAGE_NAME%:%VERSION%

echo [INFO] Building image: %FULL_IMAGE_NAME%

REM Check if .env file exists and inform user
if exist .env (
    echo [INFO] Found .env file - environment variables will be included in build
) else (
    echo [WARNING] No .env file found - using empty defaults ^(can configure via UI later^)
)

REM Build the Docker image with build args from environment
echo [INFO] Starting Docker build...
docker build --build-arg VITE_HA_URL=%VITE_HA_URL% --build-arg VITE_HA_TOKEN=%VITE_HA_TOKEN% --build-arg VITE_OPENWEATHER_API_KEY=%VITE_OPENWEATHER_API_KEY% -t %FULL_IMAGE_NAME% .
if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed!
    exit /b 1
)

echo [SUCCESS] Docker image built successfully!

REM Also tag as latest
docker tag %FULL_IMAGE_NAME% %IMAGE_NAME%:latest
echo [SUCCESS] Tagged as latest

REM Show image info
echo [INFO] Image information:
docker images | findstr %IMAGE_NAME%

REM Ask if user wants to run the container
echo.
set /p choice="Do you want to run the container now? (y/n): "
if /i "%choice%"=="y" (
    echo [INFO] Starting container...
    
    REM Stop existing container if running
    docker ps -q -f name=ha-dashboard | findstr . >nul
    if %errorlevel% equ 0 (
        echo [WARNING] Stopping existing container...
        docker stop ha-dashboard
        docker rm ha-dashboard
    )
    
    REM Run the container
    docker run -d --name ha-dashboard -p 3000:80 --restart unless-stopped %FULL_IMAGE_NAME%
    if %errorlevel% equ 0 (
        echo [SUCCESS] Container started successfully!
        echo [INFO] Dashboard is available at: http://localhost:3000
        echo [INFO] To view logs: docker logs -f ha-dashboard
        echo [INFO] To stop: docker stop ha-dashboard
    ) else (
        echo [ERROR] Failed to start container!
        exit /b 1
    )
) else (
    echo [INFO] Container not started. You can run it later with:
    echo docker run -d --name ha-dashboard -p 3000:80 --restart unless-stopped %FULL_IMAGE_NAME%
)

echo [SUCCESS] Build process completed!
pause


