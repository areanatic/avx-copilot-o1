// 📝 Telegram File Editor für AVX Copilot
const fs = require('fs').promises;
const path = require('path');

class TelegramFileEditor {
  constructor() {
    this.editSessions = new Map();
    this.allowedPaths = [
      '/Users/az/Documents/A+/AVX/Spaces/S1',
      '/Users/az/Documents/A+/AVX/Spaces/S2'
    ];
  }

  // Startet Edit Session
  async startEdit(userId, filePath) {
    try {
      // Sicherheitscheck
      if (!this.isPathAllowed(filePath)) {
        return { error: 'Pfad nicht erlaubt!' };
      }

      // Lade File Content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Speichere Session
      this.editSessions.set(userId, {
        filePath,
        originalContent: content,
        newContent: content,
        startTime: new Date()
      });

      return { 
        success: true, 
        content,
        lines: content.split('\n').length,
        size: (content.length / 1024).toFixed(2) + 'KB'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Speichert Änderungen
  async saveEdit(userId, newContent) {
    const session = this.editSessions.get(userId);
    if (!session) {
      return { error: 'Keine aktive Edit-Session!' };
    }

    try {
      // Backup erstellen
      const backupPath = session.filePath + '.backup_' + Date.now();
      await fs.writeFile(backupPath, session.originalContent, 'utf8');
      
      // Neue Version speichern
      await fs.writeFile(session.filePath, newContent, 'utf8');
      
      // Session beenden
      this.editSessions.delete(userId);
      
      return { 
        success: true, 
        backupPath,
        changes: this.calculateChanges(session.originalContent, newContent)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Zeigt Diff
  calculateChanges(original, newContent) {
    const originalLines = original.split('\n');
    const newLines = newContent.split('\n');
    
    return {
      linesAdded: newLines.length - originalLines.length,
      charactersChanged: Math.abs(newContent.length - original.length),
      timestamp: new Date().toISOString()
    };
  }

  // Listet editierbare Files
  async listEditableFiles(directory) {
    const files = [];
    
    try {
      const items = await fs.readdir(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile() && (item.endsWith('.md') || item.endsWith('.txt'))) {
          files.push({
            name: item,
            path: fullPath,
            size: (stats.size / 1024).toFixed(2) + 'KB',
            modified: stats.mtime
          });
        }
      }
      
      return files;
    } catch (error) {
      return [];
    }
  }

  // Sicherheitscheck
  isPathAllowed(filePath) {
    return this.allowedPaths.some(allowed => filePath.startsWith(allowed));
  }

  // Aktive Sessions
  getActiveSession(userId) {
    return this.editSessions.get(userId);
  }
}

module.exports = new TelegramFileEditor();