#!/bin/bash

# Start script for Notes App
# Starts both client and server

echo "Starting Notes App..."

# Start server in background
echo "Starting server on port 8000..."
cd server
python main.py &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 2

# Start client
echo "Starting client on port 5173..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $SERVER_PID $CLIENT_PID; exit" INT
wait

