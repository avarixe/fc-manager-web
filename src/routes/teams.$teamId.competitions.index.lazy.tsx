import { Button, Group, Stack, Timeline, Title } from "@mantine/core";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { groupBy } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

import { breadcrumbsAtom } from "@/atoms";
import { CompetitionList } from "@/components/competition/CompetitionList";
import { Tables } from "@/database-generated.types";
import { useTeam } from "@/hooks/useTeam";
import { supabase } from "@/utils/supabase";

type Competition = Pick<
  Tables<"competitions">,
  "id" | "name" | "season" | "champion"
>;

export const Route = createLazyFileRoute("/teams/$teamId/competitions/")({
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason } = useTeam(teamId);

  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name, season, champion")
        .eq("team_id", Number(teamId))
        .order("id", { ascending: true });
      if (error) {
        console.error(error);
      } else {
        setCompetitions(data);
      }
    };

    fetchCompetitions();
  }, [teamId]);

  const competitionsBySeason = useMemo(
    () => groupBy(competitions, "season"),
    [competitions],
  );

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Competitions", to: `/teams/${teamId}/competitions` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Competitions
      </Title>

      <Group>
        <Button component={Link} to={`/teams/${teamId}/competitions/new`}>
          New Competition
        </Button>
      </Group>

      <Timeline bulletSize={24} lineWidth={2}>
        {[...Array(currentSeason + 1).keys()].reverse().map((season) => (
          <Timeline.Item key={season} bullet={String(season + 1)}>
            <CompetitionList
              competitions={competitionsBySeason[season] ?? []}
              season={season}
              team={team}
            />
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  );
}
