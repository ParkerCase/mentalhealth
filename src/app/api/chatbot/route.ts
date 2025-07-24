import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { Database } from '@/lib/types/database.types'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Direct approach without cookie handling for the API route
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: () => '', set: () => {}, remove: () => {} } }
    )
    
    // Get the user session if available
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Generate a response based on the user's message
    // In a real app, this would call an AI service like OpenAI
    let response = ''
    
    if (message.toLowerCase().includes('group') || message.toLowerCase().includes('support')) {
      response = "I can help you find support groups in your area. Could you share your city or ZIP code?"
    } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('resource')) {
      response = "We offer various resources including support groups, educational materials, and professional referrals. What specific type of help are you looking for?"
    } else if (message.toLowerCase().includes('contact') || message.toLowerCase().includes('reach')) {
      response = "You can contact our support team at info@arisedivinemasculine.com or visit our Contact page for more information."
    } else {
      response = "Thank you for your message. How can I assist you with finding support groups or resources today?"
    }

    // Log the conversation to Supabase if user is logged in
    if (userId) {
      // Check if chatbot_logs table exists in database types before inserting
      try {
        await supabase.from('chatbot_logs').insert({
          user_id: userId,
          session_id: Date.now().toString(), // Generate a session ID
          user_message: message,
          bot_response: response,
        })
      } catch (error) {
        console.error('Error logging chatbot conversation:', error)
        // Continue even if logging fails
      }
    }

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}