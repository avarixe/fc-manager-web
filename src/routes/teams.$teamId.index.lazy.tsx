import { Button, Group, LoadingOverlay, Stack, Title } from '@mantine/core'
import { modals } from '@mantine/modals'

export const Route = createLazyFileRoute('/teams/$teamId/')({
  component: TeamPage,
})

function TeamPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)
  const setTeam = useSetAtom(teamAtom)

  const supabase = useAtomValue(supabaseAtom)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const onClickDelete = () => {
    modals.openConfirmModal({
      title: 'Delete Team',
      centered: true,
      children: (
        <MText size="sm">
          Are you sure you want to delete this team? This action cannot be undone.
        </MText>
      ),
      labels: {
        confirm: 'Delete',
        cancel: 'Cancel'
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          setDeleting(true)
          await supabase.from('teams').delete().eq('id', teamId)
          setTeam(null)
          navigate({ to: '/teams' })
        } catch (error) {
          console.error(error)
          setDeleting(false)
        }
      }
    })
  }

  if (!team) {
    return null
  }

  return (
    <Stack>
      <Title mb="xl">{team.name}</Title>
      <Group>
        <Button component={Link} to={`/teams/${team.id}/edit`}>
          Edit
        </Button>
        <Button onClick={onClickDelete} variant="outline" color="red" className="ml-auto">
          Delete
        </Button>
      </Group>
      <LoadingOverlay visible={deleting} overlayProps={{ blur: 2 }} />
    </Stack>
  )
}
