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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      rms_deliveries: {
        Row: {
          assigned_at: string | null
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          id: string
          order_id: string
          pickup_at: string | null
          rider_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          order_id: string
          pickup_at?: string | null
          rider_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          order_id?: string
          pickup_at?: string | null
          rider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rms_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "rms_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rms_deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rms_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      rms_orders: {
        Row: {
          courier_partner: string | null
          courier_tracking_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_town: string | null
          delivery_type: string
          delivery_zone_id: string | null
          id: string
          item_count: number | null
          items_summary: string | null
          notes: string | null
          order_total_kes: number | null
          payment_method: string | null
          shipday_order_id: string | null
          shopify_order_id: string
          shopify_order_number: string
          shopify_raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          courier_partner?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_town?: string | null
          delivery_type: string
          delivery_zone_id?: string | null
          id?: string
          item_count?: number | null
          items_summary?: string | null
          notes?: string | null
          order_total_kes?: number | null
          payment_method?: string | null
          shipday_order_id?: string | null
          shopify_order_id: string
          shopify_order_number: string
          shopify_raw?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          courier_partner?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_town?: string | null
          delivery_type?: string
          delivery_zone_id?: string | null
          id?: string
          item_count?: number | null
          items_summary?: string | null
          notes?: string | null
          order_total_kes?: number | null
          payment_method?: string | null
          shipday_order_id?: string | null
          shopify_order_id?: string
          shopify_order_number?: string
          shopify_raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rms_orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "rms_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      rms_riders: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          national_id: string | null
          phone: string
          rating: number
          shipday_driver_id: string | null
          status: string
          total_deliveries: number
          vehicle_type: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          national_id?: string | null
          phone: string
          rating?: number
          shipday_driver_id?: string | null
          status?: string
          total_deliveries?: number
          vehicle_type?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          national_id?: string | null
          phone?: string
          rating?: number
          shipday_driver_id?: string | null
          status?: string
          total_deliveries?: number
          vehicle_type?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rms_riders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "rms_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      rms_tracking: {
        Row: {
          carrier_id: string | null
          carrier_name: string | null
          carrier_phone: string | null
          created_at: string
          id: string
          location_lat: number | null
          location_lng: number | null
          note: string | null
          order_id: string
          source: string
          status: string
        }
        Insert: {
          carrier_id?: string | null
          carrier_name?: string | null
          carrier_phone?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          note?: string | null
          order_id: string
          source?: string
          status: string
        }
        Update: {
          carrier_id?: string | null
          carrier_name?: string | null
          carrier_phone?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          note?: string | null
          order_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rms_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "rms_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rms_zones: {
        Row: {
          color: string
          created_at: string
          delivery_fee_kes: number
          id: string
          is_active: boolean
          name: string
          slug: string
          town: string
        }
        Insert: {
          color?: string
          created_at?: string
          delivery_fee_kes?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          town: string
        }
        Update: {
          color?: string
          created_at?: string
          delivery_fee_kes?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          town?: string
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
    Enums: {},
  },
} as const
