#!/bin/bash
# PLC AutoConfig - Deploy to Vercel
# Run this from the plc-autoconfig directory

set -e

echo "🚀 PLC AutoConfig — Vercel Deployment"
echo "======================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check for npx
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add -A
    git commit -m "Initial commit: PLC AutoConfig"
fi

# Build frontend locally (Vercel will also build remotely, this is a safety net)
echo ""
echo "🔨 Building frontend..."
cd frontend
npm install --legacy-peer-deps 2>/dev/null
npx vite build
cd ..
echo "✅ Frontend built successfully"

# Deploy to Vercel
echo ""
echo "🌐 Deploying to Vercel..."
echo "   (If this is your first time, you'll be asked to log in)"
echo ""
npx vercel deploy --prod

echo ""
echo "✅ Deployment complete!"
echo "   Share the URL above with your team to try it out."
