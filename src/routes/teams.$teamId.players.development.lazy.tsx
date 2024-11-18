import { Player, PlayerHistoryData } from "@/types";
import {
  Button,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Title,
  Tooltip,
} from "@mantine/core";

type PlayerData = Pick<
  Player,
  | "id"
  | "name"
  | "nationality"
  | "status"
  | "pos"
  | "ovr"
  | "value"
  | "history"
  | "contracts"
  | "youth"
>;

interface PlayerRow extends PlayerData {
  numSeasons: number;
  seasons: (PlayerHistoryData | null)[];
  start: PlayerHistoryData;
  last: PlayerHistoryData;
  total: PlayerHistoryData;
}

export const Route = createLazyFileRoute("/teams/$teamId/players/development")({
  component: PlayerDevelopmentPage,
});

function PlayerDevelopmentPage() {
  const { teamId } = Route.useParams();
  const { team, currentSeason, seasonLabel, startOfSeason, endOfSeason } =
    useTeam(teamId);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const supabase = useAtomValue(supabaseAtom);
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select(
          "id, name, nationality, status, pos, ovr, value, history, contracts, youth",
        )
        .eq("team_id", teamId)
        .order("pos_order");
      assertType<PlayerData[]>(data);
      setPlayers(data);
    };

    fetchPlayers();
  }, [supabase, teamId]);

  const seasons = useMemo(
    () => Array.from(Array(currentSeason + 1).keys()),
    [currentSeason],
  );
  const [statusFilter, setStatusFilter] = useState(PlayerStatusFilter.Active);
  const items = useMemo(() => {
    return players
      .filter((player) => {
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
      })
      .map((player) => {
        const seasonData: PlayerRow["seasons"] = [];

        const sortedKeys = Object.keys(player.history).sort();
        const start = player.history[sortedKeys[0]];
        const last = player.history[sortedKeys[sortedKeys.length - 1]];

        let numSeasons = 0;
        for (const season of seasons) {
          const seasonStart = startOfSeason(season);
          const seasonEnd = endOfSeason(season);

          if (
            player.contracts.some(
              (contract) =>
                contract.started_on < seasonEnd &&
                seasonStart < contract.ended_on,
            )
          ) {
            numSeasons++;
            const seasonEndData = playerRecordAt(player, seasonEnd) ?? last;
            seasonData.push(seasonEndData);
          } else {
            seasonData.push(null);
          }
        }

        return {
          ...player,
          seasons: seasonData,
          numSeasons,
          start,
          last,
          total: {
            ovr: last.ovr - start.ovr,
            value: last.value - start.value,
          },
        };
      });
  }, [endOfSeason, players, seasons, startOfSeason, statusFilter]);

  const [dataType, setDataType] = useState("ovr");

  const setBreadcrumbs = useSetAtom(breadcrumbsAtom);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Home", to: "/" },
      { title: "Teams", to: "/teams" },
      { title: team?.name ?? "", to: `/teams/${teamId}` },
      { title: "Players", to: `/teams/${teamId}/players` },
      {
        title: "Player Development",
        to: `/teams/${teamId}/players/development`,
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

      <Group>
        <StatusFilterToggle
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
        />
        <SegmentedControl
          value={dataType}
          onChange={setDataType}
          data={[
            {
              value: "ovr",
              label: <BaseIcon name="i-mdi:trending-up" fz="xl" c="teal" />,
            },
            {
              value: "value",
              label: <BaseIcon name="i-mdi:cash-multiple" fz="xl" c="cyan" />,
            },
          ]}
          ml="auto"
        />
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
              <Table.Th ta="end">Change</Table.Th>
              <Table.Th ta="end">Start</Table.Th>
              {seasons.map((season) => (
                <Table.Th key={season} ta="end">
                  {seasonLabel(season, true)}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Button
                    component={Link}
                    to={`/teams/${team.id}/players/${item.id}`}
                    variant="subtle"
                    size="compact-xs"
                  >
                    {item.name}
                  </Button>
                </Table.Td>
                <Table.Td ta="center">
                  {item.nationality && (
                    <PlayerFlag nationality={item.nationality} />
                  )}
                </Table.Td>
                <Table.Td ta="center">{item.pos}</Table.Td>
                {dataType === "ovr" ? (
                  <>
                    <Table.Td
                      ta="end"
                      c={statDiffColor(
                        "ovr",
                        item.total.ovr / (item.numSeasons || 1),
                      )}
                    >
                      {item.total.ovr > 0 ? "+" : null}
                      {item.total.ovr}
                    </Table.Td>
                    <Table.Td ta="end" c={ovrColor(item.start.ovr)}>
                      {item.start.ovr}
                    </Table.Td>
                    {seasons.map((season) => {
                      const stat = item.seasons[season]?.ovr;
                      return (
                        <Table.Td
                          key={season}
                          ta="end"
                          c={stat ? ovrColor(stat) : undefined}
                        >
                          {stat}
                        </Table.Td>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <Table.Td
                      ta="end"
                      c={statDiffColor(
                        "value",
                        item.total.value / item.start.value,
                      )}
                    >
                      {item.total.value > 0 ? "+" : null}
                      {abbrevValue(item.total.value, team.currency)}
                    </Table.Td>
                    <Table.Td ta="end" c={playerValueColor(item.start.value)}>
                      {abbrevValue(item.start.value, team.currency)}
                    </Table.Td>
                    {seasons.map((season) => {
                      const stat = item.seasons[season]?.value;
                      return (
                        <Table.Td
                          key={season}
                          ta="end"
                          c={stat ? playerValueColor(stat) : undefined}
                        >
                          {abbrevValue(stat, team.currency)}
                        </Table.Td>
                      );
                    })}
                  </>
                )}
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

const diffRanges = {
  ovr: [-2, 0, 2, 4, 6],
  value: [-25, 0, 25, 50, 100],
};

function statDiffColor(type: "ovr" | "value", diff: number | undefined) {
  if (!diff) {
    return undefined;
  } else if (diff > diffRanges[type][4]) {
    return "green.8";
  } else if (diff > diffRanges[type][3]) {
    return "green.6";
  } else if (diff > diffRanges[type][2]) {
    return "green.4";
  } else if (diff > diffRanges[type][1]) {
    return "green.2";
  } else if (diff > diffRanges[type][0]) {
    return "red.2";
  } else {
    return "red.4";
  }
}
