import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { Database } from '@/lib/types/database.types'

export async function GET(req: NextRequest) {
  try {
    // Direct approach without cookie handling for the API route
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: () => '', set: () => {}, remove: () => {} } }
    )
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userId = session.user.id
    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversationId')
    const recipientId = url.searchParams.get('recipientId')
    const groupId = url.searchParams.get('groupId')
    
    let query = supabase
      .from('messages')
      .select('*, sender:sender_id(*), recipient:recipient_id(*)')
      .order('created_at', { ascending: true })
    
    // Filter by conversation
    if (conversationId) {
      // For a specific conversation, get all messages between these two users
      const [user1, user2] = conversationId.split('_')
      query = query.or(`and(sender_id.eq.${user1},recipient_id.eq.${user2}),and(sender_id.eq.${user2},recipient_id.eq.${user1})`)
    } else if (recipientId) {
      // Get messages with a specific recipient
      query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`)
    } else if (groupId) {
      // Get messages for a specific group
      query = query.eq('group_id', groupId)
    } else {
      // Get all conversations the user is part of (latest message for each)
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
    
    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, recipientId, groupId } = await req.json()
    
    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }
    
    // Either recipientId or groupId must be provided
    if (!recipientId && !groupId) {
      return NextResponse.json({ error: 'Either recipient or group must be specified' }, { status: 400 })
    }
    
    // Direct approach without cookie handling for the API route
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: () => '', set: () => {}, remove: () => {} } }
    )
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const senderId = session.user.id
    
    // Insert the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId || null,
        group_id: groupId || null,
        content,
        read: false
      })
      .select()
    
    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: data[0] })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}