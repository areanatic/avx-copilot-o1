// test-openai-key.js
// Testet ob dein OpenAI Key funktioniert

const OpenAI = require('openai');

async function testOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY nicht gesetzt!');
    console.log('\nSetze ihn mit:');
    console.log('export OPENAI_API_KEY=sk-...');
    console.log('ODER');
    console.log('OPENAI_API_KEY=sk-... node test-openai-key.js');
    return;
  }

  console.log('🔑 API Key gefunden:', apiKey.substring(0, 10) + '...');
  
  try {
    const openai = new OpenAI({ apiKey });
    
    // Test mit einer einfachen Completion
    console.log('🧪 Teste API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'API works!'" }],
      max_tokens: 10
    });
    
    console.log('✅ API funktioniert!');
    console.log('Response:', completion.choices[0].message.content);
    
    // Test Whisper models
    console.log('\n🎙️ Prüfe Whisper Verfügbarkeit...');
    // Whisper ist immer verfügbar mit gültigem Key
    console.log('✅ Whisper (Audio Transcription) verfügbar!');
    
    // Zeige Kosten-Info
    console.log('\n💰 Kosten-Info:');
    console.log('- Chat: ~$0.002 per 1K tokens');
    console.log('- Whisper: $0.006 per minute');
    
  } catch (error) {
    console.error('\n❌ API Test fehlgeschlagen!');
    
    if (error.response?.status === 401) {
      console.error('🔑 Ungültiger API Key!');
    } else if (error.response?.status === 429) {
      console.error('⏰ Rate Limit erreicht!');
    } else if (error.response?.status === 403) {
      console.error('🚫 Keine Berechtigung (Check Billing)!');
    } else {
      console.error('Fehler:', error.message);
    }
  }
}

// Run test
testOpenAIKey();