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

  const seasonOn = useCallback((date: string) => {
    if (!team) {
      return 0
    }

    return dayjs(date).diff(team.startedOn, 'year')
  }, [team])

  const currentSeason = useMemo(() => (
    team ? seasonOn(team.currentlyOn) : 0
  ), [seasonOn, team])

  const seasonLabel = useCallback((season: number) => {
    if (!team) {
      return ''
    }

    const start = dayjs(team.startedOn).add(season, 'year')
    const end = start.add(1, 'year')
    return `${start.format('YYYY')} - ${end.format('YYYY')}`
  }, [team])

  return {
    team,
    seasonLabel,
    seasonOn,
    currentSeason,
  }
}
