#!/bin/bash

# Collaborative Publishing Platform - Production Deployment Script
# Usage: ./deploy.sh [environment] [action]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}
BACKUP_DIR="./backup"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env" ]; then
        log_error "Environment file .env not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log_info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Create database backup
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres collaborative_publishing > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    if [ $? -eq 0 ]; then
        log_success "Database backup created: backup_$TIMESTAMP.sql"
    else
        log_error "Failed to create database backup"
        exit 1
    fi
}

health_check() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Checking health of $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null; then
            log_success "$service is healthy"
            return 0
        fi
        
        log_warning "Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    log_error "$service health check failed after $max_attempts attempts"
    return 1
}

deploy_services() {
    log_info "Deploying services to $ENVIRONMENT environment..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down
    
    # Start services
    log_info "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health checks
    health_check "Database" "http://localhost:5432" || exit 1
    health_check "Redis" "http://localhost:6379" || exit 1
    health_check "Backend" "http://localhost:3001/health" || exit 1
    health_check "Frontend" "http://localhost:3000" || exit 1
    
    log_success "All services deployed successfully"
}

rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore from backup if available
    if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.sql" ]; then
        log_info "Restoring database from backup..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres collaborative_publishing < "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    fi
    
    # Start previous version
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Rollback completed"
}

monitor_deployment() {
    log_info "Monitoring deployment..."
    
    # Monitor logs for errors
    docker-compose -f docker-compose.prod.yml logs --tail=100 -f &
    LOG_PID=$!
    
    # Monitor for 5 minutes
    sleep 300
    
    # Stop log monitoring
    kill $LOG_PID 2>/dev/null || true
    
    log_success "Deployment monitoring completed"
}

cleanup() {
    log_info "Cleaning up old backups and logs..."
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
    
    # Keep only last 7 days of logs
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

show_status() {
    log_info "Current deployment status:"
    
    echo ""
    echo "Services:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "Recent logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
}

show_help() {
    echo "Collaborative Publishing Platform - Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  production  - Deploy to production (default)"
    echo "  staging     - Deploy to staging"
    echo ""
    echo "Actions:"
    echo "  deploy      - Deploy services (default)"
    echo "  rollback    - Rollback to previous version"
    echo "  status      - Show deployment status"
    echo "  backup      - Create database backup"
    echo "  cleanup     - Clean up old backups and logs"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy to production"
    echo "  $0 staging deploy     # Deploy to staging"
    echo "  $0 production rollback # Rollback production"
    echo "  $0 status             # Show status"
}

# Main script
main() {
    case $ACTION in
        "deploy")
            check_prerequisites
            create_backup
            deploy_services
            monitor_deployment
            cleanup
            log_success "Deployment completed successfully"
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "backup")
            create_backup
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown action: $ACTION"
            show_help
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" 