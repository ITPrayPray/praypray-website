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
      comment_hashtags: {
        Row: {
          comment_id: string
          hashtag_id: string
        }
        Insert: {
          comment_id: string
          hashtag_id: string
        }
        Update: {
          comment_id?: string
          hashtag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_hashtags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["comment_id"]
          },
          {
            foreignKeyName: "comment_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["hashtag_id"]
          },
        ]
      }
      comments: {
        Row: {
          comment_id: string
          content: string | null
          created_at: string | null
          images: Json | null
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_id?: string
          content?: string | null
          created_at?: string | null
          images?: Json | null
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_id?: string
          content?: string | null
          created_at?: string | null
          images?: Json | null
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "comments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      gods: {
        Row: {
          god_id: string
          god_name: string
        }
        Insert: {
          god_id?: string
          god_name: string
        }
        Update: {
          god_id?: string
          god_name?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          hashtag_id: string
          tag: string
        }
        Insert: {
          hashtag_id?: string
          tag: string
        }
        Update: {
          hashtag_id?: string
          tag?: string
        }
        Relationships: []
      }
      listing_gods: {
        Row: {
          custom_description: string | null
          god_id: string
          listing_id: string
        }
        Insert: {
          custom_description?: string | null
          god_id: string
          listing_id: string
        }
        Update: {
          custom_description?: string | null
          god_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_gods_god"
            columns: ["god_id"]
            isOneToOne: false
            referencedRelation: "gods"
            referencedColumns: ["god_id"]
          },
          {
            foreignKeyName: "fk_listing_gods_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_gods_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listing_hashtags: {
        Row: {
          hashtag_id: string
          listing_id: string
        }
        Insert: {
          hashtag_id: string
          listing_id: string
        }
        Update: {
          hashtag_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_hashtags_hashtag"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["hashtag_id"]
          },
          {
            foreignKeyName: "fk_listing_hashtags_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_hashtags_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "temple_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["hashtag_id"]
          },
          {
            foreignKeyName: "temple_hashtags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "temple_hashtags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listing_religions: {
        Row: {
          listing_id: string
          religion_id: string
        }
        Insert: {
          listing_id: string
          religion_id: string
        }
        Update: {
          listing_id?: string
          religion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_religions_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_religions_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_religions_religion"
            columns: ["religion_id"]
            isOneToOne: false
            referencedRelation: "religions"
            referencedColumns: ["religion_id"]
          },
        ]
      }
      listing_services: {
        Row: {
          custom_description: string | null
          id: string
          listing_id: string
          price: number | null
          service_id: string
        }
        Insert: {
          custom_description?: string | null
          id?: string
          listing_id: string
          price?: number | null
          service_id: string
        }
        Update: {
          custom_description?: string | null
          id?: string
          listing_id?: string
          price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_services_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details_view"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_services_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "fk_listing_services_service"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      listings: {
        Row: {
          contacts: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          google_map_link: string | null
          icon: string | null
          image_urls: Json | null
          instagram: string | null
          lat: number | null
          listing_id: string
          listing_name: string
          lng: number | null
          location: string | null
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          state_id: string | null
          status: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          tag_id: number
          updated_at: string
          website: string | null
          whatsapp: string | null
          xiaohongshu: string | null
        }
        Insert: {
          contacts?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_map_link?: string | null
          icon?: string | null
          image_urls?: Json | null
          instagram?: string | null
          lat?: number | null
          listing_id?: string
          listing_name: string
          lng?: number | null
          location?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          state_id?: string | null
          status?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tag_id: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          xiaohongshu?: string | null
        }
        Update: {
          contacts?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_map_link?: string | null
          icon?: string | null
          image_urls?: Json | null
          instagram?: string | null
          lat?: number | null
          listing_id?: string
          listing_name?: string
          lng?: number | null
          location?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          state_id?: string | null
          status?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tag_id?: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          xiaohongshu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temples_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["state_id"]
          },
        ]
      }
      plans: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          region_id: string
          region_name: string
        }
        Insert: {
          region_id?: string
          region_name: string
        }
        Update: {
          region_id?: string
          region_name?: string
        }
        Relationships: []
      }
      religions: {
        Row: {
          religion_id: string
          religion_name: string
        }
        Insert: {
          religion_id?: string
          religion_name: string
        }
        Update: {
          religion_id?: string
          religion_name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          awareness: string | null
          description: string | null
          image_urls: string[] | null
          price: number | null
          service_id: string
          service_name: string
        }
        Insert: {
          awareness?: string | null
          description?: string | null
          image_urls?: string[] | null
          price?: number | null
          service_id?: string
          service_name: string
        }
        Update: {
          awareness?: string | null
          description?: string | null
          image_urls?: string[] | null
          price?: number | null
          service_id?: string
          service_name?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          region_id: string | null
          state_id: string
          state_name: string
        }
        Insert: {
          region_id?: string | null
          state_id?: string
          state_name: string
        }
        Update: {
          region_id?: string | null
          state_id?: string
          state_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["region_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: number
          plan_id: number | null
          profile_id: string | null
          revenuecat_customer_id: string | null
          revenuecat_entitlement_id: string | null
          revenuecat_product_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          plan_id?: number | null
          profile_id?: string | null
          revenuecat_customer_id?: string | null
          revenuecat_entitlement_id?: string | null
          revenuecat_product_id?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          plan_id?: number | null
          profile_id?: string | null
          revenuecat_customer_id?: string | null
          revenuecat_entitlement_id?: string | null
          revenuecat_product_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          status: string
          tag_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          status?: string
          tag_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          status?: string
          tag_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      listing_details_view: {
        Row: {
          created_at: string | null
          description: string | null
          gods: string[] | null
          listing_id: string | null
          listing_name: string | null
          location: string | null
          religions: string[] | null
          services: string[] | null
          state_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "regular" | "temple_manager" | "professional_provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["regular", "temple_manager", "professional_provider"],
    },
  },
} as const
