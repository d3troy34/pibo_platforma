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
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          bunny_video_id: string | null
          bunny_video_guid: string | null
          duration_seconds: number
          thumbnail_url: string | null
          resources: Json
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          bunny_video_id?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          thumbnail_url?: string | null
          resources?: Json
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          bunny_video_id?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          thumbnail_url?: string | null
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
        Relationships: []
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
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
          lesson_id: string
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
          lesson_id?: string
          progress_seconds?: number
          completed?: boolean
          completed_at?: string | null
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          is_answered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          is_answered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          is_answered?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          is_admin_reply: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          is_admin_reply?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          is_admin_reply?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"]
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"]
export type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"]
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"]

// Resource type for lessons
export type LessonResource = {
  name: string
  url: string
  type: "pdf" | "doc" | "video" | "link" | "other"
}

// Forum types
export interface ForumPost {
  id: string
  user_id: string
  title: string
  content: string
  is_answered: boolean
  created_at: string
  updated_at: string
}

export interface ForumReply {
  id: string
  post_id: string
  user_id: string
  content: string
  is_admin_reply: boolean
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface ForumPostWithAuthor extends ForumPost {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
  replies_count?: number
}

export interface ForumReplyWithAuthor extends ForumReply {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
}
