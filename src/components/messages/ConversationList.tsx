'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaUser, FaCircle } from 'react-icons/fa'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

interface Conversation {
  id: string
  otherUser: {
    id: string
    username: string
    avatar_url: string | null
  }
  lastMessage: {
    content: string
    created_at: string
    unread: boolean
  }
}

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          setError('You must be logged in to view conversations')
          setLoading(false)
          return
        }
        
        const userId = session.user.id
        
        // Get all messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*, sender:sender_id(*), recipient:recipient_id(*)')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
        
        if (messagesError) throw messagesError
        
        // Group messages by conversation
        const conversationsMap = new Map()
        
        messages?.forEach((message: any) => {
          const isUserSender = message.sender_id === userId
          const otherUserId = isUserSender ? message.recipient_id : message.sender_id
          const otherUser = isUserSender ? message.recipient : message.sender
          
          // Skip if no other user (like in a group chat with no recipient)
          if (!otherUserId || !otherUser) return
          
          const conversationId = [userId, otherUserId].sort().join('_')
          
          if (!conversationsMap.has(conversationId)) {
            conversationsMap.set(conversationId, {
              id: conversationId,
              otherUser: {
                id: otherUserId,
                username: otherUser.username || 'User',
                avatar_url: otherUser.avatar_url
              },
              lastMessage: {
                content: message.content,
                created_at: message.created_at,
                unread: !message.read && !isUserSender
              }
            })
          }
        })
        
        setConversations(Array.from(conversationsMap.values()))
      } catch (err: any) {
        console.error('Error fetching conversations:', err)
        setError(err.message || 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }
    
    fetchConversations()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        {error}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No conversations yet.</p>
        <p className="mt-2 text-sm">Start a new conversation by connecting with groups or users.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => (
        <Link 
          key={conversation.id} 
          href={`/messages/${conversation.id}`}
          className="flex items-center p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="relative flex-shrink-0">
            {conversation.otherUser.avatar_url ? (
              <Image
                src={conversation.otherUser.avatar_url}
                alt={conversation.otherUser.username}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <FaUser className="text-gray-500" size={20} />
              </div>
            )}
            {conversation.lastMessage.unread && (
              <div className="absolute top-0 right-0">
                <FaCircle className="text-blue-500" size={12} />
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-grow">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-900">{conversation.otherUser.username}</h3>
              <span className="text-xs text-gray-500">
                {format(new Date(conversation.lastMessage.created_at), 'MMM d')}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {conversation.lastMessage.content}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}