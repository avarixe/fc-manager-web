import { Match } from "@/types";
import { omit } from "lodash-es";

export const useMatchCallbacks = () => {
  const team = useAtomValue(teamAtom)!;
  const [caps, setCaps] = useAtom(capsAtom);
  const [match, setMatch] = useAtom(matchAtom);
  assertType<Match>(match);

  const supabase = useAtomValue(supabaseAtom);
  const { getFirstCaps } = useCapHelpers();
  const resolvePlayerStats = useCallback(
    async (updatedMatch?: Match) => {
      updatedMatch = updatedMatch ?? match;

      const firstCaps = getFirstCaps();
      const newCaps = await Promise.all(
        caps.map(async (cap) => {
          if (firstCaps.every((firstCap) => firstCap.id !== cap.id)) {
            // Only calculate stats for the first cap of a player
            return cap;
          }

          const newCap = { ...cap };
          newCap.num_yellow_cards = 0;
          newCap.num_red_cards = 0;
          newCap.num_goals = 0;
          newCap.num_assists = 0;
          newCap.num_own_goals = 0;
          newCap.clean_sheet =
            team.name === updatedMatch.home_team
              ? updatedMatch.away_score === 0
              : updatedMatch.home_score === 0;

          for (const booking of updatedMatch.bookings) {
            if (booking.player_name === cap.players.name) {
              newCap[booking.red_card ? "num_red_cards" : "num_yellow_cards"] +=
                1;
            }
          }

          for (const goal of updatedMatch.goals) {
            switch (cap.players.name) {
              case goal.player_name:
                newCap[goal.own_goal ? "num_own_goals" : "num_goals"] += 1;
                break;
              case goal.assisted_by:
                newCap.num_assists += 1;
            }
          }

          await supabase
            .from("caps")
            .update(
              omit(newCap, ["id", "players", "previous", "next", "pos_order"]),
            )
            .eq("id", newCap.id);

          return newCap;
        }),
      );
      setCaps(newCaps);
    },
    [caps, getFirstCaps, match, setCaps, supabase, team.name],
  );

  const resolveMatchScores = useCallback(
    async (updatedMatch?: Match) => {
      updatedMatch = updatedMatch ?? match;
      const homeScore = updatedMatch.goals.filter(
        (goal) => goal.home !== goal.own_goal,
      ).length;
      const awayScore = updatedMatch.goals.length - homeScore;

      await supabase
        .from("matches")
        .update({ home_score: homeScore, away_score: awayScore })
        .eq("id", match.id);
      setMatch({
        ...updatedMatch,
        home_score: homeScore,
        away_score: awayScore,
      });
    },
    [match, setMatch, supabase],
  );

  return {
    resolvePlayerStats,
    resolveMatchScores,
  };
};
