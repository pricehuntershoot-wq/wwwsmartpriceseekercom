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
      affiliate_clicks: {
        Row: {
          clicked_at: string
          id: string
          price_id: string | null
          product_id: string | null
          product_url: string
          referrer: string | null
          shop_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          product_url: string
          referrer?: string | null
          shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          product_url?: string
          referrer?: string | null
          shop_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_discount_patterns: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          description: string
          discovered_at: string
          expected_discount: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string
          pattern_type: Database["public"]["Enums"]["discovered_discount_type"]
          shop_id: string | null
          source_url: string
          trigger_conditions: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          description: string
          discovered_at?: string
          expected_discount?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string
          pattern_type: Database["public"]["Enums"]["discovered_discount_type"]
          shop_id?: string | null
          source_url: string
          trigger_conditions?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          description?: string
          discovered_at?: string
          expected_discount?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string
          pattern_type?: Database["public"]["Enums"]["discovered_discount_type"]
          shop_id?: string | null
          source_url?: string
          trigger_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_discount_patterns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_promo_codes: {
        Row: {
          code: string | null
          confidence: Database["public"]["Enums"]["confidence_level"]
          description: string | null
          discount_percentage: number | null
          discount_value: string | null
          discovered_at: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_seen_at: string
          min_order_value: number | null
          shop_id: string | null
          source_url: string
          verified_at: string | null
        }
        Insert: {
          code?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          description?: string | null
          discount_percentage?: number | null
          discount_value?: string | null
          discovered_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string
          min_order_value?: number | null
          shop_id?: string | null
          source_url: string
          verified_at?: string | null
        }
        Update: {
          code?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          description?: string | null
          discount_percentage?: number | null
          discount_value?: string | null
          discovered_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string
          min_order_value?: number | null
          shop_id?: string | null
          source_url?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_promo_codes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_analysis_logs: {
        Row: {
          analyzed_at: string
          cart_discount_found: boolean | null
          hidden_discounts_count: number | null
          id: string
          product_condition: string | null
          product_id: string | null
          promo_code_found: boolean | null
          raw_analysis: Json | null
          shop_id: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          analyzed_at?: string
          cart_discount_found?: boolean | null
          hidden_discounts_count?: number | null
          id?: string
          product_condition?: string | null
          product_id?: string | null
          promo_code_found?: boolean | null
          raw_analysis?: Json | null
          shop_id?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          analyzed_at?: string
          cart_discount_found?: boolean | null
          hidden_discounts_count?: number | null
          id?: string
          product_condition?: string | null
          product_id?: string | null
          promo_code_found?: boolean | null
          raw_analysis?: Json | null
          shop_id?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_analysis_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_analysis_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_drop_notifications: {
        Row: {
          detected_at: string
          drop_percentage: number
          id: string
          new_price: number
          old_price: number
          premium_notified_at: string | null
          price_id: string
          product_id: string
          standard_notified_at: string | null
        }
        Insert: {
          detected_at?: string
          drop_percentage: number
          id?: string
          new_price: number
          old_price: number
          premium_notified_at?: string | null
          price_id: string
          product_id: string
          standard_notified_at?: string | null
        }
        Update: {
          detected_at?: string
          drop_percentage?: number
          id?: string
          new_price?: number
          old_price?: number
          premium_notified_at?: string | null
          price_id?: string
          product_id?: string
          standard_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_drop_notifications_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_drop_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          currency: string
          id: string
          price: number
          product_id: string
          recorded_at: string
          shop_id: string
        }
        Insert: {
          currency?: string
          id?: string
          price: number
          product_id: string
          recorded_at?: string
          shop_id: string
        }
        Update: {
          currency?: string
          id?: string
          price?: number
          product_id?: string
          recorded_at?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          currency: string
          current_price: number
          discount_label: string | null
          discount_type: string | null
          discovered_at: string
          id: string
          is_active: boolean | null
          original_price: number | null
          product_id: string
          product_url: string | null
          shop_id: string
        }
        Insert: {
          currency?: string
          current_price: number
          discount_label?: string | null
          discount_type?: string | null
          discovered_at?: string
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          product_id: string
          product_url?: string | null
          shop_id: string
        }
        Update: {
          currency?: string
          current_price?: number
          discount_label?: string | null
          discount_type?: string | null
          discovered_at?: string
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          product_id?: string
          product_url?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferred_currency: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_currency?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_currency?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          website_url?: string | null
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
      confidence_level: "low" | "medium" | "high"
      discovered_discount_type:
        | "promo_code"
        | "cart_discount"
        | "open_box"
        | "returned"
        | "refurbished"
        | "bundle"
        | "loyalty"
        | "first_purchase"
        | "newsletter"
        | "seasonal"
        | "other"
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
      confidence_level: ["low", "medium", "high"],
      discovered_discount_type: [
        "promo_code",
        "cart_discount",
        "open_box",
        "returned",
        "refurbished",
        "bundle",
        "loyalty",
        "first_purchase",
        "newsletter",
        "seasonal",
        "other",
      ],
    },
  },
} as const
