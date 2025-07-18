# AVX Copilot Changelog

## 🚀 Version 2.1.0 - AI Intelligence Update (2025-07-18)

### 🎉 Major New Features

#### 🔐 Mode Manager
- **FULL_POWER Mode**: Voller Zugriff auf alle Daten (nur für Arash)
- **SHOWCASE Mode**: Sicherer Modus für Präsentationen
- Filtert sensitive Daten basierend auf aktivem Mode
- Mode-aware Knowledge Loading
- Blacklist-System für sensitive Begriffe

#### 🤖 3-Tier Model Switcher
- **Haiku ($0.25/1M)**: Schnell & günstig für einfache Anfragen
- **Sonnet ($3/1M)**: Ausgewogen für die meisten Aufgaben
- **Opus ($15/1M)**: Maximum Power für komplexe Analysen
- Automatische Model-Auswahl basierend auf Query-Komplexität
- Echtzeit-Kostentracking pro User und Model
- Fallback-Mechanismen bei Rate Limits

#### 📝 Instruction Editor
- Dynamische System-Prompt Verwaltung
- 5 vordefinierte Templates (Coder, Researcher, Creative, Teacher)
- Instruction History (letzte 10 Versionen)
- User-spezifische Instructions möglich
- Max 4000 Zeichen pro Instruction

### 🔧 Technische Verbesserungen

- **knowledge-loader-v2.js**: Rekursives Laden mit Mode-Filtering
- **Dynamisches Dev Tools Menu**: Zeigt aktuelle Mode/Model Icons
- **Enhanced AI Responses**: Zeigt genutztes Model an
- **Session Management**: Verbesserte Context-Awareness
- **Error Handling**: Robustere Fehlerbehandlung

### 📱 Neue Commands

- `/mode` - Zeigt aktuellen Mode
- `/mode full|showcase` - Wechselt Mode
- `/model` - Zeigt Model & Kosten
- `/model haiku|sonnet|opus` - Wechselt Model

### 📊 Stats & Tracking

- Kosten-Tracking pro User
- Model-Usage Statistiken
- Performance Metriken
- Knowledge Base Größe: Dynamisch basierend auf Mode

### 🐛 Fixes

- Railway Deployment optimiert
- Module Loading verbessert
- Memory Management optimiert

---

## 📚 Version 1.3.0 - New Features Release

## 🎉 New Features

### ✏️ Telegram File Editor
- Edit files directly through Telegram
- Automatic backup creation before changes
- Support for S1 and S2 spaces
- Session management for editing

### 🤖 Project Agents System
- Dynamic AI agents for different projects
- Each agent has its own AGENT_INSTRUCTION.md
- Switch between agents on the fly
- Usage tracking and statistics
- Automatic agent loading on startup

## 🔧 Technical Improvements

- Enhanced Dev Tools menu with new options
- Improved error handling
- Better session management
- Modular architecture with new services

## 📝 Files Added/Modified

### New Files:
- `telegram-file-editor.js` - File editing service
- `project-agents.js` - Agent management system

### Modified Files:
- `enhanced-bot-buttons.js` - Integration of new features
- `README.md` - Updated documentation
- `knowledge-loader.js` - Enhanced knowledge loading

## 🚀 How to Use

### File Editor:
1. Go to Dev Tools → File Editor
2. Choose "List Files" to see available files
3. Send the full path to edit a file
4. Make your changes and save

### Project Agents:
1. Go to Dev Tools → Project Agents
2. List available agents
3. Switch to the agent you need
4. The bot will use that agent's instructions

## 🐛 Known Issues
- None reported yet

## 📅 Next Steps
- Voice message processing
- Document analysis features
- Multi-language support

---
*Pushed by AVX Copilot Development Assistant*
