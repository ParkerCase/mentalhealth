// src/app/messages/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { FaEnvelope, FaEnvelopeOpen, FaUser } from 'react-icons/fa'

export default function MessagesPage() {
  const router = useRouter()
  const { user, profile, loading, initialize } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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
    
    fetchConversations()
    
    // Setup real-time subscription for new messages
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchConversations()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(conversationsSubscription)
    }
  }, [user, loading, router])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      // Fetch conversations with the most recent message and group info
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          groups (
            id,
            name,
            logo_url
          ),
          messages (
            id,
            content,
            created_at,
            read,
            sender_id
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      // Process data to include the latest message
      const processedConversations = data.map(conversation => {
        // Sort messages by creation date (newest first)
        const sortedMessages = conversation.messages.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        
        return {
          ...conversation,
          latestMessage: sortedMessages[0] || null,
          unreadCount: sortedMessages.filter(
            msg => !msg.read && msg.sender_id !== user.id
          ).length
        }
      })
      
      setConversations(processedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className={`block p-4 hover:bg-gray-50 transition-colors ${
                  conversation.unreadCount > 0 ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {conversation.groups?.logo_url ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={conversation.groups.logo_url}
                          alt={conversation.groups.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUser className="text-gray-500 text-xl" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold text-gray-900 truncate">
                        {conversation.groups?.name || 'Unknown Group'}
                      </h3>
                      {conversation.latestMessage && (
                        <p className="text-sm text-gray-500">
                          {format(new Date(conversation.latestMessage.created_at), 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                    
                    {conversation.latestMessage ? (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.latestMessage.sender_id === user.id ? (
                          <span className="text-gray-400">You: </span>
                        ) : null}
                        {conversation.latestMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1">
                        No messages yet
                      </p>
                    )}
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex">
                        {conversation.unreadCount > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        ) : (
                          <FaEnvelopeOpen className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <FaEnvelope className="mx-auto text-gray-300 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500 mb-6">
              When you contact a group, your conversation will appear here.
            </p>
            <Link
              href="/locator"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Find Groups to Connect With
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
