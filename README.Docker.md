# Docker Setup for WhatPad

This project uses Docker and Docker Compose to run the full stack application (MySQL, Node.js Backend, React Frontend).

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd /path/to/whatpad
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file if you need to change default values.

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Create and start MySQL database container
   - Automatically run the database initialization script (`backend/database/createdb.sql`)
   - Create and start the backend API container
   - Create and start the frontend React container

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f mysql
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Documentation: http://localhost:4000/docs
   - MySQL: localhost:3306

## Available Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop services and remove volumes (⚠️ This will delete all data)
```bash
docker-compose down -v
```

### Restart services
```bash
docker-compose restart
```

### Rebuild and start (after code changes to Dockerfile)
```bash
docker-compose up -d --build
```

### Execute commands in containers
```bash
# Access backend container shell
docker-compose exec backend sh

# Access MySQL shell
docker-compose exec mysql mysql -u sa -p123 wattpad

# Run migrations
docker-compose exec backend npm run migrate:tags
```

### View container status
```bash
docker-compose ps
```

## Project Structure

```
whatpad/
├── docker-compose.yml          # Docker Compose configuration
├── .env.example               # Environment variables template
├── backend/
│   ├── Dockerfile            # Backend Docker image
│   ├── .dockerignore        # Backend Docker ignore file
│   ├── database/
│   │   └── createdb.sql     # Database initialization script
│   └── ...
└── frontend/
    ├── Dockerfile           # Frontend Docker image
    ├── .dockerignore       # Frontend Docker ignore file
    └── ...
```

## Environment Variables

Key environment variables (defined in `.env`):

- `DB_ROOT_PASSWORD`: MySQL root password
- `DB_NAME`: Database name (default: wattpad)
- `DB_USER`: Database user (default: sa)
- `DB_PASSWORD`: Database password (default: 123)
- `DB_PORT`: MySQL port (default: 3306)
- `BACKEND_PORT`: Backend API port (default: 4000)
- `FRONTEND_PORT`: Frontend port (default: 3000)
- `JWT_SECRET`: Secret key for JWT tokens
- `REACT_APP_API_URL`: Backend API URL for frontend

## Database Initialization

The MySQL database is automatically initialized with the schema defined in `backend/database/createdb.sql` when the container is first created. The script will:

1. Drop and recreate the `wattpad` database
2. Create all necessary tables (users, stories, chapters, etc.)
3. Set up relationships and indexes

## Development Workflow

### Hot Reloading

Both backend and frontend support hot reloading:
- Backend uses `nodemon` to watch for file changes
- Frontend uses React's built-in development server

### Making Changes

1. Edit your code in `backend/` or `frontend/` directories
2. Changes will be automatically reflected in the running containers
3. No need to restart containers for code changes

### Database Changes

If you need to reset the database:
```bash
# Stop containers and remove volumes
docker-compose down -v

# Start again (will reinitialize database)
docker-compose up -d
```

## Troubleshooting

### Port Already in Use
If ports 3000, 4000, or 3306 are already in use, modify the ports in `.env`:
```bash
FRONTEND_PORT=3001
BACKEND_PORT=4001
DB_PORT=3307
```

### Database Connection Issues
1. Check if MySQL container is healthy:
   ```bash
   docker-compose ps
   ```

2. View MySQL logs:
   ```bash
   docker-compose logs mysql
   ```

3. Wait for MySQL to fully start (may take 10-30 seconds on first run)

### Container Not Starting
1. Check logs:
   ```bash
   docker-compose logs [service-name]
   ```

2. Rebuild containers:
   ```bash
   docker-compose up -d --build
   ```

### Clear Everything and Start Fresh
```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. Update environment variables in `.env` with secure values
2. Change `JWT_SECRET` to a strong random string
3. Update database passwords
4. Consider using production-ready images:
   - Build optimized frontend: `npm run build`
   - Use nginx to serve frontend static files
   - Use PM2 or similar for backend process management

## Notes

- The MySQL data is persisted in a Docker volume named `mysql_data`
- Node modules are mounted as volumes to improve performance
- All services communicate through the `whatpad-network` bridge network
