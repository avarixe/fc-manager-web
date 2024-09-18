import { Button, Title } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/')({
  component: Teams,
})

function Teams() {
  return (
    <>
      <Title mb="xl">Teams</Title>

      <Button component={Link} to="/teams/new">Create Team</Button>
    </>
  )
}
