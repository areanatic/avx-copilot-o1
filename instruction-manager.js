// ✏️ Instruction Manager - Dynamic prompt management
const fs = require('fs').promises;
const path = require('path');

class InstructionManager {
  constructor() {
    // Default instructions
    this.defaultInstruction = `Du bist AVX Copilot, Arashs persönlicher AI Assistant.

WICHTIG: Du hast Zugriff auf Arashs komplette Knowledge Base inkl.:
- Umzugsprojekt Elmshorn (Arash & Alina)
- S1 Claudia Agent Daten
- Alle aktiven Projekte
- Persönliche Informationen

Antworte IMMER basierend auf dem verfügbaren Kontext!
Wenn du über Projekte gefragt wirst, nutze die Knowledge Base.
Du kennst Arash persönlich und seine aktuellen Projekte.

Sprache: Deutsch
Ton: Persönlich, hilfsbereit, direkt`;
    
    // Current instruction
    this.currentInstruction = this.defaultInstruction;
    
    // Instruction templates
    this.templates = {
      default: {
        name: 'Standard Assistant',
        icon: '🤖',
        instruction: this.defaultInstruction
      },
      coder: {
        name: 'Code Helper',
        icon: '💻',
        instruction: `Du bist ein erfahrener Programmierer und hilfst bei Code-Fragen.
Fokus auf: Clean Code, Best Practices, Performance.
Erkläre komplexe Konzepte einfach.
Gib immer funktionierende Code-Beispiele.`
      },
      researcher: {
        name: 'Research Assistant',
        icon: '🔬',
        instruction: `Du bist ein Forschungsassistent mit Fokus auf gründliche Analyse.
Gib strukturierte, gut recherchierte Antworten.
Zitiere Quellen wenn möglich.
Stelle Rückfragen für mehr Klarheit.`
      },
      creative: {
        name: 'Creative Writer',
        icon: '✨',
        instruction: `Du bist ein kreativer Schreiber mit Fantasie.
Schreibe lebendig und fesselnd.
Nutze Metaphern und bildhafte Sprache.
Sei originell und überraschend.`
      },
      teacher: {
        name: 'Teacher',
        icon: '👨‍🏫',
        instruction: `Du bist ein geduldiger Lehrer.
Erkläre Schritt für Schritt.
Nutze Beispiele und Analogien.
Prüfe das Verständnis mit Fragen.`
      }
    };
    
    // User-specific instructions
    this.userInstructions = new Map();
    
    // Instruction history
    this.history = [];
    this.maxHistory = 10;
    
    // File paths
    this.instructionsDir = path.join(__dirname, 'instructions');
    this.currentInstructionFile = path.join(this.instructionsDir, 'current.md');
    
    this.initialize();
  }
  
  // Initialize instruction system
  async initialize() {
    try {
      // Create instructions directory if needed
      await fs.mkdir(this.instructionsDir, { recursive: true });
      
      // Load saved instruction if exists
      try {
        const saved = await fs.readFile(this.currentInstructionFile, 'utf8');
        this.currentInstruction = saved;
        console.log('✅ Loaded saved instruction');
      } catch (error) {
        // No saved instruction, use default
        await this.saveCurrentInstruction();
      }
    } catch (error) {
      console.error('❌ Error initializing instructions:', error);
    }
  }
  
  // Get current instruction
  getCurrentInstruction(userId = null) {
    // Check for user-specific instruction
    if (userId && this.userInstructions.has(userId)) {
      return this.userInstructions.get(userId);
    }
    
    return this.currentInstruction;
  }
  
  // Set instruction
  async setInstruction(newInstruction, userId = null) {
    // Validate instruction
    if (!newInstruction || newInstruction.length < 10) {
      throw new Error('Instruction too short');
    }
    
    if (newInstruction.length > 4000) {
      throw new Error('Instruction too long (max 4000 chars)');
    }
    
    // Save to history
    this.addToHistory(this.currentInstruction);
    
    if (userId) {
      // User-specific instruction
      this.userInstructions.set(userId, newInstruction);
    } else {
      // Global instruction
      this.currentInstruction = newInstruction;
      await this.saveCurrentInstruction();
    }
    
    console.log(`✏️ Instruction updated ${userId ? `for user ${userId}` : 'globally'}`);
    return { success: true, length: newInstruction.length };
  }
  
  // Use template
  async useTemplate(templateKey, userId = null) {
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`Unknown template: ${templateKey}`);
    }
    
    await this.setInstruction(template.instruction, userId);
    
    return {
      success: true,
      template: template.name,
      icon: template.icon
    };
  }
  
  // Get all templates
  getTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      key,
      name: template.name,
      icon: template.icon,
      isCurrent: template.instruction === this.currentInstruction
    }));
  }
  
  // Add custom template
  async addTemplate(key, name, icon, instruction) {
    if (this.templates[key]) {
      throw new Error('Template already exists');
    }
    
    this.templates[key] = { name, icon, instruction };
    
    // Save templates
    await this.saveTemplates();
    
    return { success: true, key };
  }
  
  // Edit instruction interactively
  startEditSession(userId) {
    const current = this.getCurrentInstruction(userId);
    
    return {
      current,
      length: current.length,
      maxLength: 4000,
      templates: this.getTemplates(),
      history: this.history.slice(0, 5)
    };
  }
  
  // Apply edit
  async applyEdit(userId, action, data) {
    switch (action) {
      case 'append':
        const current = this.getCurrentInstruction(userId);
        return await this.setInstruction(current + '\n\n' + data, userId);
        
      case 'replace':
        return await this.setInstruction(data, userId);
        
      case 'template':
        return await this.useTemplate(data, userId);
        
      case 'history':
        const historicalInstruction = this.history[data];
        if (historicalInstruction) {
          return await this.setInstruction(historicalInstruction, userId);
        }
        throw new Error('History index not found');
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // Reset to default
  async resetToDefault(userId = null) {
    if (userId) {
      this.userInstructions.delete(userId);
    } else {
      await this.setInstruction(this.defaultInstruction);
    }
    
    return { success: true, message: 'Reset to default instruction' };
  }
  
  // Save current instruction
  async saveCurrentInstruction() {
    try {
      await fs.writeFile(this.currentInstructionFile, this.currentInstruction, 'utf8');
      console.log('💾 Instruction saved');
    } catch (error) {
      console.error('❌ Error saving instruction:', error);
    }
  }
  
  // Save templates
  async saveTemplates() {
    try {
      const templatesFile = path.join(this.instructionsDir, 'templates.json');
      await fs.writeFile(templatesFile, JSON.stringify(this.templates, null, 2));
    } catch (error) {
      console.error('❌ Error saving templates:', error);
    }
  }
  
  // Add to history
  addToHistory(instruction) {
    // Don't add duplicates
    if (this.history[0] === instruction) return;
    
    this.history.unshift(instruction);
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }
  
  // Get instruction stats
  getStats() {
    return {
      currentLength: this.currentInstruction.length,
      maxLength: 4000,
      templatesCount: Object.keys(this.templates).length,
      historyCount: this.history.length,
      userSpecificCount: this.userInstructions.size
    };
  }
  
  // Format for display
  formatForDisplay(instruction = null) {
    const text = instruction || this.currentInstruction;
    const lines = text.split('\n');
    
    if (lines.length > 10) {
      return lines.slice(0, 10).join('\n') + '\n\n... (gekürzt)';
    }
    
    return text;
  }
  
  // Self-modification suggestions
  async generateImprovement(currentPerformance) {
    // This could analyze chat history and suggest improvements
    const suggestions = [
      'Füge mehr Kontext über aktuelle Projekte hinzu',
      'Verbessere die Antwortstruktur mit Bullet Points',
      'Sei proaktiver mit Vorschlägen',
      'Frage öfter nach Klarstellungen'
    ];
    
    return {
      current: this.formatForDisplay(),
      suggestions,
      performance: currentPerformance
    };
  }
}

// Singleton export
module.exports = new InstructionManager();
