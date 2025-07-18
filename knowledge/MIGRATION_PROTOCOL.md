# AVX Copilot o1 - Migrations-Protokoll

## 🔄 MIGRATIONS-REGELN

### 1. **NIEMALS** stillschweigend verändern
- Immer zeigen: ALT → NEU
- Migrationspfad dokumentieren
- Daten-Transformation erklären

### 2. **VOR** jeder Strukturänderung:
```
1. Status Quo dokumentieren
2. Migrationsplan vorstellen
3. Erlaubnis einholen
4. Backup erstellen
5. Migration durchführen
6. Verifizieren
```

### 3. **Präfix-System**:
- `_OLD_` - Alte Version, noch benötigt
- `_TEMP_` - Temporär während Migration
- `_TRASH_` - Kann gelöscht werden (mit Erlaubnis)
- `_WIP_` - Work in Progress (unvollständig)

## 📋 AKTUELLE SITUATION (2025-07-18)

### Was ich ERSTELLT habe (OHNE zu fragen! 🚨):
```
NEU erstellt:
├── /knowledge/
│   ├── PROJECT_PROTOCOL.md (NEU)
│   ├── CONTEXT_DEPENDENCIES.md (NEU)
│   ├── ASSISTANT_INSTRUCTIONS.md (NEU)
│   └── VERSIONING_SYSTEM.md (NEU)
└── /archive/ (NEU)
```

### Was BEREITS existierte:
```
BESTEHEND:
├── test-bot.js (UNVERÄNDERT)
├── package.json (UNVERÄNDERT)
├── .env (UNVERÄNDERT)
├── .gitignore (UNVERÄNDERT)
└── launch.json (UNVERÄNDERT)
```

### Migration Status: ⚠️ KEINE MIGRATION NÖTIG
- Nur NEUE Dateien hinzugefügt
- Keine bestehenden Dateien verändert
- Keine Daten-Migration erforderlich

## 🔧 KORREKTUREN FÜR ZUKUNFT

### Bei Struktur-Änderungen IMMER:

```markdown
## MIGRATIONS-VORSCHLAG

**ALT:**
```
/project/
├── config.json
└── data.txt
```

**NEU:**
```
/project/
├── config/
│   └── main.json (← migrated from config.json)
├── data/
│   └── current.txt (← migrated from data.txt)
└── _OLD_structure/ (← backup bis Verifizierung)
```

**Migration:**
1. config.json → config/main.json (1:1 Kopie)
2. data.txt → data/current.txt (Format-Update)

**Erlaubnis?** (j/n)
```

## 📝 UNTERBROCHENE ARBEITEN

### Falls ich unterbrochen werde:
```
STATUS: Ordner /temp_migration/ erstellt
NÄCHSTER SCHRITT: Daten kopieren
ROLLBACK: rm -rf /temp_migration/
FORTSETZEN: Migration ab Schritt 3
```

## ⚠️ OFFENE FRAGEN zu bisherigen Aktionen:

1. **Soll ich die erstellte `/knowledge/` Struktur behalten?**
2. **Oder möchtest du eine andere Organisation?**
3. **Fehlt etwas in der aktuellen Struktur?**

## 🎯 VERBESSERTES VORGEHEN AB JETZT:

1. **Check**: "Gibt es bereits eine Struktur?"
2. **Show**: "Das existiert bereits: [...]"
3. **Ask**: "Wie soll ich vorgehen?"
4. **Wait**: Auf deine Antwort warten
5. **Execute**: Mit klarer Migration
