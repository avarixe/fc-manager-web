import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/new")({
  component: NewTeamPage,
});

function NewTeamPage() {
  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: "New Team", to: `/teams/new` },
    ]);
  }, [setBreadcrumbs]);

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        New Team
      </Title>

      <TeamForm />
    </Stack>
  );
}
