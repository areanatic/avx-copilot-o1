#!/usr/bin/env node

// Quick Fix Script - Entfernt den duplizierten Code der den Crash verursacht
const fs = require('fs');

const filePath = 'enhanced-bot-buttons.js';
const content = fs.readFileSync(filePath, 'utf8');

// Finde und entferne den problematischen Code-Block
const fixedContent = content.replace(
  /\/\/ \(Entfernt - Duplikat\)[\s\S]*?bot\.action\('edit_file', \(ctx\) => {[\s\S]*?}\);\s*\/\/ PROJECT AGENTS\s*bot\.action\('project_agents', async \(ctx\) => {/g,
  "// Analytics\nbot.action('analytics', async (ctx) => {"
);

// Backup erstellen
fs.writeFileSync(filePath + '.backup_crash_fix', content);

// Fixed Version speichern
fs.writeFileSync(filePath, fixedContent);

console.log('✅ Fix angewendet! Duplikate entfernt.');
