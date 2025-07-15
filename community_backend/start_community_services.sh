#!/bin/bash

# Start Community Backend Services
echo "Starting Community Backend Services..."

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local script_path=$3
    
    echo "Starting $service_name on port $port..."
    
    # Check if port is already in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $port is already in use. Stopping existing process..."
        lsof -ti:$port | xargs kill -9
    fi
    
    # Start the service
    cd "$script_path"
    python app.py &
    echo "$service_name started on port $port"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Post Service (Port 5001)
start_service "Post Service" 5001 "$SCRIPT_DIR/post_service"

# Start Like Service (Port 5002)
start_service "Like Service" 5002 "$SCRIPT_DIR/like_service"

# Start Reply Service (Port 5003)
start_service "Reply Service" 5003 "$SCRIPT_DIR/reply_service"

echo ""
echo "All Community Backend Services Started!"
echo "Post Service: http://localhost:5001"
echo "Like Service: http://localhost:5002"
echo "Reply Service: http://localhost:5003"
echo ""
echo "To stop all services, run: pkill -f 'python app.py'"
echo "" 