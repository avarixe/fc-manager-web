import { Tables } from '@/database-generated.types'
import { NavLink, Timeline, Title } from '@mantine/core'
import { groupBy } from 'lodash-es'

type Competition = Pick<Tables<'competitions'>, 'id' | 'name' | 'season' | 'champion'>

export const Route = createLazyFileRoute('/teams/$teamId/competitions')({
  component: Competitions,
})

function Competitions() {
  const { teamId } = Route.useParams()
  const { team, currentSeason, seasonLabel } = useTeam(teamId)

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase.from('competitions')
        .select('id, name, season, champion')
        .eq('teamId', teamId)
        .order('id', { ascending: true })
      if (error) {
        console.error(error)
      } else {
        setCompetitions(data)
      }
    }

    fetchCompetitions()
  }, [supabase, teamId])

  const competitionsBySeason = useMemo(() => groupBy(competitions, 'season'), [competitions])

  if (!team) {
    return null
  }

  console.log('currentSeason: ', currentSeason)

  return (
    <>
      <Title mb="xl">Competitions</Title>

      <Timeline bulletSize={24} lineWidth={2}>
        {[...Array(currentSeason + 1).keys()].reverse().map(season => (
          <Timeline.Item
            key={season}
            title={seasonLabel(season)}
            bullet={String(season)}
          >
            {competitionsBySeason[season]?.map(competition => (
              <NavLink
                key={competition.id}
                label={competition.name}
                description={competition.champion}
              />
            ))}
          </Timeline.Item>
        ))}
      </Timeline>
    </>
  )
}
