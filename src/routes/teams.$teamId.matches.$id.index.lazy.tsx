import { Match } from "@/types";
import {
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Switch,
  Table,
  Title,
} from "@mantine/core";

export const Route = createLazyFileRoute("/teams/$teamId/matches/$id/")({
  component: MatchPage,
});

function MatchPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [match, setMatch] = useState<Match | null>(null);
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
        assertType<Match>(data);
        setMatch(data);
      }
    };

    fetchMatch();
  }, [id, supabase, teamId]);

  const [readonly, setReadonly] = useState(false);

  if (!team || !match) {
    return null;
  }

  return (
    <Stack>
      <Box mb="xl">
        <Title order={6}>{formatDate(match.played_on)}</Title>
        <Title order={4} fw="bolder">
          {match.competition} {match.stage}
        </Title>
        <Title fw="lighter">
          {match.home_team} v {match.away_team}
        </Title>
      </Box>
      <Switch
        label="Readonly Mode"
        checked={readonly}
        onChange={(event) => setReadonly(event.currentTarget.checked)}
      />
      <Group>
        <Button component={Link} to={`/teams/${team.id}/matches/${id}/edit`}>
          Edit
        </Button>
        <Button
          onClick={() => alert("TODO")}
          variant="outline"
          color="red"
          className="ml-auto"
        >
          Delete
        </Button>
      </Group>
      <Table withRowBorders={false}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td w="40%" ta="end">
              {match.home_team}
            </Table.Td>
            <Table.Td w="20%" ta="center">
              Team
            </Table.Td>
            <Table.Td w="40%">{match.away_team}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td ta="end">
              {match.home_score}{" "}
              {match.home_penalty_score
                ? `(${match.home_penalty_score})`
                : null}
            </Table.Td>
            <Table.Td ta="center">Score</Table.Td>
            <Table.Td>
              {match.away_score}{" "}
              {match.away_penalty_score
                ? `(${match.away_penalty_score})`
                : null}
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td ta="end">{match.home_xg ?? 0}</Table.Td>
            <Table.Td ta="center">Expected Goals</Table.Td>
            <Table.Td>{match.away_xg ?? 0}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td ta="end">{match.home_possession ?? 50}%</Table.Td>
            <Table.Td ta="center">Possession</Table.Td>
            <Table.Td>{match.away_possession ?? 50}%</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-tabler:stopwatch" />
            Events
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchTimeline match={match} team={team} />
      </Box>
    </Stack>
  );
}
