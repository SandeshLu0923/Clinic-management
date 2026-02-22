# Deployment & System Design Document - Clinic Management System

## 1. Deployment Architecture Overview

The Clinic Management System is designed with a multi-tier deployment architecture supporting development, staging, and production environments.

### 1.1 Deployment Environments

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Development    │     │     Staging      │     │    Production    │
│   Environment    │     │   Environment    │     │   Environment    │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ Local Machine    │     │ Heroku/Railway   │     │ AWS/Heroku       │
│ MongoDB Local    │     │ MongoDB Atlas    │     │ MongoDB Atlas    │
│ Port: 5000/5176 │     │ Staging Domain   │     │ Custom Domain    │
│ Load: 1-5 users │     │ Load: 10-50 users│     │ Load: 100+ users │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 2. Backend Deployment

### 2.1 Local Development Setup

**Prerequisites**:
- Node.js v16+ 
- MongoDB Community Edition or MongoDB Atlas
- npm or yarn

**Installation Steps**:

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add required environment variables
# DATABASE_URL=mongodb://localhost:27017/clinic
# JWT_SECRET=your_jwt_secret_key
# NODE_ENV=development
# PORT=5000

# Start development server with nodemon
npm run dev
```

**Local MongoDB Setup**:
```bash
# Windows - Start MongoDB service
net start MongoDB

# macOS - Start MongoDB
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Verify MongoDB is running
mongo --version
```

### 2.2 Staging Deployment (Heroku)

**Prerequisites**:
- Heroku CLI installed
- Heroku account
- Git version control

**Deployment Steps**:

```bash
# Login to Heroku
heroku login

# Create new Heroku app
heroku create clinic-management-staging

# Add MongoDB Atlas connection
heroku config:set DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/clinic

# Set environment variables
heroku config:set JWT_SECRET=your_staging_jwt_secret
heroku config:set NODE_ENV=staging
heroku config:set TWILIO_ACCOUNT_SID=your_twilio_sid
heroku config:set TWILIO_AUTH_TOKEN=your_twilio_token

# Deploy from git
git push heroku main

# View logs
heroku logs --tail

# Scale dynos if needed
heroku ps:scale web=2
```

**Procfile** (in backend root):
```
web: node server.js
```

### 2.3 Production Deployment (AWS EC2 / DigitalOcean)

**Recommended Infrastructure**:
- AWS EC2: t3.medium instance (2 vCPU, 4GB RAM)
- Ubuntu 20.04 LTS
- Nginx as reverse proxy
- PM2 for process management

**Deployment Steps**:

```bash
# 1. SSH into server
ssh -i your-key.pem ubuntu@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Clone repository
git clone https://github.com/SandeshLu0923/clinic-management.git
cd clinic-management/backend

# 5. Install dependencies
npm install --production

# 6. Create .env file with production variables
nano .env

# 7. Start application with PM2
pm2 start server.js --name "clinic-api"
pm2 save
pm2 startup

# 8. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/clinic

# Nginx Configuration:
# upstream clinic_backend {
#   server localhost:5000;
# }
#
# server {
#   listen 80;
#   server_name api.clinicmanagement.com;
#
#   location / {
#     proxy_pass http://clinic_backend;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
#   }
# }

# 9. Enable Nginx site
sudo ln -s /etc/nginx/sites-available/clinic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Setup SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.clinicmanagement.com
```

### 2.4 Environment Variables Configuration

**Production .env Template**:
```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=https://api.clinicmanagement.com

# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/clinic_prod

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=7d

# Third Party Services
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://clinicmanagement.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 3. Frontend Deployment

### 3.1 Local Development Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local

# Start development server
npm run dev
```

### 3.2 Production Build & Deployment

**Build Process**:
```bash
# Create optimized production build
npm run build

# Output will be in dist/ folder
# Files are minified and optimized for production
```

**Deployment Options**:

#### Option 1: Vercel (Recommended for React)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment
# VITE_API_BASE_URL=https://api.clinicmanagement.com
```

#### Option 2: Netlify

```bash
# Build command: npm run build
# Publish directory: dist
# Environment variable: VITE_API_BASE_URL=https://api.clinicmanagement.com

# Deploy via CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option 3: AWS S3 + CloudFront

```bash
# Build the app
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-clinic-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 3.3 Frontend Environment Variables

**.env.production**:
```env
VITE_API_BASE_URL=https://api.clinicmanagement.com
VITE_APP_NAME=Clinic Management System
VITE_APP_VERSION=1.0.0
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

---

## 4. Database Deployment

### 4.1 MongoDB Atlas Setup (Cloud)

**Recommended for Production**

**Steps**:

1. **Create MongoDB Atlas Account**
   - Go to mongodb.com/cloud/atlas
   - Sign up/Login
   - Create new organization

2. **Create Cluster**
   - Select Shared Cluster (Free tier)
   - Choose region closest to deployment
   - Name: `clinic-management`
   - Select M0 or M2+ for production

3. **Configure Network Access**
   - Add IP whitelist
   - Add application server IPs
   - Create database user with strong password

4. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/clinic?retryWrites=true&w=majority
   ```

5. **Backup Strategy**
   - Enable automatic backups
   - Set 7-day retention
   - Schedule monthly exports

### 4.2 Local MongoDB Backup & Restore

```bash
# Backup all databases
mongodump --uri "mongodb://localhost:27017" --out ./backup

# Backup specific database
mongodump --db clinic --out ./backup

# Restore from backup
mongorestore --uri "mongodb://localhost:27017" ./backup

# Export to JSON
mongoexport --db clinic --collection users --out users.json

# Import from JSON
mongoimport --db clinic --collection users --file users.json
```

### 4.3 Database Optimization

```javascript
// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })

db.appointments.createIndex({ doctorId: 1, appointmentDate: 1 })
db.appointments.createIndex({ patientId: 1, status: 1 })

db.billing.createIndex({ invoiceNumber: 1 }, { unique: true })
db.billing.createIndex({ paymentStatus: 1, createdAt: -1 })

// Monitor index usage
db.appointments.aggregate([{ $indexStats: {} }])
```

---

## 5. CI/CD Pipeline Setup

### 5.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Unit Tests
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
  
  # Code Quality Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run ESLint
        run: |
          cd backend
          npm install
          npm run lint
  
  # Build Frontend
  build-frontend:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
  
  # Deploy Backend
  deploy-backend:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [test, lint]
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: AkhileshNS/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## 6. Monitoring & Logging

### 6.1 Application Monitoring

**Winston Logging Configuration**:
- **Error logs**: `/backend/logs/error.log`
- **Combined logs**: `/backend/logs/combined.log`
- **Activity logs**: `/backend/logs/activity.log`

**Log Rotation** (using winston-daily-rotate-file):
```bash
npm install winston-daily-rotate-file
```

### 6.2 Server Monitoring

**Monitor Running Processes**:
```bash
# Check PM2 processes
pm2 status
pm2 logs clinic-api
pm2 monit

# System resource usage
top
free -h
df -h

# Network connections
netstat -tlnp | grep :5000
```

### 6.3 Alerts & Notifications

```javascript
// Alert configuration example
const alertConfig = {
  errorRateThreshold: 5, // errors per minute
  responseTimeThreshold: 1000, // milliseconds
  downtimeThreshold: 5, // minutes
  
  notifications: {
    email: 'admin@clinic.com',
    slack: 'https://hooks.slack.com/services/YOUR_WEBHOOK'
  }
};
```

---

## 7. Scaling Strategy

### 7.1 Horizontal Scaling

```
┌──────────────────────────────────────────┐
│         Load Balancer (Nginx)            │
├──────────────────────────────────────────┤
│                                          │
├──────────────┬───────────────┬──────────┤
│              │               │          │
v              v               v          v
API Instance 1 API Instance 2  API Instance 3
Port 5001      Port 5002       Port 5003
│              │               │
└──────────────┼───────────────┘
               │
        MongoDB Atlas
         (Replication)
```

**Nginx Load Balancing Configuration**:
```nginx
upstream clinic_backend {
    least_conn;  # Load balancing algorithm
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
}

server {
    listen 80;
    server_name api.clinicmanagement.com;
    
    location / {
        proxy_pass http://clinic_backend;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 7.2 Vertical Scaling

Upgrade server resources:
- CPU: 2 vCPU → 4 vCPU
- RAM: 4GB → 8GB
- Database: M2 → M10 instance

### 7.3 Caching Strategy

```javascript
// Redis caching for high-traffic endpoints
const redis = require('redis');
const client = redis.createClient();

// Cache doctor schedules (TTL: 1 hour)
app.get('/api/doctors/:id/schedule', async (req, res) => {
    const cacheKey = `doctor_schedule_${req.params.id}`;
    
    // Check cache first
    const cached = await client.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    
    // Fetch from DB
    const schedule = await Doctor.findById(req.params.id);
    
    // Cache the result
    await client.setex(cacheKey, 3600, JSON.stringify(schedule));
    res.json(schedule);
});
```

---

## 8. Security Deployment Checklist

- [ ] Use HTTPS/TLS for all communications
- [ ] Enable CORS only for frontend domain
- [ ] Set secure HTTP headers (Helmet.js)
- [ ] Implement rate limiting
- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Hash passwords with bcryptjs
- [ ] Validate all user inputs
- [ ] Sanitize database queries
- [ ] Regular security audits
- [ ] Enable database encryption at rest
- [ ] Implement audit logging
- [ ] Use environment variables for secrets
- [ ] Regular backups with encryption
- [ ] Monitor for suspicious activities
- [ ] Update dependencies regularly

---

## 9. Performance Benchmarks

### 9.1 Target Metrics

| Metric | Target |
|--------|--------|
| API Response Time | < 200ms (p95) |
| Page Load Time | < 3s (desktop) |
| Database Query Time | < 100ms |
| Uptime | 99.9% |
| Error Rate | < 0.1% |
| Concurrent Users | 100+ |

### 9.2 Load Testing

```bash
# Installation
npm install -g artillery

# Create load test script
# load-test.yml
config:
  target: "https://api.clinicmanagement.com"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Clinic API"
    flow:
      - get:
          url: "/api/health"

# Run test
artillery run load-test.yml
```

---

## 10. Disaster Recovery Plan

### 10.1 Backup Strategy

```bash
# Daily automated backups
0 2 * * * mongodump --uri "mongodb://..." --out /backups/$(date +\%Y\%m\%d)

# Weekly full backup to S3
0 3 * * 0 mongodump --uri "mongodb://..." | gzip | aws s3 cp - s3://backup-bucket/weekly-$(date +\%Y\%m\%d).gz

# Backup retention policy
# Daily: Keep 7 days
# Weekly: Keep 4 weeks
# Monthly: Keep 12 months
```

### 10.2 Recovery Procedures

```bash
# Restore from backup
mongorestore --uri "mongodb://..." /path/to/backup

# Point-in-time recovery
mongorestore --uri "mongodb://..." --oplogReplay /path/to/backup

# Verify data integrity
db.adminCommand({ dbCheck: 1 })
```

### 10.3 Failover Plan

- Primary database fails → Automatic failover to replica
- API instance fails → Load balancer routes to healthy instances
- Primary server fails → Spin up replacement from AMI/snapshot
- Network failure → Graceful degradation with cached data

---

## 11. Cost Optimization

### 11.1 Estimated Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| AWS EC2 | t3.medium | $30 |
| MongoDB Atlas | M2 | $57 |
| CloudFront CDN | Usage-based | $20 |
| SendGrid (Email) | 12K/month | Free |
| Twilio (SMS) | $0.0075/msg | $50 |
| **Total** | | **~$157** |

### 11.2 Cost Reduction Tips

- Use AWS free tier for first 12 months
- Choose shared MongoDB instance for low traffic
- Implement caching to reduce database queries
- Optimize image sizes and delivery
- Schedule non-critical backups during off-peak hours
- Use spot instances for non-critical workloads

---

## 12. Maintenance Schedule

### 12.1 Regular Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Apply security patches | Weekly | DevOps |
| Database optimization | Monthly | DBA |
| Security audit | Quarterly | Security Team |
| Capacity planning review | Monthly | Engineering |
| Backup verification | Weekly | DevOps |
| Certificate renewal | Before expiry | DevOps |
| Dependency updates | Monthly | Engineering |

### 12.2 Deployment Windows

```
Production Deployments:
- Tuesday-Thursday, 9 AM - 12 PM EST
- Require code review and test passage
- Must have rollback plan
- Notify users 24 hours before

Maintenance Windows:
- 2 AM - 4 AM EST on Sunday
- Database maintenance/optimization
- Server patching
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-18 | Initial deployment documentation |

