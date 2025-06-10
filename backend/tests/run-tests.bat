@echo off
setlocal enabledelayedexpansion

REM VerSafe Services Test Runner for Windows
REM This script helps you run the integration tests for all VerSafe services

title VerSafe Services Test Runner

REM Colors (limited support in Windows CMD)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print messages
:print_header
echo.
echo ==================================
echo %~1
echo ==================================
echo.
goto :eof

:print_success
echo %GREEN%✓ %~1%NC%
goto :eof

:print_error
echo %RED%✗ %~1%NC%
goto :eof

:print_warning
echo %YELLOW%! %~1%NC%
goto :eof

:print_info
echo %BLUE%i %~1%NC%
goto :eof

REM Check if Node.js is installed
:check_nodejs
call :print_info "Checking Node.js installation..."
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js to run the tests."
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :print_success "Node.js is available: !NODE_VERSION!"
goto :eof

REM Check if required dependencies are installed
:check_dependencies
call :print_info "Checking test dependencies..."

if not exist "node_modules\axios\package.json" (
    call :print_warning "Test dependencies not found. Installing..."
    npm install axios form-data
    if errorlevel 1 (
        call :print_error "Failed to install dependencies"
        pause
        exit /b 1
    )
    call :print_success "Dependencies installed successfully"
) else (
    call :print_success "Test dependencies are available"
)
goto :eof

REM Check if Docker containers are running
:check_docker_services
call :print_info "Checking if VerSafe services are running..."

REM Check if docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_warning "Docker not found. Make sure VerSafe services are running manually."
    goto :eof
)

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    call :print_warning "docker-compose.yml not found. Make sure you're in the correct directory."
    goto :eof
)

REM Check running containers (simplified check)
docker ps --format "table {{.Names}}" | findstr "versafe" >nul 2>&1
if errorlevel 1 (
    call :print_warning "No VerSafe services appear to be running"
    call :print_info "You can start them with: docker-compose up -d"
) else (
    call :print_success "VerSafe services appear to be running"
)
goto :eof

REM Wait for services to be ready
:wait_for_services
call :print_info "Waiting for services to be ready..."
timeout /t 5 /nobreak >nul
call :print_success "Ready to run tests"
goto :eof

REM Run the tests
:run_tests
call :print_header "Running VerSafe Integration Tests"

if not exist "test-all-services.js" (
    call :print_error "test-all-services.js not found in current directory"
    pause
    exit /b 1
)

node test-all-services.js
set TEST_EXIT_CODE=!errorlevel!

echo.
if !TEST_EXIT_CODE! equ 0 (
    call :print_success "Test execution completed"
) else (
    call :print_error "Test execution failed with exit code !TEST_EXIT_CODE!"
)

exit /b !TEST_EXIT_CODE!

REM Show usage information
:show_usage
echo VerSafe Services Test Runner for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   /h, /help          Show this help message
echo   /s, /skip-checks   Skip dependency and service checks
echo   /q, /quick         Quick run (skip waits and detailed checks)
echo.
echo Examples:
echo   %~nx0                    # Run full test suite with all checks
echo   %~nx0 /quick             # Quick test run
echo   %~nx0 /skip-checks       # Run tests without preliminary checks
echo.
goto :eof

REM Main execution
:main
set SKIP_CHECKS=false
set QUICK_MODE=false

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_tests
if /i "%~1"=="/h" goto :show_help
if /i "%~1"=="/help" goto :show_help
if /i "%~1"=="/s" set SKIP_CHECKS=true
if /i "%~1"=="/skip-checks" set SKIP_CHECKS=true
if /i "%~1"=="/q" set QUICK_MODE=true
if /i "%~1"=="/quick" set QUICK_MODE=true
shift
goto :parse_args

:show_help
call :show_usage
pause
exit /b 0

:start_tests
call :print_header "VerSafe Services Test Runner"

if "!SKIP_CHECKS!"=="false" (
    call :check_nodejs
    if errorlevel 1 exit /b 1
    
    call :check_dependencies
    if errorlevel 1 exit /b 1
    
    call :check_docker_services
    
    if "!QUICK_MODE!"=="false" (
        call :wait_for_services
    )
)

call :run_tests
set FINAL_EXIT_CODE=!errorlevel!

call :print_header "Test Run Complete"

if !FINAL_EXIT_CODE! equ 0 (
    call :print_success "All tests completed successfully!"
    call :print_info "Check the output above for detailed results."
) else (
    call :print_error "Some tests failed or encountered errors."
    call :print_info "Check the output above for details and troubleshooting information."
)

echo.
echo Press any key to exit...
pause >nul
exit /b !FINAL_EXIT_CODE!

REM Start main execution
call :main %*
