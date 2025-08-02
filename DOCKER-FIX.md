# Docker Production Build Fix

## Problems
1. **Vite Import Error**: Docker production build was failing with:
   ```
   Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /app/dist/index.js
   ```

2. **Database Schema Error**: Fresh Docker containers failed with:
   ```
   SqliteError: no such table: settings
   ```

## Root Causes
1. The production build was bundling Vite development dependencies not available in production containers
2. The database migration system expected existing tables but didn't create initial schema for fresh deployments

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

### 4. Fixed Database Schema Creation
- Updated `server/database.ts` with `initializeDatabase()` function
- Creates all required tables using `CREATE TABLE IF NOT EXISTS`
- Ensures fresh Docker containers have proper database schema
- Maintains backward compatibility with existing databases

## Files Created/Modified
- `server/index-production.ts` - Clean production server entry
- `build-production.js` - Custom build script
- `Dockerfile` - Updated build command
- `server/database.ts` - Added schema initialization
- `DOCKER-FIX.md` - Complete documentation

## Verification
The production build now:
- ✅ Contains no Vite imports
- ✅ Runs successfully in Node.js production environment
- ✅ Creates database schema automatically in fresh containers
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