# 🚀 Quick DigitalOcean Deployment Guide

## Option 1: Automated Deployment (Recommended)

### Step 1: Create DigitalOcean Droplet
1. Login to [DigitalOcean](https://cloud.digitalocean.com/)
2. Create → Droplets
3. **Image**: Ubuntu 22.04 LTS
4. **Plan**: Basic $6/month (1GB RAM, 1 vCPU, 25GB SSD)
5. **Authentication**: SSH Key or Password
6. **Hostname**: `bpo-analytics-server`

### Step 2: Run Automated Deployment
```bash
# Connect to your droplet
ssh root@YOUR_DROPLET_IP

# Download and run deployment script
wget https://raw.githubusercontent.com/Banuweb3/TRACKERBINLP/main/deploy-script.sh
chmod +x deploy-script.sh
./deploy-script.sh
```

### Step 3: Access Your Application
- **Frontend**: `http://YOUR_DROPLET_IP`
- **API Health**: `http://YOUR_DROPLET_IP/health`
- **Meta Dashboard**: Login and navigate to Meta Dashboard

---

## Option 2: Manual Deployment

Follow the detailed guide in `deploy-digitalocean.md`

---

## Post-Deployment Configuration

### Update Environment Variables
```bash
# Edit environment file
nano /var/www/bpo-analytics/server/.env.production

# Update these values:
FRONTEND_URL=http://YOUR_DROPLET_IP  # or your domain
FACEBOOK_APP_ID=your_actual_app_id   # Replace placeholder

# Restart application
pm2 restart bpo-analytics-server
```

### Setup SSL Certificate (Optional)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
certbot --nginx -d yourdomain.com
```

### Monitor Your Application
```bash
# Check application status
pm2 status
pm2 logs bpo-analytics-server

# Check system resources
htop
df -h

# Check Nginx
systemctl status nginx
```

---

## Features Available After Deployment

✅ **BPO Call Analytics**
- Upload and analyze call recordings
- AI-powered quality scoring
- Bulk analysis capabilities

✅ **Meta Dashboard**
- Real Facebook/Instagram data
- Campaign performance metrics
- Page insights and engagement

✅ **User Management**
- Secure authentication
- Role-based access
- Session management

✅ **API Endpoints**
- RESTful API design
- Rate limiting
- Error handling

---

## Troubleshooting

### Common Issues

**1. Application Not Starting**
```bash
pm2 logs bpo-analytics-server
# Check for database connection or missing environment variables
```

**2. Database Connection Error**
```bash
mysql -u bpo_user -p bpo_analytics
# Test database connectivity
```

**3. Frontend Not Loading**
```bash
nginx -t  # Test Nginx configuration
systemctl restart nginx
```

**4. Facebook API Errors**
- Check token expiration in Meta Business Manager
- Verify API permissions
- Test with `/api/meta/health` endpoint

### Performance Optimization

**For Higher Traffic:**
- Upgrade to larger droplet (2GB+ RAM)
- Enable PM2 clustering: `instances: 'max'`
- Setup Redis for session storage
- Configure CDN for static assets

**Database Optimization:**
```sql
-- Add indexes for better performance
CREATE INDEX idx_user_id ON call_analyses(user_id);
CREATE INDEX idx_created_at ON call_analyses(created_at);
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Update JWT_SECRET in production
- [ ] Enable firewall (UFW)
- [ ] Setup SSL certificate
- [ ] Configure fail2ban for SSH protection
- [ ] Regular security updates

---

## Backup Strategy

### Database Backup
```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u bpo_user -pBanu@1234 bpo_analytics > /root/backups/bpo_analytics_$DATE.sql
find /root/backups -name "*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Setup daily backup
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### Application Backup
```bash
# Backup application files
tar -czf /root/backups/bpo-app-$(date +%Y%m%d).tar.gz /var/www/bpo-analytics
```

---

## Scaling Options

### Vertical Scaling (Single Server)
- Upgrade droplet size
- Add more CPU/RAM
- Increase storage

### Horizontal Scaling (Multiple Servers)
- Load balancer + multiple app servers
- Managed database (DigitalOcean Managed MySQL)
- Redis cluster for sessions
- CDN for static assets

---

## Cost Breakdown

**Basic Setup (Single Droplet):**
- Droplet: $6/month (1GB RAM)
- Bandwidth: Included (1TB)
- **Total: ~$6/month**

**Production Setup:**
- Droplet: $18/month (4GB RAM)
- Managed Database: $15/month
- Load Balancer: $10/month
- **Total: ~$43/month**

---

## Support

For deployment issues:
1. Check the logs: `pm2 logs`
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity

Your BPO Analytics Platform with Meta Dashboard should now be live and ready for production use! 🎉
