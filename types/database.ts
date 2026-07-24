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
          goal: string | null
          target_university: string | null
          target_arrival_date: string | null
          onboarding_completed_at: string | null
          notification_preferences: Json
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
          goal?: string | null
          target_university?: string | null
          target_arrival_date?: string | null
          onboarding_completed_at?: string | null
          notification_preferences?: Json
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
          goal?: string | null
          target_university?: string | null
          target_arrival_date?: string | null
          onboarding_completed_at?: string | null
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_directory: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: "student" | "admin"
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role: "student" | "admin"
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: "student" | "admin"
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          bunny_video_guid: string | null
          duration_seconds: number
          resources: Json
          order_index: number
          is_published: boolean
          published_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          thumbnail_url?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          resources?: Json
          order_index?: number
          is_published?: boolean
          published_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          bunny_video_guid?: string | null
          duration_seconds?: number
          resources?: Json
          order_index?: number
          is_published?: boolean
          published_at?: string | null
          created_by?: string | null
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
          payment_status: "pending" | "completed" | "failed" | "refunded" | "revoked"
          amount_usd: number
          currency: string
          amount_local: number | null
          payment_method: string | null
          country: string | null
          enrolled_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_provider: "stripe" | "dlocal" | "manual"
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded" | "revoked"
          amount_usd?: number
          currency?: string
          amount_local?: number | null
          payment_method?: string | null
          country?: string | null
          enrolled_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_provider?: "stripe" | "dlocal" | "manual"
          payment_id?: string | null
          payment_status?: "pending" | "completed" | "failed" | "refunded" | "revoked"
          amount_usd?: number
          currency?: string
          amount_local?: number | null
          payment_method?: string | null
          country?: string | null
          enrolled_at?: string
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
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          }
        ]
      }
      community_messages: {
        Row: {
          id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_directory"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          category: "general" | "documents" | "universities" | "life_in_argentina"
          created_by: string
          created_at: string
          published_at: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category?: "general" | "documents" | "universities" | "life_in_argentina"
          created_by: string
          created_at?: string
          published_at?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: "general" | "documents" | "universities" | "life_in_argentina"
          created_by?: string
          created_at?: string
          published_at?: string | null
          is_active?: boolean
          updated_at?: string
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
          full_name: string | null
          token_hash: string
          invited_by: string | null
          accepted_by: string | null
          accepted_at: string | null
          purchase_event_id: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          token_hash: string
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          purchase_event_id?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          token_hash?: string
          invited_by?: string | null
          accepted_by?: string | null
          accepted_at?: string | null
          purchase_event_id?: string | null
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
      get_course_modules_outline: {
        Args: Record<string, never>
        Returns: Array<{
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          order_index: number
          is_published: boolean
          can_access: boolean
          is_locked: boolean
          has_video: boolean
          duration_seconds: number
        }>
      }
      get_unread_message_count: {
        Args: Record<string, never>
        Returns: number
      }
      mark_message_read: {
        Args: { message_id: string }
        Returns: undefined
      }
      accept_invitation: {
        Args: {
          invitation_token_hash: string
          invited_user_id: string
        }
        Returns: boolean
      }
      provision_purchase: {
        Args: {
          purchase_email: string
          purchase_full_name: string
          purchase_provider: "stripe" | "dlocal" | "manual"
          purchase_event_id: string
          purchase_payment_id: string
          purchase_amount: number
          purchase_amount_usd: number
          purchase_currency: string
          purchase_invitation_token_hash: string
          purchase_invitation_expires_at: string
          purchase_payload?: Json
        }
        Returns: Json
      }
      claim_purchase_email: {
        Args: {
          purchase_provider: "stripe" | "dlocal" | "manual"
          purchase_event_id: string
        }
        Returns: Json
      }
      complete_purchase_email: {
        Args: {
          purchase_provider: "stripe" | "dlocal" | "manual"
          purchase_event_id: string
          purchase_email_provider_id: string
        }
        Returns: boolean
      }
      fail_purchase_email: {
        Args: {
          purchase_provider: "stripe" | "dlocal" | "manual"
          purchase_event_id: string
          purchase_error_code: string
        }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: {
          limit_rate_key: string
          limit_request_count: number
          limit_window_seconds: number
        }
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
export type CommunityMessage = Database["public"]["Tables"]["community_messages"]["Row"]
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"]

// Resource type for modules
export type ModuleResource = {
  name: string
  // Preferred: storage path inside Supabase Storage bucket (private + signed URLs).
  path?: string
  bucket?: string

  // Legacy: public URL (deprecated). Keep for backwards compatibility with old rows.
  url?: string
  type: "pdf" | "doc" | "video" | "link" | "other"
}

// Direct Message types
export interface DirectMessageWithSender extends DirectMessage {
  sender: Pick<
    Database["public"]["Tables"]["profile_directory"]["Row"],
    "id" | "full_name" | "avatar_url" | "role"
  >
}

export interface CommunityMessageWithSender extends CommunityMessage {
  sender: Pick<
    Database["public"]["Tables"]["profile_directory"]["Row"],
    "id" | "full_name" | "avatar_url" | "role"
  >
}
