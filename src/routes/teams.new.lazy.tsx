import { Title } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/new')({
  component: NewTeamPage,
})

function NewTeamPage() {
  return (
    <>
      <Title mb="xl">New Team</Title>

      <TeamForm />
    </>
  )
}
