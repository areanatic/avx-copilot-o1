// voice-context-fix.js - Anleitung zur Verbesserung der Voice Message Verarbeitung

// ========================================================
// PROBLEM: Bot versteht Voice Messages nicht im Kontext
// LÖSUNG: Context-Flag und bessere Conversation History
// ========================================================

// 1. IN claude-service.js - getResponse Methode erweitern:
async getResponse(userId, message, context = {}) {
  if (!this.client) {
    return "⚠️ Claude AI ist noch nicht konfiguriert. Bitte Admin kontaktieren.";
  }

  try {
    // Hole oder erstelle Conversation History
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    
    const conversation = this.conversations.get(userId);
    
    // Voice Message Context hinzufügen
    let enhancedSystemPrompt = this.baseSystemPrompt;
    
    if (context.isVoiceMessage) {
      enhancedSystemPrompt += `\n\n## 🎙️ VOICE MESSAGE CONTEXT
Dies ist eine transkribierte Sprachnachricht von Arash.
Verstehe sie als Teil eines fortlaufenden Gesprächs.
Letzte Themen: ${context.lastTopics?.join(', ') || 'Neue Konversation'}`;
    }
    
    // Füge Knowledge Base hinzu
    if (this.knowledgeBase) {
      enhancedSystemPrompt += `\n\n## 📚 KNOWLEDGE BASE\n${this.knowledgeBase}`;
    }
    
    // Speichere User Message in History
    conversation.push({ role: 'user', content: message });
    
    // Behalte nur die letzten 10 Messages
    if (conversation.length > 10) {
      conversation.splice(0, conversation.length - 10);
    }
    
    // API Call mit History
    const response = await this.client.messages.create({
      model: this.currentModel,
      max_tokens: 1000,
      system: enhancedSystemPrompt,
      messages: conversation
    });
    
    // Speichere Assistant Response
    const assistantMessage = response.content[0].text;
    conversation.push({ role: 'assistant', content: assistantMessage });
    
    return assistantMessage;
  } catch (error) {
    console.error('Claude API Error:', error);
    return "❌ Fehler bei der AI-Verarbeitung. Bitte versuche es erneut.";
  }
}

// ========================================================
// 2. IN enhanced-bot-buttons.js - Voice Handler anpassen:
// ========================================================

// FINDE (ca. Zeile 1155):
const response = await modelSwitcher.getResponse(userId, transcribedText, systemPrompt);

// ERSETZE MIT:
// Erkenne Themen aus der Transcription
const topics = [];
if (transcribedText.toLowerCase().includes('notiz')) topics.push('Notizen');
if (transcribedText.toLowerCase().includes('projekt')) topics.push('Projekte');
if (transcribedText.toLowerCase().includes('agent')) topics.push('Agents');

// Nutze Claude Service mit Voice Context
const response = await claudeService.getResponse(userId, transcribedText, {
  isVoiceMessage: true,
  lastTopics: topics,
  duration: result.duration,
  timestamp: new Date().toISOString()
});

aiResponse = response;

// Model Info hinzufügen
const modelInfo = modelSwitcher.getModelInfo();
aiResponse += `\n\n_${modelInfo.icon} ${modelInfo.name} verwendet_`;

// ========================================================
// 3. QUICK FIX für "Welche Notizen" Problem:
// ========================================================

// IN enhanced-bot-buttons.js, nach der Transcription (ca. Zeile 1140):
// Spezielle Handler für häufige Voice-Fragen
if (transcribedText.toLowerCase().includes('welche notizen') || 
    transcribedText.toLowerCase().includes('was haben wir')) {
  
  // Hole letzte Notizen
  const userNotesManager = require('./user-notes-manager');
  const recentNotes = await userNotesManager.getRecentNotes(userId, 5);
  
  let contextResponse = `📝 **Zusammenfassung unserer Arbeit:**\n\n`;
  
  if (recentNotes.length > 0) {
    contextResponse += `**Deine letzten Notizen:**\n`;
    recentNotes.forEach((note, i) => {
      contextResponse += `${i+1}. ${note.text.substring(0, 50)}...\n`;
    });
    contextResponse += `\n`;
  }
  
  contextResponse += `**Aktuelle Projekte:**\n`;
  contextResponse += `• 🏢 DHL/Work (ITS Gilde, Poststation)\n`;
  contextResponse += `• 💰 Finance (Steuern 2024)\n`;
  contextResponse += `• 🧠 Personal (Training, Familie)\n`;
  contextResponse += `• 🚀 Innovation (CV Creator, Delegate Agents)\n\n`;
  
  contextResponse += `Was möchtest du vertiefen oder als nächstes angehen?`;
  
  await ctx.reply(contextResponse, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('📝 Notiz hinzufügen', 'smart_note'),
        Markup.button.callback('📂 Projekt wählen', 'project_switch')
      ],
      [
        Markup.button.callback('🤖 Delegate Agent', 'delegate_agent_info'),
        Markup.button.callback('📊 Dashboard', 'dashboard')
      ]
    ])
  });
  
  return; // Beende hier, keine weitere AI Verarbeitung
}

// ========================================================
// 4. DELEGATE AGENT INFO HANDLER:
// ========================================================

bot.action('delegate_agent_info', async (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    `🤖 **Delegate Agents - Deine Bots aussenden**\n\n` +
    `Ein revolutionäres Feature, mit dem du:\n\n` +
    `1. **Agents erstellen** mit spezifischen Aufgaben\n` +
    `2. **An Personen senden** via Telegram-Link\n` +
    `3. **Automatisch Infos sammeln** lassen\n` +
    `4. **Ergebnisse erhalten** in Echtzeit\n\n` +
    `**Use Cases:**\n` +
    `• Meeting-Termine finden\n` +
    `• Feedback einholen\n` +
    `• Onboarding durchführen\n` +
    `• Infos sammeln\n\n` +
    `_Status: In Konzeption (siehe DELEGATE_AGENTS_CONCEPT.md)_`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💡 Agent erstellen', 'create_delegate_agent')],
        [Markup.button.callback('📋 Konzept lesen', 'show_delegate_concept')],
        [Markup.button.callback('⬅️ Zurück', 'back_main')]
      ])
    }
  );
});

// ========================================================
// 5. PROJECT CONTEXT TRACKER:
// ========================================================

// Neue Klasse für besseres Context Management
class ConversationContextManager {
  constructor() {
    this.contexts = new Map(); // userId -> context
  }
  
  updateContext(userId, type, data) {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, {
        lastActivity: new Date(),
        currentProject: null,
        recentTopics: [],
        voiceMessages: []
      });
    }
    
    const context = this.contexts.get(userId);
    context.lastActivity = new Date();
    
    if (type === 'voice') {
      context.voiceMessages.push({
        text: data.text,
        timestamp: new Date(),
        topics: data.topics
      });
      
      // Behalte nur letzte 5 Voice Messages
      if (context.voiceMessages.length > 5) {
        context.voiceMessages.shift();
      }
    }
    
    if (type === 'project') {
      context.currentProject = data.projectId;
    }
    
    if (data.topics) {
      context.recentTopics = [...new Set([...context.recentTopics, ...data.topics])];
      // Behalte nur letzte 10 Topics
      if (context.recentTopics.length > 10) {
        context.recentTopics = context.recentTopics.slice(-10);
      }
    }
    
    return context;
  }
  
  getContext(userId) {
    return this.contexts.get(userId) || null;
  }
}

// Global initialisieren
const contextManager = new ConversationContextManager();

// In Voice Handler nutzen:
contextManager.updateContext(userId, 'voice', {
  text: transcribedText,
  topics: topics
});
