#!/bin/bash

# Skill Buddy Development Startup Script
echo "🚀 Starting Skill Buddy Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Backend Server
echo "🔧 Starting Backend Server..."
cd skill-buddy-backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start Frontend Server
echo "📱 Starting Frontend Server..."
cd interview-app
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Development servers started!"
echo "📊 Backend: http://192.168.1.4:5000"
echo "📱 Frontend: Expo development server"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 