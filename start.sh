#!/bin/bash

# AVX Copilot o1 - Quick Launcher

echo "🚀 Starting AVX Copilot o1..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and add your bot token"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the bot
echo "🤖 Starting bot in development mode..."
npm run dev
