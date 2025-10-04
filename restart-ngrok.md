# 🔄 Restart ngrok Tunnel

## Step 1: Start New ngrok Tunnel
```bash
# In your PHP API directory
ngrok http 80
# or
ngrok http 8000
```

## Step 2: Copy New URL
You'll get a new URL like:
```
https://abc-def-ghi.ngrok-free.dev
```

## Step 3: Update the URL in calling.js
Replace the old URL with the new one in:
`server/routes/calling.js` line 11

## Step 4: Restart Backend
```bash
cd server
npm start
```
