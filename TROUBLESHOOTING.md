# Troubleshooting Guide

## Common Issues and Solutions

### 1. Blank UI or "navigator is undefined" Error

**Solution**: This has been fixed in the latest code. Make sure you've pulled the latest changes and rebuilt:
```bash
docker-compose build --no-cache client
docker-compose up -d
```

### 2. API Requests Failing (404, CORS, or Connection Errors)

#### Check if services are running:
```bash
docker-compose ps
# Both client and server should show "Up"
```

#### Check service logs:
```bash
# Client logs
docker-compose logs client

# Server logs
docker-compose logs server
```

#### Test API directly:
```bash
# From host machine
curl http://localhost:8089/api/

# Should return: {"message":"Notes App API"}
```

#### Test from inside client container:
```bash
docker-compose exec client wget -O- http://server:8000/api/
```

### 3. Reverse Proxy Issues

If you're using a reverse proxy (nginx, traefik, caddy, etc.) in front:

1. **Make sure the reverse proxy forwards to the correct port:**
   - Docker container exposes port 80 internally
   - Your compose file maps it to 8089:80
   - Reverse proxy should forward to `http://localhost:8089` (or your server IP)

2. **Check reverse proxy configuration:**
   ```nginx
   # Example nginx reverse proxy config
   location / {
       proxy_pass http://localhost:8089;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. **CORS issues**: The server allows all origins (`allow_origins=["*"]`), so CORS shouldn't be an issue unless your reverse proxy is modifying headers.

### 4. Network Connectivity Between Containers

#### Test if client can reach server:
```bash
docker-compose exec client ping server
# Should work - containers are on the same Docker network
```

#### Test API from client container:
```bash
docker-compose exec client wget -O- http://server:8000/api/
```

### 5. Build Issues

#### Clear everything and rebuild:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### Check if package-lock.json exists:
```bash
ls -la client/package-lock.json
# Should exist - if not, run: cd client && npm install
```

### 6. Port Conflicts

If port 8089 is already in use:
```yaml
# In compose.yaml, change:
ports:
  - "8089:80"  # Change 8089 to another port
```

### 7. Browser Console Errors

Open browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if API requests are being made and their status codes
- **Application tab**: Check if IndexedDB is working (for offline storage)

### 8. Service Worker Issues

If PWA/service worker is causing issues:
- Clear browser cache
- Unregister service worker in DevTools > Application > Service Workers
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 9. Debugging Steps

1. **Verify containers are running:**
   ```bash
   docker-compose ps
   ```

2. **Check container logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Test API endpoint:**
   ```bash
   curl http://localhost:8089/api/
   curl http://localhost:8089/api/notes
   ```

4. **Check nginx configuration inside client container:**
   ```bash
   docker-compose exec client cat /etc/nginx/conf.d/default.conf
   ```

5. **Test nginx is serving files:**
   ```bash
   curl http://localhost:8089/
   # Should return the Vue app HTML
   ```

### 10. Common Error Messages

#### "unable to prepare context: path not found"
- Make sure you're running docker-compose from the project root
- Verify `client/` and `server/` directories exist

#### "npm ci" errors
- Make sure `client/package-lock.json` exists and is committed to git

#### "Connection refused" or "Network error"
- Check if server container is running: `docker-compose ps`
- Check server logs: `docker-compose logs server`
- Verify network: `docker network ls` and check `notes-app-network` exists

#### CORS errors in browser
- Server already allows all origins, but check browser console for specific error
- Verify the request is actually reaching the server (check server logs)

### Getting Help

If issues persist:
1. Collect logs: `docker-compose logs > logs.txt`
2. Check container status: `docker-compose ps`
3. Test network: `docker-compose exec client ping server`
4. Verify file structure matches repository

