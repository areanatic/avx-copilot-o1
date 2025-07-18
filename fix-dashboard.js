#!/usr/bin/env node

// Fix script for dashboard update issue
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'enhanced-bot-buttons.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the dashboard action
const oldDashboardPattern = /\/\/ Dashboard - Hauptübersicht\nbot\.action\('dashboard', async \(ctx\) => \{[\s\S]*?\}\);/;

const newDashboardCode = `// Dashboard - Hauptübersicht
bot.action('dashboard', handleDashboard);

// Dashboard refresh handler
bot.action('dashboard_refresh', handleDashboard);`;

// Replace the code
content = content.replace(oldDashboardPattern, newDashboardCode);

// Write back
fs.writeFileSync(filePath, content);

console.log('✅ Dashboard handler fixed!');
