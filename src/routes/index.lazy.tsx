import { Title } from "@mantine/core"

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <>
      <Title mb="xl">Welcome to FC Manager!</Title>
    </>
  )
}
