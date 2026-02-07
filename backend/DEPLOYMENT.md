# PLC AutoConfig Backend - Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Logging](#monitoring--logging)

## Local Development

### Quick Start
```bash
# 1. Clone and navigate
cd plc-autoconfig/backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment (optional)
cp .env.example .env
# Add ANTHROPIC_API_KEY if you have one

# 5. Start server
python main.py
```

Server runs at: http://localhost:8000

API docs: http://localhost:8000/docs

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+

### Build and Run

#### Using Docker Compose (Recommended)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Build and start
docker-compose up --build

# 3. Stop
docker-compose down
```

#### Using Docker CLI
```bash
# Build image
docker build -t plc-autoconfig-backend:latest .

# Run container
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  -v $(pwd)/uploads:/app/uploads \
  plc-autoconfig-backend:latest

# Or with compose
docker-compose up
```

### Verify Running Container
```bash
# Check if running
docker ps | grep plc-autoconfig-backend

# View logs
docker logs plc-autoconfig-backend

# Enter container shell
docker exec -it plc-autoconfig-backend bash

# Test API
curl http://localhost:8000/health
```

## Production Deployment

### Recommended Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│  Nginx/Proxy    │
│  (Port 443)     │
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│  Backend x N    │
│  (Port 8000)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  PostgreSQL     │
└─────────────────┘
```

### Option 1: Heroku Deployment

#### 1. Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download installer from https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Prepare for Deployment
```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Create app.json
cat > app.json << EOF
{
  "name": "plc-autoconfig-backend",
  "description": "PLC AutoConfig Backend",
  "runtime": "python-3.11",
  "env": {
    "ANTHROPIC_API_KEY": {
      "description": "Anthropic API key for Claude",
      "required": false
    }
  }
}
EOF
```

#### 3. Deploy
```bash
# Login
heroku login

# Create app
heroku create plc-autoconfig-backend

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=sk-ant-xxx

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: AWS Deployment

#### Using EC2
```bash
# 1. Launch EC2 instance (Ubuntu 22.04 LTS)

# 2. SSH into instance
ssh -i key.pem ubuntu@<instance-ip>

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Clone repository
git clone <repo-url>
cd plc-autoconfig/backend

# 5. Start with Docker Compose
docker-compose up -d

# 6. Setup Nginx proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

#### Nginx Configuration
```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 3: DigitalOcean Deployment

```bash
# 1. Create Droplet (Ubuntu 22.04)
# 2. SSH into droplet
# 3. Install Docker (same as AWS above)
# 4. Deploy using Docker Compose
# 5. Point domain to droplet IP
# 6. Setup SSL with Let's Encrypt
```

### Option 4: Google Cloud Run

```bash
# 1. Create Dockerfile (already provided)

# 2. Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/plc-autoconfig

# 3. Deploy to Cloud Run
gcloud run deploy plc-autoconfig \
  --image gcr.io/PROJECT_ID/plc-autoconfig \
  --platform managed \
  --region us-central1 \
  --set-env-vars ANTHROPIC_API_KEY=sk-ant-xxx \
  --memory 512Mi
```

## Environment Configuration

### Required Variables
```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # Optional - use mock mode without it
```

### Optional Variables
```bash
HOST=0.0.0.0                  # Server host
PORT=8000                     # Server port
FRONTEND_URL=http://localhost:5173  # Frontend CORS URL
```

### Setting in Docker Compose
```yaml
environment:
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  - HOST=0.0.0.0
  - PORT=8000
```

### Setting in Production
```bash
# Heroku
heroku config:set KEY=value

# AWS/DigitalOcean
export KEY=value
docker-compose up -d

# Google Cloud Run
gcloud run deploy ... --set-env-vars KEY=value
```

## Database Setup (Production)

### PostgreSQL Integration

#### 1. Install psycopg2
```bash
pip install psycopg2-binary sqlalchemy
```

#### 2. Update in_memory.py to PostgreSQL
```python
# Replace in_memory.py with database models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/plcdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

#### 3. Run migrations
```bash
alembic upgrade head
```

### Connection String Examples
```
PostgreSQL: postgresql://user:password@localhost/dbname
MySQL: mysql://user:password@localhost/dbname
SQLite: sqlite:///./test.db
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d your-domain.com

# Configure Nginx to use certificate
# (Auto-configured by certbot)

# Renew automatically
sudo certbot renew --dry-run
```

### Self-signed Certificate (Development)
```bash
openssl req -x509 -newkey rsa:4096 -nodes \
  -out cert.pem -keyout key.pem -days 365
```

## Monitoring & Logging

### Docker Logs
```bash
# View logs
docker logs plc-autoconfig-backend

# Follow logs
docker logs -f plc-autoconfig-backend

# Last 100 lines
docker logs --tail 100 plc-autoconfig-backend
```

### Application Logging

Add to main.py:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    logger.info("Backend started")
```

### Health Monitoring

```bash
# Check health
curl http://localhost:8000/health

# Setup monitoring with curl in cron
*/5 * * * * curl -f http://localhost:8000/health || \
  systemctl restart plc-autoconfig-backend
```

### Performance Monitoring

Use external services:
- **Datadog**: Full-stack monitoring
- **New Relic**: Application performance
- **Sentry**: Error tracking
- **Prometheus**: Metrics collection

## Scaling Considerations

### Horizontal Scaling
```bash
# Deploy multiple instances behind load balancer
docker run -p 8001:8000 plc-autoconfig-backend
docker run -p 8002:8000 plc-autoconfig-backend
docker run -p 8003:8000 plc-autoconfig-backend

# Use nginx for load balancing
upstream backend {
    server localhost:8001;
    server localhost:8002;
    server localhost:8003;
}
```

### Vertical Scaling
```bash
# Increase container resources
docker run -m 2g -cpus 2 plc-autoconfig-backend
```

### Caching Layer
```bash
# Add Redis for caching
docker run -d -p 6379:6379 redis:latest

# Install redis client
pip install redis
```

### Async Processing
```bash
# Use Celery for long-running tasks
pip install celery
```

## Backup & Recovery

### Data Backup
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/

# Backup database
pg_dump dbname > backup.sql

# Restore
psql dbname < backup.sql
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz uploads/
0 2 * * * pg_dump dbname > /backups/db-$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=9000 python main.py
```

### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Connection Refused
```bash
# Check if service is running
docker ps
curl http://localhost:8000/health

# View logs
docker logs plc-autoconfig-backend
```

### API Timeout
```bash
# Increase timeout in requests
# nginx config
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## Security Checklist

- [ ] Restrict CORS to specific domains
- [ ] Use HTTPS in production
- [ ] Enable authentication (JWT/OAuth)
- [ ] Rate limit API endpoints
- [ ] Validate file uploads
- [ ] Sanitize user inputs
- [ ] Use environment variables for secrets
- [ ] Implement request logging
- [ ] Setup error monitoring (Sentry)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Firewall rules
- [ ] API key rotation

## Performance Optimization

### FastAPI Tuning
```python
# Increase workers
uvicorn main:app --workers 4

# Enable gzip
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Set reasonable limits
app.state.max_upload_size = 100 * 1024 * 1024  # 100MB
```

### Database Optimization
```python
# Add indexes
CREATE INDEX idx_project_status ON projects(status);

# Connection pooling
pool = create_pool(max_overflow=20, pool_size=5)
```

## Maintenance

### Regular Tasks
- Monitor disk space
- Check log files
- Monitor API response times
- Update dependencies monthly
- Review security logs
- Backup databases weekly

### Update Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt --upgrade
```

---

**Last Updated**: 2024
**Maintainer**: Development Team
