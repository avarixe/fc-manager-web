import { Match } from "@/types";
import { omit } from "lodash-es";

export const useMatchCallbacks = () => {
  const team = useAtomValue(teamAtom)!;
  const match = useAtomValue(matchAtom)!;
  const [appearances, setAppearances] = useAtom(appearancesAtom);

  const supabase = useAtomValue(supabaseAtom);
  const resolvePlayerStats = useCallback(
    async (updatedMatch?: Match) => {
      updatedMatch = updatedMatch ?? match;

      const newAppearances = await Promise.all(
        appearances.map(async (appearance) => {
          if (
            appearance.previous?.[0]?.players?.name === appearance.players.name
          ) {
            // Only calculate stats for the first appearance of a player
            return appearance;
          }

          const newAppearance = { ...appearance };
          newAppearance.num_yellow_cards = 0;
          newAppearance.num_red_cards = 0;
          newAppearance.num_goals = 0;
          newAppearance.num_assists = 0;
          newAppearance.num_own_goals = 0;
          newAppearance.clean_sheet =
            team.name === updatedMatch.home_team
              ? updatedMatch.away_score === 0
              : updatedMatch.home_score === 0;

          for (const booking of updatedMatch.bookings) {
            if (booking.player_name === appearance.players.name) {
              newAppearance[
                booking.red_card ? "num_red_cards" : "num_yellow_cards"
              ] += 1;
            }
          }

          for (const goal of updatedMatch.goals) {
            switch (appearance.players.name) {
              case goal.player_name:
                newAppearance[goal.own_goal ? "num_own_goals" : "num_goals"] +=
                  1;
                break;
              case goal.assisted_by:
                newAppearance.num_assists += 1;
            }
          }

          await supabase
            .from("appearances")
            .update(
              omit(newAppearance, [
                "id",
                "players",
                "previous",
                "next",
                "pos_order",
              ]),
            )
            .eq("id", newAppearance.id);

          return newAppearance;
        }),
      );
      setAppearances(newAppearances);
    },
    [appearances, match, setAppearances, supabase, team.name],
  );

  return {
    resolvePlayerStats,
  };
};
