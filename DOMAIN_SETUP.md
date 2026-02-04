# 🌐 Domain Setup Guide

This guide explains how to point a custom domain (e.g., `search.yourdomain.com`) to your Torrent Search Engine VPS and secure it with HTTPS (SSL).

## Prerequisites
- A **Domain Name** bought from a registrar (Namecheap, GoDaddy, Cloudflare, etc.).
- A **VPS** with the Torrent Search Engine installed.
- **Nginx Proxy Manager** (Recommended) running on your VPS.

---

## Step 1: Point Your Domain to Your VPS

1. Log in to your Domain Registrar (where you bought your domain).
2. Go to **DNS Management**.
3. Add an **A Record**:
   - **Type**: `A`
   - **Host/Name**: `search` (or `@` for the root domain)
   - **Value/Target**: `YOUR_VPS_IP_ADDRESS` (e.g., `123.45.67.89`)
   - **TTL**: Automatic or 5 min.

> ⏳ **Wait**: It may take a few minutes to a few hours for DNS to propagate.

---

## Step 2: Set Up Nginx Proxy Manager

If you haven't installed Nginx Proxy Manager yet, you can run it with Docker.

1. **Create a folder** for it on your VPS:
   ```bash
   mkdir nginx-proxy
   cd nginx-proxy
   nano docker-compose.yml
   ```

2. **Paste this configuration**:
   ```yaml
   version: '3.8'
   services:
     app:
       image: 'jc21/nginx-proxy-manager:latest'
       restart: unless-stopped
       ports:
         - '80:80'
         - '81:81'
         - '443:443'
       volumes:
         - ./data:/data
         - ./letsencrypt:/etc/letsencrypt
   ```

3. **Start it**:
   ```bash
   docker compose up -d
   ```

4. **Login**: Open `http://YOUR_VPS_IP:81`
   - Default Email: `admin@example.com`
   - Default Password: `changeme`

---

## Step 3: Configure the Proxy Host

Now connect your domain to the search engine.

1. In Nginx Proxy Manager, go to **Hosts** -> **Proxy Hosts**.
2. Click **Add Proxy Host**.
3. **Details Tab**:
   - **Domain Names**: `search.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `host.docker.internal` (preferred) or your VPS IP.
     - *Note*: If `host.docker.internal` doesn't work, verify your Docker version or use the VPS private/public IP.
   - **Forward Port**: `8080` (The port our search engine is running on)
   - **Block Common Exploits**: ✅ Check this.

4. **SSL Tab**:
   - **SSL Certificate**: Select "Request a new SSL Certificate".
   - **Force SSL**: ✅ Check this.
   - **HTTP/2 Support**: ✅ Check this.
   - **Email**: Enter your email address.
   - **Agree to Terms**: ✅ Check this.

5. Click **Save**.

🎉 **Done!** You can now access your site at `https://search.yourdomain.com`.
