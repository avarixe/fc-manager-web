import { Tables } from "@/database-generated.types";
import { Stack, Title } from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/matches/$id/edit")({
  component: EditMatchPage,
});

function EditMatchPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [match, setMatch] = useState<Tables<"matches"> | null>(null);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select()
        .eq("team_id", teamId)
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setMatch(data);
      }
    };

    fetchMatch();
  }, [id, supabase, teamId]);

  if (!team || !match) {
    return null;
  }

  return (
    <Stack>
      <Title mb="xl">Edit Match</Title>

      <MatchForm record={match} team={team} />
    </Stack>
  );
}
