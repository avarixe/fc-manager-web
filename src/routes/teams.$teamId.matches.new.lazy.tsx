import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/matches/new")({
  component: NewMatchPage,
});

function NewMatchPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Matches", to: `/teams/${teamId}/matches` },
      { title: "New Match", to: `/teams/${teamId}/matches/new` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

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
