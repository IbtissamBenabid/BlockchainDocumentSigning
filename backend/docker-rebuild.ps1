# Docker Rebuild Script for VerSafe Backend
# This script helps clean up Docker cache and rebuild services

Write-Host "VerSafe Docker Rebuild Script" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "1. Stopping all containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "2. Removing unused Docker resources..." -ForegroundColor Yellow
docker system prune -f

Write-Host "3. Removing dangling images..." -ForegroundColor Yellow
docker image prune -f

Write-Host "4. Building services with no cache..." -ForegroundColor Yellow
docker-compose build --no-cache --parallel

Write-Host "5. Starting services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "6. Showing service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host "Rebuild complete! Check the status above." -ForegroundColor Green
Write-Host "To view logs for a specific service, use: docker-compose logs [service-name]" -ForegroundColor Cyan
Write-Host "To view all logs, use: docker-compose logs -f" -ForegroundColor Cyan
