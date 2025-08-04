#!/bin/bash

# Build script for creating Synology package for Roadworthy Lens
# This script builds the application and creates a Synology .spk package

set -e

PACKAGE_NAME="RoadworthyLens"
VERSION="1.0.0"
BUILD_DIR="synology-build"
PACKAGE_DIR="${BUILD_DIR}/package"

echo "Building Roadworthy Lens Synology Package v${VERSION}"
echo "=================================================="

# Clean previous build
rm -rf "${BUILD_DIR}"
mkdir -p "${PACKAGE_DIR}"

echo "1. Installing dependencies..."
# Ensure all dependencies are installed, including dev dependencies for building
npm ci

echo "2. Building production application..."
# Use the production build script that handles Docker builds properly
node build-production.js

echo "3. Copying application files..."
# Copy built application
cp -r dist/ "${PACKAGE_DIR}/"
cp package.json "${PACKAGE_DIR}/"
cp package-lock.json "${PACKAGE_DIR}/"

# Copy synology package files
cp -r synology/* "${PACKAGE_DIR}/"

# Ensure proper directory structure for DSM 7.2
mkdir -p "${PACKAGE_DIR}/conf"
if [ ! -f "${PACKAGE_DIR}/conf/privilege" ]; then
    cp synology/conf/privilege "${PACKAGE_DIR}/conf/" 2>/dev/null || true
fi

echo "4. Installing production dependencies..."
cd "${PACKAGE_DIR}"
npm ci --production --silent
cd - > /dev/null

echo "5. Setting up package structure..."
# Make scripts executable
chmod +x "${PACKAGE_DIR}/scripts/"*

# Create required directories
mkdir -p "${PACKAGE_DIR}/data"
mkdir -p "${PACKAGE_DIR}/uploads" 
mkdir -p "${PACKAGE_DIR}/Completed"
mkdir -p "${PACKAGE_DIR}/logs"

echo "6. Creating package icon..."
# Copy or create package icon (you'll need to replace this with actual icon)
# For now, create a placeholder
echo "Note: You need to add a real PACKAGE_ICON.PNG (72x72) and PACKAGE_ICON_256.PNG (256x256)"
echo "These should be placed in the synology/ directory before building"

echo "7. Creating Synology package..."
cd "${BUILD_DIR}"

# Create the .spk package in the correct format for DSM 7.2
# Synology packages are actually tar files, not gzipped
tar -cf "${PACKAGE_NAME}-${VERSION}.spk" package/

cd - > /dev/null

echo ""
echo "✅ Package created successfully!"
echo "📦 Package location: ${BUILD_DIR}/${PACKAGE_NAME}-${VERSION}.spk"
echo ""
echo "📋 Installation Instructions:"
echo "1. Upload the .spk file to your Synology NAS"
echo "2. Open Package Center on your Synology"
echo "3. Click 'Manual Install' and select the .spk file"
echo "4. Follow the installation wizard"
echo "5. Access the app at http://[NAS-IP]:3333"
echo ""
echo "⚠️  Prerequisites:"
echo "- Node.js must be installed via Package Center first"
echo "- Minimum DSM version: 7.0 (Compatible with DSM 7.2+)"
echo ""
echo "🔧 Service Management:"
echo "- Start: /usr/local/bin/roadworthylens start"
echo "- Stop: /usr/local/bin/roadworthylens stop"
echo "- Status: /usr/local/bin/roadworthylens status"