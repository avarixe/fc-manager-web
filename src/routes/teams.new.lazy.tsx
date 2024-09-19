import { Title } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/new')({
  component: NewTeam,
})

function NewTeam() {
  return (
    <>
      <Title mb="xl">New Team</Title>

      <TeamForm />
    </>
  )
}
