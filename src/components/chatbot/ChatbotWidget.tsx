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
      {/* Chat toggle button */}
      <button
        onClick={toggleChatbot}
        className={`bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors touch-manipulation ${
          isMobile ? 'p-4 w-14 h-14' : 'p-3 w-12 h-12'
        } flex items-center justify-center`}
        aria-label="Toggle chatbot"
      >
        {isOpen ? <FaTimes className={isMobile ? 'text-xl' : 'text-base'} /> : <FaComment className={isMobile ? 'text-xl' : 'text-base'} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <>
          {/* Mobile overlay */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={toggleChatbot}
            />
          )}
          
          {/* Chat window */}
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
            
            <div className={`overflow-y-auto p-4 ${isMobile ? 'h-[calc(100vh-200px)]' : 'h-80'}`}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-blue-100 text-blue-800 ml-auto'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block p-3 rounded-lg bg-gray-100 text-gray-800">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
                  disabled={isLoading}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 touch-manipulation min-w-[44px] flex items-center justify-center"
                  disabled={isLoading || !input.trim()}
                >
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}