#!/bin/bash

# Collaborative Publishing Platform - Backend Stop Script
# This script stops all backend-related services

set -e  # Exit on any error

echo "🛑 Stopping Collaborative Publishing Platform Backend Services..."

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

# Stop Docker containers
print_status "Stopping Docker containers..."
docker compose -f docker-compose.dev.yml down

print_success "All backend services stopped successfully!"

# Optional: Remove containers and volumes (uncomment if needed)
# print_status "Removing containers and volumes..."
# docker compose -f docker-compose.dev.yml down -v
# print_success "Containers and volumes removed!" 