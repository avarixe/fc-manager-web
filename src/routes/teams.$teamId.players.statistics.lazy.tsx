import { Player } from "@/types";
import {
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  Table,
  Title,
  Tooltip,
} from "@mantine/core";
import { groupBy, round } from "lodash-es";

type PlayerData = Pick<
  Player,
  "id" | "name" | "nationality" | "status" | "pos" | "youth"
>;

interface PlayerStats {
  player_id: string;
  competition: string;
  season: number;
  num_matches: number;
  num_minutes: number;
  num_clean_sheets: number;
  num_goals: number;
  num_assists: number;
  avg_rating: number;
}

interface PlayerRow extends Omit<PlayerStats, "player_id"> {
  id: string;
  player: PlayerData;
  xg: number;
  xa: number;
  xg_and_xa: number;
}

export const Route = createLazyFileRoute("/teams/$teamId/players/statistics")({
  component: PlayerStatisticsPage,
});

function PlayerStatisticsPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, seasonLabel } = useTeam(teamId);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, name, nationality, status, pos, youth")
        .eq("team_id", teamId)
        .order("pos_order");
      assertType<PlayerData[]>(data);
      setPlayers(data);

      const playerIds = data.map((player) => player.id);
      const { data: statsData } = await supabase.rpc("get_player_stats", {
        player_ids: playerIds,
      });
      assertType<PlayerStats[]>(statsData);
      setStats(statsData);
    };

    fetchPlayers();
  }, [supabase, teamId]);
  const statsByPlayerId = useMemo(() => groupBy(stats, "player_id"), [stats]);

  const [season, setSeason] = useState<string | null>(null);
  const seasons = useMemo(
    () => Array.from(Array(currentSeason + 1).keys()),
    [currentSeason],
  );
  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => ({
        value: String(season),
        label: seasonLabel(season),
      })),
    [seasonLabel, seasons],
  );

  const [competition, setCompetition] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<string[]>([]);
  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase
        .from("competitions")
        .select("name")
        .eq("team_id", Number(teamId))
        .order("name");
      if (data) {
        setCompetitions([
          ...new Set(data.map((competition) => competition.name)),
        ]);
      }
    };
    fetchCompetitions();
  }, [supabase, teamId]);

  const [statusFilter, setStatusFilter] = useState(PlayerStatusFilter.Active);
  const [splitBySeason, setSplitBySeason] = useState(false);
  const [splitByCompetition, setSplitByCompetition] = useState(false);
  const items = useMemo(() => {
    const filteredPlayers = players.filter((player) => {
      switch (statusFilter) {
        case PlayerStatusFilter.Youth:
          return player.youth;
        case PlayerStatusFilter.Active:
          return (
            player.status !== null &&
            player.status !== PlayerStatusFilter.Pending
          );
        default:
          return true;
      }
    });

    const rows: PlayerRow[] = [];
    filteredPlayers.forEach((player) => {
      const filteredStats =
        statsByPlayerId[player.id]?.filter(
          (data) =>
            [null, data.season].includes(season ? Number(season) : null) &&
            [null, data.competition].includes(competition),
        ) ?? [];

      const splitStats = groupBy(filteredStats, (stats) =>
        [
          stats.player_id,
          splitBySeason ? stats.season : null,
          splitByCompetition ? stats.competition : null,
        ].join("_"),
      );

      for (const key in splitStats) {
        const row: PlayerRow = {
          id: key,
          player,
          season: splitStats[key][0].season,
          competition: splitStats[key][0].competition,
          num_matches: 0,
          num_minutes: 0,
          num_clean_sheets: 0,
          num_goals: 0,
          num_assists: 0,
          avg_rating: 0,
          xg: 0,
          xa: 0,
          xg_and_xa: 0,
        };
        splitStats[key].forEach((playerStats) => {
          row.num_matches += playerStats.num_matches;
          row.num_clean_sheets += playerStats.num_clean_sheets;
          row.num_goals += playerStats.num_goals;
          row.num_assists += playerStats.num_assists;
          row.avg_rating += playerStats.avg_rating * playerStats.num_minutes;
          row.num_minutes += playerStats.num_minutes;
        });
        if (row.num_minutes > 0) {
          row.avg_rating /= row.num_minutes;
          row.xg = row.num_goals / row.num_matches;
          row.xa = row.num_assists / row.num_matches;
          row.xg_and_xa = row.xg + row.xa;
        }

        rows.push(row);
      }
    });
    return rows;
  }, [
    competition,
    players,
    season,
    splitByCompetition,
    splitBySeason,
    statsByPlayerId,
    statusFilter,
  ]);

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      {
        title: "Player Statistics",
        to: `/teams/${teamId}/players/statistics`,
      },
    ]);
  }, [setBreadcrumbs, team?.name, teamId]);

  if (!team) {
    return null;
  }

  return (
    <Stack>
      <Title fw="lighter" mb="xl">
        Player Development
      </Title>

      <Group align="start">
        <StatusFilterToggle
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
        />
        <Stack gap="xs">
          <Select
            value={season}
            onChange={setSeason}
            data={seasonOptions}
            placeholder="Season"
            clearable
          />
          <Checkbox
            checked={splitBySeason}
            onChange={(event) => setSplitBySeason(event.currentTarget.checked)}
            label="Split by Season"
          />
        </Stack>
        <Stack gap="xs">
          <Select
            value={competition}
            onChange={setCompetition}
            data={competitions}
            placeholder="Competition"
            searchable
            clearable
          />
          <Checkbox
            checked={splitByCompetition}
            onChange={(event) =>
              setSplitByCompetition(event.currentTarget.checked)
            }
            label="Split by Competition"
          />
        </Stack>
      </Group>

      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Player</Table.Th>
              <Table.Th ta="center">
                <BaseIcon name="i-mdi:flag" w="auto" />
              </Table.Th>
              <Table.Th ta="center">Pos</Table.Th>
              {splitBySeason && <Table.Th>Season</Table.Th>}
              {splitByCompetition && <Table.Th>Competition</Table.Th>}
              <Table.Th ta="end">GP</Table.Th>
              <Table.Th ta="end">Minutes</Table.Th>
              <Table.Th ta="end">G</Table.Th>
              <Table.Th ta="end">A</Table.Th>
              <Table.Th ta="end">CS</Table.Th>
              <Table.Th ta="center">Rating</Table.Th>
              <Table.Th ta="center">xG + xA</Table.Th>
              <Table.Th ta="center">xG</Table.Th>
              <Table.Th ta="center">xA</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Button
                    component={Link}
                    to={`/teams/${team.id}/players/${item.player.id}`}
                    variant="subtle"
                    size="compact-xs"
                  >
                    {item.player.name}
                  </Button>
                </Table.Td>
                <Table.Td ta="center">
                  {item.player.nationality && (
                    <PlayerFlag nationality={item.player.nationality} />
                  )}
                </Table.Td>
                <Table.Td ta="center">{item.player.pos}</Table.Td>
                {splitBySeason && (
                  <Table.Td>{seasonLabel(item.season)}</Table.Td>
                )}
                {splitByCompetition && <Table.Td>{item.competition}</Table.Td>}
                <Table.Td ta="end">{item.num_matches}</Table.Td>
                <Table.Td ta="end">{item.num_minutes}</Table.Td>
                <Table.Td ta="end">{item.num_goals}</Table.Td>
                <Table.Td ta="end">{item.num_assists}</Table.Td>
                <Table.Td ta="end">{item.num_clean_sheets}</Table.Td>
                <Table.Td ta="center" c={ratingColor(item.avg_rating)}>
                  {round(item.avg_rating, 2).toFixed(2)}
                </Table.Td>
                <Table.Td ta="center">
                  {round(item.xg_and_xa, 2).toFixed(2)}
                </Table.Td>
                <Table.Td ta="center">{round(item.xg, 2).toFixed(2)}</Table.Td>
                <Table.Td ta="center">{round(item.xa, 2).toFixed(2)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

const statusFilters = [
  { value: PlayerStatusFilter.All, icon: "i-mdi:earth", color: "blue" },
  { value: PlayerStatusFilter.Youth, icon: "i-mdi:school", color: "cyan" },
  {
    value: PlayerStatusFilter.Active,
    icon: "i-mdi:account-check",
    color: "green",
  },
];

const StatusFilterToggle: React.FC<{
  statusFilter: PlayerStatusFilter;
  onChangeStatusFilter: (status: PlayerStatusFilter) => void;
}> = ({ statusFilter, onChangeStatusFilter }) => {
  return (
    <Button.Group>
      {statusFilters.map((filter) => (
        <Tooltip label={filter.value} key={filter.value}>
          <Button
            component={"div"}
            color={statusFilter === filter.value ? filter.color : undefined}
            variant={statusFilter === filter.value ? "filled" : "default"}
            onClick={() => onChangeStatusFilter(filter.value)}
          >
            <div className={filter.icon} />
          </Button>
        </Tooltip>
      ))}
    </Button.Group>
  );
};
