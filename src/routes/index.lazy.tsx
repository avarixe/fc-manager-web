export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <Title>Welcome to FC Manager!</Title>
      <MText size="xl">Welcome to FC Manager!</MText>
    </div>
  )
}
