#!/bin/bash

# 🔍 AVX Copilot o1 - Debug & Fix Script

echo "🔍 AVX Copilot o1 - Debugging Bot Connection"
echo "==========================================="
echo ""

# 1. Kill any existing node processes
echo "🛑 Stopping any running bot instances..."
pkill -f "node.*avx-copilot"
sleep 2

# 2. Test with simple bot
echo "🧪 Starting test bot..."
echo ""
cd /Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1

# Run the test bot
node test-bot.js
