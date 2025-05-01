'use client'

import { useState } from 'react'
import { FaPaperPlane } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

interface MessageFormProps {
  recipientId?: string
  groupId?: string
  conversationId?: string
  onMessageSent?: () => void
}

export default function MessageForm({ 
  recipientId, 
  groupId, 
  conversationId,
  onMessageSent 
}: MessageFormProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuthStore()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !user) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // If we have a conversationId, make sure it exists
      if (!conversationId && !groupId && !recipientId) {
        throw new Error('Missing recipient information')
      }
      
      // Create a new conversation if needed
      let actualConversationId = conversationId
      
      if (!actualConversationId && groupId) {
        // Check if a conversation already exists
        const { data: existingConv, error: queryError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('group_id', groupId)
          .single()
          
        if (queryError && queryError.code !== 'PGRST116') { // "Not found" error code
          throw queryError
        }
        
        if (existingConv) {
          actualConversationId = existingConv.id
        } else {
          // Create a new conversation
          const { data: newConv, error: insertError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              group_id: groupId
            })
            .select()
            .single()
            
          if (insertError) throw insertError
          actualConversationId = newConv.id
        }
      }
      
      // Send the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          content: message.trim(),
          sender_id: user.id,
          recipient_id: recipientId || null,
          group_id: groupId || null,
          read: false
        })
        .select()
        .single()
      
      if (messageError) throw messageError
      
      // Update conversation last_message_id if we have one
      if (actualConversationId) {
        await supabase
          .from('conversations')
          .update({
            last_message_id: messageData.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', actualConversationId)
      }
      
      setMessage('')
      
      if (onMessageSent) {
        onMessageSent()
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      setError(error.message || 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t border-gray-200 px-4 pt-4 pb-6">
      {error && (
        <div className="mb-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="bg-blue-600 text-white p-2 rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  )
}