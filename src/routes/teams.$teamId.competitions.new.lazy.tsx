import { Stack, Title } from "@mantine/core";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { CompetitionForm } from "@/components/competition/CompetitionForm";
import { useTeam } from "@/hooks/useTeam";

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
