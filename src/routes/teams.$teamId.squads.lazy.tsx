import { Tables } from '@/database-generated.types'
import { ActionIcon, Box, Button, Card, CardProps, Group, Select, TextInput, Title } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form'
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
        .order('id')
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

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">Squads</Title>

      <Group>
        <Button onClick={() => alert('TODO!')}>
          New Squad
        </Button>
      </Group>

      {squads.map(squad => (
        <SquadCard
          key={squad.id}
          squad={squad}
          players={players}
          my="md"
        />
      ))}
    </>
  )
}

const SquadCard: React.FC<CardProps &{
  squad: Tables<'squads'>,
  players: Player[],
}> = ({ squad, players, ...rest }) => {
  const form = useForm({
    initialValues: {
      name: squad.name,
      formation: { ...squad.formation },
    },
    validate: {
      name: isNotEmpty(),
      formation: (value) => {
        return Object.values(value).filter(id => id).length !== 11
          ? 'Formation must have 11 players'
          : null
      }
    },
    validateInputOnChange: true,
  })

  const [isEditing, setIsEditing] = useState(false)
  const onClickCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  const supabase = useAtomValue(supabaseAtom)
  const onClickSave = async () => {
    const { error } = await supabase.from('squads')
      .update(form.values)
      .eq('id', squad.id)
    if (error) {
      console.error(error)
    } else {
      form.resetDirty()
      setIsEditing(false)
    }
  }

  const onClickDelete = async () => {
    alert('TODO!')
  }

  const playerOptions = useMemo(() => {
    return players.filter(player => !!player.status).map(player => ({
      value: String(player.id),
      label: player.name,
    }))
  }, [players])

  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(null)


  const playersById = useMemo(() => keyBy(players, 'id'), [players])

  const onClickPosition = useCallback((position: string) => {
    if (!isEditing) return

    const formation = { ...form.values.formation }
    const playerId = formation[position] ? String(formation[position]) : null
    if (assigningPlayerId) {
      switch (playerId) {
        case assigningPlayerId:
          setAssigningPlayerId(null)
          break
        case null:
          for (const pos in formation) {
            if (String(formation[pos]) === assigningPlayerId) {
              delete formation[pos]
              break
            }
          }
          formation[position] = Number(assigningPlayerId)
          form.setFieldValue('formation', formation)
          setAssigningPlayerId(null)
          break
        default:
          for (const pos in formation) {
            if (String(formation[pos]) === assigningPlayerId) {
              formation[pos] = Number(playerId)
              break
            }
          }
          formation[position] = Number(assigningPlayerId)
          form.setFieldValue('formation', formation)
          setAssigningPlayerId(null)
          break
      }
    } else if (playerId) {
      setAssigningPlayerId(playerId)
    }
  }, [assigningPlayerId, form, isEditing])

  return (
    <Card pos="relative" {...rest}>
      <Group mb="md">
        <TextInput
          {...form.getInputProps('name')}
          disabled={!isEditing}
          style={{ flexGrow: 1 }}
        />
        {isEditing ? (
          <>
            <ActionIcon onClick={onClickCancel} variant="subtle">
              <div className="i-tabler:x" />
            </ActionIcon>
            <ActionIcon
              onClick={onClickSave}
              disabled={Object.keys(form.errors).length > 0}
              variant="subtle"
            >
              <div className="i-tabler:device-floppy" />
            </ActionIcon>
          </>
        ) : (
          <>
            <ActionIcon onClick={() => setIsEditing(true)} variant="subtle">
              <div className="i-tabler:edit" />
            </ActionIcon>
            <ActionIcon onClick={onClickDelete} variant="subtle">
              <div className="i-tabler:trash" />
            </ActionIcon>
          </>
        )}
      </Group>
      {isEditing && (
        <Group mb="md">
          <Select
            value={assigningPlayerId}
            onChange={setAssigningPlayerId}
            label="Assign player"
            placeholder="Select player"
            clearable
            data={playerOptions}
            renderOption={({ option }) => (
              <Group>
                <MText size="xs" fw="bold">{playersById[option.value]?.pos}</MText>
                <MText size="xs">{option.label}</MText>
              </Group>
            )}
          />
        </Group>
      )}
      <FormationGrid
        cells={form.values.formation}
        renderCell={(position, playerId) => (
          <Button
            variant={String(playerId) === assigningPlayerId ? 'light' : 'transparent'}
            onClick={() => onClickPosition(position)}
            color={String(playerId) === assigningPlayerId ? undefined : 'gray'}
            size="lg"
          >
            <Box>
              <MText fw="bold">{position}</MText>
              <MText size="xs">{playersById[playerId]?.name}</MText>
            </Box>
          </Button>
        )}
        renderEmptyCell={(position) => (
          <Button
            variant="transparent"
            onClick={() => onClickPosition(position)}
            color="gray"
            size="md"
          >
            <Box>
              <MText fw="bold">{position}</MText>
              <MText size="xs">-</MText>
            </Box>
          </Button>
        )}
        hideEmptyCells={!isEditing}
      />
    </Card>
  )
}
