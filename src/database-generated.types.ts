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
          cleanSheet: boolean
          created_at: string
          id: number
          injured: boolean
          matchId: number | null
          nextId: number | null
          numAssists: number | null
          numGoals: number
          numRedCards: number | null
          numYellowCards: number | null
          playerId: number | null
          pos: string
          rating: number | null
          startMinute: number
          stopMinute: number
          userId: string
        }
        Insert: {
          cleanSheet?: boolean
          created_at?: string
          id?: number
          injured?: boolean
          matchId?: number | null
          nextId?: number | null
          numAssists?: number | null
          numGoals?: number
          numRedCards?: number | null
          numYellowCards?: number | null
          playerId?: number | null
          pos: string
          rating?: number | null
          startMinute?: number
          stopMinute?: number
          userId?: string
        }
        Update: {
          cleanSheet?: boolean
          created_at?: string
          id?: number
          injured?: boolean
          matchId?: number | null
          nextId?: number | null
          numAssists?: number | null
          numGoals?: number
          numRedCards?: number | null
          numYellowCards?: number | null
          playerId?: number | null
          pos?: string
          rating?: number | null
          startMinute?: number
          stopMinute?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_nextId_fkey"
            columns: ["nextId"]
            isOneToOne: false
            referencedRelation: "appearances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_userId_fkey"
            columns: ["userId"]
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
          teamId: number
          userId: string
        }
        Insert: {
          champion?: string | null
          created_at?: string
          id?: number
          name: string
          season: number
          stages?: Json | null
          teamId: number
          userId?: string
        }
        Update: {
          champion?: string | null
          created_at?: string
          id?: number
          name?: string
          season?: number
          stages?: Json | null
          teamId?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          awayPenaltyScore: number | null
          awayPossession: number | null
          awayScore: number
          awayTeam: string
          awayXg: number | null
          bookings: Json | null
          competition: string | null
          created_at: string
          extraTime: boolean
          friendly: boolean
          goals: Json | null
          homePenaltyScore: number | null
          homePossession: number | null
          homeScore: number
          homeTeam: string
          homeXg: number | null
          id: number
          playedOn: string
          season: number | null
          stage: string | null
          teamId: number
          userId: string
        }
        Insert: {
          awayPenaltyScore?: number | null
          awayPossession?: number | null
          awayScore?: number
          awayTeam: string
          awayXg?: number | null
          bookings?: Json | null
          competition?: string | null
          created_at?: string
          extraTime?: boolean
          friendly?: boolean
          goals?: Json | null
          homePenaltyScore?: number | null
          homePossession?: number | null
          homeScore?: number
          homeTeam: string
          homeXg?: number | null
          id?: number
          playedOn: string
          season?: number | null
          stage?: string | null
          teamId: number
          userId?: string
        }
        Update: {
          awayPenaltyScore?: number | null
          awayPossession?: number | null
          awayScore?: number
          awayTeam?: string
          awayXg?: number | null
          bookings?: Json | null
          competition?: string | null
          created_at?: string
          extraTime?: boolean
          friendly?: boolean
          goals?: Json | null
          homePenaltyScore?: number | null
          homePossession?: number | null
          homeScore?: number
          homeTeam?: string
          homeXg?: number | null
          id?: number
          playedOn?: string
          season?: number | null
          stage?: string | null
          teamId?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birthYear: number | null
          contracts: Json | null
          created_at: string
          histories: Json | null
          id: number
          injuries: Json | null
          kitNo: number | null
          loans: Json | null
          name: string
          nationality: string | null
          ovr: number
          pos: string
          secPos: string[] | null
          status: string | null
          teamId: number
          transfers: Json | null
          userId: string
          value: number
          wage: number | null
          youth: boolean
        }
        Insert: {
          birthYear?: number | null
          contracts?: Json | null
          created_at?: string
          histories?: Json | null
          id?: number
          injuries?: Json | null
          kitNo?: number | null
          loans?: Json | null
          name: string
          nationality?: string | null
          ovr: number
          pos: string
          secPos?: string[] | null
          status?: string | null
          teamId: number
          transfers?: Json | null
          userId?: string
          value: number
          wage?: number | null
          youth?: boolean
        }
        Update: {
          birthYear?: number | null
          contracts?: Json | null
          created_at?: string
          histories?: Json | null
          id?: number
          injuries?: Json | null
          kitNo?: number | null
          loans?: Json | null
          name?: string
          nationality?: string | null
          ovr?: number
          pos?: string
          secPos?: string[] | null
          status?: string | null
          teamId?: number
          transfers?: Json | null
          userId?: string
          value?: number
          wage?: number | null
          youth?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "players_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_userId_fkey"
            columns: ["userId"]
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
          teamId: number | null
          userId: string
        }
        Insert: {
          created_at?: string
          formation: Json
          id?: number
          name: string
          teamId?: number | null
          userId?: string
        }
        Update: {
          created_at?: string
          formation?: Json
          id?: number
          name?: string
          teamId?: number | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squads_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          badgePath: string | null
          created_at: string
          currency: string
          currentlyOn: string
          game: string | null
          id: number
          managerName: string | null
          name: string
          previousId: number | null
          startedOn: string
          userId: string
        }
        Insert: {
          badgePath?: string | null
          created_at?: string
          currency?: string
          currentlyOn: string
          game?: string | null
          id?: number
          managerName?: string | null
          name: string
          previousId?: number | null
          startedOn: string
          userId?: string
        }
        Update: {
          badgePath?: string | null
          created_at?: string
          currency?: string
          currentlyOn?: string
          game?: string | null
          id?: number
          managerName?: string | null
          name?: string
          previousId?: number | null
          startedOn?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_previousId_fkey"
            columns: ["previousId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_userId_fkey"
            columns: ["userId"]
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
