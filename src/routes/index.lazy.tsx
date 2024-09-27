import { Title } from "@mantine/core"

export const Route = createLazyFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Title mb="xl">Welcome to FC Manager!</Title>
    </>
  )
}
