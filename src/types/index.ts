import { ComboboxItem as MantineComboboxItem } from "@mantine/core";

import { Tables } from "@/database.types";

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export type Player = Tables<"players">;
export type PlayerHistoryData = Player["history"][number];
export type Contract = Player["contracts"][number];
export type Injury = Player["injuries"][number];
export type Loan = Player["loans"][number];
export type Transfer = Player["transfers"][number];
export type PlayerEvent = Contract | Injury | Loan | Transfer;

export type Match = Tables<"matches">;
export type Goal = Tables<"matches">["goals"][number];
export type Booking = Tables<"matches">["bookings"][number];
export type Change = Tables<"matches">["changes"][number];

export type Competition = Tables<"competitions">;
export type Stage = Competition["stages"][number];
export type StageTableRowData = Stage["table"][number];
export type StageFixtureData = Stage["fixtures"][number];

export type Squad = Tables<"squads">;

export interface Cap extends Tables<"caps"> {
  players: {
    name: string;
  };
}

export interface BreadcrumbItem {
  title: string;
  to: string;
}

export interface MatchFilters {
  season?: string | null;
  competition?: string;
  team?: string;
  results?: string[];
}

export type ComboboxItem<T extends object> = MantineComboboxItem & Partial<T>;
