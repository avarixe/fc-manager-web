import { Tables } from '@/database-generated.types'
import { Table, Title } from '@mantine/core'
import { keyBy } from 'lodash-es'

type Player = Pick<Tables<'players'>, 'id' | 'name' | 'nationality' | 'status' | 'birthYear' | 'pos' | 'secPos' | 'kitNo' | 'ovr' | 'value' | 'wage' | 'contractEndsOn'>

export const Route = createLazyFileRoute('/teams/$teamId/squads')({
  component: SquadsPage,
})

function SquadsPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  const [squads, setSquads] = useState<Tables<'squads'>[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase.from('squads')
        .select()
        .eq('teamId', teamId)
      if (error) {
        console.error(error)
      } else {
        setSquads(data)
      }
    }
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players')
        .select('id, name, nationality, status, birthYear, pos, secPos, kitNo, ovr, value, wage, contractEndsOn')
        .eq('teamId', teamId)
      if (error) {
        console.error(error)
      } else {
        setPlayers(data)
      }
    }

    fetchCompetitions()
    fetchPlayers()
  }, [supabase, teamId])

  const playersById = useMemo(() => keyBy(players, 'id'), [players])

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">Squads</Title>

      {squads.map(squad => {
        assertType<Record<string, number>>(squad.formation)
        const data = {
          head: ['Position', 'Player'],
          body: Object.entries(squad.formation).map(([pos, playerId]) => [
            pos,
            playersById[playerId]?.name
          ]),
        }
        return (
          <div>
            <Title order={2} className="text-center mt-4">{squad.name}</Title>
            <Table key={squad.id} data={data} />
          </div>
        )
      })}
    </>
  )
}
