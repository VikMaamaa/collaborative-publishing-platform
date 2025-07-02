#!/bin/bash

# Collaborative Publishing Platform - Backend Startup Script
# This script starts all backend-related services

set -e  # Exit on any error

echo "🚀 Starting Collaborative Publishing Platform Backend Services..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Stop any existing containers to avoid conflicts
print_status "Stopping any existing containers..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

# Start database and Redis services
print_status "Starting PostgreSQL and Redis services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 5

# Check if services are healthy
print_status "Checking service health..."

# Check PostgreSQL
if docker exec collaborative-postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL might not be ready yet, continuing anyway..."
fi

# Check Redis
if docker exec collaborative-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis might not be ready yet, continuing anyway..."
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    print_error "Backend directory not found. Please ensure you're in the correct project directory."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please review and update the .env file with your configuration."
fi

# Start the backend
print_status "Starting NestJS backend..."
print_success "Backend will be available at: http://localhost:3001"
print_success "API endpoints will be at: http://localhost:3001/api"
echo ""
print_status "Press Ctrl+C to stop the backend server"
echo ""

# Start the backend in development mode
npm run start:dev 