#!/bin/bash

# Collaborative Publishing Platform - Frontend Startup Script
# This script starts the frontend development server

set -e  # Exit on any error

echo "🚀 Starting Collaborative Publishing Platform Frontend..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

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

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    print_success "Dependencies installed successfully!"
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from template"
    else
        print_warning "No .env.example found. Creating basic .env.local..."
        echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
        print_success "Created basic .env.local file"
    fi
    print_warning "Please review and update the .env.local file with your configuration."
fi

# Check if backend is running (optional)
print_status "Checking backend connectivity..."
if curl -s http://localhost:3001/api > /dev/null 2>&1; then
    print_success "Backend is running and accessible"
else
    print_warning "Backend is not running or not accessible at http://localhost:3001"
    print_warning "Frontend will work but API calls will fail"
fi

# Start the frontend
print_status "Starting Next.js frontend..."
print_success "Frontend will be available at: http://localhost:3000"
print_success "Backend API endpoint: http://localhost:3001/api"
echo ""
print_status "Press Ctrl+C to stop the frontend server"
echo ""

# Start the frontend in development mode
npm run dev 