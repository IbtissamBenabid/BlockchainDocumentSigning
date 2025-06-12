# Docker Build Troubleshooting Guide

## Common Issues and Solutions

### 1. Signature Service Build Taking Too Long

**Problem**: The signature-service build takes 10+ minutes and sometimes gets canceled.

**Root Cause**: The `canvas` npm package requires native dependencies (Cairo, Pango, etc.) that take a long time to compile on Alpine Linux.

**Solution Applied**:
- Switched from `node:18-alpine` to `node:18-bullseye-slim`
- Updated system dependencies to use apt-get instead of apk
- Added .dockerignore to reduce build context
- Used `npm ci` instead of `npm install` for better caching

### 2. AI Service Build Failures

**Problem**: "failed to compute cache key: failed to read expected number of bytes: unexpected EOF"

**Root Cause**: Docker cache corruption or network issues during build.

**Solutions Applied**:
- Added curl to system dependencies for health checks
- Optimized pip installation process
- Added .dockerignore to reduce build context
- Updated Dockerfile for better error handling

### 3. General Docker Issues

**Common Problems**:
- Out of disk space
- Network timeouts
- Cache corruption
- Memory issues

**Solutions**:
1. Clean up Docker resources: `docker system prune -f`
2. Remove unused images: `docker image prune -f`
3. Increase Docker memory allocation in Docker Desktop
4. Use `--no-cache` flag when rebuilding

## Quick Fix Scripts

### Rebuild All Services
```powershell
.\docker-rebuild.ps1
```

### Rebuild Only Problem Services
```powershell
.\docker-rebuild-problem-services.ps1
```

### Manual Commands

#### Stop and clean everything:
```bash
docker-compose down
docker system prune -f
docker image prune -f
```

#### Rebuild specific service:
```bash
docker-compose build --no-cache signature-service
docker-compose up -d signature-service
```

#### Check service logs:
```bash
docker-compose logs signature-service
docker-compose logs ai-service
```

#### Check service status:
```bash
docker-compose ps
```

## Performance Optimization Tips

1. **Use .dockerignore files** - Already added to reduce build context
2. **Multi-stage builds** - Consider for production deployments
3. **Layer caching** - Order Dockerfile commands from least to most frequently changing
4. **Parallel builds** - Use `docker-compose build --parallel`
5. **Resource limits** - Set appropriate memory/CPU limits in docker-compose.yml

## Monitoring Build Progress

To see detailed build output:
```bash
docker-compose build --progress=plain signature-service
```

To see build context size:
```bash
docker-compose build --progress=plain --no-cache signature-service 2>&1 | grep "transferring context"
```

## When to Use Each Script

- **docker-rebuild.ps1**: When you want to completely rebuild everything (takes longer)
- **docker-rebuild-problem-services.ps1**: When only signature-service and ai-service are failing (faster)
- **Manual commands**: When you need fine-grained control or debugging

## Additional Notes

- The signature-service now uses Debian-based image for better native dependency support
- Build times should be significantly reduced with the optimizations
- If builds still fail, check Docker Desktop memory allocation (recommend 4GB+)
- Network issues can cause intermittent failures - retry the build if needed
