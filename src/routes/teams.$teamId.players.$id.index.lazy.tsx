import { Tables } from '@/database-generated.types'
import { Box, Button, Divider, Group, NumberFormatter, Stack, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/players/$id/')({
  component: PlayerPage,
})

function PlayerPage() {
  const { teamId, id } = Route.useParams()
  const { team } = useTeam(teamId)

  const [player, setPlayer] = useState<Tables<'players'> | null>(null)
  const [stats, setStats] = useState({
    numMatches: 0,
    numCleanSheets: 0,
    numGoals: 0,
    numAssists: 0,
    sumStart: 0,
    sumStop: 0,
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
        setPlayer(data)
      }
    }
    const fetchStats = async () => {
      const { data, error } = await supabase.from('appearances').select(`
        id.count(),
        num_goals:num_goals.sum(),
        num_assists:num_assists.sum(),
        start_minutes:start_minute.sum(),
        stop_minutes:stop_minute.sum()
      `).eq('player_id', id).single()
      console.log(data, error)
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

      <Box>
        <Title order={2}>
          <Group>
            <div className="i-tabler:run" />
            Performance
          </Group>
        </Title>
        <Divider my="xs" />
      </Box>
    </Stack>
  )
}
