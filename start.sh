#!/bin/bash
# PLC AutoConfig - One-click startup script
# Usage: open Terminal, then run:  bash ~/Applications/plc-autoconfig/start.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "========================================="
echo "  PLC AutoConfig - Starting up..."
echo "========================================="
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed."
    echo ""
    echo "   Install it by running:"
    echo "   brew install python3"
    echo ""
    echo "   If you don't have Homebrew, install it first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi
echo "✅ Python 3 found: $(python3 --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "   Install it by running:"
    echo "   brew install node"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed (should come with Node.js)."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$DIR/backend"
python3 -m pip install -r requirements.txt --quiet 2>&1 | grep -v "already satisfied"
echo "   Done."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$DIR/frontend"
npm install --silent 2>&1 | tail -1
# Clear stale vite cache if present
rm -rf node_modules/.vite 2>/dev/null
echo "   Done."

echo ""

# Kill any existing servers on these ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
echo "🚀 Starting backend server (port 8000)..."
cd "$DIR/backend"
python3 -m uvicorn main:app --port 8000 &
BACKEND_PID=$!
sleep 2

# Verify backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check for errors above."
    exit 1
fi
echo "   Backend running (PID: $BACKEND_PID)"

# Start frontend
echo "🚀 Starting frontend server (port 5173)..."
cd "$DIR/frontend"
npx vite --port 5173 &
FRONTEND_PID=$!
sleep 3

# Verify frontend started
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check for errors above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "   Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "========================================="
echo "  ✅ PLC AutoConfig is running!"
echo ""
echo "  Open in your browser:"
echo "  👉 http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "========================================="
echo ""

# Open browser
open http://localhost:5173 2>/dev/null

# Wait for Ctrl+C, then clean up
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Done.'; exit 0" INT
wait
