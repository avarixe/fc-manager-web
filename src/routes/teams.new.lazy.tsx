export const Route = createLazyFileRoute('/teams/new')({
  component: NewTeam,
})

function NewTeam() {
  return (
    <div>
      <h1>New Team</h1>
    </div>
  )
}
