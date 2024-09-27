import { Title } from '@mantine/core'

export const Route = createLazyFileRoute('/teams/$teamId/competitions/new')({
  component: NewCompetitionPage,
})

function NewCompetitionPage() {
  const { teamId } = Route.useParams()
  const { team } = useTeam(teamId)

  if (!team) {
    return null
  }

  return (
    <>
      <Title mb="xl">New Competition</Title>

      <CompetitionForm team={team} />
    </>
  )
}
