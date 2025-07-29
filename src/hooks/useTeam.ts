import { useAtom } from "jotai";
import { useEffect } from "react";

import { teamAtom } from "@/atoms";
import { useTeamHelpers } from "@/hooks/useTeamHelpers";
import { supabase } from "@/utils/supabase";

export const useTeam = (teamId?: string) => {
  const [team, setTeam] = useAtom(teamAtom);

  useEffect(() => {
    const loadTeam = async () => {
      if (!teamId) return;

      const { data, error } = await supabase
        .from("teams")
        .select()
        .eq("id", Number(teamId))
        .single();
      if (error) {
        console.error(error);
      } else {
        setTeam(data);
      }
    };

    loadTeam();
  }, [setTeam, teamId]);

  const {
    seasonOn,
    currentSeason,
    seasonLabel,
    currentYear,
    endOfCurrentSeason,
    startOfSeason,
    endOfSeason,
  } = useTeamHelpers(team);

  return {
    team,
    seasonLabel,
    seasonOn,
    currentSeason,
    currentYear,
    endOfCurrentSeason,
    startOfSeason,
    endOfSeason,
  };
};
