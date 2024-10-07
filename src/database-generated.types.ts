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
      appearances: {
        Row: {
          clean_sheet: boolean
          created_at: string
          id: number
          import_id: number | null
          injured: boolean
          match_id: number | null
          next_id: number | null
          num_assists: number
          num_goals: number
          num_red_cards: number
          num_yellow_cards: number
          ovr: number
          player_id: number | null
          pos: string
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
          injured?: boolean
          match_id?: number | null
          next_id?: number | null
          num_assists?: number
          num_goals?: number
          num_red_cards?: number
          num_yellow_cards?: number
          ovr: number
          player_id?: number | null
          pos: string
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
          injured?: boolean
          match_id?: number | null
          next_id?: number | null
          num_assists?: number
          num_goals?: number
          num_red_cards?: number
          num_yellow_cards?: number
          ovr?: number
          player_id?: number | null
          pos?: string
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
            foreignKeyName: "performances_nextId_fkey"
            columns: ["next_id"]
            isOneToOne: false
            referencedRelation: "appearances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_playerId_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          stages: Json | null
          team_id: number
          user_id: string
        }
        Insert: {
          champion?: string | null
          created_at?: string
          id?: number
          name: string
          season: number
          stages?: Json | null
          team_id: number
          user_id?: string
        }
        Update: {
          champion?: string | null
          created_at?: string
          id?: number
          name?: string
          season?: number
          stages?: Json | null
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
          {
            foreignKeyName: "competitions_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          bookings: Json | null
          competition: string | null
          created_at: string
          extra_time: boolean
          friendly: boolean
          goals: Json | null
          home_penalty_score: number | null
          home_possession: number | null
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
          bookings?: Json | null
          competition?: string | null
          created_at?: string
          extra_time?: boolean
          friendly?: boolean
          goals?: Json | null
          home_penalty_score?: number | null
          home_possession?: number | null
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
          bookings?: Json | null
          competition?: string | null
          created_at?: string
          extra_time?: boolean
          friendly?: boolean
          goals?: Json | null
          home_penalty_score?: number | null
          home_possession?: number | null
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
          {
            foreignKeyName: "matches_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          contracts: Json | null
          created_at: string
          history: Json | null
          id: number
          import_id: number | null
          injuries: Json | null
          kit_no: number | null
          loans: Json | null
          name: string
          nationality: string | null
          ovr: number
          pos: string
          pos_order: number | null
          sec_pos: string[] | null
          status: string | null
          team_id: number
          transfers: Json | null
          user_id: string
          value: number
          wage: number | null
          youth: boolean
        }
        Insert: {
          birth_year?: number | null
          contract_ends_on?: string | null
          contracts?: Json | null
          created_at?: string
          history?: Json | null
          id?: number
          import_id?: number | null
          injuries?: Json | null
          kit_no?: number | null
          loans?: Json | null
          name: string
          nationality?: string | null
          ovr: number
          pos: string
          pos_order?: number | null
          sec_pos?: string[] | null
          status?: string | null
          team_id: number
          transfers?: Json | null
          user_id?: string
          value: number
          wage?: number | null
          youth?: boolean
        }
        Update: {
          birth_year?: number | null
          contract_ends_on?: string | null
          contracts?: Json | null
          created_at?: string
          history?: Json | null
          id?: number
          import_id?: number | null
          injuries?: Json | null
          kit_no?: number | null
          loans?: Json | null
          name?: string
          nationality?: string | null
          ovr?: number
          pos?: string
          pos_order?: number | null
          sec_pos?: string[] | null
          status?: string | null
          team_id?: number
          transfers?: Json | null
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
          {
            foreignKeyName: "players_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "squads_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "teams_userId_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_player_stats: {
        Args: {
          player_ids: Json
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
