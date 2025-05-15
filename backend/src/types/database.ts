// backend/src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          geo_location: { type: string; coordinates: [number, number] } | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          website: string | null
          email: string | null
          phone: string | null
          logo_url: string | null
          approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          location?: string | null
          geo_location?: { type: string; coordinates: [number, number] } | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          location?: string | null
          geo_location?: { type: string; coordinates: [number, number] } | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string | null
          group_id: string | null
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id?: string | null
          group_id?: string | null
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string | null
          group_id?: string | null
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          group_id: string
          created_at: string
          updated_at: string | null
          last_message_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          created_at?: string
          updated_at?: string | null
          last_message_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          created_at?: string
          updated_at?: string | null
          last_message_id?: string | null
        }
      }
      group_leaders: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          subject: string | null
          message: string
          user_id: string | null
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject?: string | null
          message: string
          user_id?: string | null
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string | null
          message?: string
          user_id?: string | null
          created_at?: string
          status?: string
        }
      }
      archives: {
        Row: {
          id: string
          title: string
          content: string
          category: string | null
          tags: string[] | null
          published: boolean
          featured: boolean | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category?: string | null
          tags?: string[] | null
          published?: boolean
          featured?: boolean | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string | null
          tags?: string[] | null
          published?: boolean
          featured?: boolean | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chatbot_logs: {
        Row: {
          id: string
          user_id: string
          session_id: string
          user_message: string
          bot_response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          user_message: string
          bot_response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          user_message?: string
          bot_response?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}