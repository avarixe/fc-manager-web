import { Autocomplete, Button, Checkbox, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Tables } from "@/database-generated.types";
import { Stage } from "@/types";

export function CompetitionForm({
  record,
  team,
}: {
  record?: Tables<"competitions">;
  team: Tables<"teams">;
}) {
  const { currentSeason, seasonLabel } = useTeamHelpers(team);

  const session = useAtomValue(sessionAtom);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      user_id: session?.user?.id,
      team_id: team.id,
      name: record?.name ?? "",
      season: record?.season ?? currentSeason,
      champion: record?.champion,
    },
  });

  const supabase = useAtomValue(supabaseAtom);
  const navigate = useNavigate();
  const [copyFormat, setCopyFormat] = useState(false);
  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      const upsertData = record
        ? { ...values, id: record.id, stages: record.stages }
        : { ...values, stages: [] };

      if (!record && copyFormat) {
        const { data } = await supabase
          .from("competitions")
          .select("stages")
          .eq("team_id", team.id)
          .eq("name", values.name)
          .order("id", { ascending: false })
          .limit(1)
          .single();
        if (data?.stages) {
          assertType<Stage[]>(data.stages);
          const cleanStages: Stage[] = data.stages.map((stage) => ({
            ...stage,
            table: stage.table.map(() => ({
              team: "",
              w: 0,
              d: 0,
              l: 0,
              gf: 0,
              ga: 0,
              pts: 0,
            })),
            fixtures: stage.fixtures.map((fixture) => ({
              home_team: "",
              away_team: "",
              legs: fixture.legs.map(() => ({
                home_score: "",
                away_score: "",
              })),
            })),
          }));
          upsertData.stages = cleanStages;
        }
      }

      const { data, error } = await supabase
        .from("competitions")
        .upsert(upsertData)
        .select();
      if (data) {
        navigate({ to: `/teams/${team.id}/competitions/${data[0].id}` });
      } else {
        console.error(error);
      }
    },
    [copyFormat, form, navigate, record, supabase, team.id],
  );

  const [competitions, setCompetitions] = useState<string[]>([]);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase
        .from("competitions")
        .select("name")
        .eq("team_id", team.id)
        .order("name");
      if (data) {
        setCompetitions([
          ...new Set(data.map((competition) => competition.name)),
        ]);
      }
    };
    fetchCompetitions();
  }, [form.values.season, supabase, team.id]);

  const { championOptions } = useCompetitionHelpers();

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Season"
        value={seasonLabel(form.values.season)}
        disabled
        mb="xs"
      />
      <Autocomplete
        {...form.getInputProps("name")}
        data={competitions}
        label="Name"
        required
        autoCapitalize="words"
        mb="xs"
      />
      {record ? (
        <TeamAutocomplete
          {...form.getInputProps("champion")}
          data={championOptions}
          label="Champion"
          mb="xs"
        />
      ) : (
        <Checkbox
          checked={copyFormat}
          onChange={(event) => setCopyFormat(event.currentTarget.checked)}
          label="Copy format from previous edition"
          mb="xs"
        />
      )}
      <Button mt="xl" type="submit">
        Save Competition
      </Button>
    </form>
  );
}
