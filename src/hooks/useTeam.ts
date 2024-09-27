export const useTeam = (teamId: string) => {
  const supabase = useAtomValue(supabaseAtom)
  const [team, setTeam] = useAtom(teamAtom)

  useEffect(() => {
    const loadTeam = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select()
        .eq('id', teamId)
      if (error) {
        console.error(error)
      } else {
        setTeam(data[0])
      }
    }

    loadTeam()
  }, [setTeam, supabase, teamId])

  const { seasonOn, currentSeason, seasonLabel } = useTeamHelpers(team)

  return {
    team,
    seasonLabel,
    seasonOn,
    currentSeason,
  }
}
