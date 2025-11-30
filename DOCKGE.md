# Using with Dockge

Dockge is a Docker Compose management UI that can clone and manage repositories directly.

## Setup in Dockge

1. **In Dockge UI, create a new stack:**
   - **Name**: `simple-notes-app` (or any name you prefer)
   - **Git Repository URL**: `https://github.com/StephenArg/simple-notes-app.git`
   - **Branch**: `main` (or your default branch)
   - **Compose File Path**: `docker-compose.yml`

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

If you see path errors:
- Make sure the `docker-compose.yml` file is in the repository root
- Verify that both `client/` and `server/` directories exist in the cloned repo
- Check that Dockge cloned the entire repository (not just a subdirectory)

## Alternative: Manual Clone

If you prefer to clone manually first:

```bash
cd /opt/stacks
git clone https://github.com/StephenArg/simple-notes-app.git simple-notes-app
cd simple-notes-app
# Then point Dockge to this directory
```

But using Dockge's built-in git integration is recommended as it handles updates automatically.

