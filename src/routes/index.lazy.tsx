import { Stack, Title } from "@mantine/core"

export const Route = createLazyFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <Stack>
      <Title mb="xl">Welcome to FC Manager!</Title>
    </Stack>
  )
}
