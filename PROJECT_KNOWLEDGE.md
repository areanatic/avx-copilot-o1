# AVX Copilot o1 - Project Knowledge Base
*Automatisch gepflegt - Letztes Update: 2025-07-18 00:30*

## 🧠 SECOND BRAIN INTEGRATION KONZEPT

### Definition & Ziele
**Second Brain** = Zentrales Wissenssystem mit folgenden Komponenten:
- **Datenintegration**: Alle Agenten speisen Wissen ein
- **Lernparameter**: Selbstlernende Komponenten mit definierten Intervallen
- **Self-Service**: Autonome Wissensabfrage und -verarbeitung
- **Kontextbewusstsein**: Weiß immer, wo es läuft (ChatGPT, VS Code, etc.)

### Architektur-Prinzipien
1. **Reversibilität**: Alle Änderungen müssen rückgängig machbar sein
2. **Transparenz**: Auswirkungen von Änderungen klar dokumentiert
3. **Langzeitziel-Alignment**: Keine Änderung darf das Gesamtziel gefährden
4. **Hierarchie-Bewusstsein**:
   - Überadmin (globales Wissen)
   - Zugewiesenes Wissen (explizit)
   - Dynamisches Wissen (kontextabhängig)

### ⚠️ KRITISCHE REGELN

#### IMMER ERLAUBT (ohne Nachfrage):
✅ Gesprächsprotokolle speichern
✅ Knowledge Base aktualisieren
✅ Change Logs führen
✅ Referenzen/Pfade aktualisieren

#### NUR MIT EXPLIZITEM "GO":
❌ Code ausführen/ändern
❌ Strukturen verändern
❌ Debugging durchführen
❌ Applikationen modifizieren

---

## 📅 CHRONOLOGISCHES PROTOKOLL

### [2025-07-18 00:13] - Initiales Projekt-Briefing
**Von:** Arash
**Kontext:** Multi-Agent AI-Infrastruktur

**Kernpunkte:**
- Telegram-Bot läuft auf Railway (LIVE)
- iPhone 13 Pro Telegram-Probleme
- WhatsApp als Alternative evaluieren
- VS Code + MCP-Server Präferenz
- Agenten sollen autonom kommunizieren

**Technische Herausforderungen:**
- MCP/Cloud-Server Limits
- Mobile Stabilität erforderlich
- Sichere Agent-Kommunikation

### [2025-07-18 00:30] - Second Brain Klärung
**Von:** Arash
**Kontext:** Integration & Architektur

**Neue Erkenntnisse:**
- Second Brain = Kernkomponente
- Lernparameter noch zu definieren
- Intervall-basiertes Selbstlernen
- Head Agent Review geplant
- Kontextbewusstsein essentiell

**Offene Fragen:**
1. Wie sehen Lernparameter konkret aus?
2. Welche Intervalle für Selbst-Service?
3. Wie erfolgt Agent-zu-Second-Brain Sync?

---

## 🔧 TECHNISCHE DEPENDENCIES

### Aktueller Stack:
```
AVX Copilot o1
├── Node.js 20 (TypeScript ready)
├── Telegraf Framework
├── Railway Cloud Hosting (LIVE: @avx_copilot_o1_bot)
├── test-bot.js (Echo Bot)
└── Knowledge Base Links:
    ├── Claudia Agent Library (/Users/az/claudia/cc_agents/)
    ├── MCP Server Configs (/Users/az/claudia/src-tauri/src/)
    └── Performance Insights (Migration Context)
```

### Geplante Erweiterungen:
```
Second Brain Integration
├── Daten-Aggregation Layer
├── Lern-Algorithmus Module
├── Context-Awareness Service
├── Multi-Agent Orchestrator
└── Knowledge Sync Engine
    ├── Claudia Pattern Integration
    ├── Telegram-Optimierte Agents
    └── MCP-basierte Kommunikation
```

---

## 📍 AKTUELLER KONTEXT
**Tool:** Claude (Web Interface)
**Projekt:** /Users/az/Documents/A+/AVX/Spaces/S2/avx-copilot-o1
**Status:** Konzeptphase - Second Brain Integration
**Nächster Schritt:** Head Agent Review vorbereiten
