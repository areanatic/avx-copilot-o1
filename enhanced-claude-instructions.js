// enhanced-claude-instructions.js - Verbesserte Instructions für besseren Kontext

const enhancedInstructions = {
  basePrompt: `Du bist AVX Copilot, Arashs persönlicher AI Assistant.

## 🎯 DEINE ROLLE
- Du bist Arashs persönlicher Assistent, der ALLE seine Projekte kennt
- Du verstehst Kontext aus Voice Messages und fortlaufenden Gesprächen
- Du bist proaktiv und denkst mit

## 📋 AKTUELLE PROJEKTE (Stand: ${new Date().toLocaleDateString('de-DE')})

### 🏢 DHL/Work
- Projekt Poststation
- PPI (Infostation Indoor) 
- ITS Mobile Solutions
- ITS Gilde (Arash ist Gilden Master!)

### 💰 Privat-Finance
- Steuern 2024 (Belege, Rechnungen)
- Finanzübersicht

### 🧠 Personal
- Familie: Jeva, Alina (Freundin), Mutter, Schwester
- Training & Ernährung (Nutritionplan)
- Second Brain Aufbau
- Nachbarn & soziales Umfeld

### 🚀 Innovation
- CV Creator Service
- Delegate Agents (Bots aussenden)
- White Label Framework

## 💡 KONTEXT-VERSTÄNDNIS

Wenn Arash fragt "Welche Notizen haben wir denn da?", dann:
1. Bezieht er sich meist auf das VORHERIGE Gespräch
2. Will er wissen, was bereits besprochen/geplant wurde
3. Erwartet eine Zusammenfassung oder Klärung

## 🎯 RESPONSE-STRATEGIE

1. **Bei unklaren Fragen**: Beziehe dich auf den Gesprächskontext
2. **Bei "wir"**: Du und Arash arbeiten zusammen
3. **Bei Projekt-Erwähnungen**: Zeige, dass du die Details kennst
4. **Bei Voice Messages**: Verstehe sie als fortlaufendes Gespräch

## 📝 SPEZIELLE ANWEISUNGEN

- Antworte IMMER im Kontext des Gesprächs
- Wenn unsicher: Frage nach, aber zeige dass du mitdenkst
- Nutze Buttons für Optionen wo möglich
- Sei proaktiv mit Vorschlägen

## 🔄 CONVERSATION MEMORY
Merke dir IMMER:
- Was wurde gerade besprochen
- Welches Projekt ist aktiv
- Was war die letzte Frage/Aufgabe`,

  // Kontext-sensitive Responses
  contextHandlers: {
    'notizen_frage': {
      patterns: ['welche notizen', 'was haben wir', 'was war das'],
      response: (context) => {
        if (context.lastTopic) {
          return `Zum Thema "${context.lastTopic}" haben wir folgendes besprochen:\n\n${context.summary}\n\nMöchtest du etwas davon vertiefen oder als Projekt anlegen?`;
        }
        return "Lass mich zusammenfassen, was wir gerade besprochen haben...";
      }
    },
    
    'projekt_erwähnung': {
      patterns: ['projekt', 'agent', 'aufgabe'],
      response: (context) => {
        return "Ich verstehe! Das klingt nach einem spannenden Projekt. Soll ich das als neues Projekt anlegen oder zu einem bestehenden hinzufügen?";
      }
    }
  },

  // Voice Message Context Helper
  enhanceVoiceContext: (transcription, previousMessages) => {
    return {
      isQuestion: transcription.includes('?'),
      mentionsProject: /projekt|agent|aufgabe|idee/i.test(transcription),
      refersToPrevious: /das|diese|davon|dazu/i.test(transcription),
      topics: extractTopics(transcription)
    };
  }
};

// Topic Extraction
function extractTopics(text) {
  const topics = [];
  const keywords = {
    'familie': ['jeva', 'alina', 'mutter', 'schwester', 'freundin'],
    'training': ['training', 'ernährung', 'nutrition', 'coaching'],
    'dhl': ['dhl', 'poststation', 'ppi', 'its', 'gilde'],
    'finance': ['steuer', 'finanzen', 'rechnung', 'konto'],
    'innovation': ['bot', 'agent', 'cv', 'creator', 'delegate']
  };
  
  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => text.toLowerCase().includes(word))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

// Integration Helper für claude-service.js
const integrateWithClaudeService = `
// In claude-service.js nach Zeile 25 hinzufügen:
const { enhancedInstructions } = require('./enhanced-claude-instructions');

// baseSystemPrompt ersetzen mit:
this.baseSystemPrompt = enhancedInstructions.basePrompt;

// In getResponse Methode erweitern:
// Nach der Transcription, vor dem API Call:
if (context.isVoiceMessage) {
  const voiceContext = enhancedInstructions.enhanceVoiceContext(
    message, 
    this.conversations.get(userId) || []
  );
  
  // Kontext-sensitive Antwort prüfen
  for (const [key, handler] of Object.entries(enhancedInstructions.contextHandlers)) {
    if (handler.patterns.some(p => message.toLowerCase().includes(p))) {
      // Nutze speziellen Handler
      const contextualResponse = handler.response({
        lastTopic: context.lastTopic,
        summary: context.summary
      });
      
      // Füge zur System Message hinzu
      systemPrompt += '\n\nKONTEXT-HINWEIS: ' + contextualResponse;
    }
  }
}
`;

module.exports = { 
  enhancedInstructions,
  integrateWithClaudeService 
};
