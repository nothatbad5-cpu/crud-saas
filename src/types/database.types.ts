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
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'pending' | 'completed'
          created_at: string
          updated_at: string
          is_sample: boolean
          due_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
          is_sample?: boolean
          due_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
          is_sample?: boolean
          due_date?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          onboarding_completed: boolean
          sample_seeded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          onboarding_completed?: boolean
          sample_seeded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          onboarding_completed?: boolean
          sample_seeded?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          status?: string
          current_period_end?: string
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
