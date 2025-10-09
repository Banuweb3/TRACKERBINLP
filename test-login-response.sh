#!/bin/bash
echo "🧪 Testing login response format..."

echo "1. Testing direct backend (port 3001):"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"last123@gmail.com","password":"your_password_here"}' | jq .

echo -e "\n2. Testing through nginx (port 80):"
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"last123@gmail.com","password":"your_password_here"}' | jq .

echo -e "\n3. Checking which file PM2 is actually running:"
pm2 describe bpo-backend | grep -A 5 "script path"

echo -e "\n4. Checking if the new code is in the file:"
grep -n "Generate a simple token" ~/TRACKERBINLP/server/droplet-server.js

echo -e "\n5. PM2 process info:"
pm2 list | grep bpo-backend
