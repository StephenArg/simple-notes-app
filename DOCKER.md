# Docker Setup Guide

This guide explains how to run the Notes App using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd notes-app
   ```

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Application: http://localhost:3000 (serves both frontend and API)
   - API Documentation: http://localhost:3000/docs
   - API Endpoint: http://localhost:3000/api

**Note**: Everything runs through a single port (3000). The server is only accessible internally via the Docker network. This setup is ideal for running behind a reverse proxy.

## Docker Compose Services

### Server Service
- **Image**: Built from `server/Dockerfile`
- **Port**: 8000 (internal only, not exposed to host)
- **Volume**: `./server/notes` → `/app/notes` (persists notes on host)
- **Healthcheck**: Checks `/` endpoint every 30 seconds
- **Access**: Only accessible via Docker network, proxied through client

### Client Service
- **Image**: Built from `client/Dockerfile` (multi-stage build)
- **Port**: 80 (mapped to host port 3000)
- **Depends on**: Server service
- **Healthcheck**: Checks root endpoint every 30 seconds
- **Proxy**: Nginx proxies `/api/*` and `/docs` to server service

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
```

### Stop Services
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build server
docker-compose up -d --build client
```

### View Running Containers
```bash
docker-compose ps
```

### Execute Commands in Containers
```bash
# Server container
docker-compose exec server bash

# Client container
docker-compose exec client sh
```

## Data Persistence

Notes are stored in `./server/notes/` on your host machine. This directory is mounted as a volume, so your notes persist even when containers are stopped or removed.

**Important**: The `notes/` directory is created automatically. Make sure it has proper permissions if you encounter issues.

## Environment Variables

You can customize the setup using environment variables in `docker-compose.yml`:

- `VITE_API_BASE`: API base URL for the client (default: `/api`)
- `PYTHONUNBUFFERED`: Python output buffering (set to `1` for real-time logs)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, modify the port mapping in `docker-compose.yml`:

```yaml
client:
  ports:
    - "3001:80"  # Change 3000 to 3001
```

Note: The server port (8000) is not exposed to the host - it's only accessible internally. All API requests go through the client container on port 3000.

### Permission Issues

If you encounter permission issues with the notes directory:

```bash
# Linux/Mac
chmod -R 755 server/notes

# Or run as specific user (add to docker-compose.yml)
user: "1000:1000"
```

### Rebuild from Scratch

If you need to rebuild everything from scratch:

```bash
docker-compose down -v  # Remove volumes
docker-compose build --no-cache
docker-compose up -d
```

### Check Service Health

```bash
# Check health status
docker-compose ps

# Check application (includes API)
curl http://localhost:3000/

# Check API endpoint
curl http://localhost:3000/api/

# Check API docs
curl http://localhost:3000/docs
```

Note: The server is not directly accessible from the host. All requests go through the client container on port 3000.

## Production Deployment

For production, consider:

1. **Environment Variables**: Use `.env` file or Docker secrets
2. **Reverse Proxy**: The single-port setup makes it easy to add nginx/traefik/caddy in front
   - Forward all traffic to `http://localhost:3000` (or the container)
   - Configure SSL/TLS at the reverse proxy level
3. **SSL/TLS**: Configure HTTPS at the reverse proxy
4. **Backup**: Regular backups of `server/notes/` directory
5. **Resource Limits**: Add resource constraints in `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
  client:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name notes.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Or with SSL (using Let's Encrypt):

```nginx
server {
    listen 443 ssl http2;
    server_name notes.example.com;
    
    ssl_certificate /etc/letsencrypt/live/notes.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notes.example.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Development with Docker

For development, you can mount source code as volumes for hot-reload:

```yaml
# Add to docker-compose.yml for development
volumes:
  - ./server:/app
  - ./client/src:/app/src  # For client hot-reload
```

However, for production builds, the current setup builds the client statically and serves it via nginx, which is more efficient.

