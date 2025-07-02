#!/bin/bash

# Collaborative Publishing Platform - Development Backend Stop Script
# This script stops the backend service that was started in the background

set -e  # Exit on any error

echo "🛑 Stopping Collaborative Publishing Platform Backend Services (Development Mode)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Stop the backend process if it's running
if [ -f "backend/backend.pid" ]; then
    BACKEND_PID=$(cat backend/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_status "Stopping backend process (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        
        # Check if process is still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            print_warning "Backend process still running, force killing..."
            kill -9 $BACKEND_PID
        fi
        
        print_success "Backend process stopped"
    else
        print_warning "Backend process not running (PID: $BACKEND_PID)"
    fi
    
    # Remove PID file
    rm -f backend/backend.pid
else
    print_warning "No backend PID file found"
fi

# Stop Docker containers
print_status "Stopping Docker containers..."
docker compose -f docker-compose.dev.yml down

print_success "All backend services stopped successfully!" 