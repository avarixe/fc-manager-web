import { useAtom, useAtomValue } from "jotai";
import { keyBy, omit, orderBy } from "lodash-es";
import { useCallback } from "react";

import { capsAtom, matchAtom, sessionAtom, teamAtom } from "@/atoms";
import { TablesInsert } from "@/database.types";
import { useCapHelpers } from "@/hooks/useCapHelpers";
import { Cap, Match } from "@/types";
import { assertDefined } from "@/utils/assert";
import { keptCleanSheet, playerMatchStats } from "@/utils/match";
import { supabase } from "@/utils/supabase";

export const useMatchCallbacks = () => {
  const team = useAtomValue(teamAtom)!;
  const [caps, setCaps] = useAtom(capsAtom);
  const [match, setMatch] = useAtom(matchAtom);
  assertDefined(match);

  const { getFirstCaps } = useCapHelpers();
  const resolvePlayerStats = useCallback(
    async (updatedMatch?: Match) => {
      updatedMatch = updatedMatch ?? match;
      const isTeamHome = team.name === updatedMatch.home_team;

      const firstCaps = getFirstCaps();
      const newCaps = await Promise.all(
        caps.map(async (cap) => {
          if (firstCaps.every((firstCap) => firstCap.id !== cap.id)) {
            // Only calculate stats for the first cap of a player
            return cap;
          }

          const newCap = {
            ...cap,
            ...playerMatchStats(updatedMatch, cap.players.name, isTeamHome),
          };

          for (const booking of updatedMatch.bookings) {
            if (
              booking.player_name === cap.players.name &&
              booking.home === isTeamHome &&
              booking.red_card
            ) {
              newCap.stop_minute = booking.minute;
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
    [caps, getFirstCaps, match, setCaps, team.name],
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
    [match, setMatch],
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
        .select("id, name, ovr, kit_no")
        .eq("team_id", team.id)
        .eq("status", "Active");
      const playerMap: Record<
        string,
        { id: number; ovr: number; kit_no: number | null }
      > = {};
      for (const player of playerData ?? []) {
        playerMap[player.name] = player;
      }

      const ratingMap: Record<string, number | null> = {};
      for (const cap of caps) {
        if (!(cap.players.name in ratingMap)) {
          ratingMap[cap.players.name] = cap.rating;
        }
      }

      const isTeamHome = team.name === updatedMatch.home_team;
      const starters = caps.filter((cap) => cap.start_minute === 0);
      // Reset stop_minute for all starters
      starters.forEach((cap) => {
        cap.stop_minute = updatedMatch.extra_time ? 120 : 90;
        cap.clean_sheet = keptCleanSheet(
          updatedMatch,
          cap.players.name,
          isTeamHome,
        );
      });
      const currentCapByPlayer: Record<string, Cap | TablesInsert<"caps">> =
        keyBy(starters, (cap) => cap.players.name);
      const sortedChanges = orderBy(updatedMatch.changes, ["minute"]);
      // For each sorted change, create corresponding cap
      const newCapData: TablesInsert<"caps">[] = [];
      for (const change of sortedChanges) {
        const isFirstCapForPlayer = !currentCapByPlayer[change.in.name];
        const newCap = {
          user_id: session.user.id,
          match_id: updatedMatch.id,
          player_id: playerMap[change.in.name]!.id,
          ovr: playerMap[change.in.name]!.ovr,
          kit_no: playerMap[change.in.name]!.kit_no,
          start_minute: change.minute,
          stop_minute: match.extra_time ? 120 : 90,
          pos: change.in.pos,
          rating: ratingMap[change.in.name],
          // Only the first cap for a player gets the accumulated stats
          ...(isFirstCapForPlayer
            ? playerMatchStats(updatedMatch, change.in.name, isTeamHome)
            : {
                num_goals: 0,
                num_own_goals: 0,
                num_assists: 0,
                num_yellow_cards: 0,
                num_red_cards: 0,
                clean_sheet: false,
              }),
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
            .update({
              stop_minute: cap.stop_minute,
              clean_sheet: cap.clean_sheet,
            })
            .eq("id", cap.id);
        }),
      );
      const { data: newCaps } = await supabase
        .from("caps")
        .insert(newCapData)
        .select("*, players(name)");
      setCaps([...starters, ...(newCaps ?? [])]);
    },
    [caps, match, session.user.id, setCaps, team.id, team.name],
  );

  return {
    resolvePlayerStats,
    resolveMatchScores,
    resolveFormationChanges,
  };
};
