@echo off
REM Home Assistant Dashboard Deployment Script for Windows

setlocal enabledelayedexpansion

REM Default values
set DEPLOYMENT_TYPE=docker
set PORT=3000
set IMAGE_NAME=ha-dashboard
set CONTAINER_NAME=ha-dashboard

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :end_parse
if "%~1"=="-t" (
    set DEPLOYMENT_TYPE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--type" (
    set DEPLOYMENT_TYPE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
shift
goto :parse_args

:show_help
echo Usage: %0 [OPTIONS]
echo Options:
echo   -t, --type TYPE    Deployment type: docker, compose, swarm (default: docker)
echo   -p, --port PORT    Port to expose (default: 3000)
echo   -h, --help         Show this help message
exit /b 0

:end_parse

echo [INFO] Starting deployment with type: %DEPLOYMENT_TYPE%

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

REM Build the image
echo [INFO] Building Docker image...
docker build -t %IMAGE_NAME% .
if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed!
    exit /b 1
)
echo [SUCCESS] Image built successfully!

REM Deploy based on type
if "%DEPLOYMENT_TYPE%"=="docker" goto :deploy_docker
if "%DEPLOYMENT_TYPE%"=="compose" goto :deploy_compose
if "%DEPLOYMENT_TYPE%"=="swarm" goto :deploy_swarm
echo [ERROR] Invalid deployment type: %DEPLOYMENT_TYPE%
echo [ERROR] Valid types: docker, compose, swarm
exit /b 1

:deploy_docker
echo [INFO] Deploying with Docker...

REM Stop existing container
docker ps -q -f name=%CONTAINER_NAME% | findstr . >nul
if %errorlevel% equ 0 (
    echo [WARNING] Stopping existing container...
    docker stop %CONTAINER_NAME%
    docker rm %CONTAINER_NAME%
)

REM Run new container
docker run -d --name %CONTAINER_NAME% -p %PORT%:80 --restart unless-stopped %IMAGE_NAME%
if %errorlevel% equ 0 (
    echo [SUCCESS] Container deployed successfully!
    echo [INFO] Dashboard available at: http://localhost:%PORT%
) else (
    echo [ERROR] Failed to deploy container!
    exit /b 1
)
goto :end_deploy

:deploy_compose
echo [INFO] Deploying with Docker Compose...

REM Update port in docker-compose.yml if different
if not "%PORT%"=="3000" (
    powershell -Command "(Get-Content docker-compose.yml) -replace '3000:80', '%PORT%:80' | Set-Content docker-compose.yml"
)

docker-compose up -d
if %errorlevel% equ 0 (
    echo [SUCCESS] Stack deployed successfully!
    echo [INFO] Dashboard available at: http://localhost:%PORT%
) else (
    echo [ERROR] Failed to deploy with Docker Compose!
    exit /b 1
)
goto :end_deploy

:deploy_swarm
echo [INFO] Deploying with Docker Swarm...

REM Initialize swarm if not already initialized
docker info | findstr "Swarm: active" >nul
if %errorlevel% neq 0 (
    echo [INFO] Initializing Docker Swarm...
    docker swarm init
)

REM Deploy stack
docker stack deploy -c docker-compose.yml ha-dashboard
if %errorlevel% equ 0 (
    echo [SUCCESS] Stack deployed successfully!
    echo [INFO] Dashboard available at: http://localhost:%PORT%
) else (
    echo [ERROR] Failed to deploy with Docker Swarm!
    exit /b 1
)
goto :end_deploy

:end_deploy
echo [INFO] Deployment status:
if "%DEPLOYMENT_TYPE%"=="swarm" (
    docker service ls | findstr ha-dashboard
) else (
    docker ps | findstr %CONTAINER_NAME%
)

echo [SUCCESS] Deployment completed successfully!
echo [INFO] Useful commands:
echo [INFO]   View logs: docker logs -f %CONTAINER_NAME%
echo [INFO]   Stop: docker stop %CONTAINER_NAME%
echo [INFO]   Restart: docker restart %CONTAINER_NAME%

pause
