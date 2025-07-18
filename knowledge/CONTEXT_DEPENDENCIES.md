# AVX Copilot o1 - Kontext & Abhängigkeiten

## 🔍 Aktueller Kontext
- **Platform**: Claude Desktop App
- **User**: Arash (az)
- **Projekt**: AVX Copilot o1
- **Rolle**: Entwicklungsassistent mit Protokoll-Berechtigung

## 📦 Projekt-Abhängigkeiten

### Core Dependencies
```json
{
  "telegraf": "^4.15.3",
  "dotenv": "^16.3.1"
}
```

### Bedeutung der Abhängigkeiten:
- **telegraf**: Bot-Framework für Telegram API
  - Ermöglicht Message Handling
  - WebHook/Polling Support
  - Middleware-System
  
- **dotenv**: Umgebungsvariablen-Management
  - Sichere Token-Speicherung
  - Environment-basierte Konfiguration

### Infrastructure Dependencies
- **Railway**: Cloud Hosting Platform
  - Auto-Deployment von GitHub
  - Environment Variables Management
  - 24/7 Uptime
  
- **GitHub**: Version Control
  - Code-Repository
  - CI/CD Integration mit Railway

## 🏗️ Architektur-Übersicht

```
AVX Copilot o1 (Master Bot)
├── Telegram Interface (aktuell)
├── WhatsApp Interface (geplant)
└── Second Brain Integration (konzeptionell)
    ├── Knowledge Storage
    ├── Learning Mechanisms
    └── Context Engine
```

## ⚠️ Kritische Punkte
1. **Second Brain Integration** - Definition noch ausstehend
2. **Multi-Agent Communication** - Protokoll nicht definiert
3. **Mobile Stabilität** - Telegram iOS Probleme
4. **Skalierbarkeit** - MCP/Cloud Server Limits

## 🔄 Update-Historie
- 2025-07-18: Initial-Dokumentation erstellt
- Kontext-System etabliert
- Regel-Framework implementiert
