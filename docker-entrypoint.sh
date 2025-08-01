#!/bin/sh

# Docker entrypoint script for Roadworthy Inspection App
set -e

echo "Starting Roadworthy Inspection App..."

# Create necessary directories if they don't exist
mkdir -p /app/data /app/uploads /app/Completed

# Set proper permissions
chown -R roadworthy:nodejs /app/data /app/uploads /app/Completed

# Initialize database if it doesn't exist
if [ ! -f "/app/data/database.sqlite" ]; then
    echo "Initializing database..."
    # The app will create the database on first run via Drizzle
fi

# Check if we're running as root and switch to roadworthy user
if [ "$(id -u)" = "0" ]; then
    echo "Switching to roadworthy user..."
    exec su-exec roadworthy "$@"
else
    echo "Running as user $(whoami)"
    exec "$@"
fi