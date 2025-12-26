export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_confirm_appointments: boolean | null
          can_delete_appointments: boolean | null
          can_export_data: boolean | null
          can_manage_api_keys: boolean | null
          can_manage_bot_settings: boolean | null
          can_manage_coupons: boolean | null
          can_manage_deletion_requests: boolean | null
          can_manage_invoices: boolean | null
          can_manage_services: boolean | null
          can_manage_settings: boolean | null
          can_manage_technicians: boolean | null
          can_manage_users: boolean | null
          can_view_analytics: boolean | null
          can_view_api_keys: boolean | null
          can_view_appointments: boolean | null
          can_view_bot_settings: boolean | null
          can_view_coupons: boolean | null
          can_view_deletion_requests: boolean | null
          can_view_invoices: boolean | null
          can_view_messages: boolean | null
          can_view_services: boolean | null
          can_view_settings: boolean | null
          can_view_technicians: boolean | null
          can_view_users: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_confirm_appointments?: boolean | null
          can_delete_appointments?: boolean | null
          can_export_data?: boolean | null
          can_manage_api_keys?: boolean | null
          can_manage_bot_settings?: boolean | null
          can_manage_coupons?: boolean | null
          can_manage_deletion_requests?: boolean | null
          can_manage_invoices?: boolean | null
          can_manage_services?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_technicians?: boolean | null
          can_manage_users?: boolean | null
          can_view_analytics?: boolean | null
          can_view_api_keys?: boolean | null
          can_view_appointments?: boolean | null
          can_view_bot_settings?: boolean | null
          can_view_coupons?: boolean | null
          can_view_deletion_requests?: boolean | null
          can_view_invoices?: boolean | null
          can_view_messages?: boolean | null
          can_view_services?: boolean | null
          can_view_settings?: boolean | null
          can_view_technicians?: boolean | null
          can_view_users?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_confirm_appointments?: boolean | null
          can_delete_appointments?: boolean | null
          can_export_data?: boolean | null
          can_manage_api_keys?: boolean | null
          can_manage_bot_settings?: boolean | null
          can_manage_coupons?: boolean | null
          can_manage_deletion_requests?: boolean | null
          can_manage_invoices?: boolean | null
          can_manage_services?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_technicians?: boolean | null
          can_manage_users?: boolean | null
          can_view_analytics?: boolean | null
          can_view_api_keys?: boolean | null
          can_view_appointments?: boolean | null
          can_view_bot_settings?: boolean | null
          can_view_coupons?: boolean | null
          can_view_deletion_requests?: boolean | null
          can_view_invoices?: boolean | null
          can_view_messages?: boolean | null
          can_view_services?: boolean | null
          can_view_settings?: boolean | null
          can_view_technicians?: boolean | null
          can_view_users?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          id: string
          notes: string | null
          reference_id: string | null
          service_id: string | null
          status: string | null
          technician_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          service_id?: string | null
          status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          service_id?: string | null
          status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          source: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          source?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          source?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_percent: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          request_type: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string
        }
        Relationships: []
      }
      guest_bookings: {
        Row: {
          appointment_id: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_bookings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          coupon_code: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          discount_percent: number | null
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          discount_percent?: number | null
          id?: string
          invoice_number: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          discount_percent?: number | null
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_approved: boolean | null
          is_frozen: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_frozen?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_frozen?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          features: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          is_active: boolean | null
          login_at: string | null
          logout_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          login_at?: string | null
          logout_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          login_at?: string | null
          logout_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_access: {
        Row: {
          can_apply_coupons: boolean | null
          can_book_appointments: boolean | null
          can_contact_support: boolean | null
          can_receive_notifications: boolean | null
          can_track_appointments: boolean | null
          can_update_profile: boolean | null
          can_use_chatbot: boolean | null
          can_view_invoices: boolean | null
          can_view_services: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_apply_coupons?: boolean | null
          can_book_appointments?: boolean | null
          can_contact_support?: boolean | null
          can_receive_notifications?: boolean | null
          can_track_appointments?: boolean | null
          can_update_profile?: boolean | null
          can_use_chatbot?: boolean | null
          can_view_invoices?: boolean | null
          can_view_services?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_apply_coupons?: boolean | null
          can_book_appointments?: boolean | null
          can_contact_support?: boolean | null
          can_receive_notifications?: boolean | null
          can_track_appointments?: boolean | null
          can_update_profile?: boolean | null
          can_use_chatbot?: boolean | null
          can_view_invoices?: boolean | null
          can_view_services?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "super_admin", "user"],
    },
  },
} as const
