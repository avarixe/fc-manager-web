import { Tables } from "@/database-generated.types";

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
    (season: number) => {
      if (!team) {
        return "";
      }

      const start = dayjs(team.started_on).add(season, "year");
      const end = start.add(1, "year");
      return `${start.format("YYYY")} - ${end.format("YYYY")}`;
    },
    [team],
  );

  const currentYear: number = useMemo(
    () => dayjs(team?.currently_on).year(),
    [team?.currently_on],
  );

  const endOfCurrentSeason: string = useMemo(
    () =>
      dayjs(team?.started_on)
        .add(currentSeason + 1, "year")
        .format("YYYY-MM-DD"),
    [currentSeason, team?.started_on],
  );

  return {
    seasonLabel,
    seasonOn,
    currentSeason,
    currentYear,
    endOfCurrentSeason,
  };
};
