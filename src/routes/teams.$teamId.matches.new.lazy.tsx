import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/matches/new")({
  component: NewMatchPage,
});

function NewMatchPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        New Match
      </Title>

      <MatchForm team={team} />
    </Stack>
  );
}
