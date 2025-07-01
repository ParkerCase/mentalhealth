import { Request, Response, NextFunction } from 'express';
import supabase from '../../services/supabase';
import { HttpError } from '../../middleware/errorHandler';
import { ConversationInsert, MessageInsert } from '../../types';

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Get conversations with group info and last message
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
        )
      `)
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });
    
    if (error) throw new HttpError(500, 'Error fetching conversations');
    
    // For each conversation, get unread message count and last message
    const conversationsWithDetails = await Promise.all((data || []).map(async (conversation) => {
      // Get last message
      const { data: lastMessageData, error: lastMessageError } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id',
          Array.isArray(conversation.groups) && conversation.groups.length > 0 && 'id' in conversation.groups[0]
            ? (conversation.groups[0] as { id: any }).id
            : undefined
        )
        .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Get unread count
      const { count: unreadCount, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id',
          Array.isArray(conversation.groups) && conversation.groups.length > 0 && 'id' in conversation.groups[0]
            ? (conversation.groups[0] as { id: any }).id
            : undefined
        )
        .eq('read', false)
        .neq('sender_id', req.user.id);
      
      return {
        ...conversation,
        lastMessage: lastMessageError ? null : lastMessageData,
        unreadCount: countError ? 0 : unreadCount || 0
      };
    }));
    
    res.status(200).json({
      conversations: conversationsWithDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a conversation by ID
 */
export const getConversationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    
    // Get conversation with group info
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description,
          logo_url
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) throw new HttpError(404, 'Conversation not found');
    
    res.status(200).json({
      conversation: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { groupId } = req.body;
    
    // Check if the group exists and is approved
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('approved', true)
      .single();
    
    if (groupError || !group) {
      throw new HttpError(404, 'Group not found or not approved');
    }
    
    // Check if a conversation already exists
    const { data: existingConversation, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('group_id', groupId)
      .maybeSingle();
    
    if (existingConversation) {
      return res.status(200).json({
        message: 'Conversation already exists',
        conversation: existingConversation
      });
    }
    
    // Create new conversation
    const conversationData: ConversationInsert = {
      user_id: req.user.id,
      group_id: groupId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();
    
    if (error) throw new HttpError(500, 'Failed to create conversation');
    
    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    
    // Get conversation to verify ownership and get group_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (convError || !conversation) {
      throw new HttpError(404, 'Conversation not found');
    }
    
    // Build query for messages
    let query = supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        read,
        profiles:sender_id (
          username,
          avatar_url
        )
      `)
      .eq('group_id',
        Array.isArray(conversation.groups) && conversation.groups.length > 0 && 'id' in conversation.groups[0]
          ? (conversation.groups[0] as { id: any }).id
          : undefined
      )
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    // Add pagination if 'before' timestamp is provided
    if (before) {
      query = query.lt('created_at', before as string);
    }
    
    const { data, error } = await query;
    
    if (error) throw new HttpError(500, 'Error fetching messages');
    
    // Automatically mark messages as read
    const unreadMessages = (data || [])
      .filter(msg => !msg.read && msg.sender_id !== req.user.id)
      .map(msg => msg.id);
    
    if (unreadMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadMessages);
    }
    
    res.status(200).json({
      messages: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { content, conversationId, groupId, recipientId } = req.body;
    
    if (!conversationId && !groupId && !recipientId) {
      throw new HttpError(400, 'Either conversationId, groupId, or recipientId is required');
    }
    
    let targetGroupId = groupId;
    let targetConversationId = conversationId;
    
    // If we have a conversationId, get the group_id
    if (conversationId) {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('group_id')
        .eq('id', conversationId)
        .single();
      
      if (error || !conversation) {
        throw new HttpError(404, 'Conversation not found');
      }
      
      targetGroupId = conversation.group_id;
    }
    // If we have a groupId but no conversationId, check if a conversation exists
    else if (groupId) {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('group_id', groupId)
        .maybeSingle();
      
      if (conversation) {
        targetConversationId = conversation.id;
      } else {
        // Create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: req.user.id,
            group_id: groupId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          throw new HttpError(500, 'Failed to create conversation');
        }
        
        targetConversationId = newConversation.id;
      }
    }
    
    // Create the message
    const messageData: MessageInsert = {
      content,
      sender_id: req.user.id,
      recipient_id: recipientId || null,
      group_id: targetGroupId || null,
      read: false,
      created_at: new Date().toISOString()
    };
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (messageError) throw new HttpError(500, 'Failed to send message');
    
    // Update conversation if we have one
    if (targetConversationId) {
      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
          last_message_id: message.id
        })
        .eq('id', targetConversationId);
    }
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
      conversationId: targetConversationId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { messageIds } = req.body;
    
    // Update messages
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', messageIds)
      .neq('sender_id', req.user.id); // Only mark others' messages as read
    
    if (error) throw new HttpError(500, 'Failed to mark messages as read');
    
    res.status(200).json({
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    // Get conversations for this user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('group_id')
      .eq('user_id', req.user.id);
    
    if (convError) throw new HttpError(500, 'Error fetching conversations');
    
    const groupIds = (conversations || []).map(c => c.group_id);
    
    if (groupIds.length === 0) {
      return res.status(200).json({ unreadCount: 0 });
    }
    
    // Count unread messages
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('group_id', groupIds)
      .eq('read', false)
      .neq('sender_id', req.user.id);
    
    if (error) throw new HttpError(500, 'Error counting unread messages');
    
    res.status(200).json({
      unreadCount: count || 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required');
    }
    
    const { id } = req.params;
    
    // Check if the message exists and belongs to the user
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !message) {
      throw new HttpError(404, 'Message not found');
    }
    
    // Only allow deletion of own messages
    if (message.sender_id !== req.user.id) {
      throw new HttpError(403, 'You can only delete your own messages');
    }
    
    // Delete the message
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) throw new HttpError(500, 'Failed to delete message');
    
    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};