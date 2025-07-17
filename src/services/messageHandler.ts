// AVX Copilot o1 - Message Handler
import { Context } from 'telegraf';
import { processWithAI } from './aiService';

export async function handleMessage(ctx: Context) {
  if (!ctx.message || !('text' in ctx.message)) return;
  
  const message = ctx.message.text;
  const userId = ctx.from?.id;
  
  // Typing indicator
  await ctx.sendChatAction('typing');
  
  try {
    // Process with AI
    const response = await processWithAI(message, userId);
    
    // Send response
    await ctx.reply(response, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Message handling error:', error);
    await ctx.reply('Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es erneut.');
  }
}
