import { Stack, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/edit')({
  component: EditTeamPage,
})

function EditTeamPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  if (!team) {
    return null
  }

  return (
    <Stack>
      <Title mb="xl">Edit Team</Title>

      <TeamForm record={team} />
    </Stack>
  )
}
