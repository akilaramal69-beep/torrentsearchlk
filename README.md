# Torrent Search Engine (Bitmagnet UI)

A clean, fast, and modern web interface for your self-hosted [Bitmagnet](https://bitmagnet.io) instance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🚀 **Fast Search**: Direct client-side connection to Bitmagnet GraphQL API.
- 🎨 **Modern UI**: Clean dark theme with glassmorphism and responsiveness.
- 🐳 **Docker Ready**: Includes simple Docker setup for easy deployment.
- 🧲 **One-Click**: Copy magnet links instantly.
- 🔍 **Filters**: Filter by content type (Video, Audio, Apps, Games).

## 🛠️ Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/akilaramal69-beep/torrentsearchlk.git
   cd torrentsearchlk
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the UI**
   Open [http://localhost:8080](http://localhost:8080) in your browser.

> **Note**: By default, it expects Bitmagnet to be running at `http://localhost:3333`.

### Option 2: Run Locally (Node.js)

1. **Install dependencies** (optional, just for serving)
   ```bash
   npm install -g serve
   ```

2. **Serve the app**
   ```bash
   serve .
   ```

## ⚙️ Configuration

### Changing Bitmagnet URL

By default, the app looks for Bitmagnet at `http://localhost:3333/graphql`.

**To change this:**

1. **Docker**: Edit `docker-compose.yml`:
   ```yaml
   services:
     web:
       environment:
         - BITMAGNET_URL=http://your-server-ip:3333
   ```

2. **Manual**: Edit `main.js` (line 3):
   ```javascript
   const API_URL = 'http://your-custom-ip:3333/graphql';
   ```

## 📚 Guides
- [VPS Deployment Guide](DEPLOYMENT.md) - How to set up on a VPS
- [Domain Setup Guide](DOMAIN_SETUP.md) - How to configure a custom domain and SSL

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
