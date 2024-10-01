import { Tables } from '@/database-generated.types'
import { Box, Button, Group, Stack, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/players/$id/')({
  component: PlayerPage,
})

function PlayerPage() {
  const { teamId, id } = Route.useParams()
  const { team } = useTeam(teamId)

  const [player, setPlayer] = useState<Tables<'players'> | null>(null)
  const supabase = useAtomValue(supabaseAtom)
  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase.from('players')
        .select()
        .eq('teamId', teamId)
        .eq('id', id)
        .single()
      if (error) {
        console.error(error)
      } else {
        setPlayer(data)
      }
    }

    fetchPlayer()
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
          <Title>{dayjs(team.currentlyOn).year() - (player.birthYear ?? 0)}</Title>
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
      </Group>
    </Stack>
  )
}
