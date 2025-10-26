#!/bin/bash

# HydrantHub Development Bootstrap Script
# This script sets up the development environment and starts the backend server

set -e  # Exit on any error

echo "🔥 HydrantHub Development Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js $(node -v) detected"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client (psql) not found. Make sure PostgreSQL is installed."
else
    print_status "PostgreSQL client detected"
fi

# Navigate to backend directory
if [ ! -d "backend" ]; then
    print_error "Backend directory not found. Make sure you're in the project root."
    exit 1
fi

cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in backend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_info "Creating .env file from .env.example"
        cp .env.example .env
        print_warning "Please edit .env file with your database credentials"
        print_info "Database setup instructions:"
        echo "  1. Create database: psql -U postgres -c 'CREATE DATABASE hydrantdb;'"
        echo "  2. Enable PostGIS: psql -U postgres -d hydrantdb -c 'CREATE EXTENSION postgis;'"
        echo "  3. Load schema: psql -U postgres -d hydrantdb -f ../database/schema.sql"
    else
        print_error ".env.example file not found"
        exit 1
    fi
else
    print_status ".env file exists"
fi

# Check if database schema exists
echo
print_info "Checking database connection..."

# Source environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Test database connection if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    # Extract database name from DATABASE_URL for schema check
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///' | sed 's/?.*$//')
    
    # Check if database exists and has tables
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "\dt" &> /dev/null; then
            TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
            if [ "$TABLE_COUNT" -gt "5" ]; then
                print_status "Database schema loaded ($TABLE_COUNT tables found)"
            else
                print_warning "Database exists but schema may not be loaded"
                print_info "To load schema: psql \"$DATABASE_URL\" -f ../database/schema.sql"
            fi
        else
            print_warning "Could not connect to database. Please check DATABASE_URL in .env"
        fi
    fi
else
    print_warning "DATABASE_URL not set in .env file"
fi

# Start development server
echo
print_info "Starting HydrantHub backend server..."
echo
print_info "Server will be available at:"
echo "  🌐 Main API: http://localhost:${PORT:-5000}"
echo "  💚 Health: http://localhost:${PORT:-5000}/api/health"
echo "  🔍 Deep Health: http://localhost:${PORT:-5000}/api/health/deep"
echo "  📊 Flow Tests: http://localhost:${PORT:-5000}/api/flow-tests"
echo
print_info "Press Ctrl+C to stop the server"
echo

# Start the server with npm run dev (nodemon)
if npm run dev; then
    print_status "Server started successfully"
else
    print_error "Failed to start server. Check the error messages above."
    exit 1
fi
