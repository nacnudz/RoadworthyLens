# Roadworthy Inspection App - Docker Deployment

This document explains how to deploy the Roadworthy Inspection App using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Basic deployment:**
   ```bash
   docker-compose up -d
   ```

2. **With nginx reverse proxy (production):**
   ```bash
   docker-compose --profile production up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f roadworthy-app
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t roadworthy-inspection .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name roadworthy-app \
     -p 5000:5000 \
     -v roadworthy_data:/app/data \
     -v roadworthy_uploads:/app/uploads \
     -v roadworthy_completed:/app/Completed \
     roadworthy-inspection
   ```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Application port (default: 5000)
- `DATABASE_URL`: SQLite database path (default: `file:./data/database.sqlite`)

### Volumes

The application uses three persistent volumes:

- **`roadworthy_data`**: SQLite database storage
- **`roadworthy_uploads`**: Temporary photo uploads
- **`roadworthy_completed`**: Completed inspection backups

### Port Mapping

- **5000**: Application port
- **80**: HTTP (when using nginx)
- **443**: HTTPS (when using nginx with SSL)

## Production Deployment

### With nginx reverse proxy

1. **Configure SSL (optional):**
   - Place SSL certificates in `./ssl/` directory
   - Uncomment SSL configuration in `nginx.conf`

2. **Deploy with production profile:**
   ```bash
   docker-compose --profile production up -d
   ```

### Security Considerations

1. **Network security:**
   - Use nginx reverse proxy for production
   - Configure SSL/TLS certificates
   - Enable rate limiting (configured in nginx.conf)

2. **Data persistence:**
   - Database and uploads are stored in Docker volumes
   - Regular backups recommended for production

3. **Resource limits:**
   - Consider adding memory and CPU limits in docker-compose.yml
   - Monitor disk space for uploads and database

## Maintenance

### Backup Data

```bash
# Backup database
docker cp roadworthy-inspection:/app/data/database.sqlite ./backup/

# Backup completed inspections
docker run --rm -v roadworthy_completed:/source -v $(pwd)/backup:/backup alpine tar czf /backup/completed-inspections.tar.gz -C /source .
```

### Update Application

```bash
# Pull latest changes and rebuild
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Health Monitoring

The application includes health checks:

```bash
# Check container health
docker ps
docker-compose ps

# View health check logs
docker inspect roadworthy-inspection | grep Health -A 10
```

## Troubleshooting

### Common Issues

1. **Permission errors:**
   ```bash
   # Fix volume permissions
   docker-compose exec roadworthy-app chown -R roadworthy:nodejs /app/data /app/uploads /app/Completed
   ```

2. **Database connection issues:**
   ```bash
   # Check database file exists and is writable
   docker-compose exec roadworthy-app ls -la /app/data/
   ```

3. **Photo upload failures:**
   ```bash
   # Check uploads directory permissions
   docker-compose exec roadworthy-app ls -la /app/uploads/
   ```

### Logs

```bash
# Application logs
docker-compose logs -f roadworthy-app

# nginx logs (if using)
docker-compose logs -f nginx

# Follow all logs
docker-compose logs -f
```

## Development

### Development with Docker

```bash
# Build development image
docker build -t roadworthy-dev --target builder .

# Run development container with hot reload
docker run -it --rm \
  -p 5000:5000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  roadworthy-dev \
  npm run dev
```

## Resource Requirements

### Minimum Requirements
- **CPU**: 1 core
- **Memory**: 512MB RAM
- **Storage**: 2GB (plus space for uploads and database)

### Recommended for Production
- **CPU**: 2+ cores
- **Memory**: 1GB+ RAM
- **Storage**: 10GB+ (depends on usage)
- **Network**: Stable internet connection for photo uploads

## Support

For issues related to Docker deployment, check:

1. Docker and Docker Compose versions are up to date
2. Sufficient disk space for volumes
3. Port 5000 (and 80/443 if using nginx) are available
4. Firewall allows traffic on required ports

For application-specific issues, refer to the main project documentation.