@echo off
REM ================================================
REM Whatpad Database Setup Script (Windows)
REM ================================================
REM This script will set up the complete database
REM with schema and sample data
REM ================================================

echo ==================================
echo Whatpad Database Setup
echo ==================================
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MySQL is not installed or not in PATH
    echo Please install MySQL 8.0+ and add it to your PATH
    pause
    exit /b 1
)

echo MySQL found
echo.

REM Prompt for MySQL credentials
set /p DB_USER="Enter MySQL username [root]: huyn1"
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL password: 1234"
echo.

echo Starting database setup...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Run createdb_consolidated.sql
echo 1. Creating database schema...
mysql -u %DB_USER% -p%DB_PASS% < "%SCRIPT_DIR%createdb_consolidated.sql"
if %ERRORLEVEL% NEQ 0 (
    echo    Failed to create schema
    pause
    exit /b 1
)
echo    Schema created successfully
echo.

REM Run insertdb_consolidated.sql
echo 2. Inserting sample data...
mysql -u %DB_USER% -p%DB_PASS% < "%SCRIPT_DIR%insertdb_consolidated.sql"
if %ERRORLEVEL% NEQ 0 (
    echo    Failed to insert sample data
    pause
    exit /b 1
)
echo    Sample data inserted successfully
echo.

echo ==================================
echo Database setup complete!
echo ==================================
echo.
echo Database: wattpad
echo Tables: 17
echo Sample users: 4
echo Sample stories: 5
echo.
echo You can now start the backend server!
echo.
pause
