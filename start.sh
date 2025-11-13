#!/bin/bash

echo "Starting WhatPad Backend (JSON Server)..."
cd backend
npm start &

echo "Waiting for backend to start..."
sleep 5

echo "Starting WhatPad Frontend..."
cd ../frontend
npm start &

echo ""
echo "========================================"
echo "WhatPad is starting!"
echo "========================================"
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:3000"
echo "Admin Dashboard: http://localhost:3000/admin"
echo ""
echo "Default Admin Credentials:"
echo "Email: admin@whatpad.com"
echo "Password: admin123"
echo "========================================"
