#!/bin/bash

# 🚀 AVX Copilot o1 - GitHub & Cloud Deployment
# =============================================

echo "🚀 AVX Copilot o1 - Cloud Deployment"
echo "===================================="
echo ""

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

cd /Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1

# 1. Git initialisieren
echo -e "${BLUE}📦 Initializing Git repository...${NC}"
git init

# 2. Production start script
echo -e "${BLUE}📝 Creating production start script...${NC}"
cat > start-production.js << 'EOF'
// Production start file
console.log('🚀 Starting AVX Copilot o1 in production...');
require('./test-bot.js');
EOF

# 3. Update package.json for production
echo -e "${BLUE}📝 Updating package.json...${NC}"
node -e "
const pkg = require('./package.json');
pkg.main = 'start-production.js';
pkg.engines = {
  node: '>=18.0.0'
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# 4. Create .gitignore if not exists
echo -e "${BLUE}📝 Ensuring .gitignore...${NC}"
if [ ! -f .gitignore ]; then
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.DS_Store
*.log
EOF
fi

# 5. Git add all files
echo -e "${BLUE}📦 Adding files to Git...${NC}"
git add .
git commit -m "Initial commit: AVX Copilot o1"

echo -e "${GREEN}✅ Local repository ready!${NC}"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo "1. Create GitHub repository at: https://github.com/new"
echo "   - Repository name: avx-copilot-o1"
echo "   - Make it PUBLIC"
echo "   - DON'T initialize with README"
echo ""
echo "2. Run these commands:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/avx-copilot-o1.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Railway:"
echo "   - Go to: https://railway.app"
echo "   - New Project → Deploy from GitHub"
echo "   - Add env variable: TELEGRAM_BOT_TOKEN"
echo ""
echo -e "${GREEN}Ready for cloud deployment!${NC}"
