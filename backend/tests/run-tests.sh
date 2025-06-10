#!/bin/bash

# VerSafe Services Test Runner
# This script helps you run the integration tests for all VerSafe services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

print_header() {
    echo
    print_color $BLUE "=================================="
    print_color $BLUE "$1"
    print_color $BLUE "=================================="
    echo
}

print_success() {
    print_color $GREEN "✅ $1"
}

print_error() {
    print_color $RED "❌ $1"
}

print_warning() {
    print_color $YELLOW "⚠️  $1"
}

print_info() {
    print_color $BLUE "ℹ️  $1"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js to run the tests."
        exit 1
    fi
    print_success "Node.js is available: $(node --version)"
}

# Check if required dependencies are installed
check_dependencies() {
    print_info "Checking test dependencies..."
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/axios/package.json" ] || [ ! -f "node_modules/form-data/package.json" ]; then
        print_warning "Test dependencies not found. Installing..."
        npm install axios form-data
        if [ $? -eq 0 ]; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    else
        print_success "Test dependencies are available"
    fi
}

# Check if Docker containers are running
check_docker_services() {
    print_info "Checking if VerSafe services are running..."
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Make sure VerSafe services are running manually."
        return
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_warning "docker-compose.yml not found. Make sure you're in the correct directory."
        return
    fi
    
    # Check running containers
    if command -v docker-compose &> /dev/null; then
        running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    else
        running_services=$(docker ps --format "table {{.Names}}" | grep -c "versafe" 2>/dev/null || echo "0")
    fi
    
    if [ "$running_services" -gt 0 ]; then
        print_success "Found $running_services VerSafe service(s) running"
    else
        print_warning "No VerSafe services appear to be running"
        print_info "You can start them with: docker-compose up -d"
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    sleep 5
    print_success "Ready to run tests"
}

# Run the tests
run_tests() {
    print_header "Running VerSafe Integration Tests"
    
    if [ ! -f "test-all-services.js" ]; then
        print_error "test-all-services.js not found in current directory"
        exit 1
    fi
    
    node test-all-services.js
    test_exit_code=$?
    
    echo
    if [ $test_exit_code -eq 0 ]; then
        print_success "Test execution completed"
    else
        print_error "Test execution failed with exit code $test_exit_code"
    fi
    
    return $test_exit_code
}

# Show usage information
show_usage() {
    echo "VerSafe Services Test Runner"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -s, --skip-checks  Skip dependency and service checks"
    echo "  -q, --quick    Quick run (skip waits and detailed checks)"
    echo
    echo "Examples:"
    echo "  $0                 # Run full test suite with all checks"
    echo "  $0 --quick         # Quick test run"
    echo "  $0 --skip-checks   # Run tests without preliminary checks"
    echo
}

# Main execution
main() {
    local skip_checks=false
    local quick_mode=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -s|--skip-checks)
                skip_checks=true
                shift
                ;;
            -q|--quick)
                quick_mode=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "VerSafe Services Test Runner"
    
    if [ "$skip_checks" = false ]; then
        check_nodejs
        check_dependencies
        check_docker_services
        
        if [ "$quick_mode" = false ]; then
            wait_for_services
        fi
    fi
    
    run_tests
    exit_code=$?
    
    print_header "Test Run Complete"
    
    if [ $exit_code -eq 0 ]; then
        print_success "All tests completed successfully!"
        print_info "Check the output above for detailed results."
    else
        print_error "Some tests failed or encountered errors."
        print_info "Check the output above for details and troubleshooting information."
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"
