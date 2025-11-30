# Authentication Setup

The Notes App now includes username/password authentication with JWT tokens for session management.

## Configuration

### Docker Compose

Set environment variables in `docker-compose.yml` or use a `.env` file:

```yaml
environment:
  - NOTES_USERNAME=admin          # Your username
  - NOTES_PASSWORD=changeme        # Your password
  - NOTES_SECRET_KEY=your-secret  # Secret key for JWT tokens
```

### Environment Variables

- `NOTES_USERNAME`: Username for login (default: `admin`)
- `NOTES_PASSWORD`: Password for login (default: `changeme`)
- `NOTES_SECRET_KEY`: Secret key for JWT token signing (default: `change-this-secret-key-in-production`)

**Important**: Change the default password and secret key in production!

## How It Works

1. **Login**: User enters username/password on login page
2. **Token Generation**: Server validates credentials and returns a JWT token (valid for 30 days)
3. **Token Storage**: Token is stored in browser's localStorage
4. **API Requests**: All API requests include the token in the `Authorization: Bearer <token>` header
5. **Auto-Login**: On app load, if a token exists, it's validated automatically
6. **Session Persistence**: Token persists across browser sessions until it expires

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Tokens expire after 30 days
- **Protected Routes**: All API endpoints require authentication
- **Automatic Logout**: Invalid/expired tokens automatically log the user out

## Usage

1. **First Time**: Access the app, you'll be redirected to `/login`
2. **Login**: Enter username and password (from environment variables)
3. **Access**: After login, you'll have access to all notes
4. **Logout**: Click "Logout" button in the sidebar
5. **Auto-Login**: On subsequent visits, if token is valid, you're automatically logged in

## API Endpoints

### Public Endpoints
- `POST /api/auth/login` - Login and get token
- `GET /` - API health check

### Protected Endpoints (require authentication)
- All `/api/notes/*` endpoints
- All `/api/sync/*` endpoints
- `GET /api/auth/me` - Get current user info

## Troubleshooting

### "Unauthorized" errors
- Check that you're logged in
- Verify token is stored in localStorage
- Check that token hasn't expired
- Re-login if token is invalid

### Can't login
- Verify `NOTES_USERNAME` and `NOTES_PASSWORD` are set correctly
- Check server logs for authentication errors
- Ensure password matches what's in environment variables

### Token expired
- Tokens expire after 30 days
- Simply log in again to get a new token

