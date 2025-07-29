import { Stack, Title } from "@mantine/core";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import { breadcrumbsAtom, competitionAtom } from "@/atoms";
import { CompetitionForm } from "@/components/competition/CompetitionForm";
import { useTeam } from "@/hooks/useTeam";
import { Competition } from "@/types";
import { assertType } from "@/utils/assert";
import { supabase } from "@/utils/supabase";

export const Route = createLazyFileRoute(
  "/teams/$teamId/competitions/$id/edit",
)({
  component: EditCompetitionPage,
});

function EditCompetitionPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [competition, setCompetition] = useAtom(competitionAtom);

  useEffect(() => {
    const fetchCompetition = async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select()
        .eq("team_id", Number(teamId))
        .eq("id", Number(id))
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Competition>(data);
        setCompetition(data);
      }
    };

    fetchCompetition();
  }, [id, setCompetition, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Competitions", to: `/teams/${teamId}/competitions` },
      {
        title: competition?.name ?? "",
        to: `/teams/${teamId}/competitions/${id}`,
      },
      {
        title: "Edit Competition",
        to: `/teams/${teamId}/competitions/${id}/edit`,
      },
    ]);
  }, [competition?.name, id, setBreadcrumbs, team?.name, teamId]);

  if (!team || !competition) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Edit Competition
      </Title>

      <CompetitionForm record={competition} team={team} />
    </Stack>
  );
}
