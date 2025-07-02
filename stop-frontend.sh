#!/bin/bash

# Collaborative Publishing Platform - Frontend Stop Script
# This script stops the frontend development server

set -e  # Exit on any error

echo "🛑 Stopping Collaborative Publishing Platform Frontend..."

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

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found. Please ensure you're in the correct project directory."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Find and kill Next.js development server
print_status "Stopping Next.js development server..."

# Find processes running on port 3000
PIDS=$(lsof -ti:3000 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    print_status "Found processes on port 3000, stopping them..."
    echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    PIDS=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        print_warning "Force stopping remaining processes..."
        echo "$PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    
    print_success "Frontend development server stopped successfully!"
else
    print_warning "No frontend development server found running on port 3000"
fi

# Optional: Clean up build artifacts (uncomment if needed)
# print_status "Cleaning up build artifacts..."
# rm -rf .next
# print_success "Build artifacts cleaned up!"

print_success "Frontend services stopped successfully!" 