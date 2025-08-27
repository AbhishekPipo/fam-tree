#!/bin/bash

# JanusGraph Docker Container Management Script
set -e

CONTAINER_NAME="janusgraph-default"
JANUSGRAPH_PORT="8182"
MEMORY_OPTS="-Xms512m -Xmx1024m"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[JanusGraph]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[JanusGraph]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[JanusGraph]${NC} $1"
}

print_error() {
    echo -e "${RED}[JanusGraph]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        print_status "You can start Docker by running: colima start"
        exit 1
    fi
}

# Check if container exists and is running
check_container_status() {
    if docker ps -a --format 'table {{.Names}}\t{{.Status}}' | grep -q "^${CONTAINER_NAME}"; then
        if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q "^${CONTAINER_NAME}.*Up"; then
            return 0  # Container exists and is running
        else
            return 1  # Container exists but is not running
        fi
    else
        return 2  # Container doesn't exist
    fi
}

# Wait for JanusGraph to be ready
wait_for_janusgraph() {
    print_status "Waiting for JanusGraph to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $JANUSGRAPH_PORT 2>/dev/null; then
            print_success "JanusGraph is ready on port $JANUSGRAPH_PORT"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "JanusGraph failed to start within 60 seconds"
    print_status "You can check logs with: docker logs $CONTAINER_NAME"
    return 1
}

# Start JanusGraph container
start_janusgraph() {
    print_status "Starting JanusGraph..."
    
    # Check Docker availability
    check_docker
    
    # Check current container status
    check_container_status
    local status=$?
    
    case $status in
        0)
            print_success "JanusGraph is already running"
            return 0
            ;;
        1)
            print_status "JanusGraph container exists but is stopped. Starting..."
            docker start $CONTAINER_NAME
            ;;
        2)
            print_status "Creating new JanusGraph container..."
            docker run -d \
                --name $CONTAINER_NAME \
                -p $JANUSGRAPH_PORT:$JANUSGRAPH_PORT \
                -e JAVA_OPTIONS="$MEMORY_OPTS" \
                janusgraph/janusgraph:latest
            ;;
    esac
    
    # Wait for JanusGraph to be ready
    if wait_for_janusgraph; then
        print_success "JanusGraph is now running at ws://localhost:$JANUSGRAPH_PORT/gremlin"
        return 0
    else
        print_error "Failed to start JanusGraph"
        return 1
    fi
}

# Stop JanusGraph container
stop_janusgraph() {
    print_status "Stopping JanusGraph..."
    
    if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop $CONTAINER_NAME
        print_success "JanusGraph stopped"
    else
        print_warning "JanusGraph is not running"
    fi
}

# Remove JanusGraph container and data
cleanup_janusgraph() {
    print_warning "This will remove the JanusGraph container and ALL DATA!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing JanusGraph container..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        print_success "JanusGraph container removed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Show container status and logs
status_janusgraph() {
    print_status "JanusGraph Container Status:"
    echo
    
    if docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -q "^${CONTAINER_NAME}"; then
        docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E "^(NAMES|${CONTAINER_NAME})"
        echo
        
        if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_success "JanusGraph is running and accessible at ws://localhost:$JANUSGRAPH_PORT/gremlin"
        else
            print_warning "JanusGraph container exists but is not running"
        fi
    else
        print_warning "JanusGraph container does not exist"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [start|stop|restart|status|cleanup|logs]"
    echo
    echo "Commands:"
    echo "  start    - Start JanusGraph container"
    echo "  stop     - Stop JanusGraph container"
    echo "  restart  - Restart JanusGraph container"
    echo "  status   - Show container status"
    echo "  cleanup  - Remove container and data (WARNING: destructive)"
    echo "  logs     - Show container logs"
    echo
    echo "If no command is provided, 'start' is assumed."
}

# Main script logic
case "${1:-start}" in
    start)
        start_janusgraph
        ;;
    stop)
        stop_janusgraph
        ;;
    restart)
        stop_janusgraph
        sleep 2
        start_janusgraph
        ;;
    status)
        status_janusgraph
        ;;
    cleanup)
        cleanup_janusgraph
        ;;
    logs)
        if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            docker logs -f $CONTAINER_NAME
        else
            print_error "JanusGraph container is not running"
            exit 1
        fi
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac