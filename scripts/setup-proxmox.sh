#!/bin/bash

# Exit on error
set -e

echo "Starting 1fichier Downloader Setup..."

# 1. Install Node.js (if not present)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

# 2. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

# 3. Install Dependencies
echo "Installing project dependencies..."
npm install

# 4. Build Next.js App
echo "Building Next.js application..."
npm run build

# 5. Setup Database
echo "Setting up database..."
npx drizzle-kit push

echo "Setup complete!"
echo "To start the application, run: pm2 start ecosystem.config.js"
echo "To make it start on boot, run: pm2 save && pm2 startup"
