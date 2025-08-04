# Roadworthy Lens - Synology Package

This directory contains the files needed to create a Synology NAS package (.spk) for the Roadworthy Lens vehicle inspection application.

## Package Contents

- **INFO**: Package metadata and configuration
- **scripts/**: Installation and service management scripts
  - `start-stop-status`: Main service control script
  - `preinst`: Pre-installation checks
  - `postinst`: Post-installation setup
  - `preuninst`: Pre-uninstallation cleanup
  - `postuninst`: Post-uninstallation cleanup
- **ui/config**: Web interface configuration for DSM
- **PACKAGE_ICON.PNG**: Package icon (72x72) - *needs to be added*
- **PACKAGE_ICON_256.PNG**: Large package icon (256x256) - *needs to be added*

## Building the Package

1. **Prerequisites**:
   - Linux/macOS environment with bash
   - Node.js and npm installed
   - tar command available

2. **Add Package Icons**:
   ```bash
   # Add your custom icons to the synology directory
   cp your-icon-72x72.png synology/PACKAGE_ICON.PNG
   cp your-icon-256x256.png synology/PACKAGE_ICON_256.PNG
   ```

3. **Build the Package**:
   ```bash
   chmod +x build-synology-package.sh
   ./build-synology-package.sh
   ```

4. **Output**:
   - Package will be created as `synology-build/RoadworthyLens-1.0.0.spk`

## Installation on Synology NAS

### Prerequisites
1. **Install Node.js** via Package Center:
   - Open Package Center
   - Search for "Node.js"
   - Install Node.js v16 or later

### Install Roadworthy Lens
1. **Upload Package**:
   - Go to Package Center
   - Click "Manual Install"
   - Select the `.spk` file
   - Follow installation wizard

2. **Access Application**:
   - Open browser and go to `http://[NAS-IP]:3333`
   - Or use the shortcut in DSM Main Menu

## Configuration

### Default Settings
- **Port**: 3333
- **Database**: SQLite stored in `/var/packages/RoadworthyLens/target/data/`
- **Uploads**: Stored in `/var/packages/RoadworthyLens/target/uploads/`
- **Completed Inspections**: Backed up to `/var/packages/RoadworthyLens/target/Completed/`
- **Service User**: `roadworthylens`

### Service Management
```bash
# Start service
/usr/local/bin/roadworthylens start

# Stop service
/usr/local/bin/roadworthylens stop

# Check status
/usr/local/bin/roadworthylens status

# View logs
tail -f /var/packages/RoadworthyLens/target/logs/app.log
```

### Port Configuration
To change the default port (3333), edit the start-stop-status script:
```bash
# Edit the PORT environment variable
export PORT=8080  # Change to your preferred port
```

## Data Backup

Important directories to backup:
- `/var/packages/RoadworthyLens/target/data/` - Database
- `/var/packages/RoadworthyLens/target/Completed/` - Completed inspection backups

## Troubleshooting

### Common Issues

1. **"Node.js not found" error**:
   - Install Node.js via Package Center first
   - Ensure Node.js v16+ is installed

2. **Permission errors**:
   - Check that the `roadworthylens` user has proper permissions
   - Verify directory ownership: `chown -R roadworthylens:roadworthylens /var/packages/RoadworthyLens/target/`

3. **Service won't start**:
   - Check logs: `tail -f /var/packages/RoadworthyLens/target/logs/app.log`
   - Verify port 3333 is not in use: `netstat -tulpn | grep 3333`

4. **Database issues**:
   - Check database file permissions in `/var/packages/RoadworthyLens/target/data/`
   - Ensure SQLite database is not corrupted

### Support
For technical support, check the application logs and ensure all prerequisites are met. The application includes comprehensive error handling and logging for troubleshooting.

## Security Notes

- The application runs under a dedicated `roadworthylens` user account
- Database and upload directories have restricted permissions
- Default installation allows local network access only
- For external access, configure your Synology firewall and reverse proxy settings appropriately