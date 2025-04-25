// src/app/messages/[conversationId]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { FaArrowLeft, FaPaperPlane, FaUser } from 'react-icons/fa'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading, initialize } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [group, setGroup] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const supabase = createClient()
  
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/api/auth/login')
      return
    }
    
    if (!params.conversationId) return
    
    fetchConversation()
    fetchMessages()
    
    // Setup real-time subscription for new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${group?.id}`
      }, () => {
        fetchMessages()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [user, loading, params.conversationId, router, group?.id])
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    
    // Mark unread messages as read
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.sender_id !== user.id
      )
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages.map(msg => msg.id))
      }
    }
  }, [messages, user])

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          groups (
            id,
            name,
            logo_url,
            description
          )
        `)
        .eq('id', params.conversationId)
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      
      setGroup(data.groups)
    } catch (error) {
      console.error('Error fetching conversation:', error)
      router.push('/messages')
    }
  }

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          read,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('group_id', group?.id)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markMessagesAsRead = async (messageIds) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds)
      
      if (error) throw error
      
      // Update local state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return
    
    setIsSending(true)
    
    try {
      // Insert the new message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          group_id: group.id,
          read: false
        })
        .select()
        .single()
      
      if (messageError) throw messageError
      
      // Update conversation last_message_id and updated_at
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message_id: message.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.conversationId)
      
      if (conversationError) throw conversationError
      
      // Clear input
      setNewMessage('')
      
      // Optimistically add message to the list
      const optimisticMessage = {
        ...message,
        profiles: {
          username: profile?.username || 'You',
          avatar_url: profile?.avatar_url
        }
      }
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    
    // Check if message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a')
    }
    
    // Check if message is from yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(messageDate, 'h:mm a')}`
    }
    
    // Otherwise, show the full date
    return format(messageDate, 'MMM d, h:mm a')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 rounded-t-lg flex items-center">
        <Link href="/messages" className="mr-4">
          <FaArrowLeft className="text-gray-600" />
        </Link>
        
        {group && (
          <div className="flex items-center flex-grow">
            <div className="mr-3">
              {group.logo_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={group.logo_url}
                    alt={group.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-500" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <p className="text-xs text-gray-500 truncate max-w-md">
                {group.description || 'No description available'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-grow bg-gray-50 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === user.id
              const showDate = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString()
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                        {format(new Date(message.created_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0 mx-2">
                        {message.profiles?.avatar_url ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <Image
                              src={message.profiles.avatar_url}
                              alt={message.profiles.username || 'User'}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUser className="text-gray-500 text-sm" />
                          </div>
                        )}
                      </div>
                      
                      <div className="max-w-md">
                        <div 
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                          {formatMessageDate(message.created_at)}
                          {/* You can add read receipts here if needed */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Send a message to start the conversation with {group?.name || 'this group'}.
            </p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="bg-white p-4 rounded-b-lg border-t">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
          >
            {isSending ? (
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}