import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/edit")({
  component: EditTeamPage,
});

function EditTeamPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Edit Team", to: `/teams/${teamId}/edit` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Edit Team
      </Title>

      <TeamForm record={team} />
    </Stack>
  );
}
