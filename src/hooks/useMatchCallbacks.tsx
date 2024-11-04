import { TablesInsert } from "@/database-generated.types";
import { Cap, Match } from "@/types";
import { keyBy, omit, orderBy } from "lodash-es";

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

  const session = useAtomValue(sessionAtom)!;
  const resolveFormationChanges = useCallback(
    async (updatedMatch?: Match) => {
      updatedMatch = updatedMatch ?? match;

      // Remove caps with start_minute > 0
      await supabase
        .from("caps")
        .delete()
        .eq("match_id", updatedMatch.id)
        .gt("start_minute", 0);

      const { data: playerData } = await supabase
        .from("players")
        .select("id, name, ovr")
        .eq("team_id", team.id)
        .eq("status", "Active");
      const playerMap: Record<string, { id: number; ovr: number }> = {};
      for (const player of playerData ?? []) {
        playerMap[player.name] = player;
      }

      const ratingsMap: Record<string, number | null> = {};
      for (const cap of caps) {
        ratingsMap[cap.players.name] = cap.rating;
      }

      const starters = caps.filter((cap) => cap.start_minute === 0);
      // Reset stop_minute for all starters
      starters.forEach((cap) => {
        cap.stop_minute = updatedMatch.extra_time ? 120 : 90;
      });
      const currentCapByPlayer: Record<string, Cap | TablesInsert<"caps">> =
        keyBy(starters, (cap) => cap.players.name);
      const sortedChanges = orderBy(updatedMatch.changes, ["minute"]);
      // For each sorted change, create corresponding cap
      const newCapData: TablesInsert<"caps">[] = [];
      for (const change of sortedChanges) {
        const newCap = {
          user_id: session.user.id,
          match_id: updatedMatch.id,
          player_id: playerMap[change.in.name]!.id,
          ovr: playerMap[change.in.name]!.ovr,
          start_minute: change.minute,
          stop_minute: match.extra_time ? 120 : 90,
          pos: change.in.pos,
          rating: ratingsMap[change.in.name],
        };

        const outCap = currentCapByPlayer[change.out.name];
        outCap.stop_minute = change.minute;
        currentCapByPlayer[change.in.name] = newCap;
        newCapData.push(newCap);
      }

      await Promise.all(
        starters.map(async (cap) => {
          await supabase
            .from("caps")
            .update({ stop_minute: cap.stop_minute })
            .eq("id", cap.id);
        }),
      );
      const { data: newCaps } = await supabase
        .from("caps")
        .insert(newCapData)
        .select("*, players(name)");
      assertType<Cap[]>(newCaps);
      setCaps([...starters, ...newCaps]);
    },
    [caps, match, session.user.id, setCaps, supabase, team.id],
  );

  return {
    resolvePlayerStats,
    resolveMatchScores,
    resolveFormationChanges,
  };
};
