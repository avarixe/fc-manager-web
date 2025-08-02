import { MergeDeep } from "type-fest";

import { Database as DatabaseGenerated } from "@/database-generated.types";

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        competitions: {
          Row: {
            stages: CompetitionStage[];
          };
          Insert: {
            stages: CompetitionStage[];
          };
          Update: {
            stages?: CompetitionStage[];
          };
        };
        matches: {
          Row: {
            goals: MatchGoal[];
            bookings: MatchBooking[];
            changes: MatchChange[];
          };
          Insert: {
            goals: MatchGoal[];
            bookings: MatchBooking[];
            changes: MatchChange[];
          };
          Update: {
            goals?: MatchGoal[];
            bookings?: MatchBooking[];
            changes?: MatchChange[];
          };
        };
        players: {
          Row: {
            history: Record<string, PlayerHistoryData>;
            contracts: PlayerContract[];
            injuries: PlayerInjury[];
            loans: PlayerLoan[];
            transfers: PlayerTransfer[];
          };
          Insert: {
            history: Record<string, PlayerHistoryData>;
            contracts: PlayerContract[];
            injuries: PlayerInjury[];
            loans: PlayerLoan[];
            transfers: PlayerTransfer[];
          };
          Update: {
            history?: Record<string, PlayerHistoryData>;
            contracts?: PlayerContract[];
            injuries?: PlayerInjury[];
            loans?: PlayerLoan[];
            transfers?: PlayerTransfer[];
          };
        };
        squads: {
          Row: {
            formation: SquadFormation;
          };
          Insert: {
            formation: SquadFormation;
          };
          Update: {
            formation?: SquadFormation;
          };
        };
      };
      Functions: {
        get_competition_stats: {
          Returns: {
            id: number;
            name: string;
            champion: string;
            wins: number;
            draws: number;
            losses: number;
            goals_for: number;
            goals_against: number;
          }[];
        };
        get_player_stats: {
          Args: {
            player_ids: number[];
          };
          Returns: {
            player_id: string;
            competition: string;
            season: number;
            num_matches: number;
            num_minutes: number;
            num_clean_sheets: number;
            num_goals: number;
            num_assists: number;
            avg_rating: number;
          }[];
        };
      };
    };
  }
>;

interface CompetitionStage {
  name: string;
  table: {
    team: string;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    pts: number;
  }[];
  fixtures: {
    home_team: string;
    away_team: string;
    legs: {
      home_score: string;
      away_score: string;
    }[];
  }[];
}

interface MatchGoal {
  timestamp?: number;
  minute: number;
  stoppage_time?: number;
  player_name: string;
  assisted_by: string | null;
  home: boolean;
  set_piece: string | null;
  own_goal: boolean;
}

interface MatchBooking {
  timestamp?: number;
  minute: number;
  stoppage_time?: number;
  player_name: string;
  home: boolean;
  red_card: boolean;
}

interface MatchChange {
  timestamp?: number;
  minute: number;
  stoppage_time?: number;
  out: {
    name: string;
    pos: string;
  };
  in: {
    name: string;
    pos: string;
  };
  injured: boolean;
}

interface PlayerContract {
  signed_on: string | null;
  started_on: string;
  ended_on: string;
  wage: number;
  signing_bonus: number;
  release_clause: number;
  performance_bonus: number;
  bonus_req: number | null;
  bonus_req_type: string | null;
  conclusion: string | null;
}

interface PlayerInjury {
  started_on: string;
  ended_on: string;
  description: string;
}

interface PlayerLoan {
  signed_on: string | null;
  started_on: string;
  ended_on: string;
  origin: string;
  destination: string;
  wage_percentage: number;
  transfer_fee: number | null;
  addon_clause: number | null;
}

interface PlayerTransfer {
  signed_on: string | null;
  moved_on: string;
  origin: string;
  destination: string;
  fee: number;
  addon_clause: number;
}

interface PlayerHistoryData {
  ovr: number;
  value: number;
}

type SquadFormation = Record<string, number>;

// Auto-generated supabase database helper types

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
