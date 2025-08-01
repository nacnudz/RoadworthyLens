#!/bin/bash

# Docker deployment script for Roadworthy Inspection App
set -e

ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"

echo "Deploying Roadworthy Inspection App in $ENVIRONMENT mode..."

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p data uploads Completed ssl

# Set proper permissions
if [ "$(id -u)" = "0" ]; then
    chown -R 1001:1001 data uploads Completed
fi

case $ENVIRONMENT in
  "production")
    echo "🚀 Starting production deployment with nginx..."
    
    # Check for SSL certificates
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
      echo "⚠️  SSL certificates not found in ssl/ directory"
      echo "   Application will run with HTTP only"
      echo "   For HTTPS, place cert.pem and key.pem in ssl/ directory"
    fi
    
    # Deploy with production profile
    docker-compose --profile production up -d --build
    
    echo "✅ Production deployment started!"
    echo "   HTTP:  http://localhost"
    echo "   HTTPS: https://localhost (if SSL configured)"
    ;;
    
  "development")
    echo "🔧 Starting development deployment..."
    docker-compose up -d --build
    
    echo "✅ Development deployment started!"
    echo "   App: http://localhost:5000"
    ;;
    
  "stop")
    echo "🛑 Stopping all services..."
    docker-compose --profile production down
    echo "✅ All services stopped!"
    exit 0
    ;;
    
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [development|production|stop]"
    exit 1
    ;;
esac

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Health check
if [ "$ENVIRONMENT" = "production" ]; then
  HEALTH_URL="http://localhost/health"
else
  HEALTH_URL="http://localhost:5000/api/settings"
fi

for i in {1..10}; do
  if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Application is healthy and ready!"
    break
  else
    if [ $i -eq 10 ]; then
      echo "❌ Health check failed after 10 attempts"
      echo "Checking logs..."
      docker-compose logs --tail=20
      exit 1
    fi
    echo "⏳ Waiting for application to be ready... ($i/10)"
    sleep 5
  fi
done

echo ""
echo "📊 Deployment Status:"
docker-compose ps

echo ""
echo "📝 View logs with:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services with:"
echo "   ./scripts/docker-deploy.sh stop"