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
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          start_date?: string
        }
        Relationships: []
      }
      travel_data_submissions: {
        Row: {
          comments: string | null
          created_at: string
          event_id: string
          id: number
          submitted_at: string
          total_hotel_nights: number | null
          user_type: Database["public"]["Enums"]["user_type_enum"]
          user_type_other_details: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          event_id: string
          id?: number
          submitted_at?: string
          total_hotel_nights?: number | null
          user_type: Database["public"]["Enums"]["user_type_enum"]
          user_type_other_details?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          event_id?: string
          id?: number
          submitted_at?: string
          total_hotel_nights?: number | null
          user_type?: Database["public"]["Enums"]["user_type_enum"]
          user_type_other_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_data_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_segments: {
        Row: {
          calculated_carbon_footprint: number | null
          carbon_compensated: boolean | null
          carbon_footprint: number | null
          comments: string | null
          created_at: string | null
          date: string | null
          destination: string | null
          distance: number | null
          frequency: number | null
          fuel_type: string | null
          fuel_type_other_details: string | null
          hotel_nights: number | null
          id: string
          origin: string | null
          passengers: number | null
          return_trip: boolean | null
          segment_order: number | null
          submission_id: number
          truck_size: string | null
          van_size: string | null
          vehicle_type: string
          vehicle_type_other_details: string | null
        }
        Insert: {
          calculated_carbon_footprint?: number | null
          carbon_compensated?: boolean | null
          carbon_footprint?: number | null
          comments?: string | null
          created_at?: string | null
          date?: string | null
          destination?: string | null
          distance?: number | null
          frequency?: number | null
          fuel_type?: string | null
          fuel_type_other_details?: string | null
          hotel_nights?: number | null
          id?: string
          origin?: string | null
          passengers?: number | null
          return_trip?: boolean | null
          segment_order?: number | null
          submission_id: number
          truck_size?: string | null
          van_size?: string | null
          vehicle_type: string
          vehicle_type_other_details?: string | null
        }
        Update: {
          calculated_carbon_footprint?: number | null
          carbon_compensated?: boolean | null
          carbon_footprint?: number | null
          comments?: string | null
          created_at?: string | null
          date?: string | null
          destination?: string | null
          distance?: number | null
          frequency?: number | null
          fuel_type?: string | null
          fuel_type_other_details?: string | null
          hotel_nights?: number | null
          id?: string
          origin?: string | null
          passengers?: number | null
          return_trip?: boolean | null
          segment_order?: number | null
          submission_id?: number
          truck_size?: string | null
          van_size?: string | null
          vehicle_type?: string
          vehicle_type_other_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_travel_segments_submission_id"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "travel_data_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      fuel_type_enum:
        | "gasoline"
        | "diesel"
        | "hybrid"
        | "pluginHybrid"
        | "electric"
      transport_type_enum:
        | "walking"
        | "bicycle"
        | "motorcycle"
        | "car"
        | "van"
        | "bus"
        | "truck"
        | "train"
        | "plane"
        | "other"
      user_type_enum:
        | "public"
        | "participant"
        | "logistics"
        | "provider"
        | "staff"
        | "other"
      van_truck_size_enum: "<7.5t" | "7.5-12t" | "20-26t" | "34-40t" | "50-60t"
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
      fuel_type_enum: [
        "gasoline",
        "diesel",
        "hybrid",
        "pluginHybrid",
        "electric",
      ],
      transport_type_enum: [
        "walking",
        "bicycle",
        "motorcycle",
        "car",
        "van",
        "bus",
        "truck",
        "train",
        "plane",
        "other",
      ],
      user_type_enum: [
        "public",
        "participant",
        "logistics",
        "provider",
        "staff",
        "other",
      ],
      van_truck_size_enum: ["<7.5t", "7.5-12t", "20-26t", "34-40t", "50-60t"],
    },
  },
} as const
