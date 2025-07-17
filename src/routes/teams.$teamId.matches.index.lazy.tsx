import { Button, Group, Select, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { breadcrumbsAtom, supabaseAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { MatchTable } from "@/components/match/MatchTable";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { useTeam } from "@/hooks/useTeam";
import { MatchFilters } from "@/types";

export const Route = createLazyFileRoute("/teams/$teamId/matches/")({
  component: MatchesPage,
});

function MatchesPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, seasonLabel } = useTeam(teamId);

  const form = useForm<MatchFilters>({
    initialValues: {
      season: null,
      competition: "",
      team: "",
      results: ["W", "D", "L"],
    },
  });

  const seasons = useMemo(
    () => Array.from(Array(currentSeason + 1).keys()),
    [currentSeason],
  );
  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => ({
        value: String(season),
        label: seasonLabel(season),
      })),
    [seasonLabel, seasons],
  );

  const [competitions, setCompetitions] = useState<string[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase
        .from("competitions")
        .select("name")
        .eq("team_id", Number(teamId))
        .order("name");
      if (data) {
        setCompetitions([
          ...new Set(data.map((competition) => competition.name)),
        ]);
      }
    };
    fetchCompetitions();
  }, [supabase, teamId]);

  const toggleResult = useCallback(
    (result: string) => {
      form.setFieldValue(
        "results",
        form.values.results?.includes(result)
          ? form.values.results.filter((r) => r !== result)
          : [...(form.values.results ?? []), result],
      );
    },
    [form],
  );

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Matches", to: `/teams/${teamId}/matches` },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Matches
      </Title>

      <Group>
        <Button component={Link} to={`/teams/${teamId}/matches/new`}>
          New Match
        </Button>
      </Group>

      <Group>
        <Select
          {...form.getInputProps("season")}
          data={seasonOptions}
          placeholder="Season"
          clearable
        />
        <Select
          {...form.getInputProps("competition")}
          data={competitions}
          placeholder="Competition"
          searchable
          clearable
        />
        <TeamAutocomplete {...form.getInputProps("team")} placeholder="Team" />
        <Button.Group ml="auto">
          <Button
            onClick={() => toggleResult("W")}
            component={"div"}
            variant={form.values.results?.includes("W") ? "light" : "default"}
            size="compact-lg"
            color="green"
          >
            <BaseIcon name="i-mdi:alpha-w" fz="xl" />
          </Button>
          <Button
            onClick={() => toggleResult("D")}
            component={"div"}
            variant={form.values.results?.includes("D") ? "light" : "default"}
            size="compact-lg"
            color="yellow"
          >
            <BaseIcon name="i-mdi:alpha-d" fz="xl" />
          </Button>
          <Button
            onClick={() => toggleResult("L")}
            component={"div"}
            variant={form.values.results?.includes("L") ? "light" : "default"}
            size="compact-lg"
            color="red"
          >
            <BaseIcon name="i-mdi:alpha-l" fz="xl" />
          </Button>
        </Button.Group>
      </Group>

      <MatchTable filters={form.values} />
    </Stack>
  );
}
