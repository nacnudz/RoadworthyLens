# Docker Production Build Fix

## Problem
The Docker production build was failing with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /app/dist/index.js
```

## Root Cause
The production build was bundling Vite development dependencies that are not available in the production Docker container.

## Solution
Created a completely separate production build process:

### 1. Production-Only Server Entry Point
- Created `server/index-production.ts` with no Vite imports
- Contains only production-necessary code for serving static files
- Includes built-in logging without Vite dependencies

### 2. Custom Build Script
- Created `build-production.js` that:
  - Builds frontend with Vite
  - Builds backend from clean production entry point
  - Outputs to `dist/index.js` (expected by Docker)

### 3. Updated Dockerfile
- Modified to use `node build-production.js` instead of `npm run build`
- This ensures clean production builds without development dependencies

## Files Created/Modified
- `server/index-production.ts` - Clean production server entry
- `build-production.js` - Custom build script
- `Dockerfile` - Updated build command
- `server/vite-production.ts` - Production-only utilities (backup)

## Verification
The production build now:
- ✅ Contains no Vite imports
- ✅ Runs successfully in Node.js production environment
- ✅ Serves API endpoints correctly
- ✅ Serves static frontend files
- ✅ Compatible with Docker deployment

## Usage
For local production testing:
```bash
node build-production.js
NODE_ENV=production node dist/index.js
```

For Docker deployment:
```bash
docker build -t roadworthy-app .
docker run -p 5000:5000 roadworthy-app
```