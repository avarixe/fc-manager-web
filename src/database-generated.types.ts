export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      caps: {
        Row: {
          clean_sheet: boolean
          created_at: string
          id: number
          import_id: number | null
          kit_no: number | null
          match_id: number
          num_assists: number
          num_goals: number
          num_own_goals: number
          num_red_cards: number
          num_yellow_cards: number
          ovr: number
          player_id: number
          pos: string
          pos_order: number | null
          rating: number | null
          start_minute: number
          stop_minute: number
          user_id: string
        }
        Insert: {
          clean_sheet?: boolean
          created_at?: string
          id?: number
          import_id?: number | null
          kit_no?: number | null
          match_id: number
          num_assists?: number
          num_goals?: number
          num_own_goals?: number
          num_red_cards?: number
          num_yellow_cards?: number
          ovr: number
          player_id: number
          pos: string
          pos_order?: number | null
          rating?: number | null
          start_minute?: number
          stop_minute?: number
          user_id?: string
        }
        Update: {
          clean_sheet?: boolean
          created_at?: string
          id?: number
          import_id?: number | null
          kit_no?: number | null
          match_id?: number
          num_assists?: number
          num_goals?: number
          num_own_goals?: number
          num_red_cards?: number
          num_yellow_cards?: number
          ovr?: number
          player_id?: number
          pos?: string
          pos_order?: number | null
          rating?: number | null
          start_minute?: number
          stop_minute?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_matchId_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_playerId_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          champion: string | null
          created_at: string
          id: number
          name: string
          season: number
          stages: Json
          team_id: number
          user_id: string
        }
        Insert: {
          champion?: string | null
          created_at?: string
          id?: number
          name: string
          season: number
          stages?: Json
          team_id: number
          user_id?: string
        }
        Update: {
          champion?: string | null
          created_at?: string
          id?: number
          name?: string
          season?: number
          stages?: Json
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_teamId_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_penalty_score: number | null
          away_possession: number | null
          away_score: number
          away_team: string
          away_xg: number | null
          bookings: Json
          changes: Json
          competition: string | null
          created_at: string
          extra_time: boolean
          friendly: boolean
          goals: Json
          home_penalty_score: number | null
          home_possession: number | null
          home_result: string | null
          home_score: number
          home_team: string
          home_xg: number | null
          id: number
          import_id: number | null
          played_on: string
          season: number | null
          stage: string | null
          team_id: number
          user_id: string
        }
        Insert: {
          away_penalty_score?: number | null
          away_possession?: number | null
          away_score?: number
          away_team: string
          away_xg?: number | null
          bookings?: Json
          changes?: Json
          competition?: string | null
          created_at?: string
          extra_time?: boolean
          friendly?: boolean
          goals?: Json
          home_penalty_score?: number | null
          home_possession?: number | null
          home_result?: string | null
          home_score?: number
          home_team: string
          home_xg?: number | null
          id?: number
          import_id?: number | null
          played_on: string
          season?: number | null
          stage?: string | null
          team_id: number
          user_id?: string
        }
        Update: {
          away_penalty_score?: number | null
          away_possession?: number | null
          away_score?: number
          away_team?: string
          away_xg?: number | null
          bookings?: Json
          changes?: Json
          competition?: string | null
          created_at?: string
          extra_time?: boolean
          friendly?: boolean
          goals?: Json
          home_penalty_score?: number | null
          home_possession?: number | null
          home_result?: string | null
          home_score?: number
          home_team?: string
          home_xg?: number | null
          id?: number
          import_id?: number | null
          played_on?: string
          season?: number | null
          stage?: string | null
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_teamId_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          category: string
          created_at: string
          id: number
          user_id: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: number
          user_id?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: number
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          birth_year: number | null
          contract_ends_on: string | null
          contracts: Json
          created_at: string
          history: Json
          id: number
          import_id: number | null
          injuries: Json
          kit_no: number | null
          loans: Json
          name: string
          nationality: string | null
          ovr: number
          pos: string
          pos_order: number | null
          sec_pos: string[] | null
          status: string | null
          team_id: number
          transfers: Json
          user_id: string
          value: number
          wage: number | null
          youth: boolean
        }
        Insert: {
          birth_year?: number | null
          contract_ends_on?: string | null
          contracts?: Json
          created_at?: string
          history?: Json
          id?: number
          import_id?: number | null
          injuries?: Json
          kit_no?: number | null
          loans?: Json
          name: string
          nationality?: string | null
          ovr: number
          pos: string
          pos_order?: number | null
          sec_pos?: string[] | null
          status?: string | null
          team_id: number
          transfers?: Json
          user_id?: string
          value: number
          wage?: number | null
          youth?: boolean
        }
        Update: {
          birth_year?: number | null
          contract_ends_on?: string | null
          contracts?: Json
          created_at?: string
          history?: Json
          id?: number
          import_id?: number | null
          injuries?: Json
          kit_no?: number | null
          loans?: Json
          name?: string
          nationality?: string | null
          ovr?: number
          pos?: string
          pos_order?: number | null
          sec_pos?: string[] | null
          status?: string | null
          team_id?: number
          transfers?: Json
          user_id?: string
          value?: number
          wage?: number | null
          youth?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "players_teamId_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          formation: Json
          id: number
          name: string
          team_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          formation: Json
          id?: number
          name: string
          team_id?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          formation?: Json
          id?: number
          name?: string
          team_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_teamId_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          badge_path: string | null
          created_at: string
          currency: string
          currently_on: string
          game: string | null
          id: number
          manager_name: string | null
          name: string
          previous_id: number | null
          started_on: string
          user_id: string
        }
        Insert: {
          badge_path?: string | null
          created_at?: string
          currency?: string
          currently_on: string
          game?: string | null
          id?: number
          manager_name?: string | null
          name: string
          previous_id?: number | null
          started_on: string
          user_id?: string
        }
        Update: {
          badge_path?: string | null
          created_at?: string
          currency?: string
          currently_on?: string
          game?: string | null
          id?: number
          manager_name?: string | null
          name?: string
          previous_id?: number | null
          started_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_previousId_fkey"
            columns: ["previous_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_competition_stats: {
        Args: { team_id: number; season: number; competition: string }
        Returns: Json
      }
      get_player_stats: {
        Args: { player_ids: Json }
        Returns: Json
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
