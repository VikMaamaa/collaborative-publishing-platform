#!/bin/bash

# Collaborative Publishing Platform - Full Stack Stop Script
# This script stops both frontend and backend services

set -e  # Exit on any error

echo "🛑 Stopping Collaborative Publishing Platform (Full Stack)..."

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

print_status "Stopping frontend services..."
./stop-frontend.sh

print_status "Stopping backend services..."
./stop-backend.sh

print_success "All services stopped successfully!" 