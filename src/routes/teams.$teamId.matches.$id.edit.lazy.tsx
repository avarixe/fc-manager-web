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

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Matches", to: `/teams/${teamId}/matches` },
      {
        title: `${match?.home_team} v ${match?.away_team}`,
        to: `/teams/${teamId}/matches/${id}`,
      },
      { title: "Edit Match", to: `/teams/${teamId}/matches/${id}/edit` },
    ]);
  }, [
    id,
    match?.away_team,
    match?.home_team,
    setBreadcrumbs,
    team?.name,
    teamId,
  ]);

  if (!team || !match) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Edit Match
      </Title>

      <MatchForm record={match} team={team} />
    </Stack>
  );
}
