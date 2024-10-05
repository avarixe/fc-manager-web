import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/new")({
  component: NewTeamPage,
});

function NewTeamPage() {
  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        New Team
      </Title>

      <TeamForm />
    </Stack>
  );
}
