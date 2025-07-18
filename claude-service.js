// 🤖 Claude AI Service for AVX Copilot
const Anthropic = require('@anthropic-ai/sdk');
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
    
    // Token Tracking
    this.tokenCount = 0;
    this.costEstimate = 0;
    
    // Conversation Memory (pro User)
    this.conversations = new Map();
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
      
      // Token Tracking
      this.trackUsage(response.usage);
      
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
    let prompt = `Du bist AVX Copilot, ein intelligenter AI Assistant im Telegram Chat.
Du hilfst bei Entwicklung, Dokumentation, Aufgabenverwaltung und allgemeinen Fragen.
Antworte auf Deutsch, sei hilfsbereit und präzise.`;

    if (context.taskType) {
      prompt += `\n\nDer User arbeitet an einer ${context.taskType} Aufgabe.`;
    }
    
    if (context.expecting) {
      prompt += `\n\nDer User möchte: ${context.expecting}`;
    }
    
    return prompt;
  }

  // Token & Cost Tracking
  trackUsage(usage) {
    if (usage) {
      this.tokenCount += usage.input_tokens + usage.output_tokens;
      // Claude Opus: $15/1M input, $75/1M output tokens
      const inputCost = (usage.input_tokens / 1000000) * 15;
      const outputCost = (usage.output_tokens / 1000000) * 75;
      this.costEstimate += inputCost + outputCost;
      
      console.log(`📊 Tokens: ${usage.input_tokens}+${usage.output_tokens} | Kosten: $${(inputCost + outputCost).toFixed(4)}`);
    }
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

  // Status & Stats
  getStats() {
    return {
      totalTokens: this.tokenCount,
      estimatedCost: `$${this.costEstimate.toFixed(2)}`,
      activeConversations: this.conversations.size,
      isConfigured: !!this.client
    };
  }

  // Conversation Management
  clearHistory(userId) {
    this.conversations.delete(userId);
    return "✅ Conversation History gelöscht.";
  }
}

// Singleton Export
module.exports = new ClaudeService();
