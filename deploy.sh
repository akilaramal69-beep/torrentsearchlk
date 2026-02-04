#!/bin/bash

# Auto-Deployment Script for Torrent Search Engine
# Tested on Ubuntu/Debian

set -e

echo "🚀 Starting deployment..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed."
else
    echo "✅ Docker is already installed."
fi

# 3. Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
     echo "Installing docker-compose..."
     sudo apt-get install -y docker-compose-plugin
fi

# 4. Clone/Pull Repository
if [ -d "torrentsearchlk" ]; then
    echo "🔄 Repository exists. Pulling latest changes..."
    cd torrentsearchlk
    git pull
else
    echo "⬇️ Cloning repository..."
    git clone https://github.com/akilaramal69-beep/torrentsearchlk.git
    cd torrentsearchlk
fi

# 5. Setup Environment
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Please edit the .env file with your domain name!"
    echo "    Run: nano .env"
fi

# 6. Start Application
echo "🚀 Starting containers..."
docker compose up -d --build

echo ""
echo "✅ Deployment complete!"
echo "ℹ️  Edit .env to set your domain, then restart containers."
