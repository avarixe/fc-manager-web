import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/competitions/new")({
  component: NewCompetitionPage,
});

function NewCompetitionPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Competitions", to: `/teams/${teamId}/competitions` },
      { title: "New Competition", to: `/teams/${teamId}/competitions/new` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        New Competition
      </Title>

      <CompetitionForm team={team} />
    </Stack>
  );
}
