# Roadworthy Inspection App

## Overview

This is a full-stack web application for conducting roadworthy vehicle inspections. The system allows users to create, manage, and complete vehicle inspections with photo documentation for various vehicle components. It's built as a modern PWA with offline capabilities and camera integration for mobile use.

## User Preferences

Preferred communication style: Simple, everyday language.

Navigation flow: New inspections automatically set to "in-progress" status with no manual status selection required.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **File Handling**: Multer for photo uploads
- **Development**: Hot reloading with Vite middleware integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations
- **Local Storage**: Browser localStorage for offline capabilities
- **File Storage**: Local filesystem for uploaded photos

## Key Components

### Database Schema
The application uses two main tables:
- **Inspections**: Stores inspection records with roadworthy numbers, client info, vehicle descriptions, status, checklist items (JSON), photos (JSON), and timestamps
- **Settings**: Stores configurable checklist item requirements (required/optional/hidden)

### Authentication & Authorization
Currently no authentication system is implemented - the app operates as a single-user application.

### API Structure
RESTful endpoints under `/api/`:
- `GET /api/inspections` - List all inspections
- `GET /api/inspections/in-progress` - List in-progress inspections
- `GET /api/inspections/completed` - List completed inspections
- `POST /api/inspections` - Create new inspection
- `POST /api/inspections/:id/photos` - Upload photos for inspection
- `POST /api/inspections/:id/complete` - Complete inspection
- `GET /api/settings` - Get application settings
- `PATCH /api/settings` - Update settings

### Core Features
1. **Dashboard**: Overview of inspections with progress tracking
2. **New Inspection**: Form to create inspections with client/vehicle details
3. **Inspection Checklist**: Interactive checklist with photo capture for each item
4. **Camera Interface**: Native camera integration for photo capture
5. **Settings**: Configure which checklist items are required/optional
6. **Mobile-First Design**: Bottom navigation and touch-optimized interface

### Checklist Items
Predefined inspection points: VIN, Under Vehicle, Vehicle on Hoist, Engine Bay, Compliance Plate, Front of Vehicle, Rear of Vehicle, Head Light Aimer

## Data Flow

1. **Inspection Creation**: User creates new inspection → stored in database with initial empty checklist
2. **Photo Capture**: Camera interface captures photos → uploads to server → associates with inspection and checklist item
3. **Progress Tracking**: Checklist completion tracked in real-time → updates inspection status
4. **Completion**: When all required items completed → inspection can be marked as pass/fail

## Recent Updates (January 2025)

### Photo Gallery Implementation
- Created simplified photo gallery component for viewing inspection item photos
- Full-screen modal with clean interface focused on photo viewing
- Clickable thumbnail strip for quick photo selection when multiple photos exist
- Delete photo capability (ready for future implementation)
- Enhanced user experience with photo count badges
- Integrated with existing inspection checklist view photos button
- Simplified interface with navigation arrows, download button, and transitions removed per user request
- Resized checklist buttons: take photo (25% width, smaller), view photos (25% width, larger)

### Loading Animations Enhancement
- Comprehensive loading states implemented across all user interactions
- Skeleton loading components for dashboard inspection cards during data fetching
- Loading spinners with animated icons for form submissions and API calls
- Smooth transition animations including hover effects and button scaling
- Enhanced user feedback with disabled states during async operations
- Improved perceived performance through progressive loading indicators

### UI/UX Improvements
- Centered logo and app name "Road Worthy Lens" in blue title bar
- Removed settings button from header for cleaner interface
- Enhanced completion dialog with color-coded buttons (green/red/dark grey)
- Improved camera functionality with better error handling and permissions
- Alphabetically sorted checklist with required items prioritized
- Removed optional/required labels from completed inspections for cleaner view

## External Dependencies

### Production Dependencies
- **Database**: `@neondatabase/serverless` for Neon database connection
- **ORM**: `drizzle-orm` and `drizzle-zod` for database operations and validation
- **UI Components**: Extensive Radix UI component library
- **Forms**: `react-hook-form` with `@hookform/resolvers`
- **HTTP Client**: TanStack Query for API communication
- **File Upload**: `multer` for handling photo uploads
- **Sessions**: `connect-pg-simple` for PostgreSQL session storage
- **Utilities**: `date-fns`, `clsx`, `class-variance-authority`

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full TypeScript setup with strict mode
- **Development**: `tsx` for running TypeScript directly
- **Replit Integration**: Replit-specific plugins for development environment

## Deployment Strategy

### Development
- Uses Vite dev server with Express middleware integration
- Hot module replacement for frontend development
- TypeScript compilation on-the-fly with `tsx`
- Replit-specific development banner and cartographer integration

### Production Build
1. Frontend built with Vite to `dist/public`
2. Backend bundled with esbuild to `dist/index.js`
3. Serves static files from built frontend
4. Single production server handles both API and static content

### Database Management
- Uses Drizzle Kit for schema migrations
- Connection via DATABASE_URL environment variable
- Automatic UUID generation for primary keys
- JSONB fields for flexible checklist and photo storage

### Environment Requirements
- `DATABASE_URL` for PostgreSQL connection
- `NODE_ENV` for environment detection
- Upload directory created automatically at runtime
- Session storage configured for PostgreSQL