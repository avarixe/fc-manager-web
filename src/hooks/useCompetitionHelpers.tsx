import { StageFixtureData } from "@/types";
import { orderBy } from "lodash-es";

export const useCompetitionHelpers = () => {
  const competition = useAtomValue(competitionAtom);

  const groupStages = useMemo(
    () => competition?.stages?.filter((stage) => stage.table.length > 0) ?? [],
    [competition],
  );

  const knockoutStages = useMemo(
    () =>
      competition?.stages?.filter((stage) => stage.fixtures.length > 0) ?? [],
    [competition],
  );

  const team = useAtomValue(teamAtom)!;
  const getTeamColor = useCallback(
    (name: string | null) => {
      if (!name || !competition) {
        return "";
      }

      if (name === competition.champion) {
        return "text-amber";
      } else if (name === team.name) {
        return "text-blue";
      } else {
        return "";
      }
    },
    [competition, team],
  );

  const scoreDiff = useCallback((fixture: StageFixtureData) => {
    let homeScore = 0;
    let awayScore = 0;

    const scoreRegex = /^(\d+)(?: \((\d+)\))?$/;
    fixture.legs.forEach((leg) => {
      if (!leg.home_score || !leg.away_score) {
        return;
      }

      const [, homeLegScore, homePenScore] =
        scoreRegex.exec(leg.home_score) || [];
      const [, awayLegScore, awayPenScore] =
        scoreRegex.exec(leg.away_score) || [];

      if (homePenScore && awayPenScore) {
        homeScore = parseInt(homePenScore);
        awayScore = parseInt(awayPenScore);
      } else {
        homeScore += parseInt(homeLegScore);
        awayScore += parseInt(awayLegScore);
      }
    });

    return homeScore - awayScore;
  }, []);

  const groupStageAdvances = useCallback(
    (numAdvancesPerGroup: number) => {
      return groupStages.reduce((teams: string[], stage) => {
        const teamNames = orderBy(stage.table, "pts", "desc").map(
          (row) => row.team,
        );
        return [...teams, ...teamNames.slice(0, numAdvancesPerGroup)];
      }, []);
    },
    [groupStages],
  );

  const knockoutStageAdvances = useCallback(
    (knockoutStageIndex: number) => {
      return knockoutStages[knockoutStageIndex].fixtures.reduce(
        (teams: string[], fixture) => {
          const diff = scoreDiff(fixture);
          if (diff > 0) {
            teams.push(fixture.home_team);
          } else if (diff < 0) {
            teams.push(fixture.away_team);
          } else {
            teams.push(fixture.home_team, fixture.away_team);
          }
          return teams;
        },
        [],
      );
    },
    [knockoutStages, scoreDiff],
  );

  const teamsFromPrevousStage = useCallback(
    (knockoutStageIndex: number) => {
      return [
        ...new Set(
          knockoutStageIndex > 0
            ? knockoutStageAdvances(knockoutStageIndex - 1)
            : groupStageAdvances(2),
        ),
      ];
    },
    [groupStageAdvances, knockoutStageAdvances],
  );

  const championOptions = useMemo(() => {
    return [
      ...new Set(
        knockoutStages.length > 0
          ? knockoutStageAdvances(knockoutStages.length - 1)
          : groupStageAdvances(1),
      ),
    ];
  }, [groupStageAdvances, knockoutStageAdvances, knockoutStages.length]);

  return {
    groupStages,
    knockoutStages,
    getTeamColor,
    scoreDiff,
    teamsFromPrevousStage,
    championOptions,
  };
};
