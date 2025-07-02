# Environment Configuration Guide

This guide covers environment setup for development, staging, and production deployments of the Collaborative Publishing Platform.

## Table of Contents

- [Development Environment](#development-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Configuration](#database-configuration)
- [Security Configuration](#security-configuration)
- [Monitoring Configuration](#monitoring-configuration)

## Development Environment

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tat2
   ```

2. **Copy environment files**
   ```bash
   cp backend/env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. **Start services**
   ```bash
   ./start-all.sh
   ```

### Development Environment Variables

#### Backend (.env)
```env
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/collaborative_publishing
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=collaborative_publishing

# Redis
REDIS_URL=redis://localhost:6380
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (optional for development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

# File Storage (optional for development)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Development Features
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

### Development Commands

```bash
# Backend
cd backend
npm run start:dev          # Start in development mode
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run migration:run      # Run database migrations
npm run migration:generate # Generate new migration

# Frontend
cd frontend
npm run dev                # Start development server
npm run build              # Build for production
npm run test               # Run tests
npm run lint               # Run ESLint
```

## Staging Environment

### Prerequisites
- Kubernetes cluster or cloud platform
- PostgreSQL database
- Redis instance
- Container registry

### Staging Environment Variables

#### Backend (.env)
```env
# Application
NODE_ENV=staging
PORT=3001
FRONTEND_URL=https://staging.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@staging-db:5432/collaborative_publishing

# Redis
REDIS_URL=redis://staging-redis:6379

# JWT
JWT_SECRET=staging-jwt-secret-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=staging-uploads

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api-staging.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://staging.yourdomain.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### Staging Deployment

```bash
# Build and push images
docker build -t your-registry/backend:staging ./backend
docker build -t your-registry/frontend:staging ./frontend
docker push your-registry/backend:staging
docker push your-registry/frontend:staging

# Deploy to Kubernetes
kubectl apply -f k8s/staging/
```

## Production Environment

### Prerequisites
- Production Kubernetes cluster
- Managed PostgreSQL database
- Managed Redis instance
- CDN for static assets
- SSL certificates
- Monitoring and logging infrastructure

### Production Environment Variables

#### Backend (.env)
```env
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@prod-db:5432/collaborative_publishing

# Redis
REDIS_URL=redis://prod-redis:6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=prod-uploads

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Performance
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_PWA=true
```

### Production Deployment

```bash
# Build and push images
docker build -t your-registry/backend:latest ./backend
docker build -t your-registry/frontend:latest ./frontend
docker push your-registry/backend:latest
docker push your-registry/frontend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/production/
```

## Environment Variables Reference

### Backend Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Environment mode | Yes | - | `development` |
| `PORT` | Server port | No | `3001` | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | - | `http://localhost:3000` |
| `DATABASE_URL` | Database connection string | Yes | - | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | Yes | - | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Yes | - | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` | `24h` |
| `SMTP_HOST` | SMTP server host | No | - | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | No | `587` | `587` |
| `SMTP_USER` | SMTP username | No | - | `user@gmail.com` |
| `SMTP_PASS` | SMTP password | No | - | `app-password` |
| `AWS_ACCESS_KEY_ID` | AWS access key | No | - | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No | - | `...` |
| `AWS_REGION` | AWS region | No | `us-east-1` | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | No | - | `uploads-bucket` |
| `SENTRY_DSN` | Sentry DSN | No | - | `https://...` |
| `LOG_LEVEL` | Logging level | No | `info` | `debug` |

### Frontend Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | - | `http://localhost:3001` |
| `NEXT_PUBLIC_SITE_URL` | Site URL for SEO | Yes | - | `https://yourdomain.com` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | No | - | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | No | - | `https://...` |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | No | `false` | `true` |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | Enable mock data | No | `false` | `true` |

## Database Configuration

### PostgreSQL Setup

#### Development
```bash
# Using Docker
docker run -d \
  --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=collaborative_publishing \
  -p 5433:5432 \
  postgres:14
```

#### Production
```sql
-- Create database
CREATE DATABASE collaborative_publishing;

-- Create user
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE collaborative_publishing TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
```

### Redis Setup

#### Development
```bash
# Using Docker
docker run -d \
  --name redis-dev \
  -p 6380:6379 \
  redis:6
```

#### Production
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis
```

## Security Configuration

### JWT Configuration
```typescript
// Generate secure JWT secret
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log(secret);
```

### CORS Configuration
```typescript
// Backend CORS setup
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Rate Limiting
```typescript
// Backend rate limiting
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

### SSL/TLS Configuration
```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring Configuration

### Sentry Setup
```typescript
// Backend Sentry configuration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Logging Configuration
```typescript
// Backend logging
import { Logger } from '@nestjs/common';

const logger = new Logger('AppController');

logger.log('Application started');
logger.error('Error occurred', error.stack);
logger.warn('Warning message');
logger.debug('Debug information');
```

### Health Checks
```typescript
// Backend health check endpoint
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
}
```

### Performance Monitoring
```typescript
// Frontend performance monitoring
import { performanceMonitor } from '@/lib/performance';

// Track Core Web Vitals
performanceMonitor.init();

// Track custom metrics
performanceMonitor.trackMetric('user_action', 150);
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker ps | grep postgres
   
   # Check connection
   psql -h localhost -p 5433 -U postgres -d collaborative_publishing
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker ps | grep redis
   
   # Test Redis connection
   redis-cli -p 6380 ping
   ```

3. **Frontend Build Failed**
   ```bash
   # Clear Next.js cache
   rm -rf frontend/.next
   
   # Reinstall dependencies
   cd frontend && rm -rf node_modules && npm install
   ```

4. **Backend Tests Failed**
   ```bash
   # Check test database
   psql -h localhost -p 5433 -U postgres -d test_db
   
   # Run migrations
   cd backend && npm run migration:run
   ```

### Environment-Specific Issues

#### Development
- Ensure Docker containers are running
- Check port conflicts (5433, 6380, 3001, 3000)
- Verify environment file paths

#### Staging/Production
- Check network connectivity
- Verify SSL certificates
- Monitor resource usage
- Check application logs

### Support

For environment setup issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables: `env | grep -E "(DATABASE|REDIS|JWT)"`
3. Test connectivity: `curl http://localhost:3001/health`
4. Review this documentation
5. Create an issue in the repository

---

This guide should help you set up the Collaborative Publishing Platform in any environment. For additional support, refer to the main README.md or create an issue in the repository. 