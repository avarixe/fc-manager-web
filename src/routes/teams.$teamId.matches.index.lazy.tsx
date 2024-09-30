import { Tables } from '@/database-generated.types'
import { Button, Title } from '@mantine/core'

type Match = Pick<
  Tables<'matches'>,
  | 'id'
  | 'homeTeam'
  | 'awayTeam'
  | 'homeScore'
  | 'awayScore'
  | 'homePenaltyScore'
  | 'awayPenaltyScore'
  | 'playedOn'
  | 'competition'
  | 'season'
  | 'stage'
>

export const Route = createLazyFileRoute('/teams/$teamId/matches/')({
  component: MatchesPage,
})

function MatchesPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  const [matches, setMatches] = useState<Match[]>([])
  const supabase = useAtomValue(supabaseAtom)
  const [tableState, setTableState] = useState({
    pageIndex: 0,
    pageSize: 10,
    rowCount: 0,
  })
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase
        .from('matches')
        .select(
          'id, homeTeam, awayTeam, homeScore, awayScore, playedOn, competition, season, stage, homePenaltyScore, awayPenaltyScore',
        )
        .range(
          tableState.pageSize * tableState.pageIndex,
          tableState.pageSize * (tableState.pageIndex + 1),
        )
        .eq('teamId', teamId)
        .order('playedOn', { ascending: false })

      // TODO: filtering

      // TODO: sorting

      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
      const { data, error } = await pageQuery
      if (error) {
        console.error(error)
      } else {
        setMatches(data)
        setTableState((prev) => ({
          ...prev,
          rowCount: count ?? 0,
        }))
      }
    }

    fetchPage()
  }, [supabase, tableState.pageIndex, tableState.pageSize, teamId])

  const columnHelper = createColumnHelper<Match>()
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'teams',
        header: () => <div className="text-center">Match</div>,
        cell: ({ row }) => {
          const match = row.original
          return (
            <div className="text-center">
              <div>
                {match.homeTeam} v {match.awayTeam}
              </div>
              <div>
                {match.homeScore}
                {match.homePenaltyScore ? ` (${match.homePenaltyScore})` : ''}-
                {match.awayScore}
                {match.awayPenaltyScore ? ` (${match.awayPenaltyScore})` : ''}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('competition', {
        header: 'Competition',
        cell: (info) => {
          const value = info.getValue()
          return (
            <>
              <div>{value}</div>
              <i>{info.row.original.stage}</i>
            </>
          )
        },
      }),
      columnHelper.accessor('playedOn', {
        header: 'Date Played',
        cell: (info) => {
          const value = info.getValue()
          return formatDate(value)
        },
      }),
      columnHelper.accessor('id', {
        header: 'Link',
        cell: (info) => {
          const value = info.getValue()
          return (
            <Button
              component={Link}
              to={`/teams/${teamId}/matches/${value}`}
              variant="filled"
              fullWidth
            >
              <div className="i-tabler:player-play-filled" />
            </Button>
          )
        },
      }),
    ],
    [columnHelper, teamId],
  )

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">Matches</Title>

      <DataTable
        data={matches}
        columns={columns}
        tableState={tableState}
        setTableState={setTableState}
      />
    </>
  )
}