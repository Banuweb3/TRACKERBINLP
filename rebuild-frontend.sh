#!/bin/bash
echo "🔄 Rebuilding frontend to fix dashboard errors..."

cd ~/TRACKERBINLP

echo "📦 Installing/updating dependencies..."
npm install --legacy-peer-deps

echo "🏗️ Building frontend with latest code..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    
    echo "🔄 Restarting nginx to serve new frontend..."
    sudo systemctl restart nginx
    
    echo "🧪 Testing frontend..."
    curl -s http://localhost/ | head -c 100
    
    echo "✅ Frontend rebuild complete!"
    echo "🎯 Test dashboards now - they should work without errors"
else
    echo "❌ Frontend build failed!"
    echo "📋 Check build logs above for errors"
fi
