# Using with Dockge

Dockge is a Docker Compose management UI that can clone and manage repositories directly.

## Setup in Dockge

1. **In Dockge UI, create a new stack:**
   - **Name**: `simple-notes-app` (or any name you prefer)
   - **Git Repository URL**: `https://github.com/StephenArg/simple-notes-app.git`
   - **Branch**: `main` (or your default branch)
   - **Compose File Path**: `compose.yaml` (or `docker-compose.yml` - both work)

2. **Dockge will automatically:**
   - Clone the repository
   - Navigate to the directory
   - Use the `docker-compose.yml` file

3. **Start the stack:**
   - Click "Start" in Dockge
   - The compose file will build and start both services

## Important Notes

- The `docker-compose.yml` uses relative paths (`./server`, `./client`), which works perfectly when Dockge clones the repo
- Dockge will clone the repo to its stacks directory (typically `/opt/stacks/your-stack-name/`)
- The relative paths in the compose file will resolve correctly from the cloned repository root

## Access

Once started:
- **Application**: http://your-server-ip:3000
- **API Docs**: http://your-server-ip:3000/docs

## Updating

To update the stack:
1. In Dockge, click "Update" on your stack
2. Dockge will pull the latest changes from git
3. Rebuild and restart if needed

## Troubleshooting

### "path not found" or "unable to prepare context" errors

If you see errors like:
```
unable to prepare context: path "/opt/stacks/simple-notes/server" not found
```

**Solution:**

1. **Verify the repository structure:**
   - In Dockge, click on your stack
   - Check the file browser to ensure both `client/` and `server/` directories exist
   - Verify `compose.yaml` (or `docker-compose.yml`) is in the root

2. **Check compose file path in Dockge:**
   - Go to stack settings
   - Make sure "Compose File Path" is set to `compose.yaml` (or `docker-compose.yml`)
   - The path should be relative to the repository root

3. **Re-clone the repository:**
   - In Dockge, click "Update" on your stack
   - This will pull the latest changes and re-clone if needed
   - Or delete and recreate the stack

4. **Verify Git repository URL:**
   - Make sure you're using: `https://github.com/StephenArg/simple-notes-app.git`
   - Check that the branch is `main`

5. **Manual verification (SSH into server):**
   ```bash
   # Check if directories exist
   ls -la /opt/stacks/simple-notes/
   # Should show: client/, server/, compose.yaml, README.md, etc.
   
   # If missing, the repo might not have cloned correctly
   cd /opt/stacks/simple-notes
   git status
   ```

### Other common issues

- **"version is obsolete" warning**: This is just a warning, not an error. The `compose.yaml` file doesn't include the version field.
- **Build fails**: Make sure Docker has enough resources and internet access to pull base images

## Alternative: Manual Clone

If you prefer to clone manually first:

```bash
cd /opt/stacks
git clone https://github.com/StephenArg/simple-notes-app.git simple-notes-app
cd simple-notes-app
# Then point Dockge to this directory
```

But using Dockge's built-in git integration is recommended as it handles updates automatically.

