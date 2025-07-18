#!/bin/bash

# AVX Copilot o1 - Railway Quick Fix

echo "🚀 Starting AVX Copilot o1 - Railway Fix"

# 1. Ensure all dependencies are installed
echo "📦 Installing dependencies..."
npm install

# 2. Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found - Bot will use Railway environment variables"
else
    echo "✅ .env file found"
fi

# 3. Test bot token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ ERROR: TELEGRAM_BOT_TOKEN not set!"
    echo "Please set it in Railway Dashboard > Variables"
    exit 1
else
    echo "✅ Bot token found"
fi

# 4. Start the enhanced bot directly
echo "🤖 Starting Enhanced Bot with Button Menus..."
node enhanced-bot-buttons.js
