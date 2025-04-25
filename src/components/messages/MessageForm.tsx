'use client'

import { useState } from 'react'
import { FaPaperPlane } from 'react-icons/fa'

interface MessageFormProps {
  recipientId?: string
  groupId?: string
  onMessageSent?: () => void
}

export default function MessageForm({ recipientId, groupId, onMessageSent }: MessageFormProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          recipientId,
          groupId,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
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