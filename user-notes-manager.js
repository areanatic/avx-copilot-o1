// user-notes-manager.js - Simples File-basiertes Note System
const fs = require('fs').promises;
const path = require('path');

class UserNotesManager {
  constructor() {
    this.dataDir = './data/users';
    this.initDataDir();
  }

  async initDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async saveNote(userId, noteText, metadata = {}) {
    const userDir = path.join(this.dataDir, userId.toString());
    await fs.mkdir(userDir, { recursive: true });
    
    const note = {
      id: Date.now(),
      text: noteText,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        wordCount: noteText.split(' ').length,
        charCount: noteText.length
      }
    };
    
    const notesFile = path.join(userDir, 'notes.json');
    const notes = await this.getAllNotes(userId);
    notes.push(note);
    
    // Backup alte Version
    if (notes.length > 1) {
      const backupFile = path.join(userDir, `notes_backup_${Date.now()}.json`);
      await fs.writeFile(backupFile, JSON.stringify(notes.slice(0, -1), null, 2));
    }
    
    await fs.writeFile(notesFile, JSON.stringify(notes, null, 2));
    return note;
  }

  async getAllNotes(userId) {
    const notesFile = path.join(this.dataDir, userId.toString(), 'notes.json');
    try {
      const data = await fs.readFile(notesFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getRecentNotes(userId, limit = 5) {
    const notes = await this.getAllNotes(userId);
    return notes.slice(-limit).reverse();
  }

  async searchNotes(userId, query) {
    const notes = await this.getAllNotes(userId);
    const lowerQuery = query.toLowerCase();
    return notes.filter(note => 
      note.text.toLowerCase().includes(lowerQuery)
    );
  }

  async deleteNote(userId, noteId) {
    // NIE wirklich löschen - nur archivieren!
    const notes = await this.getAllNotes(userId);
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
      notes[noteIndex].archived = true;
      notes[noteIndex].archivedAt = new Date().toISOString();
      
      const notesFile = path.join(this.dataDir, userId.toString(), 'notes.json');
      await fs.writeFile(notesFile, JSON.stringify(notes, null, 2));
      return true;
    }
    return false;
  }

  async getStats(userId) {
    const notes = await this.getAllNotes(userId);
    const activeNotes = notes.filter(n => !n.archived);
    
    return {
      total: notes.length,
      active: activeNotes.length,
      archived: notes.length - activeNotes.length,
      totalWords: activeNotes.reduce((sum, n) => sum + (n.metadata?.wordCount || 0), 0),
      lastNote: activeNotes[activeNotes.length - 1]?.timestamp || null
    };
  }
}

module.exports = new UserNotesManager();
