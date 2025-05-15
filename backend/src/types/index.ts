import { Database } from './database';

// Export types from Database schema
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type GroupLeader = Database['public']['Tables']['group_leaders']['Row'];
export type GroupLeaderInsert = Database['public']['Tables']['group_leaders']['Insert'];
export type GroupLeaderUpdate = Database['public']['Tables']['group_leaders']['Update'];

export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row'];
export type ContactSubmissionInsert = Database['public']['Tables']['contact_submissions']['Insert'];
export type ContactSubmissionUpdate = Database['public']['Tables']['contact_submissions']['Update'];

export type Article = Database['public']['Tables']['archives']['Row'];
export type ArticleInsert = Database['public']['Tables']['archives']['Insert'];
export type ArticleUpdate = Database['public']['Tables']['archives']['Update'];

export type ChatbotLog = Database['public']['Tables']['chatbot_logs']['Row'];
export type ChatbotLogInsert = Database['public']['Tables']['chatbot_logs']['Insert'];
export type ChatbotLogUpdate = Database['public']['Tables']['chatbot_logs']['Update'];

// Additional custom types
export interface MessageWithProfile extends Message {
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface GroupWithLeaders extends Group {
  group_leaders?: {
    id: string;
    profiles?: {
      id: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
      email?: string;
    };
  }[];
}

export interface AuthResponse {
  token?: string;
  user?: any;
  message?: string;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface GroupSearchParams {
  city?: string;
  state?: string;
  keywords?: string;
  page?: number;
  limit?: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  conversationId?: string;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  name: string;
  displayName: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox?: number[];
}

export interface AdminStats {
  totalGroups: number;
  pendingGroups: number;
  totalUsers: number;
  totalMessages: number;
  totalContacts: number;
}