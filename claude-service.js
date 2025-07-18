// 🤖 Claude AI Service for AVX Copilot
const Anthropic = require('@anthropic-ai/sdk');
const statsManager = require('./stats-manager');
require('dotenv').config();

class ClaudeService {
  constructor() {
    if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here') {
      console.error('⚠️  WARNUNG: Claude API Key nicht konfiguriert!');
      this.client = null;
    } else {
      this.client = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY,
      });
      console.log('✅ Claude Service initialisiert');
    }
    
    // Model info
    this.currentModel = 'claude-3-opus-20240229';
    
    // Conversation Memory (pro User)
    this.conversations = new Map();
    
    // Knowledge Base
    this.knowledgeBase = '';
    this.baseSystemPrompt = `Du bist AVX Copilot, Arashs persönlicher AI Assistant.

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
  }

  // Haupt-Methode für AI Responses
  async getResponse(userId, message, context = {}) {
    if (!this.client) {
      return "⚠️ Claude AI ist noch nicht konfiguriert. Bitte Admin kontaktieren.";
    }

    try {
      // Hole oder erstelle Conversation History
      if (!this.conversations.has(userId)) {
        this.conversations.set(userId, []);
      }
      
      const history = this.conversations.get(userId);
      
      // Baue System Prompt
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Erstelle Messages Array
      const messages = [
        ...history,
        { role: 'user', content: message }
      ];
      
      // Claude API Call
      console.log(`🤖 Sende an Claude: "${message.substring(0, 50)}..."`);
      
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      });
      
      // Token Tracking mit persistentem StatsManager
      if (response.usage) {
        statsManager.trackTokens(
          response.usage.input_tokens,
          response.usage.output_tokens,
          'claude-3-opus'
        );
      }
      statsManager.trackMessage(userId, 'ai-response');
      
      // Speichere in History (begrenzt auf letzte 10 Nachrichten)
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: response.content[0].text });
      
      if (history.length > 20) {
        history.splice(0, 2); // Entferne älteste
      }
      
      this.conversations.set(userId, history);
      
      return response.content[0].text;
      
    } catch (error) {
      console.error('❌ Claude API Error:', error);
      
      if (error.status === 401) {
        return "⚠️ API Key ungültig. Bitte prüfen.";
      } else if (error.status === 429) {
        return "⚠️ Rate Limit erreicht. Bitte kurz warten.";
      } else {
        return "❌ Ein Fehler ist aufgetreten. Versuche es später nochmal.";
      }
    }
  }

  // System Prompt basierend auf Context
  buildSystemPrompt(context) {
    let prompt = this.baseSystemPrompt;
    
    // Add Knowledge Base if available
    if (this.knowledgeBase) {
      prompt += `\n\n### PROJEKT-KONTEXT UND KNOWLEDGE BASE:\n${this.knowledgeBase}`;
    }

    if (context.taskType) {
      prompt += `\n\nDer User arbeitet an einer ${context.taskType} Aufgabe.`;
    }
    
    if (context.expecting) {
      prompt += `\n\nDer User möchte: ${context.expecting}`;
    }
    
    return prompt;
  }

  // Legacy method - jetzt nutzen wir statsManager
  trackUsage(usage) {
    // Moved to statsManager
  }

  // Spezial-Funktionen
  async analyzeTask(taskDescription) {
    const prompt = `Analysiere diese Aufgabe und gib strukturiertes Feedback:
    
Aufgabe: ${taskDescription}

Bitte antworte mit:
1. Zusammenfassung (1 Satz)
2. Geschätzte Dauer
3. Empfohlene Schritte (max 5)
4. Mögliche Herausforderungen`;

    return this.getResponse('system', prompt, { taskType: 'analyse' });
  }

  async generateCode(requirements) {
    const prompt = `Erstelle Code basierend auf diesen Anforderungen:

${requirements}

Gib den Code mit Erklärungen zurück.`;

    return this.getResponse('system', prompt, { taskType: 'code' });
  }

  async summarizeDocument(text) {
    const prompt = `Fasse diesen Text prägnant zusammen:

${text.substring(0, 3000)}...

Gib eine strukturierte Zusammenfassung mit Hauptpunkten.`;

    return this.getResponse('system', prompt, { taskType: 'summary' });
  }

  // Status & Stats - jetzt mit persistenten Daten
  getStats() {
    const stats = statsManager.getCurrentStats();
    return {
      totalTokens: stats.total.tokens,
      estimatedCost: `${stats.total.cost.toFixed(2)}`,
      todayTokens: stats.today.tokens,
      todayCost: `${stats.today.cost.toFixed(2)}`,
      todayMessages: stats.today.messages,
      activeConversations: this.conversations.size,
      isConfigured: !!this.client,
      timestamp: stats.timestamp
    };
  }

  // Conversation Management
  clearHistory(userId) {
    this.conversations.delete(userId);
    return "✅ Conversation History gelöscht.";
  }
  
  // Update System Prompt with Knowledge Base
  updateSystemPrompt(knowledge) {
    this.knowledgeBase = knowledge;
    console.log('📚 Knowledge Base updated, length:', knowledge.length);
    console.log('🔍 First 200 chars:', knowledge.substring(0, 200));
  }
}

// Singleton Export
module.exports = new ClaudeService();
