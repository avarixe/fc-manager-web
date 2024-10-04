import { Tables } from '@/database-generated.types'
import { Box, Button, Stack, Title } from '@mantine/core'

type Match = Pick<
  Tables<'matches'>,
  | 'id'
  | 'home_team'
  | 'away_team'
  | 'home_score'
  | 'away_score'
  | 'home_penalty_score'
  | 'away_penalty_score'
  | 'played_on'
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
    sorting: {
      id: 'played_on',
      desc: true,
    }
  })
  useEffect(() => {
    const fetchPage = async () => {
      const pageQuery = supabase
        .from('matches')
        .select(
          'id, home_team, away_team, home_score, away_score, played_on, competition, season, stage, home_penalty_score, away_penalty_score',
        )
        .range(
          tableState.pageSize * tableState.pageIndex,
          tableState.pageSize * (tableState.pageIndex + 1) - 1,
        )
        .eq('team_id', teamId)

      // TODO: filtering

      pageQuery.order(tableState.sorting.id, {
        ascending: !tableState.sorting.desc,
      })
      pageQuery.order('id', { ascending: !tableState.sorting.desc })

      const { count } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
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
  }, [supabase, tableState.pageIndex, tableState.pageSize, tableState.sorting, teamId])

  const columnHelper = createColumnHelper<Match>()
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'teams',
        header: 'Match',
        cell: ({ row }) => {
          const match = row.original
          let scoreColor: string | undefined
          if (match.home_score === match.away_score) {
            scoreColor = 'yellow'
          } else if (team?.name === match.home_team) {
            if (match.home_score > match.away_score) {
              scoreColor = 'green'
            } else if (match.home_score < match.away_score) {
              scoreColor = 'red'
            } else {
              scoreColor = 'yellow'
            }
          } else if (team?.name === match.away_team) {
            if (match.home_score < match.away_score) {
              scoreColor = 'green'
            } else if (match.home_score > match.away_score) {
              scoreColor = 'red'
            } else {
              scoreColor = 'yellow'
            }
          }
          return (
            <>
              <div>{match.home_team} v {match.away_team}</div>
              <Box c={scoreColor}>
                {match.home_score}
                {match.home_penalty_score ? ` (${match.home_penalty_score})` : ''}-
                {match.away_score}
                {match.away_penalty_score ? ` (${match.away_penalty_score})` : ''}
              </Box>
            </>
          )
        },
        meta: { align: 'center' },
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
      columnHelper.accessor('played_on', {
        header: 'Date Played',
        cell: (info) => {
          const value = info.getValue()
          return formatDate(value)
        },
        meta: { sortable: true },
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
        meta: { align: 'center' },
      }),
    ],
    [columnHelper, team?.name, teamId],
  )

  if (!team) {
    return null
  }

  return (
    <Stack>
      <Title mb="xl">Matches</Title>

      <DataTable
        data={matches}
        columns={columns}
        tableState={tableState}
        setTableState={setTableState}
      />
    </Stack>
  )
}
