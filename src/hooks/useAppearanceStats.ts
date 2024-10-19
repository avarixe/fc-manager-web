import { Match } from "@/types";
import { orderBy, sumBy } from "lodash-es";

function useAppearanceStats(match: Match, playerId: number) {
  const appearances = useAtomValue(appearancesArrayAtom);
  const playerAppearances = orderBy(
    appearances.filter((app) => app.player_id === playerId),
    "start_minute",
  );
  const startRole = playerAppearances[0];
  const lastRole = playerAppearances[playerAppearances.length - 1];

  const startMinute = startRole.start_minute;
  const stopMinute = lastRole.stop_minute;
  const subbedOut = stopMinute < (match.extra_time ? 120 : 90);

  const numGoals = sumBy(playerAppearances, "num_goals");
  const numOwnGoals = sumBy(playerAppearances, "num_own_goals");
  const numAssists = sumBy(playerAppearances, "num_assists");
  const numYellowCards = sumBy(playerAppearances, "num_yellow_cards");
  const numRedCards = sumBy(playerAppearances, "num_red_cards");

  return {
    playerName: startRole.players.name,
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured: lastRole.injured,
  };
}

export { useAppearanceStats };
