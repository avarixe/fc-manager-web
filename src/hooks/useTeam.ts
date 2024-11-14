export const useTeam = (teamId?: string) => {
  const supabase = useAtomValue(supabaseAtom);
  const [team, setTeam] = useAtom(teamAtom);

  useEffect(() => {
    const loadTeam = async () => {
      if (!teamId) return;

      const { data, error } = await supabase
        .from("teams")
        .select()
        .eq("id", teamId)
        .single();
      if (error) {
        console.error(error);
      } else {
        setTeam(data);
      }
    };

    loadTeam();
  }, [setTeam, supabase, teamId]);

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
