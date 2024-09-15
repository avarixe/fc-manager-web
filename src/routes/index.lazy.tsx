export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div>
      <h1>Welcome to FC Manager!</h1>
    </div>
  )
}
