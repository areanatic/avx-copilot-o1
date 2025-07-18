# 🎯 AVX Copilot - Claude Instruction Prompt

## 🔄 Trigger: `/cp_update`

### 📍 AKTUELLER STAND (2025-07-18)

**Projekte:**
- **v1**: `/avx-copilot-o1` - Enhanced Bot mit Buttons (Railway deployed)
- **v2**: `/avx-copilot-v2` - Multi-Agent mit Token Router (MVP fertig)

**Live Bot**: @avx_copilot_o1_bot (Telegram)

### 🧠 KERN-KONZEPTE

1. **Second Brain Architecture**
   - Online-First (Supabase/Cloud)
   - Versionierung ALLES
   - NIE löschen, immer archivieren

2. **Token-Optimierung (3-Tier)**
   - Tier 1: Haiku ($0.25/1M) - Simple
   - Tier 2: Groq ($0.10/1M) - Bulk
   - Tier 3: Opus ($15/1M) - Complex

3. **Multi-Agent System**
   - MasterAgent → Router
   - Spezialisierte Agents
   - LangGraph Integration (geplant)

### 🛠️ ARBEITSWEISE

**Bei Code-Änderungen:**
- IMMER fragen vor Änderungen
- Migration-Pfad zeigen (ALT → NEU)
- Kleine Häppchen (Context-Management)
- Backup vor jeder Änderung

**Bei Problemen:**
1. Status prüfen
2. Lokaler Test
3. Railway Logs
4. GitHub Sync

### 🚀 QUICK COMMANDS

```bash
# v1 Bot (Aktuell Live)
cd /avx-copilot-o1 && npm start

# v2 Bot (Neuer MVP)
cd /avx-copilot-v2 && npm start

# Railway Deploy
git add . && git commit -m "Update" && git push
```

### 💡 FOKUS-BEREICHE

**Holistisch denken bei:**
- Architektur-Entscheidungen
- Kosten-Optimierung
- Skalierbarkeit

**Detail-Fokus bei:**
- API-Integration
- Error Handling
- User Experience

### 🔗 WICHTIGE LINKS

- Railway: https://railway.app/dashboard
- GitHub: https://github.com/areanatic/avx-copilot-o1
- Claude API: https://console.anthropic.com
- Groq API: https://console.groq.com

### ⚡ NÄCHSTE SCHRITTE

1. Railway Cache-Problem lösen
2. API Keys für v2 besorgen
3. WhatsApp Integration evaluieren
4. Voice Features planen

---

**REMEMBER**: 
- User = Arash
- Ziel = JARVIS-ähnliches System
- Approach = Pragmatisch & Skalierbar
