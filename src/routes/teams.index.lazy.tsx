import { Button } from "@mantine/core"

export const Route = createLazyFileRoute('/teams/')({
  component: Teams,
})

function Teams() {
  return (
    <div>
      <h1>Teams</h1>

      <Button component={Link} to="/teams/new">Create Team</Button>
    </div>
  )
}
