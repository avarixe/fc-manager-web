import {
  ActionIcon,
  Autocomplete,
  Button,
  Checkbox,
  Group,
  Select,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { sessionAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { useManageOptions } from "@/hooks/useManageOptions";
import { useTeamHelpers } from "@/hooks/useTeamHelpers";
import { Competition, Match, Team } from "@/types";
import { supabase } from "@/utils/supabase";

type CompetitionOption = Pick<Competition, "name" | "stages">;

export function MatchForm({ record, team }: { record?: Match; team: Team }) {
  const { currentSeason, seasonOn } = useTeamHelpers(team);

  const session = useAtomValue(sessionAtom);
  const form = useForm({
    initialValues: {
      user_id: session?.user?.id,
      team_id: team.id,
      season: record?.season ?? currentSeason,
      competition: record?.competition ?? null,
      stage: record?.stage ?? null,
      home_team: record?.home_team ?? "",
      away_team: record?.away_team ?? "",
      played_on: record?.played_on ?? team.currently_on,
      friendly: record?.friendly ?? false,
    },
  });
  form.watch("played_on", ({ value }) => {
    form.setFieldValue("season", seasonOn(value));
  });

  const navigate = useNavigate();
  const { saveTeamOptions } = useManageOptions();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const upsertData = record
        ? {
            ...values,
            id: record.id,
            goals: record.goals,
            bookings: record.bookings,
            changes: record.changes,
          }
        : { ...values, goals: [], bookings: [], changes: [] };

      const { data, error } = await supabase
        .from("matches")
        .upsert(upsertData)
        .select();
      if (data) {
        saveTeamOptions([values.home_team, values.away_team]);
        navigate({ to: `/teams/${team.id}/matches/${data[0].id}` });
      } else {
        console.error(error);
      }
    },
    [form, navigate, record, saveTeamOptions, team.id],
  );

  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const query = supabase
        .from("competitions")
        .select("name, stages")
        .eq("team_id", team.id)
        .order("name");
      if (record?.season) {
        query.eq("season", record.season);
      } else {
        query.is("champion", null);
      }
      const { data } = await query;
      if (data) {
        setCompetitions(data);
      }
    };
    fetchCompetitions();
  }, [team.id, record?.season]);

  useEffect(() => {
    const setSeason = async () => {
      if (!form.values.competition || record?.season) return;

      const { data } = await supabase
        .from("competitions")
        .select("season")
        .eq("name", form.values.competition)
        .eq("team_id", team.id)
        .is("champion", null)
        .single();
      form.setFieldValue(
        "season",
        data?.season ?? record?.season ?? currentSeason,
      );
    };
    setSeason();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.competition, currentSeason, team.id]);

  const stageOptions = useMemo(() => {
    const competition = competitions.find(
      (competition) => competition.name === form.values.competition,
    );
    return (competition?.stages ?? [])
      .filter((stage) => stage.fixtures.length > 0)
      .map((stage) => stage.name);
  }, [competitions, form.values.competition]);

  const addTeamToMatch = useCallback(
    (side: "home" | "away") => {
      form.setFieldValue(`${side}_team`, team.name);
      const oppositeSide = side === "home" ? "away" : "home";
      if (form.values[`${oppositeSide}_team`] === team.name) {
        form.setFieldValue(`${oppositeSide}_team`, "");
      }
    },
    [form, team.name],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <DatePickerInput
        {...form.getInputProps("played_on")}
        label="Date Played"
        required
        mb="xs"
      />
      <Select
        {...form.getInputProps("competition")}
        label="Competition"
        data={competitions.map((competition) => competition.name)}
        required
        searchable
        mb="xs"
      />
      {form.values.competition && (
        <Autocomplete
          {...form.getInputProps("stage")}
          data={stageOptions}
          label="Stage"
          mb="xs"
          autoCapitalize="words"
        />
      )}
      <Group grow>
        <TeamAutocomplete
          {...form.getInputProps("home_team")}
          label="Home Team"
          leftSection={
            <ActionIcon
              onClick={() => addTeamToMatch("home")}
              variant="transparent"
              color="gray"
            >
              <BaseIcon
                name={
                  form.values.home_team === team.name
                    ? "i-mdi:shield-star"
                    : "i-mdi-shield-outline"
                }
              />
            </ActionIcon>
          }
          mb="xs"
        />
        <TeamAutocomplete
          {...form.getInputProps("away_team")}
          label="Away Team"
          leftSection={
            <ActionIcon
              onClick={() => addTeamToMatch("away")}
              variant="transparent"
              color="gray"
            >
              <BaseIcon
                name={
                  form.values.away_team === team.name
                    ? "i-mdi:shield-star"
                    : "i-mdi-shield-outline"
                }
              />
            </ActionIcon>
          }
          mb="xs"
        />
      </Group>
      <Checkbox {...form.getInputProps("friendly")} label="Friendly" mt="md" />
      <Button mt="xl" type="submit">
        Save Match
      </Button>
    </form>
  );
}
