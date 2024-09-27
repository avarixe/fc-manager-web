import { Tables } from '@/database-generated.types'
import { NumberFormatter, Title } from '@mantine/core'

type Player = Pick<Tables<'players'>, 'id' | 'name' | 'nationality' | 'status' | 'birthYear' | 'pos' | 'secPos' | 'kitNo' | 'ovr' | 'value' | 'wage' | 'contractEndsOn'>

export const Route = createLazyFileRoute('/teams/$teamId/players')({
  component: PlayersPage,
})

function PlayersPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  const [players, setPlayers] = useState<Player[]>([])
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
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

    fetchPlayers()
  }, [supabase, teamId])

  const columnHelper = createColumnHelper<Player>()
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
    }),
    columnHelper.accessor('nationality', {
      header: 'Nationality',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
    }),
    columnHelper.accessor('birthYear', {
      header: 'Birth Year',
    }),
    columnHelper.accessor('pos', {
      header: 'Pos',
    }),
    columnHelper.accessor('secPos', {
      header: '2nd Pos',
    }),
    columnHelper.accessor('kitNo', {
      header: 'Kit No',
    }),
    columnHelper.accessor('ovr', {
      header: 'OVR',
    }),
    columnHelper.accessor('value', {
      header: 'Value',
      cell: info => {
        const value = info.getValue()
        return <NumberFormatter value={value} prefix={team?.currency} thousandSeparator />
      }
    }),
    columnHelper.accessor('wage', {
      header: 'Wage',
      cell: info => {
        const value = info.getValue()
        return value ? <NumberFormatter value={value} prefix={team?.currency} thousandSeparator /> : null
      }
    }),
    columnHelper.accessor('contractEndsOn', {
      header: 'Contract Ends',
      cell: info => {
        const value = info.getValue()
        return formatDate(value)
      }
    }),
  ], [columnHelper, team?.currency])

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">Players</Title>

      <DataTable
        data={players}
        columns={columns}
      />
    </>
  )
}
