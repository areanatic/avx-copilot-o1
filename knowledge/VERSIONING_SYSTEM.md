# AVX Copilot o1 - Versionierungs-System

## 📋 Versionierungs-Strategie

### 1. **Code-Versionierung**
```bash
# Bei jeder Code-Änderung:
1. Backup erstellen: code_YYYY-MM-DD_HH-MM-SS.js
2. Git commit mit beschreibender Message
3. Tag bei wichtigen Milestones: v0.1.0, v0.2.0
```

### 2. **Wissens-Versionierung**
```
/knowledge/
├── current/          # Aktuelle Version
├── archive/          # Historische Versionen
│   ├── 2025-07-18/
│   │   ├── PROJECT_PROTOCOL_v1.md
│   │   └── CONTEXT_DEPENDENCIES_v1.md
│   └── 2025-07-19/
│       └── PROJECT_PROTOCOL_v2.md
```

### 3. **Datenbank-Versionierung** (Second Brain)
```sql
-- Jede Tabelle hat:
- version_number
- created_at
- archived_at (NULL = aktiv)
- previous_version_id
```

### 4. **Konfigurations-Versionierung**
```json
{
  "version": "0.1.0",
  "changelog": [
    {
      "date": "2025-07-18",
      "changes": ["Initial config"],
      "backup": "archive/config_2025-07-18.json"
    }
  ]
}
```

## 🔄 Backup-Workflow

### Vor JEDER Änderung:
1. **Check**: Existiert Backup?
2. **Create**: `archive/[filename]_[timestamp].[ext]`
3. **Verify**: Backup vollständig?
4. **Proceed**: Erst dann Änderung durchführen

### Beispiel-Implementierung:
```javascript
// backup-manager.js
const backupFile = async (filePath) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `archive/${path.basename(filePath)}_${timestamp}`;
  await fs.copyFile(filePath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
  return backupPath;
};
```

## 📊 Versions-Tracking

### Git Tags für Releases:
- v0.1.0 - Initial Echo Bot
- v0.2.0 - Second Brain Integration
- v0.3.0 - Multi-Agent Support
- v0.4.0 - WhatsApp Integration

### Semantic Versioning:
- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

## 🚨 Rollback-Strategie

### Code Rollback:
```bash
# Option 1: Git
git checkout [commit-hash]

# Option 2: Archive
cp archive/test-bot_2025-07-18.js test-bot.js
```

### Daten Rollback:
```sql
-- Restore from version
UPDATE items SET archived_at = NULL 
WHERE version_number = 'v1.2.3';
```

## 📝 Change Log Format
```markdown
## [Version] - YYYY-MM-DD
### Added
- New features
### Changed
- Modified features
### Fixed
- Bug fixes
### Archived
- What was moved to archive (NEVER deleted!)
```
