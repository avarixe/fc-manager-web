import { Tables } from "@/database-generated.types"

export const useTeamHelpers = (team: Tables<'teams'> | null) => {
  const seasonOn = useCallback((date: string) => {
    if (!team) {
      return 0
    }

    return dayjs(date).diff(team.started_on, 'year')
  }, [team])

  const currentSeason = useMemo(() => (
    team ? seasonOn(team.currently_on) : 0
  ), [seasonOn, team])

  const seasonLabel = useCallback((season: number) => {
    if (!team) {
      return ''
    }

    const start = dayjs(team.started_on).add(season, 'year')
    const end = start.add(1, 'year')
    return `${start.format('YYYY')} - ${end.format('YYYY')}`
  }, [team])

  return {
    seasonLabel,
    seasonOn,
    currentSeason,
  }
}
