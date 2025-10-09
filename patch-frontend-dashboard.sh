#!/bin/bash
echo "🔧 Patching frontend dashboard to fix Application Error..."

cd ~/TRACKERBINLP

# Find the current main JS file
MAIN_JS=$(ls dist/assets/main-*.js 2>/dev/null | head -1)

if [ -z "$MAIN_JS" ]; then
    echo "❌ No main JS file found in dist/assets/"
    exit 1
fi

echo "📁 Found frontend file: $MAIN_JS"

# Create backup
cp "$MAIN_JS" "$MAIN_JS.backup"

# Patch common dashboard errors
echo "🔧 Patching dashboard compatibility issues..."

# Fix undefined property access patterns
sed -i 's/y\.ads\.totalSpend/y?.ads?.totalSpend || 0/g' "$MAIN_JS"
sed -i 's/y\.ads\.impressions/y?.ads?.impressions || 0/g' "$MAIN_JS"
sed -i 's/y\.ads\.clicks/y?.ads?.clicks || 0/g' "$MAIN_JS"
sed -i 's/y\.ads\.ctr/y?.ads?.ctr || 0/g' "$MAIN_JS"

# Fix other common undefined access patterns
sed -i 's/\.totalSpend/?.totalSpend || 0/g' "$MAIN_JS"
sed -i 's/\.impressions/?.impressions || 0/g' "$MAIN_JS"
sed -i 's/\.clicks/?.clicks || 0/g' "$MAIN_JS"

# Add null checks for common dashboard properties
sed -i 's/H\.id/H?.id/g' "$MAIN_JS"
sed -i 's/P\.id/P?.id/g' "$MAIN_JS"

echo "✅ Frontend patched!"

# Restart nginx to clear cache
sudo systemctl restart nginx

echo "🧪 Testing patched frontend..."
curl -s http://localhost/ | head -c 50

echo "✅ Patch complete! Test Meta Dashboard now."
echo "💡 If still having issues, run: ./rebuild-frontend.sh"
