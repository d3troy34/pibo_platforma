export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          country: string | null
          phone: string | null
          avatar_url: string | null
          role: "student" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          country?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "student" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          country?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "student" | "admin"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          bunny_video_guid: string | null
          duration_seconds: number
          resources: Json
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          resources?: Json
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          resources?: Json
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          payment_provider: "stripe" | "dlocal" | "manual"
          payment_id: string | null
          payment_status: "pending" | "completed" | "failed" | "refunded"
          amount_usd: number
          currency: string
          amount_local: number | null
          payment_method: string | null
          country: string | null
          enrolled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_provider: "stripe" | "dlocal" | "manual"
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded"
          amount_usd: number
          currency: string
          amount_local?: number | null
          payment_method?: string | null
          country?: string | null
          enrolled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_provider?: "stripe" | "dlocal" | "manual"
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded"
          amount_usd?: number
          currency?: string
          amount_local?: number | null
          payment_method?: string | null
          country?: string | null
          enrolled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_messages: {
        Row: {
          id: string
          student_id: string
          sender_id: string
          message: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          sender_id: string
          message: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          sender_id?: string
          message?: string
          created_at?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          created_by: string
          created_at: string
          published_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_by: string
          created_at?: string
          published_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_by?: string
          created_at?: string
          published_at?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      module_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          progress_seconds: number
          completed: boolean
          completed_at: string | null
          last_watched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          progress_seconds?: number
          completed?: boolean
          completed_at?: string | null
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          progress_seconds?: number
          completed?: boolean
          completed_at?: string | null
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          email: string
          token: string
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          token: string
          invited_by?: string | null
          accepted_at?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          token?: string
          invited_by?: string | null
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_enrolled: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Module = Database["public"]["Tables"]["modules"]["Row"]
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"]
export type ModuleProgress = Database["public"]["Tables"]["module_progress"]["Row"]
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"]
export type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"]
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"]

// Resource type for modules
export type ModuleResource = {
  name: string
  url: string
  type: "pdf" | "doc" | "video" | "link" | "other"
}

// Direct Message types
export interface DirectMessageWithSender extends DirectMessage {
  sender: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
}

export interface DirectMessageWithStudent extends DirectMessage {
  student: Pick<Profile, "id" | "full_name" | "avatar_url">
}

// Announcement types
export interface AnnouncementWithAuthor extends Announcement {
  author: Pick<Profile, "id" | "full_name" | "avatar_url">
}
