# ☁️ VPS Deployment Guide

This guide describes how to deploy the Torrent Search Engine to a Virtual Private Server (VPS) like DigitalOcean, Linode, AWS, or Vultr.

## Prerequisites

- A VPS running **Ubuntu 20.04+** or Debian 11+.
- **Root** or `sudo` access via SSH.
- (Optional) A domain name pointing to your VPS IP.

---

## 🚀 method 1: One-Click Script (Easiest)

Run this single command on your VPS to install Docker and start the app:

```bash
curl -sL https://raw.githubusercontent.com/akilaramal69-beep/torrentsearchlk/main/deploy.sh | bash
```

The app will be available at `http://YOUR_VPS_IP:8080`.

---

## 🛠️ Method 2: Manual Installation

1. **SSH into your VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

3. **Clone the Repo**:
   ```bash
   git clone https://github.com/akilaramal69-beep/torrentsearchlk.git
   cd torrentsearchlk
   ```

4. **Start the App**:
   ```bash
   docker compose up -d
   ```

---

## 🌐 Custom Domain & HTTPS

To use a domain (e.g., `search.yourdomain.com`) with HTTPS, I recommend using **Nginx Proxy Manager** or **Traefik**.

### Using Nginx Proxy Manager (Easy)

1. Install Nginx Proxy Manager via Docker.
2. Login to its admin UI (port 81).
3. Create a **Proxy Host**:
   - **Domain Names**: `search.yourdomain.com`
   - **Forward Hostname / IP**: `host.docker.internal` (or your VPS IP)
   - **Forward Port**: `8080`
   - **SSL**: Request a new Let's Encrypt certificate.

---

## 🔄 How to Update

To update the app when you push new code to GitHub:

```bash
cd torrentsearchlk
git pull
docker compose up -d --build
```
