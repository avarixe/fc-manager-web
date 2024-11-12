import { createLazyFileRoute } from "@tanstack/react-router";

import { Tables } from "@/database-generated.types";
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

export const Route = createLazyFileRoute("/teams/$teamId/players/$id/edit")({
  component: EditPlayerPage,
});

function EditPlayerPage() {
  const { teamId, id } = Route.useParams();
  const { team } = useTeam(teamId);

  const [player, setPlayer] = useState<Tables<"players"> | null>(null);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from("players")
        .select()
        .eq("team_id", teamId)
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setPlayer(data);
      }
    };

    fetchPlayer();
  }, [id, supabase, teamId]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      { title: player?.name ?? "", to: `/teams/${teamId}/players/${id}` },
      { title: "Edit Player", to: `/teams/${teamId}/players/${id}/edit` },
    ]);
  }, [id, player?.name, setBreadcrumbs, team?.name, teamId]);

  if (!team || !player) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Edit Player
      </Title>

      <PlayerForm team={team} record={player} />
    </Stack>
  );
}

const PlayerForm: React.FC<{
  team: Tables<"teams">;
  record: Tables<"players">;
}> = ({ team, record }) => {
  const { currentYear } = useTeamHelpers(team);

  const form = useForm({
    initialValues: {
      name: record.name,
      nationality: record.nationality,
      pos: record.pos,
      sec_pos: [...(record.sec_pos ?? [])],
      birth_year: record.birth_year,
      youth: record.youth,
    },
  });

  const supabase = useAtomValue(supabaseAtom);
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const { error } = await supabase
        .from("players")
        .update(values)
        .eq("id", record.id);
      if (error) {
        console.error(error);
      } else {
        navigate({ to: `/teams/${team.id}/players/${record.id}` });
      }
    },
    [form, navigate, record.id, supabase, team.id],
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
          searchable
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
          min={0}
          max={100}
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
      <Checkbox {...form.getInputProps("youth")} label="Youth Player" mt="md" />
      <Button mt="xl" type="submit">
        Save Player
      </Button>
    </form>
  );
};
