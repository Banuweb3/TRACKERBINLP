#!/bin/bash
echo "🚨 EMERGENCY DEBUG - Backend Status Check"
echo "========================================"

echo "1. 📋 PM2 Status:"
pm2 status

echo -e "\n2. 🔍 Backend Logs (last 20 lines):"
pm2 logs bpo-backend --lines 20

echo -e "\n3. 🧪 Quick Health Check:"
curl -s http://localhost:3001/health || echo "❌ Backend not responding on port 3001"

echo -e "\n4. 🔍 Check if backend process is running:"
ps aux | grep droplet-server.js | grep -v grep

echo -e "\n5. 🔍 Check for syntax errors in droplet-server.js:"
node -c ~/TRACKERBINLP/server/droplet-server.js && echo "✅ Syntax OK" || echo "❌ Syntax Error!"

echo -e "\n6. 🔍 Check database connection:"
curl -s http://localhost:3001/api/debug/users | head -c 100 || echo "❌ Debug endpoint failed"

echo -e "\n7. 🔄 Try restarting backend:"
pm2 restart bpo-backend

echo -e "\n8. 🧪 Test after restart:"
sleep 2
curl -s http://localhost:3001/health | head -c 100 || echo "❌ Still not responding"

echo -e "\n\n✅ Debug Complete!"
