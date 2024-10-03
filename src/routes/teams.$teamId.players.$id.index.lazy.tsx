import { Tables } from '@/database-generated.types'
import { Box, Button, ColorSwatch, Divider, Group, NumberFormatter, Paper, Stack, Title } from '@mantine/core'
import { AreaChart, ChartTooltipProps, getFilteredChartTooltipPayload } from '@mantine/charts'

export const Route = createLazyFileRoute('/teams/$teamId/players/$id/')({
  component: PlayerPage,
})

interface Player extends Tables<'players'>{
  history: Record<string, { ovr: number; value: number }>
  contracts: {
    signed_on: string
    started_on: string
    ended_on: string
  }[]
}

interface PlayerStats {
  num_matches: number
  num_clean_sheets: number
  num_goals: number
  num_assists: number
  avg_rating: number
}

function PlayerPage() {
  const { teamId, id } = Route.useParams()
  const { team } = useTeam(teamId)

  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState({
    numMatches: 0,
    numCleanSheets: 0,
    numGoals: 0,
    numAssists: 0,
    avgRating: 0,
  })
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase.from('players')
        .select()
        .eq('team_id', teamId)
        .eq('id', id)
        .single()
      if (error) {
        console.error(error)
      } else {
        assertType<Player>(data)
        setPlayer(data)
      }
    }
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_player_stats', { player_ids: [id] })
      if (data) {
        assertType<PlayerStats[]>(data)
        setStats({
          numMatches: data[0].num_matches,
          numCleanSheets: data[0].num_clean_sheets,
          numGoals: data[0].num_goals,
          numAssists: data[0].num_assists,
          avgRating: data[0].avg_rating,
        })
      }
    }


    fetchPlayer()
    fetchStats()
  }, [id, supabase, teamId])

  if (!team || !player) {
    return null
  }

  return (
    <Stack>
      <Title mb="xl">{player.name}</Title>

      <Group>
        <Button>
          Edit
        </Button>

        <Button color="red" variant="outline" className="ml-auto">
          Delete
        </Button>
      </Group>

      <Group grow>
        <Box ta="center">
          <Title>{dayjs(team.currently_on).year() - (player.birth_year ?? 0)}</Title>
          <Title order={6}>Age</Title>
        </Box>
        {player.nationality && (
          <Box ta="center">
            <Title>
              <PlayerFlag nationality={player.nationality} />
            </Title>
            <Title order={6}>Nationality</Title>
          </Box>
        )}
        <Box ta="center">
          <Title>
            <PlayerStatus status={player.status} />
          </Title>
          <Title order={6}>Status</Title>
        </Box>
        <Box ta="center">
          <Title>{player.pos}</Title>
          <Title order={6}>Position</Title>
        </Box>
        {player.sec_pos?.length && (
          <Box ta="center">
            <Title>{player.sec_pos.join(', ')}</Title>
            <Title order={6}>Secondary Position(s)</Title>
          </Box>
        )}
      </Group>

      <Group grow>
        <Box ta="center">
          <Title>{player.kit_no}</Title>
          <Title order={6}>Kit No</Title>
        </Box>
        <Box ta="center">
          <Title>{player.ovr}</Title>
          <Title order={6}>OVR</Title>
        </Box>
        <Box ta="center">
          <Title>
            <NumberFormatter
              value={player.value}
              prefix={team.currency}
              thousandSeparator
            />
          </Title>
          <Title order={6}>Value</Title>
        </Box>
      </Group>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-tabler:run" />
            Performance
          </Group>
        </Title>
        <Divider my="xs" />

        <Group grow>
          <Box ta="center">
            <Title>{stats.numMatches}</Title>
            <Title order={6}>Matches</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numCleanSheets}</Title>
            <Title order={6}>Clean Sheets</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numGoals}</Title>
            <Title order={6}>Goals</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.numAssists}</Title>
            <Title order={6}>Assists</Title>
          </Box>
          <Box ta="center">
            <Title>{stats.avgRating.toFixed(2)}</Title>
            <Title order={6}>Rating</Title>
          </Box>
        </Group>
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-tabler:history" />
            Timeline
          </Group>
        </Title>
        <Divider my="xs" />
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-tabler:timeline" />
            Development
          </Group>
        </Title>
        <Divider my="xs" />

        <PlayerHistoryChart player={player} team={team} />
      </Box>
    </Stack>
  )
}

const PlayerHistoryChart: React.FC<{
  player: Player
  team: Tables<'teams'>
}> = ({ player, team }) => {
  const data = useMemo(() => {
    const history = Object.entries(player.history).map(([date, data]) => ({
      date: dayjs(date).valueOf(),
      ...data,
    }))

    const lastDate = team.currently_on >= player.contracts[0].ended_on
      ? team.currently_on
      : player.contracts[0].ended_on

    if (lastDate !== history[0].date) {
      history.push({
        date: dayjs(lastDate).valueOf(),
        ovr: history[history.length - 1].ovr,
        value: history[history.length - 1].value,
      })
    }

    return history
  }, [player.contracts, player.history, team.currently_on])

  return (
    <AreaChart
      h={300}
      data={data}
      dataKey="date"
      withRightYAxis
      yAxisLabel="OVR"
      rightYAxisLabel='Value'
      valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
      series={[
        { name: 'ovr', color: 'pink.6' },
        { name: 'value', color: 'cyan.6', yAxisId: 'right' },
      ]}
      xAxisProps={{
        scale: 'time',
        domain: [data[0].date, new Date(team.currently_on)],
        tickFormatter: (date) => dayjs(date).format('MMM YYYY'),
      }}
      yAxisProps={{
        domain: [40, 100],
      }}
      rightYAxisProps={{
        tickFormatter: (value) => shortHandValue(value, team.currency),
      }}
      tooltipProps={{
        content: ({ label, payload }) => <PlayerHistoryChartTooltip label={label} payload={payload} currency={team.currency} />
      }}
    />
  )
}

const PlayerHistoryChartTooltip: React.FC<ChartTooltipProps & { currency: string }> = ({ label, payload, currency }) => {
  if (!payload) return null;

  console.log(getFilteredChartTooltipPayload(payload))



  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <MText fw={500} mb={5}>
        {dayjs(label).format('MMM DD, YYYY')}
        {getFilteredChartTooltipPayload(payload).map((item) => (
          <Group>
            <ColorSwatch color={item.color} size={10} />
            <MText size="sm">{item.name === 'ovr' ? 'OVR' : 'Value'}</MText>
            <MText size="sm" ml="auto">
              {item.name === 'ovr' ? item.value : (
                <NumberFormatter
                  value={item.value}
                  prefix={currency}
                  thousandSeparator
                />
              )}
            </MText>
          </Group>
        ))}
      </MText>
    </Paper>
  )
}

function shortHandValue(value: number, currency: string) {
  if (value < 1_000) {
    return `${currency}${value}`
  } else if (value < 1_000_000) {
    return `${currency}${(value / 1_000).toFixed(0)}K`
  } else {
    return `${currency}${(value / 1_000_000).toFixed(0)}M`
  }
}