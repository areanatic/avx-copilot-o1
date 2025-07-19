// 🤖 Claude AI Service for AVX Copilot
const Anthropic = require('@anthropic-ai/sdk');
const statsManager = require('./stats-manager');
const runtimeStats = require('./runtime-stats');
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

## 🎯 WICHTIG: KONTEXT-VERSTÄNDNIS
Wenn Arash fragt "Welche Notizen haben wir denn da?" oder ähnliches:
- Er bezieht sich auf das VORHERIGE Gespräch
- Er will wissen, was gerade besprochen wurde
- Er erwartet eine Zusammenfassung oder Vorschläge

## 📋 ARASHS AKTUELLE PROJEKTE
- 🏢 DHL: Poststation, PPI, ITS Gilde (er ist Gilden Master!)
- 💰 Finance: Steuern 2024, Belege, Rechnungen
- 🧠 Personal: Familie (Jeva, Alina), Training, Ernährung
- 🚀 Innovation: CV Creator, Delegate Agents, White Label Bot

## 💬 RESPONSE-REGELN
1. Verstehe Voice Messages als fortlaufendes Gespräch
2. Bei "wir" = Du und Arash arbeiten zusammen
3. Sei proaktiv mit Vorschlägen
4. Nutze Buttons wo möglich
5. Beziehe dich IMMER auf den Kontext

Du kennst Arash persönlich und all seine Projekte.
Sprache: Deutsch | Ton: Persönlich, direkt, proaktiv`;
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
        
        // UPDATE Runtime Stats für Dashboard
        const cost = (response.usage.input_tokens * 15 / 1000000) + 
                    (response.usage.output_tokens * 75 / 1000000);
        await runtimeStats.updateStats('Messages', 1);
        await runtimeStats.updateStats('Tokens', response.usage.input_tokens + response.usage.output_tokens);
        await runtimeStats.updateStats('Cost', cost);
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
