#!/bin/bash

# Exit on error
set -e

echo "Configuring auto-start with PM2..."

# 1. Start the application
echo "Starting application..."
pm2 start ecosystem.config.js

# 2. Save the process list
echo "Saving process list..."
pm2 save

# 3. Generate and run startup script
echo "Generating startup script..."
# This command detects the init system and generates the startup command
# We use eval to execute the output of 'pm2 startup' directly
if pm2 startup | grep -q "sudo"; then
    echo "Detected that sudo is needed. Attempting to run startup command..."
    # Capture the command that pm2 startup tells us to run
    STARTUP_CMD=$(pm2 startup | grep "sudo" | tail -n 1)
    echo "Executing: $STARTUP_CMD"
    eval "$STARTUP_CMD"
else
    echo "Running startup command..."
    pm2 startup
fi

echo "Auto-start configured successfully!"
echo "The application will now restart automatically when the container/server reboots."
