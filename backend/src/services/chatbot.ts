import fetch from 'node-fetch';
import supabase from './supabase';

interface ChatbotMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Service for handling chatbot functionality
 */
export class ChatbotService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }
  
  /**
   * Process a user message and generate a response
   */
  async processMessage(message: string, userId?: string): Promise<string> {
    // Check if OpenAI integration is available
    if (!this.apiKey) {
      return this.generateLocalResponse(message);
    }
    
    try {
      // Create conversation history with system prompt and user message
      const messages: ChatbotMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful assistant for a support group platform called AriseDivineMasculine. ' +
            'Your goal is to help users find support groups, understand the platform features, ' +
            'and provide general guidance on mental health resources. ' +
            'Be compassionate, understanding, and focus on directing users to the appropriate resources.'
        },
        { role: 'user', content: message }
      ];
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 200,
          temperature: 0.7
        })
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        return this.generateLocalResponse(message);
      }
      
      const botResponse = data.choices[0].message.content.trim();
      
      // Log conversation if user is authenticated
      if (userId) {
        await this.logConversation(userId, message, botResponse);
      }
      
      return botResponse;
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      return this.generateLocalResponse(message);
    }
  }
  
  /**
   * Generate a simple rule-based response when API is unavailable
   */
  private generateLocalResponse(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('group') || lowercaseMessage.includes('support')) {
      return "I can help you find support groups in your area. Could you share your city or ZIP code?";
    } else if (lowercaseMessage.includes('help') || lowercaseMessage.includes('resource')) {
      return "We offer various resources including support groups, educational materials, and professional referrals. What specific type of help are you looking for?";
    } else if (lowercaseMessage.includes('contact') || lowercaseMessage.includes('reach')) {
      return "You can contact our support team at support@arisedivinemasculine.com or visit our Contact page for more information.";
    } else {
      return "Thank you for your message. How can I assist you with finding support groups or resources today?";
    }
  }
  
  /**
   * Log conversation to the database
   */
  private async logConversation(userId: string, userMessage: string, botResponse: string): Promise<void> {
    try {
      const sessionId = new Date().getTime().toString(); // Simple session ID
      
      await supabase.from('chatbot_logs').insert({
        user_id: userId,
        session_id: sessionId,
        user_message: userMessage,
        bot_response: botResponse
      });
    } catch (error) {
      console.error('Error logging chatbot conversation:', error);
      // Continue execution even if logging fails
    }
  }
}

// Export singleton instance
export default new ChatbotService();