// src/lib/types/index.ts
import { Database } from './database.types';
import { User, Session } from '@supabase/supabase-js';

// Profile Types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Group Types
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];

// Message Types
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Article Type (for Archives)
export interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  published: boolean;
  featured?: boolean;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

// Conversation Type
export interface Conversation {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
  updated_at?: string;
  last_message_id?: string;
  groups?: Group;
}

// Message with Profile Type
export interface MessageWithProfile extends Message {
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

// ChatMessage Type for the chatbot
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Auth related types
export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
}

// Group leader type
export interface GroupLeader {
  id: string;
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

// Group with Leaders
export interface GroupWithLeaders extends Group {
  group_leaders?: GroupLeader[];
}

// Search Parameters for Group Locator
export interface GroupSearchParams {
  city: string;
  state: string;
  keywords: string;
}

// Contact Form Data
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Group Form Data
export interface GroupFormData {
  name: string;
  description: string;
  location?: string;
  address?: string;
  city: string;
  state: string;
  zip: string;
  website?: string;
  email: string;
  phone?: string;
}