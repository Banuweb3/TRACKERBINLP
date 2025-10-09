#!/bin/bash
echo "🔍 FULL DIAGNOSTIC - BPO Analytics Platform"
echo "=========================================="

echo "1. 📋 PM2 Process Status:"
pm2 status

echo -e "\n2. 🔍 Backend Process Details:"
pm2 describe bpo-backend

echo -e "\n3. 📝 Backend Logs (last 10 lines):"
pm2 logs bpo-backend --lines 10

echo -e "\n4. 🌐 Port Check - What's running on ports:"
echo "Port 80 (frontend):"
sudo netstat -tulpn | grep :80
echo "Port 3001 (backend):"
sudo netstat -tulpn | grep :3001

echo -e "\n5. 🧪 Direct Backend Tests:"
echo "Testing health endpoint:"
curl -s http://localhost:3001/health | head -c 200
echo -e "\n"

echo "Testing auth login endpoint:"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -c 200
echo -e "\n"

echo "Testing analysis sessions endpoint:"
curl -s http://localhost:3001/api/analysis/sessions | head -c 200
echo -e "\n"

echo -e "\n6. 📁 Backend File Check:"
echo "Current backend file being run:"
ls -la ~/TRACKERBINLP/server/droplet-server.js
echo "Last modified:"
stat ~/TRACKERBINLP/server/droplet-server.js | grep Modify

echo -e "\n7. 🔄 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo -e "\n8. 📋 Nginx Configuration:"
echo "Active nginx config:"
sudo nginx -T 2>/dev/null | grep -A 20 "location /api"

echo -e "\n9. 🧪 Frontend to Backend Test:"
echo "Testing what frontend actually gets:"
curl -s http://localhost/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -c 200

echo -e "\n\n✅ Diagnostic Complete!"
