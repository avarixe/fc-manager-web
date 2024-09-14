export const Route = createLazyFileRoute('/teams')({
  component: Teams,
})

function Teams() {
  return (
    <div>
      <Title>Teams</Title>
    </div>
  )
}
