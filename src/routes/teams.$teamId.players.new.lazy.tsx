import { Tables, TablesInsert } from "@/database-generated.types";
import {
  Autocomplete,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export const Route = createLazyFileRoute("/teams/$teamId/players/new")({
  component: NewPlayerPage,
});

function NewPlayerPage() {
  const { teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title mb="xl">New Player</Title>

      <PlayerForm team={team} />
    </Stack>
  );
}

const PlayerForm: React.FC<{ team: Tables<"teams"> }> = ({ team }) => {
  const { currentYear } = useTeamHelpers(team);

  const session = useAtomValue(sessionAtom);
  const form = useForm<TablesInsert<"players">>({
    mode: "uncontrolled",
    initialValues: {
      user_id: session?.user?.id,
      team_id: team.id,
      name: "",
      nationality: "",
      pos: "",
      sec_pos: [],
      ovr: 0,
      value: 0,
      birth_year: 0,
      status: null,
      youth: false,
      kit_no: null,
    },
    onValuesChange: (values) => {
      console.log(values);
    },
  });

  const supabase = useAtomValue(supabaseAtom);
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const { data, error } = await supabase
        .from("players")
        .upsert({
          ...values,
          history: {
            [team.currently_on]: {
              ovr: values.ovr,
              value: values.value,
            },
          },
          contracts: [],
          injuries: [],
          loans: [],
          transfers: [],
        })
        .select();
      if (data) {
        navigate({ to: `/teams/${team.id}/players/${data[0].id}` });
      } else {
        console.error(error);
      }
    },
    [form, navigate, supabase, team.currently_on, team.id],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        {...form.getInputProps("name")}
        label="Name"
        required
        mb="xs"
      />
      <Group grow>
        <Select
          {...form.getInputProps("pos")}
          label="Position"
          required
          mb="xs"
          data={positions}
        />
        <MultiSelect
          {...form.getInputProps("sec_pos")}
          label="Secondary Position(s)"
          mb="xs"
          data={positions}
        />
      </Group>
      <Group grow>
        <NumberInput
          {...form.getInputProps("birth_year")}
          label="Age"
          required
          mb="xs"
          value={
            form.values.birth_year ? currentYear - form.values.birth_year : ""
          }
          onChange={(value) => {
            form.setFieldValue(
              "birth_year",
              value ? currentYear - Number(value) : 0,
            );
          }}
        />
        <Autocomplete
          {...form.getInputProps("nationality")}
          label="Nationality"
          required
          mb="xs"
          data={Object.keys(countryCodes)}
        />
      </Group>
      <Group grow>
        <NumberInput
          {...form.getInputProps("ovr")}
          label="OVR Rating"
          required
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("value")}
          label="Value"
          required
          leftSection={team.currency}
          thousandSeparator
          mb="xs"
        />
        <NumberInput
          {...form.getInputProps("kit_no")}
          label="Kit Number"
          mb="xs"
        />
      </Group>
      <Checkbox {...form.getInputProps("youth")} label="Youth Player" mt="md" />
      <Button mt="xl" type="submit">
        Save Player
      </Button>
    </form>
  );
};
