import dayjs from "dayjs";
import { useCallback, useMemo } from "react";

import { Tables } from "@/database.types";

export const useTeamHelpers = (team: Tables<"teams"> | null) => {
  const seasonOn = useCallback(
    (date: string): number => {
      if (!team) {
        return 0;
      }

      return dayjs(date).diff(team.started_on, "year");
    },
    [team],
  );

  const currentSeason: number = useMemo(
    () => (team ? seasonOn(team.currently_on) : 0),
    [seasonOn, team],
  );

  const seasonLabel = useCallback(
    (season: number, dense = false) => {
      if (!team) {
        return "";
      }

      const start = dayjs(team.started_on).add(season, "year");
      const end = start.add(1, "year");
      return dense
        ? `${start.format("YYYY")}/${end.format("YY")}`
        : `${start.format("YYYY")} - ${end.format("YYYY")}`;
    },
    [team],
  );

  const currentYear: number = useMemo(
    () => dayjs(team?.currently_on).year(),
    [team?.currently_on],
  );

  const startOfSeason = useCallback(
    (season: number) => {
      if (!team) {
        return "";
      }

      return dayjs(team.started_on).add(season, "year").format("YYYY-MM-DD");
    },
    [team],
  );

  const endOfSeason = useCallback(
    (season: number) => startOfSeason(season + 1),
    [startOfSeason],
  );

  const endOfCurrentSeason: string = useMemo(
    () => endOfSeason(currentSeason),
    [currentSeason, endOfSeason],
  );

  return {
    seasonLabel,
    seasonOn,
    currentSeason,
    currentYear,
    startOfSeason,
    endOfSeason,
    endOfCurrentSeason,
  };
};
