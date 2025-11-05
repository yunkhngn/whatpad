#!/bin/bash

# ================================================
# Whatpad Database Setup Script
# ================================================
# This script will set up the complete database
# with schema and sample data
# ================================================

echo "=================================="
echo "Whatpad Database Setup"
echo "=================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ ERROR: MySQL is not installed or not in PATH"
    echo "Please install MySQL 8.0+ and try again"
    exit 1
fi

echo "✓ MySQL found"
echo ""

# Prompt for MySQL credentials
read -p "Enter MySQL username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASS
echo ""
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting database setup..."
echo ""

# Run createdb_consolidated.sql
echo "1. Creating database schema..."
if mysql -u "$DB_USER" -p"$DB_PASS" < "$SCRIPT_DIR/createdb_consolidated.sql"; then
    echo "   ✓ Schema created successfully"
else
    echo "   ❌ Failed to create schema"
    exit 1
fi

echo ""

# Run insertdb_consolidated.sql
echo "2. Inserting sample data..."
if mysql -u "$DB_USER" -p"$DB_PASS" < "$SCRIPT_DIR/insertdb_consolidated.sql"; then
    echo "   ✓ Sample data inserted successfully"
else
    echo "   ❌ Failed to insert sample data"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Database setup complete!"
echo "=================================="
echo ""
echo "Database: wattpad"
echo "Tables: 17"
echo "Sample users: 4"
echo "Sample stories: 5"
echo ""
echo "You can now start the backend server!"
echo ""
