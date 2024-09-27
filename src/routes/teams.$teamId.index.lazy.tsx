import { Button, Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/')({
  component: TeamPage,
})

function TeamPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">{team.name}</Title>
      <Button component={Link} to={`/teams/${team.id}/edit`}>
        Edit Team
      </Button>
    </>
  )
}
