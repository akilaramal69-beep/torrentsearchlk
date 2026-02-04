# Torrent Search Engine (Bitmagnet UI)

A clean, fast, and modern web interface for your self-hosted [Bitmagnet](https://bitmagnet.io) instance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🚀 **Fast Search**: Direct client-side connection to Bitmagnet GraphQL API.
- 🎨 **Modern UI**: Clean dark theme with glassmorphism and responsiveness.
- 🔒 **Secure**: Automatic SSL/TLS with Caddy.
- 🐳 **Docker Ready**: One-command deployment.
- 🧲 **One-Click**: Copy magnet links instantly.
- 🔍 **Filters**: Filter by content type (Video, Audio, Apps, Games).

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/akilaramal69-beep/torrentsearchlk.git
cd torrentsearchlk
```

### 2. Configure Environment
Copy the example configuration file:
```bash
cp .env.example .env
```
Edit `.env` to set your domain and backend URL:
```bash
nano .env
```
**Important Settings:**
- `DOMAIN_NAME`: Your domain (e.g., `search.mysite.com`) or `:80` for local/IP usage.
- `BITMAGNET_URL`: The URL where your Bitmagnet instance is running (e.g., `http://my-vps-ip:3333`).

### 3. Run
```bash
docker compose up -d
```
Visit your site at `http://your-domain` (or `https://` if domain is configured).

## ⚙️ Configuration details

The application uses an all-in-one Docker setup.

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN_NAME` | Domain for the application (or :80). | `:80` |
| `POSTGRES_PASSWORD` | Password for the database. | `postgrespassword` |
| `TMDB_API_KEY` | Optional: Key for fetching movie/show metadata. | `` |

### Services
- **Web**: Front-end UI (Port 80/443 via Caddy).
- **Bitmagnet**: Backend API (Port 3333).
- **Postgres**: Database.
- **Redis**: Cache/Queue.


## 📚 Documentation
- [VPS Deployment Guide](DEPLOYMENT.md) - Detailed VPS setup instructions.
- [Domain Setup Guide](DOMAIN_SETUP.md) - How to configure DNS and SSL.

## 🛠️ Local Development (No Docker)
To run just the frontend locally without Docker:
1. Install a static file server: `npm install -g serve`
2. Run: `serve .`
3. Edit `main.js` manually to point to your Bitmagnet instance if needed.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
