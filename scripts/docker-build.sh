#!/bin/bash

# Docker build script for Roadworthy Inspection App
set -e

echo "Building Roadworthy Inspection App Docker image..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Building version: $VERSION"

# Build the Docker image
docker build \
  --tag roadworthy-inspection:latest \
  --tag roadworthy-inspection:$VERSION \
  --progress=plain \
  .

echo "Docker image built successfully!"
echo "Tags created:"
echo "  - roadworthy-inspection:latest"
echo "  - roadworthy-inspection:$VERSION"

# Optional: Test the image
if [ "$1" = "--test" ]; then
  echo "Testing the Docker image..."
  
  # Run health check
  docker run --rm --name roadworthy-test \
    -p 5001:5005 \
    -d roadworthy-inspection:latest
  
  # Wait for startup
  sleep 10
  
  # Test API endpoint
  if curl -f http://localhost:5001/api/settings > /dev/null 2>&1; then
    echo "✅ Health check passed!"
  else
    echo "❌ Health check failed!"
    docker logs roadworthy-test
    exit 1
  fi
  
  # Cleanup
  docker stop roadworthy-test
  echo "Test completed successfully!"
fi

echo "Build script completed!"