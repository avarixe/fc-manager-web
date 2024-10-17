import { Appearance, Match } from "@/types";
import {
  Box,
  Button,
  Divider,
  Group,
  Indicator,
  NavLink,
  Rating,
  Stack,
  Switch,
  Table,
  Title,
} from "@mantine/core";
import { orderBy } from "lodash-es";

export const Route = createLazyFileRoute("/teams/$teamId/matches/$id/")({
  component: MatchPage,
});

function MatchPage() {
  const { id, teamId } = Route.useParams();
  const { team } = useTeam(teamId);

  const [match, setMatch] = useState<Match | null>(null);
  const setAppearanceMap = useSetAtom(appearanceMapAtom);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          appearances(
            *,
            players(name),
            next:next_id(players(name), pos),
            previous:appearances(players(name), injured, pos)
          )
        `,
        )
        .eq("team_id", teamId)
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        assertType<Match>(data);
        setMatch(data);

        assertType<Appearance[]>(data.appearances);
        setAppearanceMap(
          new AppearanceMap(
            data.appearances.map((appearance: Appearance) => [
              appearance.id,
              atom(appearance),
            ]),
          ),
        );
      }
    };

    fetchMatch();
  }, [id, setAppearanceMap, supabase, teamId]);

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
            <div className="i-mdi:account-multiple" />
            Lineup
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchLineup match={match} />
      </Box>

      <Box my="lg">
        <Title order={2}>
          <Group>
            <div className="i-mdi:timer" />
            Events
          </Group>
        </Title>
        <Divider my="xs" />

        <MatchTimeline match={match} />
      </Box>
    </Stack>
  );
}

const MatchLineup: React.FC<{ match: Match }> = ({ match }) => {
  const appearances = useAtomValue(appearancesArrayAtom);
  const sortedAppearances = useMemo(() => {
    return orderBy(
      appearances.filter(
        (app) => !app.next_id || app.next?.players?.name !== app.players.name,
      ),
      ["pos_order", "start_minute"],
      ["asc", "asc"],
    );
  }, [appearances]);

  const team = useAtomValue(teamAtom)!;
  return (
    <>
      <MText pl="xs" size="sm" className="opacity-60">
        Players
      </MText>
      {sortedAppearances.map((appearance) => (
        <NavLink
          key={appearance.id}
          label={
            <MatchLineupStats match={match} playerId={appearance.player_id!} />
          }
          leftSection={
            <Box w={40} fw={700}>
              {appearance.pos}
            </Box>
          }
          rightSection={
            <Rating value={appearance.rating ?? undefined} readOnly />
          }
          classNames={{
            body: "overflow-visible",
          }}
        />
      ))}
      <MText pl="xs" size="sm" mt="xs" className="opacity-60">
        Teams
      </MText>
      {match.home_team !== team.name && (
        <NavLink
          label={match.home_team}
          leftSection={
            <Box w={50} fw={700}>
              Home
            </Box>
          }
        />
      )}
      {match.away_team !== team.name && (
        <NavLink
          label={match.away_team}
          leftSection={
            <Box w={50} fw={700}>
              Away
            </Box>
          }
        />
      )}
    </>
  );
};

const MatchLineupStats: React.FC<{ match: Match; playerId: number }> = ({
  match,
  playerId,
}) => {
  const {
    playerName,
    startMinute,
    stopMinute,
    numGoals,
    numOwnGoals,
    numAssists,
    numYellowCards,
    numRedCards,
    subbedOut,
    injured,
  } = useAppearanceStats(match, playerId);

  return (
    <Group gap="xs">
      <MText component="span">{playerName}</MText>
      {startMinute > 0 && (
        <Indicator
          label={startMinute}
          color="transparent"
          inline
          position="bottom-end"
        >
          <SubInIcon />
        </Indicator>
      )}
      {numGoals > 0 && (
        <Indicator
          label={numGoals}
          color="transparent"
          inline
          position="bottom-end"
        >
          <GoalIcon />
        </Indicator>
      )}
      {numOwnGoals > 0 && (
        <Indicator
          label={numOwnGoals}
          color="transparent"
          inline
          position="bottom-end"
        >
          <GoalIcon c="red.9" />
        </Indicator>
      )}
      {numAssists > 0 && (
        <Indicator
          label={numAssists}
          color="transparent"
          inline
          position="bottom-end"
        >
          <AssistIcon />
        </Indicator>
      )}
      {numYellowCards > 0 && <YellowCardIcon />}
      {numRedCards > 0 || (numYellowCards > 1 && <RedCardIcon />)}
      {subbedOut && (
        <Indicator
          label={stopMinute}
          color="transparent"
          inline
          position="bottom-end"
        >
          {injured ? <InjuryIcon /> : <SubOutIcon />}
        </Indicator>
      )}
    </Group>
  );
};
