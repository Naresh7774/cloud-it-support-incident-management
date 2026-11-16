#!/usr/bin/env bash
# ==============================================================================
# Cloud IT Support & Incident Management System - Production Deployment Script
# ==============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/app}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REGISTRY="${ECR_REGISTRY:-}"

echo "===================================================================="
echo " Starting Application Deployment: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo " Working Directory: $APP_DIR"
echo "===================================================================="

cd "$APP_DIR"

# 1. Verify Docker and Docker Compose are available
if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not installed or not in PATH."
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "ERROR: Neither 'docker compose' nor 'docker-compose' found."
    exit 1
fi

echo "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# 2. Check for .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "WARNING: .env file not found in $APP_DIR. Checking for .env.example..."
    if [ -f "$APP_DIR/.env.example" ]; then
        echo "Creating default .env from .env.example..."
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    fi
fi

# 3. Authenticate with Amazon ECR if ECR_REGISTRY is provided
if [ -n "$ECR_REGISTRY" ]; then
    echo "Authenticating with Amazon ECR ($ECR_REGISTRY)..."
    if command -v aws >/dev/null 2>&1; then
        aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    else
        echo "Notice: AWS CLI not found on host; relying on existing Docker login or IAM credentials."
    fi
fi

# 4. Pull latest application images
echo "Pulling latest container images..."
$DOCKER_COMPOSE_CMD pull || {
    echo "Notice: docker compose pull skipped or completed with warnings (building locally or using cache)."
}

# 5. Start containers gracefully with health checks
echo "Starting updated services with zero data loss (volumes preserved)..."
$DOCKER_COMPOSE_CMD up -d --remove-orphans

# 6. Verify Deployment Health
echo "Waiting for services to become healthy..."
MAX_ATTEMPTS=24
ATTEMPT=1
HEALTHY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Health check probe $ATTEMPT/$MAX_ATTEMPTS..."
    if curl -s -f http://localhost/health >/dev/null 2>&1 || curl -s -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "Health check PASSED! Application is operational."
        HEALTHY=true
        break
    fi
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ "$HEALTHY" = false ]; then
    echo "WARNING: Application health endpoint did not respond with 200 within timeout."
    echo "Checking service container status and recent logs:"
    $DOCKER_COMPOSE_CMD ps
    $DOCKER_COMPOSE_CMD logs --tail=40 backend
    exit 1
fi

# 7. Prune dangling and outdated Docker images to free disk space
echo "Cleaning up dangling images..."
docker image prune -f || true

echo "===================================================================="
echo " Deployment Successfully Completed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo " Services Status:"
$DOCKER_COMPOSE_CMD ps
echo "===================================================================="
