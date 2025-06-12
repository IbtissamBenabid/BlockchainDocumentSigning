# Rebuild only the problematic services (signature-service and ai-service)
# This is faster than rebuilding everything

Write-Host "Rebuilding Problem Services (signature-service and ai-service)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Stop the problematic services
Write-Host "1. Stopping problematic services..." -ForegroundColor Yellow
docker-compose stop signature-service ai-service

# Remove the containers
Write-Host "2. Removing containers..." -ForegroundColor Yellow
docker-compose rm -f signature-service ai-service

# Remove the images
Write-Host "3. Removing old images..." -ForegroundColor Yellow
docker rmi backend-signature-service backend-ai-service 2>$null

# Clean up build cache for these services
Write-Host "4. Cleaning build cache..." -ForegroundColor Yellow
docker builder prune -f

# Rebuild only these services
Write-Host "5. Rebuilding signature-service..." -ForegroundColor Yellow
docker-compose build --no-cache signature-service

Write-Host "6. Rebuilding ai-service..." -ForegroundColor Yellow
docker-compose build --no-cache ai-service

# Start the services
Write-Host "7. Starting rebuilt services..." -ForegroundColor Yellow
docker-compose up -d signature-service ai-service

Write-Host "8. Checking service status..." -ForegroundColor Yellow
docker-compose ps signature-service ai-service

Write-Host "Rebuild of problem services complete!" -ForegroundColor Green
Write-Host "To check logs: docker-compose logs signature-service ai-service" -ForegroundColor Cyan
