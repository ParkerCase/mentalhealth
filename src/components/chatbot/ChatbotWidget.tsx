// src/components/chatbot/ChatbotWidget.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { FaComment, FaTimes, FaPaperPlane } from 'react-icons/fa'
import { supabase } from '@/lib/supabase/client'
import { ChatMessage } from '@/lib/types'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m here to help you connect with groups in your area and provide mental health support. How can I assist you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call the chatbot API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get chatbot response');
      }
      
      const data = await response.json();
      
      const botResponse: ChatMessage = { 
        role: 'assistant', 
        content: data.response 
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again later.'
      }
      setMessages(prevMessages => [...prevMessages, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const chatWindowClassName = isMobile 
    ? "fixed inset-x-4 bottom-20 top-20 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
    : "absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden";

  return (
    <div className={`fixed z-50 ${isMobile ? 'bottom-4 right-4' : 'bottom-4 right-4'}`}>
      {/* Coming Soon Label */}
      <div className="absolute -top-8 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10">
        Coming Soon
      </div>
      
      {/* Chat toggle button - disabled */}
      <button
        onClick={() => {}} // Disabled functionality
        className={`bg-gray-400 text-white rounded-full shadow-lg cursor-not-allowed transition-colors touch-manipulation ${
          isMobile ? 'p-4 w-14 h-14' : 'p-3 w-12 h-12'
        } flex items-center justify-center relative`}
        aria-label="Chatbot coming soon"
        disabled
      >
        <FaComment className={isMobile ? 'text-xl' : 'text-base'} />
      </button>

      {/* Chat window - Coming Soon */}
      {/* 
      {isOpen && (
        <>
          <div className={chatWindowClassName}>
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium">Mental Health Support Assistant</h3>
              <button 
                onClick={toggleChatbot} 
                className="text-white hover:text-gray-200 p-1 touch-manipulation"
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4 text-center text-gray-500">
              <p>Chatbot functionality coming soon!</p>
            </div>
          </div>
        </>
      )}
      */}
    </div>
  )
}