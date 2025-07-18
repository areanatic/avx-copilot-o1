#!/usr/bin/env node

// Fix script for message tracking
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'enhanced-bot-buttons.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the text handler and add tracking
const textHandlerPattern = /bot\.on\('text', async \(ctx\) => \{\s*const session = ctx\.session \|\| \{\};\s*const userId = ctx\.from\.id;\s*const userMessage = ctx\.message\.text;/;

const newTextHandler = `bot.on('text', async (ctx) => {
  const session = ctx.session || {};
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  
  // Track message in persistent stats
  statsManager.trackMessage(userId, 'text');`;

// Replace the code
content = content.replace(textHandlerPattern, newTextHandler);

// Also add tracking to voice handler
const voiceHandlerPattern = /bot\.on\('voice', async \(ctx\) => \{\s*const userId = ctx\.from\.id;/;

const newVoiceHandler = `bot.on('voice', async (ctx) => {
  const userId = ctx.from.id;
  
  // Track voice message in persistent stats
  statsManager.trackMessage(userId, 'voice');`;

content = content.replace(voiceHandlerPattern, newVoiceHandler);

// Write back
fs.writeFileSync(filePath, content);

console.log('✅ Message tracking fixed!');
