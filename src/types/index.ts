import { Tables } from "@/database-generated.types";

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface Player extends Tables<"players"> {
  history: Record<string, { ovr: number; value: number }>;
  contracts: {
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
  }[];
  injuries: {
    started_on: string;
    ended_on: string;
    description: string;
  }[];
  loans: {
    signed_on: string | null;
    started_on: string;
    ended_on: string;
    origin: string;
    destination: string;
    wage_percentage: number;
    transfer_fee: number | null;
    addon_clause: number | null;
  }[];
  transfers: {
    signed_on: string | null;
    moved_on: string;
    origin: string;
    destination: string;
    fee: number;
    addon_clause: number;
  }[];
}
export type Contract = Player[PlayerEventKey.Contract][number];
export type Injury = Player[PlayerEventKey.Injury][number];
export type Loan = Player[PlayerEventKey.Loan][number];
export type Transfer = Player[PlayerEventKey.Transfer][number];
export type PlayerEvent = Contract | Injury | Loan | Transfer;

export interface Match extends Tables<"matches"> {
  goals: {
    minute: number;
    player_name: string;
    assisted_by: string | null;
    home: boolean;
    set_piece: string | null;
    own_goal: boolean;
  }[];
  bookings: {
    minute: number;
    player_name: string;
    home: boolean;
    red_card: boolean;
  }[];
}

export interface Competition extends Tables<"competitions"> {
  stages: {
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
  }[];
}

export interface Squad extends Tables<"squads"> {
  formation: Record<string, number>;
}
