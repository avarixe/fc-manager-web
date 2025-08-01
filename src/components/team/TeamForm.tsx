import { Box, Button, Select, Text, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { sessionAtom } from "@/atoms";
import { TeamAutocomplete } from "@/components/team/TeamAutocomplete";
import { Tables } from "@/database.types";
import { ComboboxItem } from "@/types";
import { supabase } from "@/utils/supabase";

type TeamOption = ComboboxItem<Tables<"teams">>;

export function TeamForm({ record }: { record?: Tables<"teams"> }) {
  const session = useAtomValue(sessionAtom);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      user_id: session?.user?.id,
      name: record?.name ?? "",
      started_on: record?.started_on ?? dayjs().format("YYYY-MM-DD"),
      currently_on: record?.currently_on ?? dayjs().format("YYYY-MM-DD"),
      manager_name: record?.manager_name ?? "",
      game: record?.game ?? "",
      currency: record?.currency ?? "$",
    },
  });
  form.watch("startedOn", ({ value }) => {
    form.setFieldValue("currentlyOn", value);
  });

  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const { data, error } = await supabase
        .from("teams")
        .upsert({ id: record?.id, ...values })
        .select();
      if (data) {
        navigate({ to: `/teams/${data[0].id}` });
      } else {
        console.error(error);
      }
    },
    [form, navigate, record?.id],
  );

  const [teams, setTeams] = useState<TeamOption[]>([]);
  useEffect(() => {
    const fetchTeams = async () => {
      const query = supabase
        .from("teams")
        .select()
        .order("created_at", { ascending: false });

      if (record?.id) {
        query.neq("id", record.id);
      }

      const { data, error } = await query;
      if (data) {
        setTeams(
          data.map((team) => ({
            ...team,
            value: String(team.id),
            label: `${team.name} · ${team.game}`,
          })),
        );
      } else {
        console.error(error);
      }
    };

    fetchTeams();
  }, [record?.id]);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TeamAutocomplete
        {...form.getInputProps("name")}
        label="Name"
        required
        mb="xs"
      />
      <Select
        {...form.getInputProps("previous_id")}
        label="Previous Team"
        mb="xs"
        data={teams}
        renderOption={({ option }: { option: TeamOption }) => {
          return (
            <Box>
              <Text>{option.name}</Text>
              <Text size="xs">
                {option.manager_name} · {option.game}
              </Text>
            </Box>
          );
        }}
      />
      <TextInput
        {...form.getInputProps("manager_name")}
        label="Manager Name"
        required
        mb="xs"
      />
      <TextInput
        {...form.getInputProps("game")}
        label="Game"
        required
        mb="xs"
      />
      <DatePickerInput
        {...form.getInputProps("started_on")}
        label="Start Date"
        required
        mb="xs"
      />
      <DatePickerInput
        {...form.getInputProps("currently_on")}
        label="Current Date"
        required
        mb="xs"
      />
      <TextInput {...form.getInputProps("currency")} label="Currency" mb="xs" />
      <Button mt="xl" type="submit">
        Save Team
      </Button>
    </form>
  );
}
