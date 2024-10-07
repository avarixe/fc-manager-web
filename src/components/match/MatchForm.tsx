import { Button, Checkbox, Group, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Tables } from "@/database-generated.types";

export function MatchForm({
  record,
  team,
}: {
  record?: Tables<"matches">;
  team: Tables<"teams">;
}) {
  const { currentSeason, seasonOn } = useTeamHelpers(team);

  const session = useAtomValue(sessionAtom);
  const form = useForm({
    mode: "uncontrolled",
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

  const supabase = useAtomValue(supabaseAtom);
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const upsertData = record
        ? { ...values, id: record.id }
        : { ...values, goals: [], bookings: [] };

      const { data, error } = await supabase
        .from("matches")
        .upsert(upsertData)
        .select();
      if (data) {
        navigate({ to: `/teams/${team.id}/matches/${data[0].id}` });
      } else {
        console.error(error);
      }
    },
    [form, navigate, record, supabase, team.id],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <DatePickerInput
        label="Date Played"
        required
        firstDayOfWeek={0}
        mb="xs"
        {...form.getInputProps("played_on")}
      />
      <TextInput
        label="Competition"
        required
        mb="xs"
        {...form.getInputProps("competition")}
      />
      <TextInput label="Stage" mb="xs" {...form.getInputProps("stage")} />
      <Group grow>
        <TeamAutocomplete
          label="Home Team"
          mb="xs"
          {...form.getInputProps("home_team")}
        />
        <TeamAutocomplete
          label="Away Team"
          mb="xs"
          {...form.getInputProps("away_team")}
        />
      </Group>
      <Checkbox {...form.getInputProps("friendly")} label="Friendly" mt="md" />
      <Button mt="xl" type="submit">
        Save Match
      </Button>
    </form>
  );
}
