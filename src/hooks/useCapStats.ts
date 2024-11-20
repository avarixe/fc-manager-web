import { orderBy, sumBy } from "lodash-es";

function useCapStats(playerId: number) {
  const caps = useAtomValue(capsAtom);
  const playerRoles = orderBy(
    caps.filter((cap) => cap.player_id === playerId),
    "start_minute",
  );
  const startRole = playerRoles[0];
  const lastRole = playerRoles[playerRoles.length - 1];

  const startMinute = startRole.start_minute;
  const stopMinute = lastRole.stop_minute;
  const match = useAtomValue(matchAtom)!;

  const numGoals = sumBy(playerRoles, "num_goals");
  const numOwnGoals = sumBy(playerRoles, "num_own_goals");
  const numAssists = sumBy(playerRoles, "num_assists");
  const numYellowCards = sumBy(playerRoles, "num_yellow_cards");
  const numRedCards = sumBy(playerRoles, "num_red_cards");
  const subbedOut =
    stopMinute < (match.extra_time ? 120 : 90) && numRedCards === 0;

  const injured = useMemo(() => {
    const playerName = startRole.players.name;
    return match.changes.some(
      (change) => change.out.name === playerName && change.injured,
    );
  }, [match.changes, startRole.players.name]);

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
    injured,
  };
}

export { useCapStats };
